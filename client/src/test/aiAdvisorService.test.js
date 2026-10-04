import { describe, it, expect, vi, beforeEach } from 'vitest'
import aiAdvisorService from '../services/aiAdvisorService'
import API from '../services/api'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

describe('Phase 6.3 Web AI Financial Advisor Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aiAdvisorService.getAdvice sends correct month payload to /ai/advisor/advice', async () => {
    const mockAdvice = {
      success: true,
      provider: 'gemini',
      period: '2026-09',
      data: {
        executiveSummary: 'Positive cash flow with healthy surplus.',
        keyObservations: ['Food spending is stable', 'Top payee is Landlord'],
        actionableRecommendations: ['Keep saving 20%', 'Invest surplus in mutual funds'],
        savingsPotential: 'Save ₹500 more by curbing discretionary expenses'
      }
    }
    API.post.mockResolvedValueOnce({ data: mockAdvice })

    const res = await aiAdvisorService.getAdvice('2026-09')
    expect(API.post).toHaveBeenCalledWith('/ai/advisor/advice', { month: '2026-09' })
    expect(res.success).toBe(true)
    expect(res.provider).toBe('gemini')
    expect(res.period).toBe('2026-09')
    expect(res.data.executiveSummary).toContain('Positive cash flow')
    expect(res.data.keyObservations).toHaveLength(2)
    expect(res.data.actionableRecommendations).toHaveLength(2)
  })

  it('aiAdvisorService.getAdvice handles heuristic fallback response properly', async () => {
    const mockFallback = {
      success: true,
      provider: 'heuristic',
      period: '2026-09',
      data: {
        executiveSummary: 'For 2026-09, your finances are positive with net savings.',
        keyObservations: ['Spending patterns remain consistent'],
        actionableRecommendations: ['Maintain emergency fund'],
        savingsPotential: 'Maintain current spending habits.'
      }
    }
    API.post.mockResolvedValueOnce({ data: mockFallback })

    const res = await aiAdvisorService.getAdvice('2026-09')
    expect(API.post).toHaveBeenCalledWith('/ai/advisor/advice', { month: '2026-09' })
    expect(res.provider).toBe('heuristic')
    expect(res.data.executiveSummary).toContain('positive with net savings')
  })

  it('aiAdvisorService.askQuestion sends month and question payload to /ai/advisor/query', async () => {
    const mockQuery = {
      success: true,
      provider: 'gemini',
      period: '2026-09',
      data: {
        answer: 'Your deficit is caused by unexpected shopping expenses.',
        referencedFacts: { totalExpense: 4450 }
      }
    }
    API.post.mockResolvedValueOnce({ data: mockQuery })

    const res = await aiAdvisorService.askQuestion('2026-09', 'What is causing my deficit?')
    expect(API.post).toHaveBeenCalledWith('/ai/advisor/query', {
      month: '2026-09',
      question: 'What is causing my deficit?'
    })
    expect(res.success).toBe(true)
    expect(res.data.answer).toContain('unexpected shopping expenses')
  })

  it('aiAdvisorService.runWhatIf sends month and scenario payload to /ai/advisor/what-if', async () => {
    const mockWhatIf = {
      success: true,
      provider: 'gemini',
      period: '2026-09',
      data: {
        baseline: { income: 4000, expense: 4450, netSavings: -450, savingsRate: 0 },
        simulated: { income: 4500, expense: 3880.7, netSavings: 619.3, savingsRate: 13.76 },
        difference: { savedExpense: 569.3, additionalIncome: 500, improvedSavings: 1069.3 },
        narrative: 'Reducing spending turns your deficit into a surplus.'
      }
    }
    API.post.mockResolvedValueOnce({ data: mockWhatIf })

    const scenario = { categoryReductions: { Other: 20, Shopping: 10 }, additionalIncome: 500 }
    const res = await aiAdvisorService.runWhatIf('2026-09', scenario)
    expect(API.post).toHaveBeenCalledWith('/ai/advisor/what-if', {
      month: '2026-09',
      scenario
    })
    expect(res.success).toBe(true)
    expect(res.data.simulated.netSavings).toBe(619.3)
    expect(res.data.difference.improvedSavings).toBe(1069.3)
    expect(res.data.narrative).toContain('turns your deficit into a surplus')
  })

  it('aiAdvisorService handles empty month and zero-transaction response', async () => {
    const mockEmpty = {
      success: true,
      provider: 'heuristic',
      period: '2026-08',
      data: {
        executiveSummary: 'No confirmed transactions were recorded for 2026-08. Please log or confirm transactions for this month to receive personalized AI financial advice.',
        keyObservations: ['No ledger activity detected for the selected period.'],
        actionableRecommendations: ['Add your income and daily expenses.'],
        savingsPotential: 'No data available to calculate potential savings.'
      }
    }
    API.post.mockResolvedValueOnce({ data: mockEmpty })

    const res = await aiAdvisorService.getAdvice('2026-08')
    expect(res.period).toBe('2026-08')
    expect(res.data.executiveSummary).toContain('No confirmed transactions were recorded')
    expect(res.data.keyObservations[0]).toContain('No ledger activity')
  })
})
