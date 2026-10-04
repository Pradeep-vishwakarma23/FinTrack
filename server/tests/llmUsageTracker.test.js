import {
  recordDeterministicRequest,
  recordAdvisoryRequest,
  recordGeminiCall,
  recordCacheHit,
  recordCacheMiss,
  recordDeduplicatedRequest,
  recordGeminiFailure,
  recordQuotaFailure,
  recordTimeoutFailure,
  recordFallbackResponse,
  recordProviderResponse,
  getUsageStats,
  resetUsageStats
} from '../services/llmUsageTracker.js';

describe('Phase 7: LLM Usage Tracker Unit Tests (llmUsageTracker.test.js)', () => {
  beforeEach(() => {
    resetUsageStats();
  });

  test('1. starts with all counters at zero', () => {
    const stats = getUsageStats();
    expect(stats.totalRequests).toBe(0);
    expect(stats.deterministicRequests).toBe(0);
    expect(stats.advisoryRequests).toBe(0);
    expect(stats.geminiCalls).toBe(0);
    expect(stats.cacheHits).toBe(0);
    expect(stats.cacheMisses).toBe(0);
    expect(stats.deduplicatedRequests).toBe(0);
    expect(stats.geminiFailures).toBe(0);
    expect(stats.quotaFailures).toBe(0);
    expect(stats.timeoutFailures).toBe(0);
    expect(stats.fallbackResponses).toBe(0);
    expect(stats.providers.gemini).toBe(0);
    expect(stats.providers.deterministic).toBe(0);
    expect(stats.providers.heuristic).toBe(0);
  });

  test('2. records deterministic requests accurately', () => {
    recordDeterministicRequest();
    recordDeterministicRequest();

    const stats = getUsageStats();
    expect(stats.totalRequests).toBe(2);
    expect(stats.deterministicRequests).toBe(2);
    expect(stats.providers.deterministic).toBe(2);
    expect(stats.advisoryRequests).toBe(0);
  });

  test('3. records advisory requests and gemini calls accurately', () => {
    recordAdvisoryRequest();
    recordGeminiCall(1);
    recordGeminiCall(2);

    const stats = getUsageStats();
    expect(stats.totalRequests).toBe(1);
    expect(stats.advisoryRequests).toBe(1);
    expect(stats.geminiCalls).toBe(3);
  });

  test('4. records cache hits and misses', () => {
    recordCacheMiss();
    recordCacheHit();
    recordCacheHit();

    const stats = getUsageStats();
    expect(stats.cacheHits).toBe(2);
    expect(stats.cacheMisses).toBe(1);
  });

  test('5. records deduplicated concurrent requests', () => {
    recordDeduplicatedRequest();
    recordDeduplicatedRequest();

    const stats = getUsageStats();
    expect(stats.deduplicatedRequests).toBe(2);
  });

  test('6. records Gemini failure classifications including quota and timeout', () => {
    recordGeminiFailure('RATE_LIMIT');
    recordGeminiFailure('TIMEOUT');
    recordGeminiFailure('503_ERROR');
    recordQuotaFailure();
    recordTimeoutFailure();

    const stats = getUsageStats();
    expect(stats.geminiFailures).toBe(3);
    expect(stats.quotaFailures).toBe(2); // 1 from RATE_LIMIT + 1 direct
    expect(stats.timeoutFailures).toBe(2); // 1 from TIMEOUT + 1 direct
  });

  test('7. records fallback responses and provider counts', () => {
    recordFallbackResponse();
    recordProviderResponse('gemini');

    const stats = getUsageStats();
    expect(stats.fallbackResponses).toBe(1);
    expect(stats.providers.heuristic).toBe(1);
    expect(stats.providers.gemini).toBe(1);
  });

  test('8. resets usage statistics cleanly', () => {
    recordDeterministicRequest();
    recordGeminiCall(5);
    recordCacheHit();

    resetUsageStats();
    const stats = getUsageStats();
    expect(stats.totalRequests).toBe(0);
    expect(stats.geminiCalls).toBe(0);
    expect(stats.cacheHits).toBe(0);
  });

  test('9. returns an isolated snapshot (immutability)', () => {
    const stats1 = getUsageStats();
    stats1.totalRequests = 999;
    stats1.providers.gemini = 888;

    const stats2 = getUsageStats();
    expect(stats2.totalRequests).toBe(0);
    expect(stats2.providers.gemini).toBe(0);
  });

  test('10. verifies telemetry structure does not contain financial data or sensitive keys', () => {
    const stats = getUsageStats();
    const serialized = JSON.stringify(stats);

    expect(serialized).not.toContain('amount');
    expect(serialized).not.toContain('merchant');
    expect(serialized).not.toContain('account');
    expect(serialized).not.toContain('balance');
    expect(serialized).not.toContain('key');
    expect(serialized).not.toContain('jwt');
    expect(serialized).not.toContain('token');
  });
});
