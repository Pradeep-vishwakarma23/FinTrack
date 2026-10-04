import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import {
  generateMonthlyReport,
  isValidMonthFormat,
  parseMonthBounds
} from '../services/reportService.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import ActionPlan from '../models/ActionPlan.js';

describe('FinTrack Phase 9 - Report Service Tests', () => {
  const userAId = new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9fd1');
  const userBId = new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9fd2');

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Month Format & Bounds Validation', () => {
    it('validates standard YYYY-MM formatted month strings', () => {
      expect(isValidMonthFormat('2026-09')).toBe(true);
      expect(isValidMonthFormat('2025-01')).toBe(true);
      expect(isValidMonthFormat('2026-12')).toBe(true);

      expect(isValidMonthFormat('2026-13')).toBe(false);
      expect(isValidMonthFormat('2026-00')).toBe(false);
      expect(isValidMonthFormat('invalid')).toBe(false);
      expect(isValidMonthFormat('')).toBe(false);
      expect(isValidMonthFormat(null)).toBe(false);
      expect(isValidMonthFormat(12345)).toBe(false);
    });

    it('parses valid month bounds accurately', () => {
      const bounds = parseMonthBounds('2026-09');
      expect(bounds.year).toBe(2026);
      expect(bounds.monthNumber).toBe(9);
      expect(bounds.formattedMonth).toBe('2026-09');
      expect(bounds.startDate.toISOString()).toContain('2026-09-01');
      expect(bounds.endDate.toISOString()).toContain('2026-09-30');
    });

    it('throws error when parsing invalid month format', () => {
      expect(() => parseMonthBounds('invalid-month')).toThrow(
        'Invalid month format. Expected YYYY-MM'
      );
    });
  });

  describe('Report Summary & Aggregations', () => {
    it('calculates income, expenses, net savings, and savings rate deterministically', async () => {
      const mockTransactions = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'income',
          amount: 60000,
          status: 'confirmed',
          category: 'Salary',
          title: 'Monthly Tech Salary',
          transactionDate: new Date('2026-09-05T10:00:00.000Z')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 15000,
          status: 'confirmed',
          category: 'Rent & Housing',
          merchant: 'Apartment Owner',
          title: 'Apartment Rent',
          transactionDate: new Date('2026-09-06T10:00:00.000Z')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 5000,
          status: 'confirmed',
          category: 'Food & Dining',
          merchant: 'Swiggy',
          title: 'Swiggy Orders',
          transactionDate: new Date('2026-09-10T10:00:00.000Z')
        }
      ];

      const mockBudget = {
        userId: userAId,
        monthlyBudget: 25000
      };

      const mockGoals = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          name: 'Emergency Fund',
          targetAmount: 100000,
          currentAmount: 40000,
          targetDate: new Date('2027-03-31T00:00:00.000Z'),
          status: 'in_progress'
        }
      ];

      const mockActionPlans = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          title: 'Optimize Food & Dining',
          priority: 'HIGH',
          actionType: 'REDUCE_CATEGORY',
          category: 'Food & Dining',
          monthlyImpact: 1000,
          potentialSixMonthImpact: 6000,
          status: 'ACTIVE',
          rationale: 'Dining spend is higher than baseline.'
        }
      ];

      const sortMock = jest.fn().mockResolvedValue(mockTransactions);
      jest.spyOn(Transaction, 'find').mockReturnValue({ sort: sortMock });
      jest.spyOn(Budget, 'findOne').mockResolvedValue(mockBudget);
      jest.spyOn(Goal, 'find').mockResolvedValue(mockGoals);
      jest.spyOn(ActionPlan, 'find').mockResolvedValue(mockActionPlans);

      const report = await generateMonthlyReport({ userId: userAId, month: '2026-09' });

      // Financial Summary
      expect(report.summary.totalIncome).toBe(60000);
      expect(report.summary.totalExpenses).toBe(20000);
      expect(report.summary.netSavings).toBe(40000);
      expect(report.summary.savingsRate).toBe(66.67);

      // Categories
      expect(report.categories.length).toBe(2);
      expect(report.categories[0].category).toBe('Rent & Housing');
      expect(report.categories[0].amount).toBe(15000);
      expect(report.categories[0].percentage).toBe(75);

      // Top Merchants
      expect(report.merchants.length).toBe(2);
      expect(report.merchants[0].merchant).toBe('Apartment Owner');
      expect(report.merchants[0].totalSpending).toBe(15000);

      // Budget Performance
      expect(report.budget).not.toBeNull();
      expect(report.budget.monthlyBudget).toBe(25000);
      expect(report.budget.spent).toBe(20000);
      expect(report.budget.remaining).toBe(5000);
      expect(report.budget.utilization).toBe(80);
      expect(report.budget.riskLevel).toBe('Moderate');

      // Goals
      expect(report.goals.length).toBe(1);
      expect(report.goals[0].name).toBe('Emergency Fund');
      expect(report.goals[0].targetAmount).toBe(100000);
      expect(report.goals[0].currentAmount).toBe(40000);
      expect(report.goals[0].remainingAmount).toBe(60000);
      expect(report.goals[0].progressPercentage).toBe(40);

      // Action Plans
      expect(report.actionPlans.length).toBe(1);
      expect(report.actionPlans[0].title).toBe('Optimize Food & Dining');
      expect(report.actionPlans[0].potentialMonthlyImpact).toBe(1000);
      expect(report.actionPlans[0].potentialSixMonthImpact).toBe(6000);

      // Transaction Summary
      expect(report.transactionSummary.incomeTransactions).toBe(1);
      expect(report.transactionSummary.expenseTransactions).toBe(2);
      expect(report.transactionSummary.totalTransactions).toBe(3);
    });

    it('handles empty datasets safely with zeroed numbers and no NaNs or Infinities', async () => {
      const sortMock = jest.fn().mockResolvedValue([]);
      jest.spyOn(Transaction, 'find').mockReturnValue({ sort: sortMock });
      jest.spyOn(Budget, 'findOne').mockResolvedValue(null);
      jest.spyOn(Goal, 'find').mockResolvedValue([]);
      jest.spyOn(ActionPlan, 'find').mockResolvedValue([]);

      const report = await generateMonthlyReport({ userId: userAId, month: '2026-09' });

      expect(report.summary.totalIncome).toBe(0);
      expect(report.summary.totalExpenses).toBe(0);
      expect(report.summary.netSavings).toBe(0);
      expect(report.summary.savingsRate).toBe(0);
      expect(report.categories).toEqual([]);
      expect(report.merchants).toEqual([]);
      expect(report.budget).toBeNull();
      expect(report.goals).toEqual([]);
      expect(report.actionPlans).toEqual([]);
      expect(report.anomalies).toEqual([]);
      expect(report.transactionSummary.totalTransactions).toBe(0);
    });

    it('handles income-only datasets safely', async () => {
      const mockTransactions = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'income',
          amount: 50000,
          status: 'confirmed',
          category: 'Salary',
          title: 'Salary',
          transactionDate: new Date('2026-09-01T10:00:00.000Z')
        }
      ];

      const sortMock = jest.fn().mockResolvedValue(mockTransactions);
      jest.spyOn(Transaction, 'find').mockReturnValue({ sort: sortMock });
      jest.spyOn(Budget, 'findOne').mockResolvedValue(null);
      jest.spyOn(Goal, 'find').mockResolvedValue([]);
      jest.spyOn(ActionPlan, 'find').mockResolvedValue([]);

      const report = await generateMonthlyReport({ userId: userAId, month: '2026-09' });

      expect(report.summary.totalIncome).toBe(50000);
      expect(report.summary.totalExpenses).toBe(0);
      expect(report.summary.netSavings).toBe(50000);
      expect(report.summary.savingsRate).toBe(100);
      expect(report.categories).toEqual([]);
      expect(report.merchants).toEqual([]);
    });

    it('handles expense-only datasets (zero income deficit) safely', async () => {
      const mockTransactions = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 12000,
          status: 'confirmed',
          category: 'Groceries',
          merchant: 'Blinkit',
          title: 'Grocery delivery',
          transactionDate: new Date('2026-09-02T10:00:00.000Z')
        }
      ];

      const sortMock = jest.fn().mockResolvedValue(mockTransactions);
      jest.spyOn(Transaction, 'find').mockReturnValue({ sort: sortMock });
      jest.spyOn(Budget, 'findOne').mockResolvedValue(null);
      jest.spyOn(Goal, 'find').mockResolvedValue([]);
      jest.spyOn(ActionPlan, 'find').mockResolvedValue([]);

      const report = await generateMonthlyReport({ userId: userAId, month: '2026-09' });

      expect(report.summary.totalIncome).toBe(0);
      expect(report.summary.totalExpenses).toBe(12000);
      expect(report.summary.netSavings).toBe(-12000);
      expect(report.summary.savingsRate).toBe(0);
      expect(report.categories.length).toBe(1);
      expect(report.categories[0].percentage).toBe(100);
    });

    it('strictly enforces confirmed status filter and excludes staged or ignored transactions', async () => {
      const findSpy = jest.spyOn(Transaction, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });
      jest.spyOn(Budget, 'findOne').mockResolvedValue(null);
      jest.spyOn(Goal, 'find').mockResolvedValue([]);
      jest.spyOn(ActionPlan, 'find').mockResolvedValue([]);

      await generateMonthlyReport({ userId: userAId, month: '2026-09' });

      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userAId,
          status: 'confirmed'
        })
      );
    });

    it('enforces user isolation: queries with userId and never leaks other users data', async () => {
      const findSpy = jest.spyOn(Transaction, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });
      const budgetSpy = jest.spyOn(Budget, 'findOne').mockResolvedValue(null);
      const goalSpy = jest.spyOn(Goal, 'find').mockResolvedValue([]);
      const actionPlanSpy = jest.spyOn(ActionPlan, 'find').mockResolvedValue([]);

      await generateMonthlyReport({ userId: userBId, month: '2026-09' });

      expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({ userId: userBId }));
      expect(budgetSpy).toHaveBeenCalledWith(expect.objectContaining({ userId: userBId }));
      expect(goalSpy).toHaveBeenCalledWith(expect.objectContaining({ userId: userBId }));
      expect(actionPlanSpy).toHaveBeenCalledWith(expect.objectContaining({ userId: userBId }));
    });
  });
});
