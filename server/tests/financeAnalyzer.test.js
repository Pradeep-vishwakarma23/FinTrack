import {
  currency,
  getMonthRange,
  summarizeTransactions,
  analyzeFinance
} from '../services/financeAnalyzer.js';

describe('Financial Analytics & Heuristic Engine (financeAnalyzer.js)', () => {
  const mockTransactions = [
    {
      _id: 'tx1',
      type: 'income',
      title: 'Salary',
      amount: 50000,
      category: 'Salary',
      transactionDate: new Date('2026-03-01')
    },
    {
      _id: 'tx2',
      type: 'expense',
      title: 'Apartment Rent',
      amount: 15000,
      category: 'Rent',
      transactionDate: new Date('2026-03-02')
    },
    {
      _id: 'tx3',
      type: 'expense',
      title: 'Supermarket Groceries',
      amount: 8000,
      category: 'Food',
      transactionDate: new Date('2026-03-05')
    },
    {
      _id: 'tx4',
      type: 'expense',
      title: 'Dining Out',
      amount: 2000,
      category: 'Food',
      transactionDate: new Date('2026-03-10')
    }
  ];

  const mockBudget = {
    monthlyBudget: 30000,
    categoryBudgets: [
      { category: 'Food', limit: 8000 },
      { category: 'Rent', limit: 16000 }
    ]
  };

  test('currency helper formats INR values correctly', () => {
    expect(currency(5000)).toBe('₹5,000');
    expect(currency(0)).toBe('₹0');
  });

  test('getMonthRange returns start and end timestamps for a given date', () => {
    const range = getMonthRange(new Date('2026-03-15'));
    expect(range.start.getFullYear()).toBe(2026);
    expect(range.start.getMonth()).toBe(2); // March (0-indexed)
    expect(range.start.getDate()).toBe(1);
    expect(range.end.getDate()).toBe(31);
  });

  test('summarizeTransactions accurately calculates totals, savings, category breakdown, and monthly trend', () => {
    const summary = summarizeTransactions(mockTransactions, mockBudget);

    expect(summary.totalIncome).toBe(50000);
    expect(summary.totalExpense).toBe(25000);
    expect(summary.savings).toBe(25000);
    expect(summary.monthlyBudget).toBe(30000);
    expect(summary.budgetRemaining).toBe(5000);

    // Category breakdown check
    expect(summary.categoryBreakdown).toHaveLength(2);
    expect(summary.categoryBreakdown[0].category).toBe('Rent');
    expect(summary.categoryBreakdown[0].amount).toBe(15000);
    expect(summary.categoryBreakdown[0].percentage).toBe(60.0);
    expect(summary.categoryBreakdown[1].category).toBe('Food');
    expect(summary.categoryBreakdown[1].amount).toBe(10000);
    expect(summary.categoryBreakdown[1].percentage).toBe(40.0);

    // Monthly trend check
    expect(summary.monthlyTrend).toHaveLength(1);
    expect(summary.monthlyTrend[0].month).toBe('2026-03');
    expect(summary.monthlyTrend[0].income).toBe(50000);
    expect(summary.monthlyTrend[0].expense).toBe(25000);
    expect(summary.monthlyTrend[0].savings).toBe(25000);
  });

  test('analyzeFinance produces actionable insights, overspend alerts, and prediction', () => {
    const analysis = analyzeFinance({ transactions: mockTransactions, budget: mockBudget });

    expect(analysis.totalIncome).toBe(50000);
    expect(analysis.insights.length).toBeGreaterThan(0);
    expect(analysis.recommendations.length).toBeGreaterThan(0);

    // Food category exceeded limit (10000 > 8000)
    const overspendInsight = analysis.insights.find((i) => i.includes('Category Overspend: Food'));
    expect(overspendInsight).toBeDefined();

    // Prediction calculation
    expect(analysis.predictedExpense).toBe(25000);
    expect(analysis.confidence).toBeGreaterThanOrEqual(55);
    expect(analysis.confidence).toBeLessThanOrEqual(95);
  });

  test('analyzeFinance handles empty transaction history safely', () => {
    const emptyAnalysis = analyzeFinance({ transactions: [], budget: null });
    expect(emptyAnalysis.totalIncome).toBe(0);
    expect(emptyAnalysis.totalExpense).toBe(0);
    expect(emptyAnalysis.insights).toHaveLength(1);
    expect(emptyAnalysis.predictedExpense).toBe(0);
    expect(emptyAnalysis.confidence).toBe(0);
  });
});
