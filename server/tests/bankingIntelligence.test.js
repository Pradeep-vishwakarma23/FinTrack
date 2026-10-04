import {
  sanitizeAmount,
  filterConfirmedTransactions,
  calculateFinancialMetrics,
  calculateCategorySpending,
  calculateMerchantAnalytics,
  detectAnomalies,
  calculateForecastAndRisk,
  calculateBankingIntelligenceSummary
} from '../services/bankingIntelligenceService.js';
import { parseMonthQuery } from '../controllers/intelligenceController.js';

describe('Phase 6.1: Banking Intelligence & Financial Insights Engine', () => {
  const mockBudget = {
    monthlyBudget: 50000,
    categoryBudgets: [
      { category: 'Food', limit: 12000 },
      { category: 'Rent', limit: 20000 },
      { category: 'Shopping', limit: 5000 }
    ]
  };

  const sampleTransactions = [
    {
      _id: 'tx-inc-1',
      type: 'income',
      title: 'Monthly Salary',
      merchant: 'Tech Corp',
      amount: 80000,
      category: 'Salary',
      status: 'confirmed',
      transactionDate: new Date('2026-03-01')
    },
    {
      _id: 'tx-exp-1',
      type: 'expense',
      title: 'House Rent',
      merchant: 'Landlord',
      amount: 18000,
      category: 'Rent',
      status: 'confirmed',
      transactionDate: new Date('2026-03-02')
    },
    {
      _id: 'tx-exp-2',
      type: 'expense',
      title: 'Supermarket Groceries',
      merchant: 'DMart',
      amount: 6000,
      category: 'Food',
      status: 'confirmed',
      transactionDate: new Date('2026-03-05')
    },
    {
      _id: 'tx-exp-3',
      type: 'expense',
      title: 'Dining Out',
      merchant: 'Swiggy',
      amount: 1500,
      category: 'Food',
      status: 'confirmed',
      transactionDate: new Date('2026-03-08')
    },
    {
      _id: 'tx-exp-4',
      type: 'expense',
      title: 'Online Shopping',
      merchant: 'Amazon',
      amount: 4500,
      category: 'Shopping',
      status: 'confirmed',
      transactionDate: new Date('2026-03-10')
    },
    // Staged and ignored transactions that MUST be excluded
    {
      _id: 'tx-staged-1',
      type: 'expense',
      title: 'Unreviewed SMS Debit',
      merchant: 'Pending Store',
      amount: 99999,
      category: 'Other',
      status: 'staged',
      transactionDate: new Date('2026-03-12')
    },
    {
      _id: 'tx-ignored-1',
      type: 'expense',
      title: 'Ignored Promo Payment',
      merchant: 'Spam Corp',
      amount: 50000,
      category: 'Other',
      status: 'ignored',
      transactionDate: new Date('2026-03-13')
    }
  ];

  describe('1. Sanitization & Confirmed Status Filter Primitives', () => {
    test('sanitizeAmount handles valid, invalid, and negative inputs safely', () => {
      expect(sanitizeAmount(1500)).toBe(1500);
      expect(sanitizeAmount('2500.50')).toBe(2500.5);
      expect(sanitizeAmount(-500)).toBe(0);
      expect(sanitizeAmount(null)).toBe(0);
      expect(sanitizeAmount(undefined)).toBe(0);
      expect(sanitizeAmount('invalid-number')).toBe(0);
    });

    test('filterConfirmedTransactions excludes staged and ignored transactions strictly', () => {
      const filtered = filterConfirmedTransactions(sampleTransactions);
      expect(filtered).toHaveLength(5);
      expect(filtered.some((t) => t.status === 'staged')).toBe(false);
      expect(filtered.some((t) => t.status === 'ignored')).toBe(false);
      expect(filtered.every((t) => t.status === 'confirmed')).toBe(true);
    });
  });

  describe('2. Core Financial Metrics Calculation', () => {
    test('calculates accurate income, expenses, net savings, and savings rate', () => {
      const metrics = calculateFinancialMetrics(sampleTransactions, mockBudget);

      expect(metrics.totalIncome).toBe(80000);
      expect(metrics.totalExpense).toBe(30000); // 18000 + 6000 + 1500 + 4500
      expect(metrics.netSavings).toBe(50000);
      expect(metrics.savingsRate).toBe(62.5); // (50000 / 80000) * 100
      expect(metrics.isDeficit).toBe(false);
      expect(metrics.monthlyBudget).toBe(50000);
      expect(metrics.budgetRemaining).toBe(20000); // 50000 - 30000
      expect(metrics.transactionCount).toBe(5);
      expect(metrics.incomeCount).toBe(1);
      expect(metrics.expenseCount).toBe(4);
    });

    test('handles edge case: zero transactions', () => {
      const metrics = calculateFinancialMetrics([], mockBudget);
      expect(metrics.totalIncome).toBe(0);
      expect(metrics.totalExpense).toBe(0);
      expect(metrics.netSavings).toBe(0);
      expect(metrics.savingsRate).toBe(0);
      expect(metrics.isDeficit).toBe(false);
      expect(metrics.transactionCount).toBe(0);
    });

    test('handles edge case: only income', () => {
      const incomeOnly = [
        { type: 'income', amount: 50000, status: 'confirmed' }
      ];
      const metrics = calculateFinancialMetrics(incomeOnly, mockBudget);
      expect(metrics.totalIncome).toBe(50000);
      expect(metrics.totalExpense).toBe(0);
      expect(metrics.netSavings).toBe(50000);
      expect(metrics.savingsRate).toBe(100);
      expect(metrics.isDeficit).toBe(false);
    });

    test('handles edge case: only expenses (cash deficit)', () => {
      const expenseOnly = [
        { type: 'expense', amount: 25000, status: 'confirmed' }
      ];
      const metrics = calculateFinancialMetrics(expenseOnly, mockBudget);
      expect(metrics.totalIncome).toBe(0);
      expect(metrics.totalExpense).toBe(25000);
      expect(metrics.netSavings).toBe(-25000);
      expect(metrics.savingsRate).toBe(0);
      expect(metrics.isDeficit).toBe(true);
    });

    test('handles edge case: expenses exceed income (negative savings rate prevention)', () => {
      const deficitTransactions = [
        { type: 'income', amount: 10000, status: 'confirmed' },
        { type: 'expense', amount: 15000, status: 'confirmed' }
      ];
      const metrics = calculateFinancialMetrics(deficitTransactions, mockBudget);
      expect(metrics.totalIncome).toBe(10000);
      expect(metrics.totalExpense).toBe(15000);
      expect(metrics.netSavings).toBe(-5000);
      expect(metrics.savingsRate).toBe(-50);
      expect(metrics.isDeficit).toBe(true);
    });
  });

  describe('3. Category Spending & Budget Utilization', () => {
    test('aggregates category spend, percent share, and checks category limits', () => {
      const categories = calculateCategorySpending(sampleTransactions, mockBudget);

      expect(categories).toHaveLength(3); // Rent, Food, Shopping

      // Highest spend category first: Rent (18000)
      expect(categories[0].category).toBe('Rent');
      expect(categories[0].amount).toBe(18000);
      expect(categories[0].percentage).toBe(60.0); // 18000 / 30000
      expect(categories[0].count).toBe(1);
      expect(categories[0].averageTicket).toBe(18000);
      expect(categories[0].budgetLimit).toBe(20000);
      expect(categories[0].budgetUtilization).toBe(90.0);
      expect(categories[0].isOverBudget).toBe(false);

      // Second: Food (6000 + 1500 = 7500)
      expect(categories[1].category).toBe('Food');
      expect(categories[1].amount).toBe(7500);
      expect(categories[1].percentage).toBe(25.0);
      expect(categories[1].count).toBe(2);
      expect(categories[1].averageTicket).toBe(3750);
      expect(categories[1].budgetLimit).toBe(12000);
      expect(categories[1].budgetUtilization).toBe(62.5);
      expect(categories[1].isOverBudget).toBe(false);

      // Third: Shopping (4500)
      expect(categories[2].category).toBe('Shopping');
      expect(categories[2].amount).toBe(4500);
      expect(categories[2].percentage).toBe(15.0);
      expect(categories[2].budgetLimit).toBe(5000);
      expect(categories[2].budgetUtilization).toBe(90.0);
    });

    test('flags category budget overruns accurately', () => {
      const tightBudget = {
        categoryBudgets: [
          { category: 'Food', limit: 5000 } // lower than 7500 spent
        ]
      };
      const categories = calculateCategorySpending(sampleTransactions, tightBudget);
      const food = categories.find((c) => c.category === 'Food');
      expect(food.isOverBudget).toBe(true);
      expect(food.budgetUtilization).toBe(150.0);
    });

    test('handles empty expenses cleanly', () => {
      const categories = calculateCategorySpending([], mockBudget);
      expect(categories).toEqual([]);
    });
  });

  describe('4. Merchant Spending Analytics', () => {
    test('aggregates merchant spend, ticket counts, and average spend', () => {
      const merchants = calculateMerchantAnalytics(sampleTransactions, { limit: 10 });

      expect(merchants).toHaveLength(4);
      expect(merchants[0].merchant).toBe('Landlord');
      expect(merchants[0].totalSpend).toBe(18000);
      expect(merchants[0].count).toBe(1);
      expect(merchants[0].averageTicket).toBe(18000);
      expect(merchants[0].percentage).toBe(60.0);

      expect(merchants[1].merchant).toBe('DMart');
      expect(merchants[1].totalSpend).toBe(6000);

      expect(merchants[2].merchant).toBe('Amazon');
      expect(merchants[2].totalSpend).toBe(4500);

      expect(merchants[3].merchant).toBe('Swiggy');
      expect(merchants[3].totalSpend).toBe(1500);
    });

    test('respects limit parameter and fallback merchant titles', () => {
      const transactions = [
        { type: 'expense', title: 'Coffee Cafe', amount: 200, status: 'confirmed' },
        { type: 'expense', title: 'Bakery', amount: 300, status: 'confirmed' }
      ];
      const merchants = calculateMerchantAnalytics(transactions, { limit: 1 });
      expect(merchants).toHaveLength(1);
      expect(merchants[0].merchant).toBe('Bakery');
    });
  });

  describe('5. Anomaly Detection Engine', () => {
    test('detects budget shock when a single expense is >= 40% of monthly budget', () => {
      const shockTransactions = [
        {
          _id: 'tx-shock-1',
          type: 'expense',
          title: 'Luxury Watch Purchase',
          merchant: 'Rolex Store',
          amount: 25000, // 50% of 50000 monthly budget
          category: 'Shopping',
          status: 'confirmed',
          transactionDate: new Date('2026-03-15')
        }
      ];

      const anomalies = detectAnomalies(shockTransactions, mockBudget);
      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].anomalyType).toBe('BUDGET_SHOCK');
      expect(anomalies[0].severity).toBe('MEDIUM');
      expect(anomalies[0].amount).toBe(25000);
    });

    test('detects statistical outliers in category spend', () => {
      const outlierCategoryTransactions = [
        { type: 'expense', title: 'Lunch', amount: 150, category: 'Food', status: 'confirmed' },
        { type: 'expense', title: 'Snacks', amount: 200, category: 'Food', status: 'confirmed' },
        { type: 'expense', title: 'Groceries', amount: 300, category: 'Food', status: 'confirmed' },
        { type: 'expense', title: 'Dinner', amount: 250, category: 'Food', status: 'confirmed' },
        {
          _id: 'tx-outlier-1',
          type: 'expense',
          title: 'Lavish Feast Party',
          merchant: '5-Star Hotel',
          amount: 8500, // Massive statistical outlier
          category: 'Food',
          status: 'confirmed',
          transactionDate: new Date('2026-03-20')
        }
      ];

      const anomalies = detectAnomalies(outlierCategoryTransactions, { monthlyBudget: 100000 });
      const foodAnomaly = anomalies.find((a) => a.category === 'Food');
      expect(foodAnomaly).toBeDefined();
      expect(foodAnomaly.anomalyType).toBe('CATEGORY_OUTLIER');
      expect(foodAnomaly.amount).toBe(8500);
    });

    test('returns empty anomalies when no transactions or expenses exist', () => {
      expect(detectAnomalies([], mockBudget)).toEqual([]);
    });
  });

  describe('6. Expense Forecasting & Budget Velocity Risk', () => {
    test('calculates run-rate and classifies budget risk as SAFE when spend is disciplined', () => {
      // March 15 (15 days elapsed in 31-day month). Spent 15,000 -> Burn rate 1000/day -> Projected 31,000 against 50,000 budget
      const refDate = new Date('2026-03-15T12:00:00.000Z');
      const currentTx = [
        { type: 'expense', amount: 15000, status: 'confirmed', transactionDate: new Date('2026-03-10') }
      ];

      const forecast = calculateForecastAndRisk({
        currentTransactions: currentTx,
        historicalTransactions: [],
        budget: mockBudget,
        referenceDate: refDate
      });

      expect(forecast.currentMonthExpense).toBe(15000);
      expect(forecast.daysElapsed).toBe(15);
      expect(forecast.totalDaysInMonth).toBe(31);
      expect(forecast.dailyBurnRate).toBe(1000);
      expect(forecast.runRateProjection).toBe(31000);
      expect(forecast.projectedExpense).toBe(31000);
      expect(forecast.budgetVelocity).toBe(0.62); // 31000 / 50000
      expect(forecast.riskLevel).toBe('SAFE');
      expect(forecast.confidence).toBeGreaterThanOrEqual(50);
    });

    test('classifies budget risk as CRITICAL when pace exceeds monthly budget', () => {
      // March 10 (10 days elapsed in 31-day month). Spent 25,000 on a 30,000 budget -> Burn rate 2500/day -> Projected 77,500
      const refDate = new Date('2026-03-10T12:00:00.000Z');
      const tightBudget = { monthlyBudget: 30000 };
      const currentTx = [
        { type: 'expense', amount: 25000, status: 'confirmed', transactionDate: new Date('2026-03-08') }
      ];

      const forecast = calculateForecastAndRisk({
        currentTransactions: currentTx,
        historicalTransactions: [],
        budget: tightBudget,
        referenceDate: refDate
      });

      expect(forecast.runRateProjection).toBe(77500);
      expect(forecast.budgetVelocity).toBe(2.58);
      expect(forecast.riskLevel).toBe('CRITICAL');
    });

    test('blends historical monthly expense average with current run-rate', () => {
      const refDate = new Date('2026-03-15T12:00:00.000Z');
      const currentTx = [
        { type: 'expense', amount: 15000, status: 'confirmed' } // run-rate = 31000
      ];
      const histTx = [
        { type: 'expense', amount: 20000, status: 'confirmed', transactionDate: new Date('2026-01-15') },
        { type: 'expense', amount: 20000, status: 'confirmed', transactionDate: new Date('2026-02-15') }
      ]; // hist avg = 20000

      const forecast = calculateForecastAndRisk({
        currentTransactions: currentTx,
        historicalTransactions: histTx,
        budget: mockBudget,
        referenceDate: refDate
      });

      // 70% of 31000 (21700) + 30% of 20000 (6000) = 27700
      expect(forecast.projectedExpense).toBe(27700);
      expect(forecast.historicalAverageExpense).toBe(20000);
      expect(forecast.forecastMethod).toContain('Blended');
    });

    test('handles first day of month safely (prevent division by zero)', () => {
      const refDate = new Date('2026-03-01T00:00:00.000Z');
      const currentTx = [
        { type: 'expense', amount: 500, status: 'confirmed' }
      ];

      const forecast = calculateForecastAndRisk({
        currentTransactions: currentTx,
        historicalTransactions: [],
        budget: mockBudget,
        referenceDate: refDate
      });

      expect(forecast.daysElapsed).toBe(1);
      expect(forecast.dailyBurnRate).toBe(500);
      expect(forecast.runRateProjection).toBe(15500); // 500 * 31
    });
  });

  describe('7. Banking Intelligence Summary Snapshot Assembler', () => {
    test('assembles complete summary payload cleanly', () => {
      const summary = calculateBankingIntelligenceSummary({
        currentTransactions: sampleTransactions,
        historicalTransactions: [],
        budget: mockBudget,
        referenceDate: new Date('2026-03-15')
      });

      expect(summary).toHaveProperty('metrics');
      expect(summary).toHaveProperty('categorySpending');
      expect(summary).toHaveProperty('topMerchants');
      expect(summary).toHaveProperty('anomalies');
      expect(summary).toHaveProperty('forecast');

      expect(summary.metrics.totalIncome).toBe(80000);
      expect(summary.categorySpending.length).toBe(3);
      expect(summary.topMerchants.length).toBeLessThanOrEqual(5);
    });
  });

  describe('8. Query Parsing Utility (parseMonthQuery)', () => {
    test('parses valid YYYY-MM query correctly', () => {
      const res = parseMonthQuery('2026-04');
      expect(res.year).toBe(2026);
      expect(res.month).toBe(4);
      expect(res.monthKey).toBe('2026-04');
      expect(res.startDate.getFullYear()).toBe(2026);
      expect(res.startDate.getMonth()).toBe(3); // April is 3
      expect(res.startDate.getDate()).toBe(1);
      expect(res.endDate.getDate()).toBe(30); // 30 days in April
    });

    test('falls back gracefully to current month when query is missing or invalid', () => {
      const now = new Date();
      const res = parseMonthQuery('invalid-format');
      expect(res.year).toBe(now.getFullYear());
      expect(res.month).toBe(now.getMonth() + 1);
    });
  });
});
