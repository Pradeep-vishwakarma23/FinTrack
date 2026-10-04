import { jest } from '@jest/globals';
import {
  buildCacheKey,
  getCachedResponse,
  setCachedResponse,
  clearCache,
  clearInFlight,
  getCacheSize,
  getInFlightSize,
  pruneExpiredCache,
  classifyGeminiError,
  isRetryableError,
  sanitizeErrorMessage,
  calculateBackoffDelay,
  optimizeAdvisoryExecution,
  optimizeDeterministicExecution,
  ERROR_TYPES,
  MAX_ADVISORY_BUDGET
} from '../services/llmOptimizationService.js';
import {
  getUsageStats,
  resetUsageStats
} from '../services/llmUsageTracker.js';

describe('Phase 7: Gemini Usage & Response Optimization Suite (llmOptimization.test.js)', () => {
  const userIdA = '6ab7c32e420b3243f6ab9fd1';
  const userIdB = '6ab7c32e420b3243f6ab9fd2';
  const monthA = '2026-03';
  const monthB = '2026-04';

  const mockAdvisoryData = {
    message: 'Focus on discretionary dining expenses to improve savings rate.',
    suggestedFollowUps: ['What if I reduce Dining by 20%?'],
    referencedMetrics: { savingsRate: 45 }
  };

  const mockFallbackData = {
    message: 'Heuristic rule-based advice: maintain your 20% emergency buffer.',
    suggestedFollowUps: ['Show summary'],
    referencedMetrics: { savingsRate: 40 }
  };

  beforeEach(() => {
    clearCache();
    clearInFlight();
    resetUsageStats();
    jest.clearAllMocks();
  });

  // =================================================================
  // 1. RESPONSE CACHE & ISOLATION
  // =================================================================
  describe('1. Response Cache & Security Isolation', () => {
    test('1. produces cache miss on initial request', () => {
      const key = buildCacheKey({ userId: userIdA, month: monthA, question: 'How can I save more?' });
      expect(getCachedResponse(key)).toBeNull();
    });

    test('2. produces cache hit after setting cached response', () => {
      const key = buildCacheKey({ userId: userIdA, month: monthA, question: 'How can I save more?' });
      setCachedResponse(key, mockAdvisoryData);

      const cached = getCachedResponse(key);
      expect(cached).toEqual(mockAdvisoryData);
    });

    test('3. expires cache after configured TTL', () => {
      const key = buildCacheKey({ userId: userIdA, month: monthA, question: 'How can I save more?' });
      // Set with 50ms TTL
      setCachedResponse(key, mockAdvisoryData, 50);
      expect(getCachedResponse(key)).toEqual(mockAdvisoryData);

      // Fast forward time / wait 60ms
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(getCachedResponse(key)).toBeNull();
          resolve();
        }, 60);
      });
    });

    test('4. different user produces cache miss (strict multi-tenant isolation)', () => {
      const keyA = buildCacheKey({ userId: userIdA, month: monthA, question: 'How can I save more?' });
      const keyB = buildCacheKey({ userId: userIdB, month: monthA, question: 'How can I save more?' });

      setCachedResponse(keyA, mockAdvisoryData);
      expect(getCachedResponse(keyA)).toEqual(mockAdvisoryData);
      expect(getCachedResponse(keyB)).toBeNull();
    });

    test('5. different month produces cache miss (period isolation)', () => {
      const keyMonthA = buildCacheKey({ userId: userIdA, month: monthA, question: 'How can I save more?' });
      const keyMonthB = buildCacheKey({ userId: userIdA, month: monthB, question: 'How can I save more?' });

      setCachedResponse(keyMonthA, mockAdvisoryData);
      expect(getCachedResponse(keyMonthA)).toEqual(mockAdvisoryData);
      expect(getCachedResponse(keyMonthB)).toBeNull();
    });

    test('6. different session context produces cache miss when conversation context changes', () => {
      const keyContext1 = buildCacheKey({ userId: userIdA, month: monthA, question: 'Why?', sessionContext: 'turn-1' });
      const keyContext2 = buildCacheKey({ userId: userIdA, month: monthA, question: 'Why?', sessionContext: 'turn-2' });

      setCachedResponse(keyContext1, mockAdvisoryData);
      expect(getCachedResponse(keyContext1)).toEqual(mockAdvisoryData);
      expect(getCachedResponse(keyContext2)).toBeNull();
    });

    test('7. cache does not store failed responses or error payloads', () => {
      const key = buildCacheKey({ userId: userIdA, month: monthA, question: 'How can I save more?' });
      setCachedResponse(key, { error: 'Gemini Quota Exceeded', success: false });

      expect(getCachedResponse(key)).toBeNull();
      expect(getCacheSize()).toBe(0);
    });

    test('27. failed responses are not cached during optimization execution', async () => {
      const geminiExecutor = jest.fn().mockRejectedValue(new Error('Quota exceeded 429'));
      const fallbackExecutor = jest.fn().mockResolvedValue(mockFallbackData);

      const result = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'How can I save more?',
        geminiExecutor,
        fallbackExecutor,
        options: { baseDelayMs: 1, addJitter: false }
      });

      expect(result.provider).toBe('heuristic');
      expect(result.fallback).toBe(true);
      expect(getCacheSize()).toBe(0); // Error not cached
    });

    test('28. cross-user cache isolation verified in full execution flow', async () => {
      const geminiExecutorA = jest.fn().mockResolvedValue({ ...mockAdvisoryData, user: 'UserA' });
      const geminiExecutorB = jest.fn().mockResolvedValue({ ...mockAdvisoryData, user: 'UserB' });

      const resA = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Why is my spending high?',
        geminiExecutor: geminiExecutorA,
        fallbackExecutor: jest.fn()
      });

      const resB = await optimizeAdvisoryExecution({
        userId: userIdB,
        month: monthA,
        message: 'Why is my spending high?',
        geminiExecutor: geminiExecutorB,
        fallbackExecutor: jest.fn()
      });

      expect(resA.cacheHit).toBe(false);
      expect(resA.data.user).toBe('UserA');
      expect(resB.cacheHit).toBe(false);
      expect(resB.data.user).toBe('UserB');
      expect(geminiExecutorA).toHaveBeenCalledTimes(1);
      expect(geminiExecutorB).toHaveBeenCalledTimes(1);
    });

    test('29. cross-month cache isolation verified in full execution flow', async () => {
      const geminiExecutor = jest.fn().mockResolvedValue(mockAdvisoryData);

      await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Why is my spending high?',
        geminiExecutor,
        fallbackExecutor: jest.fn()
      });

      await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthB,
        message: 'Why is my spending high?',
        geminiExecutor,
        fallbackExecutor: jest.fn()
      });

      expect(geminiExecutor).toHaveBeenCalledTimes(2); // 1 per month
    });
  });

  // =================================================================
  // 2. IN-FLIGHT REQUEST DEDUPLICATION
  // =================================================================
  describe('2. In-Flight Request Deduplication', () => {
    test('8. simultaneous identical requests deduplicate to a single Gemini call', async () => {
      let executorCallCount = 0;
      const geminiExecutor = jest.fn(async () => {
        executorCallCount++;
        await new Promise((r) => setTimeout(r, 40));
        return mockAdvisoryData;
      });

      const [res1, res2] = await Promise.all([
        optimizeAdvisoryExecution({
          userId: userIdA,
          month: monthA,
          message: 'Give me financial advice',
          geminiExecutor,
          fallbackExecutor: jest.fn()
        }),
        optimizeAdvisoryExecution({
          userId: userIdA,
          month: monthA,
          message: 'Give me financial advice',
          geminiExecutor,
          fallbackExecutor: jest.fn()
        })
      ]);

      expect(executorCallCount).toBe(1);
      expect(geminiExecutor).toHaveBeenCalledTimes(1);
      expect(res1.provider).toBe('gemini');
      expect(res2.provider).toBe('gemini');
      expect(res2.deduplicated).toBe(true);
    });

    test('9. in-flight entry is removed after success', async () => {
      const geminiExecutor = jest.fn().mockResolvedValue(mockAdvisoryData);

      await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Give me advice',
        geminiExecutor,
        fallbackExecutor: jest.fn()
      });

      expect(getInFlightSize()).toBe(0);
    });

    test('10. in-flight entry is removed after failure', async () => {
      const geminiExecutor = jest.fn().mockRejectedValue(new Error('503 Service Unavailable'));
      const fallbackExecutor = jest.fn().mockResolvedValue(mockFallbackData);

      await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Give me advice',
        geminiExecutor,
        fallbackExecutor,
        options: { baseDelayMs: 1, addJitter: false }
      });

      expect(getInFlightSize()).toBe(0);
    });

    test('30. duplicate advisory requests executed sequentially hit cache on second call', async () => {
      const geminiExecutor = jest.fn().mockResolvedValue(mockAdvisoryData);

      const res1 = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'How can I save more?',
        geminiExecutor,
        fallbackExecutor: jest.fn()
      });

      const res2 = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'How can I save more?',
        geminiExecutor,
        fallbackExecutor: jest.fn()
      });

      expect(res1.cacheHit).toBe(false);
      expect(res2.cacheHit).toBe(true);
      expect(res2.geminiCalls).toBe(0);
      expect(geminiExecutor).toHaveBeenCalledTimes(1); // Only 1 total
    });
  });

  // =================================================================
  // 3. GEMINI ERROR CLASSIFICATION & SANITIZATION
  // =================================================================
  describe('3. Gemini Error Classification & Sanitization', () => {
    test('11. classifies 429 and quota exhaustion as RATE_LIMIT', () => {
      expect(classifyGeminiError({ response: { status: 429 } })).toBe(ERROR_TYPES.RATE_LIMIT);
      expect(classifyGeminiError(new Error('Resource has been exhausted: quota exceeded'))).toBe(ERROR_TYPES.RATE_LIMIT);
      expect(isRetryableError(ERROR_TYPES.RATE_LIMIT)).toBe(true);
    });

    test('12. classifies 503 and temporary server errors as TEMPORARY_UNAVAILABLE', () => {
      expect(classifyGeminiError({ response: { status: 503 } })).toBe(ERROR_TYPES.TEMPORARY_UNAVAILABLE);
      expect(classifyGeminiError({ response: { status: 500 } })).toBe(ERROR_TYPES.TEMPORARY_UNAVAILABLE);
      expect(classifyGeminiError(new Error('Service Unavailable'))).toBe(ERROR_TYPES.TEMPORARY_UNAVAILABLE);
      expect(isRetryableError(ERROR_TYPES.TEMPORARY_UNAVAILABLE)).toBe(true);
    });

    test('13. classifies timeouts as TIMEOUT', () => {
      expect(classifyGeminiError({ code: 'ECONNABORTED' })).toBe(ERROR_TYPES.TIMEOUT);
      expect(classifyGeminiError({ code: 'ETIMEDOUT' })).toBe(ERROR_TYPES.TIMEOUT);
      expect(classifyGeminiError(new Error('Request timeout after 30000ms'))).toBe(ERROR_TYPES.TIMEOUT);
      expect(isRetryableError(ERROR_TYPES.TIMEOUT)).toBe(true);
    });

    test('14. classifies 400 as non-retryable BAD_REQUEST', () => {
      expect(classifyGeminiError({ response: { status: 400 } })).toBe(ERROR_TYPES.BAD_REQUEST);
      expect(classifyGeminiError(new Error('Bad Request: Invalid argument'))).toBe(ERROR_TYPES.BAD_REQUEST);
      expect(isRetryableError(ERROR_TYPES.BAD_REQUEST)).toBe(false);
    });

    test('15. classifies 401/403 as non-retryable AUTHORIZATION', () => {
      expect(classifyGeminiError({ response: { status: 401 } })).toBe(ERROR_TYPES.AUTHORIZATION);
      expect(classifyGeminiError({ response: { status: 403 } })).toBe(ERROR_TYPES.AUTHORIZATION);
      expect(classifyGeminiError(new Error('API key not valid'))).toBe(ERROR_TYPES.AUTHORIZATION);
      expect(isRetryableError(ERROR_TYPES.AUTHORIZATION)).toBe(false);
    });

    test('26. sanitizes error messages so API key never appears in telemetry or logs', () => {
      const rawError = new Error('Failed connecting to https://generativelanguage.googleapis.com?key=AIzaSySecretApiKey12345 with sk-proj123456');
      const sanitized = sanitizeErrorMessage(rawError);

      expect(sanitized).not.toContain('AIzaSySecretApiKey12345');
      expect(sanitized).not.toContain('sk-proj123456');
      expect(sanitized).toContain('key=[REDACTED]');
      expect(sanitized).toContain('sk-[REDACTED]');
    });
  });

  // =================================================================
  // 4. EXPONENTIAL BACKOFF & GLOBAL GEMINI BUDGET ENFORCEMENT
  // =================================================================
  describe('4. Exponential Backoff & Global Gemini Budget Enforcement', () => {
    test('16. enforces retry limit and stops after max retries', async () => {
      const geminiExecutor = jest.fn().mockRejectedValue(new Error('503 Service Unavailable'));
      const fallbackExecutor = jest.fn().mockResolvedValue(mockFallbackData);

      const result = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Advice please',
        geminiExecutor,
        fallbackExecutor,
        options: { maxBudget: 2, maxRetries: 1, baseDelayMs: 1, addJitter: false }
      });

      expect(geminiExecutor).toHaveBeenCalledTimes(2); // Initial (1) + 1 retry (2)
      expect(result.geminiCalls).toBe(2);
      expect(result.fallback).toBe(true);
      expect(result.provider).toBe('heuristic');
    });

    test('17. calculates exponential backoff delay accurately', () => {
      const delay1 = calculateBackoffDelay({ attempt: 1, baseDelayMs: 500, addJitter: false });
      const delay2 = calculateBackoffDelay({ attempt: 2, baseDelayMs: 500, addJitter: false });
      const delay3 = calculateBackoffDelay({ attempt: 3, baseDelayMs: 500, addJitter: false });

      expect(delay1).toBe(500);
      expect(delay2).toBe(1000);
      expect(delay3).toBe(2000);
    });

    test('18. strictly enforces MAX_ADVISORY_BUDGET (never exceeds 2 Gemini calls)', async () => {
      const geminiExecutor = jest.fn().mockRejectedValue(new Error('429 Resource Exhausted'));
      const fallbackExecutor = jest.fn().mockResolvedValue(mockFallbackData);

      const result = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Advice please',
        geminiExecutor,
        fallbackExecutor,
        options: { maxBudget: MAX_ADVISORY_BUDGET, maxRetries: 5, baseDelayMs: 1, addJitter: false }
      });

      expect(geminiExecutor).toHaveBeenCalledTimes(2); // Strictly capped at 2
      expect(result.geminiCalls).toBe(2);
      expect(result.geminiCalls).toBeLessThanOrEqual(MAX_ADVISORY_BUDGET);
      expect(result.fallback).toBe(true);
    });

    test('19. quota failure (429) triggers graceful fallback', async () => {
      const geminiExecutor = jest.fn().mockRejectedValue({ response: { status: 429 } });
      const fallbackExecutor = jest.fn().mockResolvedValue(mockFallbackData);

      const result = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Plan my budget',
        geminiExecutor,
        fallbackExecutor,
        options: { baseDelayMs: 1, addJitter: false }
      });

      expect(result.provider).toBe('heuristic');
      expect(result.fallback).toBe(true);
      expect(result.data).toEqual(mockFallbackData);
    });

    test('20. timeout triggers graceful fallback', async () => {
      const timeoutErr = new Error('ETIMEDOUT');
      timeoutErr.code = 'ETIMEDOUT';
      const geminiExecutor = jest.fn().mockRejectedValue(timeoutErr);
      const fallbackExecutor = jest.fn().mockResolvedValue(mockFallbackData);

      const result = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Plan my budget',
        geminiExecutor,
        fallbackExecutor,
        options: { baseDelayMs: 1, addJitter: false }
      });

      expect(result.provider).toBe('heuristic');
      expect(result.fallback).toBe(true);
      expect(result.data).toEqual(mockFallbackData);
    });
  });

  // =================================================================
  // 5. DETERMINISTIC PASSTHROUGH & TELEMETRY INVARIANTS
  // =================================================================
  describe('5. Deterministic Passthrough & Telemetry Invariants', () => {
    test('21. cache hit produces exactly zero Gemini calls', async () => {
      const key = buildCacheKey({ userId: userIdA, month: monthA, question: 'What advice?' });
      setCachedResponse(key, mockAdvisoryData);

      const geminiExecutor = jest.fn();

      const result = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'What advice?',
        geminiExecutor,
        fallbackExecutor: jest.fn()
      });

      expect(result.cacheHit).toBe(true);
      expect(result.geminiCalls).toBe(0);
      expect(geminiExecutor).not.toHaveBeenCalled();
    });

    test('22. deterministic route remains zero Gemini calls', async () => {
      const toolExecutor = jest.fn().mockReturnValue({ netSavings: 60000 });

      const result = await optimizeDeterministicExecution({
        executor: toolExecutor
      });

      expect(result.provider).toBe('deterministic');
      expect(result.geminiCalls).toBe(0);
      expect(toolExecutor).toHaveBeenCalledTimes(1);

      const stats = getUsageStats();
      expect(stats.deterministicRequests).toBe(1);
      expect(stats.geminiCalls).toBe(0);
    });

    test('23. usage tracker increments counters correctly across diverse flows', async () => {
      // 1 deterministic
      await optimizeDeterministicExecution({ executor: () => ({ total: 100 }) });

      // 1 advisory success
      await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Query 1',
        geminiExecutor: jest.fn().mockResolvedValue(mockAdvisoryData),
        fallbackExecutor: jest.fn()
      });

      // 1 advisory cache hit
      await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Query 1',
        geminiExecutor: jest.fn(),
        fallbackExecutor: jest.fn()
      });

      const stats = getUsageStats();
      expect(stats.totalRequests).toBe(3);
      expect(stats.deterministicRequests).toBe(1);
      expect(stats.advisoryRequests).toBe(2);
      expect(stats.geminiCalls).toBe(1);
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
    });

    test('24. usage tracker reset cleanly restores zero state', () => {
      resetUsageStats();
      const stats = getUsageStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.geminiCalls).toBe(0);
    });

    test('25. telemetry does not store user financial data or sensitive metadata', () => {
      const stats = getUsageStats();
      const json = JSON.stringify(stats);

      expect(json).not.toContain('amount');
      expect(json).not.toContain('transaction');
      expect(json).not.toContain('salary');
      expect(json).not.toContain('rent');
      expect(json).not.toContain('shopping');
      expect(json).not.toContain('secret');
    });
  });

  // =================================================================
  // 6. SIMULATION TEST MATRIX (SCENARIOS 1 - 8)
  // =================================================================
  describe('6. Simulation Test Matrix (Scenarios 1 - 8)', () => {
    test('Scenario 1: First advisory question -> Cache: MISS, Gemini: 1, Provider: gemini', async () => {
      const geminiExecutor = jest.fn().mockResolvedValue(mockAdvisoryData);

      const result = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Why is my spending high?',
        geminiExecutor,
        fallbackExecutor: jest.fn()
      });

      expect(result.cacheHit).toBe(false);
      expect(result.geminiCalls).toBe(1);
      expect(result.provider).toBe('gemini');
    });

    test('Scenario 2: Same advisory question immediately again -> Cache: HIT, Gemini: 0, Provider: gemini', async () => {
      const geminiExecutor = jest.fn().mockResolvedValue(mockAdvisoryData);

      // Turn 1
      await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Why is my spending high?',
        geminiExecutor,
        fallbackExecutor: jest.fn()
      });

      // Turn 2
      const result = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Why is my spending high?',
        geminiExecutor,
        fallbackExecutor: jest.fn()
      });

      expect(result.cacheHit).toBe(true);
      expect(result.geminiCalls).toBe(0);
      expect(result.provider).toBe('gemini');
      expect(geminiExecutor).toHaveBeenCalledTimes(1);
    });

    test('Scenario 3: Two identical requests simultaneously -> Gemini: 1 total, Second request deduplicated', async () => {
      const geminiExecutor = jest.fn(async () => {
        await new Promise((r) => setTimeout(r, 30));
        return mockAdvisoryData;
      });

      const [res1, res2] = await Promise.all([
        optimizeAdvisoryExecution({
          userId: userIdA,
          month: monthA,
          message: 'Simultaneous advisory request',
          geminiExecutor,
          fallbackExecutor: jest.fn()
        }),
        optimizeAdvisoryExecution({
          userId: userIdA,
          month: monthA,
          message: 'Simultaneous advisory request',
          geminiExecutor,
          fallbackExecutor: jest.fn()
        })
      ]);

      expect(geminiExecutor).toHaveBeenCalledTimes(1);
      expect(res1.deduplicated || res2.deduplicated).toBe(true);
    });

    test('Scenario 4: Gemini 429 -> Retry within budget; if still unavailable -> heuristic fallback', async () => {
      const geminiExecutor = jest.fn().mockRejectedValue({ response: { status: 429 } });
      const fallbackExecutor = jest.fn().mockResolvedValue(mockFallbackData);

      const result = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Advisory on 429',
        geminiExecutor,
        fallbackExecutor,
        options: { baseDelayMs: 1, addJitter: false }
      });

      expect(geminiExecutor).toHaveBeenCalledTimes(2);
      expect(result.provider).toBe('heuristic');
      expect(result.fallback).toBe(true);
    });

    test('Scenario 5: Gemini 503 -> Limited retry; if still unavailable -> heuristic fallback', async () => {
      const geminiExecutor = jest.fn().mockRejectedValue({ response: { status: 503 } });
      const fallbackExecutor = jest.fn().mockResolvedValue(mockFallbackData);

      const result = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Advisory on 503',
        geminiExecutor,
        fallbackExecutor,
        options: { baseDelayMs: 1, addJitter: false }
      });

      expect(geminiExecutor).toHaveBeenCalledTimes(2);
      expect(result.provider).toBe('heuristic');
      expect(result.fallback).toBe(true);
    });

    test('Scenario 6: Gemini timeout -> Limited retry; if still unavailable -> heuristic fallback', async () => {
      const err = new Error('ETIMEDOUT');
      err.code = 'ETIMEDOUT';
      const geminiExecutor = jest.fn().mockRejectedValue(err);
      const fallbackExecutor = jest.fn().mockResolvedValue(mockFallbackData);

      const result = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Advisory on timeout',
        geminiExecutor,
        fallbackExecutor,
        options: { baseDelayMs: 1, addJitter: false }
      });

      expect(geminiExecutor).toHaveBeenCalledTimes(2);
      expect(result.provider).toBe('heuristic');
      expect(result.fallback).toBe(true);
    });

    test('Scenario 7: Different user asks same question -> Cache: MISS', async () => {
      const geminiExecutor = jest.fn().mockResolvedValue(mockAdvisoryData);

      await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Common question',
        geminiExecutor,
        fallbackExecutor: jest.fn()
      });

      const resUserB = await optimizeAdvisoryExecution({
        userId: userIdB,
        month: monthA,
        message: 'Common question',
        geminiExecutor,
        fallbackExecutor: jest.fn()
      });

      expect(resUserB.cacheHit).toBe(false);
      expect(geminiExecutor).toHaveBeenCalledTimes(2);
    });

    test('Scenario 8: Different month asks same question -> Cache: MISS', async () => {
      const geminiExecutor = jest.fn().mockResolvedValue(mockAdvisoryData);

      await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthA,
        message: 'Monthly question',
        geminiExecutor,
        fallbackExecutor: jest.fn()
      });

      const resMonthB = await optimizeAdvisoryExecution({
        userId: userIdA,
        month: monthB,
        message: 'Monthly question',
        geminiExecutor,
        fallbackExecutor: jest.fn()
      });

      expect(resMonthB.cacheHit).toBe(false);
      expect(geminiExecutor).toHaveBeenCalledTimes(2);
    });
  });
});
