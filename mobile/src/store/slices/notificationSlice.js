import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationListenerService from '../../services/notificationListenerService.js';
import { filterAndNormalizeNotification } from '../../services/notificationFilter.js';
import { fetchDashboardData } from './dashboardSlice.js';
import { fetchStagedTransactions } from './importSlice.js';

// 1. Check native notification permission status
export const checkNotificationPermission = createAsyncThunk(
  'notifications/checkPermission',
  async (_, { rejectWithValue }) => {
    try {
      const granted = await notificationListenerService.isPermissionGranted();
      return { isGranted: granted };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to check notification permission');
    }
  }
);

// 2. Fetch notification ingestion statistics from backend
export const fetchNotificationStats = createAsyncThunk(
  'notifications/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationListenerService.getNotificationStats();
      return response.stats || {};
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch notification stats');
    }
  }
);

// 3. Process and ingest a financial notification event
export const ingestNotificationEvent = createAsyncThunk(
  'notifications/ingestEvent',
  async (eventPayload, { dispatch, rejectWithValue }) => {
    try {
      let normalized = eventPayload;
      if (!eventPayload.sanitized) {
        normalized = filterAndNormalizeNotification(eventPayload);
        if (!normalized.isValid) {
          return { isValid: false, reason: normalized.reason };
        }
      }

      const response = await notificationListenerService.submitFinancialEvent(normalized);
      console.log('[notificationSlice] submitFinancialEvent HTTP response received:', response);

      // Synchronize dashboard staged counter and staging queue
      dispatch(fetchDashboardData({ isRefresh: true }));
      dispatch(fetchStagedTransactions('all'));
      dispatch(fetchNotificationStats());

      return {
        isValid: true,
        response,
        event: normalized,
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to ingest notification event');
    }
  }
);

// 4. Toggle notification monitoring
export const toggleNotificationService = createAsyncThunk(
  'notifications/toggleService',
  async (enable, { dispatch, rejectWithValue }) => {
    try {
      if (enable) {
        const granted = await notificationListenerService.isPermissionGranted();
        if (!granted) {
          return { enabled: false, requirePermission: true };
        }
        return { enabled: true, requirePermission: false };
      }
      return { enabled: false, requirePermission: false };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to toggle notification service');
    }
  }
);

const initialState = {
  isConnected: false,
  isPermissionGranted: false,
  isEnabled: false,
  isListening: false,
  isLoading: false,
  stats: {
    totalEvents: 0,
    stagedCount: 0,
    confirmedCount: 0,
    ignoredCount: 0,
    duplicatesCount: 0,
    lastDetectedAt: null,
  },
  recentEvents: [],
  isPermissionModalOpen: false,
  error: null,
};

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    openPermissionModal: (state) => {
      state.isPermissionModalOpen = true;
    },
    closePermissionModal: (state) => {
      state.isPermissionModalOpen = false;
    },
    setConnectedState: (state, action) => {
      state.isConnected = action.payload;
    },
    clearNotificationError: (state) => {
      state.error = null;
    },
    addLocalDetectedEvent: (state, action) => {
      state.recentEvents.unshift(action.payload);
      if (state.recentEvents.length > 20) {
        state.recentEvents.pop();
      }
      state.stats.totalEvents += 1;
      state.stats.lastDetectedAt = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Permission
      .addCase(checkNotificationPermission.fulfilled, (state, action) => {
        state.isPermissionGranted = action.payload.isGranted;
        state.isConnected = action.payload.isGranted && state.isEnabled;
      })

      // Fetch Stats
      .addCase(fetchNotificationStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotificationStats.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log('[notificationSlice] fetchNotificationStats.fulfilled payload from backend:', action.payload);
        state.stats = {
          ...state.stats,
          ...action.payload,
        };
      })
      .addCase(fetchNotificationStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Ingest Event
      .addCase(ingestNotificationEvent.fulfilled, (state, action) => {
        if (action.payload.isValid && action.payload.event) {
          state.recentEvents.unshift(action.payload.event);
          if (state.recentEvents.length > 20) {
            state.recentEvents.pop();
          }
          state.stats.totalEvents += 1;
          state.stats.stagedCount += 1;
          if (action.payload.response?.isDuplicate) {
            state.stats.duplicatesCount += 1;
            console.log('[notificationSlice] Redux incremented duplicatesCount ->', state.stats.duplicatesCount);
          } else {
            console.log('[notificationSlice] Redux received non-duplicate event');
          }
          state.stats.lastDetectedAt = new Date().toISOString();
        }
      })

      // Toggle Service
      .addCase(toggleNotificationService.fulfilled, (state, action) => {
        state.isEnabled = action.payload.enabled;
        state.isConnected = action.payload.enabled;
        if (action.payload.requirePermission) {
          state.isPermissionModalOpen = true;
        }
      });
  },
});

export const {
  openPermissionModal,
  closePermissionModal,
  setConnectedState,
  clearNotificationError,
  addLocalDetectedEvent,
} = notificationSlice.actions;

export default notificationSlice.reducer;
