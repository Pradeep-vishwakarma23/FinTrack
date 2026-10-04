import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import {
  getFinancialSummary,
  getCategorySpending,
  getMerchantSpending,
  getForecast,
  getBudgetRisk,
  getAnomalies,
  getGoalStatus
} from '../services/copilotTools.js';

describe('Phase 1: Copilot Deterministic Tools Suite (copilotTools.test.js)', () => {
  const userAId = new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9fd1');
  const userBId = new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9fd2');

  const mockTransactions = [
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'income',
      title: 'Salary Deposit',
      merchant: 'Tech Corp',
      amount: 100000,
      category: 'Salary',
      status: 'confirmed',
      transactionDate: new Date('2026-03-01')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      title: 'Apartment Rent',
      merchant: 'Landlord',
      amount: 25000,
      category: 'Rent',
      status: 'confirmed',
      transactionDate: new Date('2026-03-02')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      title: 'Supermarket Groceries',
      merchant: 'DMart',
      amount: 8000,
      category: 'Food',
      status: 'confirmed',
      transactionDate: new Date('2026-03-05')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      title: 'Online Shopping Order',
      merchant: 'Amazon',
      amount: 5000,
      category: 'Shopping',
      status: 'confirmed',
      transactionDate: new Date('2026-03-10')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      title: 'Second Online Shopping Order',
      merchant: 'Amazon',
      amount: 2000,
      category: 'Shopping',
      status: 'confirmed',
      transactionDate: new Date('2026-03-15')
    },
    // Staged transaction for User A (MUST BE EXCLUDED)
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      title: 'Unreviewed SMS',
      merchant: 'Pending Store',
      amount: 99999,
      category: 'Other',
      status: 'staged',
      transactionDate: new Date('2026-03-12')
    },
    // Ignored transaction for User A (MUST BE EXCLUDED)
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      title: 'Ignored Promo',
      merchant: 'Spam Store',
      amount: 50000,
      category: 'Other',
      status: 'ignored',
      transactionDate: new Date('2026-03-13')
    },
    // Transaction for User B (MUST BE EXCLUDED FOR USER A)
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userBId,
      type: 'expense',
      title: 'User B Expense',
      merchant: 'Secret Store',
      amount: 77777,
      category: 'Food',
      status: 'confirmed',
      transactionDate: new Date('2026-03-05')
    }
  ];

  const mockBudget = {
    userId: userAId,
    monthlyBudget: 50000,
    categoryBudgets: [
      { category: 'Rent', limit: 30000 },
      { category: 'Food', limit: 10000 },
      { category: 'Shopping', limit: 6000 }
    ]
  };

  const mockGoals = [
    {
      _id: new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9001'),
      userId: userAId,
      title: 'Emergency Fund',
      targetAmount: 120000,
      currentAmount: 60000,
      targetDate: new Date('2026-12-31'),
      category: 'Emergency',
      priority: 'high',
      status: 'in_progress'
    },
    {
      _id: new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9002'),
      userId: userAId,
      title: 'Vacation',
      targetAmount: 50000,
      currentAmount: 50000,
      targetDate: new Date('2026-06-30'),
      category: 'Travel',
      priority: 'medium',
      status: 'completed'
    }
  ];

  beforeEach(() => {
    jest.spyOn(Transaction, 'find').mockImplementation((query) => {
      const filtered = mockTransactions.filter((t) => {
        if (query.userId && t.userId.toString() !== query.userId.toString()) return false;
        if (query.status && t.status !== query.status) return false;
        if (query.transactionDate?.$gte && t.transactionDate < query.transactionDate.$gte) return false;
        if (query.transactionDate?.$lte && t.transactionDate > query.transactionDate.$lte) return false;
        if (query.transactionDate?.$lt && t.transactionDate >= query.transactionDate.$lt) return false;
        return true;
      });
      return {
        sort: jest.fn().mockResolvedValue(filtered),
        then: (resolve) => resolve(filtered)
      };
    });

    jest.spyOn(Budget, 'findOne').mockImplementation((query) => {
      if (query.userId && query.userId.toString() === userAId.toString()) {
        return Promise.resolve(mockBudget);
      }
      return Promise.resolve(null);
    });

    jest.spyOn(Goal, 'find').mockImplementation((query) => {
      const filtered = mockGoals.filter((g) => {
        if (query.userId && g.userId.toString() !== query.userId.toString()) return false;
        if (query.status?.$ne && g.status === query.status.$ne) return false;
        return true;
      });
      return {
        sort: jest.fn().mockResolvedValue(filtered),
        then: (resolve) => resolve(filtered)
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =================================================================
  // 1. getFinancialSummary
  // =================================================================
  describe('getFinancialSummary', () => {
    test('requires userId and throws error if missing', async () => {
      await expect(getFinancialSummary({})).rejects.toThrow('userId is required');
      await expect(getFinancialSummary({ userId: '' })).rejects.toThrow('userId is required');
    });

    test('returns accurate summary for confirmed transactions only', async () => {
      const res = await getFinancialSummary({ userId: userAId, month: '2026-03' });

      expect(res.provider).toBe('deterministic');
      expect(res.totalIncome).toBe(100000);
      // Expenses: 25000 (Rent) + 8000 (Food) + 5000 (Shopping) + 2000 (Shopping) = 40000
      expect(res.totalExpense).toBe(40000);
      expect(res.netSavings).toBe(60000);
      expect(res.savingsRate).toBe(60);
      expect(res.isDeficit).toBe(false);
      expect(res.monthlyBudget).toBe(50000);
      expect(res.budgetRemaining).toBe(10000);
      expect(res.transactionCount).toBe(5); // 1 income + 4 expenses
      expect(res.period).toBe('2026-03');
    });

    test('enforces strict user isolation (User B does not see User A transactions)', async () => {
      const resB = await getFinancialSummary({ userId: userBId, month: '2026-03' });
      expect(resB.totalExpense).toBe(77777);
      expect(resB.totalIncome).toBe(0);
      expect(resB.isDeficit).toBe(true);
      expect(resB.transactionCount).toBe(1);
    });

    test('handles empty month gracefully with zero totals and no crash', async () => {
      const emptyUserId = new mongoose.Types.ObjectId();
      const res = await getFinancialSummary({ userId: emptyUserId, month: '2026-03' });

      expect(res.totalIncome).toBe(0);
      expect(res.totalExpense).toBe(0);
      expect(res.netSavings).toBe(0);
      expect(res.savingsRate).toBe(0);
      expect(res.isDeficit).toBe(false);
      expect(res.transactionCount).toBe(0);
      expect(res.provider).toBe('deterministic');
    });

    test('handles zero income without NaN in savings rate', async () => {
      const zeroIncomeUserId = userBId;
      const res = await getFinancialSummary({ userId: zeroIncomeUserId, month: '2026-03' });
      expect(res.savingsRate).toBe(0);
      expect(isNaN(res.savingsRate)).toBe(false);
    });
  });

  // =================================================================
  // 2. getCategorySpending
  // =================================================================
  describe('getCategorySpending', () => {
    test('returns specific category metrics when category is supplied', async () => {
      const res = await getCategorySpending({
        userId: userAId,
        month: '2026-03',
        category: 'Shopping'
      });

      expect(res.provider).toBe('deterministic');
      expect(res.category).toBe('Shopping');
      expect(res.amount).toBe(7000); // 5000 + 2000
      expect(res.transactionCount).toBe(2);
      expect(res.budgetLimit).toBe(6000);
      expect(res.isOverBudget).toBe(true);
      expect(res.budgetUtilization).toBe(116.67);
      expect(res.percentage).toBe(17.5); // 7000 / 40000 = 17.5%
    });

    test('returns zero-amount result for unspent category with budget', async () => {
      const res = await getCategorySpending({
        userId: userAId,
        month: '2026-03',
        category: 'Entertainment'
      });

      expect(res.category).toBe('Entertainment');
      expect(res.amount).toBe(0);
      expect(res.percentage).toBe(0);
      expect(res.transactionCount).toBe(0);
      expect(res.isOverBudget).toBe(false);
      expect(res.provider).toBe('deterministic');
    });

    test('returns complete category breakdown when category is omitted', async () => {
      const res = await getCategorySpending({ userId: userAId, month: '2026-03' });

      expect(res.provider).toBe('deterministic');
      expect(Array.isArray(res.categories)).toBe(true);
      expect(res.categories.length).toBe(3); // Rent, Food, Shopping
      expect(res.categories[0].category).toBe('Rent');
      expect(res.categories[0].amount).toBe(25000);
      expect(res.categories[1].category).toBe('Food');
      expect(res.categories[1].amount).toBe(8000);
      expect(res.categories[2].category).toBe('Shopping');
      expect(res.categories[2].amount).toBe(7000);
    });
  });

  // =================================================================
  // 3. getMerchantSpending
  // =================================================================
  describe('getMerchantSpending', () => {
    test('returns specific merchant metrics when merchant is supplied', async () => {
      const res = await getMerchantSpending({
        userId: userAId,
        month: '2026-03',
        merchant: 'Amazon'
      });

      expect(res.provider).toBe('deterministic');
      expect(res.merchant).toBe('Amazon');
      expect(res.totalSpend).toBe(7000);
      expect(res.count).toBe(2);
      expect(res.averageTicket).toBe(3500);
    });

    test('returns zero totals for merchant with no transactions', async () => {
      const res = await getMerchantSpending({
        userId: userAId,
        month: '2026-03',
        merchant: 'Flipkart'
      });

      expect(res.merchant).toBe('Flipkart');
      expect(res.totalSpend).toBe(0);
      expect(res.count).toBe(0);
      expect(res.provider).toBe('deterministic');
    });

    test('returns top merchants when merchant is omitted with limit', async () => {
      const res = await getMerchantSpending({
        userId: userAId,
        month: '2026-03',
        limit: 2
      });

      expect(res.provider).toBe('deterministic');
      expect(Array.isArray(res.merchants)).toBe(true);
      expect(res.merchants.length).toBe(2);
      expect(res.merchants[0].merchant).toBe('Landlord');
      expect(res.merchants[0].totalSpend).toBe(25000);
      expect(res.merchants[1].merchant).toBe('DMart');
      expect(res.merchants[1].totalSpend).toBe(8000);
    });
  });

  // =================================================================
  // 4. getForecast
  // =================================================================
  describe('getForecast', () => {
    test('returns verified run-rate forecast metrics', async () => {
      const res = await getForecast({ userId: userAId, month: '2026-03' });

      expect(res.provider).toBe('deterministic');
      expect(typeof res.dailyBurnRate).toBe('number');
      expect(typeof res.projectedExpense).toBe('number');
      expect(typeof res.confidence).toBe('number');
      expect(typeof res.daysElapsed).toBe('number');
      expect(typeof res.daysRemaining).toBe('number');
      expect(res.period).toBe('2026-03');
    });

    test('handles empty transactions without crashing', async () => {
      const emptyUserId = new mongoose.Types.ObjectId();
      const res = await getForecast({ userId: emptyUserId, month: '2026-03' });

      expect(res.provider).toBe('deterministic');
      expect(res.projectedExpense).toBe(0);
      expect(res.dailyBurnRate).toBe(0);
    });
  });

  // =================================================================
  // 5. getBudgetRisk
  // =================================================================
  describe('getBudgetRisk', () => {
    test('returns verified budget velocity and risk metrics', async () => {
      const res = await getBudgetRisk({ userId: userAId, month: '2026-03' });

      expect(res.provider).toBe('deterministic');
      expect(res.monthlyBudget).toBe(50000);
      expect(res.budgetRemaining).toBe(10000);
      expect(typeof res.riskLevel).toBe('string');
      expect(res.riskDetails).toBeDefined();
    });

    test('handles missing budget gracefully', async () => {
      const noBudgetUserId = userBId;
      const res = await getBudgetRisk({ userId: noBudgetUserId, month: '2026-03' });

      expect(res.provider).toBe('deterministic');
      expect(res.monthlyBudget).toBe(0);
      expect(res.budgetVelocity).toBeNull();
    });
  });

  // =================================================================
  // 6. getAnomalies
  // =================================================================
  describe('getAnomalies', () => {
    test('returns detected anomalies for confirmed transactions only', async () => {
      const res = await getAnomalies({ userId: userAId, month: '2026-03' });

      expect(res.provider).toBe('deterministic');
      expect(Array.isArray(res.anomalies)).toBe(true);
      expect(typeof res.totalAnomaliesCount).toBe('number');
      // Verify staged and ignored transactions were not flagged
      const unreviewedAnomaly = res.anomalies.find((a) => a.title === 'Unreviewed SMS');
      expect(unreviewedAnomaly).toBeUndefined();
    });
  });

  // =================================================================
  // 7. getGoalStatus
  // =================================================================
  describe('getGoalStatus', () => {
    test('requires userId and throws error if missing', async () => {
      await expect(getGoalStatus({})).rejects.toThrow('userId is required');
    });

    test('returns active goals enriched with deterministic progress and feasibility', async () => {
      const res = await getGoalStatus({ userId: userAId, month: '2026-03' });

      expect(res.provider).toBe('deterministic');
      expect(Array.isArray(res.goals)).toBe(true);
      expect(res.goals.length).toBe(2);

      const emergencyGoal = res.goals.find((g) => g.title === 'Emergency Fund');
      expect(emergencyGoal).toBeDefined();
      expect(emergencyGoal.targetAmount).toBe(120000);
      expect(emergencyGoal.currentAmount).toBe(60000);
      expect(emergencyGoal.remainingAmount).toBe(60000);
      expect(emergencyGoal.progress).toBe(50);
      expect(typeof emergencyGoal.monthsRemaining).toBe('number');
      expect(typeof emergencyGoal.requiredMonthlySavings).toBe('number');
      expect(emergencyGoal.feasibility).toBeDefined();
      expect(emergencyGoal.isCompleted).toBe(false);
    });

    test('enforces zero mutation and read-only behavior', async () => {
      const saveSpy = jest.spyOn(Goal.prototype, 'save');
      await getGoalStatus({ userId: userAId, month: '2026-03' });
      expect(saveSpy).not.toHaveBeenCalled();
    });
  });
});
