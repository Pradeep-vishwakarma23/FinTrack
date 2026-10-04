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
import { planCopilotQuery, QUERY_TYPES } from '../services/copilotQueryPlanner.js';
import { INTENTS } from '../services/intentRouter.js';

describe('Phase 8.1: Copilot Query Planner & Multi-Question Integration Tests', () => {
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
      amount: 11000,
      category: 'Salary',
      status: 'confirmed',
      transactionDate: new Date('2026-09-01')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      title: 'TEST MART Purchase',
      merchant: 'TEST MART',
      amount: 475,
      category: 'Shopping',
      status: 'confirmed',
      transactionDate: new Date('2026-09-05')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      title: 'Swiggy Dinner',
      merchant: 'Swiggy',
      amount: 350,
      category: 'Food',
      status: 'confirmed',
      transactionDate: new Date('2026-09-10')
    }
  ];

  const sampleBudget = {
    userId: userAId,
    monthlyBudget: 2000,
    categoryBudgets: [
      { category: 'Shopping', limit: 1000 },
      { category: 'Food', limit: 800 }
    ]
  };

  let originalGeminiKey;
  let sessionMap;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    originalGeminiKey = process.env.GEMINI_API_KEY;
  });

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test_valid_gemini_api_key_12345';
    clearCache();
    clearInFlight();
    resetUsageStats();
    sessionMap = new Map();

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
      limit: jest.fn().mockReturnValue({
        then: (resolve) => resolve([])
      }),
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          then: (resolve) => resolve([])
        })
      }),
      then: (resolve) => resolve([])
    }));

    jest.spyOn(ActionPlan, 'find').mockImplementation(() => ({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          then: (resolve) => resolve([])
        })
      }),
      then: (resolve) => resolve([])
    }));

    jest.spyOn(CopilotSession, 'findOne').mockImplementation((query) => {
      if (query._id) {
        return Promise.resolve(sessionMap.get(query._id.toString()) || null);
      }
      return Promise.resolve(null);
    });

    jest.spyOn(CopilotSession.prototype, 'save').mockImplementation(function () {
      this._id = this._id || new mongoose.Types.ObjectId();
      this.messages = this.messages || [];
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

  // ==========================================
  // 1-4. Small-Talk & Greeting Routing
  // ==========================================
  describe('1. Small-Talk & Greeting Routing (0 Gemini Calls)', () => {
    test('1. "Hi" -> GREETING response without calling Gemini', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Hi', month: '2026-09' });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toMatch(/Hi! I'm FinTrack Copilot/i);
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('2. "Hello" -> GREETING response without calling Gemini', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Hello', month: '2026-09' });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toMatch(/Hi! I'm FinTrack Copilot/i);
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('3. "Hey" -> GREETING response without calling Gemini', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Hey', month: '2026-09' });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toMatch(/Hi! I'm FinTrack Copilot/i);
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('4. "Hi, what is my savings?" -> routes to financial SUMMARY', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Hi, what is my savings?', month: '2026-09' });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('10,175');
      expect(axiosSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // 5-9. Single Deterministic Questions
  // ==========================================
  describe('2. Single Deterministic Intent Routing (0 Gemini Calls)', () => {
    test('5. Single SUMMARY -> executes deterministically (Gemini = 0)', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What is my financial summary?', month: '2026-09' });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('earned ₹11,000');
      expect(res.body.data.message).toContain('spent ₹825');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('6. Single CATEGORY -> executes deterministically (Gemini = 0)', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How much did I spend on Shopping?', month: '2026-09' });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('475');
      expect(res.body.data.message).toContain('Shopping');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('7. Single MERCHANT -> executes deterministically (Gemini = 0)', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Who did I pay the most?', month: '2026-09' });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('TEST MART');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('8. Single FORECAST -> executes deterministically (Gemini = 0)', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What is my daily burn rate?', month: '2026-09' });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('burn rate');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('9. Single WHAT_IF -> executes deterministically (Gemini = 0)', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What if I reduce Shopping by 20%?', month: '2026-09' });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('save ₹95');
      expect(axiosSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // 10-14. Multi-Question Handling
  // ==========================================
  describe('3. Multi-Question Splitting & Combination (0 Gemini Calls)', () => {
    test('10. Multi CATEGORY + MERCHANT ("Which category contributed the most? Who did I pay the most?")', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'Which category contributed the most? Who did I pay the most?',
          month: '2026-09'
        });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('Top Category: Shopping');
      expect(res.body.data.message).toContain('Top Payee: TEST MART');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('11. Multi CATEGORY + FORECAST ("What did I spend on Shopping and what is my daily burn rate?")', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'What did I spend on Shopping and what is my daily burn rate?',
          month: '2026-09'
        });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('Shopping');
      expect(res.body.data.message).toContain('Daily Burn Rate');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('12. Multi MERCHANT + FORECAST ("Who did I pay the most and what is my daily burn rate?")', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'Who did I pay the most and what is my daily burn rate?',
          month: '2026-09'
        });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('TEST MART');
      expect(res.body.data.message).toContain('Daily Burn Rate');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('13. Multi WHAT_IF + SUMMARY ("What if I reduce Shopping by 20%? What is my total savings rate?")', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'What if I reduce Shopping by 20%? What is my total savings rate?',
          month: '2026-09'
        });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toMatch(/What-If Simulation/i);
      expect(res.body.data.message).toContain('save ₹95');
      expect(res.body.data.message).toContain('Net Savings');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('14. Three deterministic questions ("Which category contributed the most? Who did I pay the most? What is my daily burn rate?")', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'Which category contributed the most?\nWho did I pay the most?\nWhat is my daily burn rate?',
          month: '2026-09'
        });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('Top Category: Shopping');
      expect(res.body.data.message).toContain('Top Payee: TEST MART');
      expect(res.body.data.message).toContain('Daily Burn Rate');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('23. Deterministic multi-question consumes zero Gemini calls', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      const statsBefore = getUsageStats();
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'What is my savings rate and top category?',
          month: '2026-09'
        });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(axiosSpy).not.toHaveBeenCalled();
      const statsAfter = getUsageStats();
      expect(statsAfter.deterministicRequests).toBeGreaterThan(statsBefore.deterministicRequests);
    });

    test('24. Multi-question tool results combine correctly into structured response', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'What if I reduce Shopping by 20%?\nWho is my top payee in Shopping?\nWhat is my total savings rate?',
          month: '2026-09'
        });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('What-If Simulation:');
      expect(res.body.data.message).toContain('All figures are based on your confirmed transactions.');
    });
  });

  // ==========================================
  // 15-21. Contextual Follow-Ups & Advisory
  // ==========================================
  describe('4. Contextual Follow-Ups & Explanatory Routing', () => {
    test('15. Mixed deterministic + advisory ("How much did I spend on Shopping and why is it so high?")', async () => {
      const axiosSpy = jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      message: 'You spent ₹475 on Shopping, which is your highest expense category this month.',
                      suggestedFollowUps: ['What if I reduce Shopping by 20%?'],
                      referencedMetrics: {
                        totalIncome: 11000,
                        totalExpense: 825,
                        netSavings: 10175,
                        savingsRate: 92.5,
                        isDeficit: false
                      }
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
        .send({
          message: 'How much did I spend on Shopping and why is it so high?',
          month: '2026-09'
        });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('gemini');
      expect(axiosSpy).toHaveBeenCalledTimes(1);
    });

    test('16. "Why?" after CATEGORY spending routes to ADVISORY with injected context', async () => {
      // Turn 1: Ask category spend
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How much did I spend on Shopping?', month: '2026-09' });

      const sessionId = res1.body.sessionId;

      // Turn 2: Ask "Why?"
      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Why?', sessionId, month: '2026-09' });

      expect(res2.status).toBe(200);
      expect(res2.body.data.message).toContain('Shopping');
      expect(res2.body.data.message).toContain('475');
    });

    test('17. "Why?" after MERCHANT spending routes to ADVISORY with merchant context', async () => {
      // Turn 1: Ask merchant spend
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Who did I pay the most?', month: '2026-09' });

      const sessionId = res1.body.sessionId;

      // Turn 2: Ask "Why?"
      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Why?', sessionId, month: '2026-09' });

      expect(res2.status).toBe(200);
      expect(res2.body.data.message).toMatch(/TEST MART|expenses|ledger|positive savings rate/i);
    });

    test('18. "Why?" after SUMMARY routes to ADVISORY explaining cash flow', async () => {
      // Turn 1: Summary query
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What is my savings rate?', month: '2026-09' });

      const sessionId = res1.body.sessionId;

      // Turn 2: Ask "Why?"
      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Why?', sessionId, month: '2026-09' });

      expect(res2.status).toBe(200);
      expect(res2.body.data.message).toMatch(/income|expenses|surplus|savings rate|positive/i);
    });

    test('19. "What about that?" resolves previous category context', async () => {
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How much did I spend on Shopping?', month: '2026-09' });

      const sessionId = res1.body.sessionId;

      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What about that?', sessionId, month: '2026-09' });

      expect(res2.status).toBe(200);
      expect(res2.body.data.message).toContain('Shopping');
    });

    test('20. "Is that high?" evaluates category proportion', async () => {
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How much did I spend on Shopping?', month: '2026-09' });

      const sessionId = res1.body.sessionId;

      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Is that high?', sessionId, month: '2026-09' });

      expect(res2.status).toBe(200);
      expect(res2.body.data.message).toContain('Shopping');
      expect(res2.body.data.message).toMatch(/concentration|spending range|portion/i);
    });

    test('21. "How can I reduce it?" suggests actionable category cuts', async () => {
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How much did I spend on Shopping?', month: '2026-09' });

      const sessionId = res1.body.sessionId;

      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How can I reduce it?', sessionId, month: '2026-09' });

      expect(res2.status).toBe(200);
      expect(res2.body.data.message).toContain('Shopping');
      expect(res2.body.data.message).toMatch(/reduce|budget|20%/i);
    });
  });

  // ==========================================
  // 22-33. Safety, Isolation, Budget & Contracts
  // ==========================================
  describe('5. Safety, Isolation, Budget & Edge Cases', () => {
    test('22. Context remains user and session isolated', async () => {
      // User A asks about Shopping
      await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How much did I spend on Shopping?', month: '2026-09' });

      // User B has 0 transactions, asks "Why?"
      const resB = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ message: 'Why?', month: '2026-09' });

      expect(resB.status).toBe(200);
      expect(resB.body.data.message).not.toContain('Shopping');
      expect(resB.body.data.message).toContain('No confirmed ledger transactions');
    });

    test('25. No duplicated financial calculations across multi-part execution', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'What is my total savings and what is my daily burn rate?',
          month: '2026-09'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.referencedMetrics.totalIncome).toBe(11000);
      expect(res.body.data.referencedMetrics.totalExpense).toBe(825);
    });

    test('26. Existing What-If simulation remains mathematically correct', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What if I reduce Shopping by 20%?', month: '2026-09' });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('save ₹95');
      expect(res.body.data.message).toContain('730'); // 825 - 95 = 730
    });

    test('27. Existing cost router remains active for direct single routing', async () => {
      const plan = planCopilotQuery({
        message: 'Which category contributed the most?',
        month: '2026-09'
      });

      expect(plan.type).toBe(QUERY_TYPES.SINGLE);
      expect(plan.intent).toBe('CATEGORY_SPENDING');
      expect(plan.requiresLLM).toBe(false);
    });

    test('28. Existing cache remains active for advisory queries', async () => {
      const axiosSpy = jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      message: 'Advisory guidance response',
                      suggestedFollowUps: ['Followup 1'],
                      referencedMetrics: {
                        totalIncome: 11000,
                        totalExpense: 825,
                        netSavings: 10175,
                        savingsRate: 92.5,
                        isDeficit: false
                      }
                    })
                  }
                ]
              }
            }
          ]
        }
      });

      // Call 1
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'Give me financial advice on how to improve my savings rate',
          month: '2026-09'
        });

      expect(res1.status).toBe(200);
      expect(res1.body.provider).toBe('gemini');
      expect(axiosSpy).toHaveBeenCalledTimes(1);

      // Call 2 (identical query -> served from cache with 0 new Gemini calls)
      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'Give me financial advice on how to improve my savings rate',
          month: '2026-09'
        });

      expect(res2.status).toBe(200);
      expect(res2.body.provider).toBe('gemini');
      expect(axiosSpy).toHaveBeenCalledTimes(1); // No additional Gemini call
      expect(getUsageStats().cacheHits).toBe(1);
    });

    test('29. Existing Gemini budget remains <= 2 calls max', async () => {
      jest.spyOn(axios, 'post').mockRejectedValue(new Error('Network timeout'));

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'How can I create an investment plan?',
          month: '2026-09'
        });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('heuristic');
      const stats = getUsageStats();
      expect(stats.fallbackResponses).toBe(1);
      expect(stats.geminiCalls).toBeLessThanOrEqual(2);
    });

    test('30. Existing heuristic fallback remains active when Gemini fails', async () => {
      jest.spyOn(axios, 'post').mockRejectedValue(new Error('Gemini 500 error'));

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'Recommend action plan for next quarter',
          month: '2026-09'
        });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('heuristic');
      expect(res.body.data.message).toBeTruthy();
    });

    test('31. Empty input handling rejects with 400', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: '', month: '2026-09' });

      expect(res.status).toBe(400);
    });

    test('32. Malformed input handling rejects with 400', async () => {
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ month: '2026-09' });

      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Valid question', month: 'invalid-month' });

      expect(res2.status).toBe(400);
    });

    test('33. API response contract remains strictly unchanged', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Hi', month: '2026-09' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('sessionId');
      expect(res.body).toHaveProperty('provider');
      expect(res.body).toHaveProperty('period');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('message');
      expect(res.body.data).toHaveProperty('suggestedFollowUps');
      expect(res.body.data).toHaveProperty('referencedMetrics');
      expect(res.body.data.referencedMetrics).toHaveProperty('totalIncome');
      expect(res.body.data.referencedMetrics).toHaveProperty('totalExpense');
      expect(res.body.data.referencedMetrics).toHaveProperty('netSavings');
      expect(res.body.data.referencedMetrics).toHaveProperty('savingsRate');
      expect(res.body.data.referencedMetrics).toHaveProperty('isDeficit');
    });
  });
});
