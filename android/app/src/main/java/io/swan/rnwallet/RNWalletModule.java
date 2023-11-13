package io.swan.rnwallet;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.util.Base64;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.google.android.gms.tapandpay.TapAndPay;
import com.google.android.gms.tapandpay.TapAndPayClient;
import com.google.android.gms.tapandpay.issuer.PushTokenizeRequest;
import com.google.android.gms.tapandpay.issuer.TokenInfo;
import com.google.android.gms.tapandpay.issuer.ViewTokenRequest;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

@ReactModule(name = RNWalletModule.NAME)
public class RNWalletModule extends ReactContextBaseJavaModule implements ActivityEventListener {

  public static final String NAME = "RNWallet";
  private final int REQUEST_CODE_PUSH_TOKENIZE = 42632;

  @NonNull
  private final TapAndPayClient tapAndPayClient;
  @Nullable
  private Promise mPromise = null;

  public RNWalletModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addActivityEventListener(this);
    tapAndPayClient = TapAndPay.getClient(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onNewIntent(Intent intent) {}

  public Object base64ToJsonHex(@Nullable String base64) {
    if (base64 == null) {
      return JSONObject.NULL;
    }

    byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
    StringBuilder hex = new StringBuilder();

    for (byte aByte : bytes) {
      hex.append(String.format("%02x", aByte));
    }

    return hex.toString();
  }

  @ReactMethod
  public void getCards(final Promise promise) {
    tapAndPayClient
      .listTokens()
      .addOnCompleteListener(new OnCompleteListener<List<TokenInfo>>() {

        @Override
        public void onComplete(@NonNull Task<List<TokenInfo>> task) {
          if (task.isSuccessful()) {
            final WritableArray cards = Arguments.createArray();

            for (TokenInfo token : task.getResult()) {
              final WritableMap card = Arguments.createMap();

              card.putString("FPANSuffix", token.getFpanLastFour());
              card.putString("passURLOrToken", token.getIssuerTokenId());
              card.putBoolean("canBeAdded", false); // card already in wallet

              cards.pushMap(card);
            }

            promise.resolve(cards);
          } else {
            @Nullable Exception exception = task.getException();

            promise.reject("GET_CARDS_ERROR",
              exception != null ? exception.getMessage() : "Unknown error");
          }
        }
      });
  }

  @ReactMethod
  public void getSignatureData(final ReadableMap data, final Promise promise) {
    promise.resolve(null); // Not needed on Android, only for API parity
  }

  @ReactMethod
  public void addCard(final ReadableMap data, final Promise promise) {
    @Nullable String cardHolderName = data.getString("cardHolderName");
    @Nullable String cardSuffix = data.getString("cardSuffix");

    if (cardHolderName == null || cardSuffix == null) {
      promise.reject("ADD_CARD_ERROR", "Input is not correctly formatted");
      return;
    }

    @Nullable Activity activity = getCurrentActivity();

    if (activity == null) {
      promise.reject("ADD_CARD_ERROR", "Could not get current activity");
      return;
    }

    @Nullable String activationData = data.getString("encryptedData");
    @Nullable String encryptedData = data.getString("encryptedData");
    @Nullable String iv = data.getString("iv");
    @Nullable String publicKeyFingerprint = data.getString("publicKeyFingerprint");
    @Nullable String ephemeralPublicKey = data.getString("ephemeralPublicKey");
    @Nullable String oaepHashingAlgorithm = data.getString("oaepHashingAlgorithm");

    JSONObject opcJson = new JSONObject();

    try {
      JSONObject info = new JSONObject();

      info.put("encryptedData", base64ToJsonHex(encryptedData));
      info.put("iv", base64ToJsonHex(iv));
      info.put("publicKeyFingerprint", base64ToJsonHex(publicKeyFingerprint));
      info.put("encryptedKey", base64ToJsonHex(ephemeralPublicKey));
      info.put("oaepHashingAlgorithm",
        oaepHashingAlgorithm != null && oaepHashingAlgorithm.contains("SHA256") ? "SHA256" : "SHA512");

      opcJson.put("cardInfo", info);
      opcJson.put("tokenizationAuthenticationValue",
        activationData != null ? activationData : JSONObject.NULL);
    } catch (JSONException ignored) {
    }

    byte[] opc = Base64.encode(opcJson.toString().getBytes(), Base64.DEFAULT);

    PushTokenizeRequest request = new PushTokenizeRequest.Builder()
      .setOpaquePaymentCard(opc)
      .setNetwork(TapAndPay.CARD_NETWORK_MASTERCARD)
      .setTokenServiceProvider(TapAndPay.TOKEN_PROVIDER_MASTERCARD)
      .setDisplayName("Swan card")
      .setLastDigits(cardSuffix)
      .build();

    mPromise = promise;
    tapAndPayClient.pushTokenize(activity, request, REQUEST_CODE_PUSH_TOKENIZE);
  }

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, @Nullable Intent intent) {
    if (requestCode != REQUEST_CODE_PUSH_TOKENIZE || mPromise == null) {
      return;
    }

    switch (resultCode) {
      case Activity.RESULT_OK:
        mPromise.resolve(true);
        break;
      case Activity.RESULT_CANCELED:
        mPromise.resolve(false);
        break;
      default:
        mPromise.reject("ADD_CARD_ERROR", "Could not provision card");
    }

    // Remove promise so it cannot be reused
    mPromise = null;
  }

  @ReactMethod
  public void showCard(final String token, final Promise promise) {
    ViewTokenRequest request = new ViewTokenRequest.Builder()
      .setIssuerTokenId(token)
      .setTokenServiceProvider(TapAndPay.TOKEN_PROVIDER_MASTERCARD)
      .build();

    tapAndPayClient
      .viewToken(request)
      .addOnCompleteListener(new OnCompleteListener<PendingIntent>() {

        @Override
        public void onComplete(@NonNull Task<PendingIntent> task) {
          if (task.isSuccessful()) {
            try {
              task.getResult().send();
              promise.resolve(null);
            } catch (PendingIntent.CanceledException exception) {
              promise.reject("OPEN_CARD_IN_WALLET_ERROR", exception.getMessage());
            }
          } else {
            @Nullable Exception exception = task.getException();

            promise.reject("OPEN_CARD_IN_WALLET_ERROR",
              exception != null ? exception.getMessage() : "Unknown error");
          }
        }
      });
  }
}
