import API from './api'

/**
 * AI Financial Copilot Service for FinTrack Web
 * Communicates strictly with backend Phase 6.4 Copilot & Insights endpoints:
 * - POST /api/copilot/chat
 * - GET /api/copilot/sessions
 * - DELETE /api/copilot/sessions/:id
 * - POST /api/copilot/explain
 * - GET /api/copilot/proactive-insights
 */
export const copilotService = {
  /**
   * Sends a conversational message to the multi-turn Copilot.
   * @param {Object} params
   * @param {string} [params.sessionId] - Active conversation session ID
   * @param {string} [params.month] - Target financial month in YYYY-MM
   * @param {string} params.message - User's natural language message
   */
  chat: async ({ sessionId = null, month, message }) => {
    const payload = {
      sessionId: sessionId || null,
      month,
      message
    }
    const response = await API.post('/copilot/chat', payload)
    return response.data
  },

  /**
   * Retrieves the authenticated user's Copilot conversation sessions.
   * @param {number} [limit=20]
   */
  getSessions: async (limit = 20) => {
    const response = await API.get('/copilot/sessions', {
      params: { limit }
    })
    return response.data
  },

  /**
   * Deletes a Copilot session belonging to the authenticated user.
   * @param {string} sessionId
   */
  deleteSession: async (sessionId) => {
    const response = await API.delete(`/copilot/sessions/${sessionId}`)
    return response.data
  },

  /**
   * Requests a grounded explanation for a specific financial metric or concept.
   * Note: itemData is purely client contextual metadata; backend numbers are authoritative.
   * @param {Object} params
   * @param {string} [params.month] - Target financial month in YYYY-MM
   * @param {string} params.contextType - Metric context type (e.g. savings_rate, anomaly, forecast, etc.)
   * @param {Object} [params.itemData] - Optional UI contextual object
   */
  explain: async ({ month, contextType, itemData = {} }) => {
    const payload = {
      contextType,
      itemData,
      ...(month ? { month } : {})
    }
    const response = await API.post('/copilot/explain', payload)
    return response.data
  },

  /**
   * Retrieves deterministic proactive financial alerts and insights for the target month.
   * @param {string} [month] - Target financial month in YYYY-MM
   */
  getProactiveInsights: async (month) => {
    const response = await API.get('/copilot/proactive-insights', {
      params: month ? { month } : {}
    })
    return response.data
  }
}

export default copilotService
