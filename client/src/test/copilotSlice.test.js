import { describe, it, expect, beforeEach } from 'vitest'
import copilotReducer, {
  setCopilotMonth,
  openCopilotDrawer,
  closeCopilotDrawer,
  toggleCopilotDrawer,
  startNewConversation,
  clearCopilotError,
  clearExplanation,
  closeExplainModal,
  sendCopilotMessage,
  fetchCopilotSessions,
  requestMetricExplanation,
  fetchProactiveInsights
} from '../redux/slices/copilotSlice'

describe('Phase 6.4.4 Copilot Redux Slice', () => {
  let initialState

  beforeEach(() => {
    initialState = {
      isDrawerOpen: false,
      activeSessionId: null,
      month: '2026-09',
      messages: [],
      loading: false,
      error: null,
      provider: 'gemini',
      suggestedFollowUps: [],
      sessions: [],
      sessionsLoading: false,
      sessionsError: null,
      proactiveInsights: [],
      proactiveLoading: false,
      proactiveError: null,
      explanation: null,
      explanationLoading: false,
      explanationError: null,
      isExplainModalOpen: false,
      explanationContextType: null
    }
  })

  it('handles drawer open, close, and toggle', () => {
    let state = copilotReducer(initialState, openCopilotDrawer())
    expect(state.isDrawerOpen).toBe(true)

    state = copilotReducer(state, closeCopilotDrawer())
    expect(state.isDrawerOpen).toBe(false)

    state = copilotReducer(state, toggleCopilotDrawer())
    expect(state.isDrawerOpen).toBe(true)
  })

  it('handles month switching and resets session if needed', () => {
    const activeState = {
      ...initialState,
      activeSessionId: 'sess_1',
      month: '2026-09',
      messages: [{ role: 'user', content: 'hello' }]
    }

    const state = copilotReducer(activeState, setCopilotMonth('2026-08'))
    expect(state.month).toBe('2026-08')
    expect(state.activeSessionId).toBeNull()
    expect(state.messages).toHaveLength(0)
  })

  it('handles startNewConversation', () => {
    const activeState = {
      ...initialState,
      activeSessionId: 'sess_abc',
      messages: [{ role: 'user', content: 'test' }],
      suggestedFollowUps: ['a', 'b']
    }

    const state = copilotReducer(activeState, startNewConversation())
    expect(state.activeSessionId).toBeNull()
    expect(state.messages).toHaveLength(0)
    expect(state.suggestedFollowUps).toHaveLength(0)
  })

  it('handles sendCopilotMessage.pending and fulfilled', () => {
    const pendingAction = {
      type: sendCopilotMessage.pending.type,
      meta: { arg: { message: 'Why is savings negative?' } }
    }
    const pendingState = copilotReducer(initialState, pendingAction)
    expect(pendingState.loading).toBe(true)
    expect(pendingState.messages).toHaveLength(1)
    expect(pendingState.messages[0].role).toBe('user')
    expect(pendingState.messages[0].content).toBe('Why is savings negative?')

    const fulfilledPayload = {
      success: true,
      provider: 'gemini',
      sessionId: 'sess_new_99',
      data: {
        answer: 'You have a net cash deficit of ₹450.',
        groundingFacts: { netSavings: -450 },
        suggestedFollowUps: ['How to fix it?']
      }
    }

    const fulfilledAction = {
      type: sendCopilotMessage.fulfilled.type,
      payload: fulfilledPayload
    }
    const fulfilledState = copilotReducer(pendingState, fulfilledAction)
    expect(fulfilledState.loading).toBe(false)
    expect(fulfilledState.activeSessionId).toBe('sess_new_99')
    expect(fulfilledState.provider).toBe('gemini')
    expect(fulfilledState.messages).toHaveLength(2)
    expect(fulfilledState.messages[1].role).toBe('assistant')
    expect(fulfilledState.messages[1].content).toContain('net cash deficit of ₹450')
    expect(fulfilledState.suggestedFollowUps).toEqual(['How to fix it?'])
  })

  it('handles requestMetricExplanation thunk cycle', () => {
    const pendingAction = {
      type: requestMetricExplanation.pending.type,
      meta: { arg: { contextType: 'savings_rate' } }
    }
    const pendingState = copilotReducer(initialState, pendingAction)
    expect(pendingState.explanationLoading).toBe(true)
    expect(pendingState.isExplainModalOpen).toBe(true)
    expect(pendingState.explanationContextType).toBe('savings_rate')

    const fulfilledPayload = {
      success: true,
      provider: 'gemini',
      data: {
        title: 'Negative Savings Explanation',
        explanation: 'Expenses exceeded income by ₹450.',
        keyDrivers: ['Deficit -₹450'],
        recommendedAction: 'Cut Other category spending.'
      }
    }
    const fulfilledAction = {
      type: requestMetricExplanation.fulfilled.type,
      payload: fulfilledPayload
    }
    const fulfilledState = copilotReducer(pendingState, fulfilledAction)
    expect(fulfilledState.explanationLoading).toBe(false)
    expect(fulfilledState.explanation.title).toBe('Negative Savings Explanation')
    expect(fulfilledState.provider).toBe('gemini')
  })

  it('handles fetchProactiveInsights fulfilled', () => {
    const mockData = [
      { id: '1', type: 'deficit', priority: 'danger', title: 'Deficit Alert', message: 'Deficit of ₹450' }
    ]
    const fulfilledAction = {
      type: fetchProactiveInsights.fulfilled.type,
      payload: { success: true, data: mockData }
    }
    const state = copilotReducer(initialState, fulfilledAction)
    expect(state.proactiveLoading).toBe(false)
    expect(state.proactiveInsights).toHaveLength(1)
    expect(state.proactiveInsights[0].title).toBe('Deficit Alert')
  })
})
