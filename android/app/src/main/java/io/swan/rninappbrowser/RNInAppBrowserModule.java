package io.swan.rninappbrowser;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

import androidx.annotation.ColorInt;
import androidx.annotation.NonNull;
import androidx.browser.customtabs.CustomTabColorSchemeParams;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.core.graphics.ColorUtils;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

import io.swan.rninappbrowser.helpers.CustomTabActivityHelper;

@ReactModule(name = RNInAppBrowserModule.NAME)
public class RNInAppBrowserModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  static final String NAME = "RNInAppBrowser";
  private boolean mInAppBrowserVisible = false;

  public RNInAppBrowserModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @Override
  public void onHostResume() {
    ReactApplicationContext reactContext = getReactApplicationContext();

    if (mInAppBrowserVisible && reactContext.hasActiveReactInstance()) {
      reactContext
        .getJSModule(RCTDeviceEventEmitter.class)
        .emit("inAppBrowserDidClose", null);
    }

    mInAppBrowserVisible = false;
  }

  @Override
  public void onHostPause() {}

  @Override
  public void onHostDestroy() {}

  @ReactMethod
  public void open(final String url, final ReadableMap options, final Promise promise) {
    if (mInAppBrowserVisible) {
      promise.reject("in_app_browser_visible",
        "An instance of the in-app browser is already visible");
    }

    final Activity activity = getCurrentActivity();

    if (activity == null) {
      promise.reject("no_current_activity",
        "Couldn't call open() when the app is in background");
      return;
    }

    mInAppBrowserVisible = true;

    CustomTabsIntent.Builder intentBuilder = new CustomTabsIntent.Builder();
    intentBuilder.setShowTitle(false);
    intentBuilder.setInstantAppsEnabled(false);

    intentBuilder.setStartAnimations(activity,
      com.facebook.react.R.anim.catalyst_slide_up, io.swan.id.R.anim.inert);
    intentBuilder.setExitAnimations(activity,
      io.swan.id.R.anim.inert, com.facebook.react.R.anim.catalyst_slide_down);

    @ColorInt int blackColor = activity.getResources().getColor(android.R.color.black);
    CustomTabColorSchemeParams.Builder paramsBuilder =new CustomTabColorSchemeParams.Builder();
    paramsBuilder.setNavigationBarColor(blackColor);

    if (options.hasKey("barTintColor")) {
      @ColorInt int barTintColor = options.getInt("barTintColor");

      paramsBuilder.setToolbarColor(barTintColor);
      paramsBuilder.setSecondaryToolbarColor(barTintColor);

      intentBuilder.setColorScheme(ColorUtils.calculateLuminance(barTintColor) > 0.5
        ? CustomTabsIntent.COLOR_SCHEME_LIGHT
        : CustomTabsIntent.COLOR_SCHEME_DARK);
    }

    intentBuilder.setDefaultColorSchemeParams(paramsBuilder.build());
    CustomTabsIntent customTabsIntent = intentBuilder.build();

    customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
    customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);

    CustomTabActivityHelper.openCustomTab(activity, customTabsIntent, Uri.parse(url),
      new CustomTabActivityHelper.CustomTabFallback() {
      @Override
      public void openUri(Activity activity, Uri uri) {
        activity.startActivity(new Intent(Intent.ACTION_VIEW, uri));
      }
    });

    promise.resolve(null);
  }

  @ReactMethod
  public void close() {
    // noop on Android since the modal is closed by deep-link
  }

  @ReactMethod
  public void addListener(String eventName) {
    // Set up any upstream listeners or background tasks as necessary
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    // Remove upstream listeners, stop unnecessary background tasks
  }
}
