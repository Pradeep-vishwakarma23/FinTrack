import { describe, it, expect, vi } from 'vitest'
import intelligenceService from '../services/intelligenceService'
import API from '../services/api'
import insightReducer, {
  setPeriod,
  clearInsightError,
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

describe('Phase 6.2 Web Banking Intelligence Service & State', () => {
  it('calls getSummary with month parameter', async () => {
    API.get.mockResolvedValueOnce({ data: { success: true, data: { metrics: { totalIncome: 50000 } } } })
    const res = await intelligenceService.getSummary('2026-03')
    expect(API.get).toHaveBeenCalledWith('/intelligence/summary', { params: { month: '2026-03' } })
    expect(res.data.data.metrics.totalIncome).toBe(50000)
  })

  it('calls getMerchants with month and limit parameter', async () => {
    API.get.mockResolvedValueOnce({ data: { success: true, data: [{ merchant: 'Swiggy', totalSpend: 1500 }] } })
    const res = await intelligenceService.getMerchants('2026-03', 5)
    expect(API.get).toHaveBeenCalledWith('/intelligence/merchants', { params: { month: '2026-03', limit: 5 } })
    expect(res.data.data).toHaveLength(1)
  })

  it('calls getAnomalies with month parameter', async () => {
    API.get.mockResolvedValueOnce({ data: { success: true, data: [] } })
    const res = await intelligenceService.getAnomalies('2026-03')
    expect(API.get).toHaveBeenCalledWith('/intelligence/anomalies', { params: { month: '2026-03' } })
    expect(res.data.data).toEqual([])
  })

  it('calls getForecast with month parameter', async () => {
    API.get.mockResolvedValueOnce({ data: { success: true, data: { projectedExpense: 30000, riskLevel: 'SAFE' } } })
    const res = await intelligenceService.getForecast('2026-03')
    expect(API.get).toHaveBeenCalledWith('/intelligence/forecast', { params: { month: '2026-03' } })
    expect(res.data.data.riskLevel).toBe('SAFE')
  })

  it('updates insightSlice period and clears error', () => {
    let state = insightReducer(undefined, setPeriod('2026-04'))
    expect(state.period).toBe('2026-04')

    state = { ...state, intelligenceError: 'Failed to sync' }
    state = insightReducer(state, clearInsightError())
    expect(state.intelligenceError).toBe('')
  })

  it('handles fetchBankingIntelligence.fulfilled state correctly', () => {
    const mockPayload = {
      summary: { metrics: { totalIncome: 60000, totalExpense: 20000, netSavings: 40000, savingsRate: 66.7 } },
      merchants: [{ merchant: 'Amazon', totalSpend: 5000 }],
      anomalies: [],
      forecast: { projectedExpense: 25000, riskLevel: 'SAFE', dailyBurnRate: 800 },
      period: '2026-03',
      hasPartialError: false
    }

    const state = insightReducer(undefined, {
      type: fetchBankingIntelligence.fulfilled.type,
      payload: mockPayload
    })

    expect(state.summary.metrics.totalIncome).toBe(60000)
    expect(state.merchants).toHaveLength(1)
    expect(state.forecast.riskLevel).toBe('SAFE')
    expect(state.period).toBe('2026-03')
    expect(state.intelligenceLoading).toBe(false)
  })
})
