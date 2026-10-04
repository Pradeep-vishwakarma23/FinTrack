import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../app.js';
import Transaction from '../models/Transaction.js';
import {
  normalizeMerchantName,
  detectCadence,
  estimateNextPaymentDate,
  analyzeAmounts,
  calculateConfidence,
  detectRecurringSubscriptions
} from '../services/subscriptionService.js';

describe('Phase 7.3: Subscription & Recurring Payments Intelligence Engine (subscriptionService.test.js)', () => {
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

  describe('1. Merchant Name Normalization', () => {
    it('should clean payment prefixes, entity types, and whitespace while preserving identity', () => {
      expect(normalizeMerchantName('UPI-Netflix India Pvt Ltd', '')).toBe('netflix');
      expect(normalizeMerchantName('AUTOPAY: Spotify India', '')).toBe('spotify');
      expect(normalizeMerchantName('Airtel Broadband Ltd.', '')).toBe('airtel broadband');
      expect(normalizeMerchantName('Gym Membership Fee', '')).toBe('gym membership fee');
      expect(normalizeMerchantName('', 'Jio Fiber Internet')).toBe('jio fiber internet');
    });
  });

  describe('2. Cadence & Interval Detection', () => {
    it('should detect weekly cadence (~7 days)', () => {
      const res = detectCadence([7, 7, 8, 7]);
      expect(res.cadence).toBe('weekly');
      expect(res.isConsistent).toBe(true);
      expect(res.averageIntervalDays).toBe(7);
    });

    it('should detect biweekly cadence (~14 days)', () => {
      const res = detectCadence([14, 15, 14]);
      expect(res.cadence).toBe('biweekly');
      expect(res.isConsistent).toBe(true);
      expect(res.averageIntervalDays).toBe(14);
    });

    it('should detect monthly cadence (~30 days)', () => {
      const res = detectCadence([30, 31, 29, 30]);
      expect(res.cadence).toBe('monthly');
      expect(res.isConsistent).toBe(true);
      expect(res.averageIntervalDays).toBe(30);
    });

    it('should detect quarterly cadence (~90 days)', () => {
      const res = detectCadence([90, 92, 89]);
      expect(res.cadence).toBe('quarterly');
      expect(res.isConsistent).toBe(true);
      expect(res.averageIntervalDays).toBe(90);
    });

    it('should mark irregular or widely spaced transactions as irregular', () => {
      const res = detectCadence([10, 85, 4, 120]);
      expect(res.cadence).toBe('irregular');
      expect(res.isConsistent).toBe(false);
    });
  });

  describe('3. Amount Analysis & Price Increase Detection', () => {
    it('should calculate consistent amount metrics accurately', () => {
      const res = analyzeAmounts([499, 499, 499, 499]);
      expect(res.averageAmount).toBe(499);
      expect(res.latestAmount).toBe(499);
      expect(res.isAmountConsistent).toBe(true);
      expect(res.priceIncreaseDetected).toBe(false);
    });

    it('should detect meaningful subscription price increases', () => {
      // Netflix: ₹649 -> ₹649 -> ₹749 (+₹100, +15.4%)
      const res = analyzeAmounts([649, 649, 749]);
      expect(res.priceIncreaseDetected).toBe(true);
      expect(res.amountChange).toBe(100);
      expect(res.percentageChange).toBe(15.4);
      expect(res.latestAmount).toBe(749);
      expect(res.previousAmount).toBe(649);
    });

    it('should not trigger price increase for minor fluctuations or decreases', () => {
      const res1 = analyzeAmounts([1000, 1005, 1002]); // < 3%
      expect(res1.priceIncreaseDetected).toBe(false);

      const res2 = analyzeAmounts([500, 500, 450]); // Price decrease
      expect(res2.priceIncreaseDetected).toBe(false);
    });
  });

  describe('4. Next Payment Date Estimation', () => {
    it('should estimate next payment for monthly subscription', () => {
      const lastDate = '2026-09-05T00:00:00.000Z';
      const nextDate = estimateNextPaymentDate(lastDate, 'monthly');
      const parsed = new Date(nextDate);

      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(9); // October (0-indexed 9)
      expect(parsed.getDate()).toBe(5);
    });

    it('should return null for irregular cadence', () => {
      expect(estimateNextPaymentDate('2026-09-05T00:00:00.000Z', 'irregular')).toBeNull();
    });
  });

  describe('5. Confidence Scoring Model', () => {
    it('should return HIGH confidence for regular monthly subscription', () => {
      const res = calculateConfidence({
        count: 5,
        cadenceInfo: { cadence: 'monthly', isConsistent: true, stdDev: 0.5 },
        amountInfo: { minAmount: 199, maxAmount: 199, isAmountConsistent: true, priceIncreaseDetected: false },
        lastPaymentDate: new Date().toISOString()
      });
      expect(res.confidenceLevel).toBe('HIGH');
      expect(res.confidence).toBeGreaterThanOrEqual(75);
    });

    it('should return LOW confidence for irregular intervals or insufficient count', () => {
      const res = calculateConfidence({
        count: 2,
        cadenceInfo: { cadence: 'irregular', isConsistent: false, stdDev: 20 },
        amountInfo: { minAmount: 100, maxAmount: 500, isAmountConsistent: false, priceIncreaseDetected: false },
        lastPaymentDate: '2025-01-01'
      });
      expect(res.confidenceLevel).toBe('LOW');
    });
  });

  describe('6. End-to-End Recurring Payment Detection & Isolation', () => {
    it('should detect monthly recurring subscription with price increase', async () => {
      const mockTxs = [
        {
          _id: 'tx_1',
          userId: userAId,
          merchant: 'Netflix India',
          title: 'Streaming Subscription',
          amount: 649,
          type: 'expense',
          category: 'Entertainment',
          status: 'confirmed',
          transactionDate: new Date('2026-06-05T00:00:00.000Z')
        },
        {
          _id: 'tx_2',
          userId: userAId,
          merchant: 'Netflix',
          title: 'Streaming Subscription',
          amount: 649,
          type: 'expense',
          category: 'Entertainment',
          status: 'confirmed',
          transactionDate: new Date('2026-07-05T00:00:00.000Z')
        },
        {
          _id: 'tx_3',
          userId: userAId,
          merchant: 'Netflix India Pvt Ltd',
          title: 'Streaming Subscription',
          amount: 649,
          type: 'expense',
          category: 'Entertainment',
          status: 'confirmed',
          transactionDate: new Date('2026-08-05T00:00:00.000Z')
        },
        {
          _id: 'tx_4',
          userId: userAId,
          merchant: 'Netflix',
          title: 'Streaming Subscription',
          amount: 749,
          type: 'expense',
          category: 'Entertainment',
          status: 'confirmed',
          transactionDate: new Date('2026-09-05T00:00:00.000Z')
        },
        // Unrelated grocery expense
        {
          _id: 'tx_5',
          userId: userAId,
          merchant: 'Supermarket',
          amount: 1200,
          type: 'expense',
          category: 'Food',
          status: 'confirmed',
          transactionDate: new Date('2026-09-10T00:00:00.000Z')
        },
        // Staged subscription should be strictly ignored
        {
          _id: 'tx_6',
          userId: userAId,
          merchant: 'Spotify',
          amount: 119,
          type: 'expense',
          category: 'Entertainment',
          status: 'staged',
          transactionDate: new Date('2026-09-01T00:00:00.000Z')
        },
        // Other user's subscription should be strictly ignored
        {
          _id: 'tx_7',
          userId: userBId,
          merchant: 'Hotstar',
          amount: 899,
          type: 'expense',
          category: 'Entertainment',
          status: 'confirmed',
          transactionDate: new Date('2026-09-01T00:00:00.000Z')
        }
      ];

      const result = await detectRecurringSubscriptions({
        userId: userAId,
        transactions: mockTxs
      });

      expect(result.subscriptions).toHaveLength(1);
      const netflix = result.subscriptions[0];
      expect(netflix.normalizedMerchant).toBe('netflix');
      expect(netflix.cadence).toBe('monthly');
      expect(netflix.latestAmount).toBe(749);
      expect(netflix.priceIncreaseDetected).toBe(true);
      expect(netflix.amountChange).toBe(100);
      expect(netflix.confidenceLevel).toBe('HIGH');
      expect(netflix.estimatedNextPaymentDate).toBeDefined();

      expect(result.summary.totalRecurringCommitments).toBe(1);
      expect(result.summary.estimatedMonthlyRecurringCost).toBe(749);
      expect(result.summary.highConfidenceCount).toBe(1);
    });

    it('should ignore merchants with fewer than 3 transactions', async () => {
      const mockTxs = [
        {
          _id: 'tx_1',
          userId: userAId,
          merchant: 'Broadband',
          amount: 999,
          type: 'expense',
          category: 'Utilities',
          status: 'confirmed',
          transactionDate: new Date('2026-08-01T00:00:00.000Z')
        },
        {
          _id: 'tx_2',
          userId: userAId,
          merchant: 'Broadband',
          amount: 999,
          type: 'expense',
          category: 'Utilities',
          status: 'confirmed',
          transactionDate: new Date('2026-09-01T00:00:00.000Z')
        }
      ];

      const result = await detectRecurringSubscriptions({
        userId: userAId,
        transactions: mockTxs
      });

      expect(result.subscriptions).toHaveLength(0);
      expect(result.summary.totalRecurringCommitments).toBe(0);
    });

    it('should return empty summary when transaction set is empty', async () => {
      const result = await detectRecurringSubscriptions({
        userId: userAId,
        transactions: []
      });

      expect(result.subscriptions).toEqual([]);
      expect(result.summary.totalRecurringCommitments).toBe(0);
      expect(result.summary.estimatedMonthlyRecurringCost).toBe(0);
    });
  });

  describe('7. GET /api/intelligence/subscriptions API Endpoint', () => {
    it('should require authentication and reject 401 without token', async () => {
      const res = await request(app).get('/api/intelligence/subscriptions');
      expect(res.status).toBe(401);
    });

    it('should respond with 200 and formatted subscriptions contract for authenticated user', async () => {
      const mockFindQuery = {
        sort: jest.fn().mockResolvedValueOnce([
          {
            _id: new mongoose.Types.ObjectId(),
            userId: userAId,
            merchant: 'Gym Membership',
            title: 'Monthly Gym',
            amount: 1500,
            type: 'expense',
            category: 'Health',
            status: 'confirmed',
            transactionDate: new Date('2026-07-01')
          },
          {
            _id: new mongoose.Types.ObjectId(),
            userId: userAId,
            merchant: 'Gym Membership',
            title: 'Monthly Gym',
            amount: 1500,
            type: 'expense',
            category: 'Health',
            status: 'confirmed',
            transactionDate: new Date('2026-08-01')
          },
          {
            _id: new mongoose.Types.ObjectId(),
            userId: userAId,
            merchant: 'Gym Membership',
            title: 'Monthly Gym',
            amount: 1500,
            type: 'expense',
            category: 'Health',
            status: 'confirmed',
            transactionDate: new Date('2026-09-01')
          }
        ])
      };

      jest.spyOn(Transaction, 'find').mockReturnValueOnce(mockFindQuery);

      const res = await request(app)
        .get('/api/intelligence/subscriptions')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.subscriptions)).toBe(true);
      expect(res.body.subscriptions).toHaveLength(1);
      expect(res.body.subscriptions[0].merchant).toBe('Gym Membership');
      expect(res.body.subscriptions[0].cadence).toBe('monthly');
      expect(res.body.subscriptions[0].latestAmount).toBe(1500);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.totalRecurringCommitments).toBe(1);
      expect(res.body.summary.estimatedMonthlyRecurringCost).toBe(1500);
    });
  });
});
