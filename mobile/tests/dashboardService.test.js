import dashboardService from '../src/services/dashboardService.js';
import api from '../src/services/api.js';

jest.mock('../src/services/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('FinTrack Mobile - Dashboard Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call GET /dashboard/summary without month param when not provided', async () => {
    const mockSummary = {
      totalIncome: 45000,
      totalExpense: 18000,
      savings: 27000,
      budgetRemaining: 7000,
      monthlyBudget: 25000,
      categoryBreakdown: [{ category: 'Food', amount: 5000, percentage: 27.8 }],
      recentTransactions: [{ title: 'Grocery', amount: 1200, type: 'expense' }],
      stagedCount: 1,
    };

    api.get.mockResolvedValueOnce({ data: mockSummary });

    const result = await dashboardService.getSummary();

    expect(api.get).toHaveBeenCalledWith('/dashboard/summary', { params: {} });
    expect(result.totalIncome).toBe(45000);
    expect(result.savings).toBe(27000);
    expect(result.stagedCount).toBe(1);
  });

  it('should call GET /dashboard/summary with month param when provided', async () => {
    const mockSummary = {
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
      recentTransactions: [],
      stagedCount: 0,
    };

    api.get.mockResolvedValueOnce({ data: mockSummary });

    const result = await dashboardService.getSummary('2026-09');

    expect(api.get).toHaveBeenCalledWith('/dashboard/summary', { params: { month: '2026-09' } });
    expect(result.totalIncome).toBe(625);
    expect(result.totalExpense).toBe(1075);
    expect(result.savings).toBe(-450);
  });

  it('should call GET /budget and return budget object', async () => {
    const mockBudget = {
      monthlyBudget: 30000,
      categoryBudgets: [{ category: 'Food', limit: 8000 }],
    };

    api.get.mockResolvedValueOnce({ data: mockBudget });

    const result = await dashboardService.getBudget();

    expect(api.get).toHaveBeenCalledWith('/budget');
    expect(result.monthlyBudget).toBe(30000);
  });

  it('should call GET /transactions?limit=5 and return recent list', async () => {
    const mockTxList = [
      { id: '1', title: 'Salary', amount: 50000, type: 'income' },
      { id: '2', title: 'Rent', amount: 15000, type: 'expense' },
    ];

    api.get.mockResolvedValueOnce({ data: { transactions: mockTxList } });

    const result = await dashboardService.getRecentTransactions(5);

    expect(api.get).toHaveBeenCalledWith('/transactions?limit=5');
    expect(result.length).toBe(2);
    expect(result[0].title).toBe('Salary');
  });
});
