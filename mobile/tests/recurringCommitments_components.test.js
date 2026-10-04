import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { RecurringCommitmentsSection } from '../src/components/insights/RecurringCommitmentsSection.jsx';
import intelligenceService from '../src/services/intelligenceService.js';
import intelligenceReducer, {
  setSubscriptions,
  fetchIntelligenceData
} from '../src/store/slices/intelligenceSlice.js';
import api from '../src/services/api.js';

jest.mock('../src/services/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('FinTrack Mobile - Phase 7.3 Recurring Commitments UI & Service Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render RecurringCommitmentsSection in empty state', () => {
    let tree;
    act(() => {
      tree = renderer.create(<RecurringCommitmentsSection subscriptions={[]} summary={{ totalRecurringCommitments: 0, estimatedMonthlyRecurringCost: 0 }} />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Recurring Subscriptions');
    expect(str).toContain('0 Active');
    expect(str).toContain('No recurring subscriptions detected');
  });

  it('should render RecurringCommitmentsSection with subscription cards and badges', () => {
    const mockSubs = [
      {
        merchant: 'Netflix',
        normalizedMerchant: 'netflix',
        category: 'Entertainment',
        cadence: 'monthly',
        latestAmount: 749,
        previousAmount: 649,
        transactionCount: 4,
        confidenceLevel: 'HIGH',
        priceIncreaseDetected: true,
        amountChange: 100,
        percentageChange: 15.4,
        estimatedNextPaymentDate: '2026-10-05T00:00:00.000Z'
      },
      {
        merchant: 'Gym Membership',
        normalizedMerchant: 'gym membership',
        category: 'Health',
        cadence: 'monthly',
        latestAmount: 1500,
        previousAmount: 1500,
        transactionCount: 3,
        confidenceLevel: 'MEDIUM',
        priceIncreaseDetected: false,
        amountChange: 0,
        percentageChange: 0,
        estimatedNextPaymentDate: '2026-10-01T00:00:00.000Z'
      }
    ];

    const mockSummary = {
      totalRecurringCommitments: 2,
      estimatedMonthlyRecurringCost: 2249,
      highConfidenceCount: 1,
      mediumConfidenceCount: 1
    };

    let tree;
    act(() => {
      tree = renderer.create(<RecurringCommitmentsSection subscriptions={mockSubs} summary={mockSummary} />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Recurring Subscriptions');
    expect(str).toContain('2 Active');
    expect(str).toContain('Netflix');
    expect(str).toContain('749');
    expect(str).toContain('HIGH');
    expect(str).toContain('Gym Membership');
    expect(str).toContain('1,500');
    expect(str).toContain('MEDIUM');
    expect(str).toContain('Price Increased:');
    expect(str).toContain('100');
    expect(str).toContain('15.4%');
  });

  it('should call GET /intelligence/subscriptions from mobile intelligenceService', async () => {
    const mockResponse = {
      success: true,
      subscriptions: [{ merchant: 'Spotify', cadence: 'monthly', latestAmount: 119 }],
      summary: { totalRecurringCommitments: 1, estimatedMonthlyRecurringCost: 119 }
    };

    api.get.mockResolvedValueOnce(mockResponse);

    const res = await intelligenceService.getSubscriptions();
    expect(api.get).toHaveBeenCalledWith('/intelligence/subscriptions');
    expect(res.subscriptions).toHaveLength(1);
    expect(res.subscriptions[0].merchant).toBe('Spotify');
  });

  it('should update mobile intelligenceSlice with setSubscriptions action', () => {
    const payload = {
      subscriptions: [
        { merchant: 'Airtel Broadband', cadence: 'monthly', latestAmount: 999, confidenceLevel: 'HIGH' }
      ],
      summary: { totalRecurringCommitments: 1, estimatedMonthlyRecurringCost: 999 }
    };

    const state = intelligenceReducer(undefined, setSubscriptions(payload));
    expect(state.subscriptions).toHaveLength(1);
    expect(state.subscriptions[0].merchant).toBe('Airtel Broadband');
    expect(state.subscriptionsSummary.estimatedMonthlyRecurringCost).toBe(999);
  });

  it('should handle fetchIntelligenceData.fulfilled with subscriptions payload', () => {
    const payload = {
      summary: { metrics: { totalIncome: 75000, totalExpense: 25000 } },
      merchants: [],
      anomalies: [],
      forecast: null,
      subscriptions: [
        { merchant: 'Hotstar', cadence: 'monthly', latestAmount: 899, confidenceLevel: 'HIGH' }
      ],
      subscriptionsSummary: {
        totalRecurringCommitments: 1,
        estimatedMonthlyRecurringCost: 899
      },
      period: '2026-09',
      lastUpdated: '2026-09-30T12:00:00.000Z',
      hasPartialError: false
    };

    const state = intelligenceReducer(undefined, {
      type: fetchIntelligenceData.fulfilled.type,
      payload
    });

    expect(state.subscriptions).toHaveLength(1);
    expect(state.subscriptions[0].merchant).toBe('Hotstar');
    expect(state.subscriptionsSummary.totalRecurringCommitments).toBe(1);
    expect(state.subscriptionsSummary.estimatedMonthlyRecurringCost).toBe(899);
  });
});
