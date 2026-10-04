/* eslint-env jest */
global.__DEV__ = true;

// Mock AsyncStorage
const mockAsyncStorage = (() => {
  let store = {};
  return {
    setItem: jest.fn(async (key, value) => {
      store[key] = String(value);
      return null;
    }),
    getItem: jest.fn(async (key) => {
      return store[key] !== undefined ? store[key] : null;
    }),
    removeItem: jest.fn(async (key) => {
      delete store[key];
      return null;
    }),
    clear: jest.fn(async () => {
      store = {};
      return null;
    }),
  };
})();

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock expo-secure-store
const mockSecureStore = (() => {
  let secureStoreMap = {};
  return {
    isAvailableAsync: jest.fn(async () => true),
    setItemAsync: jest.fn(async (key, value) => {
      secureStoreMap[key] = String(value);
      return null;
    }),
    getItemAsync: jest.fn(async (key) => {
      return secureStoreMap[key] !== undefined ? secureStoreMap[key] : null;
    }),
    deleteItemAsync: jest.fn(async (key) => {
      delete secureStoreMap[key];
      return null;
    }),
  };
})();

jest.mock('expo-secure-store', () => mockSecureStore);

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children, style }) => React.createElement('View', { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Mock react-native
jest.mock('react-native', () => {
  const listeners = {};
  return {
    Platform: {
      OS: 'android',
      select: jest.fn((objs) => (objs && (objs.android || objs.default)) || null),
    },
    StyleSheet: {
      create: (styles) => styles,
    },
    NativeModules: {
      FinTrackNotificationModule: {
        isPermissionGranted: jest.fn(async () => false),
        openNotificationSettings: jest.fn(async () => true),
        isServiceRunning: jest.fn(async () => false),
      },
    },
    DeviceEventEmitter: {
      addListener: jest.fn((event, callback) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
        return {
          remove: jest.fn(() => {
            listeners[event] = (listeners[event] || []).filter(cb => cb !== callback);
          }),
        };
      }),
      emit: jest.fn((event, data) => {
        if (listeners[event]) {
          listeners[event].forEach(cb => cb(data));
        }
      }),
    },
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    View: 'View',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    TextInput: 'TextInput',
    ScrollView: 'ScrollView',
    FlatList: 'FlatList',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    ActivityIndicator: 'ActivityIndicator',
    StatusBar: 'StatusBar',
    Modal: 'Modal',
    RefreshControl: 'RefreshControl',
    Alert: {
      alert: jest.fn(),
    },
    Animated: {
      Value: jest.fn(() => ({
        interpolate: jest.fn(),
        setValue: jest.fn(),
      })),
      timing: jest.fn(() => ({ start: jest.fn() })),
      sequence: jest.fn(() => ({ start: jest.fn() })),
      loop: jest.fn(() => ({ start: jest.fn() })),
    },
  };
});
