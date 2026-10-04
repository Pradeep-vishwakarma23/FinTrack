import intelligenceService from '../src/services/intelligenceService.js';
import api from '../src/services/api.js';

jest.mock('../src/services/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('FinTrack Mobile - Intelligence Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call GET /intelligence/summary with month query', async () => {
    const mockSummary = {
      metrics: { totalIncome: 80000, totalExpense: 30000, netSavings: 50000, savingsRate: 62.5 },
      categorySpending: [{ category: 'Rent', amount: 18000 }],
      topMerchants: [{ merchant: 'Landlord', totalSpend: 18000 }],
      anomalies: [],
      forecast: { projectedExpense: 50000, riskLevel: 'SAFE' },
    };

    api.get.mockResolvedValueOnce(mockSummary);

    const result = await intelligenceService.getSummary('2026-03');

    expect(api.get).toHaveBeenCalledWith('/intelligence/summary', { params: { month: '2026-03' } });
    expect(result.metrics.totalIncome).toBe(80000);
    expect(result.metrics.netSavings).toBe(50000);
  });

  it('should call GET /intelligence/merchants with month and limit query', async () => {
    const mockMerchants = [
      { merchant: 'Swiggy', totalSpend: 2500, count: 3, averageTicket: 833.33, percentage: 8.3 },
    ];

    api.get.mockResolvedValueOnce(mockMerchants);

    const result = await intelligenceService.getMerchants('2026-03', 10);

    expect(api.get).toHaveBeenCalledWith('/intelligence/merchants', { params: { month: '2026-03', limit: 10 } });
    expect(result).toHaveLength(1);
    expect(result[0].merchant).toBe('Swiggy');
  });

  it('should call GET /intelligence/anomalies with month query', async () => {
    const mockAnomalies = [
      {
        transactionId: 'tx-1',
        title: 'Luxury Watch',
        amount: 25000,
        anomalyType: 'BUDGET_SHOCK',
        severity: 'HIGH',
      },
    ];

    api.get.mockResolvedValueOnce(mockAnomalies);

    const result = await intelligenceService.getAnomalies('2026-03');

    expect(api.get).toHaveBeenCalledWith('/intelligence/anomalies', { params: { month: '2026-03' } });
    expect(result).toHaveLength(1);
    expect(result[0].anomalyType).toBe('BUDGET_SHOCK');
  });

  it('should call GET /intelligence/forecast with month query', async () => {
    const mockForecast = {
      projectedExpense: 42000,
      dailyBurnRate: 1400,
      confidence: 78,
      riskLevel: 'SAFE',
    };

    api.get.mockResolvedValueOnce(mockForecast);

    const result = await intelligenceService.getForecast('2026-03');

    expect(api.get).toHaveBeenCalledWith('/intelligence/forecast', { params: { month: '2026-03' } });
    expect(result.riskLevel).toBe('SAFE');
    expect(result.projectedExpense).toBe(42000);
  });

  it('should call GET /intelligence/trends with range and referenceMonth query', async () => {
    const mockTrends = {
      range: '6m',
      period: '2026-09',
      months: [{ month: '2026-09', income: 10000, expenses: 4000, netSavings: 6000 }],
      momentum: { state: 'IMPROVING' }
    };

    api.get.mockResolvedValueOnce(mockTrends);

    const result = await intelligenceService.getTrends('6m', '2026-09');

    expect(api.get).toHaveBeenCalledWith('/intelligence/trends', { params: { range: '6m', referenceMonth: '2026-09' } });
    expect(result.range).toBe('6m');
    expect(result.momentum.state).toBe('IMPROVING');
  });
});

