import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../app.js';
import Transaction from '../models/Transaction.js';
import {
  generateMonthSeries,
  getSeriesDateBounds,
  calculateSafePercentageChange,
  calculateMoMComparison,
  calculateSavingsMomentum,
  calculateCategoryTrends,
  calculateExtremes,
  calculateMultiMonthTrends
} from '../services/trendIntelligenceService.js';

describe('Phase 7.4: Multi-Month Financial Trends & Comparative Intelligence (trendIntelligence.test.js)', () => {
  const JWT_SECRET = 'test_jwt_secret_key_1234567890abcdef';
  const userAId = new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9fd1');
  const userBId = new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9fd2');

  const tokenUserA = jwt.sign({ id: userAId.toString() }, JWT_SECRET, { expiresIn: '1d' });
  const tokenUserB = jwt.sign({ id: userBId.toString() }, JWT_SECRET, { expiresIn: '1d' });

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Month Series Generation & Date Bounds', () => {
    it('should generate an ordered 6-month sequence ending in referenceMonth', () => {
      const series = generateMonthSeries('2026-09', 6);
      expect(series).toEqual(['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']);
    });

    it('should generate an ordered 12-month sequence ending in referenceMonth', () => {
      const series = generateMonthSeries('2026-09', 12);
      expect(series).toHaveLength(12);
      expect(series[0]).toBe('2025-10');
      expect(series[11]).toBe('2026-09');
    });

    it('should calculate proper ISO Date bounds for a series', () => {
      const series = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
      const bounds = getSeriesDateBounds(series);
      expect(bounds.startDate.getFullYear()).toBe(2026);
      expect(bounds.startDate.getMonth()).toBe(3); // April (0-indexed)
      expect(bounds.startDate.getDate()).toBe(1);
      expect(bounds.endDate.getFullYear()).toBe(2026);
      expect(bounds.endDate.getMonth()).toBe(8); // September (0-indexed)
    });
  });

  describe('2. Safe Percentage Calculation & Zero Denominator Protection', () => {
    it('should calculate standard positive and negative percentage changes', () => {
      expect(calculateSafePercentageChange(120, 100)).toBe(20);
      expect(calculateSafePercentageChange(80, 100)).toBe(-20);
    });

    it('should never return NaN or Infinity when previous is zero', () => {
      expect(calculateSafePercentageChange(500, 0)).toBe(100);
      expect(calculateSafePercentageChange(0, 0)).toBe(0);
      expect(Number.isFinite(calculateSafePercentageChange(500, 0))).toBe(true);
      expect(Number.isNaN(calculateSafePercentageChange(0, 0))).toBe(false);
    });
  });

  describe('3. Month-over-Month Comparison', () => {
    it('should calculate MoM income, expense, and savings changes accurately', () => {
      const cur = { month: '2026-09', income: 10925, expenses: 825, netSavings: 10100 };
      const prev = { month: '2026-08', income: 8000, expenses: 1200, netSavings: 6800 };

      const mom = calculateMoMComparison(cur, prev);
      expect(mom.currentMonth).toBe('2026-09');
      expect(mom.previousMonth).toBe('2026-08');
      expect(mom.income.change).toBe(2925);
      expect(mom.income.percentageChange).toBe(36.56);
      expect(mom.expenses.change).toBe(-375);
      expect(mom.expenses.percentageChange).toBe(-31.25);
      expect(mom.savings.change).toBe(3300);
      expect(mom.savings.percentageChange).toBe(48.53);
    });
  });

  describe('4. Savings Momentum Indicator', () => {
    it('should return INSUFFICIENT_DATA when fewer than 2 active months exist', () => {
      const snapshots = [
        { month: '2026-08', income: 0, expenses: 0, netSavings: 0, savingsRate: 0, transactionCount: 0 },
        { month: '2026-09', income: 5000, expenses: 2000, netSavings: 3000, savingsRate: 60, transactionCount: 2 }
      ];
      const res = calculateSavingsMomentum(snapshots);
      expect(res.state).toBe('INSUFFICIENT_DATA');
    });

    it('should return IMPROVING when savings rate and net surplus trend upward', () => {
      const snapshots = [
        { month: '2026-07', income: 10000, expenses: 6000, netSavings: 4000, savingsRate: 40, transactionCount: 3 },
        { month: '2026-08', income: 10000, expenses: 5000, netSavings: 5000, savingsRate: 50, transactionCount: 3 },
        { month: '2026-09', income: 10000, expenses: 3000, netSavings: 7000, savingsRate: 70, transactionCount: 3 }
      ];
      const res = calculateSavingsMomentum(snapshots);
      expect(res.state).toBe('IMPROVING');
      expect(res.savingsRateDelta).toBe(20);
      expect(res.netSavingsDelta).toBe(2000);
    });

    it('should return DECLINING when savings drop noticeably into deficit', () => {
      const snapshots = [
        { month: '2026-08', income: 10000, expenses: 4000, netSavings: 6000, savingsRate: 60, transactionCount: 3 },
        { month: '2026-09', income: 8000, expenses: 10000, netSavings: -2000, savingsRate: -25, transactionCount: 4 }
      ];
      const res = calculateSavingsMomentum(snapshots);
      expect(res.state).toBe('DECLINING');
      expect(res.netSavingsDelta).toBe(-8000);
    });
  });

  describe('5. Category Trends & Extremes', () => {
    it('should identify growing, declining, and new categories', () => {
      const monthList = ['2026-07', '2026-08', '2026-09'];
      const mockTxs = [
        // Shopping: 300 in Jul, 500 in Aug, 800 in Sep -> increasing
        { status: 'confirmed', type: 'expense', category: 'Shopping', amount: 300, transactionDate: new Date('2026-07-10') },
        { status: 'confirmed', type: 'expense', category: 'Shopping', amount: 500, transactionDate: new Date('2026-08-10') },
        { status: 'confirmed', type: 'expense', category: 'Shopping', amount: 800, transactionDate: new Date('2026-09-10') },
        // Dining: 600 in Jul, 400 in Aug, 150 in Sep -> decreasing
        { status: 'confirmed', type: 'expense', category: 'Dining', amount: 600, transactionDate: new Date('2026-07-15') },
        { status: 'confirmed', type: 'expense', category: 'Dining', amount: 400, transactionDate: new Date('2026-08-15') },
        { status: 'confirmed', type: 'expense', category: 'Dining', amount: 150, transactionDate: new Date('2026-09-15') },
        // Travel: 0 in Aug, 500 in Sep -> new
        { status: 'confirmed', type: 'expense', category: 'Travel', amount: 500, transactionDate: new Date('2026-09-20') }
      ];

      const res = calculateCategoryTrends(mockTxs, monthList);
      expect(res).toHaveLength(3);

      const shopping = res.find((c) => c.category === 'Shopping');
      expect(shopping.trend).toBe('increasing');
      expect(shopping.totalSpending).toBe(1600);
      expect(shopping.latestMonthSpending).toBe(800);
      expect(shopping.previousMonthSpending).toBe(500);

      const dining = res.find((c) => c.category === 'Dining');
      expect(dining.trend).toBe('decreasing');
      expect(dining.change).toBe(-250);

      const travel = res.find((c) => c.category === 'Travel');
      expect(travel.trend).toBe('new');
    });

    it('should find highest/lowest expense and highest income/savings months', () => {
      const snapshots = [
        { month: '2026-06', income: 15000, expenses: 8000, netSavings: 7000, transactionCount: 3 },
        { month: '2026-07', income: 20000, expenses: 12000, netSavings: 8000, transactionCount: 4 },
        { month: '2026-08', income: 18000, expenses: 5000, netSavings: 13000, transactionCount: 3 },
        { month: '2026-09', income: 25000, expenses: 9000, netSavings: 16000, transactionCount: 5 }
      ];

      const extremes = calculateExtremes(snapshots);
      expect(extremes.highestExpenseMonth).toEqual({ month: '2026-07', amount: 12000 });
      expect(extremes.lowestExpenseMonth).toEqual({ month: '2026-08', amount: 5000 });
      expect(extremes.highestIncomeMonth).toEqual({ month: '2026-09', amount: 25000 });
      expect(extremes.highestSavingsMonth).toEqual({ month: '2026-09', amount: 16000 });
    });
  });

  describe('6. End-to-End Trend Intelligence (calculateMultiMonthTrends)', () => {
    it('should calculate 6-month trends strictly scoped to user and confirmed transactions, excluding transfers', async () => {
      const mockTxs = [
        // User A Confirmed Income
        {
          _id: 'tx_1',
          userId: userAId,
          title: 'Salary August',
          amount: 50000,
          type: 'income',
          category: 'Salary',
          status: 'confirmed',
          transactionDate: new Date('2026-08-01')
        },
        {
          _id: 'tx_2',
          userId: userAId,
          title: 'Salary September',
          amount: 55000,
          type: 'income',
          category: 'Salary',
          status: 'confirmed',
          transactionDate: new Date('2026-09-01')
        },
        // User A Confirmed Expense
        {
          _id: 'tx_3',
          userId: userAId,
          title: 'Rent August',
          amount: 15000,
          type: 'expense',
          category: 'Rent',
          status: 'confirmed',
          transactionDate: new Date('2026-08-05')
        },
        {
          _id: 'tx_4',
          userId: userAId,
          title: 'Rent September',
          amount: 15000,
          type: 'expense',
          category: 'Rent',
          status: 'confirmed',
          transactionDate: new Date('2026-09-05')
        },
        {
          _id: 'tx_5',
          userId: userAId,
          title: 'Shopping September',
          amount: 5000,
          type: 'expense',
          category: 'Shopping',
          status: 'confirmed',
          transactionDate: new Date('2026-09-12')
        },
        // Transfer should be strictly excluded
        {
          _id: 'tx_6',
          userId: userAId,
          title: 'Account Transfer',
          amount: 20000,
          type: 'transfer',
          category: 'Transfer',
          status: 'confirmed',
          transactionDate: new Date('2026-09-15')
        },
        // Staged transaction should be strictly excluded
        {
          _id: 'tx_7',
          userId: userAId,
          title: 'Pending Bonus',
          amount: 10000,
          type: 'income',
          category: 'Bonus',
          status: 'staged',
          transactionDate: new Date('2026-09-20')
        },
        // User B transaction should be strictly excluded
        {
          _id: 'tx_8',
          userId: userBId,
          title: 'User B Expense',
          amount: 30000,
          type: 'expense',
          category: 'Shopping',
          status: 'confirmed',
          transactionDate: new Date('2026-09-10')
        }
      ];

      const result = await calculateMultiMonthTrends({
        userId: userAId,
        range: '6m',
        referenceMonth: '2026-09',
        transactions: mockTxs
      });

      expect(result.success).toBe(true);
      expect(result.range).toBe('6m');
      expect(result.months).toHaveLength(6);

      const aug = result.months.find((m) => m.month === '2026-08');
      expect(aug.income).toBe(50000);
      expect(aug.expenses).toBe(15000);
      expect(aug.netSavings).toBe(35000);
      expect(aug.savingsRate).toBe(70);

      const sep = result.months.find((m) => m.month === '2026-09');
      expect(sep.income).toBe(55000);
      expect(sep.expenses).toBe(20000);
      expect(sep.netSavings).toBe(35000);
      expect(sep.savingsRate).toBe(63.64);

      // MoM comparison
      expect(result.comparison.income.change).toBe(5000);
      expect(result.comparison.expenses.change).toBe(5000);
      expect(result.summary.incomeTrend).toBe('increasing');
      expect(result.summary.expenseTrend).toBe('increasing');
    });

    it('should gracefully handle empty transactions set without errors', async () => {
      const result = await calculateMultiMonthTrends({
        userId: userAId,
        range: '6m',
        referenceMonth: '2026-09',
        transactions: []
      });

      expect(result.success).toBe(true);
      expect(result.months).toHaveLength(6);
      expect(result.months[0].income).toBe(0);
      expect(result.months[0].expenses).toBe(0);
      expect(result.momentum.state).toBe('INSUFFICIENT_DATA');
      expect(result.categories).toHaveLength(0);
    });
  });

  describe('7. GET /api/intelligence/trends API Endpoint', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/intelligence/trends');
      expect(res.status).toBe(401);
    });

    it('should return 200 with multi-month trends payload for authenticated user', async () => {
      const mockFindQuery = {
        sort: jest.fn().mockResolvedValueOnce([
          {
            _id: new mongoose.Types.ObjectId(),
            userId: userAId,
            title: 'Salary',
            amount: 60000,
            type: 'income',
            category: 'Salary',
            status: 'confirmed',
            transactionDate: new Date('2026-09-01')
          },
          {
            _id: new mongoose.Types.ObjectId(),
            userId: userAId,
            title: 'Groceries',
            amount: 8000,
            type: 'expense',
            category: 'Food',
            status: 'confirmed',
            transactionDate: new Date('2026-09-05')
          }
        ])
      };

      jest.spyOn(Transaction, 'find').mockReturnValueOnce(mockFindQuery);

      const res = await request(app)
        .get('/api/intelligence/trends?range=6m&referenceMonth=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.range).toBe('6m');
      expect(Array.isArray(res.body.months)).toBe(true);
      expect(res.body.months).toHaveLength(6);
      expect(res.body.comparison).toBeDefined();
      expect(res.body.categories).toBeDefined();
      expect(res.body.momentum).toBeDefined();
      expect(res.body.summary).toBeDefined();
    });
  });
});
