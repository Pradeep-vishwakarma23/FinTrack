import copilotReducer, {
  setCopilotMonth,
  openCopilot,
  closeCopilot,
  toggleCopilot,
  startNewConversation,
  closeExplainModal,
  clearCopilotError,
  sendCopilotMessage,
  fetchCopilotSessions,
  fetchCopilotSession,
  deleteCopilotSession,
  explainCopilotMetric,
  fetchProactiveInsights,
} from '../src/store/slices/copilotSlice.js';

describe('FinTrack Mobile - Copilot Redux Slice', () => {
  const initialSliceState = {
    messages: [],
    activeSessionId: null,
    month: '2026-09',
    isSending: false,
    isLoading: false,
    error: null,
    provider: 'gemini',
    suggestedFollowUps: [],
    isBottomSheetOpen: false,
    sessions: [],
    sessionsLoading: false,
    explanation: null,
    explanationLoading: false,
    explanationError: null,
    isExplainModalOpen: false,
    explanationContextType: null,
    proactiveInsights: [],
    insightsLoading: false,
    insightsError: null,
  };

  it('1. should return initial state by default', () => {
    const state = copilotReducer(undefined, { type: '@@INIT' });
    expect(state.messages).toEqual([]);
    expect(state.isBottomSheetOpen).toBe(false);
    expect(state.isSending).toBe(false);
    expect(state.provider).toBe('gemini');
  });

  it('2. should handle openCopilot, closeCopilot, and toggleCopilot', () => {
    let state = copilotReducer(initialSliceState, openCopilot());
    expect(state.isBottomSheetOpen).toBe(true);

    state = copilotReducer(state, closeCopilot());
    expect(state.isBottomSheetOpen).toBe(false);

    state = copilotReducer(state, toggleCopilot());
    expect(state.isBottomSheetOpen).toBe(true);
  });

  it('3. should handle setCopilotMonth and reset conversation on month change', () => {
    const stateWithConv = {
      ...initialSliceState,
      month: '2026-09',
      activeSessionId: 'sess_1',
      messages: [{ role: 'user', content: 'hello' }],
      suggestedFollowUps: ['Why?'],
    };

    const nextState = copilotReducer(stateWithConv, setCopilotMonth('2026-10'));
    expect(nextState.month).toBe('2026-10');
    expect(nextState.activeSessionId).toBeNull();
    expect(nextState.messages).toEqual([]);
    expect(nextState.suggestedFollowUps).toEqual([]);
  });

  it('4. should handle startNewConversation', () => {
    const stateWithConv = {
      ...initialSliceState,
      activeSessionId: 'sess_1',
      messages: [{ role: 'user', content: 'test' }],
      suggestedFollowUps: ['follow up'],
      error: 'some error',
    };

    const nextState = copilotReducer(stateWithConv, startNewConversation());
    expect(nextState.activeSessionId).toBeNull();
    expect(nextState.messages).toEqual([]);
    expect(nextState.suggestedFollowUps).toEqual([]);
    expect(nextState.error).toBeNull();
  });

  it('5. should handle sendCopilotMessage.pending with optimistic user message', () => {
    const action = {
      type: sendCopilotMessage.pending.type,
      meta: { arg: { message: 'Why is my savings rate negative?' } }
    };
    const state = copilotReducer(initialSliceState, action);

    expect(state.isSending).toBe(true);
    expect(state.error).toBeNull();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe('user');
    expect(state.messages[0].content).toBe('Why is my savings rate negative?');
  });

  it('6. should handle sendCopilotMessage.fulfilled and append assistant reply', () => {
    const stateWithUserMsg = {
      ...initialSliceState,
      isSending: true,
      messages: [{ id: 'user_1', role: 'user', content: 'Why is my savings rate negative?' }]
    };

    const action = {
      type: sendCopilotMessage.fulfilled.type,
      payload: {
        sessionId: 'sess_100',
        provider: 'gemini',
        data: {
          message: 'Your expenses exceeded income by ₹450.',
          suggestedFollowUps: ['Which category contributed the most?'],
          referencedFacts: { income: 625, expense: 1075 }
        }
      }
    };

    const state = copilotReducer(stateWithUserMsg, action);

    expect(state.isSending).toBe(false);
    expect(state.activeSessionId).toBe('sess_100');
    expect(state.provider).toBe('gemini');
    expect(state.suggestedFollowUps).toEqual(['Which category contributed the most?']);
    expect(state.messages).toHaveLength(2);
    expect(state.messages[1].role).toBe('assistant');
    expect(state.messages[1].content).toBe('Your expenses exceeded income by ₹450.');
  });

  it('7. should handle sendCopilotMessage.rejected', () => {
    const action = {
      type: sendCopilotMessage.rejected.type,
      payload: 'AI Assistant temporarily unavailable.'
    };
    const state = copilotReducer({ ...initialSliceState, isSending: true }, action);

    expect(state.isSending).toBe(false);
    expect(state.error).toBe('AI Assistant temporarily unavailable.');
  });

  it('8. should handle fetchCopilotSession.fulfilled', () => {
    const sessionPayload = {
      _id: 'session_200',
      month: '2026-09',
      messages: [
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First answer', suggestedFollowUps: ['Next step?'] }
      ]
    };

    const action = {
      type: fetchCopilotSession.fulfilled.type,
      payload: sessionPayload
    };

    const state = copilotReducer(initialSliceState, action);

    expect(state.activeSessionId).toBe('session_200');
    expect(state.messages).toHaveLength(2);
    expect(state.suggestedFollowUps).toEqual(['Next step?']);
  });

  it('9. should handle deleteCopilotSession.fulfilled', () => {
    const stateWithSessions = {
      ...initialSliceState,
      sessions: [{ _id: 'sess_1' }, { _id: 'sess_2' }],
      activeSessionId: 'sess_1',
      messages: [{ role: 'user', content: 'hello' }]
    };

    const action = {
      type: deleteCopilotSession.fulfilled.type,
      payload: 'sess_1'
    };

    const state = copilotReducer(stateWithSessions, action);

    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]._id).toBe('sess_2');
    expect(state.activeSessionId).toBeNull();
    expect(state.messages).toEqual([]);
  });

  it('10. should handle explainCopilotMetric pending, fulfilled, and closeExplainModal', () => {
    // Pending
    const pendingAction = {
      type: explainCopilotMetric.pending.type,
      meta: { arg: { contextType: 'savings_rate' } }
    };
    let state = copilotReducer(initialSliceState, pendingAction);
    expect(state.explanationLoading).toBe(true);
    expect(state.isExplainModalOpen).toBe(true);
    expect(state.explanationContextType).toBe('savings_rate');

    // Fulfilled
    const fulfilledAction = {
      type: explainCopilotMetric.fulfilled.type,
      payload: {
        provider: 'gemini',
        data: {
          title: 'Savings Rate Explanation',
          explanation: 'Detailed breakdown',
          keyDrivers: ['Driver 1']
        }
      }
    };
    state = copilotReducer(state, fulfilledAction);
    expect(state.explanationLoading).toBe(false);
    expect(state.explanation.title).toBe('Savings Rate Explanation');
    expect(state.isExplainModalOpen).toBe(true);

    // Close
    state = copilotReducer(state, closeExplainModal());
    expect(state.isExplainModalOpen).toBe(false);
    expect(state.explanation).toBeNull();
  });

  it('11. should handle fetchProactiveInsights.fulfilled', () => {
    const action = {
      type: fetchProactiveInsights.fulfilled.type,
      payload: {
        month: '2026-09',
        insights: [
          { id: '1', type: 'danger', title: 'Deficit Warning' }
        ]
      }
    };

    const state = copilotReducer(initialSliceState, action);

    expect(state.insightsLoading).toBe(false);
    expect(state.proactiveInsights).toHaveLength(1);
    expect(state.proactiveInsights[0].title).toBe('Deficit Warning');
  });

  it('12. should handle clearCopilotError', () => {
    const errorState = {
      ...initialSliceState,
      error: 'err 1',
      explanationError: 'err 2',
      insightsError: 'err 3',
    };

    const state = copilotReducer(errorState, clearCopilotError());
    expect(state.error).toBeNull();
    expect(state.explanationError).toBeNull();
    expect(state.insightsError).toBeNull();
  });
});
