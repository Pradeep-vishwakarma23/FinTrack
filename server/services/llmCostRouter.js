/**
 * FinTrack LLM Architecture Phase 5: Intelligent LLM Cost/Quota Router
 * Determines whether an incoming query requires LLM reasoning or can be resolved
 * 100% deterministically via FinTrack's financial intelligence tools.
 *
 * Core Guarantees:
 * - Factual & What-If questions: expectedGeminiCalls = 0
 * - Advisory & Strategy questions: expectedGeminiCalls <= 2
 * - Strictly read-only MCP tool mappings; zero write operations permitted.
 */

import { classifyIntent, INTENTS } from './intentRouter.js';

export const ROUTES = {
  DETERMINISTIC: 'DETERMINISTIC',
  LLM: 'LLM'
};

export const MAX_LLM_CALLS_ADVISORY = 2;
export const MAX_LLM_CALLS_DETERMINISTIC = 0;

/**
 * Deterministic MCP tool mapping registry.
 * Maps deterministic classification intents to corresponding read-only MCP tool names.
 */
export const INTENT_TO_MCP_TOOL_MAP = {
  [INTENTS.SUMMARY]: 'fintrack_get_financial_summary',
  [INTENTS.CATEGORY_SPENDING]: 'fintrack_get_category_spending',
  [INTENTS.MERCHANT_SPENDING]: 'fintrack_get_merchant_spending',
  [INTENTS.FORECAST]: 'fintrack_get_forecast',
  [INTENTS.BUDGET_RISK]: 'fintrack_get_budget_risk',
  [INTENTS.ANOMALY]: 'fintrack_get_anomalies',
  [INTENTS.GOAL_STATUS]: 'fintrack_get_goal_status',
  [INTENTS.WHAT_IF]: null, // Handled by deterministic What-If simulation engine
  [INTENTS.ADVISORY]: null  // Requires LLM reasoning / conversational generation
};

/**
 * Checks if a query is an advisory, strategic, or explanatory request.
 */
const isAdvisoryQuery = (message = '', history = []) => {
  const lower = (message || '').trim().toLowerCase();

  // Multi-turn open-ended strategy / troubleshooting follow-up
  if (Array.isArray(history) && history.length > 0) {
    if (
      lower.includes('why was it so') ||
      lower.includes('why was it high') ||
      lower.includes('why is it so') ||
      lower.includes('what should i do') ||
      lower.includes('how do i fix')
    ) {
      return true;
    }
  }

  // Open-ended advice, planning, or decision queries
  return (
    lower.startsWith('why is') ||
    lower.startsWith('why are') ||
    lower.startsWith('why was') ||
    lower.startsWith('why did') ||
    lower.startsWith('should i') ||
    lower.startsWith('how should i') ||
    lower.startsWith('how can i') ||
    lower.startsWith('how do i') ||
    lower.startsWith('how to') ||
    lower.startsWith('give me a plan') ||
    lower.startsWith('give me advice') ||
    lower.startsWith('create a plan') ||
    lower.startsWith('make a plan') ||
    lower.includes('plan to save') ||
    lower.includes('improve my savings') ||
    lower.includes('manage my budget') ||
    lower.includes('why did my') ||
    lower.includes('why is my') ||
    lower.includes('why was my') ||
    lower.includes('financial advice') ||
    lower.includes('tips to save') ||
    lower.includes('ways to save')
  );
};

/**
 * Evaluates a user message and conversation history to determine the optimal, cost-efficient route.
 *
 * @param {Object} params
 * @param {string} params.message - The incoming user question.
 * @param {Array} [params.history] - Conversation message history.
 * @param {string} [params.month] - Target month override (YYYY-MM).
 * @returns {Object} Cost routing decision object.
 */
export const routeQuestion = ({ message = '', history = [], month = null } = {}) => {
  const text = (message || '').trim();

  // 1. Check for explicit advisory / strategic query
  if (isAdvisoryQuery(text, history)) {
    return {
      route: ROUTES.LLM,
      intent: INTENTS.ADVISORY,
      requiresLLM: true,
      expectedGeminiCalls: MAX_LLM_CALLS_ADVISORY,
      expectedMcpCalls: 0,
      tool: null,
      params: { month },
      resolvedContext: history.length > 0 ? { isFollowUp: true, followUpType: 'advisory_explanation' } : null,
      reasoning: 'Query requires complex reasoning, financial planning, or open-ended advice (LLM route).'
    };
  }

  // 2. Classify intent using deterministic Intent Router
  const classification = classifyIntent({ message: text, history });
  const intent = classification.intent || INTENTS.SUMMARY;
  const requiresLLM = Boolean(classification.requiresLLM);

  // Target month resolution (explicit param overrides extracted param)
  const resolvedMonth = month || classification.params?.month || null;
  const mergedParams = {
    ...classification.params,
    month: resolvedMonth
  };

  // 3. Determine Route and Expected API Call Quotas
  if (requiresLLM || intent === INTENTS.ADVISORY) {
    return {
      route: ROUTES.LLM,
      intent: INTENTS.ADVISORY,
      requiresLLM: true,
      expectedGeminiCalls: MAX_LLM_CALLS_ADVISORY,
      expectedMcpCalls: 0,
      tool: null,
      params: mergedParams,
      resolvedContext: classification.resolvedContext || null,
      reasoning: 'Query requires complex reasoning, financial planning, or open-ended advice (LLM route).'
    };
  }

  // 4. Deterministic Factual / What-If Route
  const mcpTool = INTENT_TO_MCP_TOOL_MAP[intent] || null;

  return {
    route: ROUTES.DETERMINISTIC,
    intent,
    requiresLLM: false,
    expectedGeminiCalls: MAX_LLM_CALLS_DETERMINISTIC,
    expectedMcpCalls: 0, // Direct local copilotTools execution; 0 external API calls
    tool: mcpTool,
    params: mergedParams,
    resolvedContext: classification.resolvedContext || null,
    reasoning: intent === INTENTS.WHAT_IF
      ? 'Deterministic What-If scenario calculation. Zero Gemini calls required.'
      : `Factual financial query mapped directly to deterministic tool "${mcpTool}". Zero Gemini calls required.`
  };
};
