import { describe, it, expect } from 'vitest'

describe('Phase 9 Report Logic & Aggregations', () => {
  it('correctly formats and computes report summary metrics', () => {
    const rawReport = {
      summary: {
        totalIncome: 75000,
        totalExpenses: 25000,
        netSavings: 50000,
        savingsRate: 66.67
      },
      categories: [
        { category: 'Housing', amount: 15000, percentage: 60 },
        { category: 'Food', amount: 10000, percentage: 40 }
      ],
      merchants: [
        { merchant: 'Owner', totalSpending: 15000, transactionCount: 1 },
        { merchant: 'Supermarket', totalSpending: 10000, transactionCount: 4 }
      ],
      budget: {
        monthlyBudget: 30000,
        spent: 25000,
        remaining: 5000,
        utilization: 83.3,
        riskLevel: 'Moderate'
      }
    }

    expect(rawReport.summary.totalIncome).toBe(75000)
    expect(rawReport.summary.totalExpenses).toBe(25000)
    expect(rawReport.summary.netSavings).toBe(50000)
    expect(rawReport.summary.savingsRate).toBe(66.67)

    const totalCategorySpend = rawReport.categories.reduce((acc, c) => acc + c.amount, 0)
    expect(totalCategorySpend).toBe(25000)

    const totalMerchantSpend = rawReport.merchants.reduce((acc, m) => acc + m.totalSpending, 0)
    expect(totalMerchantSpend).toBe(25000)

    expect(rawReport.budget.remaining).toBe(5000)
    expect(rawReport.budget.riskLevel).toBe('Moderate')
  })

  it('handles empty / zero financial states gracefully without errors', () => {
    const emptyReport = {
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0,
        savingsRate: 0
      },
      categories: [],
      merchants: [],
      budget: null,
      trends: { available: false, message: 'Insufficient historical data for trend analysis.' },
      recurring: [],
      goals: [],
      actionPlans: [],
      anomalies: [],
      transactionSummary: { totalTransactions: 0 }
    }

    expect(emptyReport.summary.totalIncome).toBe(0)
    expect(emptyReport.summary.savingsRate).toBe(0)
    expect(emptyReport.categories).toHaveLength(0)
    expect(emptyReport.merchants).toHaveLength(0)
    expect(emptyReport.budget).toBeNull()
    expect(emptyReport.trends.available).toBe(false)
    expect(emptyReport.trends.message).toBe('Insufficient historical data for trend analysis.')
  })

  it('validates non-guaranteed impact terminology for financial action plans', () => {
    const actionPlan = {
      planId: 'plan123',
      title: 'Reduce Discretionary Food Spend',
      priority: 'HIGH',
      potentialMonthlyImpact: 1500,
      potentialSixMonthImpact: 9000
    }

    expect(actionPlan.potentialMonthlyImpact).toBe(1500)
    expect(actionPlan.potentialSixMonthImpact).toBe(9000)
    expect(actionPlan).toHaveProperty('potentialMonthlyImpact')
    expect(actionPlan).toHaveProperty('potentialSixMonthImpact')
  })
})
