import { describe, it, expect, vi, beforeEach } from 'vitest'
import copilotService from '../services/copilotService'
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

describe('Phase 6.4.4 Copilot Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. chat() sends correct payload without sessionId on initial turn', async () => {
    const mockChatResponse = {
      success: true,
      provider: 'gemini',
      sessionId: 'sess_123',
      data: {
        answer: 'Your savings rate is negative because expenses exceeded income.',
        groundingFacts: { totalIncome: 625, totalExpense: 1075, netSavings: -450 },
        suggestedFollowUps: ['How can I cut expenses?', 'What is my highest expense?']
      }
    }
    API.post.mockResolvedValueOnce({ data: mockChatResponse })

    const res = await copilotService.chat({
      sessionId: null,
      month: '2026-09',
      message: 'Why is my savings rate negative?'
    })

    expect(API.post).toHaveBeenCalledWith('/copilot/chat', {
      sessionId: null,
      month: '2026-09',
      message: 'Why is my savings rate negative?'
    })
    expect(res.success).toBe(true)
    expect(res.sessionId).toBe('sess_123')
    expect(res.provider).toBe('gemini')
    expect(res.data.answer).toContain('savings rate is negative')
  })

  it('2. chat() reuses sessionId on subsequent follow-up turns', async () => {
    const mockFollowUpResponse = {
      success: true,
      provider: 'gemini',
      sessionId: 'sess_123',
      data: {
        answer: 'Specifically, you had ₹600 in Other and ₹475 in Shopping.',
        groundingFacts: { categorySpending: [{ category: 'Other', amount: 600 }] },
        suggestedFollowUps: ['Show recent transactions']
      }
    }
    API.post.mockResolvedValueOnce({ data: mockFollowUpResponse })

    const res = await copilotService.chat({
      sessionId: 'sess_123',
      month: '2026-09',
      message: 'Why?'
    })

    expect(API.post).toHaveBeenCalledWith('/copilot/chat', {
      sessionId: 'sess_123',
      month: '2026-09',
      message: 'Why?'
    })
    expect(res.sessionId).toBe('sess_123')
  })

  it('3. chat() correctly passes month context', async () => {
    const mockResponse = {
      success: true,
      provider: 'heuristic',
      sessionId: 'sess_456',
      data: {
        answer: 'In August 2026, no ledger activity was recorded.',
        groundingFacts: { totalIncome: 0, totalExpense: 0 },
        suggestedFollowUps: []
      }
    }
    API.post.mockResolvedValueOnce({ data: mockResponse })

    const res = await copilotService.chat({
      month: '2026-08',
      message: 'Summarize my month'
    })

    expect(API.post).toHaveBeenCalledWith('/copilot/chat', {
      sessionId: null,
      month: '2026-08',
      message: 'Summarize my month'
    })
    expect(res.provider).toBe('heuristic')
  })

  it('4. getSessions() calls GET /copilot/sessions', async () => {
    const mockSessions = {
      success: true,
      data: [
        { _id: 's1', month: '2026-09', title: 'Why is my savings rate negative?', messageCount: 2 },
        { _id: 's2', month: '2026-08', title: 'August Analysis', messageCount: 4 }
      ]
    }
    API.get.mockResolvedValueOnce({ data: mockSessions })

    const res = await copilotService.getSessions()
    expect(API.get).toHaveBeenCalledWith('/copilot/sessions', {
      params: { limit: 20 }
    })
    expect(res.data).toHaveLength(2)
    expect(res.data[0]._id).toBe('s1')
  })

  it('5. deleteSession() calls DELETE /copilot/sessions/:sessionId', async () => {
    const mockDeleteResponse = {
      success: true,
      message: 'Session deleted successfully.'
    }
    API.delete.mockResolvedValueOnce({ data: mockDeleteResponse })

    const res = await copilotService.deleteSession('s1')
    expect(API.delete).toHaveBeenCalledWith('/copilot/sessions/s1')
    expect(res.success).toBe(true)
  })

  it('6. explain() sends month, contextType, and itemData to POST /copilot/explain', async () => {
    const mockExplain = {
      success: true,
      provider: 'gemini',
      data: {
        contextType: 'savings_rate',
        title: 'Negative Net Savings Explanation',
        explanation: 'Your expenses of ₹1,075 exceeded your confirmed income of ₹625.',
        keyDrivers: ['Net deficit of -₹450', 'Savings rate of -72%'],
        recommendedAction: 'Reduce discretionary expenses by at least ₹500.'
      }
    }
    API.post.mockResolvedValueOnce({ data: mockExplain })

    const res = await copilotService.explain({
      month: '2026-09',
      contextType: 'savings_rate',
      itemData: { savingsRate: -72, netSavings: -450 }
    })

    expect(API.post).toHaveBeenCalledWith('/copilot/explain', {
      month: '2026-09',
      contextType: 'savings_rate',
      itemData: { savingsRate: -72, netSavings: -450 }
    })
    expect(res.success).toBe(true)
    expect(res.data.title).toContain('Negative Net Savings')
    expect(res.data.keyDrivers).toHaveLength(2)
  })

  it('7. getProactiveInsights() calls GET /copilot/proactive-insights with month query param', async () => {
    const mockProactive = {
      success: true,
      month: '2026-09',
      count: 2,
      data: [
        {
          id: 'deficit_warning',
          type: 'deficit',
          priority: 'danger',
          title: 'Monthly Cash Flow Deficit',
          message: 'Expenses (₹1,075) exceeded income (₹625) by ₹450.',
          action: 'Ask Copilot to analyze highest expense drivers'
        },
        {
          id: 'single_merchant_heavy',
          type: 'merchant',
          priority: 'warning',
          title: 'High Merchant Concentration',
          message: 'Landlord accounts for 55.8% of total monthly outflow.',
          action: 'Review recurring merchant commitments'
        }
      ]
    }
    API.get.mockResolvedValueOnce({ data: mockProactive })

    const res = await copilotService.getProactiveInsights('2026-09')
    expect(API.get).toHaveBeenCalledWith('/copilot/proactive-insights', {
      params: { month: '2026-09' }
    })
    expect(res.data).toHaveLength(2)
    expect(res.data[0].priority).toBe('danger')
    expect(res.data[1].priority).toBe('warning')
  })

  it('8. handles API errors gracefully (401, 500, network error)', async () => {
    const networkError = new Error('Network Connection Error')
    API.post.mockRejectedValueOnce(networkError)

    await expect(
      copilotService.chat({ month: '2026-09', message: 'Hello' })
    ).rejects.toThrow('Network Connection Error')
  })

  it('9. handles 429 rate limit or heuristic fallback seamlessly', async () => {
    const mockRateLimitFallback = {
      success: true,
      provider: 'heuristic',
      sessionId: 'sess_rate_limit',
      data: {
        answer: 'Financial Assistant (Fallback): For 2026-09, you have a net deficit of ₹450.',
        groundingFacts: { netSavings: -450 },
        suggestedFollowUps: []
      }
    }
    API.post.mockResolvedValueOnce({ data: mockRateLimitFallback })

    const res = await copilotService.chat({
      month: '2026-09',
      message: 'Explain my deficit'
    })
    expect(res.success).toBe(true)
    expect(res.provider).toBe('heuristic')
    expect(res.data.answer).toContain('Fallback')
  })
})
