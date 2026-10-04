import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import intelligenceService from '../../services/intelligenceService.js';

export const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const fetchTrends = createAsyncThunk(
  'intelligence/fetchTrends',
  async ({ range = '6m', referenceMonth = null } = {}, { rejectWithValue }) => {
    try {
      const response = await intelligenceService.getTrends(range, referenceMonth);
      return response;
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to load multi-month trends.'
      );
    }
  }
);

/**
 * Resilient async thunk to fetch complete banking intelligence data using Promise.allSettled.
 * Even if an individual endpoint fails, successfully loaded data is preserved.
 */
export const fetchIntelligenceData = createAsyncThunk(
  'intelligence/fetchData',
  async ({ month, isRefresh = false } = {}, { rejectWithValue }) => {
    try {
      const monthParam = month || getCurrentMonthKey();

      const [summaryRes, merchantsRes, anomaliesRes, forecastRes, subscriptionsRes, trendsRes] = await Promise.allSettled([
        intelligenceService.getSummary(monthParam),
        intelligenceService.getMerchants(monthParam),
        intelligenceService.getAnomalies(monthParam),
        intelligenceService.getForecast(monthParam),
        intelligenceService.getSubscriptions(),
        intelligenceService.getTrends('6m', monthParam)
      ]);

      const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : null;
      const merchants = merchantsRes.status === 'fulfilled' ? (Array.isArray(merchantsRes.value) ? merchantsRes.value : merchantsRes.value?.data || []) : [];
      const anomalies = anomaliesRes.status === 'fulfilled' ? (Array.isArray(anomaliesRes.value) ? anomaliesRes.value : anomaliesRes.value?.data || []) : [];
      const forecast = forecastRes.status === 'fulfilled' ? forecastRes.value : null;
      const subscriptions = subscriptionsRes.status === 'fulfilled' ? (subscriptionsRes.value?.subscriptions || []) : [];
      const subscriptionsSummary = subscriptionsRes.status === 'fulfilled' ? (subscriptionsRes.value?.summary || null) : null;
      const trends = trendsRes.status === 'fulfilled' ? trendsRes.value : null;

      const failedEndpoints = [
        summaryRes.status === 'rejected' ? 'summary' : null,
        merchantsRes.status === 'rejected' ? 'merchants' : null,
        anomaliesRes.status === 'rejected' ? 'anomalies' : null,
        forecastRes.status === 'rejected' ? 'forecast' : null,
        subscriptionsRes.status === 'rejected' ? 'subscriptions' : null,
        trendsRes.status === 'rejected' ? 'trends' : null
      ].filter(Boolean);

      // If all endpoints failed, reject with meaningful error
      if (failedEndpoints.length === 6) {
        const errorReason = summaryRes.reason?.message || 'Unable to connect to intelligence service.';
        return rejectWithValue(errorReason);
      }

      return {
        summary,
        merchants,
        anomalies,
        forecast,
        subscriptions,
        subscriptionsSummary,
        trends,
        period: monthParam,
        lastUpdated: new Date().toISOString(),
        hasPartialError: failedEndpoints.length > 0,
        errorMessage: failedEndpoints.length > 0 ? `Partial sync warning (${failedEndpoints.join(', ')})` : null
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to load banking intelligence. Please try again.'
      );
    }
  }
);

const initialState = {
  summary: null,
  merchants: [],
  anomalies: [],
  forecast: null,
  subscriptions: [],
  subscriptionsSummary: null,
  trends: null,
  trendsRange: '6m',
  period: getCurrentMonthKey(),
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null
};

export const intelligenceSlice = createSlice({
  name: 'intelligence',
  initialState,
  reducers: {
    setPeriod: (state, action) => {
      state.period = action.payload;
    },
    setSubscriptions: (state, action) => {
      state.subscriptions = action.payload.subscriptions || [];
      state.subscriptionsSummary = action.payload.summary || null;
    },
    setTrendsRange: (state, action) => {
      state.trendsRange = action.payload;
    },
    setFinancialTrends: (state, action) => {
      state.trends = action.payload;
    },
    clearIntelligenceError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIntelligenceData.pending, (state, action) => {
        if (action.meta.arg?.isRefresh) {
          state.isRefreshing = true;
        } else if (!state.lastUpdated) {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchIntelligenceData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        if (action.payload.summary) state.summary = action.payload.summary;
        if (action.payload.merchants) state.merchants = action.payload.merchants;
        if (action.payload.anomalies) state.anomalies = action.payload.anomalies;
        if (action.payload.forecast) state.forecast = action.payload.forecast;
        if (action.payload.subscriptions) state.subscriptions = action.payload.subscriptions;
        if (action.payload.subscriptionsSummary) state.subscriptionsSummary = action.payload.subscriptionsSummary;
        if (action.payload.trends) state.trends = action.payload.trends;
        state.period = action.payload.period;
        state.lastUpdated = action.payload.lastUpdated;
        state.error = action.payload.errorMessage || null;
      })
      .addCase(fetchIntelligenceData.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload;
      })
      .addCase(fetchTrends.fulfilled, (state, action) => {
        state.trends = action.payload;
        state.trendsRange = action.payload?.range || state.trendsRange;
      });
  }
});

export const {
  setPeriod,
  setSubscriptions,
  setTrendsRange,
  setFinancialTrends,
  clearIntelligenceError
} = intelligenceSlice.actions;
export default intelligenceSlice.reducer;
