import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMonthlyReport, downloadMonthlyReport, downloadMonthlyReportPDF } from '../services/reportService'
import API from '../services/api'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

describe('Phase 9 Web Financial Report Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls getMonthlyReport with month string parameter', async () => {
    const mockReportData = {
      reportMetadata: { month: '2026-09', userId: 'user123' },
      summary: { totalIncome: 50000, totalExpenses: 20000, netSavings: 30000, savingsRate: 60 },
      categories: [{ category: 'Groceries', amount: 8000, percentage: 40 }],
      merchants: [{ merchant: 'Blinkit', totalSpending: 5000, transactionCount: 4 }],
      budget: { monthlyBudget: 25000, spent: 20000, remaining: 5000, utilization: 80, riskLevel: 'Low' },
      trends: { available: true, savingsMomentum: 'IMPROVING' },
      recurring: [],
      goals: [],
      actionPlans: [],
      anomalies: [],
      transactionSummary: { totalTransactions: 10 }
    }

    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: mockReportData
      }
    })

    const res = await getMonthlyReport('2026-09')

    expect(API.get).toHaveBeenCalledWith('/reports/monthly', {
      params: { month: '2026-09' }
    })
    expect(res.data.success).toBe(true)
    expect(res.data.data.summary.totalIncome).toBe(50000)
    expect(res.data.data.summary.savingsRate).toBe(60)
  })

  it('calls getMonthlyReport with object params', async () => {
    API.get.mockResolvedValueOnce({
      data: { success: true, data: {} }
    })

    await getMonthlyReport({ month: '2026-08', year: 2026 })

    expect(API.get).toHaveBeenCalledWith('/reports/monthly', {
      params: { month: '2026-08', year: 2026 }
    })
  })

  it('calls downloadMonthlyReport requesting blob and format=pdf', async () => {
    const mockBlob = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' })
    API.get.mockResolvedValueOnce({
      data: mockBlob
    })

    const res = await downloadMonthlyReport('2026-09')

    expect(API.get).toHaveBeenCalledWith('/reports/monthly', {
      params: { month: '2026-09', format: 'pdf' },
      responseType: 'blob'
    })
    expect(res.data).toBe(mockBlob)
  })

  it('calls downloadMonthlyReportPDF requesting /reports/monthly/pdf', async () => {
    const mockBlob = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' })
    API.get.mockResolvedValueOnce({
      data: mockBlob
    })

    const res = await downloadMonthlyReportPDF('2026-09')

    expect(API.get).toHaveBeenCalledWith('/reports/monthly/pdf', {
      params: { month: '2026-09' },
      responseType: 'blob'
    })
    expect(res.data).toBe(mockBlob)
  })
})
