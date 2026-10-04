import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import axios from 'axios';
import app from '../app.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import ActionPlan from '../models/ActionPlan.js';
import { getProactiveInsights } from '../services/proactiveInsightService.js';
import {
  explainFinancialMetric,
  generateHeuristicExplanation,
  SUPPORTED_EXPLAIN_CONTEXT_TYPES
} from '../services/copilotService.js';

describe('Phase 6.4.3: Explain This & Proactive Financial Insights Suite (proactiveInsight.test.js)', () => {
  const JWT_SECRET = 'test_jwt_secret_key_1234567890abcdef';
  const userAId = new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9fd1');
  const userBId = new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9fd2');

  const tokenUserA = jwt.sign({ id: userAId.toString() }, JWT_SECRET, { expiresIn: '1d' });
  const tokenUserB = jwt.sign({ id: userBId.toString() }, JWT_SECRET, { expiresIn: '1d' });

  const mockTransactionsUserA = [
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'income',
      amount: 625,
      category: 'Other',
      description: 'Consulting payment',
      status: 'confirmed',
      transactionDate: new Date('2026-09-05')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      amount: 600,
      category: 'Other',
      description: 'Office supplies',
      status: 'confirmed',
      transactionDate: new Date('2026-09-10')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      amount: 475,
      category: 'Shopping',
      description: 'Amazon purchase',
      status: 'confirmed',
      transactionDate: new Date('2026-09-15')
    }
  ];

  let originalGeminiKey;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    originalGeminiKey = process.env.GEMINI_API_KEY;
  });

  beforeEach(() => {
    process.env.GEMINI_API_KEY = '';
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalGeminiKey;
    jest.restoreAllMocks();
  });

  const setupTxMock = (txList = mockTransactionsUserA, budgetDoc = null) => {
    jest.spyOn(Transaction, 'find').mockImplementation((query) => {
      const filtered = txList.filter((t) => {
        if (query.userId && t.userId.toString() !== query.userId.toString()) return false;
        if (query.status && t.status !== query.status) return false;
        return true;
      });
      return {
        sort: jest.fn().mockResolvedValue(filtered),
        then: (resolve) => resolve(filtered)
      };
    });
    jest.spyOn(Budget, 'findOne').mockResolvedValue(budgetDoc);
    jest.spyOn(Goal, 'find').mockResolvedValue([]);
    jest.spyOn(ActionPlan, 'find').mockImplementation(() => ({
      limit: jest.fn().mockResolvedValue([]),
      then: (resolve) => resolve([])
    }));
  };

  // =================================================================
  // PART A: EXPLAIN THIS TESTS (1-16)
  // =================================================================
  describe('Explain This Capability (/api/copilot/explain)', () => {
    it('1. Valid savings-rate explanation: explains deficit cash flow with verified numbers', async () => {
      setupTxMock();

      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-09',
          contextType: 'savings_rate'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.period).toBe('2026-09');
      expect(res.body.data.title).toContain('savings rate');
      expect(res.body.data.explanation).toContain('-₹450');
      expect(res.body.data.explanation).toContain('-72%');
      expect(res.body.data.keyDrivers.length).toBeGreaterThan(0);
      expect(res.body.data.recommendedAction).toBeDefined();
    });

    it('2. Valid category explanation: explains category spending distribution', async () => {
      setupTxMock();

      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-09',
          contextType: 'category_spend'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toContain('Category');
      expect(res.body.data.explanation).toContain('Other');
      expect(res.body.data.explanation).toContain('₹600');
    });

    it('3. Valid anomaly explanation: reports anomaly state when no anomalies exist', async () => {
      setupTxMock();

      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-09',
          contextType: 'anomaly'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toMatch(/anomal/i);
      expect(res.body.data.explanation).toBeDefined();
    });

    it('4. Valid forecast explanation: returns burn velocity and run-rate projection', async () => {
      setupTxMock();

      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-09',
          contextType: 'forecast'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toContain('Forecast');
      expect(res.body.data.explanation).toContain('burn rate');
      expect(res.body.data.keyDrivers.length).toBeGreaterThan(0);
    });

    it('5. Valid merchant concentration explanation: returns top vendor analytics', async () => {
      setupTxMock();

      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-09',
          contextType: 'merchant_concentration'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toContain('Concentration');
      expect(res.body.data.explanation).toBeDefined();
    });

    it('6. Valid budget velocity explanation: analyzes budget headroom and utilization', async () => {
      setupTxMock();

      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-09',
          contextType: 'budget_velocity'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toContain('Budget');
      expect(res.body.data.explanation).toBeDefined();
    });

    it('7. Invalid contextType: rejects unsupported context type with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-09',
          contextType: 'unsupported_random_type'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid contextType');
    });

    it('8. Invalid month: rejects malformed month format with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-15',
          contextType: 'savings_rate'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid month format');
    });

    it('9. Missing authentication: rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/copilot/explain')
        .send({
          month: '2026-09',
          contextType: 'savings_rate'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('10. Cross-user protection: ensures explanation queries only authenticated user data', async () => {
      setupTxMock();

      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-09',
          userId: userBId.toString(), // client spoof attempt
          contextType: 'savings_rate'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.explanation).toContain('₹625');
    });

    it('11. Client itemData cannot override server financial values: numbers stay grounded', async () => {
      setupTxMock();

      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-09',
          contextType: 'savings_rate',
          itemData: {
            income: 999999, // fake numbers in client body
            expenses: 1,
            netSavings: 999998
          }
        });

      expect(res.status).toBe(200);
      // Server uses verified facts (Income: 625, Expenses: 1075, Net Savings: -450)
      expect(res.body.data.explanation).toContain('₹625');
      expect(res.body.data.explanation).toContain('₹1,075');
      expect(res.body.data.explanation).toContain('-₹450');
      expect(res.body.data.explanation).not.toContain('999999');
    });

    it('12. Gemini success: returns structured response with provider "gemini"', async () => {
      setupTxMock();
      process.env.GEMINI_API_KEY = 'test_valid_gemini_api_key_12345';

      jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      title: 'Understanding Negative Savings in September',
                      explanation: 'Your expenses exceeded income by ₹450 in September 2026.',
                      keyDrivers: ['Other Category: ₹600', 'Shopping: ₹475'],
                      recommendedAction: 'Reduce discretionary purchases next month.'
                    })
                  }
                ]
              }
            }
          ]
        }
      });

      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-09',
          contextType: 'savings_rate'
        });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('gemini');
      expect(res.body.data.title).toBe('Understanding Negative Savings in September');
    });

    it('13. Gemini 429 fallback: falls back smoothly to heuristic explanation on rate limit', async () => {
      setupTxMock();
      process.env.GEMINI_API_KEY = 'test_valid_gemini_api_key_12345';

      const err429 = new Error('Quota exceeded');
      err429.response = { status: 429, data: { error: { message: 'Quota exceeded for free tier' } } };
      jest.spyOn(axios, 'post').mockRejectedValue(err429);

      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-09',
          contextType: 'savings_rate'
        });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('heuristic');
      expect(res.body.data.explanation).toContain('-₹450');
    });

    it('14. Invalid Gemini response fallback: falls back when Gemini returns non-JSON text', async () => {
      setupTxMock();
      process.env.GEMINI_API_KEY = 'test_valid_gemini_api_key_12345';

      jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          candidates: [{ content: { parts: [{ text: 'Non-JSON unparseable response' }] } }]
        }
      });

      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-09',
          contextType: 'savings_rate'
        });

      expect(res.status).toBe(200);
      expect(res.body.provider).toBe('heuristic');
    });

    it('15. Staged transactions excluded: staged records never enter Explain intelligence', async () => {
      const allTx = [
        ...mockTransactionsUserA,
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'income',
          amount: 50000,
          category: 'Salary',
          status: 'staged',
          transactionDate: new Date('2026-09-01')
        }
      ];
      setupTxMock(allTx);

      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-09',
          contextType: 'savings_rate'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.explanation).toContain('₹625');
      expect(res.body.data.explanation).not.toContain('50000');
    });

    it('16. Ignored transactions excluded: ignored records never enter Explain intelligence', async () => {
      const allTx = [
        ...mockTransactionsUserA,
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 15000,
          category: 'Shopping',
          status: 'ignored',
          transactionDate: new Date('2026-09-02')
        }
      ];
      setupTxMock(allTx);

      const res = await request(app)
        .post('/api/copilot/explain')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          month: '2026-09',
          contextType: 'savings_rate'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.explanation).toContain('₹1,075');
      expect(res.body.data.explanation).not.toContain('15000');
    });
  });

  // =================================================================
  // PART B: PROACTIVE FINANCIAL INSIGHTS TESTS (17-30)
  // =================================================================
  describe('Proactive Financial Insights Engine (/api/copilot/proactive-insights)', () => {
    it('17. Negative net savings triggers deficit insight (type: "danger", priority: 1)', async () => {
      setupTxMock();

      const res = await request(app)
        .get('/api/copilot/proactive-insights?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const deficitInsight = res.body.data.find((i) => i.id === 'insight_deficit_alert');
      expect(deficitInsight).toBeDefined();
      expect(deficitInsight.type).toBe('danger');
      expect(deficitInsight.priority).toBe(1);
      expect(deficitInsight.message).toContain('-₹450');
    });

    it('18. Positive savings rate >=40 triggers savings milestone insight (type: "success", priority: 3)', async () => {
      const surplusTx = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'income',
          amount: 10000,
          category: 'Salary',
          status: 'confirmed',
          transactionDate: new Date('2026-09-01')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 4000,
          category: 'Rent',
          status: 'confirmed',
          transactionDate: new Date('2026-09-05')
        }
      ];
      setupTxMock(surplusTx);

      const res = await request(app)
        .get('/api/copilot/proactive-insights?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      const milestone = res.body.data.find((i) => i.id === 'insight_savings_milestone');
      expect(milestone).toBeDefined();
      expect(milestone.type).toBe('success');
      expect(milestone.priority).toBe(3);
      expect(milestone.message).toContain('60%');
    });

    it('19. Anomaly triggers warning insight (type: "warning", priority: 2)', async () => {
      const anomalyTx = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'income',
          amount: 5000,
          category: 'Salary',
          status: 'confirmed',
          transactionDate: new Date('2026-09-01')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 100,
          category: 'Food',
          status: 'confirmed',
          transactionDate: new Date('2026-09-02')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 100,
          category: 'Food',
          status: 'confirmed',
          transactionDate: new Date('2026-09-03')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 2500, // statistical outlier
          category: 'Food',
          status: 'confirmed',
          transactionDate: new Date('2026-09-10')
        }
      ];
      setupTxMock(anomalyTx);

      const res = await request(app)
        .get('/api/copilot/proactive-insights?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      const anomInsight = res.body.data.find((i) => i.id === 'insight_anomaly_detected');
      expect(anomInsight).toBeDefined();
      expect(anomInsight.type).toBe('warning');
      expect(anomInsight.priority).toBe(2);
    });

    it('20. HIGH_RISK forecast triggers danger insight (type: "danger", priority: 1)', async () => {
      const budgetDoc = { monthlyBudget: 1000 };
      const heavyExpenses = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 1500,
          category: 'Shopping',
          status: 'confirmed',
          transactionDate: new Date('2026-09-05')
        }
      ];
      setupTxMock(heavyExpenses, budgetDoc);

      const res = await request(app)
        .get('/api/copilot/proactive-insights?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      const forecastRisk = res.body.data.find((i) => i.id === 'insight_forecast_risk');
      expect(forecastRisk).toBeDefined();
      expect(forecastRisk.type).toBe('danger');
      expect(forecastRisk.priority).toBe(1);
    });

    it('21. CRITICAL forecast triggers danger insight', async () => {
      const budgetDoc = { monthlyBudget: 500 };
      const criticalExpenses = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 1000,
          category: 'Shopping',
          status: 'confirmed',
          transactionDate: new Date('2026-09-05')
        }
      ];
      setupTxMock(criticalExpenses, budgetDoc);

      const res = await request(app)
        .get('/api/copilot/proactive-insights?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      const forecastRisk = res.body.data.find((i) => i.id === 'insight_forecast_risk');
      expect(forecastRisk).toBeDefined();
      expect(forecastRisk.type).toBe('danger');
    });

    it('22. Category concentration >40 triggers warning insight (type: "warning", priority: 2)', async () => {
      setupTxMock(); // Other is 600/1075 = 55.8% > 40%

      const res = await request(app)
        .get('/api/copilot/proactive-insights?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      const catConcentration = res.body.data.find((i) => i.id === 'insight_category_concentration');
      expect(catConcentration).toBeDefined();
      expect(catConcentration.type).toBe('warning');
      expect(catConcentration.message).toContain('Other');
    });

    it('23. No matching conditions returns empty list with count: 0', async () => {
      // Balanced healthy scenario: savings rate 20%, no concentration >40%, no anomalies, no budget overrun
      const balancedTx = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'income',
          amount: 10000,
          category: 'Salary',
          status: 'confirmed',
          transactionDate: new Date('2026-09-01')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 2500,
          category: 'Rent',
          status: 'confirmed',
          transactionDate: new Date('2026-09-02')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 2500,
          category: 'Food',
          status: 'confirmed',
          transactionDate: new Date('2026-09-03')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 2500,
          category: 'Utilities',
          status: 'confirmed',
          transactionDate: new Date('2026-09-04')
        }
      ];
      setupTxMock(balancedTx);

      const res = await request(app)
        .get('/api/copilot/proactive-insights?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('24. Priority ordering: insights are sorted strictly with danger (1) before warning (2) and success (3)', async () => {
      setupTxMock(); // Triggers deficit (1) and category concentration (2)

      const res = await request(app)
        .get('/api/copilot/proactive-insights?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0].priority).toBeLessThanOrEqual(res.body.data[1].priority);
      expect(res.body.data[0].type).toBe('danger');
    });

    it('25. Stable ordering: insights with identical priority sort deterministically by id', async () => {
      // Create conditions triggering 2 warning insights (anomaly + category concentration)
      const multiWarningTx = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'income',
          amount: 10000,
          category: 'Salary',
          status: 'confirmed',
          transactionDate: new Date('2026-09-01')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 100,
          category: 'Food',
          status: 'confirmed',
          transactionDate: new Date('2026-09-02')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 100,
          category: 'Food',
          status: 'confirmed',
          transactionDate: new Date('2026-09-03')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 4000, // anomaly & >40% of expense
          category: 'Food',
          status: 'confirmed',
          transactionDate: new Date('2026-09-05')
        }
      ];
      setupTxMock(multiWarningTx);

      const res = await request(app)
        .get('/api/copilot/proactive-insights?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      const warnings = res.body.data.filter((i) => i.priority === 2);
      if (warnings.length >= 2) {
        expect(warnings[0].id.localeCompare(warnings[1].id)).toBeLessThanOrEqual(0);
      }
    });

    it('26. User isolation: only returns proactive insights for authenticated user', async () => {
      setupTxMock();

      const res = await request(app)
        .get('/api/copilot/proactive-insights?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserB}`); // User B has 0 tx

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('27. Staged and ignored transactions are excluded from proactive triggers', async () => {
      const mixedTx = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'income',
          amount: 10000,
          category: 'Salary',
          status: 'staged', // staged, must be ignored
          transactionDate: new Date('2026-09-01')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 50000,
          category: 'Shopping',
          status: 'ignored', // ignored, must be ignored
          transactionDate: new Date('2026-09-02')
        }
      ];
      setupTxMock(mixedTx);

      const res = await request(app)
        .get('/api/copilot/proactive-insights?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('28. Zero-transaction month: returns empty insight array gracefully', async () => {
      setupTxMock([]);

      const res = await request(app)
        .get('/api/copilot/proactive-insights?month=2026-08')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it('29. Zero-income month: handles 0 income gracefully without crashing or invalid division', async () => {
      const expenseOnlyTx = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userAId,
          type: 'expense',
          amount: 500,
          category: 'Food',
          status: 'confirmed',
          transactionDate: new Date('2026-09-05')
        }
      ];
      setupTxMock(expenseOnlyTx);

      const res = await request(app)
        .get('/api/copilot/proactive-insights?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      const deficitAlert = res.body.data.find((i) => i.id === 'insight_deficit_alert');
      expect(deficitAlert).toBeDefined();
    });

    it('30. No database mutation: verifies read-only execution with zero writes to database', async () => {
      const createTxSpy = jest.spyOn(Transaction, 'create');
      const updateTxSpy = jest.spyOn(Transaction, 'updateOne');
      const createBudgetSpy = jest.spyOn(Budget, 'create');

      setupTxMock();

      const res = await request(app)
        .get('/api/copilot/proactive-insights?month=2026-09')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(createTxSpy).not.toHaveBeenCalled();
      expect(updateTxSpy).not.toHaveBeenCalled();
      expect(createBudgetSpy).not.toHaveBeenCalled();
    });
  });
});
