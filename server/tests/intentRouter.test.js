import {
  classifyIntent,
  extractCategory,
  extractMerchant,
  extractMonth,
  extractWhatIfParams,
  INTENTS
} from '../services/intentRouter.js';

describe('Phase 1: Intent Router Unit Tests', () => {
  describe('1. Summary Detection', () => {
    test('detects net savings query as SUMMARY', () => {
      const res = classifyIntent({ message: 'What is my net savings?' });
      expect(res.intent).toBe(INTENTS.SUMMARY);
      expect(res.requiresLLM).toBe(false);
      expect(res.confidence).toBeGreaterThanOrEqual(0.9);
    });

    test('detects general spend query as SUMMARY', () => {
      const res = classifyIntent({ message: 'How much did I spend?' });
      expect(res.intent).toBe(INTENTS.SUMMARY);
      expect(res.requiresLLM).toBe(false);
    });

    test('detects income query as SUMMARY', () => {
      const res = classifyIntent({ message: 'What is my total income?' });
      expect(res.intent).toBe(INTENTS.SUMMARY);
      expect(res.requiresLLM).toBe(false);
    });

    test('detects financial overview and savings rate as SUMMARY', () => {
      const res1 = classifyIntent({ message: 'Give me a financial summary' });
      expect(res1.intent).toBe(INTENTS.SUMMARY);
      expect(res1.requiresLLM).toBe(false);

      const res2 = classifyIntent({ message: 'What is my savings rate?' });
      expect(res2.intent).toBe(INTENTS.SUMMARY);
      expect(res2.requiresLLM).toBe(false);
    });
  });

  describe('2. Category Spending Detection', () => {
    test('detects specific category spending query', () => {
      const res = classifyIntent({ message: 'How much did I spend on Shopping?' });
      expect(res.intent).toBe(INTENTS.CATEGORY_SPENDING);
      expect(res.requiresLLM).toBe(false);
      expect(res.params.category).toBe('Shopping');
    });

    test('detects general category queries', () => {
      const res1 = classifyIntent({ message: 'What category did I spend the most on?' });
      expect(res1.intent).toBe(INTENTS.CATEGORY_SPENDING);
      expect(res1.requiresLLM).toBe(false);

      const res2 = classifyIntent({ message: 'Which category contributed the most?' });
      expect(res2.intent).toBe(INTENTS.CATEGORY_SPENDING);
      expect(res2.requiresLLM).toBe(false);

      const res3 = classifyIntent({ message: 'Show category breakdown' });
      expect(res3.intent).toBe(INTENTS.CATEGORY_SPENDING);
      expect(res3.requiresLLM).toBe(false);
    });

    test('extracts standard categories accurately', () => {
      expect(extractCategory('How much on food?')).toBe('Food');
      expect(extractCategory('Bills payment total')).toBe('Bills');
      expect(extractCategory('My travel expenses')).toBe('Travel');
      expect(extractCategory('Healthcare cost')).toBe('Healthcare');
    });
  });

  describe('3. Merchant Spending Detection', () => {
    test('detects specific merchant query with Amazon', () => {
      const res = classifyIntent({ message: 'How much did I spend at Amazon?' });
      expect(res.intent).toBe(INTENTS.MERCHANT_SPENDING);
      expect(res.requiresLLM).toBe(false);
      expect(res.params.merchant).toBe('Amazon');
    });

    test('detects top payee and top merchant queries', () => {
      const res1 = classifyIntent({ message: 'Who did I pay the most?' });
      expect(res1.intent).toBe(INTENTS.MERCHANT_SPENDING);
      expect(res1.requiresLLM).toBe(false);

      const res2 = classifyIntent({ message: 'Show top merchants' });
      expect(res2.intent).toBe(INTENTS.MERCHANT_SPENDING);
      expect(res2.requiresLLM).toBe(false);

      const res3 = classifyIntent({ message: 'Which merchant took the most money?' });
      expect(res3.intent).toBe(INTENTS.MERCHANT_SPENDING);
      expect(res3.requiresLLM).toBe(false);
    });

    test('extracts merchant names accurately', () => {
      expect(extractMerchant('Paid to Swiggy')).toBe('Swiggy');
      expect(extractMerchant('Spend at Netflix')).toBe('Netflix');
      expect(extractMerchant('How much at Uber this month?')).toBe('Uber');
    });
  });

  describe('4. Forecast Detection', () => {
    test('detects month-end expense forecasting queries', () => {
      const res1 = classifyIntent({ message: 'What will my expenses be this month?' });
      expect(res1.intent).toBe(INTENTS.FORECAST);
      expect(res1.requiresLLM).toBe(false);

      const res2 = classifyIntent({ message: 'Project my spending for this month' });
      expect(res2.intent).toBe(INTENTS.FORECAST);
      expect(res2.requiresLLM).toBe(false);

      const res3 = classifyIntent({ message: 'What is my daily burn rate?' });
      expect(res3.intent).toBe(INTENTS.FORECAST);
      expect(res3.requiresLLM).toBe(false);

      const res4 = classifyIntent({ message: 'What is my projected month end spend?' });
      expect(res4.intent).toBe(INTENTS.FORECAST);
      expect(res4.requiresLLM).toBe(false);
    });
  });

  describe('5. Budget Risk Detection', () => {
    test('detects budget risk and overspend velocity queries', () => {
      const res1 = classifyIntent({ message: 'Am I at risk of exceeding my budget?' });
      expect(res1.intent).toBe(INTENTS.BUDGET_RISK);
      expect(res1.requiresLLM).toBe(false);

      const res2 = classifyIntent({ message: 'Will I exceed my budget?' });
      expect(res2.intent).toBe(INTENTS.BUDGET_RISK);
      expect(res2.requiresLLM).toBe(false);

      const res3 = classifyIntent({ message: 'What is my budget velocity?' });
      expect(res3.intent).toBe(INTENTS.BUDGET_RISK);
      expect(res3.requiresLLM).toBe(false);

      const res4 = classifyIntent({ message: 'Am I over budget?' });
      expect(res4.intent).toBe(INTENTS.BUDGET_RISK);
      expect(res4.requiresLLM).toBe(false);
    });
  });

  describe('6. Anomaly Detection', () => {
    test('detects unusual transactions and outlier queries', () => {
      const res1 = classifyIntent({ message: 'Did I have any unusual transactions?' });
      expect(res1.intent).toBe(INTENTS.ANOMALY);
      expect(res1.requiresLLM).toBe(false);

      const res2 = classifyIntent({ message: 'Show anomalies in my spending' });
      expect(res2.intent).toBe(INTENTS.ANOMALY);
      expect(res2.requiresLLM).toBe(false);

      const res3 = classifyIntent({ message: 'Are there any outliers in my spending?' });
      expect(res3.intent).toBe(INTENTS.ANOMALY);
      expect(res3.requiresLLM).toBe(false);
    });
  });

  describe('7. Goal Status Detection', () => {
    test('detects goal tracking and savings target queries', () => {
      const res1 = classifyIntent({ message: 'How am I doing with my savings goal?' });
      expect(res1.intent).toBe(INTENTS.GOAL_STATUS);
      expect(res1.requiresLLM).toBe(false);

      const res2 = classifyIntent({ message: 'Show my goals progress' });
      expect(res2.intent).toBe(INTENTS.GOAL_STATUS);
      expect(res2.requiresLLM).toBe(false);

      const res3 = classifyIntent({ message: 'Am I on track for my goal?' });
      expect(res3.intent).toBe(INTENTS.GOAL_STATUS);
      expect(res3.requiresLLM).toBe(false);
    });
  });

  describe('8. Advisory Detection (Requires LLM)', () => {
    test('detects open-ended advice and planning queries as ADVISORY', () => {
      const res1 = classifyIntent({ message: 'How can I save more money?' });
      expect(res1.intent).toBe(INTENTS.ADVISORY);
      expect(res1.requiresLLM).toBe(true);

      const res2 = classifyIntent({ message: 'Why is my spending high?' });
      expect(res2.intent).toBe(INTENTS.ADVISORY);
      expect(res2.requiresLLM).toBe(true);

      const res3 = classifyIntent({ message: 'Create a plan for me.' });
      expect(res3.intent).toBe(INTENTS.ADVISORY);
      expect(res3.requiresLLM).toBe(true);

      const res4 = classifyIntent({ message: 'Give me financial advice.' });
      expect(res4.intent).toBe(INTENTS.ADVISORY);
      expect(res4.requiresLLM).toBe(true);
    });
  });

  describe('9. What-If Preservation (Deterministic Simulation)', () => {
    test('preserves What-If scenarios without routing to ADVISORY', () => {
      const res1 = classifyIntent({ message: 'What if I reduce Shopping by 20%?' });
      expect(res1.intent).toBe(INTENTS.WHAT_IF);
      expect(res1.requiresLLM).toBe(false);
      expect(res1.params.category).toBe('Shopping');
      expect(res1.params.percentage).toBe(20);

      const res2 = classifyIntent({ message: 'How much would I save if I cut Shopping by 10%?' });
      expect(res2.intent).toBe(INTENTS.WHAT_IF);
      expect(res2.requiresLLM).toBe(false);
      expect(res2.params.category).toBe('Shopping');
      expect(res2.params.percentage).toBe(10);

      const res3 = classifyIntent({ message: 'What would my new savings be?' });
      expect(res3.intent).toBe(INTENTS.WHAT_IF);
      expect(res3.requiresLLM).toBe(false);

      const res4 = classifyIntent({ message: 'What would my new expenses be?' });
      expect(res4.intent).toBe(INTENTS.WHAT_IF);
      expect(res4.requiresLLM).toBe(false);

      const whatIfHistory = [
        { role: 'user', content: 'What if I reduce Shopping by 10%?' },
        { role: 'assistant', content: "Reducing your spending in 'Shopping' by 10% would save ₹48." }
      ];

      const res5 = classifyIntent({ message: 'For 20%', history: whatIfHistory });
      expect(res5.intent).toBe(INTENTS.WHAT_IF);
      expect(res5.params.category).toBe('Shopping');
      expect(res5.params.percentage).toBe(20);
      expect(res5.requiresLLM).toBe(false);

      const res6 = classifyIntent({ message: 'Try 25%', history: whatIfHistory });
      expect(res6.intent).toBe(INTENTS.WHAT_IF);
      expect(res6.params.category).toBe('Shopping');
      expect(res6.params.percentage).toBe(25);
      expect(res6.requiresLLM).toBe(false);
    });
  });

  describe('10. Case-Insensitivity & Month Parameter Extraction', () => {
    test('handles uppercase and mixed case queries', () => {
      const res1 = classifyIntent({ message: 'WHAT IS MY NET SAVINGS?' });
      expect(res1.intent).toBe(INTENTS.SUMMARY);
      expect(res1.requiresLLM).toBe(false);

      const res2 = classifyIntent({ message: 'HOW MUCH DID I SPEND ON SHOPPING?' });
      expect(res2.intent).toBe(INTENTS.CATEGORY_SPENDING);
      expect(res2.params.category).toBe('Shopping');

      const res3 = classifyIntent({ message: 'WHO DID I PAY THE MOST?' });
      expect(res3.intent).toBe(INTENTS.MERCHANT_SPENDING);
    });

    test('extracts month parameter when specified', () => {
      const res = classifyIntent({ message: 'How much did I spend in 2026-03 on Food?' });
      expect(res.intent).toBe(INTENTS.CATEGORY_SPENDING);
      expect(res.params.category).toBe('Food');
      expect(res.params.month).toBe('2026-03');
    });
  });

  describe('11. Empty & Unknown Messages', () => {
    test('handles empty message gracefully', () => {
      const res = classifyIntent({ message: '' });
      expect(res.intent).toBe(INTENTS.SUMMARY);
      expect(res.requiresLLM).toBe(false);
    });

    test('handles unclassified / non-financial queries as ADVISORY', () => {
      const res = classifyIntent({ message: 'Tell me about the weather' });
      expect(res.intent).toBe(INTENTS.ADVISORY);
      expect(res.requiresLLM).toBe(true);
    });
  });

  describe('12. Multi-Turn Follow-Ups & Context Resolution', () => {
    test('resolves "Why?" follow-up after category query', () => {
      const history = [
        { role: 'user', content: 'How much did I spend on Shopping?' },
        { role: 'assistant', content: 'You spent ₹475 on Shopping.' }
      ];

      const res = classifyIntent({ message: 'Why?', history });
      expect(res.intent).toBe(INTENTS.CATEGORY_SPENDING);
      expect(res.requiresLLM).toBe(false);
      expect(res.params.category).toBe('Shopping');
      expect(res.resolvedContext.isFollowUp).toBe(true);
    });

    test('resolves "How much was that?" follow-up after merchant query', () => {
      const history = [
        { role: 'user', content: 'How much did I spend at Amazon?' },
        { role: 'assistant', content: 'You spent ₹1,200 at Amazon across 2 transactions.' }
      ];

      const res = classifyIntent({ message: 'How much was that?', history });
      expect(res.intent).toBe(INTENTS.MERCHANT_SPENDING);
      expect(res.requiresLLM).toBe(false);
      expect(res.params.merchant).toBe('Amazon');
      expect(res.resolvedContext.isFollowUp).toBe(true);
    });

    test('resolves "Tell me more" follow-up after goal inquiry', () => {
      const history = [
        { role: 'user', content: 'Show my savings goals' },
        { role: 'assistant', content: 'You have 1 active goal: Emergency Fund.' }
      ];

      const res = classifyIntent({ message: 'Tell me more', history });
      expect(res.intent).toBe(INTENTS.GOAL_STATUS);
      expect(res.requiresLLM).toBe(false);
      expect(res.resolvedContext.isFollowUp).toBe(true);
    });

    test('resolves "Explain that" follow-up after anomaly inquiry', () => {
      const history = [
        { role: 'user', content: 'Did I have any unusual transactions?' },
        { role: 'assistant', content: 'Flagged 1 anomaly: Flight Tickets.' }
      ];

      const res = classifyIntent({ message: 'Explain that', history });
      expect(res.intent).toBe(INTENTS.ANOMALY);
      expect(res.requiresLLM).toBe(false);
      expect(res.resolvedContext.isFollowUp).toBe(true);
    });
  });
});
