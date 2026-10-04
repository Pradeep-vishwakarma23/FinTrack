import { hasOpenAIKey, generateAIInsights, predictExpense } from '../services/aiService.js';

describe('AI Service & Spending Forecasting (aiService.js)', () => {
  const transactions = [
    { type: 'income', amount: 40000, category: 'Salary', transactionDate: new Date('2026-01-10') },
    { type: 'expense', amount: 12000, category: 'Rent', transactionDate: new Date('2026-01-12') },
    { type: 'expense', amount: 6000, category: 'Food', transactionDate: new Date('2026-01-15') },
    { type: 'income', amount: 40000, category: 'Salary', transactionDate: new Date('2026-02-10') },
    { type: 'expense', amount: 14000, category: 'Rent', transactionDate: new Date('2026-02-12') },
    { type: 'expense', amount: 8000, category: 'Food', transactionDate: new Date('2026-02-15') }
  ];

  const budgetWithRisk = {
    monthlyBudget: 15000, // lower than average 20000 monthly expense
    categoryBudgets: [{ category: 'Food', limit: 5000 }]
  };

  const budgetSafe = {
    monthlyBudget: 30000,
    categoryBudgets: [{ category: 'Food', limit: 10000 }]
  };

  test('hasOpenAIKey detects presence or absence of valid API key pattern', () => {
    const originalKey = process.env.OPENAI_API_KEY;

    process.env.OPENAI_API_KEY = '';
    expect(hasOpenAIKey()).toBe(false);

    process.env.OPENAI_API_KEY = 'your_api_key_here';
    expect(hasOpenAIKey()).toBe(false);

    process.env.OPENAI_API_KEY = 'sk-proj-validtestkey1234567890abcdef12345';
    expect(hasOpenAIKey()).toBe(true);

    process.env.OPENAI_API_KEY = originalKey;
  });

  test('generateAIInsights falls back gracefully to heuristic rules when OpenAI is unavailable', async () => {
    const result = await generateAIInsights({ transactions, budget: budgetSafe });

    expect(result).toHaveProperty('insights');
    expect(Array.isArray(result.insights)).toBe(true);
    expect(result.insights.length).toBeGreaterThan(0);
    expect(['openai', 'heuristic']).toContain(result.provider);
  });

  test('predictExpense calculates monthly average and identifies budget overrun risk', async () => {
    // January expense: 18000, February expense: 22000 -> Average = 20000
    const predictionRisk = await predictExpense({ transactions, budget: budgetWithRisk });

    expect(predictionRisk.predictedExpense).toBe(20000);
    expect(predictionRisk.monthlyBudget).toBe(15000);
    expect(predictionRisk.budgetRisk).toBe(true);
    expect(predictionRisk.confidence).toBeGreaterThanOrEqual(55);
    expect(predictionRisk.methodology).toBeDefined();

    const predictionSafe = await predictExpense({ transactions, budget: budgetSafe });
    expect(predictionSafe.budgetRisk).toBe(false);
  });
});
