import { NativeModules, DeviceEventEmitter, Platform } from 'react-native';
import api from './api.js';
import { filterAndNormalizeNotification } from './notificationFilter.js';

const FinTrackNotificationModule = NativeModules?.FinTrackNotificationModule || null;

let eventSubscription = null;
let isMockEnabled = false;

/**
 * Checks if Android Notification Listener permission is granted
 */
export const isPermissionGranted = async () => {
  if (isMockEnabled !== undefined && isMockEnabled !== null && isMockEnabled === true) {
    return true;
  }
  if (Platform.OS === 'android' && FinTrackNotificationModule?.isPermissionGranted) {
    try {
      const granted = await FinTrackNotificationModule.isPermissionGranted();
      if (granted) return true;
    } catch (err) {
      console.warn('[NotificationService] isPermissionGranted error:', err);
    }
  }

  // Fallback for tests / non-Android platforms / mock mode
  return Boolean(isMockEnabled);
};

/**
 * Opens Android system settings for granting Notification Listener permission
 */
export const openNotificationSettings = async () => {
  if (Platform.OS === 'android' && FinTrackNotificationModule?.openNotificationSettings) {
    try {
      return await FinTrackNotificationModule.openNotificationSettings();
    } catch (err) {
      console.warn('[NotificationService] openNotificationSettings error:', err);
      return false;
    }
  }

  // In test / simulator mode, toggle mock enabled state
  isMockEnabled = true;
  return true;
};

/**
 * Checks if the notification detection service is actively running
 */
export const isServiceRunning = async () => {
  if (Platform.OS === 'android' && FinTrackNotificationModule?.isServiceRunning) {
    try {
      return await FinTrackNotificationModule.isServiceRunning();
    } catch (err) {
      return false;
    }
  }
  return isMockEnabled;
};

/**
 * Submits a sanitized financial notification event to the backend staging pipeline
 * @param {Object} eventPayload - Normalized event object
 */
export const submitFinancialEvent = async (eventPayload) => {
  return api.post('/mobile/events', eventPayload);
};

/**
 * Fetches user's notification ingestion statistics from backend
 */
export const getNotificationStats = async () => {
  return api.get('/mobile/events/stats');
};

/**
 * Subscribes to native Android notification events and coordinates on-device filtering
 * @param {Function} onEventReceived - Callback invoked when a valid financial event is detected
 */
export const startListening = (onEventReceived) => {
  stopListening();

  console.log('[NotificationService] Registering native onFinancialNotificationDetected listener');
  eventSubscription = DeviceEventEmitter.addListener(
    'onFinancialNotificationDetected',
    async (rawNotification) => {
      try {
        console.log('[NotificationService] Intercepted raw notification from package:', rawNotification?.packageName);
        const normalized = filterAndNormalizeNotification(rawNotification);

        if (normalized.isValid) {
          console.log('[NotificationService] Notification accepted as financial transaction:', normalized.title, normalized.amount);
          if (typeof onEventReceived === 'function') {
            onEventReceived(normalized);
          }
        } else {
          console.log('[NotificationService] Notification discarded by local filter:', normalized.reason);
        }
      } catch (err) {
        console.warn('[NotificationService] Error filtering notification event:', err);
      }
    }
  );

  return true;
};

/**
 * Unsubscribes from notification events
 */
export const stopListening = () => {
  if (eventSubscription) {
    eventSubscription.remove();
    eventSubscription = null;
  }
};

/**
 * Helper to set mock permission state during testing or simulation
 */
export const setMockPermission = (granted) => {
  isMockEnabled = Boolean(granted);
};

export default {
  isPermissionGranted,
  openNotificationSettings,
  isServiceRunning,
  submitFinancialEvent,
  getNotificationStats,
  startListening,
  stopListening,
  setMockPermission,
};
