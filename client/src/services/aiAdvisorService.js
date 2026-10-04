import API from './api'

/**
 * AI Financial Advisor Service for FinTrack Web
 * Communicates strictly with backend Phase 6.3 AI Financial Advisor endpoints:
 * - POST /api/ai/advisor/advice
 * - POST /api/ai/advisor/query
 * - POST /api/ai/advisor/what-if
 */
export const aiAdvisorService = {
  /**
   * Generates grounded financial advice for the specified month
   * @param {string} [month] - Month in YYYY-MM format
   */
  getAdvice: async (month) => {
    const payload = month ? { month } : {}
    const response = await API.post('/ai/advisor/advice', payload)
    return response.data
  },

  /**
   * Queries the grounded financial advisor for the specified month
   * @param {string} month - Month in YYYY-MM format
   * @param {string} question - Financial question string
   */
  askQuestion: async (month, question) => {
    const payload = {
      question,
      ...(month ? { month } : {})
    }
    const response = await API.post('/ai/advisor/query', payload)
    return response.data
  },

  /**
   * Runs a deterministic What-If simulation for category reductions and additional income
   * @param {string} month - Month in YYYY-MM format
   * @param {Object} scenario - Scenario object: { categoryReductions: { [cat]: percent }, additionalIncome: number }
   */
  runWhatIf: async (month, scenario) => {
    const payload = {
      scenario: scenario || {},
      ...(month ? { month } : {})
    }
    const response = await API.post('/ai/advisor/what-if', payload)
    return response.data
  }
}

export default aiAdvisorService
