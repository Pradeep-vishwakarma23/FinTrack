import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import {
  getActionPlanKey,
  generateCandidateActionPlans,
  generateAndSaveActionPlans,
  getActionPlans,
  getActionPlanById,
  createActionPlan,
  updateActionPlan,
  deleteActionPlan,
  completeActionPlan,
  dismissActionPlan
} from '../services/actionPlanService.js';
import ActionPlan from '../models/ActionPlan.js';
import Goal from '../models/Goal.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';

describe('FinTrack Phase 7.5 - Action Plan Service Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId('60d0fe4f5311236168a109ca');
  const otherUserId = new mongoose.Types.ObjectId('60d0fe4f5311236168a109cb');

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setupMongooseMocks = ({
    transactions = [],
    goals = [],
    actionPlans = [],
    budget = null
  } = {}) => {
    jest.spyOn(Transaction, 'find').mockImplementation((query) => {
      const filtered = transactions.filter((t) => {
        if (query.userId && t.userId.toString() !== query.userId.toString()) return false;
        if (query.status && t.status !== query.status) return false;
        return true;
      });
      return {
        sort: jest.fn().mockResolvedValue(filtered),
        then: (resolve) => resolve(filtered)
      };
    });

    jest.spyOn(Goal, 'find').mockResolvedValue(goals);
    jest.spyOn(Budget, 'findOne').mockResolvedValue(budget);

    jest.spyOn(ActionPlan, 'find').mockImplementation((query) => {
      const filtered = actionPlans.filter((p) => {
        if (query.userId && p.userId.toString() !== query.userId.toString()) return false;
        if (query.status && typeof query.status === 'object' && query.status.$in) {
          if (!query.status.$in.includes(p.status)) return false;
        } else if (query.status && p.status !== query.status) {
          return false;
        }
        return true;
      });
      return {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(filtered),
        then: (resolve) => resolve(filtered)
      };
    });
  };

  describe('getActionPlanKey', () => {
    it('generates consistent deduplication keys based on actionType and target', () => {
      const catPlan = { actionType: 'REDUCE_CATEGORY', category: 'Shopping' };
      expect(getActionPlanKey(catPlan)).toBe('REDUCE_CATEGORY:shopping');

      const goalId = new mongoose.Types.ObjectId();
      const goalPlan = { actionType: 'GOAL_CONTRIBUTION', relatedGoalId: goalId };
      expect(getActionPlanKey(goalPlan)).toBe(`GOAL_CONTRIBUTION:${goalId.toString()}`);

      const recPlan = { actionType: 'REDUCE_RECURRING', metadata: { merchant: 'Netflix' } };
      expect(getActionPlanKey(recPlan)).toBe('REDUCE_RECURRING:netflix');

      const genPlan = { actionType: 'INCREASE_SAVINGS', title: 'Eliminate Monthly Cash Deficit' };
      expect(getActionPlanKey(genPlan)).toBe('INCREASE_SAVINGS:eliminate monthly cash deficit');
    });
  });

  describe('generateCandidateActionPlans', () => {
    it('generates HIGH priority deficit elimination plan when net savings is negative', async () => {
      const mockTxs = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          type: 'income',
          amount: 50000,
          category: 'Salary',
          status: 'confirmed',
          transactionDate: new Date('2026-09-05')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          type: 'expense',
          amount: 70000,
          category: 'Housing',
          status: 'confirmed',
          transactionDate: new Date('2026-09-10')
        }
      ];

      setupMongooseMocks({ transactions: mockTxs });

      const candidates = await generateCandidateActionPlans({ userId: mockUserId, month: '2026-09' });

      expect(candidates.length).toBeGreaterThan(0);
      const deficitPlan = candidates.find((c) => c.actionType === 'INCREASE_SAVINGS' && c.title.includes('Deficit'));
      expect(deficitPlan).toBeDefined();
      expect(deficitPlan.priority).toBe('HIGH');
      expect(deficitPlan.monthlyImpact).toBe(20000);
      expect(deficitPlan.potentialSixMonthImpact).toBe(120000);
      expect(deficitPlan.rationale).toContain('20,000');
    });

    it('generates REDUCE_CATEGORY plan for high-share expense category', async () => {
      const mockTxs = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          type: 'income',
          amount: 100000,
          category: 'Salary',
          status: 'confirmed',
          transactionDate: new Date('2026-09-05')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          type: 'expense',
          amount: 30000,
          category: 'Shopping',
          status: 'confirmed',
          transactionDate: new Date('2026-09-10')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          type: 'expense',
          amount: 10000,
          category: 'Groceries',
          status: 'confirmed',
          transactionDate: new Date('2026-09-15')
        }
      ];

      setupMongooseMocks({ transactions: mockTxs });

      const candidates = await generateCandidateActionPlans({ userId: mockUserId, month: '2026-09' });

      const shoppingPlan = candidates.find((c) => c.actionType === 'REDUCE_CATEGORY' && c.category === 'Shopping');
      expect(shoppingPlan).toBeDefined();
      expect(shoppingPlan.monthlyImpact).toBeGreaterThan(0);
      expect(shoppingPlan.potentialSixMonthImpact).toBe(shoppingPlan.monthlyImpact * 6);
      expect(shoppingPlan.priority).toBe('HIGH'); // >= 35% of 40k total expense is 75%
    });

    it('generates GOAL_CONTRIBUTION plan for active uncompleted goals', async () => {
      const mockGoal = {
        _id: new mongoose.Types.ObjectId(),
        userId: mockUserId,
        title: 'Emergency Reserve',
        targetAmount: 60000,
        currentAmount: 10000,
        targetDate: new Date('2027-03-31'),
        category: 'Emergency',
        status: 'in_progress',
        toObject() { return { ...this }; }
      };

      const mockTxs = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          type: 'income',
          amount: 80000,
          category: 'Salary',
          status: 'confirmed',
          transactionDate: new Date('2026-09-05')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          type: 'expense',
          amount: 40000,
          category: 'Rent',
          status: 'confirmed',
          transactionDate: new Date('2026-09-10')
        }
      ];

      setupMongooseMocks({ transactions: mockTxs, goals: [mockGoal] });

      const candidates = await generateCandidateActionPlans({ userId: mockUserId, month: '2026-09' });

      const goalPlan = candidates.find((c) => c.actionType === 'GOAL_CONTRIBUTION');
      expect(goalPlan).toBeDefined();
      expect(goalPlan.title).toContain('Emergency Reserve');
      expect(goalPlan.monthlyImpact).toBeGreaterThan(0);
      expect(goalPlan.relatedGoalId).toEqual(mockGoal._id);
    });
  });

  describe('generateAndSaveActionPlans & Deduplication', () => {
    it('skips duplicate active plans and inserts only unique candidates', async () => {
      const mockTxs = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          type: 'income',
          amount: 50000,
          category: 'Salary',
          status: 'confirmed',
          transactionDate: new Date('2026-09-05')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          type: 'expense',
          amount: 60000,
          category: 'Shopping',
          status: 'confirmed',
          transactionDate: new Date('2026-09-10')
        }
      ];

      const existingShoppingPlan = {
        _id: new mongoose.Types.ObjectId(),
        userId: mockUserId,
        title: 'Reduce Shopping Spending',
        actionType: 'REDUCE_CATEGORY',
        category: 'Shopping',
        status: 'ACTIVE'
      };

      setupMongooseMocks({ transactions: mockTxs, actionPlans: [existingShoppingPlan] });

      jest.spyOn(ActionPlan, 'insertMany').mockResolvedValueOnce([
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockUserId,
          title: 'Eliminate Monthly Cash Deficit',
          actionType: 'INCREASE_SAVINGS',
          status: 'ACTIVE'
        }
      ]);
      jest.spyOn(ActionPlan, 'countDocuments').mockResolvedValueOnce(2);

      const result = await generateAndSaveActionPlans({ userId: mockUserId, month: '2026-09' });

      expect(result.success).toBe(true);
      expect(result.skippedDuplicates.length).toBeGreaterThan(0);
      expect(result.skippedDuplicates[0].actionType).toBe('REDUCE_CATEGORY');
      expect(ActionPlan.insertMany).toHaveBeenCalled();
    });
  });

  describe('CRUD & User Isolation', () => {
    it('creates an action plan with pre-calculated six-month impact', async () => {
      const savedMock = {
        _id: new mongoose.Types.ObjectId(),
        userId: mockUserId,
        title: 'Cut Dining Out',
        actionType: 'REDUCE_CATEGORY',
        category: 'Food',
        monthlyImpact: 500,
        potentialSixMonthImpact: 3000,
        priority: 'MEDIUM',
        status: 'ACTIVE'
      };

      jest.spyOn(ActionPlan.prototype, 'save').mockResolvedValueOnce(savedMock);

      const plan = await createActionPlan({
        userId: mockUserId,
        title: 'Cut Dining Out',
        actionType: 'REDUCE_CATEGORY',
        category: 'Food',
        monthlyImpact: 500,
        priority: 'MEDIUM'
      });

      expect(plan.title).toBe('Cut Dining Out');
      expect(plan.monthlyImpact).toBe(500);
      expect(plan.potentialSixMonthImpact).toBe(3000);
    });

    it('enforces user isolation and rejects retrieving unowned plan', async () => {
      const actionId = new mongoose.Types.ObjectId().toString();
      jest.spyOn(ActionPlan, 'findOne').mockResolvedValueOnce(null);

      await expect(getActionPlanById({ userId: otherUserId, actionId })).rejects.toThrow('Action plan not found.');
    });

    it('completes and dismisses action plans updating status and timestamps', async () => {
      const actionId = new mongoose.Types.ObjectId().toString();
      const planDoc = {
        _id: actionId,
        userId: mockUserId,
        status: 'ACTIVE',
        save: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
      };

      jest.spyOn(ActionPlan, 'findOne').mockResolvedValue(planDoc);

      const completed = await completeActionPlan({ userId: mockUserId, actionId });
      expect(completed.status).toBe('COMPLETED');
      expect(completed.completedAt).toBeDefined();

      const dismissed = await dismissActionPlan({ userId: mockUserId, actionId });
      expect(dismissed.status).toBe('DISMISSED');
      expect(dismissed.dismissedAt).toBeDefined();
    });
  });
});
