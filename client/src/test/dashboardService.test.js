import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDashboardSummary } from '../services/dashboardService'
import API from '../services/api'
import { getCurrentMonthKey } from '../redux/slices/insightSlice'

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

describe('Web Dashboard Financial Source of Truth & Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('forwards month parameter to GET /dashboard/summary when supplied', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        period: '2026-09',
        data: {
          totalIncome: 625,
          totalExpense: 1075,
          savings: -450,
          savingsRate: -72,
          budgetRemaining: -450,
          monthlyBudget: 0,
          categoryBreakdown: [
            { category: 'Other', amount: 600, percentage: 55.81 },
            { category: 'Shopping', amount: 475, percentage: 44.19 }
          ],
          monthlyTrend: [
            { month: '2026-09', income: 625, expense: 1075, savings: -450 }
          ],
          recentTransactions: [],
          stagedCount: 0
        }
      }
    })

    const response = await getDashboardSummary('2026-09')

    expect(API.get).toHaveBeenCalledWith('/dashboard/summary', {
      params: { month: '2026-09' }
    })
    expect(response.data.success).toBe(true)
    expect(response.data.period).toBe('2026-09')
    expect(response.data.data.totalIncome).toBe(625)
    expect(response.data.data.totalExpense).toBe(1075)
    expect(response.data.data.savings).toBe(-450)
    expect(response.data.data.savingsRate).toBe(-72)
    expect(response.data.data.categoryBreakdown).toEqual([
      { category: 'Other', amount: 600, percentage: 55.81 },
      { category: 'Shopping', amount: 475, percentage: 44.19 }
    ])
  })

  it('forwards dynamic current month key when called dynamically', async () => {
    const currentMonth = getCurrentMonthKey()
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        period: currentMonth,
        data: {
          totalIncome: 625,
          totalExpense: 1075,
          savings: -450
        }
      }
    })

    const response = await getDashboardSummary(currentMonth)

    expect(API.get).toHaveBeenCalledWith('/dashboard/summary', {
      params: { month: currentMonth }
    })
    expect(response.data.period).toBe(currentMonth)
  })

  it('does not return or accept legacy lifetime figures for September 2026', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        period: '2026-09',
        data: {
          totalIncome: 625,
          totalExpense: 1075,
          savings: -450,
          savingsRate: -72
        }
      }
    })

    const response = await getDashboardSummary('2026-09')
    const kpis = response.data.data

    // Must NOT match legacy lifetime numbers
    expect(kpis.totalIncome).not.toBe(30625)
    expect(kpis.totalExpense).not.toBe(10700)
    expect(kpis.savings).not.toBe(19925)
    expect(kpis.savingsRate).not.toBe(65)

    // Must match authoritative September 2026 intelligence
    expect(kpis.totalIncome).toBe(625)
    expect(kpis.totalExpense).toBe(1075)
    expect(kpis.savings).toBe(-450)
    expect(kpis.savingsRate).toBe(-72)
  })

  it('handles API errors gracefully without throwing unhandled exceptions', async () => {
    API.get.mockRejectedValueOnce(new Error('Network Error'))

    await expect(getDashboardSummary('2026-09')).rejects.toThrow('Network Error')
  })
})
