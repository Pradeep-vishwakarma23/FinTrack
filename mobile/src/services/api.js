import axios from 'axios';
import { ENV } from '../config/env.js';
import secureStore from './secureStore.js';

// Base Axios instance
export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Dynamic Base URL updater (useful for testing against different emulator / physical device IPs)
export const setApiBaseUrl = (newUrl) => {
  if (newUrl && typeof newUrl === 'string') {
    api.defaults.baseURL = newUrl;
  }
};

export const getApiBaseUrl = () => {
  return api.defaults.baseURL;
};

// Callback for global auth expiration (e.g. Redux logout trigger)
let onUnauthorizedCallback = null;

export const setOnUnauthorizedCallback = (callback) => {
  onUnauthorizedCallback = callback;
};

// Request Interceptor: Attach JWT Bearer token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await secureStore.getToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('[API Request Interceptor] Failed to read token from secureStore:', err?.message);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format errors and handle 401s
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    // Network connectivity / timeout / server unavailable error
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout');
      const isCopilot = error.config?.url?.includes('/copilot') || error.config?.isCopilot;

      let errorMessage = 'Unable to connect to FinTrack server. Please check your network connection or server status.';
      if (isTimeout) {
        errorMessage = isCopilot
          ? 'Copilot is taking longer than expected. Please try again.'
          : 'Request timed out. Please check your network connection or server status.';
      }

      const networkError = {
        success: false,
        message: errorMessage,
        isNetworkError: !isTimeout,
        isTimeout,
        statusCode: 0
      };
      return Promise.reject(networkError);
    }

    const { status, data } = error.response;

    // Unauthorized / Token expired
    if (status === 401) {
      // Clear expired credentials
      await secureStore.clearAuth();
      if (typeof onUnauthorizedCallback === 'function') {
        onUnauthorizedCallback();
      }
    }

    const formattedError = {
      success: false,
      message: data?.message || data?.error || `Request failed with status ${status}`,
      statusCode: status,
      data: data || null
    };

    return Promise.reject(formattedError);
  }
);

export default api;
