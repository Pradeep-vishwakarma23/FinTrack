import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../app.js';
import Goal from '../models/Goal.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import {
  calculateRemainingAmount,
  calculateMonthsRemaining,
  calculateRequiredMonthlySavings,
  calculateProgressPercentage,
  calculateFeasibility,
  enrichGoalWithCalculations
} from '../services/goalService.js';

describe('Phase 6.4.1: Goals Deterministic Calculations & API Suite', () => {
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

  // =================================================================
  // 1. PURE DETERMINISTIC GOAL SERVICE UNIT TESTS
  // =================================================================
  describe('Deterministic Goal Calculations (goalService.js)', () => {
    describe('calculateRemainingAmount', () => {
      it('calculates remaining amount correctly when target > current', () => {
        expect(calculateRemainingAmount({ targetAmount: 50000, currentAmount: 15000 })).toBe(35000);
      });

      it('returns 0 when current amount equals target amount', () => {
        expect(calculateRemainingAmount({ targetAmount: 50000, currentAmount: 50000 })).toBe(0);
      });

      it('returns 0 when current amount exceeds target amount (overachievement)', () => {
        expect(calculateRemainingAmount({ targetAmount: 50000, currentAmount: 65000 })).toBe(0);
      });

      it('handles zero, negative, and invalid parameters safely', () => {
        expect(calculateRemainingAmount({ targetAmount: 0, currentAmount: 100 })).toBe(0);
        expect(calculateRemainingAmount({ targetAmount: 50000, currentAmount: -100 })).toBe(50000);
        expect(calculateRemainingAmount()).toBe(0);
      });
    });

    describe('calculateMonthsRemaining', () => {
      it('calculates months remaining between reference date and future date', () => {
        const ref = '2026-09-15';
        const target = '2026-12-31'; // Sep, Oct, Nov, Dec = 4 months
        expect(calculateMonthsRemaining({ targetDate: target, referenceDate: ref })).toBe(4);
      });

      it('returns 1 when target date is in the same month as reference date', () => {
        const ref = '2026-09-01';
        const target = '2026-09-30';
        expect(calculateMonthsRemaining({ targetDate: target, referenceDate: ref })).toBe(1);
      });

      it('returns 0 when target date is in the past (overdue)', () => {
        const ref = '2026-09-15';
        const target = '2026-08-31';
        expect(calculateMonthsRemaining({ targetDate: target, referenceDate: ref })).toBe(0);
      });

      it('handles invalid date strings gracefully', () => {
        expect(calculateMonthsRemaining({ targetDate: 'invalid-date' })).toBe(0);
        expect(calculateMonthsRemaining({})).toBe(0);
      });
    });

    describe('calculateRequiredMonthlySavings', () => {
      it('computes exact monthly savings needed to reach remaining balance', () => {
        // Remaining 30,000 across 6 months => 5,000 / month
        expect(calculateRequiredMonthlySavings({
          remainingAmount: 30000,
          monthsRemaining: 6
        })).toBe(5000);
      });

      it('returns 0 when goal is already completed (remainingAmount <= 0)', () => {
        expect(calculateRequiredMonthlySavings({
          remainingAmount: 0,
          monthsRemaining: 5
        })).toBe(0);
      });

      it('returns total remaining when months remaining is 0 (due/overdue)', () => {
        expect(calculateRequiredMonthlySavings({
          remainingAmount: 12500,
          monthsRemaining: 0
        })).toBe(12500);
      });
    });

    describe('calculateProgressPercentage', () => {
      it('calculates exact progress percentage capped at 100%', () => {
        expect(calculateProgressPercentage({ targetAmount: 10000, currentAmount: 2500 })).toBe(25);
        expect(calculateProgressPercentage({ targetAmount: 10000, currentAmount: 7500 })).toBe(75);
        expect(calculateProgressPercentage({ targetAmount: 10000, currentAmount: 10000 })).toBe(100);
        expect(calculateProgressPercentage({ targetAmount: 10000, currentAmount: 15000 })).toBe(100);
      });

      it('returns 0 for zero target or zero current amounts', () => {
        expect(calculateProgressPercentage({ targetAmount: 0, currentAmount: 500 })).toBe(0);
        expect(calculateProgressPercentage({ targetAmount: 5000, currentAmount: 0 })).toBe(0);
      });
    });

    describe('calculateFeasibility', () => {
      it('returns ACHIEVED when required monthly savings is 0', () => {
        const result = calculateFeasibility({ requiredMonthlySavings: 0, netMonthlySavings: 1000 });
        expect(result.status).toBe('ACHIEVED');
        expect(result.score).toBe(100);
      });

      it('returns UNFEASIBLE_DEFICIT when net monthly savings is negative or zero', () => {
        const result = calculateFeasibility({ requiredMonthlySavings: 2000, netMonthlySavings: -450 });
        expect(result.status).toBe('UNFEASIBLE_DEFICIT');
        expect(result.score).toBe(0);
      });

      it('returns HIGHLY_FEASIBLE when current surplus >= required savings', () => {
        const result = calculateFeasibility({ requiredMonthlySavings: 2000, netMonthlySavings: 3500 });
        expect(result.status).toBe('HIGHLY_FEASIBLE');
        expect(result.score).toBe(100);
      });

      it('returns MODERATELY_FEASIBLE when current surplus covers >= 70% of required savings', () => {
        const result = calculateFeasibility({ requiredMonthlySavings: 1000, netMonthlySavings: 750 });
        expect(result.status).toBe('MODERATELY_FEASIBLE');
        expect(result.score).toBe(75);
      });

      it('returns LOW_FEASIBILITY when current surplus covers < 70% of required savings', () => {
        const result = calculateFeasibility({ requiredMonthlySavings: 5000, netMonthlySavings: 1500 });
        expect(result.status).toBe('LOW_FEASIBILITY');
        expect(result.score).toBe(30);
      });
    });

    describe('enrichGoalWithCalculations', () => {
      it('attaches all computed fields to goal object', () => {
        const rawGoal = {
          _id: 'goal123',
          userId: userAId,
          title: 'Emergency Fund',
          targetAmount: 60000,
          currentAmount: 20000,
          targetDate: new Date('2026-12-31'),
          status: 'in_progress'
        };

        const enriched = enrichGoalWithCalculations(rawGoal, {
          referenceDate: '2026-09-01',
          netMonthlySavings: 12000
        });

        expect(enriched.remainingAmount).toBe(40000);
        expect(enriched.progressPercentage).toBe(33.3);
        expect(enriched.monthsRemaining).toBe(4);
        expect(enriched.requiredMonthlySavings).toBe(10000);
        expect(enriched.isCompleted).toBe(false);
        expect(enriched.feasibility.status).toBe('HIGHLY_FEASIBLE');
      });
    });
  });

  // =================================================================
  // 2. GOAL ENDPOINTS INTEGRATION TESTS
  // =================================================================
  describe('Goal API Endpoints (/api/goals)', () => {
    it('returns 401 Unauthorized if no auth token is provided', async () => {
      const res = await request(app).get('/api/goals');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('creates a new financial goal with validation (POST /api/goals)', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);

      const mockGoalData = {
        _id: new mongoose.Types.ObjectId(),
        userId: userAId,
        title: 'MacBook Pro Fund',
        targetAmount: 150000,
        currentAmount: 30000,
        targetDate: futureDate,
        category: 'Electronics',
        priority: 'high',
        status: 'in_progress',
        notes: 'Saving for M3 Max'
      };

      jest.spyOn(Goal.prototype, 'save').mockResolvedValueOnce(mockGoalData);
      jest.spyOn(Transaction, 'find').mockResolvedValueOnce([]);
      jest.spyOn(Budget, 'findOne').mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          title: 'MacBook Pro Fund',
          targetAmount: 150000,
          currentAmount: 30000,
          targetDate: futureDate.toISOString(),
          category: 'Electronics',
          priority: 'high',
          notes: 'Saving for M3 Max'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('MacBook Pro Fund');
      expect(res.body.data.targetAmount).toBe(150000);
      expect(res.body.data.remainingAmount).toBe(120000);
      expect(res.body.data.progressPercentage).toBe(20);
    });

    it('validates required title on goal creation', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3);

      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          title: '',
          targetAmount: 50000,
          targetDate: futureDate.toISOString()
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Goal title is required');
    });

    it('rejects targetAmount <= 0 on goal creation', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3);

      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          title: 'Invalid Target',
          targetAmount: -500,
          targetDate: futureDate.toISOString()
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Target amount must be a positive number');
    });

    it('rejects negative currentAmount on goal creation', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3);

      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          title: 'Negative Balance',
          targetAmount: 50000,
          currentAmount: -200,
          targetDate: futureDate.toISOString()
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Current amount cannot be negative');
    });

    it('rejects target dates in the past on goal creation', async () => {
      const pastDate = new Date('2020-01-01');

      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          title: 'Past Target Date',
          targetAmount: 50000,
          targetDate: pastDate.toISOString()
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Target date must be in the future');
    });

    it('retrieves user goals with deterministic calculations (GET /api/goals)', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 4);

      const mockGoals = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          title: 'Vacation',
          targetAmount: 40000,
          currentAmount: 10000,
          targetDate: futureDate,
          status: 'in_progress',
          priority: 'medium',
          toObject() { return this; }
        }
      ];

      jest.spyOn(Goal, 'find').mockReturnValueOnce({
        sort: jest.fn().mockResolvedValueOnce(mockGoals)
      });
      jest.spyOn(Transaction, 'find').mockResolvedValueOnce([]);
      jest.spyOn(Budget, 'findOne').mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].remainingAmount).toBe(30000);
      expect(res.body.data[0].progressPercentage).toBe(25);
    });

    it('retrieves single goal by ID (GET /api/goals/:id)', async () => {
      const goalId = new mongoose.Types.ObjectId();
      const mockGoal = {
        _id: goalId,
        userId: userAId,
        title: 'Emergency Fund',
        targetAmount: 50000,
        currentAmount: 25000,
        targetDate: new Date('2027-01-01'),
        status: 'in_progress',
        toObject() { return this; }
      };

      jest.spyOn(Goal, 'findOne').mockResolvedValueOnce(mockGoal);
      jest.spyOn(Transaction, 'find').mockResolvedValueOnce([]);
      jest.spyOn(Budget, 'findOne').mockResolvedValueOnce(null);

      const res = await request(app)
        .get(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Emergency Fund');
      expect(res.body.data.remainingAmount).toBe(25000);
    });

    it('enforces user isolation: User B cannot access User A goal', async () => {
      const goalIdUserA = new mongoose.Types.ObjectId();

      // Query includes { _id: goalIdUserA, userId: userBId } which returns null
      jest.spyOn(Goal, 'findOne').mockResolvedValueOnce(null);

      const res = await request(app)
        .get(`/api/goals/${goalIdUserA}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Goal not found or does not belong to user');
    });

    it('updates goal properties (PUT /api/goals/:id)', async () => {
      const goalId = new mongoose.Types.ObjectId();
      const mockGoal = {
        _id: goalId,
        userId: userAId,
        title: 'Trip to Japan',
        targetAmount: 100000,
        currentAmount: 20000,
        targetDate: new Date('2027-05-01'),
        status: 'in_progress',
        save: jest.fn().mockResolvedValueOnce(true),
        toObject() { return this; }
      };

      jest.spyOn(Goal, 'findOne').mockResolvedValueOnce(mockGoal);
      jest.spyOn(Transaction, 'find').mockResolvedValueOnce([]);
      jest.spyOn(Budget, 'findOne').mockResolvedValueOnce(null);

      const res = await request(app)
        .put(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          currentAmount: 50000,
          priority: 'high'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockGoal.currentAmount).toBe(50000);
      expect(mockGoal.priority).toBe('high');
      expect(res.body.data.remainingAmount).toBe(50000);
      expect(res.body.data.progressPercentage).toBe(50);
    });

    it('auto-completes goal when currentAmount reaches targetAmount', async () => {
      const goalId = new mongoose.Types.ObjectId();
      const mockGoal = {
        _id: goalId,
        userId: userAId,
        title: 'Course Fee',
        targetAmount: 20000,
        currentAmount: 10000,
        targetDate: new Date('2027-01-01'),
        status: 'in_progress',
        save: jest.fn().mockResolvedValueOnce(true),
        toObject() { return this; }
      };

      jest.spyOn(Goal, 'findOne').mockResolvedValueOnce(mockGoal);
      jest.spyOn(Transaction, 'find').mockResolvedValueOnce([]);
      jest.spyOn(Budget, 'findOne').mockResolvedValueOnce(null);

      const res = await request(app)
        .put(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          currentAmount: 20000
        });

      expect(res.status).toBe(200);
      expect(mockGoal.status).toBe('completed');
      expect(res.body.data.isCompleted).toBe(true);
    });

    it('deletes user goal (DELETE /api/goals/:id)', async () => {
      const goalId = new mongoose.Types.ObjectId();

      jest.spyOn(Goal, 'deleteOne').mockResolvedValueOnce({ deletedCount: 1 });

      const res = await request(app)
        .delete(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted successfully');
    });

    it('returns 404 when deleting non-existent or other user goal', async () => {
      const goalId = new mongoose.Types.ObjectId();

      jest.spyOn(Goal, 'deleteOne').mockResolvedValueOnce({ deletedCount: 0 });

      const res = await request(app)
        .delete(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Goal not found');
    });
  });
});
