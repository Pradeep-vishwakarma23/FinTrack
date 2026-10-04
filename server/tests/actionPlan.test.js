import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../app.js';
import ActionPlan from '../models/ActionPlan.js';
import Goal from '../models/Goal.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';

describe('FinTrack Phase 7.5 - Action Plan API Endpoints', () => {
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

  describe('Authentication & Protection', () => {
    it('returns 401 Unauthorized when accessing /api/action-plans without a token', async () => {
      const res = await request(app).get('/api/action-plans');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/action-plans', () => {
    it('returns 200 with list of action plans for the authenticated user', async () => {
      const mockPlans = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          title: 'Reduce Shopping Spending',
          actionType: 'REDUCE_CATEGORY',
          monthlyImpact: 500,
          priority: 'HIGH',
          status: 'ACTIVE'
        }
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce(mockPlans)
      };
      jest.spyOn(ActionPlan, 'find').mockReturnValueOnce(mockQuery);

      const res = await request(app)
        .get('/api/action-plans')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].title).toBe('Reduce Shopping Spending');
    });
  });

  describe('POST /api/action-plans', () => {
    it('creates a new action plan with 201 Created on valid input', async () => {
      const newPlanPayload = {
        title: 'Save on Dining',
        actionType: 'REDUCE_CATEGORY',
        category: 'Food & Dining',
        monthlyImpact: 600,
        priority: 'MEDIUM'
      };

      const planDoc = {
        _id: new mongoose.Types.ObjectId(),
        userId: userAId,
        ...newPlanPayload,
        potentialSixMonthImpact: 3600,
        status: 'ACTIVE',
        save: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
      };

      jest.spyOn(ActionPlan.prototype, 'save').mockResolvedValueOnce(planDoc);

      const res = await request(app)
        .post('/api/action-plans')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(newPlanPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.monthlyImpact).toBe(600);
    });

    it('returns 400 Bad Request when required title or actionType is missing', async () => {
      const res = await request(app)
        .post('/api/action-plans')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ category: 'Food' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/action-plans/generate', () => {
    it('triggers deterministic generation and returns generated candidates', async () => {
      const mockTxs = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'income',
          amount: 50000,
          category: 'Salary',
          status: 'confirmed',
          transactionDate: new Date('2026-09-05')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 60000,
          category: 'Shopping',
          status: 'confirmed',
          transactionDate: new Date('2026-09-10')
        }
      ];

      jest.spyOn(Transaction, 'find').mockImplementation((query) => {
        const filtered = mockTxs.filter((t) => {
          if (query.userId && t.userId.toString() !== query.userId.toString()) return false;
          if (query.status && t.status !== query.status) return false;
          return true;
        });
        return {
          sort: jest.fn().mockResolvedValue(filtered),
          then: (resolve) => resolve(filtered)
        };
      });

      jest.spyOn(Budget, 'findOne').mockResolvedValue(null);
      jest.spyOn(Goal, 'find').mockResolvedValue([]);
      jest.spyOn(ActionPlan, 'find').mockResolvedValue([]);
      jest.spyOn(ActionPlan, 'insertMany').mockResolvedValueOnce([
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          title: 'Eliminate Monthly Cash Deficit',
          actionType: 'INCREASE_SAVINGS',
          monthlyImpact: 10000
        }
      ]);
      jest.spyOn(ActionPlan, 'countDocuments').mockResolvedValueOnce(1);

      const res = await request(app)
        .post('/api/action-plans/generate')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ month: '2026-09' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.generated).toHaveLength(1);
    });
  });

  describe('POST /api/action-plans/:id/complete and /dismiss', () => {
    it('marks plan as COMPLETED with 200 OK', async () => {
      const planId = new mongoose.Types.ObjectId().toString();
      const planDoc = {
        _id: planId,
        userId: userAId,
        title: 'Reduce Groceries',
        status: 'ACTIVE',
        save: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
      };

      jest.spyOn(ActionPlan, 'findOne').mockResolvedValueOnce(planDoc);

      const res = await request(app)
        .post(`/api/action-plans/${planId}/complete`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
    });

    it('marks plan as DISMISSED with 200 OK', async () => {
      const planId = new mongoose.Types.ObjectId().toString();
      const planDoc = {
        _id: planId,
        userId: userAId,
        title: 'Cancel Streaming',
        status: 'ACTIVE',
        save: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
      };

      jest.spyOn(ActionPlan, 'findOne').mockResolvedValueOnce(planDoc);

      const res = await request(app)
        .post(`/api/action-plans/${planId}/dismiss`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DISMISSED');
    });
  });

  describe('User Isolation & Security', () => {
    it('returns 404 when User B tries to fetch User A action plan', async () => {
      const planId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(ActionPlan, 'findOne').mockResolvedValueOnce(null);

      const res = await request(app)
        .get(`/api/action-plans/${planId}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when User B tries to delete User A action plan', async () => {
      const planId = new mongoose.Types.ObjectId().toString();

      jest.spyOn(ActionPlan, 'findOne').mockResolvedValueOnce(null);

      const res = await request(app)
        .delete(`/api/action-plans/${planId}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
