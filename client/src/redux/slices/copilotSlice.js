import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import copilotService from '../../services/copilotService'
import { getCurrentMonthKey } from './insightSlice'

const getError = (error) =>
  error.response?.data?.message || error.message || 'Something went wrong'

/**
 * Sends a message in the active Copilot conversation.
 * Automatically handles sessionId retention across conversational turns.
 */
export const sendCopilotMessage = createAsyncThunk(
  'copilot/sendMessage',
  async ({ message, month }, { getState, rejectWithValue }) => {
    try {
      const state = getState().copilot
      const activeMonth = month || state.month || getCurrentMonthKey()
      const sessionId = state.activeSessionId || null

      const response = await copilotService.chat({
        sessionId,
        month: activeMonth,
        message
      })

      return {
        ...response,
        userMessage: message
      }
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

/**
 * Fetches all past Copilot sessions for the authenticated user.
 */
export const fetchCopilotSessions = createAsyncThunk(
  'copilot/fetchSessions',
  async (limit = 20, { rejectWithValue }) => {
    try {
      const response = await copilotService.getSessions(limit)
      return response.data || []
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

/**
 * Deletes a Copilot session.
 */
export const deleteCopilotSession = createAsyncThunk(
  'copilot/deleteSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      await copilotService.deleteSession(sessionId)
      return sessionId
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

/**
 * Requests an authoritative explanation for a specific financial metric.
 */
export const requestMetricExplanation = createAsyncThunk(
  'copilot/requestExplanation',
  async ({ contextType, month, itemData }, { getState, rejectWithValue }) => {
    try {
      const state = getState().copilot
      const activeMonth = month || state.month || getCurrentMonthKey()

      const response = await copilotService.explain({
        month: activeMonth,
        contextType,
        itemData: itemData || {}
      })

      return {
        ...response,
        contextType
      }
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

/**
 * Fetches deterministic proactive insights for the specified month.
 */
export const fetchProactiveInsights = createAsyncThunk(
  'copilot/fetchProactiveInsights',
  async (month, { getState, rejectWithValue }) => {
    try {
      const state = getState().copilot
      const targetMonth = month || state.month || getCurrentMonthKey()

      const response = await copilotService.getProactiveInsights(targetMonth)
      return {
        period: response.period || targetMonth,
        insights: response.data || []
      }
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

const initialState = {
  // Conversational State
  activeSessionId: null,
  month: getCurrentMonthKey(),
  messages: [],
  loading: false,
  error: '',
  provider: 'gemini',
  isDrawerOpen: false,

  // Sessions State
  sessions: [],
  sessionsLoading: false,
  sessionsError: '',

  // Explain-This State
  explanation: null,
  explanationContextType: null,
  explanationLoading: false,
  explanationError: '',
  isExplainModalOpen: false,

  // Proactive Insights State
  proactiveInsights: [],
  insightsLoading: false,
  insightsError: ''
}

const copilotSlice = createSlice({
  name: 'copilot',
  initialState,
  reducers: {
    setCopilotMonth: (state, action) => {
      if (state.month !== action.payload) {
        state.month = action.payload
        state.activeSessionId = null
        state.messages = []
        state.suggestedFollowUps = []
      }
    },
    openCopilotDrawer: (state) => {
      state.isDrawerOpen = true
    },
    closeCopilotDrawer: (state) => {
      state.isDrawerOpen = false
    },
    toggleCopilotDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen
    },
    startNewConversation: (state) => {
      state.activeSessionId = null
      state.messages = []
      state.suggestedFollowUps = []
      state.error = ''
      state.loading = false
      state.provider = 'gemini'
    },
    clearExplanation: (state) => {
      state.explanation = null
      state.explanationContextType = null
      state.explanationError = ''
      state.explanationLoading = false
      state.isExplainModalOpen = false
    },
    closeExplainModal: (state) => {
      state.isExplainModalOpen = false
    },
    clearCopilotErrors: (state) => {
      state.error = ''
      state.explanationError = ''
      state.insightsError = ''
      state.sessionsError = ''
    }
  },
  extraReducers: (builder) => {
    // sendCopilotMessage
    builder
      .addCase(sendCopilotMessage.pending, (state, action) => {
        state.loading = true
        state.error = ''
        // Optimistically append user message to UI
        if (action.meta?.arg?.message) {
          state.messages.push({
            id: `temp_user_${Date.now()}`,
            role: 'user',
            content: action.meta.arg.message,
            timestamp: new Date().toISOString()
          })
        }
      })
      .addCase(sendCopilotMessage.fulfilled, (state, action) => {
        state.loading = false
        state.error = ''
        state.activeSessionId = action.payload.sessionId
        state.provider = action.payload.provider || 'heuristic'
        const followUps = action.payload.data?.suggestedFollowUps || []
        state.suggestedFollowUps = followUps

        // Append assistant response
        state.messages.push({
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content:
            action.payload.data?.message ||
            action.payload.data?.answer ||
            'Grounded financial advice generated.',
          provider: action.payload.provider || 'heuristic',
          suggestedFollowUps: followUps,
          referencedMetrics:
            action.payload.data?.referencedFacts ||
            action.payload.data?.referencedMetrics ||
            {},
          timestamp: new Date().toISOString()
        })
      })
      .addCase(sendCopilotMessage.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to communicate with AI Copilot.'
      })

    // fetchCopilotSessions
    builder
      .addCase(fetchCopilotSessions.pending, (state) => {
        state.sessionsLoading = true
        state.sessionsError = ''
      })
      .addCase(fetchCopilotSessions.fulfilled, (state, action) => {
        state.sessionsLoading = false
        state.sessions = action.payload
      })
      .addCase(fetchCopilotSessions.rejected, (state, action) => {
        state.sessionsLoading = false
        state.sessionsError = action.payload || 'Failed to fetch sessions.'
      })

    // deleteCopilotSession
    builder.addCase(deleteCopilotSession.fulfilled, (state, action) => {
      const deletedId = action.payload
      state.sessions = state.sessions.filter((s) => s._id !== deletedId)
      if (state.activeSessionId === deletedId) {
        state.activeSessionId = null
        state.messages = []
      }
    })

    // requestMetricExplanation
    builder
      .addCase(requestMetricExplanation.pending, (state, action) => {
        state.explanationLoading = true
        state.explanationError = ''
        state.explanationContextType = action.meta.arg.contextType
        state.isExplainModalOpen = true
      })
      .addCase(requestMetricExplanation.fulfilled, (state, action) => {
        state.explanationLoading = false
        state.explanation = action.payload.data
        state.provider = action.payload.provider || 'heuristic'
        state.isExplainModalOpen = true
      })
      .addCase(requestMetricExplanation.rejected, (state, action) => {
        state.explanationLoading = false
        state.explanationError = action.payload || 'Failed to generate metric explanation.'
        state.isExplainModalOpen = true
      })

    // fetchProactiveInsights
    builder
      .addCase(fetchProactiveInsights.pending, (state) => {
        state.insightsLoading = true
        state.insightsError = ''
      })
      .addCase(fetchProactiveInsights.fulfilled, (state, action) => {
        state.insightsLoading = false
        state.proactiveInsights =
          action.payload.insights || action.payload.data || []
      })
      .addCase(fetchProactiveInsights.rejected, (state, action) => {
        state.insightsLoading = false
        state.insightsError = action.payload || 'Failed to load proactive insights.'
      })
  }
})

export const {
  setCopilotMonth,
  openCopilotDrawer,
  closeCopilotDrawer,
  toggleCopilotDrawer,
  startNewConversation,
  clearExplanation,
  closeExplainModal,
  clearCopilotErrors
} = copilotSlice.actions

export default copilotSlice.reducer
