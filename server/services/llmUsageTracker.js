/**
 * FinTrack LLM Usage & Telemetry Tracker
 *
 * Tracks in-memory operational metrics for LLM routing, caching, and Gemini API calls.
 * Strictly operational: NEVER stores user financial data, transaction amounts,
 * merchant names, account info, raw questions, or API keys.
 */

// In-memory counter store (cleared on server process restart)
let counters = {
  totalRequests: 0,
  deterministicRequests: 0,
  advisoryRequests: 0,
  geminiCalls: 0,
  cacheHits: 0,
  cacheMisses: 0,
  deduplicatedRequests: 0,
  geminiFailures: 0,
  quotaFailures: 0,
  timeoutFailures: 0,
  fallbackResponses: 0,
  providers: {
    gemini: 0,
    deterministic: 0,
    heuristic: 0
  }
};

/**
 * Records a deterministic request.
 */
export const recordDeterministicRequest = () => {
  counters.totalRequests += 1;
  counters.deterministicRequests += 1;
  counters.providers.deterministic += 1;
};

/**
 * Records an advisory request.
 */
export const recordAdvisoryRequest = () => {
  counters.totalRequests += 1;
  counters.advisoryRequests += 1;
};

/**
 * Records Gemini API calls executed.
 * @param {number} [count=1] - Number of calls to record
 */
export const recordGeminiCall = (count = 1) => {
  if (typeof count === 'number' && count > 0) {
    counters.geminiCalls += count;
  }
};

/**
 * Records an advisory response cache hit.
 */
export const recordCacheHit = () => {
  counters.cacheHits += 1;
};

/**
 * Records an advisory response cache miss.
 */
export const recordCacheMiss = () => {
  counters.cacheMisses += 1;
};

/**
 * Records a deduplicated in-flight request.
 */
export const recordDeduplicatedRequest = () => {
  counters.deduplicatedRequests += 1;
};

/**
 * Records a Gemini API call failure.
 * @param {string} [errorType] - Categorized error type
 */
export const recordGeminiFailure = (errorType = 'UNKNOWN') => {
  counters.geminiFailures += 1;
  if (errorType === 'RATE_LIMIT' || errorType === 'QUOTA') {
    counters.quotaFailures += 1;
  } else if (errorType === 'TIMEOUT') {
    counters.timeoutFailures += 1;
  }
};

/**
 * Records a quota/rate-limit failure.
 */
export const recordQuotaFailure = () => {
  counters.quotaFailures += 1;
};

/**
 * Records a timeout failure.
 */
export const recordTimeoutFailure = () => {
  counters.timeoutFailures += 1;
};

/**
 * Records a fallback heuristic response.
 */
export const recordFallbackResponse = () => {
  counters.fallbackResponses += 1;
  counters.providers.heuristic += 1;
};

/**
 * Records successful provider resolution.
 * @param {'gemini'|'deterministic'|'heuristic'} provider
 */
export const recordProviderResponse = (provider) => {
  if (provider && counters.providers[provider] !== undefined) {
    counters.providers[provider] += 1;
  }
};

/**
 * Returns a snapshot of current in-memory usage statistics.
 * @returns {Object} Deep copy of counters
 */
export const getUsageStats = () => {
  return {
    totalRequests: counters.totalRequests,
    deterministicRequests: counters.deterministicRequests,
    advisoryRequests: counters.advisoryRequests,
    geminiCalls: counters.geminiCalls,
    cacheHits: counters.cacheHits,
    cacheMisses: counters.cacheMisses,
    deduplicatedRequests: counters.deduplicatedRequests,
    geminiFailures: counters.geminiFailures,
    quotaFailures: counters.quotaFailures,
    timeoutFailures: counters.timeoutFailures,
    fallbackResponses: counters.fallbackResponses,
    providers: {
      gemini: counters.providers.gemini,
      deterministic: counters.providers.deterministic,
      heuristic: counters.providers.heuristic
    }
  };
};

/**
 * Resets all in-memory usage statistics to zero (e.g. for test isolation).
 */
export const resetUsageStats = () => {
  counters = {
    totalRequests: 0,
    deterministicRequests: 0,
    advisoryRequests: 0,
    geminiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    deduplicatedRequests: 0,
    geminiFailures: 0,
    quotaFailures: 0,
    timeoutFailures: 0,
    fallbackResponses: 0,
    providers: {
      gemini: 0,
      deterministic: 0,
      heuristic: 0
    }
  };
};
