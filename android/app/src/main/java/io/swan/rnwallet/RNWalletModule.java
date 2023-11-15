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

  private void keepPromisePending(final Promise promise) {
    if (mPromise != null) {
      mPromise.reject("wallet_error", "Promise aborted by incoming new operation");
    }
    mPromise = promise;
  }

  private void resolvePendingPromise(final Object data) {
    if (mPromise != null) {
      mPromise.resolve(data);
      mPromise = null;
    }
  }

  private void rejectPendingPromise(final String message) {
    if (mPromise != null) {
      mPromise.reject("wallet_error", message);
      mPromise = null;
    }
  }

  private String base64ToHex(@NonNull String base64) {
    byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
    StringBuilder builder = new StringBuilder();

    for (byte b : bytes) {
      String hex = Integer.toHexString(b & 0xff);

      if (hex.length() % 2 == 1) {
        hex = "0" + hex;
      }

      builder.append(hex);
    }

    return builder.toString();
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

              card.putString("lastFourDigits", token.getFpanLastFour());
              card.putString("passURLOrToken", token.getIssuerTokenId());
              card.putBoolean("canBeAdded", false); // card already in wallet

              cards.pushMap(card);
            }

            promise.resolve(cards);
          } else {
            @Nullable Exception exception = task.getException();

            promise.reject("wallet_error",
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
    @Nullable String lastFourDigits = data.getString("lastFourDigits");

    @Nullable String activationData = data.getString("activationData");
    @Nullable String encryptedData = data.getString("encryptedData");
    @Nullable String ephemeralPublicKey = data.getString("ephemeralPublicKey");

    @Nullable String iv = data.getString("iv");
    @Nullable String oaepHashingAlgorithm = data.getString("oaepHashingAlgorithm");
    @Nullable String publicKeyFingerprint = data.getString("publicKeyFingerprint");

    if (lastFourDigits == null
      || activationData == null
      || encryptedData == null
      || ephemeralPublicKey == null
    ) {
      promise.reject("wallet_error", "Input is not correctly formatted");
      return;
    }

    @Nullable Activity activity = getCurrentActivity();

    if (activity == null) {
      promise.reject("wallet_error", "Could not get current activity");
      return;
    }

    JSONObject opcJson = new JSONObject();
    JSONObject cardInfo = new JSONObject();

    try {
      cardInfo.put("encryptedData", base64ToHex(encryptedData));

      if (iv != null) {
        cardInfo.put("iv", base64ToHex(iv));
      }
      if (publicKeyFingerprint != null) {
        cardInfo.put("publicKeyFingerprint", base64ToHex(publicKeyFingerprint));
      }

      cardInfo.put("encryptedKey", base64ToHex(ephemeralPublicKey));
      cardInfo.put("oaepHashingAlgorithm",
        oaepHashingAlgorithm != null && oaepHashingAlgorithm.contains("SHA256") ? "SHA256" : "SHA512");

      opcJson.put("cardInfo", cardInfo);
      opcJson.put("tokenizationAuthenticationValue", activationData);
    } catch (JSONException exception) {
      promise.reject("wallet_error", exception.getMessage());
      return;
    }

    String opc = Base64.encodeToString(opcJson.toString().getBytes(), Base64.DEFAULT)
      .replace("\n", "");

    PushTokenizeRequest request = new PushTokenizeRequest.Builder()
      .setOpaquePaymentCard(opc.getBytes())
      .setNetwork(TapAndPay.CARD_NETWORK_MASTERCARD)
      .setTokenServiceProvider(TapAndPay.TOKEN_PROVIDER_MASTERCARD)
      .setDisplayName("Swan card")
      .setLastDigits(lastFourDigits)
      .build();

    keepPromisePending(promise);
    tapAndPayClient.pushTokenize(activity, request, REQUEST_CODE_PUSH_TOKENIZE);
  }

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, @Nullable Intent intent) {
    if (requestCode == REQUEST_CODE_PUSH_TOKENIZE) {
      boolean success = resultCode == Activity.RESULT_OK;

      if (success || resultCode == Activity.RESULT_CANCELED) {
        resolvePendingPromise(success);
      } else {
        rejectPendingPromise("Could not provision card");
      }
    }
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
              promise.reject("wallet_error", exception.getMessage());
            }
          } else {
            @Nullable Exception exception = task.getException();

            promise.reject("wallet_error",
              exception != null ? exception.getMessage() : "Unknown error");
          }
        }
      });
  }
}
