import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../app.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import ActionPlan from '../models/ActionPlan.js';

describe('FinTrack Phase 9 - Report API Endpoints', () => {
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
    it('returns 401 Unauthorized when accessing /api/reports/monthly without a token', async () => {
      const res = await request(app).get('/api/reports/monthly');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 Unauthorized when accessing /api/reports/monthly/pdf without a token', async () => {
      const res = await request(app).get('/api/reports/monthly/pdf');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 Unauthorized when accessing with an invalid token', async () => {
      const res = await request(app)
        .get('/api/reports/monthly')
        .set('Authorization', 'Bearer invalid_garbage_token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/reports/monthly', () => {
    it('returns 200 with structured report data for valid month parameter', async () => {
      const mockTransactions = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'income',
          amount: 45000,
          status: 'confirmed',
          category: 'Salary',
          title: 'Consulting Income',
          transactionDate: new Date('2026-09-02T10:00:00.000Z')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 3000,
          status: 'confirmed',
          category: 'Groceries',
          merchant: 'Blinkit',
          title: 'Weekly groceries',
          transactionDate: new Date('2026-09-03T10:00:00.000Z')
        }
      ];

      jest.spyOn(Transaction, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockTransactions)
      });
      jest.spyOn(Budget, 'findOne').mockResolvedValue({
        userId: userAId,
        monthlyBudget: 20000
      });
      jest.spyOn(Goal, 'find').mockResolvedValue([]);
      jest.spyOn(ActionPlan, 'find').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/reports/monthly?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const data = res.body.data;
      expect(data.reportMetadata.month).toBe('2026-09');
      expect(data.reportMetadata.userId).toBe(userAId.toString());
      expect(data.summary.totalIncome).toBe(45000);
      expect(data.summary.totalExpenses).toBe(3000);
      expect(data.summary.netSavings).toBe(42000);
      expect(data.categories.length).toBe(1);
      expect(data.merchants.length).toBe(1);
      expect(data.budget.monthlyBudget).toBe(20000);
      expect(data.transactionSummary.totalTransactions).toBe(2);
    });

    it('returns 400 Bad Request when month query format is invalid', async () => {
      const res = await request(app)
        .get('/api/reports/monthly?month=2026-15')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid month format');
    });

    it('supports backward compatibility with year and month integers', async () => {
      jest.spyOn(Transaction, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });
      jest.spyOn(Budget, 'findOne').mockResolvedValue(null);
      jest.spyOn(Goal, 'find').mockResolvedValue([]);
      jest.spyOn(ActionPlan, 'find').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/reports/monthly?year=2026&month=9')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reportMetadata.month).toBe('2026-09');
    });

    it('maintains strict user data isolation across different authenticated tokens', async () => {
      const findSpy = jest.spyOn(Transaction, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });
      jest.spyOn(Budget, 'findOne').mockResolvedValue(null);
      jest.spyOn(Goal, 'find').mockResolvedValue([]);
      jest.spyOn(ActionPlan, 'find').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/reports/monthly?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(200);
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userBId.toString()
        })
      );
      expect(res.body.data.reportMetadata.userId).toBe(userBId.toString());
    });
  });

  describe('PDF Report Streaming', () => {
    it('returns 200 and application/pdf when requesting with format=pdf', async () => {
      jest.spyOn(Transaction, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });
      jest.spyOn(Budget, 'findOne').mockResolvedValue(null);
      jest.spyOn(Goal, 'find').mockResolvedValue([]);
      jest.spyOn(ActionPlan, 'find').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/reports/monthly?month=2026-09&format=pdf')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename="FinTrack_Report_2026-09.pdf"');
    });

    it('returns 200 and application/pdf when accessing /api/reports/monthly/pdf', async () => {
      jest.spyOn(Transaction, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });
      jest.spyOn(Budget, 'findOne').mockResolvedValue(null);
      jest.spyOn(Goal, 'find').mockResolvedValue([]);
      jest.spyOn(ActionPlan, 'find').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/reports/monthly/pdf?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });
  });
});
