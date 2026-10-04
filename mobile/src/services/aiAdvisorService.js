import api from './api.js';

/**
 * AI Financial Advisor Service for FinTrack Mobile
 * Communicates strictly with backend Phase 6.3 AI Advisor endpoints:
 * - POST /api/ai/advisor/advice
 * - POST /api/ai/advisor/query
 * - POST /api/ai/advisor/what-if
 */
export const aiAdvisorService = {
  /**
   * Fetch grounded executive financial advice for the specified month
   * @param {string} [month] - Month in YYYY-MM format
   */
  async getAdvice(month) {
    const payload = month ? { month } : {};
    const response = await api.post('/ai/advisor/advice', payload);
    return response;
  },

  /**
   * Ask a grounded financial question about the specified month
   * @param {string} month - Month in YYYY-MM format
   * @param {string} question - Financial question string
   */
  async askQuestion(month, question) {
    const payload = {
      question,
      ...(month ? { month } : {})
    };
    const response = await api.post('/ai/advisor/query', payload);
    return response;
  },

  /**
   * Simulate deterministic what-if scenario for the specified month
   * @param {string} month - Month in YYYY-MM format
   * @param {Object} scenario - Scenario adjustments: { categoryReductions: {}, additionalIncome: number }
   */
  async runWhatIf(month, scenario) {
    const payload = {
      scenario: scenario || {},
      ...(month ? { month } : {})
    };
    const response = await api.post('/ai/advisor/what-if', payload);
    return response;
  }
};

export default aiAdvisorService;
