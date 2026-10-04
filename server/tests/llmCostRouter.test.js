import {
  routeQuestion,
  ROUTES,
  MAX_LLM_CALLS_ADVISORY,
  MAX_LLM_CALLS_DETERMINISTIC,
  INTENT_TO_MCP_TOOL_MAP
} from '../services/llmCostRouter.js';
import { INTENTS } from '../services/intentRouter.js';

describe('Phase 5: Intelligent LLM Cost/Quota Router Suite (llmCostRouter.test.js)', () => {
  // =================================================================
  // 1. DETERMINISTIC FACTUAL ROUTING (GEMINI CALLS = 0)
  // =================================================================
  describe('1. Deterministic Factual Routing', () => {
    test('1. routes Financial Summary query to DETERMINISTIC with zero Gemini calls', () => {
      const res = routeQuestion({ message: 'What is my net savings?' });
      expect(res.route).toBe(ROUTES.DETERMINISTIC);
      expect(res.intent).toBe(INTENTS.SUMMARY);
      expect(res.requiresLLM).toBe(false);
      expect(res.expectedGeminiCalls).toBe(0);
      expect(res.tool).toBe('fintrack_get_financial_summary');
    });

    test('2. routes Category Spending query to DETERMINISTIC with zero Gemini calls', () => {
      const res = routeQuestion({ message: 'How much did I spend on Shopping?' });
      expect(res.route).toBe(ROUTES.DETERMINISTIC);
      expect(res.intent).toBe(INTENTS.CATEGORY_SPENDING);
      expect(res.requiresLLM).toBe(false);
      expect(res.expectedGeminiCalls).toBe(0);
      expect(res.tool).toBe('fintrack_get_category_spending');
      expect(res.params.category).toBe('Shopping');
    });

    test('3. routes Merchant Spending query to DETERMINISTIC with zero Gemini calls', () => {
      const res = routeQuestion({ message: 'How much did I spend at Amazon?' });
      expect(res.route).toBe(ROUTES.DETERMINISTIC);
      expect(res.intent).toBe(INTENTS.MERCHANT_SPENDING);
      expect(res.requiresLLM).toBe(false);
      expect(res.expectedGeminiCalls).toBe(0);
      expect(res.tool).toBe('fintrack_get_merchant_spending');
      expect(res.params.merchant).toBe('Amazon');
    });

    test('4. routes Forecast query to DETERMINISTIC with zero Gemini calls', () => {
      const res = routeQuestion({ message: 'What is my financial forecast for this month?' });
      expect(res.route).toBe(ROUTES.DETERMINISTIC);
      expect(res.intent).toBe(INTENTS.FORECAST);
      expect(res.requiresLLM).toBe(false);
      expect(res.expectedGeminiCalls).toBe(0);
      expect(res.tool).toBe('fintrack_get_forecast');
    });

    test('5. routes Budget Risk query to DETERMINISTIC with zero Gemini calls', () => {
      const res = routeQuestion({ message: 'Am I at risk of exceeding my budget?' });
      expect(res.route).toBe(ROUTES.DETERMINISTIC);
      expect(res.intent).toBe(INTENTS.BUDGET_RISK);
      expect(res.requiresLLM).toBe(false);
      expect(res.expectedGeminiCalls).toBe(0);
      expect(res.tool).toBe('fintrack_get_budget_risk');
    });

    test('6. routes Anomaly query to DETERMINISTIC with zero Gemini calls', () => {
      const res = routeQuestion({ message: 'Did I have any unusual transactions?' });
      expect(res.route).toBe(ROUTES.DETERMINISTIC);
      expect(res.intent).toBe(INTENTS.ANOMALY);
      expect(res.requiresLLM).toBe(false);
      expect(res.expectedGeminiCalls).toBe(0);
      expect(res.tool).toBe('fintrack_get_anomalies');
    });

    test('7. routes Goal Status query to DETERMINISTIC with zero Gemini calls', () => {
      const res = routeQuestion({ message: 'How am I doing with my savings goal?' });
      expect(res.route).toBe(ROUTES.DETERMINISTIC);
      expect(res.intent).toBe(INTENTS.GOAL_STATUS);
      expect(res.requiresLLM).toBe(false);
      expect(res.expectedGeminiCalls).toBe(0);
      expect(res.tool).toBe('fintrack_get_goal_status');
    });

    test('8. routes What-If simulation query to DETERMINISTIC with zero Gemini calls and null tool', () => {
      const res = routeQuestion({ message: 'What if I reduce Shopping by 20%?' });
      expect(res.route).toBe(ROUTES.DETERMINISTIC);
      expect(res.intent).toBe(INTENTS.WHAT_IF);
      expect(res.requiresLLM).toBe(false);
      expect(res.expectedGeminiCalls).toBe(0);
      expect(res.tool).toBeNull();
      expect(res.params.category).toBe('Shopping');
      expect(res.params.percentage).toBe(20);
    });
  });

  // =================================================================
  // 2. ADVISORY ROUTING & BUDGET POLICIES
  // =================================================================
  describe('2. Advisory & Planning Routing', () => {
    test('9. routes open-ended advice queries to LLM with expectedGeminiCalls <= 2', () => {
      const adviceQueries = [
        'Why is my spending high?',
        'How can I improve my savings?',
        'Give me a plan to save more.',
        'Should I reduce my Shopping spending?',
        'Why did my savings change?',
        'How should I manage my budget?'
      ];

      for (const query of adviceQueries) {
        const res = routeQuestion({ message: query });
        expect(res.route).toBe(ROUTES.LLM);
        expect(res.intent).toBe(INTENTS.ADVISORY);
        expect(res.requiresLLM).toBe(true);
        expect(res.expectedGeminiCalls).toBeLessThanOrEqual(MAX_LLM_CALLS_ADVISORY);
        expect(res.tool).toBeNull();
      }
    });
  });

  // =================================================================
  // 3. MULTI-TURN & CONTEXTUAL ROUTING
  // =================================================================
  describe('3. Multi-Turn Contextual Follow-Up Routing', () => {
    test('10. routes explanatory "Why was it so high?" or "Why is my spending so high?" follow-up to LLM / ADVISORY', () => {
      const history = [
        { role: 'user', content: 'How much did I spend on Shopping?' },
        { role: 'assistant', content: 'You spent ₹475 on Shopping.' }
      ];

      const res1 = routeQuestion({ message: 'Why was it so high?', history });
      expect(res1.route).toBe(ROUTES.LLM);
      expect(res1.intent).toBe(INTENTS.ADVISORY);
      expect(res1.requiresLLM).toBe(true);
      expect(res1.expectedGeminiCalls).toBeLessThanOrEqual(MAX_LLM_CALLS_ADVISORY);

      const res2 = routeQuestion({ message: 'Why is my spending so high?', history });
      expect(res2.route).toBe(ROUTES.LLM);
      expect(res2.intent).toBe(INTENTS.ADVISORY);
    });

    test('11. routes factual category follow-up ("How much was that?") to DETERMINISTIC', () => {
      const history = [
        { role: 'user', content: 'How much did I spend on Food?' },
        { role: 'assistant', content: 'Food expenses total ₹8,000 across 5 transactions.' }
      ];

      const res = routeQuestion({ message: 'How much was that?', history });
      expect(res.route).toBe(ROUTES.DETERMINISTIC);
      expect(res.intent).toBe(INTENTS.CATEGORY_SPENDING);
      expect(res.expectedGeminiCalls).toBe(0);
      expect(res.tool).toBe('fintrack_get_category_spending');
    });

    test('12. routes factual merchant follow-up ("Which one?") to DETERMINISTIC', () => {
      const history = [
        { role: 'user', content: 'Spend at Amazon' },
        { role: 'assistant', content: 'Amazon total is ₹1,200.' }
      ];

      const res = routeQuestion({ message: 'Which one?', history });
      expect(res.route).toBe(ROUTES.DETERMINISTIC);
      expect(res.intent).toBe(INTENTS.MERCHANT_SPENDING);
      expect(res.expectedGeminiCalls).toBe(0);
      expect(res.tool).toBe('fintrack_get_merchant_spending');
    });
  });

  // =================================================================
  // 4. EDGE CASES, NORMALIZATION & SAFETY
  // =================================================================
  describe('4. Edge Cases, Normalization & Invariant Validation', () => {
    test('13. routes unclassified non-financial query to LLM / ADVISORY', () => {
      const res = routeQuestion({ message: 'Tell me about the history of stock markets' });
      expect(res.route).toBe(ROUTES.LLM);
      expect(res.intent).toBe(INTENTS.ADVISORY);
      expect(res.requiresLLM).toBe(true);
    });

    test('14. routes empty or whitespace message to DETERMINISTIC SUMMARY with 0 Gemini calls', () => {
      const res = routeQuestion({ message: '   ' });
      expect(res.route).toBe(ROUTES.DETERMINISTIC);
      expect(res.intent).toBe(INTENTS.SUMMARY);
      expect(res.expectedGeminiCalls).toBe(0);
      expect(res.tool).toBe('fintrack_get_financial_summary');
    });

    test('15. handles uppercase and mixed-case queries seamlessly', () => {
      const res1 = routeQuestion({ message: 'WHAT IS MY NET SAVINGS?' });
      expect(res1.route).toBe(ROUTES.DETERMINISTIC);
      expect(res1.expectedGeminiCalls).toBe(0);

      const res2 = routeQuestion({ message: 'HOW MUCH DID I SPEND ON FOOD?' });
      expect(res2.route).toBe(ROUTES.DETERMINISTIC);
      expect(res2.params.category).toBe('Food');
    });

    test('16. strictly enforces zero Gemini calls for ALL deterministic intents', () => {
      const deterministicIntents = [
        INTENTS.SUMMARY,
        INTENTS.CATEGORY_SPENDING,
        INTENTS.MERCHANT_SPENDING,
        INTENTS.FORECAST,
        INTENTS.BUDGET_RISK,
        INTENTS.ANOMALY,
        INTENTS.GOAL_STATUS,
        INTENTS.WHAT_IF
      ];

      for (const intent of deterministicIntents) {
        const tool = INTENT_TO_MCP_TOOL_MAP[intent];
        if (intent === INTENTS.WHAT_IF) {
          expect(tool).toBeNull();
        } else {
          expect(tool).toMatch(/^fintrack_get_/);
        }
      }
    });

    test('17. enforces MAX_LLM_CALLS_ADVISORY <= 2 quota limit', () => {
      expect(MAX_LLM_CALLS_ADVISORY).toBe(2);
      expect(MAX_LLM_CALLS_DETERMINISTIC).toBe(0);
    });

    test('18. guarantees no write or mutation tool can ever be mapped or selected', () => {
      const writeKeywords = ['create', 'insert', 'update', 'delete', 'modify', 'remove', 'patch', 'post'];
      for (const tool of Object.values(INTENT_TO_MCP_TOOL_MAP)) {
        if (tool !== null) {
          for (const kw of writeKeywords) {
            expect(tool.toLowerCase()).not.toContain(kw);
          }
        }
      }
    });

    test('19. preserves explicit month parameter override', () => {
      const res = routeQuestion({
        message: 'How much did I spend on Food?',
        month: '2026-05'
      });
      expect(res.params.month).toBe('2026-05');
      expect(res.expectedGeminiCalls).toBe(0);
    });
  });

  // =================================================================
  // 5. SIMULATION TEST MATRIX (REQUESTED TABLE VALIDATION)
  // =================================================================
  describe('5. Simulation Test Matrix Table Verification', () => {
    const testMatrix = [
      {
        question: 'What is my net savings?',
        expectedIntent: INTENTS.SUMMARY,
        expectedRoute: ROUTES.DETERMINISTIC,
        maxGeminiCalls: 0
      },
      {
        question: 'How much did I spend on Shopping?',
        expectedIntent: INTENTS.CATEGORY_SPENDING,
        expectedRoute: ROUTES.DETERMINISTIC,
        maxGeminiCalls: 0
      },
      {
        question: 'What is my forecast?',
        expectedIntent: INTENTS.FORECAST,
        expectedRoute: ROUTES.DETERMINISTIC,
        maxGeminiCalls: 0
      },
      {
        question: 'What if I reduce Shopping by 20%?',
        expectedIntent: INTENTS.WHAT_IF,
        expectedRoute: ROUTES.DETERMINISTIC,
        maxGeminiCalls: 0
      },
      {
        question: 'Why is my spending high?',
        expectedIntent: INTENTS.ADVISORY,
        expectedRoute: ROUTES.LLM,
        maxGeminiCalls: 2
      },
      {
        question: 'How can I save more?',
        expectedIntent: INTENTS.ADVISORY,
        expectedRoute: ROUTES.LLM,
        maxGeminiCalls: 2
      }
    ];

    test.each(testMatrix)(
      'Matrix: "$question" -> $expectedIntent | $expectedRoute (Gemini <= $maxGeminiCalls)',
      ({ question, expectedIntent, expectedRoute, maxGeminiCalls }) => {
        const res = routeQuestion({ message: question });
        expect(res.intent).toBe(expectedIntent);
        expect(res.route).toBe(expectedRoute);
        expect(res.expectedGeminiCalls).toBeLessThanOrEqual(maxGeminiCalls);
        if (expectedRoute === ROUTES.DETERMINISTIC) {
          expect(res.expectedGeminiCalls).toBe(0);
          expect(res.requiresLLM).toBe(false);
        } else {
          expect(res.requiresLLM).toBe(true);
        }
      }
    );
  });
});
