import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../app.js';
import CopilotSession from '../models/CopilotSession.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import ActionPlan from '../models/ActionPlan.js';
import {
  planCopilotQuery,
  extractPercentageFollowUp,
  resolveWhatIfContext,
  QUERY_TYPES
} from '../services/copilotQueryPlanner.js';
import { classifyIntent, INTENTS } from '../services/intentRouter.js';
import {
  processCopilotChat,
  generateHeuristicCopilotResponse
} from '../services/copilotService.js';
import {
  getUsageStats,
  resetUsageStats
} from '../services/llmUsageTracker.js';
import {
  clearCache,
  clearInFlight
} from '../services/llmOptimizationService.js';

describe('Phase 8.2: Contextual What-If Follow-Up & Real HTTP Integration Tests', () => {
  const JWT_SECRET = 'test_jwt_secret_key_1234567890abcdef';
  const userAId = new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9fd1');
  const userBId = new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9fd2');
  const tokenUserA = jwt.sign({ id: userAId.toString() }, JWT_SECRET, { expiresIn: '1d' });
  const tokenUserB = jwt.sign({ id: userBId.toString() }, JWT_SECRET, { expiresIn: '1d' });
  const month = '2026-09';

  const sampleTransactions = [
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      amount: 11000,
      type: 'income',
      category: 'Salary',
      merchant: 'ACME Corp',
      transactionDate: new Date('2026-09-05'),
      status: 'confirmed'
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      amount: 475,
      type: 'expense',
      category: 'Shopping',
      merchant: 'TEST MART',
      transactionDate: new Date('2026-09-10'),
      status: 'confirmed'
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      amount: 350,
      type: 'expense',
      category: 'Food',
      merchant: 'SWIGGY TEST',
      transactionDate: new Date('2026-09-15'),
      status: 'confirmed'
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userBId,
      amount: 11000,
      type: 'income',
      category: 'Salary',
      merchant: 'ACME Corp',
      transactionDate: new Date('2026-09-05'),
      status: 'confirmed'
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userBId,
      amount: 475,
      type: 'expense',
      category: 'Shopping',
      merchant: 'TEST MART',
      transactionDate: new Date('2026-09-10'),
      status: 'confirmed'
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userBId,
      amount: 350,
      type: 'expense',
      category: 'Food',
      merchant: 'SWIGGY TEST',
      transactionDate: new Date('2026-09-15'),
      status: 'confirmed'
    }
  ];

  let sessionMap;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
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

    jest.spyOn(Budget, 'findOne').mockImplementation(() => Promise.resolve(null));

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
      if (query.userId && query.month) {
        for (const session of sessionMap.values()) {
          if (session.userId?.toString() === query.userId.toString() && session.month === query.month) {
            return Promise.resolve(session);
          }
        }
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
    jest.restoreAllMocks();
  });

  // =================================================================
  // 1. QUERY PLANNER & INTENT ROUTER UNIT TESTS
  // =================================================================
  describe('1. Query Planner & Intent Router Unit Tests', () => {
    const whatIfTopCategoryHistory = [
      { role: 'user', content: 'What if I reduce my top category by 20%?' },
      {
        role: 'assistant',
        content: "Reducing your spending in 'Shopping' by 20% would save ₹95, lowering total expenses to ₹730. This turns your cash flow positive with a surplus of +₹10,270 (93% savings rate)."
      }
    ];

    const whatIfShoppingHistory = [
      { role: 'user', content: 'What if I reduce Shopping by 10%?' },
      {
        role: 'assistant',
        content: "Reducing your spending in 'Shopping' by 10% would save ₹48, lowering total expenses to ₹777. This turns your cash flow positive with a surplus of +₹10,223 (93% savings rate)."
      }
    ];

    test('1. Previous top category What-If + "For 10%" plans as WHAT_IF with TOP_CATEGORY, percentage 10, direction reduce', () => {
      const plan = planCopilotQuery({ message: 'For 10%', history: whatIfTopCategoryHistory, month });
      expect(plan.type).toBe(QUERY_TYPES.SINGLE);
      expect(plan.intent).toBe(INTENTS.WHAT_IF);
      expect(plan.requiresLLM).toBe(false);
      expect(plan.params.percentage).toBe(10);
      expect(plan.params.direction).toBe('reduce');
    });

    test('2. Previous Shopping What-If + "For 20%" plans as WHAT_IF with category Shopping', () => {
      const plan = planCopilotQuery({ message: 'For 20%', history: whatIfShoppingHistory, month });
      expect(plan.intent).toBe(INTENTS.WHAT_IF);
      expect(plan.requiresLLM).toBe(false);
      expect(plan.params.category).toBe('Shopping');
      expect(plan.params.percentage).toBe(20);
      expect(plan.params.direction).toBe('reduce');
    });

    test('3. Previous What-If + "Make it 15%" plans as WHAT_IF', () => {
      const plan = planCopilotQuery({ message: 'Make it 15%', history: whatIfShoppingHistory, month });
      expect(plan.intent).toBe(INTENTS.WHAT_IF);
      expect(plan.params.percentage).toBe(15);
      expect(plan.requiresLLM).toBe(false);
    });

    test('4. Previous What-If + "What about 25%?" plans as WHAT_IF', () => {
      const plan = planCopilotQuery({ message: 'What about 25%?', history: whatIfShoppingHistory, month });
      expect(plan.intent).toBe(INTENTS.WHAT_IF);
      expect(plan.params.percentage).toBe(25);
      expect(plan.requiresLLM).toBe(false);
    });

    test('5. Previous What-If + "Try 5%" plans as WHAT_IF', () => {
      const plan = planCopilotQuery({ message: 'Try 5%', history: whatIfShoppingHistory, month });
      expect(plan.intent).toBe(INTENTS.WHAT_IF);
      expect(plan.params.percentage).toBe(5);
      expect(plan.requiresLLM).toBe(false);
    });

    test('6. Previous What-If + "Change that to 30%" plans as WHAT_IF', () => {
      const plan = planCopilotQuery({ message: 'Change that to 30%', history: whatIfShoppingHistory, month });
      expect(plan.intent).toBe(INTENTS.WHAT_IF);
      expect(plan.params.percentage).toBe(30);
      expect(plan.requiresLLM).toBe(false);
    });

    test('7. extractPercentageFollowUp extracts supported follow-up syntax correctly', () => {
      expect(extractPercentageFollowUp('For 10%')).toBe(10);
      expect(extractPercentageFollowUp('10%')).toBe(10);
      expect(extractPercentageFollowUp('Make it 10%')).toBe(10);
      expect(extractPercentageFollowUp('Try 10%')).toBe(10);
      expect(extractPercentageFollowUp('What about 10%?')).toBe(10);
      expect(extractPercentageFollowUp('How about 10%?')).toBe(10);
      expect(extractPercentageFollowUp('Do it for 10%')).toBe(10);
      expect(extractPercentageFollowUp('Instead, 10%')).toBe(10);
      expect(extractPercentageFollowUp('Change that to 10%')).toBe(10);
      expect(extractPercentageFollowUp('10 percent')).toBe(10);
      expect(extractPercentageFollowUp('What is my savings rate?')).toBeNull();
    });

    test('8. No-context "For 10%" without What-If context does NOT become WHAT_IF', () => {
      const plan = planCopilotQuery({ message: 'For 10%', history: [], month });
      expect(plan.intent).not.toBe(INTENTS.WHAT_IF);
    });

    test('9. Previous factual query + "For 10%" does NOT become WHAT_IF', () => {
      const factualHistory = [
        { role: 'user', content: 'What is my savings rate?' },
        { role: 'assistant', content: 'For 2026-09, your savings rate is 92.5%.' }
      ];
      const plan = planCopilotQuery({ message: 'For 10%', history: factualHistory, month });
      expect(plan.intent).not.toBe(INTENTS.WHAT_IF);
    });
  });

  // =================================================================
  // 2. REQUIRED REAL-FLOW TEST MATRIX (HTTP SUPERTEST + SESSION)
  // =================================================================
  describe('2. Required Real-Flow HTTP Integration Test Matrix (Step 12)', () => {
    test('Matrix 1: "What if I reduce my top category by 20%?" -> "For 10%" (Shopping 10%, Gemini = 0)', async () => {
      // Turn 1: HTTP POST
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'What if I reduce my top category by 20%?',
          month
        });

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.provider).toBe('deterministic');
      expect(res1.body.data.message).toContain("Reducing your spending in 'Shopping' by 20%");
      expect(res1.body.data.message).toContain('₹95');
      expect(res1.body.data.message).toContain('₹730');
      const sessionId = res1.body.sessionId;

      // Turn 2: HTTP POST with same sessionId
      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          sessionId,
          message: 'For 10%',
          month
        });

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.provider).toBe('deterministic');
      expect(res2.body.data.message).toContain("Reducing your spending in 'Shopping' by 10%");
      expect(res2.body.data.message).toContain('₹48');
      expect(res2.body.data.message).toContain('₹777');

      const stats = getUsageStats();
      expect(stats.geminiCalls).toBe(0);
      expect(stats.deterministicRequests).toBe(2);
    });

    test('Matrix 2: "What if I reduce Shopping by 20%?" -> "For 10%" (Shopping 10%, Gemini = 0)', async () => {
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'What if I reduce Shopping by 20%?',
          month
        });
      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          sessionId: res1.body.sessionId,
          message: 'For 10%',
          month
        });

      expect(res2.status).toBe(200);
      expect(res2.body.provider).toBe('deterministic');
      expect(res2.body.data.message).toContain("Reducing your spending in 'Shopping' by 10%");
      expect(res2.body.data.message).toContain('₹48');
      expect(res2.body.data.message).toContain('₹777');
      expect(getUsageStats().geminiCalls).toBe(0);
    });

    test('Matrix 3: "What if I increase Shopping by 20%?" -> "For 10%" (Shopping increase 10%, Gemini = 0)', async () => {
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'What if I increase Shopping by 20%?',
          month
        });
      expect(res1.status).toBe(200);
      expect(res1.body.data.message).toContain("Increasing your spending in 'Shopping' by 20%");

      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          sessionId: res1.body.sessionId,
          message: 'For 10%',
          month
        });

      expect(res2.status).toBe(200);
      expect(res2.body.provider).toBe('deterministic');
      expect(res2.body.data.message).toContain("Increasing your spending in 'Shopping' by 10%");
      expect(res2.body.data.message).toContain('₹48');
      expect(res2.body.data.message).toContain('₹873');
      expect(getUsageStats().geminiCalls).toBe(0);
    });

    test('Matrix 4: "What if I reduce Shopping by 20%?" -> "Make it 15%" (Shopping 15%)', async () => {
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What if I reduce Shopping by 20%?', month });

      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ sessionId: res1.body.sessionId, message: 'Make it 15%', month });

      expect(res2.status).toBe(200);
      expect(res2.body.provider).toBe('deterministic');
      expect(res2.body.data.message).toContain("Reducing your spending in 'Shopping' by 15%");
      expect(res2.body.data.message).toContain('₹71');
      expect(res2.body.data.message).toContain('₹754');
    });

    test('Matrix 5: "What if I reduce Shopping by 20%?" -> "What about 25%?" (Shopping 25%)', async () => {
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What if I reduce Shopping by 20%?', month });

      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ sessionId: res1.body.sessionId, message: 'What about 25%?', month });

      expect(res2.status).toBe(200);
      expect(res2.body.provider).toBe('deterministic');
      expect(res2.body.data.message).toContain("Reducing your spending in 'Shopping' by 25%");
      expect(res2.body.data.message).toContain('₹119');
      expect(res2.body.data.message).toContain('₹706');
    });

    test('Matrix 6: "What if I reduce Shopping by 20%?" -> "Change that to 5%" (Shopping 5%)', async () => {
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What if I reduce Shopping by 20%?', month });

      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ sessionId: res1.body.sessionId, message: 'Change that to 5%', month });

      expect(res2.status).toBe(200);
      expect(res2.body.provider).toBe('deterministic');
      expect(res2.body.data.message).toContain("Reducing your spending in 'Shopping' by 5%");
      expect(res2.body.data.message).toContain('₹24');
      expect(res2.body.data.message).toContain('₹801');
    });

    test('Matrix 7: "What if I reduce Shopping by 20%?" -> "What would my new expenses be?"', async () => {
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What if I reduce Shopping by 20%?', month });

      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ sessionId: res1.body.sessionId, message: 'What would my new expenses be?', month });

      expect(res2.status).toBe(200);
      expect(res2.body.provider).toBe('deterministic');
      expect(res2.body.data.message).toContain('₹730');
      expect(getUsageStats().geminiCalls).toBe(0);
    });

    test('Matrix 8: "What if I reduce Shopping by 20%?" -> "How much would I save?"', async () => {
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What if I reduce Shopping by 20%?', month });

      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ sessionId: res1.body.sessionId, message: 'How much would I save?', month });

      expect(res2.status).toBe(200);
      expect(res2.body.provider).toBe('deterministic');
      expect(res2.body.data.message).toContain('₹95');
      expect(getUsageStats().geminiCalls).toBe(0);
    });

    test('Matrix 9: No What-If history -> "For 10%" returns financial summary, NOT WHAT_IF', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'For 10%', month });

      expect(res.status).toBe(200);
      expect(res.body.data.message).not.toContain("Reducing your spending in 'Shopping'");
      expect(res.body.data.message).toContain('Total Income');
    });

    test('Matrix 10: Previous factual query "What is my savings rate?" -> "For 10%" is NOT WHAT_IF', async () => {
      const res1 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What is my savings rate?', month });

      const res2 = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ sessionId: res1.body.sessionId, message: 'For 10%', month });

      expect(res2.status).toBe(200);
      expect(res2.body.data.message).not.toContain("Reducing your spending in 'Shopping'");
    });

    test('Matrix 11: Session isolation — Session B does NOT inherit Session A What-If context', async () => {
      // Session A What-If
      const resA = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What if I reduce Shopping by 20%?', month });
      expect(resA.status).toBe(200);

      // Create a separate active Session B for user A
      const sessionB = new CopilotSession({
        userId: userAId,
        month,
        title: `Financial Conversation (${month})`,
        messages: []
      });
      await sessionB.save();

      // Session B sends "For 10%"
      const resB = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ sessionId: sessionB._id.toString(), message: 'For 10%', month });

      expect(resB.status).toBe(200);
      expect(resB.body.data.message).not.toContain("Reducing your spending in 'Shopping'");
    });

    test('Matrix 12: User isolation — User A What-If does NOT leak into User B "For 10%"', async () => {
      // User A runs What-If
      const resA = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What if I reduce Shopping by 20%?', month });
      expect(resA.status).toBe(200);

      // User B sends "For 10%"
      const resB = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ message: 'For 10%', month });

      expect(resB.status).toBe(200);
      expect(resB.body.data.message).not.toContain("Reducing your spending in 'Shopping'");
    });
  });

  // =================================================================
  // 3. STEP 14 RESPONSE QUALITY TEST
  // =================================================================
  describe('3. Step 14 Response Quality for Top Category Inquiries', () => {
    test('Top category query returns specific "Shopping contributed the most" phrasing', async () => {
      const res = await request(app)
        .post('/api/copilot/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'Which category contributed the most?', month });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('deterministic');
      expect(res.body.data.message).toContain("'Shopping' contributed the most, with ₹475");
      expect(res.body.data.message).toContain('57.58%');
    });
  });
});
