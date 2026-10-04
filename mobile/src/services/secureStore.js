import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ENV } from '../config/env.js';

/**
 * Secure Storage Manager
 * Uses native hardware-backed SecureStore (EncryptedSharedPreferences on Android / Keychain on iOS).
 * Falls back safely to AsyncStorage for web and unit testing environments.
 */
class StorageService {
  async isSecureStoreAvailable() {
    try {
      if (Platform.OS === 'web') return false;
      return await SecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  }

  async setItem(key, value) {
    try {
      const isSecure = await this.isSecureStoreAvailable();
      if (isSecure) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
      return true;
    } catch (error) {
      console.warn(`[StorageService] Failed to set item for key: ${key}`, error?.message);
      // Fallback attempt to AsyncStorage
      try {
        await AsyncStorage.setItem(key, value);
        return true;
      } catch (fallbackError) {
        console.error(`[StorageService] Critical storage failure for key: ${key}`, fallbackError);
        return false;
      }
    }
  }

  async getItem(key) {
    try {
      const isSecure = await this.isSecureStoreAvailable();
      if (isSecure) {
        const value = await SecureStore.getItemAsync(key);
        if (value !== null) return value;
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn(`[StorageService] Failed to get item for key: ${key}`, error?.message);
      try {
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    }
  }

  async removeItem(key) {
    try {
      const isSecure = await this.isSecureStoreAvailable();
      if (isSecure) {
        await SecureStore.deleteItemAsync(key);
      }
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`[StorageService] Failed to remove item for key: ${key}`, error?.message);
      try {
        await AsyncStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }
  }

  // Token Management
  async saveToken(token) {
    if (!token) return false;
    return await this.setItem(ENV.TOKEN_STORAGE_KEY, token);
  }

  async getToken() {
    return await this.getItem(ENV.TOKEN_STORAGE_KEY);
  }

  async removeToken() {
    return await this.removeItem(ENV.TOKEN_STORAGE_KEY);
  }

  // User Profile Management
  async saveUser(user) {
    if (!user) return false;
    return await this.setItem(ENV.USER_STORAGE_KEY, JSON.stringify(user));
  }

  async getUser() {
    const raw = await this.getItem(ENV.USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async removeUser() {
    return await this.removeItem(ENV.USER_STORAGE_KEY);
  }

  // Complete Session Cleanup
  async clearAuth() {
    await this.removeToken();
    await this.removeUser();
  }
}

export const secureStore = new StorageService();
export default secureStore;
