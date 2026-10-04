import { describe, it, expect } from 'vitest'
import {
  formatMonthLabel,
  generateGroundedRecommendations
} from '../utils/groundedRecommendations'

describe('Web Client - Grounded Financial Recommendations Utility', () => {
  it('formats month period strings into readable labels', () => {
    expect(formatMonthLabel('2026-09')).toBe('September 2026')
    expect(formatMonthLabel('2026-03')).toBe('March 2026')
    expect(formatMonthLabel('')).toBe('this period')
    expect(formatMonthLabel(null)).toBe('this period')
  })

  it('generates deficit recommendations without contradictory positive discipline tips', () => {
    const deficitSummary = {
      metrics: {
        totalIncome: 625,
        totalExpense: 1075,
        netSavings: -450,
        savingsRate: -72,
        isDeficit: true,
        transactionCount: 2
      },
      categorySpending: [
        { category: 'Other', amount: 600, percentage: 55.8 },
        { category: 'Shopping', amount: 475, percentage: 44.2 }
      ],
      anomalies: [],
      forecast: {
        dailyBurnRate: 36,
        projectedExpense: 1075,
        riskLevel: 'SAFE'
      }
    }

    const recs = generateGroundedRecommendations({
      summary: deficitSummary,
      anomalies: [],
      forecast: deficitSummary.forecast,
      period: '2026-09'
    })

    const str = recs.join(' ')
    expect(str).toContain('Cash Flow Deficit')
    expect(str).toContain('₹1,075')
    expect(str).toContain('₹625')
    expect(str).toContain('₹450')
    expect(str).toContain('September 2026')
    expect(str).toContain('Highest Category Spend: Other')
    expect(str).toContain('Reducing Other spending by 15% would save approximately ₹90')

    // Contradiction checks: Must NOT contain positive savings praise
    expect(str).not.toContain('Solid financial discipline')
    expect(str).not.toContain('Positive Savings')
    expect(str).not.toContain('surplus savings')
  })

  it('generates positive savings recommendations with discipline guidance when rate >= 20%', () => {
    const positiveSummary = {
      metrics: {
        totalIncome: 80000,
        totalExpense: 30000,
        netSavings: 50000,
        savingsRate: 62.5,
        isDeficit: false,
        transactionCount: 5
      },
      categorySpending: [
        { category: 'Rent', amount: 18000, percentage: 60.0 }
      ],
      anomalies: [],
      forecast: {
        dailyBurnRate: 1000,
        projectedExpense: 31000,
        monthlyBudget: 50000,
        riskLevel: 'SAFE'
      }
    }

    const recs = generateGroundedRecommendations({
      summary: positiveSummary,
      anomalies: [],
      forecast: positiveSummary.forecast,
      period: '2026-03'
    })

    const str = recs.join(' ')
    expect(str).toContain('Positive Savings: Your net savings for March 2026 are ₹50,000')
    expect(str).toContain('62.5%')
    expect(str).toContain('Solid financial discipline')
    expect(str).toContain('Highest Category Spend: Rent')
    expect(str).toContain('Healthy Budget Pace')
  })

  it('generates anomaly alerts only when anomalies actually exist', () => {
    const summaryWithoutAnomalies = {
      metrics: { totalIncome: 5000, totalExpense: 2000, transactionCount: 2 },
      categorySpending: [{ category: 'Food', amount: 2000, percentage: 100 }],
      anomalies: []
    }

    const recsNoAnomalies = generateGroundedRecommendations({
      summary: summaryWithoutAnomalies,
      anomalies: [],
      period: '2026-09'
    })

    expect(recsNoAnomalies.some((r) => r.includes('Anomaly Alert'))).toBe(false)

    const anomaliesList = [
      {
        transactionId: 'tx-shock',
        title: 'Luxury Watch',
        amount: 25000,
        anomalyType: 'BUDGET_SHOCK'
      }
    ]

    const recsWithAnomalies = generateGroundedRecommendations({
      summary: summaryWithoutAnomalies,
      anomalies: anomaliesList,
      period: '2026-09'
    })

    const strWithAnomalies = recsWithAnomalies.join(' ')
    expect(strWithAnomalies).toContain('Anomaly Alert')
    expect(strWithAnomalies).toContain('Luxury Watch')
    expect(strWithAnomalies).toContain('₹25,000')
  })

  it('generates budget overrun warnings when riskLevel is CRITICAL', () => {
    const criticalSummary = {
      metrics: { totalIncome: 30000, totalExpense: 28000, transactionCount: 4 },
      categorySpending: [{ category: 'Shopping', amount: 28000, percentage: 100 }],
      forecast: {
        dailyBurnRate: 2000,
        projectedExpense: 60000,
        monthlyBudget: 35000,
        riskLevel: 'CRITICAL'
      }
    }

    const recs = generateGroundedRecommendations({
      summary: criticalSummary,
      forecast: criticalSummary.forecast,
      period: '2026-09'
    })

    const str = recs.join(' ')
    expect(str).toContain('Critical Budget Alert')
    expect(str).toContain('₹60,000')
    expect(str).toContain('₹35,000')
    expect(str).toContain('₹25,000') // overrun = 60000 - 35000
  })

  it('handles zero transaction history gracefully', () => {
    const emptyRecs = generateGroundedRecommendations({
      summary: { metrics: { totalIncome: 0, totalExpense: 0, transactionCount: 0 } },
      anomalies: [],
      forecast: null,
      period: '2026-09'
    })

    expect(emptyRecs).toHaveLength(1)
    expect(emptyRecs[0]).toContain('No transaction records found for September 2026')
  })
})
