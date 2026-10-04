import aiAdvisorService from '../src/services/aiAdvisorService.js';
import api from '../src/services/api.js';

jest.mock('../src/services/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('FinTrack Mobile - AI Advisor Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call POST /ai/advisor/advice with month payload', async () => {
    const mockAdvice = {
      success: true,
      provider: 'gemini',
      period: '2026-09',
      data: {
        executiveSummary: 'Positive surplus for 2026-09.',
        keyObservations: ['Rent is highest expense'],
        actionableRecommendations: ['Save 20%'],
        savingsPotential: 'Save ₹500',
      },
    };

    api.post.mockResolvedValueOnce(mockAdvice);

    const result = await aiAdvisorService.getAdvice('2026-09');

    expect(api.post).toHaveBeenCalledWith('/ai/advisor/advice', { month: '2026-09' });
    expect(result.success).toBe(true);
    expect(result.provider).toBe('gemini');
    expect(result.data.executiveSummary).toContain('Positive surplus');
  });

  it('should call POST /ai/advisor/query with month and question payload', async () => {
    const mockQuery = {
      success: true,
      provider: 'gemini',
      period: '2026-09',
      data: {
        answer: 'Your largest expense is Food at ₹2,500.',
        referencedFacts: { amount: 2500 },
      },
    };

    api.post.mockResolvedValueOnce(mockQuery);

    const result = await aiAdvisorService.askQuestion('2026-09', 'Where am I spending the most?');

    expect(api.post).toHaveBeenCalledWith('/ai/advisor/query', {
      month: '2026-09',
      question: 'Where am I spending the most?',
    });
    expect(result.data.answer).toContain('Food at ₹2,500');
  });

  it('should call POST /ai/advisor/what-if with month and scenario payload', async () => {
    const mockWhatIf = {
      success: true,
      provider: 'gemini',
      period: '2026-09',
      data: {
        baseline: { income: 4000, expense: 4450, netSavings: -450, savingsRate: 0 },
        simulated: { income: 4500, expense: 3880.7, netSavings: 619.3, savingsRate: 13.76 },
        difference: { savedExpense: 569.3, additionalIncome: 500, improvedSavings: 1069.3 },
        narrative: 'Trimming expenses and adding ₹500 leads to positive cash flow.',
      },
    };

    api.post.mockResolvedValueOnce(mockWhatIf);

    const scenario = {
      categoryReductions: { Other: 20, Shopping: 10 },
      additionalIncome: 500,
    };

    const result = await aiAdvisorService.runWhatIf('2026-09', scenario);

    expect(api.post).toHaveBeenCalledWith('/ai/advisor/what-if', {
      month: '2026-09',
      scenario,
    });
    expect(result.data.simulated.netSavings).toBe(619.3);
    expect(result.data.difference.improvedSavings).toBe(1069.3);
  });
});
