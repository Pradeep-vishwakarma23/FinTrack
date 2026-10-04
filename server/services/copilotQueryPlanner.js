/**
 * FinTrack Copilot Query Planner (Phase 8.1)
 *
 * Preprocessing intelligence layer that classifies incoming messages into:
 * 1. GREETING: Conversational small-talk ("Hi", "Hello", "Thanks", etc.) -> Zero Gemini calls.
 * 2. SINGLE: Single financial intent -> Delegated to llmCostRouter.
 * 3. MULTI: Multi-question messages (e.g. Category + Payee + Forecast) -> Splits and coordinates tools.
 * 4. CONTEXTUAL FOLLOW-UP: Resolves follow-ups ("Why?", "Is that high?", "What caused it?")
 *    into advisory/explanatory routing with prior context injected.
 */

import { routeQuestion, ROUTES } from './llmCostRouter.js';
import {
  INTENTS,
  extractCategory,
  extractMerchant,
  extractWhatIfParams,
  WHAT_IF_PERCENTAGE_FOLLOWUP_REGEX,
  extractPercentageFollowUp,
  resolveWhatIfContext
} from './intentRouter.js';

export {
  WHAT_IF_PERCENTAGE_FOLLOWUP_REGEX,
  extractPercentageFollowUp,
  resolveWhatIfContext
};

export const QUERY_TYPES = {
  GREETING: 'GREETING',
  SINGLE: 'SINGLE',
  MULTI: 'MULTI'
};

// Common greeting tokens and exact phrases
const GREETING_EXACT = new Set([
  'hi',
  'hello',
  'hey',
  'hey there',
  'hi there',
  'hello there',
  'good morning',
  'good afternoon',
  'good evening',
  'thanks',
  'thank you',
  'thanks a lot',
  'thank you so much',
  'how are you',
  'how are you doing',
  'who are you',
  'what can you do',
  'help'
]);

const GREETING_PREFIX_REGEX = /^(?:hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you)\b[\s,!.]*/i;

// Follow-up explanatory triggers
const EXPLANATORY_FOLLOWUP_REGEX = /^(?:why\??|why is that\??|why was that\??|why is it so high\??|what about that\??|what about this\??|what caused it\??|what caused this\??|is that high\??|how come\??|how can i reduce it\??|how do i reduce it\??|how do i fix it\??|explain that\??|tell me more\??)$/i;

/**
 * Checks if a message is purely a small-talk greeting.
 * If financial questions follow the greeting (e.g. "Hi, what is my savings?"), returns false.
 */
export const isPureGreeting = (message = '') => {
  if (!message || typeof message !== 'string') return false;
  const trimmed = message.trim().toLowerCase().replace(/[.!?]+$/, '').trim();

  if (GREETING_EXACT.has(trimmed)) {
    return true;
  }

  // If message starts with greeting, check if remaining text is empty or trivial
  if (GREETING_PREFIX_REGEX.test(message)) {
    const stripped = message.replace(GREETING_PREFIX_REGEX, '').trim();
    if (!stripped || stripped.length < 2) {
      return true;
    }
  }

  return false;
};

/**
 * Generates natural conversational response for greetings.
 */
export const getGreetingResponse = (message = '') => {
  const lower = (message || '').trim().toLowerCase();

  if (lower.includes('thank')) {
    return {
      message: "You're welcome! Let me know if you need any other financial insights or analysis.",
      suggestedFollowUps: [
        'What is my net savings this month?',
        'Show my top expense categories',
        'What is my daily burn rate?'
      ]
    };
  }

  if (lower.includes('who are you') || lower.includes('what can you do') || lower.includes('help')) {
    return {
      message: "I'm FinTrack Financial Copilot. I analyze your confirmed ledger transactions, track budgets, detect anomalies, forecast burn rates, and simulate What-If savings scenarios.",
      suggestedFollowUps: [
        'What is my financial summary?',
        'Who did I pay the most this month?',
        'What if I reduce Shopping by 20%?'
      ]
    };
  }

  return {
    message: "Hi! I'm FinTrack Copilot. What would you like to know about your finances?",
    suggestedFollowUps: [
      'What is my net savings?',
      'How much did I spend on Food?',
      'What is my projected month-end forecast?'
    ]
  };
};

/**
 * Inspects conversation history to resolve the subject of an explanatory follow-up.
 */
export const resolveExplanatoryContext = (history = []) => {
  if (!Array.isArray(history) || history.length === 0) {
    return null;
  }

  const reversed = history.slice().reverse();
  for (let i = 0; i < reversed.length; i++) {
    const msg = reversed[i];
    const content = typeof msg === 'string' ? msg : msg?.content || '';
    const cat = extractCategory(content);
    const merch = extractMerchant(content);

    if (cat) {
      return {
        subjectType: 'category',
        subjectValue: cat,
        previousQuestion: reversed[i + 1]?.content || content,
        previousAnswer: content
      };
    }
    if (merch) {
      return {
        subjectType: 'merchant',
        subjectValue: merch,
        previousQuestion: reversed[i + 1]?.content || content,
        previousAnswer: content
      };
    }
  }

  // Fallback to summary/financial state context if history exists
  if (reversed.length > 0) {
    const lastMsg = reversed[0];
    const content = typeof lastMsg === 'string' ? lastMsg : lastMsg?.content || '';
    return {
      subjectType: 'summary',
      subjectValue: 'financial_summary',
      previousQuestion: reversed[1]?.content || content,
      previousAnswer: content
    };
  }

  return null;
};

/**
 * Splits a compound message into individual sub-questions if multi-intent is detected.
 */
export const splitMultiQuestions = (message = '') => {
  if (!message || typeof message !== 'string') return [message];

  const text = message.trim();

  // 1. Split on newlines or explicit multiple question marks: "Q1? Q2? Q3?"
  if (text.includes('?') || text.includes('\n')) {
    const rawParts = text
      .split(/(?<=\?)\s+|\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (rawParts.length > 1) {
      return rawParts;
    }
  }

  // 2. Split on compound conjunctions with question word boundaries:
  // e.g. "Who did I pay the most and what is my daily burn rate?"
  // e.g. "What is my savings rate and top category?"
  const conjunctionSplitRegex = /\s+(?:and|also|as well as)\s+(?=(?:what|who|which|how|why|am i|did i|where|can i|is that|what if|top category|top merchant|top payee)\b)/i;

  if (conjunctionSplitRegex.test(text)) {
    const rawParts = text
      .split(conjunctionSplitRegex)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (rawParts.length > 1) {
      return rawParts;
    }
  }

  return [text];
};

/**
 * Evaluates an incoming message and plans execution into GREETING, SINGLE, or MULTI.
 *
 * @param {Object} params
 * @param {string} params.message - Incoming user prompt
 * @param {Array} [params.history] - Session conversation history
 * @param {string} [params.month] - Active month (YYYY-MM)
 * @returns {Object} Planned execution descriptor
 */
export const planCopilotQuery = ({ message = '', history = [], month = null } = {}) => {
  const trimmed = (message || '').trim();

  if (!trimmed) {
    return {
      type: QUERY_TYPES.SINGLE,
      question: '',
      intent: INTENTS.SUMMARY,
      requiresLLM: false,
      costRoute: routeQuestion({ message: '', history, month }),
      parts: []
    };
  }

  // 1. Check for pure small-talk greeting
  if (isPureGreeting(trimmed)) {
    return {
      type: QUERY_TYPES.GREETING,
      greetingResponse: getGreetingResponse(trimmed),
      requiresLLM: false
    };
  }

  // 2. Check for contextual explanatory follow-up ("Why?", "Is that high?", etc.)
  if (EXPLANATORY_FOLLOWUP_REGEX.test(trimmed) && Array.isArray(history) && history.length > 0) {
    const context = resolveExplanatoryContext(history);
    if (context) {
      return {
        type: QUERY_TYPES.SINGLE,
        question: trimmed,
        intent: INTENTS.ADVISORY,
        requiresLLM: true,
        costRoute: {
          route: ROUTES.LLM,
          intent: INTENTS.ADVISORY,
          requiresLLM: true,
          expectedGeminiCalls: 1,
          params: { month, category: context.subjectValue, subjectType: context.subjectType },
          resolvedContext: {
            isFollowUp: true,
            followUpType: 'explanatory_advisory',
            subjectType: context.subjectType,
            subjectValue: context.subjectValue,
            previousQuestion: context.previousQuestion,
            previousAnswer: context.previousAnswer
          }
        }
      };
    }
  }

  // 2.5. Check for Contextual What-If follow-up (e.g. "For 10%", "10%", "Make it 10%", "Try 25%", "Change that to 5%")
  const pctFollowUp = extractPercentageFollowUp(trimmed);
  if (pctFollowUp !== null && Array.isArray(history) && history.length > 0) {
    const whatIfContext = resolveWhatIfContext(history);
    if (whatIfContext) {
      const targetCategory = whatIfContext.category || extractCategory(trimmed) || 'TOP_CATEGORY';
      const singleRoute = {
        route: ROUTES.DETERMINISTIC,
        intent: INTENTS.WHAT_IF,
        requiresLLM: false,
        expectedGeminiCalls: 0,
        expectedMcpCalls: 0,
        tool: null,
        params: {
          category: targetCategory,
          percentage: pctFollowUp,
          direction: whatIfContext.direction,
          month
        },
        resolvedContext: {
          isFollowUp: true,
          followUpType: 'what_if_refinement',
          category: targetCategory,
          percentage: pctFollowUp,
          direction: whatIfContext.direction,
          previousPercentage: whatIfContext.previousPercentage
        },
        reasoning: 'Deterministic Contextual What-If refinement follow-up. Zero Gemini calls required.'
      };

      return {
        type: QUERY_TYPES.SINGLE,
        question: trimmed,
        intent: INTENTS.WHAT_IF,
        params: singleRoute.params,
        requiresLLM: false,
        costRoute: singleRoute,
        parts: [
          {
            question: trimmed,
            intent: INTENTS.WHAT_IF,
            params: singleRoute.params,
            requiresLLM: false,
            costRoute: singleRoute
          }
        ]
      };
    }
  }

  // 3. Check for Multi-Question structures
  const subQuestions = splitMultiQuestions(trimmed);

  if (subQuestions.length > 1) {
    const parts = subQuestions.map((q) => {
      const route = routeQuestion({ message: q, history, month });
      return {
        question: q,
        intent: route.intent,
        params: route.params,
        requiresLLM: route.requiresLLM,
        costRoute: route
      };
    });

    const hasAdvisory = parts.some((p) => p.requiresLLM || p.intent === INTENTS.ADVISORY);

    return {
      type: QUERY_TYPES.MULTI,
      parts,
      hasAdvisory,
      requiresLLM: hasAdvisory
    };
  }

  // 4. Standard Single Intent Query (stripping leading greeting prefix if any)
  const coreQuery = trimmed.replace(GREETING_PREFIX_REGEX, '').trim() || trimmed;
  const singleRoute = routeQuestion({ message: coreQuery, history, month });
  return {
    type: QUERY_TYPES.SINGLE,
    question: coreQuery,
    intent: singleRoute.intent,
    params: singleRoute.params,
    requiresLLM: singleRoute.requiresLLM,
    costRoute: singleRoute,
    parts: [
      {
        question: coreQuery,
        intent: singleRoute.intent,
        params: singleRoute.params,
        requiresLLM: singleRoute.requiresLLM,
        costRoute: singleRoute
      }
    ]
  };
};
