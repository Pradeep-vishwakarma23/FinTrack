import copilotService, { COPILOT_TIMEOUT_MS } from '../src/services/copilotService.js';
import api from '../src/services/api.js';
import { ENV } from '../src/config/env.js';

jest.mock('../src/services/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    defaults: {
      timeout: 15000,
    }
  },
}));

describe('FinTrack Mobile - Copilot Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. should verify Copilot timeout is 60000ms while standard API timeout is 15000ms', () => {
    expect(COPILOT_TIMEOUT_MS).toBe(60000);
    expect(ENV.COPILOT_REQUEST_TIMEOUT_MS).toBe(60000);
    expect(ENV.REQUEST_TIMEOUT_MS).toBe(15000);
    expect(api.defaults.timeout).toBe(15000);
  });

  it('2. should call POST /copilot/chat with 60000ms timeout', async () => {
    const mockChatResponse = {
      success: true,
      sessionId: 'session_777',
      provider: 'gemini',
      data: {
        message: 'Your savings rate is -72% due to high Shopping and Other expenses.',
        referencedFacts: { income: 625, expense: 1075, savingsRate: -72 },
        suggestedFollowUps: ['Which category contributed the most?', 'What if I reduce Shopping by 20%?']
      }
    };
    api.post.mockResolvedValueOnce(mockChatResponse);

    const result = await copilotService.sendMessage({
      sessionId: 'session_777',
      month: '2026-09',
      message: 'Why is my savings rate negative?'
    });

    expect(api.post).toHaveBeenCalledWith(
      '/copilot/chat',
      {
        sessionId: 'session_777',
        month: '2026-09',
        message: 'Why is my savings rate negative?'
      },
      { timeout: 60000 }
    );
    expect(result.success).toBe(true);
    expect(result.sessionId).toBe('session_777');
    expect(result.provider).toBe('gemini');
    expect(result.data.suggestedFollowUps).toHaveLength(2);
  });

  it('3. should call GET /copilot/sessions with 60000ms timeout', async () => {
    const mockSessionsResponse = {
      success: true,
      count: 2,
      data: [
        { _id: 'session_777', title: 'Why is my savings rate negative?', month: '2026-09' },
        { _id: 'session_888', title: 'Goal feasibility question', month: '2026-09' }
      ]
    };
    api.get.mockResolvedValueOnce(mockSessionsResponse);

    const result = await copilotService.getSessions(20);

    expect(api.get).toHaveBeenCalledWith('/copilot/sessions', {
      params: { limit: 20 },
      timeout: 60000
    });
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('4. should call GET /copilot/sessions/:id with 60000ms timeout', async () => {
    const mockSession = {
      success: true,
      data: {
        _id: 'session_777',
        month: '2026-09',
        messages: [
          { role: 'user', content: 'Why is my savings rate negative?' },
          { role: 'assistant', content: 'You have expenses exceeding income.' }
        ]
      }
    };
    api.get.mockResolvedValueOnce(mockSession);

    const result = await copilotService.getSession('session_777');

    expect(api.get).toHaveBeenCalledWith('/copilot/sessions/session_777', {
      timeout: 60000
    });
    expect(result.data._id).toBe('session_777');
    expect(result.data.messages).toHaveLength(2);
  });

  it('5. should call DELETE /copilot/sessions/:id with 60000ms timeout', async () => {
    api.delete.mockResolvedValueOnce({
      success: true,
      message: 'Session deleted successfully.'
    });

    const result = await copilotService.deleteSession('session_777');

    expect(api.delete).toHaveBeenCalledWith('/copilot/sessions/session_777', {
      timeout: 60000
    });
    expect(result.success).toBe(true);
  });

  it('6. should call POST /copilot/explain with 60000ms timeout', async () => {
    const mockExplanation = {
      success: true,
      provider: 'gemini',
      data: {
        title: 'Savings Rate (-72%) Analysis',
        explanation: 'Your net cash flow is negative ₹450 because total expenses exceeded income.',
        keyDrivers: ['Other expenses: ₹600', 'Shopping expenses: ₹475'],
        recommendedAction: 'Reduce discretionary shopping by ₹200 to move cash flow closer to breakeven.'
      }
    };
    api.post.mockResolvedValueOnce(mockExplanation);

    const result = await copilotService.explainMetric({
      month: '2026-09',
      contextType: 'savings_rate',
      itemData: {}
    });

    expect(api.post).toHaveBeenCalledWith(
      '/copilot/explain',
      {
        month: '2026-09',
        contextType: 'savings_rate',
        itemData: {}
      },
      { timeout: 60000 }
    );
    expect(result.success).toBe(true);
    expect(result.data.title).toContain('Savings Rate');
  });

  it('7. should call GET /copilot/proactive-insights with 60000ms timeout', async () => {
    const mockInsights = {
      success: true,
      month: '2026-09',
      data: [
        {
          id: 'insight_deficit_risk',
          type: 'danger',
          title: 'Monthly Cash Flow Deficit',
          message: 'Your verified expenses (₹1,075) exceed your confirmed income (₹625).',
          actionLabel: 'Review Deficit'
        }
      ]
    };
    api.get.mockResolvedValueOnce(mockInsights);

    const result = await copilotService.getProactiveInsights('2026-09');

    expect(api.get).toHaveBeenCalledWith('/copilot/proactive-insights', {
      params: { month: '2026-09' },
      timeout: 60000
    });
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].type).toBe('danger');
  });

  it('8. should handle and propagate API errors cleanly', async () => {
    api.post.mockRejectedValueOnce({
      success: false,
      message: 'Copilot query exceeds maximum allowed length.'
    });

    await expect(
      copilotService.sendMessage({ message: 'x'.repeat(600) })
    ).rejects.toEqual({
      success: false,
      message: 'Copilot query exceeds maximum allowed length.'
    });
  });
});

