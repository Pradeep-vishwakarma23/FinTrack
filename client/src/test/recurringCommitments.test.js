import { describe, it, expect, vi } from 'vitest'
import intelligenceService from '../services/intelligenceService'
import API from '../services/api'
import insightReducer, {
  setSubscriptions,
  fetchSubscriptions,
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

describe('Phase 7.3 Web Recurring Subscriptions & Fixed Obligations Tests', () => {
  it('calls getSubscriptions endpoint correctly', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        subscriptions: [
          {
            merchant: 'Netflix',
            normalizedMerchant: 'netflix',
            cadence: 'monthly',
            latestAmount: 749,
            previousAmount: 649,
            priceIncreaseDetected: true,
            amountChange: 100,
            percentageChange: 15.4,
            confidenceLevel: 'HIGH',
            estimatedNextPaymentDate: '2026-10-05T00:00:00.000Z'
          }
        ],
        summary: {
          totalRecurringCommitments: 1,
          estimatedMonthlyRecurringCost: 749,
          highConfidenceCount: 1,
          mediumConfidenceCount: 0
        }
      }
    })

    const res = await intelligenceService.getSubscriptions()
    expect(API.get).toHaveBeenCalledWith('/intelligence/subscriptions')
    expect(res.data.subscriptions).toHaveLength(1)
    expect(res.data.subscriptions[0].merchant).toBe('Netflix')
    expect(res.data.subscriptions[0].priceIncreaseDetected).toBe(true)
    expect(res.data.summary.estimatedMonthlyRecurringCost).toBe(749)
  })

  it('updates insightSlice state with setSubscriptions action', () => {
    const payload = {
      subscriptions: [
        {
          merchant: 'Spotify',
          normalizedMerchant: 'spotify',
          cadence: 'monthly',
          latestAmount: 119,
          confidenceLevel: 'HIGH'
        }
      ],
      summary: {
        totalRecurringCommitments: 1,
        estimatedMonthlyRecurringCost: 119
      }
    }

    const state = insightReducer(undefined, setSubscriptions(payload))
    expect(state.subscriptions).toHaveLength(1)
    expect(state.subscriptions[0].merchant).toBe('Spotify')
    expect(state.subscriptionsSummary.estimatedMonthlyRecurringCost).toBe(119)
  })

  it('handles fetchSubscriptions.fulfilled state correctly', () => {
    const payload = {
      subscriptions: [
        {
          merchant: 'Airtel Broadband',
          cadence: 'monthly',
          latestAmount: 999,
          confidenceLevel: 'HIGH'
        },
        {
          merchant: 'Gym Membership',
          cadence: 'monthly',
          latestAmount: 1500,
          confidenceLevel: 'MEDIUM'
        }
      ],
      summary: {
        totalRecurringCommitments: 2,
        estimatedMonthlyRecurringCost: 2499,
        highConfidenceCount: 1,
        mediumConfidenceCount: 1
      }
    }

    const state = insightReducer(undefined, {
      type: fetchSubscriptions.fulfilled.type,
      payload
    })

    expect(state.subscriptionsLoading).toBe(false)
    expect(state.subscriptions).toHaveLength(2)
    expect(state.subscriptionsSummary.totalRecurringCommitments).toBe(2)
    expect(state.subscriptionsSummary.estimatedMonthlyRecurringCost).toBe(2499)
    expect(state.subscriptionsError).toBe('')
  })

  it('handles fetchBankingIntelligence.fulfilled with integrated subscriptions', () => {
    const mockPayload = {
      summary: { metrics: { totalIncome: 50000, totalExpense: 20000 } },
      merchants: [],
      anomalies: [],
      forecast: null,
      subscriptions: [
        {
          merchant: 'Amazon Prime',
          cadence: 'monthly',
          latestAmount: 299,
          confidenceLevel: 'HIGH'
        }
      ],
      subscriptionsSummary: {
        totalRecurringCommitments: 1,
        estimatedMonthlyRecurringCost: 299
      },
      period: '2026-09',
      hasPartialError: false
    }

    const state = insightReducer(undefined, {
      type: fetchBankingIntelligence.fulfilled.type,
      payload: mockPayload
    })

    expect(state.subscriptions).toHaveLength(1)
    expect(state.subscriptions[0].merchant).toBe('Amazon Prime')
    expect(state.subscriptionsSummary.estimatedMonthlyRecurringCost).toBe(299)
  })

  it('handles fetchSubscriptions.rejected state with error message', () => {
    const state = insightReducer(undefined, {
      type: fetchSubscriptions.rejected.type,
      payload: 'Failed to fetch recurring subscriptions'
    })

    expect(state.subscriptionsLoading).toBe(false)
    expect(state.subscriptionsError).toBe('Failed to fetch recurring subscriptions')
  })
})
