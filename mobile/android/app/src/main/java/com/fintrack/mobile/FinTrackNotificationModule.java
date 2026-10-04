package com.fintrack.mobile;

import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.Set;

/**
 * React Native Module exposing permission state, settings navigation, and event listeners.
 */
public class FinTrackNotificationModule extends ReactContextBaseJavaModule {
    public static final String MODULE_NAME = "FinTrackNotificationModule";
    public static final String EVENT_NOTIFICATION = "onFinancialNotificationDetected";

    private static ReactApplicationContext reactContextInstance;

    public FinTrackNotificationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContextInstance = reactContext;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Checks if Android Notification Listener permission is granted
     */
    @ReactMethod
    public void isPermissionGranted(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            Set<String> packageNames = NotificationManagerCompat.getEnabledListenerPackages(context);
            boolean isGranted = packageNames.contains(context.getPackageName());
            promise.resolve(isGranted);
        } catch (Exception e) {
            promise.reject("PERMISSION_CHECK_ERROR", e.getMessage());
        }
    }

    /**
     * Opens Android System Notification Listener Settings
     */
    @ReactMethod
    public void openNotificationSettings(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SETTINGS_INTENT_ERROR", e.getMessage());
        }
    }

    /**
     * Returns whether the notification detection service is active
     */
    @ReactMethod
    public void isServiceRunning(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            Set<String> packageNames = NotificationManagerCompat.getEnabledListenerPackages(context);
            promise.resolve(packageNames.contains(context.getPackageName()));
        } catch (Exception e) {
            promise.reject("STATUS_ERROR", e.getMessage());
        }
    }

    /**
     * Helper to send notification events to React Native JavaScript layer
     */
    public static void sendEventToReactNative(String packageName, String title, String text, long postTime) {
        if (reactContextInstance == null || !reactContextInstance.hasActiveReactInstance()) {
            return;
        }

        WritableMap params = Arguments.createMap();
        params.putString("packageName", packageName);
        params.putString("title", title);
        params.putString("text", text);
        params.putDouble("postTime", (double) postTime);

        reactContextInstance
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(EVENT_NOTIFICATION, params);
    }
}
