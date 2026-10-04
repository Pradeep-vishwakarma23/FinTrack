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
import * as aiAdvisorService from '../services/aiAdvisorService.js';
import { processCopilotChat } from '../services/copilotService.js';
import { routeQuestion, ROUTES } from '../services/llmCostRouter.js';
import { INTENTS } from '../services/intentRouter.js';

describe('Phase 6: Production Copilot Integration with Intelligent LLM Cost Router Suite', () => {
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

  const sampleGoals = [
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      title: 'Emergency Fund',
      targetAmount: 120000,
      currentAmount: 60000,
      targetDate: new Date('2026-12-31'),
      status: 'in_progress',
      category: 'Emergency'
    }
  ];

  let originalGeminiKey;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    originalGeminiKey = process.env.GEMINI_API_KEY;
  });

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test_valid_gemini_api_key_12345';

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

    jest.spyOn(Goal, 'find').mockImplementation((query) => {
      const filtered = sampleGoals.filter((g) => {
        if (query.userId && g.userId.toString() !== query.userId.toString()) return false;
        return true;
      });
      return {
        sort: jest.fn().mockResolvedValue(filtered),
        then: (resolve) => resolve(filtered)
      };
    });

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
    jest.restoreAllMocks();
  });

  // =================================================================
  // 1. DETERMINISTIC ROUTES (0 GEMINI CALLS)
  // =================================================================
  describe('1. Production Copilot Deterministic Routes (Gemini Calls = 0)', () => {
    test('1. Production Copilot SUMMARY uses deterministic path without calling Gemini', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What is my net savings?', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('60,000');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('2. Production Copilot CATEGORY_SPENDING uses deterministic path without calling Gemini', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How much did I spend on Shopping?', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('Shopping');
      expect(res.body.data.message).toContain('7,000');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('3. Production Copilot MERCHANT_SPENDING uses deterministic path without calling Gemini', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How much did I spend at Amazon?', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('Amazon');
      expect(res.body.data.message).toContain('7,000');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('4. Production Copilot FORECAST uses deterministic path without calling Gemini', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What is my financial forecast?', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('burn rate');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('5. Production Copilot BUDGET_RISK uses deterministic path without calling Gemini', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Am I at risk of exceeding my budget?', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('SAFE');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('6. Production Copilot ANOMALY uses deterministic path without calling Gemini', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Did I have any unusual transactions?', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('deterministic');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('7. Production Copilot GOAL_STATUS uses deterministic path without calling Gemini', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Show my savings goals', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('Emergency Fund');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('8. Production Copilot WHAT_IF uses deterministic math path without calling Gemini', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What if I reduce Shopping by 20%?', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain('Shopping');
      expect(axiosSpy).not.toHaveBeenCalled();
    });

    test('9. Deterministic requests make zero Gemini calls across multiple diverse factual prompts', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');

      const deterministicQueries = [
        'What is my total spending?',
        'How much did I spend on Food?',
        'How much did I spend at DMart?',
        'Project my monthly burn rate',
        'Am I over budget?',
        'Find unusual transactions',
        'List my goals',
        'What if I reduce Food by 10%?'
      ];

      for (const query of deterministicQueries) {
        const res = await request(app)
          .post('/api/copilot/chat')
          .set('Authorization', `Bearer ${tokenUserA}`)
          .send({ message: query, month: '2026-03' });

        expect(res.status).toBe(200);
        expect(res.body.provider).toBe('deterministic');
      }

      expect(axiosSpy).not.toHaveBeenCalled();
    });
  });

  // =================================================================
  // 2. ADVISORY ROUTES & GEMINI CALL BUDGET
  // =================================================================
  describe('2. Production Copilot Advisory Routing & Gemini Quota Enforcement', () => {
    test('10. Advisory requests can use Gemini and return structured advisory insights', async () => {
      const axiosSpy = jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      message: 'To improve your savings, focus on keeping discretionary shopping within the ₹6,000 budget limit.',
                      suggestedFollowUps: ['What if I cut Shopping by 15%?', 'Show my top payees'],
                      referencedMetrics: {
                        totalIncome: 100000,
                        totalExpense: 40000,
                        netSavings: 60000,
                        savingsRate: 60,
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
        .send({ message: 'How can I save more money?', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('gemini');
      expect(res.body.data.message).toContain('improve your savings');
      expect(axiosSpy).toHaveBeenCalled();
    });

    test('11. Advisory Gemini calls never exceed 2 per interaction', async () => {
      let geminiCallCount = 0;
      jest.spyOn(axios, 'post').mockImplementation(async () => {
        geminiCallCount++;
        return {
          data: {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        message: 'Here is an actionable strategy for optimizing your cash flow.',
                        suggestedFollowUps: ['How to invest the surplus?'],
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

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Why is my spending high and what strategy should I use?', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(geminiCallCount).toBeGreaterThanOrEqual(1);
      expect(geminiCallCount).toBeLessThanOrEqual(2);
    });

    test('12. Existing multi-turn conversation behavior and context follow-up remain correct', async () => {
      // First turn: ask category spending
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How much did I spend on Food?', month: '2026-03' });

      expect(res1.status).toBe(200);
      expect(res1.body.provider).toBe('deterministic');
      expect(res1.body.data.message).toContain('Food');
      const sessionId = res1.body.sessionId;

      // Second turn: follow-up "What if I cut that by 25%?" referencing previous category
      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ sessionId, message: 'What if I cut that by 25%?', month: '2026-03' });

      expect(res2.status).toBe(200);
      expect(res2.body.provider).toBe('deterministic');
      expect(res2.body.data.message).toContain('Food');
      expect(res2.body.data.message).toContain('25%');
    });

    test('13. falls back gracefully to deterministic heuristic response when Gemini fails', async () => {
      jest.spyOn(axios, 'post').mockRejectedValue(new Error('Quota exceeded'));

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Give me financial advice.', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('heuristic');
      expect(res.body.data.message.length).toBeGreaterThan(0);
    });
  });

  // =================================================================
  // 3. SECURITY, SESSION PERSISTENCE & MULTI-TURN
  // =================================================================
  describe('3. Security, Multi-Turn & Session Invariants', () => {
    test('14. preserves strict user isolation (User B does not see User A records)', async () => {
      const resUserB = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ message: 'What is my net savings?', month: '2026-03' });

      expect(resUserB.status).toBe(200);
      expect(resUserB.body.data.message).toContain('-₹9,999'); // User B expense only
      expect(resUserB.body.data.referencedMetrics.totalIncome).toBe(0);
      expect(resUserB.body.data.referencedMetrics.totalExpense).toBe(9999);
    });

    test('15. preserves session persistence and append turns', async () => {
      const session = new CopilotSession({
        userId: userAId,
        month: '2026-03',
        messages: []
      });
      jest.spyOn(CopilotSession, 'findOne').mockResolvedValue(session);

      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What is my net savings?', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(session.messages.length).toBe(2); // user + assistant
      expect(session.messages[0].content).toBe('What is my net savings?');
    });

    test('16. preserves exact API response contract', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What is my net savings?', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('sessionId');
      expect(res.body).toHaveProperty('provider');
      expect(res.body).toHaveProperty('period', '2026-03');
      expect(res.body).toHaveProperty('data.message');
      expect(res.body).toHaveProperty('data.suggestedFollowUps');
      expect(res.body).toHaveProperty('data.referencedMetrics');
    });
  });
});
