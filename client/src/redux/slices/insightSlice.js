import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as aiService from '../../services/aiService'
import intelligenceService from '../../services/intelligenceService'

const getError = (error) =>
  error.response?.data?.message || error.message || 'Something went wrong'

export const getCurrentMonthKey = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const fetchInsights = createAsyncThunk('insights/fetch', async (_, { rejectWithValue }) => {
  try {
    const response = await aiService.generateInsights()
    return response.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

export const fetchPrediction = createAsyncThunk('insights/predict', async (_, { rejectWithValue }) => {
  try {
    const response = await aiService.predictSpending()
    return response.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

export const fetchSubscriptions = createAsyncThunk(
  'insights/fetchSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await intelligenceService.getSubscriptions()
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

export const fetchFinancialTrends = createAsyncThunk(
  'insights/fetchFinancialTrends',
  async ({ range = '6m', referenceMonth = null } = {}, { rejectWithValue }) => {
    try {
      const response = await intelligenceService.getTrends(range, referenceMonth)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

/**
 * Resiliently fetches banking intelligence data using Promise.allSettled.
 * Preserves successfully loaded endpoints even if another fails.
 */
export const fetchBankingIntelligence = createAsyncThunk(
  'insights/fetchBankingIntelligence',
  async ({ month } = {}, { rejectWithValue }) => {
    try {
      const monthParam = month || getCurrentMonthKey()
      const [summaryRes, merchantsRes, anomaliesRes, forecastRes, subscriptionsRes, trendsRes] = await Promise.allSettled([
        intelligenceService.getSummary(monthParam),
        intelligenceService.getMerchants(monthParam),
        intelligenceService.getAnomalies(monthParam),
        intelligenceService.getForecast(monthParam),
        intelligenceService.getSubscriptions(),
        intelligenceService.getTrends('6m', monthParam)
      ])

      const summary = summaryRes.status === 'fulfilled' ? summaryRes.value?.data?.data || null : null
      const merchants = merchantsRes.status === 'fulfilled' ? merchantsRes.value?.data?.data || [] : []
      const anomalies = anomaliesRes.status === 'fulfilled' ? anomaliesRes.value?.data?.data || [] : []
      const forecast = forecastRes.status === 'fulfilled' ? forecastRes.value?.data?.data || null : null
      const subscriptions = subscriptionsRes.status === 'fulfilled' ? subscriptionsRes.value?.data?.subscriptions || [] : []
      const subscriptionsSummary = subscriptionsRes.status === 'fulfilled' ? subscriptionsRes.value?.data?.summary || null : null
      const trends = trendsRes.status === 'fulfilled' ? trendsRes.value?.data || null : null

      const errors = [summaryRes, merchantsRes, anomaliesRes, forecastRes, subscriptionsRes, trendsRes]
        .filter((r) => r.status === 'rejected')
        .map((r) => r.reason?.response?.data?.message || r.reason?.message || 'Partial sync failed')

      return {
        summary,
        merchants,
        anomalies,
        forecast,
        subscriptions,
        subscriptionsSummary,
        trends,
        period: monthParam,
        hasPartialError: errors.length > 0,
        errorMessage: errors.length > 0 ? errors.join('; ') : ''
      }
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

const initialState = {
  // Phase 6.1 Banking Intelligence State
  summary: null,
  merchants: [],
  anomalies: [],
  forecast: null,
  period: getCurrentMonthKey(),
  intelligenceLoading: false,
  intelligenceError: '',
  // Phase 7.3 Recurring Subscriptions State
  subscriptions: [],
  subscriptionsSummary: null,
  subscriptionsLoading: false,
  subscriptionsError: '',
  // Phase 7.4 Multi-Month Trends State
  trends: null,
  trendsRange: '6m',
  trendsLoading: false,
  trendsError: '',
  // Existing AI State
  insights: [],
  predictions: {},
  provider: 'heuristic',
  loading: false,
  error: ''
}

const insightSlice = createSlice({
  name: 'insights',
  initialState,
  reducers: {
    setPeriod: (state, action) => {
      state.period = action.payload
    },
    setInsights: (state, action) => {
      state.insights = action.payload
    },
    setPredictions: (state, action) => {
      state.predictions = action.payload
    },
    setSubscriptions: (state, action) => {
      state.subscriptions = action.payload.subscriptions || []
      state.subscriptionsSummary = action.payload.summary || null
    },
    setTrendsRange: (state, action) => {
      state.trendsRange = action.payload
    },
    setFinancialTrends: (state, action) => {
      state.trends = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    clearInsightError: (state) => {
      state.error = ''
      state.intelligenceError = ''
      state.subscriptionsError = ''
      state.trendsError = ''
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchInsights
      .addCase(fetchInsights.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchInsights.fulfilled, (state, action) => {
        state.loading = false
        state.insights = action.payload.insights || action.payload.data?.insights || []
        state.provider = action.payload.provider || action.payload.data?.provider || 'heuristic'
        state.error = ''
      })
      .addCase(fetchInsights.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // fetchPrediction
      .addCase(fetchPrediction.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchPrediction.fulfilled, (state, action) => {
        state.loading = false
        state.predictions = action.payload.prediction || action.payload.data || action.payload || {}
        state.error = ''
      })
      .addCase(fetchPrediction.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // fetchSubscriptions
      .addCase(fetchSubscriptions.pending, (state) => {
        state.subscriptionsLoading = true
        state.subscriptionsError = ''
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.subscriptionsLoading = false
        state.subscriptions = action.payload.subscriptions || []
        state.subscriptionsSummary = action.payload.summary || null
        state.subscriptionsError = ''
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.subscriptionsLoading = false
        state.subscriptionsError = action.payload
      })
      // fetchFinancialTrends
      .addCase(fetchFinancialTrends.pending, (state) => {
        state.trendsLoading = true
        state.trendsError = ''
      })
      .addCase(fetchFinancialTrends.fulfilled, (state, action) => {
        state.trendsLoading = false
        state.trends = action.payload
        state.trendsRange = action.payload.range || state.trendsRange
        state.trendsError = ''
      })
      .addCase(fetchFinancialTrends.rejected, (state, action) => {
        state.trendsLoading = false
        state.trendsError = action.payload
      })
      // fetchBankingIntelligence
      .addCase(fetchBankingIntelligence.pending, (state) => {
        state.intelligenceLoading = true
        state.intelligenceError = ''
      })
      .addCase(fetchBankingIntelligence.fulfilled, (state, action) => {
        state.intelligenceLoading = false
        if (action.payload.summary) state.summary = action.payload.summary
        if (action.payload.merchants) state.merchants = action.payload.merchants
        if (action.payload.anomalies) state.anomalies = action.payload.anomalies
        if (action.payload.forecast) state.forecast = action.payload.forecast
        if (action.payload.subscriptions) state.subscriptions = action.payload.subscriptions
        if (action.payload.subscriptionsSummary) state.subscriptionsSummary = action.payload.subscriptionsSummary
        if (action.payload.trends) state.trends = action.payload.trends
        state.period = action.payload.period
        if (action.payload.hasPartialError && !state.summary && !state.forecast) {
          state.intelligenceError = action.payload.errorMessage
        } else {
          state.intelligenceError = ''
        }
      })
      .addCase(fetchBankingIntelligence.rejected, (state, action) => {
        state.intelligenceLoading = false
        state.intelligenceError = action.payload
      })
  }
})

export const {
  setPeriod,
  setInsights,
  setPredictions,
  setSubscriptions,
  setTrendsRange,
  setFinancialTrends,
  setLoading,
  clearInsightError
} = insightSlice.actions
export default insightSlice.reducer