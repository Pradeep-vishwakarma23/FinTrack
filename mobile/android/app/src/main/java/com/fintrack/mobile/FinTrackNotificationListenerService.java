package com.fintrack.mobile;

import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.app.Notification;
import android.util.Log;

import java.util.regex.Pattern;
import java.util.regex.Matcher;

/**
 * FinTrack Android NotificationListenerService
 * Listens for authorized push notifications, filters financial transactions on-device,
 * redacts all OTP/PIN/CVV/secret content, and forwards normalized events to the React Native layer.
 */
public class FinTrackNotificationListenerService extends NotificationListenerService {
    private static final String TAG = "FinTrackNotificationListenerService";

    // Known financial & UPI packages in India / Global
    private static final String[] FINANCIAL_PACKAGES = {
        "com.google.android.apps.nbu.paisa.user", // Google Pay
        "net.one97.paytm",                        // Paytm
        "com.phonepe.app",                        // PhonePe
        "in.org.npci.upiapp",                     // BHIM
        "com.sbi.upi",                            // SBI Yono / UPI
        "com.hdfc.bank",                          // HDFC Bank
        "com.icici.bank",                         // ICICI Bank
        "com.axis.bank",                          // Axis Bank
        "com.kotak.bank",                         // Kotak 811
        "com.cred.android"                        // CRED
    };

    // Sensitive security regex to reject on-device (Zero-OTP retention)
    private static final Pattern SENSITIVE_PATTERN = Pattern.compile(
        "\\b(otp|one time password|verification code|pin|cvv|password|security code)\\b",
        Pattern.CASE_INSENSITIVE
    );

    // Transaction verbs
    private static final Pattern TRANSACTION_PATTERN = Pattern.compile(
        "\\b(debited|spent|paid|withdrawn|credited|received|refund|transfer|INR|Rs|₹)\\b",
        Pattern.CASE_INSENSITIVE
    );

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        Log.d(TAG, "Notification listener connected successfully");
    }

    @Override
    public void onListenerDisconnected() {
        super.onListenerDisconnected();
        Log.d(TAG, "Notification listener disconnected");
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) {
            Log.d(TAG, "onNotificationPosted: sbn is null");
            return;
        }

        String packageName = sbn.getPackageName();
        Log.d(TAG, "onNotificationPosted: received notification from package: " + packageName);

        if (sbn.getNotification() == null) {
            Log.d(TAG, "onNotificationPosted: sbn.getNotification() is null for package: " + packageName);
            return;
        }

        Notification notification = sbn.getNotification();
        Bundle extras = notification.extras;

        if (extras == null) {
            Log.d(TAG, "onNotificationPosted: extras is null for package: " + packageName);
            return;
        }

        CharSequence titleChar = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textChar = extras.getCharSequence(Notification.EXTRA_TEXT);
        CharSequence subTextChar = extras.getCharSequence(Notification.EXTRA_SUB_TEXT);

        String title = titleChar != null ? titleChar.toString() : "";
        String text = textChar != null ? textChar.toString() : "";
        String subText = subTextChar != null ? subTextChar.toString() : "";
        String fullContent = title + " " + text + " " + subText;

        // 1. Check for sensitive authentication tokens - DISCARD IMMEDIATELY
        if (SENSITIVE_PATTERN.matcher(fullContent).find()) {
            Log.d(TAG, "Discarding sensitive OTP / authentication notification locally from: " + packageName);
            return;
        }

        // 2. Local Financial Filter Check
        boolean isKnownFinancialApp = false;
        for (String pkg : FINANCIAL_PACKAGES) {
            if (pkg.equalsIgnoreCase(packageName)) {
                isKnownFinancialApp = true;
                break;
            }
        }

        boolean hasTransactionVerb = TRANSACTION_PATTERN.matcher(fullContent).find();

        if (!isKnownFinancialApp && !hasTransactionVerb) {
            Log.d(TAG, "Discarding non-financial notification from: " + packageName);
            return;
        }

        Log.d(TAG, "Forwarding financial notification event to React Native from: " + packageName);

        // 3. Emit sanitized event to React Native bridge module
        FinTrackNotificationModule.sendEventToReactNative(
            packageName,
            title,
            text,
            sbn.getPostTime()
        );
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        String packageName = sbn != null ? sbn.getPackageName() : "unknown";
        Log.d(TAG, "onNotificationRemoved: notification removed from package: " + packageName);
    }
}
