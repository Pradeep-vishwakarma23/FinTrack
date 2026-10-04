import { Platform } from 'react-native';

/**
 * FinTrack Mobile Environment Configuration
 * 
 * Android Emulator uses 10.0.2.2 to access host machine localhost.
 * iOS Simulator and Web use localhost / 127.0.0.1.
 * Physical devices should specify their local machine LAN IP (e.g., http://192.168.1.X:5000/api).
 */
const getDefaultApiUrl = () => {
  // Uses localhost:5000 (accessible on physical devices via `adb reverse tcp:5000 tcp:5000`, and on simulators/web)
  return 'http://localhost:5000/api';
};

export const ENV = {
  APP_NAME: 'FinTrack',
  APP_TAGLINE: 'AI-Powered Personal Finance Intelligence',
  VERSION: '1.0.0',
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl(),
  TOKEN_STORAGE_KEY: 'fintrack_jwt_token',
  USER_STORAGE_KEY: 'fintrack_user_profile',
  REQUEST_TIMEOUT_MS: 15000,
  COPILOT_REQUEST_TIMEOUT_MS: 60000,
  DEMO_MODE_ENABLED: true,
};

export default ENV;
