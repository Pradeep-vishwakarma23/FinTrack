import { describe, it, expect, beforeEach, vi } from 'vitest'
import store from '../redux/store'
import {
  setCopilotMonth,
  openCopilotDrawer,
  closeCopilotDrawer,
  toggleCopilotDrawer,
  startNewConversation,
  clearCopilotErrors,
  clearExplanation,
  closeExplainModal,
  sendCopilotMessage,
  fetchCopilotSessions,
  deleteCopilotSession,
  requestMetricExplanation,
  fetchProactiveInsights
} from '../redux/slices/copilotSlice'
import API from '../services/api'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

describe('Phase 6.4.4 Redux Store Copilot Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    store.dispatch(startNewConversation())
    store.dispatch(clearCopilotErrors())
    store.dispatch(clearExplanation())
  })

  it('1. Initializes Redux store with copilot slice', () => {
    const state = store.getState().copilot
    expect(state).toBeDefined()
    expect(state).toHaveProperty('isDrawerOpen')
    expect(state).toHaveProperty('messages')
    expect(state).toHaveProperty('activeSessionId')
    expect(state).toHaveProperty('proactiveInsights')
    expect(state).toHaveProperty('explanation')
  })

  it('2. Handles drawer open, close, and toggle actions in live store', () => {
    store.dispatch(openCopilotDrawer())
    expect(store.getState().copilot.isDrawerOpen).toBe(true)

    store.dispatch(closeCopilotDrawer())
    expect(store.getState().copilot.isDrawerOpen).toBe(false)

    store.dispatch(toggleCopilotDrawer())
    expect(store.getState().copilot.isDrawerOpen).toBe(true)

    store.dispatch(closeCopilotDrawer())
  })

  it('3. Handles month context switching and resets active conversation', () => {
    store.dispatch(setCopilotMonth('2026-09'))
    expect(store.getState().copilot.month).toBe('2026-09')

    store.dispatch(setCopilotMonth('2026-08'))
    expect(store.getState().copilot.month).toBe('2026-08')
    expect(store.getState().copilot.activeSessionId).toBeNull()
    expect(store.getState().copilot.messages).toHaveLength(0)
  })

  it('4. Executes sendCopilotMessage thunk and retains sessionId across turns', async () => {
    // Turn 1
    const mockTurn1 = {
      success: true,
      provider: 'gemini',
      sessionId: 'sess_999',
      data: {
        message: 'For September 2026, you have a net cash deficit of ₹450.',
        referencedFacts: { totalIncome: 625, totalExpense: 1075, netSavings: -450 },
        suggestedFollowUps: ['Which category spent the most?', 'How to reach a surplus?']
      }
    }
    API.post.mockResolvedValueOnce({ data: mockTurn1 })

    await store.dispatch(
      sendCopilotMessage({ message: 'Why is my savings rate negative?', month: '2026-09' })
    )

    let state = store.getState().copilot
    expect(state.activeSessionId).toBe('sess_999')
    expect(state.provider).toBe('gemini')
    expect(state.messages).toHaveLength(2)
    expect(state.messages[0].role).toBe('user')
    expect(state.messages[1].role).toBe('assistant')
    expect(state.messages[1].content).toContain('net cash deficit of ₹450')
    expect(state.suggestedFollowUps).toHaveLength(2)

    // Turn 2 (reusing sessionId)
    const mockTurn2 = {
      success: true,
      provider: 'gemini',
      sessionId: 'sess_999',
      data: {
        message: 'Your top spending was ₹600 in Other and ₹475 in Shopping.',
        referencedFacts: { categorySpending: [{ category: 'Other', amount: 600 }] },
        suggestedFollowUps: []
      }
    }
    API.post.mockResolvedValueOnce({ data: mockTurn2 })

    await store.dispatch(
      sendCopilotMessage({ message: 'Which category spent the most?', month: '2026-09' })
    )

    state = store.getState().copilot
    expect(state.activeSessionId).toBe('sess_999')
    expect(state.messages).toHaveLength(4)
    expect(state.messages[3].content).toContain('₹600 in Other')
  })

  it('5. Executes requestMetricExplanation thunk and populates modal state', async () => {
    const mockExplain = {
      success: true,
      provider: 'gemini',
      data: {
        contextType: 'savings_rate',
        title: 'Negative Net Savings Explanation',
        explanation: 'Your expenses of ₹1,075 exceeded confirmed earnings of ₹625.',
        keyDrivers: ['Net deficit of -₹450', 'Savings rate of -72%'],
        recommendedAction: 'Reduce discretionary expenses by ₹500.'
      }
    }
    API.post.mockResolvedValueOnce({ data: mockExplain })

    await store.dispatch(
      requestMetricExplanation({
        month: '2026-09',
        contextType: 'savings_rate',
        itemData: { savingsRate: -72, netSavings: -450 }
      })
    )

    const state = store.getState().copilot
    expect(state.isExplainModalOpen).toBe(true)
    expect(state.explanationContextType).toBe('savings_rate')
    expect(state.explanation).toBeDefined()
    expect(state.explanation.title).toBe('Negative Net Savings Explanation')
    expect(state.explanation.keyDrivers).toHaveLength(2)

    store.dispatch(closeExplainModal())
    expect(store.getState().copilot.isExplainModalOpen).toBe(false)
  })

  it('6. Executes fetchProactiveInsights thunk and stores deterministic alerts', async () => {
    const mockInsights = {
      success: true,
      month: '2026-09',
      data: [
        {
          id: 'deficit_alert',
          type: 'deficit',
          priority: 'danger',
          title: 'Cash Flow Deficit Alert',
          message: 'Expenses exceeded income by ₹450.',
          action: 'Ask Copilot for expense reduction tips'
        }
      ]
    }
    API.get.mockResolvedValueOnce({ data: mockInsights })

    await store.dispatch(fetchProactiveInsights('2026-09'))

    const state = store.getState().copilot
    expect(state.proactiveInsights).toHaveLength(1)
    expect(state.proactiveInsights[0].priority).toBe('danger')
    expect(state.proactiveInsights[0].title).toBe('Cash Flow Deficit Alert')
  })

  it('7. Handles session deletion and clears active session if matching', async () => {
    API.delete.mockResolvedValueOnce({ data: { success: true } })

    // Set active session ID to s1
    store.dispatch({
      type: sendCopilotMessage.fulfilled.type,
      payload: { sessionId: 's1', provider: 'gemini', data: { message: 'hello' } }
    })
    expect(store.getState().copilot.activeSessionId).toBe('s1')

    await store.dispatch(deleteCopilotSession('s1'))
    const state = store.getState().copilot
    expect(state.activeSessionId).toBeNull()
    expect(state.messages).toHaveLength(0)
  })
})
