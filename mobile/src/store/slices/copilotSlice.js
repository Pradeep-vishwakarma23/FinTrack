import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import copilotService from '../../services/copilotService.js';
import { getCurrentMonthKey } from './intelligenceSlice.js';

/**
 * Sends a message in the active Copilot conversation
 */
export const sendCopilotMessage = createAsyncThunk(
  'copilot/sendMessage',
  async ({ message, month }, { getState, rejectWithValue }) => {
    try {
      const state = getState().copilot;
      const targetMonth = month || state.month || getCurrentMonthKey();
      const sessionId = state.activeSessionId || null;

      const response = await copilotService.sendMessage({
        sessionId,
        month: targetMonth,
        message
      });

      return {
        ...response,
        userMessage: message
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to send message to AI Copilot.'
      );
    }
  }
);

/**
 * Fetches user's conversation sessions
 */
export const fetchCopilotSessions = createAsyncThunk(
  'copilot/fetchSessions',
  async (limit = 20, { rejectWithValue }) => {
    try {
      const response = await copilotService.getSessions(limit);
      return response?.data || [];
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to load Copilot sessions.'
      );
    }
  }
);

/**
 * Fetches a single session with its messages
 */
export const fetchCopilotSession = createAsyncThunk(
  'copilot/fetchSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await copilotService.getSession(sessionId);
      return response?.data || response;
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to load conversation.'
      );
    }
  }
);

/**
 * Deletes a conversation session
 */
export const deleteCopilotSession = createAsyncThunk(
  'copilot/deleteSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      await copilotService.deleteSession(sessionId);
      return sessionId;
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to delete conversation session.'
      );
    }
  }
);

/**
 * Requests an authoritative metric explanation
 */
export const explainCopilotMetric = createAsyncThunk(
  'copilot/explainMetric',
  async ({ contextType, month, itemData = {} }, { getState, rejectWithValue }) => {
    try {
      const state = getState().copilot;
      const targetMonth = month || state.month || getCurrentMonthKey();

      const response = await copilotService.explainMetric({
        month: targetMonth,
        contextType,
        itemData
      });

      return {
        ...response,
        contextType
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to generate metric explanation.'
      );
    }
  }
);

/**
 * Fetches proactive financial insights
 */
export const fetchProactiveInsights = createAsyncThunk(
  'copilot/fetchProactiveInsights',
  async (month, { getState, rejectWithValue }) => {
    try {
      const state = getState().copilot;
      const targetMonth = month || state.month || getCurrentMonthKey();

      const response = await copilotService.getProactiveInsights(targetMonth);
      return {
        month: response?.month || targetMonth,
        insights: response?.data || []
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to load proactive financial insights.'
      );
    }
  }
);

const initialState = {
  // Conversation state
  messages: [],
  activeSessionId: null,
  month: getCurrentMonthKey(),
  isSending: false,
  isLoading: false,
  error: null,
  provider: 'gemini',
  suggestedFollowUps: [],
  isBottomSheetOpen: false,

  // Sessions state
  sessions: [],
  sessionsLoading: false,

  // Explain-This state
  explanation: null,
  explanationLoading: false,
  explanationError: null,
  isExplainModalOpen: false,
  explanationContextType: null,

  // Proactive Insights state
  proactiveInsights: [],
  insightsLoading: false,
  insightsError: null
};

export const copilotSlice = createSlice({
  name: 'copilot',
  initialState,
  reducers: {
    setCopilotMonth: (state, action) => {
      if (state.month !== action.payload) {
        state.month = action.payload;
        state.activeSessionId = null;
        state.messages = [];
        state.suggestedFollowUps = [];
      }
    },
    openCopilot: (state) => {
      state.isBottomSheetOpen = true;
    },
    closeCopilot: (state) => {
      state.isBottomSheetOpen = false;
    },
    toggleCopilot: (state) => {
      state.isBottomSheetOpen = !state.isBottomSheetOpen;
    },
    startNewConversation: (state) => {
      state.activeSessionId = null;
      state.messages = [];
      state.suggestedFollowUps = [];
      state.error = null;
      state.isSending = false;
      state.provider = 'gemini';
    },
    closeExplainModal: (state) => {
      state.isExplainModalOpen = false;
      state.explanation = null;
      state.explanationError = null;
    },
    clearCopilotError: (state) => {
      state.error = null;
      state.explanationError = null;
      state.insightsError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // sendCopilotMessage
      .addCase(sendCopilotMessage.pending, (state, action) => {
        state.isSending = true;
        state.error = null;
        if (action.meta?.arg?.message) {
          state.messages.push({
            id: `temp_user_${Date.now()}`,
            role: 'user',
            content: action.meta.arg.message,
            timestamp: new Date().toISOString()
          });
        }
      })
      .addCase(sendCopilotMessage.fulfilled, (state, action) => {
        state.isSending = false;
        state.error = null;
        state.activeSessionId = action.payload?.sessionId || state.activeSessionId;
        state.provider = action.payload?.provider || 'heuristic';

        const data = action.payload?.data || {};
        const followUps = data.suggestedFollowUps || [];
        state.suggestedFollowUps = followUps;

        const replyContent = data.message || data.answer || 'Financial analysis generated.';
        state.messages.push({
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          provider: action.payload?.provider || 'heuristic',
          suggestedFollowUps: followUps,
          referencedFacts: data.referencedFacts || data.referencedMetrics || {},
          timestamp: new Date().toISOString()
        });
      })
      .addCase(sendCopilotMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload;
      })

      // fetchCopilotSessions
      .addCase(fetchCopilotSessions.pending, (state) => {
        state.sessionsLoading = true;
      })
      .addCase(fetchCopilotSessions.fulfilled, (state, action) => {
        state.sessionsLoading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchCopilotSessions.rejected, (state) => {
        state.sessionsLoading = false;
      })

      // fetchCopilotSession
      .addCase(fetchCopilotSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCopilotSession.fulfilled, (state, action) => {
        state.isLoading = false;
        const session = action.payload;
        if (session) {
          state.activeSessionId = session._id || session.id;
          state.month = session.month || state.month;
          state.messages = Array.isArray(session.messages) ? session.messages : [];
          if (session.messages?.length > 0) {
            const lastMsg = session.messages[session.messages.length - 1];
            state.suggestedFollowUps = lastMsg?.suggestedFollowUps || [];
          }
        }
      })
      .addCase(fetchCopilotSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // deleteCopilotSession
      .addCase(deleteCopilotSession.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.sessions = state.sessions.filter((s) => (s._id || s.id) !== deletedId);
        if (state.activeSessionId === deletedId) {
          state.activeSessionId = null;
          state.messages = [];
          state.suggestedFollowUps = [];
        }
      })

      // explainCopilotMetric
      .addCase(explainCopilotMetric.pending, (state, action) => {
        state.explanationLoading = true;
        state.explanationError = null;
        state.explanationContextType = action.meta.arg.contextType;
        state.isExplainModalOpen = true;
      })
      .addCase(explainCopilotMetric.fulfilled, (state, action) => {
        state.explanationLoading = false;
        state.explanation = action.payload?.data || action.payload;
        state.provider = action.payload?.provider || 'heuristic';
        state.isExplainModalOpen = true;
      })
      .addCase(explainCopilotMetric.rejected, (state, action) => {
        state.explanationLoading = false;
        state.explanationError = action.payload;
        state.isExplainModalOpen = true;
      })

      // fetchProactiveInsights
      .addCase(fetchProactiveInsights.pending, (state) => {
        state.insightsLoading = true;
        state.insightsError = null;
      })
      .addCase(fetchProactiveInsights.fulfilled, (state, action) => {
        state.insightsLoading = false;
        state.proactiveInsights = action.payload.insights;
      })
      .addCase(fetchProactiveInsights.rejected, (state, action) => {
        state.insightsLoading = false;
        state.insightsError = action.payload;
      });
  }
});

export const {
  setCopilotMonth,
  openCopilot,
  closeCopilot,
  toggleCopilot,
  startNewConversation,
  closeExplainModal,
  clearCopilotError
} = copilotSlice.actions;

export default copilotSlice.reducer;
