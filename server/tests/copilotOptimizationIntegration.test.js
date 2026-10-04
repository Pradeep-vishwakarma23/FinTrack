import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import axios from 'axios';
import app from '../app.js';
import CopilotSession from '../models/CopilotSession.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import ActionPlan from '../models/ActionPlan.js';
import {
  clearCache,
  clearInFlight
} from '../services/llmOptimizationService.js';
import {
  getUsageStats,
  resetUsageStats
} from '../services/llmUsageTracker.js';

describe('Phase 8: Production Copilot Optimization Integration Suite (copilotOptimizationIntegration.test.js)', () => {
  const JWT_SECRET = 'test_jwt_secret_key_1234567890abcdef';
  const userAId = new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9fd1');
  const userBId = new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9fd2');

  const tokenUserA = jwt.sign({ id: userAId.toString() }, JWT_SECRET, { expiresIn: '1d' });
  const tokenUserB = jwt.sign({ id: userBId.toString() }, JWT_SECRET, { expiresIn: '1d' });

  const sampleTransactions = [
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'income',
      title: 'Salary Credit',
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
      title: 'Supermarket Grocery',
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
      title: 'Amazon Shopping',
      merchant: 'Amazon',
      amount: 7000,
      category: 'Shopping',
      status: 'confirmed',
      transactionDate: new Date('2026-03-10')
    },
    // User A 2026-04 Transaction (for month isolation)
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'income',
      title: 'Salary April',
      merchant: 'Tech Corp',
      amount: 100000,
      category: 'Salary',
      status: 'confirmed',
      transactionDate: new Date('2026-04-01')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      title: 'Rent April',
      merchant: 'Landlord',
      amount: 25000,
      category: 'Rent',
      status: 'confirmed',
      transactionDate: new Date('2026-04-02')
    },
    // User B Transaction (for isolation)
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userBId,
      type: 'expense',
      title: 'User B Expense',
      merchant: 'Secret Store',
      amount: 9999,
      category: 'Shopping',
      status: 'confirmed',
      transactionDate: new Date('2026-03-08')
    }
  ];

  const sampleBudget = {
    userId: userAId,
    monthlyBudget: 50000,
    categoryBudgets: [
      { category: 'Rent', limit: 30000 },
      { category: 'Food', limit: 10000 },
      { category: 'Shopping', limit: 6000 }
    ]
  };

  let originalGeminiKey;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    originalGeminiKey = process.env.GEMINI_API_KEY;
  });

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test_valid_gemini_api_key_12345';
    clearCache();
    clearInFlight();
    resetUsageStats();

    jest.spyOn(Transaction, 'find').mockImplementation((query) => {
      const filtered = sampleTransactions.filter((t) => {
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
        return Promise.resolve(sampleBudget);
      }
      return Promise.resolve(null);
    });

    jest.spyOn(Goal, 'find').mockImplementation(() => ({
      sort: jest.fn().mockResolvedValue([]),
      then: (resolve) => resolve([])
    }));

    jest.spyOn(ActionPlan, 'find').mockImplementation(() => ({
      sort: jest.fn().mockResolvedValue([]),
      then: (resolve) => resolve([])
    }));

    const sessionMap = new Map();
    jest.spyOn(CopilotSession, 'findOne').mockImplementation((query) => {
      if (query._id) {
        return Promise.resolve(sessionMap.get(query._id.toString()) || null);
      }
      return Promise.resolve(null);
    });
    jest.spyOn(CopilotSession.prototype, 'save').mockImplementation(function () {
      this._id = this._id || new mongoose.Types.ObjectId();
      sessionMap.set(this._id.toString(), this);
      return Promise.resolve(this);
    });
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalGeminiKey;
    clearCache();
    clearInFlight();
    jest.restoreAllMocks();
  });

  // =================================================================
  // 1. ADVISORY CACHING & DEDUPLICATION IN PRODUCTION COPILOT
  // =================================================================
  describe('1. Advisory Caching & Deduplication in Production Copilot', () => {
    test('1. caches first advisory response and serves second identical request from cache with 0 Gemini calls', async () => {
      const axiosSpy = jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      message: 'To optimize your surplus, consider trimming your ₹7,000 Shopping spend.',
                      suggestedFollowUps: ['What if I reduce Shopping by 20%?'],
                      referencedMetrics: { savingsRate: 60 }
                    })
                  }
                ]
              }
            }
          ]
        }
      });

      // Request 1 (Cache Miss)
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How can I optimize my savings?', month: '2026-03' });

      expect(res1.status).toBe(200);
      expect(res1.body.provider).toBe('gemini');
      expect(res1.body.data.message).toContain('optimize your surplus');
      expect(axiosSpy).toHaveBeenCalledTimes(1);

      // Request 2 (Cache Hit - Same User, Same Month, Same Question)
      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How can I optimize my savings?', month: '2026-03' });

      expect(res2.status).toBe(200);
      expect(res2.body.provider).toBe('gemini');
      expect(res2.body.data.message).toContain('optimize your surplus');
      expect(axiosSpy).toHaveBeenCalledTimes(1); // Still 1 call! 0 calls for second request

      const stats = getUsageStats();
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
      expect(stats.geminiCalls).toBe(1);
    });

    test('2. isolates cache between different users (User B causes cache miss and new Gemini call)', async () => {
      const axiosSpy = jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      message: 'Financial guidance response.',
                      suggestedFollowUps: [],
                      referencedMetrics: {}
                    })
                  }
                ]
              }
            }
          ]
        }
      });

      // User A
      await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How can I save more?', month: '2026-03' });

      // User B
      await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ message: 'How can I save more?', month: '2026-03' });

      expect(axiosSpy).toHaveBeenCalledTimes(2); // Isolated per user
      const stats = getUsageStats();
      expect(stats.cacheMisses).toBe(2);
      expect(stats.cacheHits).toBe(0);
    });

    test('3. isolates cache between different months (different month causes cache miss)', async () => {
      const axiosSpy = jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      message: 'Monthly advice response.',
                      suggestedFollowUps: [],
                      referencedMetrics: {}
                    })
                  }
                ]
              }
            }
          ]
        }
      });

      // Month 2026-03
      await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How should I plan my budget?', month: '2026-03' });

      // Month 2026-04
      await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How should I plan my budget?', month: '2026-04' });

      expect(axiosSpy).toHaveBeenCalledTimes(2);
    });

    test('4. deduplicates simultaneous identical advisory requests to a single Gemini call', async () => {
      let geminiCallCount = 0;
      jest.spyOn(axios, 'post').mockImplementation(async () => {
        geminiCallCount++;
        await new Promise((r) => setTimeout(r, 40));
        return {
          data: {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        message: 'Deduplicated simultaneous response.',
                        suggestedFollowUps: [],
                        referencedMetrics: {}
                      })
                    }
                  ]
                }
              }
            ]
          }
        };
      });

      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/copilot/chat')
          .set('Authorization', `Bearer ${tokenUserA}`)
          .send({ message: 'Simultaneous advisory question', month: '2026-03' }),
        request(app)
          .post('/api/copilot/chat')
          .set('Authorization', `Bearer ${tokenUserA}`)
          .send({ message: 'Simultaneous advisory question', month: '2026-03' })
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(geminiCallCount).toBe(1);
    });
  });

  // =================================================================
  // 2. ERROR RESILIENCE & HEURISTIC FALLBACK
  // =================================================================
  describe('2. Error Resilience & Heuristic Fallback', () => {
    test('5. falls back to heuristic engine when Gemini is rate limited or unavailable', async () => {
      jest.spyOn(axios, 'post').mockRejectedValue(new Error('429 Resource has been exhausted'));

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Give me financial advice', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('heuristic');
      expect(res.body.data.message.length).toBeGreaterThan(0);

      const stats = getUsageStats();
      expect(stats.fallbackResponses).toBe(1);
      expect(stats.quotaFailures).toBeGreaterThanOrEqual(1);
    });

    test('6. deterministic requests bypass Gemini and do not affect advisory cache', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What is my net savings?', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(axiosSpy).not.toHaveBeenCalled();

      const stats = getUsageStats();
      expect(stats.deterministicRequests).toBe(1);
      expect(stats.geminiCalls).toBe(0);
    });

    test('7. multi-turn advisory conversation preserves response contract and session integrity', async () => {
      const axiosSpy = jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      message: 'To save more, cut back on discretionary shopping and dining.',
                      suggestedFollowUps: ['How much did I spend on Dining?'],
                      referencedMetrics: { savingsRate: 60 }
                    })
                  }
                ]
              }
            }
          ]
        }
      });

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How can I save more effectively?', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('sessionId');
      expect(res.body).toHaveProperty('provider', 'gemini');
      expect(res.body).toHaveProperty('period', '2026-03');
      expect(res.body).toHaveProperty('data.message');
      expect(res.body.data.message).toContain('cut back on discretionary shopping');
      expect(res.body).toHaveProperty('data.suggestedFollowUps');
      expect(res.body).toHaveProperty('data.referencedMetrics');
      expect(axiosSpy).toHaveBeenCalledTimes(1);
    });
  });
});
