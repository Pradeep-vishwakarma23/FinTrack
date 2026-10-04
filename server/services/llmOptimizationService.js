/**
 * FinTrack LLM Optimization & Resilience Service
 *
 * Provides:
 * 1. In-memory response caching with strict user/period/session isolation and TTL.
 * 2. In-flight request deduplication for concurrent identical queries.
 * 3. Gemini error classification (429 rate limits, 503 unavailable, timeouts, 400, 401/403).
 * 4. Exponential backoff with small jitter within a strictly capped global Gemini budget (max 2 calls).
 * 5. Safe heuristic fallback on quota or transient outage.
 *
 * Operational rules:
 * - Does NOT persist financial data to MongoDB.
 * - Cache resets automatically upon Node.js process restart.
 * - Does NOT expose API keys or sensitive credentials.
 */

import {
  recordDeterministicRequest,
  recordAdvisoryRequest,
  recordGeminiCall,
  recordCacheHit,
  recordCacheMiss,
  recordDeduplicatedRequest,
  recordGeminiFailure,
  recordFallbackResponse
} from './llmUsageTracker.js';

// Configuration Defaults
export const DEFAULT_CACHE_TTL_MS = Number(process.env.LLM_CACHE_TTL_MS) || 300000; // 5 minutes
export const MAX_ADVISORY_BUDGET = 2; // Global maximum Gemini calls allowed per interaction
export const MAX_RETRIES = 2;
export const BASE_BACKOFF_DELAY_MS = 500;

// Gemini Error Categories
export const ERROR_TYPES = {
  RATE_LIMIT: 'RATE_LIMIT',
  TEMPORARY_UNAVAILABLE: 'TEMPORARY_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  BAD_REQUEST: 'BAD_REQUEST',
  AUTHORIZATION: 'AUTHORIZATION',
  UNKNOWN: 'UNKNOWN'
};

// In-Memory Storage
const responseCache = new Map();
const inFlightRequests = new Map();

/**
 * Normalizes question string for canonical matching.
 */
export const normalizeQuestion = (text = '') => {
  if (!text || typeof text !== 'string') return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[?!.,;:]+$/, '')
    .trim();
};

/**
 * Builds an isolated cache key that prevents cross-user or cross-period leakage.
 *
 * @param {Object} params
 * @param {string|Object} params.userId - User identifier
 * @param {string} [params.month] - Target month period (YYYY-MM)
 * @param {string} params.question - Raw or normalized question
 * @param {string} [params.sessionContext] - Session or message context hash
 * @returns {string} Fully isolated cache key
 */
export const buildCacheKey = ({ userId, month = 'all', question = '', sessionContext = '' } = {}) => {
  const uid = userId ? String(userId).trim() : 'anonymous';
  const period = month ? String(month).trim() : 'all';
  const normQ = normalizeQuestion(question);
  const ctx = sessionContext ? String(sessionContext).trim() : 'root';

  return `adv:${uid}:${period}:${ctx}:${normQ}`;
};

/**
 * Retrieves a response from the in-memory cache if valid and unexpired.
 *
 * @param {string} cacheKey
 * @returns {Object|null} Cached response data or null
 */
export const getCachedResponse = (cacheKey) => {
  if (!cacheKey || !responseCache.has(cacheKey)) {
    return null;
  }

  const entry = responseCache.get(cacheKey);
  const now = Date.now();

  if (now > entry.expiresAt) {
    responseCache.delete(cacheKey);
    return null;
  }

  return entry.response;
};

/**
 * Stores a successful response in cache with specified TTL.
 *
 * @param {string} cacheKey
 * @param {Object} response - Response payload to cache
 * @param {number} [ttlMs] - Time to live in ms
 */
export const setCachedResponse = (cacheKey, response, ttlMs = DEFAULT_CACHE_TTL_MS) => {
  if (!cacheKey || !response) return;

  // Never cache error responses, authentication errors, or failed payloads
  if (response.error || response.success === false) {
    return;
  }

  const effectiveTtl = typeof ttlMs === 'number' && ttlMs > 0 ? ttlMs : DEFAULT_CACHE_TTL_MS;
  const now = Date.now();

  responseCache.set(cacheKey, {
    response,
    createdAt: now,
    expiresAt: now + effectiveTtl
  });
};

/**
 * Clears the entire response cache (for test isolation).
 */
export const clearCache = () => {
  responseCache.clear();
};

/**
 * Clears in-flight request tracking (for test isolation).
 */
export const clearInFlight = () => {
  inFlightRequests.clear();
};

/**
 * Returns the current count of cached entries.
 */
export const getCacheSize = () => {
  return responseCache.size;
};

/**
 * Returns the current count of in-flight requests.
 */
export const getInFlightSize = () => {
  return inFlightRequests.size;
};

/**
 * Prunes expired entries from the cache.
 */
export const pruneExpiredCache = () => {
  const now = Date.now();
  for (const [key, entry] of responseCache.entries()) {
    if (now > entry.expiresAt) {
      responseCache.delete(key);
    }
  }
};

/**
 * Classifies an error into a standard Gemini failure category.
 *
 * @param {Error|Object} error
 * @returns {string} One of ERROR_TYPES
 */
export const classifyGeminiError = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;

  const status = error.status || error.response?.status;
  const code = error.code || '';
  const message = (
    (error.message || '') +
    ' ' +
    (error.response?.data?.error?.message || '') +
    ' ' +
    (error.response?.data?.error?.status || '')
  ).toLowerCase();

  // 1. Rate Limit / Quota Exhaustion (429)
  if (
    status === 429 ||
    message.includes('429') ||
    message.includes('quota') ||
    message.includes('resource_exhausted') ||
    message.includes('resource has been exhausted') ||
    message.includes('rate limit')
  ) {
    return ERROR_TYPES.RATE_LIMIT;
  }

  // 2. Service Unavailable / Temporary Server Error (503 / 500 / 502 / 504)
  if (
    status === 503 ||
    status === 500 ||
    status === 502 ||
    status === 504 ||
    message.includes('503') ||
    message.includes('service unavailable') ||
    message.includes('temporarily unavailable') ||
    message.includes('socket hang up') ||
    message.includes('econnreset')
  ) {
    return ERROR_TYPES.TEMPORARY_UNAVAILABLE;
  }

  // 3. Request Timeout
  if (
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('deadline exceeded')
  ) {
    return ERROR_TYPES.TIMEOUT;
  }

  // 4. Bad Request / Malformed input (400)
  if (
    status === 400 ||
    message.includes('400') ||
    message.includes('bad request') ||
    message.includes('invalid argument')
  ) {
    return ERROR_TYPES.BAD_REQUEST;
  }

  // 5. Authorization / Forbidden (401 / 403)
  if (
    status === 401 ||
    status === 403 ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('unauthorized') ||
    message.includes('permission_denied') ||
    message.includes('permission denied') ||
    message.includes('api_key_invalid') ||
    message.includes('api key not valid')
  ) {
    return ERROR_TYPES.AUTHORIZATION;
  }

  return ERROR_TYPES.UNKNOWN;
};

/**
 * Determines whether an error type is eligible for temporary retry.
 *
 * @param {string} errorType
 * @returns {boolean}
 */
export const isRetryableError = (errorType) => {
  return (
    errorType === ERROR_TYPES.RATE_LIMIT ||
    errorType === ERROR_TYPES.TEMPORARY_UNAVAILABLE ||
    errorType === ERROR_TYPES.TIMEOUT
  );
};

/**
 * Sanitizes an error message so API keys and secrets are never leaked.
 *
 * @param {Error|Object|string} error
 * @returns {string}
 */
export const sanitizeErrorMessage = (error) => {
  const raw = typeof error === 'string' ? error : error?.message || 'Unknown Gemini error';
  return raw
    .replace(/key=[A-Za-z0-9_-]+/gi, 'key=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/sk-[A-Za-z0-9_-]+/gi, 'sk-[REDACTED]');
};

/**
 * Calculates exponential backoff delay with optional jitter.
 *
 * @param {Object} params
 * @param {number} params.attempt - 1-indexed retry attempt
 * @param {number} [params.baseDelayMs=500] - Base delay
 * @param {number} [params.maxDelayMs=2000] - Maximum delay ceiling
 * @param {boolean} [params.addJitter=true] - Whether to apply random jitter
 * @returns {number} Backoff time in ms
 */
export const calculateBackoffDelay = ({
  attempt = 1,
  baseDelayMs = BASE_BACKOFF_DELAY_MS,
  maxDelayMs = 2000,
  addJitter = true
} = {}) => {
  const expDelay = Math.min(baseDelayMs * Math.pow(2, Math.max(0, attempt - 1)), maxDelayMs);
  const jitter = addJitter ? Math.floor(Math.random() * (expDelay * 0.2)) : 0;
  return expDelay + jitter;
};

/**
 * Executes an advisory query with caching, deduplication, exponential retry,
 * strict call budget enforcement ($\le 2$ calls), and resilient heuristic fallback.
 *
 * @param {Object} params
 * @param {string|Object} params.userId
 * @param {string} [params.month]
 * @param {string} params.message
 * @param {string} [params.sessionContext]
 * @param {Function} params.geminiExecutor - Async function returning raw Gemini response payload
 * @param {Function} params.fallbackExecutor - Async function returning heuristic fallback response payload
 * @param {Object} [params.options]
 * @param {number} [params.options.ttlMs]
 * @param {number} [params.options.maxBudget=2]
 * @param {number} [params.options.maxRetries=2]
 * @param {number} [params.options.baseDelayMs=500]
 * @param {Function} [params.options.sleepFn]
 * @param {boolean} [params.options.bypassCache=false]
 * @param {boolean} [params.options.addJitter=true]
 * @returns {Promise<Object>} Execution result with internal telemetry metadata
 */
export const optimizeAdvisoryExecution = async ({
  userId,
  month = 'all',
  message = '',
  sessionContext = '',
  geminiExecutor,
  fallbackExecutor,
  options = {}
} = {}) => {
  const ttlMs = typeof options.ttlMs === 'number' ? options.ttlMs : DEFAULT_CACHE_TTL_MS;
  const maxBudget = typeof options.maxBudget === 'number' ? options.maxBudget : MAX_ADVISORY_BUDGET;
  const maxRetries = typeof options.maxRetries === 'number' ? options.maxRetries : MAX_RETRIES;
  const baseDelayMs = typeof options.baseDelayMs === 'number' ? options.baseDelayMs : BASE_BACKOFF_DELAY_MS;
  const sleepFn = options.sleepFn || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const bypassCache = Boolean(options.bypassCache);
  const addJitter = options.addJitter !== false;

  recordAdvisoryRequest();

  const cacheKey = buildCacheKey({ userId, month, question: message, sessionContext });

  // 1. Check Response Cache (if not explicitly bypassed)
  if (!bypassCache) {
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      recordCacheHit();
      return {
        success: true,
        provider: 'gemini',
        cacheHit: true,
        deduplicated: false,
        geminiCalls: 0,
        fallback: false,
        data: cachedResponse
      };
    }
  }

  recordCacheMiss();

  // 2. In-Flight Request Deduplication
  if (inFlightRequests.has(cacheKey)) {
    recordDeduplicatedRequest();
    const sharedResult = await inFlightRequests.get(cacheKey);
    return {
      ...sharedResult,
      deduplicated: true
    };
  }

  // 3. Initiate Isolated Execution Promise
  const executionPromise = (async () => {
    let geminiCalls = 0;
    let attempt = 0;
    let lastError = null;

    while (geminiCalls < maxBudget && attempt <= maxRetries) {
      geminiCalls += 1;
      recordGeminiCall(1);

      try {
        if (typeof geminiExecutor !== 'function') {
          throw new Error('geminiExecutor function is required');
        }

        const resultData = await geminiExecutor();

        if (resultData && !resultData.error) {
          // Store successful response in cache
          setCachedResponse(cacheKey, resultData, ttlMs);

          return {
            success: true,
            provider: 'gemini',
            cacheHit: false,
            deduplicated: false,
            geminiCalls,
            fallback: false,
            data: resultData
          };
        }

        throw new Error('Gemini response payload was empty or invalid.');
      } catch (err) {
        lastError = err;
        const errorType = classifyGeminiError(err);
        recordGeminiFailure(errorType);

        // If error is not retryable (e.g. 400 Bad Request, 401/403 Auth, Unknown)
        // or we have reached the hard interaction budget or retry limit, stop retrying.
        if (!isRetryableError(errorType) || geminiCalls >= maxBudget || attempt >= maxRetries) {
          break;
        }

        attempt += 1;
        const delay = calculateBackoffDelay({ attempt, baseDelayMs, addJitter });
        if (delay > 0) {
          await sleepFn(delay);
        }
      }
    }

    // 4. Quota-Aware / Error Fallback
    recordFallbackResponse();

    let fallbackData = null;
    if (typeof fallbackExecutor === 'function') {
      fallbackData = await fallbackExecutor(lastError);
    }

    return {
      success: true,
      provider: 'heuristic',
      cacheHit: false,
      deduplicated: false,
      geminiCalls,
      fallback: true,
      data: fallbackData
    };
  })();

  inFlightRequests.set(cacheKey, executionPromise);

  try {
    const result = await executionPromise;
    return result;
  } finally {
    // Always clean up in-flight map entry on completion or failure
    inFlightRequests.delete(cacheKey);
  }
};

/**
 * Passthrough optimization wrapper for deterministic queries (enforces 0 Gemini calls).
 *
 * @param {Object} params
 * @param {Function} params.executor - Synchronous or asynchronous tool execution function
 * @returns {Promise<Object>} Execution result with deterministic provider structure
 */
export const optimizeDeterministicExecution = async ({ executor } = {}) => {
  recordDeterministicRequest();

  let data = null;
  if (typeof executor === 'function') {
    data = await executor();
  }

  return {
    success: true,
    provider: 'deterministic',
    cacheHit: false,
    deduplicated: false,
    geminiCalls: 0,
    fallback: false,
    data
  };
};
