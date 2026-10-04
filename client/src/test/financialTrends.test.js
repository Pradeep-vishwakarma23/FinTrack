import { describe, it, expect, vi } from 'vitest'
import intelligenceService from '../services/intelligenceService'
import API from '../services/api'
import insightReducer, {
  setTrendsRange,
  setFinancialTrends,
  fetchFinancialTrends,
  fetchBankingIntelligence
} from '../redux/slices/insightSlice'

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

describe('Phase 7.4 Web Financial Trends & Comparative Intelligence Tests', () => {
  it('calls getTrends endpoint with range and referenceMonth parameters', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        range: '6m',
        period: '2026-04 to 2026-09',
        months: [
          { month: '2026-08', income: 50000, expenses: 20000, netSavings: 30000, savingsRate: 60 },
          { month: '2026-09', income: 55000, expenses: 18000, netSavings: 37000, savingsRate: 67.27 }
        ],
        comparison: {
          currentMonth: '2026-09',
          previousMonth: '2026-08',
          income: { current: 55000, previous: 50000, change: 5000, percentageChange: 10 },
          expenses: { current: 18000, previous: 20000, change: -2000, percentageChange: -10 },
          savings: { current: 37000, previous: 30000, change: 7000, percentageChange: 23.33 }
        },
        momentum: { state: 'IMPROVING', score: 1 },
        categories: [{ category: 'Shopping', totalSpending: 5000, trend: 'decreasing' }],
        extremes: {
          highestExpenseMonth: { month: '2026-08', amount: 20000 },
          highestIncomeMonth: { month: '2026-09', amount: 55000 }
        }
      }
    })

    const res = await intelligenceService.getTrends('6m', '2026-09')
    expect(API.get).toHaveBeenCalledWith('/intelligence/trends', {
      params: { range: '6m', referenceMonth: '2026-09' }
    })
    expect(res.data.success).toBe(true)
    expect(res.data.months).toHaveLength(2)
    expect(res.data.momentum.state).toBe('IMPROVING')
  })

  it('updates insightSlice state with setTrendsRange and setFinancialTrends actions', () => {
    let state = insightReducer(undefined, setTrendsRange('12m'))
    expect(state.trendsRange).toBe('12m')

    const mockTrends = {
      range: '12m',
      period: '2025-10 to 2026-09',
      months: [],
      momentum: { state: 'STABLE' }
    }
    state = insightReducer(state, setFinancialTrends(mockTrends))
    expect(state.trends).toEqual(mockTrends)
  })

  it('handles fetchFinancialTrends.fulfilled state correctly', () => {
    const mockPayload = {
      success: true,
      range: '6m',
      months: [
        { month: '2026-08', income: 40000, expenses: 25000, netSavings: 15000 },
        { month: '2026-09', income: 45000, expenses: 22000, netSavings: 23000 }
      ],
      comparison: {
        income: { change: 5000 },
        expenses: { change: -3000 },
        savings: { change: 8000 }
      },
      momentum: { state: 'IMPROVING' }
    }

    const state = insightReducer(undefined, {
      type: fetchFinancialTrends.fulfilled.type,
      payload: mockPayload
    })

    expect(state.trendsLoading).toBe(false)
    expect(state.trends.range).toBe('6m')
    expect(state.trends.months).toHaveLength(2)
    expect(state.trends.momentum.state).toBe('IMPROVING')
    expect(state.trendsError).toBe('')
  })

  it('handles fetchBankingIntelligence.fulfilled with integrated trends', () => {
    const mockPayload = {
      summary: { metrics: { totalIncome: 50000 } },
      merchants: [],
      anomalies: [],
      forecast: null,
      subscriptions: [],
      trends: {
        range: '6m',
        period: '2026-04 to 2026-09',
        months: [{ month: '2026-09', income: 50000, expenses: 20000, netSavings: 30000 }],
        momentum: { state: 'STABLE' }
      },
      period: '2026-09',
      hasPartialError: false
    }

    const state = insightReducer(undefined, {
      type: fetchBankingIntelligence.fulfilled.type,
      payload: mockPayload
    })

    expect(state.trends).toBeDefined()
    expect(state.trends.range).toBe('6m')
    expect(state.trends.months).toHaveLength(1)
  })

  it('handles fetchFinancialTrends.rejected state with error message', () => {
    const state = insightReducer(undefined, {
      type: fetchFinancialTrends.rejected.type,
      payload: 'Unable to calculate trends'
    })

    expect(state.trendsLoading).toBe(false)
    expect(state.trendsError).toBe('Unable to calculate trends')
  })
})
