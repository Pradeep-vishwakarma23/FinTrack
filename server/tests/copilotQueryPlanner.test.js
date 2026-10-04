import {
  planCopilotQuery,
  isPureGreeting,
  splitMultiQuestions,
  QUERY_TYPES
} from '../services/copilotQueryPlanner.js';
import { INTENTS } from '../services/intentRouter.js';

describe('Phase 8.1: Copilot Query Planner Unit Tests (copilotQueryPlanner.test.js)', () => {
  // =================================================================
  // 1. GREETING & SMALL-TALK DETECTION
  // =================================================================
  describe('1. Greeting & Small-Talk Detection', () => {
    test('1. plans "Hi" as GREETING with zero LLM requirements', () => {
      const plan = planCopilotQuery({ message: 'Hi' });
      expect(plan.type).toBe(QUERY_TYPES.GREETING);
      expect(plan.requiresLLM).toBe(false);
      expect(plan.greetingResponse.message).toContain("I'm FinTrack Copilot");
    });

    test('2. plans "Hello" as GREETING', () => {
      const plan = planCopilotQuery({ message: 'Hello' });
      expect(plan.type).toBe(QUERY_TYPES.GREETING);
      expect(plan.requiresLLM).toBe(false);
    });

    test('3. plans "Hey" as GREETING', () => {
      const plan = planCopilotQuery({ message: 'Hey!' });
      expect(plan.type).toBe(QUERY_TYPES.GREETING);
      expect(plan.requiresLLM).toBe(false);
    });

    test('4. plans "Thank you" as GREETING with appreciative reply', () => {
      const plan = planCopilotQuery({ message: 'Thank you so much!' });
      expect(plan.type).toBe(QUERY_TYPES.GREETING);
      expect(plan.greetingResponse.message).toContain("You're welcome");
    });

    test('5. distinguishes financial query with greeting prefix ("Hi, what is my savings?") from pure greeting', () => {
      const plan = planCopilotQuery({ message: 'Hi, what is my savings?' });
      expect(plan.type).not.toBe(QUERY_TYPES.GREETING);
      expect(plan.intent).toBe(INTENTS.SUMMARY);
    });

    test('6. distinguishes "Hello, how much did I spend on Shopping?" from pure greeting', () => {
      const plan = planCopilotQuery({ message: 'Hello, how much did I spend on Shopping?' });
      expect(plan.type).not.toBe(QUERY_TYPES.GREETING);
      expect(plan.intent).toBe(INTENTS.CATEGORY_SPENDING);
    });
  });

  // =================================================================
  // 2. SINGLE DETERMINISTIC INTENT PLANNING
  // =================================================================
  describe('2. Single Deterministic Intent Planning', () => {
    test('7. plans single SUMMARY query', () => {
      const plan = planCopilotQuery({ message: 'What is my net savings?' });
      expect(plan.type).toBe(QUERY_TYPES.SINGLE);
      expect(plan.intent).toBe(INTENTS.SUMMARY);
      expect(plan.requiresLLM).toBe(false);
    });

    test('8. plans single CATEGORY_SPENDING query', () => {
      const plan = planCopilotQuery({ message: 'How much did I spend on Shopping?' });
      expect(plan.type).toBe(QUERY_TYPES.SINGLE);
      expect(plan.intent).toBe(INTENTS.CATEGORY_SPENDING);
      expect(plan.params.category).toBe('Shopping');
      expect(plan.requiresLLM).toBe(false);
    });

    test('9. plans single MERCHANT_SPENDING query', () => {
      const plan = planCopilotQuery({ message: 'How much did I spend at Amazon?' });
      expect(plan.type).toBe(QUERY_TYPES.SINGLE);
      expect(plan.intent).toBe(INTENTS.MERCHANT_SPENDING);
      expect(plan.params.merchant).toBe('Amazon');
      expect(plan.requiresLLM).toBe(false);
    });

    test('10. plans single FORECAST query', () => {
      const plan = planCopilotQuery({ message: 'What is my daily burn rate?' });
      expect(plan.type).toBe(QUERY_TYPES.SINGLE);
      expect(plan.intent).toBe(INTENTS.FORECAST);
      expect(plan.requiresLLM).toBe(false);
    });

    test('11. plans single WHAT_IF query', () => {
      const plan = planCopilotQuery({ message: 'What if I reduce Shopping by 20%?' });
      expect(plan.type).toBe(QUERY_TYPES.SINGLE);
      expect(plan.intent).toBe(INTENTS.WHAT_IF);
      expect(plan.params.category).toBe('Shopping');
      expect(plan.params.percentage).toBe(20);
      expect(plan.requiresLLM).toBe(false);
    });
  });

  // =================================================================
  // 3. MULTI-QUESTION DETECTION & PLANNING
  // =================================================================
  describe('3. Multi-Question Detection & Planning', () => {
    test('12. plans multi-question with CATEGORY + MERCHANT ("Which category contributed the most? Who did I pay the most?")', () => {
      const plan = planCopilotQuery({
        message: 'Which category contributed the most? Who did I pay the most?'
      });

      expect(plan.type).toBe(QUERY_TYPES.MULTI);
      expect(plan.parts.length).toBe(2);
      expect(plan.parts[0].intent).toBe(INTENTS.CATEGORY_SPENDING);
      expect(plan.parts[1].intent).toBe(INTENTS.MERCHANT_SPENDING);
      expect(plan.hasAdvisory).toBe(false);
      expect(plan.requiresLLM).toBe(false);
    });

    test('13. plans multi-question with CATEGORY + FORECAST', () => {
      const plan = planCopilotQuery({
        message: 'How much did I spend on Food? What is my daily burn rate?'
      });

      expect(plan.type).toBe(QUERY_TYPES.MULTI);
      expect(plan.parts.length).toBe(2);
      expect(plan.parts[0].intent).toBe(INTENTS.CATEGORY_SPENDING);
      expect(plan.parts[1].intent).toBe(INTENTS.FORECAST);
      expect(plan.requiresLLM).toBe(false);
    });

    test('14. plans multi-question with MERCHANT + FORECAST ("Who did I pay the most and what is my daily burn rate?")', () => {
      const plan = planCopilotQuery({
        message: 'Who did I pay the most and what is my daily burn rate?'
      });

      expect(plan.type).toBe(QUERY_TYPES.MULTI);
      expect(plan.parts.length).toBe(2);
      expect(plan.parts[0].intent).toBe(INTENTS.MERCHANT_SPENDING);
      expect(plan.parts[1].intent).toBe(INTENTS.FORECAST);
      expect(plan.requiresLLM).toBe(false);
    });

    test('15. plans three deterministic questions together', () => {
      const msg = 'Which category contributed the most?\nWho did I pay the most?\nWhat is my daily burn rate?';
      const plan = planCopilotQuery({ message: msg });

      expect(plan.type).toBe(QUERY_TYPES.MULTI);
      expect(plan.parts.length).toBe(3);
      expect(plan.parts[0].intent).toBe(INTENTS.CATEGORY_SPENDING);
      expect(plan.parts[1].intent).toBe(INTENTS.MERCHANT_SPENDING);
      expect(plan.parts[2].intent).toBe(INTENTS.FORECAST);
      expect(plan.hasAdvisory).toBe(false);
      expect(plan.requiresLLM).toBe(false);
    });

    test('16. plans multi-question with WHAT_IF + MERCHANT + SUMMARY', () => {
      const msg = 'What if I reduce Shopping by 20%? Who is my top payee in Shopping? What is my total savings rate?';
      const plan = planCopilotQuery({ message: msg });

      expect(plan.type).toBe(QUERY_TYPES.MULTI);
      expect(plan.parts.length).toBe(3);
      expect(plan.parts[0].intent).toBe(INTENTS.WHAT_IF);
      expect(plan.parts[1].intent).toBe(INTENTS.MERCHANT_SPENDING);
      expect(plan.parts[2].intent).toBe(INTENTS.SUMMARY);
      expect(plan.hasAdvisory).toBe(false);
    });

    test('17. plans mixed deterministic + advisory ("How much did I spend on Shopping and why is it so high?")', () => {
      const msg = 'How much did I spend on Shopping and why is it so high?';
      const plan = planCopilotQuery({ message: msg });

      expect(plan.type).toBe(QUERY_TYPES.MULTI);
      expect(plan.parts.length).toBe(2);
      expect(plan.parts[0].intent).toBe(INTENTS.CATEGORY_SPENDING);
      expect(plan.parts[1].intent).toBe(INTENTS.ADVISORY);
      expect(plan.hasAdvisory).toBe(true);
      expect(plan.requiresLLM).toBe(true);
    });

    test('18. does not split compound single queries ("How much did I earn and spend?")', () => {
      const sub = splitMultiQuestions('How much did I earn and spend?');
      expect(sub.length).toBe(1);

      const plan = planCopilotQuery({ message: 'How much did I earn and spend?' });
      expect(plan.type).toBe(QUERY_TYPES.SINGLE);
      expect(plan.intent).toBe(INTENTS.SUMMARY);
    });
  });

  // =================================================================
  // 4. CONTEXTUAL FOLLOW-UP ROUTING
  // =================================================================
  describe('4. Contextual Follow-Up Routing', () => {
    test('19. routes "Why?" after CATEGORY spending to ADVISORY with injected category context', () => {
      const history = [
        { role: 'user', content: 'How much did I spend on Shopping?' },
        { role: 'assistant', content: 'You spent ₹475 on Shopping.' }
      ];

      const plan = planCopilotQuery({ message: 'Why?', history });
      expect(plan.type).toBe(QUERY_TYPES.SINGLE);
      expect(plan.intent).toBe(INTENTS.ADVISORY);
      expect(plan.requiresLLM).toBe(true);
      expect(plan.costRoute.resolvedContext.subjectValue).toBe('Shopping');
    });

    test('20. routes "Is that high?" after CATEGORY to ADVISORY', () => {
      const history = [
        { role: 'user', content: 'How much did I spend on Food?' },
        { role: 'assistant', content: 'You spent ₹8,000 on Food.' }
      ];

      const plan = planCopilotQuery({ message: 'Is that high?', history });
      expect(plan.intent).toBe(INTENTS.ADVISORY);
      expect(plan.requiresLLM).toBe(true);
    });

    test('21. routes "How can I reduce it?" after CATEGORY to ADVISORY', () => {
      const history = [
        { role: 'user', content: 'How much did I spend on Shopping?' },
        { role: 'assistant', content: 'You spent ₹7,000 on Shopping.' }
      ];

      const plan = planCopilotQuery({ message: 'How can I reduce it?', history });
      expect(plan.intent).toBe(INTENTS.ADVISORY);
      expect(plan.requiresLLM).toBe(true);
    });

    test('22. routes "What caused it?" after merchant query to ADVISORY with merchant context', () => {
      const history = [
        { role: 'user', content: 'How much did I spend at Amazon?' },
        { role: 'assistant', content: 'You recorded ₹4,500 at Amazon.' }
      ];

      const plan = planCopilotQuery({ message: 'What caused it?', history });
      expect(plan.intent).toBe(INTENTS.ADVISORY);
      expect(plan.costRoute.resolvedContext.subjectValue).toBe('Amazon');
    });

    test('22b. routes "For 20%" after WHAT_IF to deterministic WHAT_IF with preserved category & direction', () => {
      const history = [
        { role: 'user', content: 'What if I reduce Shopping by 10%?' },
        { role: 'assistant', content: "Reducing your spending in 'Shopping' by 10% would save ₹48." }
      ];

      const plan = planCopilotQuery({ message: 'For 20%', history });
      expect(plan.type).toBe(QUERY_TYPES.SINGLE);
      expect(plan.intent).toBe(INTENTS.WHAT_IF);
      expect(plan.requiresLLM).toBe(false);
      expect(plan.params.category).toBe('Shopping');
      expect(plan.params.percentage).toBe(20);
      expect(plan.params.direction).toBe('reduce');
    });

    test('22c. routes "Change that to 5%" after WHAT_IF increase to deterministic WHAT_IF increase', () => {
      const history = [
        { role: 'user', content: 'What if I increase Shopping by 10%?' },
        { role: 'assistant', content: "Increasing your spending in 'Shopping' by 10% would add ₹48." }
      ];

      const plan = planCopilotQuery({ message: 'Change that to 5%', history });
      expect(plan.type).toBe(QUERY_TYPES.SINGLE);
      expect(plan.intent).toBe(INTENTS.WHAT_IF);
      expect(plan.requiresLLM).toBe(false);
      expect(plan.params.category).toBe('Shopping');
      expect(plan.params.percentage).toBe(5);
      expect(plan.params.direction).toBe('increase');
    });
  });

  // =================================================================
  // 5. EDGE CASES & SAFETY
  // =================================================================
  describe('5. Edge Cases & Safety', () => {
    test('23. handles empty string gracefully', () => {
      const plan = planCopilotQuery({ message: '' });
      expect(plan.type).toBe(QUERY_TYPES.SINGLE);
      expect(plan.intent).toBe(INTENTS.SUMMARY);
    });

    test('24. handles whitespace and non-string inputs gracefully', () => {
      const plan1 = planCopilotQuery({ message: '   ' });
      expect(plan1.type).toBe(QUERY_TYPES.SINGLE);

      const plan2 = planCopilotQuery({ message: null });
      expect(plan2.type).toBe(QUERY_TYPES.SINGLE);
    });
  });
});
