import intelligenceReducer, {
  setPeriod,
  clearIntelligenceError,
  fetchIntelligenceData,
  fetchTrends,
  setTrendsRange,
} from '../src/store/slices/intelligenceSlice.js';
import intelligenceService from '../src/services/intelligenceService.js';

jest.mock('../src/services/intelligenceService.js', () => ({
  __esModule: true,
  default: {
    getSummary: jest.fn(),
    getMerchants: jest.fn(),
    getAnomalies: jest.fn(),
    getForecast: jest.fn(),
    getSubscriptions: jest.fn(),
    getTrends: jest.fn(),
  },
}));

describe('FinTrack Mobile - Intelligence Slice', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the initial state', () => {
    const state = intelligenceReducer(undefined, { type: 'unknown' });
    expect(state.summary).toBeNull();
    expect(state.merchants).toEqual([]);
    expect(state.anomalies).toEqual([]);
    expect(state.forecast).toBeNull();
    expect(state.subscriptions).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should handle setPeriod and clearIntelligenceError', () => {
    let state = intelligenceReducer(undefined, setPeriod('2026-05'));
    expect(state.period).toBe('2026-05');

    state = { ...state, error: 'Network timeout' };
    state = intelligenceReducer(state, clearIntelligenceError());
    expect(state.error).toBeNull();
  });

  it('should update state on fetchIntelligenceData.fulfilled', async () => {
    const mockSummary = {
      metrics: { totalIncome: 100000, totalExpense: 40000, netSavings: 60000, savingsRate: 60 },
      categorySpending: [{ category: 'Food', amount: 15000 }],
    };
    const mockMerchants = [{ merchant: 'Amazon', totalSpend: 8000 }];
    const mockAnomalies = [{ title: 'Outlier', amount: 10000 }];
    const mockForecast = { projectedExpense: 45000, riskLevel: 'SAFE' };
    const mockSubscriptions = {
      subscriptions: [{ merchant: 'Netflix', cadence: 'monthly', latestAmount: 749 }],
      summary: { totalRecurringCommitments: 1, estimatedMonthlyRecurringCost: 749 }
    };

    intelligenceService.getSummary.mockResolvedValueOnce(mockSummary);
    intelligenceService.getMerchants.mockResolvedValueOnce(mockMerchants);
    intelligenceService.getAnomalies.mockResolvedValueOnce(mockAnomalies);
    intelligenceService.getForecast.mockResolvedValueOnce(mockForecast);
    intelligenceService.getSubscriptions.mockResolvedValueOnce(mockSubscriptions);

    const thunk = fetchIntelligenceData({ month: '2026-03' });
    const dispatch = jest.fn();
    const getState = jest.fn();

    const action = await thunk(dispatch, getState, undefined);

    expect(action.type).toBe('intelligence/fetchData/fulfilled');
    expect(action.payload.summary).toEqual(mockSummary);
    expect(action.payload.merchants).toEqual(mockMerchants);
    expect(action.payload.forecast).toEqual(mockForecast);
    expect(action.payload.subscriptions).toHaveLength(1);

    const newState = intelligenceReducer(undefined, action);
    expect(newState.summary).toEqual(mockSummary);
    expect(newState.merchants).toEqual(mockMerchants);
    expect(newState.forecast.riskLevel).toBe('SAFE');
    expect(newState.subscriptions).toHaveLength(1);
    expect(newState.isLoading).toBe(false);
  });

  it('should handle partial failures resiliently without wiping loaded data', async () => {
    const mockSummary = { metrics: { totalIncome: 50000, totalExpense: 20000 } };

    intelligenceService.getSummary.mockResolvedValueOnce(mockSummary);
    intelligenceService.getMerchants.mockRejectedValueOnce(new Error('Merchants endpoint down'));
    intelligenceService.getAnomalies.mockResolvedValueOnce([]);
    intelligenceService.getForecast.mockResolvedValueOnce({ riskLevel: 'SAFE' });
    intelligenceService.getSubscriptions.mockResolvedValueOnce({ subscriptions: [], summary: null });

    const thunk = fetchIntelligenceData({ month: '2026-03' });
    const dispatch = jest.fn();
    const getState = jest.fn();

    const action = await thunk(dispatch, getState, undefined);

    expect(action.type).toBe('intelligence/fetchData/fulfilled');
    expect(action.payload.summary).toEqual(mockSummary);
    expect(action.payload.merchants).toEqual([]);
    expect(action.payload.hasPartialError).toBe(true);

    const newState = intelligenceReducer(undefined, action);
    expect(newState.summary).toEqual(mockSummary);
    expect(newState.merchants).toEqual([]);
  });

  it('should handle setTrendsRange and fetchTrends.fulfilled', async () => {
    let state = intelligenceReducer(undefined, setTrendsRange('12m'));
    expect(state.trendsRange).toBe('12m');

    const mockTrends = {
      range: '12m',
      period: '2026-09',
      months: [{ month: '2026-09', income: 15000, expenses: 5000, netSavings: 10000 }],
      momentum: { state: 'IMPROVING' }
    };

    intelligenceService.getTrends.mockResolvedValueOnce(mockTrends);

    const thunk = fetchTrends({ range: '12m', referenceMonth: '2026-09' });
    const dispatch = jest.fn();
    const getState = jest.fn();

    const action = await thunk(dispatch, getState, undefined);

    expect(action.type).toBe('intelligence/fetchTrends/fulfilled');
    expect(action.payload).toEqual(mockTrends);

    state = intelligenceReducer(state, action);
    expect(state.trends).toEqual(mockTrends);
    expect(state.trendsRange).toBe('12m');
  });
});

