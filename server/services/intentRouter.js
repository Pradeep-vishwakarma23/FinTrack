/**
 * FinTrack LLM Architecture Phase 1 & 2: Intent Router
 * Deterministic intent classifier for financial copilot queries.
 * Distinguishes between deterministic financial tools, What-If simulation,
 * multi-turn follow-ups, and open-ended advisory questions.
 */

export const KNOWN_CATEGORIES = [
  'Food',
  'Shopping',
  'Bills',
  'Transport',
  'Travel',
  'Entertainment',
  'Healthcare',
  'Health',
  'Education',
  'Salary',
  'Rent',
  'Housing',
  'Investments',
  'Utilities',
  'Groceries',
  'Dining',
  'Other'
];

export const INTENTS = {
  SUMMARY: 'SUMMARY',
  CATEGORY_SPENDING: 'CATEGORY_SPENDING',
  MERCHANT_SPENDING: 'MERCHANT_SPENDING',
  FORECAST: 'FORECAST',
  BUDGET_RISK: 'BUDGET_RISK',
  ANOMALY: 'ANOMALY',
  GOAL_STATUS: 'GOAL_STATUS',
  WHAT_IF: 'WHAT_IF',
  ADVISORY: 'ADVISORY'
};

/**
 * Extracts standard category name from text.
 */
export const extractCategory = (text = '') => {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();

  for (const cat of KNOWN_CATEGORIES) {
    const catLower = cat.toLowerCase();
    const regex = new RegExp(`\\b${catLower}\\b`, 'i');
    if (regex.test(lower)) {
      return cat;
    }
  }
  return null;
};

/**
 * Extracts merchant candidate from text using prefix patterns or known names.
 */
export const extractMerchant = (text = '') => {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();

  // 1. Check known common merchants first
  const commonMerchants = [
    'Amazon',
    'Flipkart',
    'Swiggy',
    'Zomato',
    'Uber',
    'Ola',
    'Netflix',
    'Spotify',
    'Starbucks',
    'DMart',
    'Walmart',
    'Target',
    'Apple',
    'Google',
    'Landlord',
    'Airtel',
    'Jio'
  ];

  for (const merch of commonMerchants) {
    const regex = new RegExp(`\\b${merch}\\b`, 'i');
    if (regex.test(trimmed)) {
      return merch;
    }
  }

  // 2. Pattern: "at Amazon", "to Swiggy", "from Netflix", "paid to Landlord"
  const prefixMatch = trimmed.match(
    /\b(?:at|to|from|with|paid to|payee|merchant)\s+([A-Za-z0-9&.'-]+?)(?:\s+(?:across|in|this|last|during|for|on|month|year|today|yesterday|with|by)|\?|[.,!]|$)/i
  );
  if (prefixMatch && prefixMatch[1]) {
    const candidate = prefixMatch[1].trim();
    const ignoreList = [
      'the',
      'my',
      'that',
      'this',
      'a',
      'an',
      'all',
      'any',
      'food',
      'shopping',
      'bills',
      'rent',
      'transport'
    ];
    if (!ignoreList.includes(candidate.toLowerCase()) && candidate.length >= 2) {
      return candidate;
    }
  }

  return null;
};

/**
 * Extracts YYYY-MM formatted month from text if present.
 */
export const extractMonth = (text = '') => {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/\b(\d{4}-(?:0[1-9]|1[0-2]))\b/);
  return match ? match[1] : null;
};

/**
 * Regex for contextual What-If percentage follow-ups (e.g. "For 10%", "10%", "Make it 10%", "Try 25%", "Change that to 5%").
 */
export const WHAT_IF_PERCENTAGE_FOLLOWUP_REGEX =
  /^(?:for|make it|what about|try|how about|do it for|do it with|can you do|could you do|instead,?|instead of that,?|change that to|change it to|change to|set it to|set to|what if(?: it's| its)?|how if|let's do|lets do|let's try|lets try|what if (?:i )?(?:reduce|increase|cut|trim)|(?:i )?(?:reduce|increase|cut|trim))?\s*(?:by|to|for|with)?\s*(\d+)\s*(?:%|percent)\s*(?:instead|please)?\s*\??$/i;

/**
 * Extracts numeric percentage from a contextual What-If follow-up query.
 */
export const extractPercentageFollowUp = (text = '') => {
  if (!text || typeof text !== 'string') return null;
  const match = text.trim().match(WHAT_IF_PERCENTAGE_FOLLOWUP_REGEX);
  if (!match) return null;
  const pct = parseInt(match[1], 10);
  if (isNaN(pct) || pct <= 0 || pct > 100) return null;
  return pct;
};

/**
 * Resolves prior What-If scenario context (category, direction, prior percentage) from recent conversation history.
 */
export const resolveWhatIfContext = (history = []) => {
  if (!Array.isArray(history) || history.length === 0) {
    return null;
  }

  const reversed = history.slice().reverse();
  const messageList = reversed
    .map((m) => (typeof m === 'string' ? m : m?.content || ''))
    .filter(Boolean);

  if (messageList.length === 0) {
    return null;
  }

  const lastAssistantObj = reversed.find((m) => (typeof m === 'object' ? m?.role === 'assistant' : false));
  const lastUserObj = reversed.find((m) => (typeof m === 'object' ? m?.role === 'user' : false));

  const recentMessages = [];
  if (lastAssistantObj) recentMessages.push(typeof lastAssistantObj === 'string' ? lastAssistantObj : lastAssistantObj.content || '');
  if (lastUserObj) recentMessages.push(typeof lastUserObj === 'string' ? lastUserObj : lastUserObj.content || '');
  if (recentMessages.length === 0) {
    recentMessages.push(messageList[0]);
    if (messageList[1]) recentMessages.push(messageList[1]);
  }

  const combinedRecentText = recentMessages.join(' ').toLowerCase();
  const allHistoryText = messageList.join(' ').toLowerCase();

  const isWhatIfTurn =
    combinedRecentText.includes('what if') ||
    combinedRecentText.includes('what-if') ||
    combinedRecentText.includes('whatif') ||
    combinedRecentText.includes('would save') ||
    combinedRecentText.includes('would add') ||
    combinedRecentText.includes('saves ₹') ||
    combinedRecentText.includes('save ₹') ||
    combinedRecentText.includes('saving an additional') ||
    combinedRecentText.includes('saving ₹') ||
    combinedRecentText.includes('lowering total expenses') ||
    combinedRecentText.includes('raising total expenses') ||
    combinedRecentText.includes('simulated') ||
    combinedRecentText.includes('reducing your spending') ||
    combinedRecentText.includes('increasing your spending') ||
    combinedRecentText.includes('reducing spending') ||
    combinedRecentText.includes('increasing spending') ||
    combinedRecentText.includes('how much would i save') ||
    combinedRecentText.includes('how much will i save') ||
    combinedRecentText.includes('how much do i save') ||
    combinedRecentText.includes('how much did that save') ||
    combinedRecentText.includes('how much does that save') ||
    combinedRecentText.includes('what would my new expenses be') ||
    combinedRecentText.includes('what would my new savings be') ||
    (combinedRecentText.includes('reduce') && (combinedRecentText.includes('%') || combinedRecentText.includes('percent'))) ||
    (combinedRecentText.includes('increase') && (combinedRecentText.includes('%') || combinedRecentText.includes('percent'))) ||
    (combinedRecentText.includes('cut') && (combinedRecentText.includes('%') || combinedRecentText.includes('percent'))) ||
    (combinedRecentText.includes('trim') && (combinedRecentText.includes('%') || combinedRecentText.includes('percent')));

  if (!isWhatIfTurn) {
    return null;
  }

  // Check category: prioritize explicit user question semantics ("top category" vs named category)
  let category = null;

  const checkTopCategoryPhrase = (t = '') => {
    const l = t.toLowerCase();
    return (
      l.includes('top category') ||
      l.includes('top expense') ||
      l.includes('highest category') ||
      l.includes('largest category') ||
      l.includes('biggest category') ||
      l.includes('spending most on') ||
      l.includes('spent the most on') ||
      l.includes('highest spending') ||
      l.includes('top spending')
    );
  };

  for (const msg of recentMessages) {
    if (checkTopCategoryPhrase(msg)) {
      category = 'TOP_CATEGORY';
      break;
    }
    const cat = extractCategory(msg);
    if (cat) {
      category = cat;
      break;
    }
  }

  if (!category) {
    for (const msg of messageList) {
      if (checkTopCategoryPhrase(msg)) {
        category = 'TOP_CATEGORY';
        break;
      }
      const cat = extractCategory(msg);
      if (cat) {
        category = cat;
        break;
      }
    }
  }

  // Check direction: check user and assistant text
  const isIncrease =
    combinedRecentText.includes('increase') ||
    combinedRecentText.includes('increasing') ||
    combinedRecentText.includes('raising') ||
    combinedRecentText.includes('raise') ||
    combinedRecentText.includes('higher') ||
    combinedRecentText.includes('would add') ||
    allHistoryText.includes('increase') ||
    allHistoryText.includes('increasing');

  const direction = isIncrease ? 'increase' : 'reduce';

  let previousPercentage = 20;
  for (const msg of recentMessages) {
    const pctMatch = msg.match(/(\d+)\s*(?:%|percent)/i);
    if (pctMatch) {
      previousPercentage = parseInt(pctMatch[1], 10);
      break;
    }
  }

  if (previousPercentage === 20) {
    for (const msg of messageList) {
      const pctMatch = msg.match(/(\d+)\s*(?:%|percent)/i);
      if (pctMatch) {
        previousPercentage = parseInt(pctMatch[1], 10);
        break;
      }
    }
  }

  return {
    isWhatIf: true,
    category: category || 'TOP_CATEGORY',
    direction,
    previousPercentage
  };
};

/**
 * Extracts What-If simulation parameters (percentage and target category).
 */
export const extractWhatIfParams = (text = '') => {
  const pctMatch = text.match(/(\d+)\s*(?:%|percent)/i);
  const percentage = pctMatch ? parseInt(pctMatch[1], 10) : 20;
  let category = extractCategory(text);

  if (!category) {
    const lower = text.toLowerCase();
    if (
      lower.includes('top category') ||
      lower.includes('top expense') ||
      lower.includes('highest category') ||
      lower.includes('largest category') ||
      lower.includes('biggest category') ||
      lower.includes('spending most on') ||
      lower.includes('spent the most on') ||
      lower.includes('highest spending') ||
      lower.includes('top spending')
    ) {
      category = 'TOP_CATEGORY';
    }
  }

  return {
    percentage,
    category
  };
};

/**
 * Inspects conversation history to resolve pronouns and follow-up contexts.
 */
const resolveFollowUpContext = (history = []) => {
  if (!Array.isArray(history) || history.length === 0) {
    return { subjectType: null, subjectValue: null };
  }

  const reversed = history.slice().reverse();

  for (const msg of reversed) {
    const content = typeof msg === 'string' ? msg : msg?.content || '';
    const lower = content.toLowerCase();

    // 1. Check What-If context
    if (
      lower.includes('what if') ||
      lower.includes('would save') ||
      lower.includes('simulated') ||
      lower.includes('reduction')
    ) {
      const cat = extractCategory(content);
      return { subjectType: 'what_if', subjectValue: cat };
    }

    // 2. Check Merchant context first if explicitly named
    const merch = extractMerchant(content);
    if (merch && (lower.includes('paid') || lower.includes('merchant') || lower.includes('payee') || lower.includes('₹') || lower.includes('at '))) {
      return { subjectType: 'merchant', subjectValue: merch };
    }

    // 3. Check Category context
    const cat = extractCategory(content);
    if (cat && (lower.includes('spend') || lower.includes('category') || lower.includes('₹') || lower.includes('rs') || lower.includes('on '))) {
      return { subjectType: 'category', subjectValue: cat };
    }

    // 4. Check Goal context
    if (lower.includes('goal') || lower.includes('savings target')) {
      return { subjectType: 'goal', subjectValue: null };
    }

    // 5. Check Anomaly context
    if (lower.includes('anomaly') || lower.includes('unusual') || lower.includes('outlier')) {
      return { subjectType: 'anomaly', subjectValue: null };
    }

    // 6. Check Forecast context
    if (lower.includes('forecast') || lower.includes('project') || lower.includes('burn rate')) {
      return { subjectType: 'forecast', subjectValue: null };
    }

    // 7. Check Budget risk context
    if (lower.includes('budget') && (lower.includes('risk') || lower.includes('velocity') || lower.includes('exceed'))) {
      return { subjectType: 'budget_risk', subjectValue: null };
    }
  }

  return { subjectType: null, subjectValue: null };
};

/**
 * Classifies the user message into a deterministic financial intent or advisory query.
 *
 * @param {Object} params
 * @param {string} params.message - The incoming user query.
 * @param {Array} [params.history] - Recent message history.
 * @returns {Object} Normalized classification object.
 */
export const classifyIntent = ({ message = '', history = [] } = {}) => {
  const text = (message || '').trim();
  const lower = text.toLowerCase();
  const month = extractMonth(text);

  // 1. Empty or whitespace query
  if (!text) {
    return {
      intent: INTENTS.SUMMARY,
      confidence: 0.5,
      requiresLLM: false,
      params: { month }
    };
  }

  // 1.5. Contextual What-If Follow-Up (e.g. "For 10%", "Make it 10%", "Try 25%", "Change that to 5%")
  const pctFollowUp = extractPercentageFollowUp(text);
  if (pctFollowUp !== null && Array.isArray(history) && history.length > 0) {
    const whatIfCtx = resolveWhatIfContext(history);
    if (whatIfCtx) {
      const targetCat = whatIfCtx.category || extractCategory(text) || 'TOP_CATEGORY';
      return {
        intent: INTENTS.WHAT_IF,
        confidence: 0.95,
        requiresLLM: false,
        params: {
          category: targetCat,
          percentage: pctFollowUp,
          direction: whatIfCtx.direction,
          month
        },
        resolvedContext: {
          isFollowUp: true,
          followUpType: 'what_if_refinement',
          category: targetCat,
          percentage: pctFollowUp,
          direction: whatIfCtx.direction,
          previousPercentage: whatIfCtx.previousPercentage
        }
      };
    }
  }

  // 2. What-If Scenarios (Deterministic simulation - MUST NOT BE ROUTED TO ADVISORY)
  const isWhatIf =
    lower.includes('what if') ||
    lower.includes('what-if') ||
    lower.includes('whatif') ||
    lower.includes('how much would i save') ||
    lower.includes('how much will i save') ||
    lower.includes('how much do i save') ||
    lower.includes('how much did that save') ||
    lower.includes('how much does that save') ||
    lower.includes('how much money would i save') ||
    lower.includes('how much would that save') ||
    lower.includes('what would my new savings be') ||
    lower.includes('what would my savings be') ||
    lower.includes('what would my new expenses be') ||
    lower.includes('what would my expenses be') ||
    (lower.includes('reduce') && (lower.includes('%') || lower.includes('percent'))) ||
    (lower.includes('cut') && (lower.includes('%') || lower.includes('percent'))) ||
    (lower.includes('trim') && (lower.includes('%') || lower.includes('percent'))) ||
    (lower.includes('increase') && (lower.includes('%') || lower.includes('percent'))) ||
    (lower.includes('if i cut') || lower.includes('if i reduce') || lower.includes('if i increase'));

  if (isWhatIf) {
    const whatIfParams = extractWhatIfParams(text);
    const isIncrease = lower.includes('increase') || lower.includes('raising') || lower.includes('raise') || lower.includes('higher');
    let direction = isIncrease ? 'increase' : 'reduce';
    let targetCategory = whatIfParams.category;
    let percentage = whatIfParams.percentage;

    if (Array.isArray(history) && history.length > 0) {
      const whatIfCtx = resolveWhatIfContext(history);
      if (whatIfCtx) {
        if (!targetCategory) targetCategory = whatIfCtx.category;
        if (!text.match(/(\d+)\s*(?:%|percent)/i)) {
          percentage = whatIfCtx.previousPercentage;
        }
        if (!isIncrease && whatIfCtx.direction) {
          direction = whatIfCtx.direction;
        }
      }
    }

    return {
      intent: INTENTS.WHAT_IF,
      confidence: 0.95,
      requiresLLM: false,
      params: {
        category: targetCategory || 'TOP_CATEGORY',
        percentage,
        direction,
        month
      }
    };
  }

  // 3. Conversational Multi-Turn Follow-Ups ("Why?", "Why is that?", "How much was that?", "Which one?", "Tell me more")
  const isShortFollowUp =
    lower === 'why?' ||
    lower === 'why' ||
    lower === 'why is that?' ||
    lower === 'why is that' ||
    lower === 'why was that?' ||
    lower === 'why was that' ||
    lower === 'how much was that?' ||
    lower === 'how much was that' ||
    lower === 'how much is that?' ||
    lower === 'how much is that' ||
    lower === 'which one?' ||
    lower === 'which one' ||
    lower === 'tell me more' ||
    lower === 'explain that' ||
    lower === 'explain more' ||
    lower === 'what caused it?' ||
    lower === 'what caused it' ||
    lower === 'what caused this?' ||
    lower === 'what caused this' ||
    lower === 'how come?' ||
    lower === 'how come';

  if (isShortFollowUp && history.length > 0) {
    const ctx = resolveFollowUpContext(history);

    if (ctx.subjectType === 'category') {
      return {
        intent: INTENTS.CATEGORY_SPENDING,
        confidence: 0.95,
        requiresLLM: false,
        params: {
          category: ctx.subjectValue,
          month
        },
        resolvedContext: {
          subjectType: 'category',
          subjectValue: ctx.subjectValue,
          isFollowUp: true
        }
      };
    }

    if (ctx.subjectType === 'merchant') {
      return {
        intent: INTENTS.MERCHANT_SPENDING,
        confidence: 0.95,
        requiresLLM: false,
        params: {
          merchant: ctx.subjectValue,
          month
        },
        resolvedContext: {
          subjectType: 'merchant',
          subjectValue: ctx.subjectValue,
          isFollowUp: true
        }
      };
    }

    if (ctx.subjectType === 'what_if') {
      return {
        intent: INTENTS.WHAT_IF,
        confidence: 0.95,
        requiresLLM: false,
        params: {
          category: ctx.subjectValue,
          month
        },
        resolvedContext: {
          subjectType: 'what_if',
          subjectValue: ctx.subjectValue,
          isFollowUp: true
        }
      };
    }

    if (ctx.subjectType === 'goal') {
      return {
        intent: INTENTS.GOAL_STATUS,
        confidence: 0.95,
        requiresLLM: false,
        params: { month },
        resolvedContext: { subjectType: 'goal', isFollowUp: true }
      };
    }

    if (ctx.subjectType === 'anomaly') {
      return {
        intent: INTENTS.ANOMALY,
        confidence: 0.95,
        requiresLLM: false,
        params: { month },
        resolvedContext: { subjectType: 'anomaly', isFollowUp: true }
      };
    }

    if (ctx.subjectType === 'forecast') {
      return {
        intent: INTENTS.FORECAST,
        confidence: 0.95,
        requiresLLM: false,
        params: { month },
        resolvedContext: { subjectType: 'forecast', isFollowUp: true }
      };
    }

    if (ctx.subjectType === 'budget_risk') {
      return {
        intent: INTENTS.BUDGET_RISK,
        confidence: 0.95,
        requiresLLM: false,
        params: { month },
        resolvedContext: { subjectType: 'budget_risk', isFollowUp: true }
      };
    }

    // Default multi-turn follow-up to SUMMARY if no specific subject resolved
    return {
      intent: INTENTS.SUMMARY,
      confidence: 0.90,
      requiresLLM: false,
      params: { month },
      resolvedContext: { isFollowUp: true }
    };
  }

  // 4. Advisory / Open-Ended Inquiries (Requires LLM reasoning)
  const isAdvisory =
    lower.startsWith('why is') ||
    lower.startsWith('why are') ||
    lower.startsWith('why was') ||
    lower.includes('why is my') ||
    lower.includes('why are my') ||
    lower.includes('why was my') ||
    lower.includes('what is causing') ||
    lower.includes('what caused my') ||
    lower.includes('how can i save') ||
    lower.includes('how do i save') ||
    lower.includes('how to save') ||
    lower.includes('how can i improve') ||
    lower.includes('how to improve') ||
    lower.includes('why am i spending so much') ||
    lower.includes('create a plan') ||
    lower.includes('make a plan') ||
    lower.includes('financial plan') ||
    lower.includes('give me advice') ||
    lower.includes('financial advice') ||
    lower.includes('tips to') ||
    lower.includes('ways to save') ||
    lower.includes('strategy') ||
    lower.includes('recommend an action plan') ||
    lower.includes('recommend action plan') ||
    lower.includes('suggest ways') ||
    lower.includes('help me budget') ||
    lower.includes('how to invest') ||
    lower.includes('should i invest');

  if (isAdvisory) {
    return {
      intent: INTENTS.ADVISORY,
      confidence: 0.90,
      requiresLLM: true,
      params: { month }
    };
  }

  // 5. Goal Status Intent
  const isGoal =
    lower.includes('goal') ||
    lower.includes('savings target') ||
    lower.includes('target date') ||
    lower.includes('target amount') ||
    lower.includes('on track for my goal');

  if (isGoal) {
    return {
      intent: INTENTS.GOAL_STATUS,
      confidence: 0.95,
      requiresLLM: false,
      params: { month }
    };
  }

  // 6. Anomaly Detection Intent
  const isAnomaly =
    lower.includes('anomaly') ||
    lower.includes('anomalies') ||
    lower.includes('unusual') ||
    lower.includes('outlier') ||
    lower.includes('unexpected expense') ||
    lower.includes('unexpected charge') ||
    lower.includes('suspicious') ||
    lower.includes('flagged transaction');

  if (isAnomaly) {
    return {
      intent: INTENTS.ANOMALY,
      confidence: 0.95,
      requiresLLM: false,
      params: { month }
    };
  }

  // 7. Budget Risk Intent
  const isBudgetRisk =
    lower.includes('budget risk') ||
    lower.includes('exceeding my budget') ||
    lower.includes('exceed my budget') ||
    lower.includes('over budget') ||
    lower.includes('budget velocity') ||
    lower.includes('risk of exceeding') ||
    lower.includes('budget pacing') ||
    lower.includes('will i exceed') ||
    lower.includes('budget status') ||
    lower.includes('budget health') ||
    lower.includes('risk of overspending');

  if (isBudgetRisk) {
    return {
      intent: INTENTS.BUDGET_RISK,
      confidence: 0.95,
      requiresLLM: false,
      params: { month }
    };
  }

  // 8. Forecast & Burn Rate Intent
  const isForecast =
    lower.includes('forecast') ||
    lower.includes('project') ||
    lower.includes('projection') ||
    lower.includes('daily burn') ||
    lower.includes('burn rate') ||
    lower.includes('run rate') ||
    lower.includes('end of the month') ||
    lower.includes('month end spend') ||
    lower.includes('will my expenses be') ||
    lower.includes('what will my expense') ||
    lower.includes('project my spending') ||
    lower.includes('projected spend');

  if (isForecast) {
    return {
      intent: INTENTS.FORECAST,
      confidence: 0.95,
      requiresLLM: false,
      params: { month }
    };
  }

  // 9. Merchant Spending Intent
  const detectedMerchant = extractMerchant(text);
  const isMerchant =
    lower.includes('who did i pay') ||
    lower.includes('who do i pay') ||
    lower.includes('top payee') ||
    lower.includes('top merchant') ||
    lower.includes('which merchant') ||
    lower.includes('payee') ||
    lower.includes('merchant breakdown') ||
    lower.includes('paid swiggy') ||
    lower.includes('paid amazon') ||
    lower.includes('spend at') ||
    lower.includes('spent at');

  if (detectedMerchant || isMerchant) {
    return {
      intent: INTENTS.MERCHANT_SPENDING,
      confidence: 0.95,
      requiresLLM: false,
      params: {
        merchant: detectedMerchant,
        month
      }
    };
  }

  // 10. Category Spending Intent
  const detectedCategory = extractCategory(text);
  const isCategory =
    lower.includes('which category') ||
    lower.includes('what category') ||
    lower.includes('category breakdown') ||
    lower.includes('spend the most on') ||
    lower.includes('spent the most on') ||
    lower.includes('top category') ||
    lower.includes('highest category') ||
    lower.includes('biggest category') ||
    lower.includes('category spend') ||
    lower.includes('spending by category') ||
    lower.includes('where did my money go');

  if (detectedCategory || isCategory) {
    return {
      intent: INTENTS.CATEGORY_SPENDING,
      confidence: 0.95,
      requiresLLM: false,
      params: {
        category: detectedCategory,
        month
      }
    };
  }

  // 11. Financial Summary Intent
  const isSummary =
    lower.includes('summary') ||
    lower.includes('overview') ||
    lower.includes('net savings') ||
    lower.includes('savings rate') ||
    lower.includes('my savings') ||
    lower.includes('total savings') ||
    lower.includes('total income') ||
    lower.includes('total expense') ||
    lower.includes('total spend') ||
    lower.includes('total spending') ||
    lower.includes('my income') ||
    lower.includes('my expenses') ||
    lower.includes('how much did i spend') ||
    lower.includes('how much did i make') ||
    lower.includes('how much did i earn') ||
    lower.includes('how much did i save') ||
    lower.includes('deficit') ||
    lower.includes('surplus') ||
    lower.includes('my finances') ||
    lower.includes('financial status') ||
    lower.includes('financial summary');

  if (isSummary) {
    return {
      intent: INTENTS.SUMMARY,
      confidence: 0.95,
      requiresLLM: false,
      params: { month }
    };
  }

  // 12. Fallback for unclassified queries: route to ADVISORY
  return {
    intent: INTENTS.ADVISORY,
    confidence: 0.70,
    requiresLLM: true,
    params: { month }
  };
};
