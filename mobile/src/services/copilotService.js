import api from './api.js';
import { ENV } from '../config/env.js';

export const COPILOT_TIMEOUT_MS = ENV?.COPILOT_REQUEST_TIMEOUT_MS || 60000;

/**
 * AI Financial Copilot Service for FinTrack Mobile
 * Communicates strictly with backend Phase 6.4 Copilot & Insights endpoints:
 * - POST /api/copilot/chat
 * - GET /api/copilot/sessions
 * - GET /api/copilot/sessions/:id
 * - DELETE /api/copilot/sessions/:id
 * - POST /api/copilot/explain
 * - GET /api/copilot/proactive-insights
 */
export const copilotService = {
  /**
   * Sends a message to the multi-turn Copilot
   * @param {Object} params
   * @param {string} [params.sessionId] - Active conversation session ID
   * @param {string} [params.month] - Financial month in YYYY-MM
   * @param {string} params.message - User natural language question
   */
  async sendMessage({ sessionId = null, month, message }) {
    const payload = {
      sessionId: sessionId || null,
      month,
      message
    };
    const response = await api.post('/copilot/chat', payload, {
      timeout: COPILOT_TIMEOUT_MS
    });
    return response;
  },

  /**
   * Retrieves user's Copilot conversation sessions
   * @param {number} [limit=20]
   */
  async getSessions(limit = 20) {
    const response = await api.get('/copilot/sessions', {
      params: { limit },
      timeout: COPILOT_TIMEOUT_MS
    });
    return response;
  },

  /**
   * Retrieves single conversation session by ID
   * @param {string} sessionId
   */
  async getSession(sessionId) {
    const response = await api.get(`/copilot/sessions/${sessionId}`, {
      timeout: COPILOT_TIMEOUT_MS
    });
    return response;
  },

  /**
   * Deletes a conversation session by ID
   * @param {string} sessionId
   */
  async deleteSession(sessionId) {
    const response = await api.delete(`/copilot/sessions/${sessionId}`, {
      timeout: COPILOT_TIMEOUT_MS
    });
    return response;
  },

  /**
   * Requests a grounded explanation for a specific financial metric
   * @param {Object} params
   * @param {string} [params.month] - Target financial month in YYYY-MM
   * @param {string} params.contextType - Metric context type (savings_rate, anomaly, forecast, etc.)
   * @param {Object} [params.itemData] - Contextual metadata
   */
  async explainMetric({ month, contextType, itemData = {} }) {
    const payload = {
      contextType,
      itemData,
      ...(month ? { month } : {})
    };
    const response = await api.post('/copilot/explain', payload, {
      timeout: COPILOT_TIMEOUT_MS
    });
    return response;
  },

  /**
   * Retrieves proactive financial alerts and insights for the target month
   * @param {string} [month] - Financial month in YYYY-MM
   */
  async getProactiveInsights(month) {
    const response = await api.get('/copilot/proactive-insights', {
      params: month ? { month } : {},
      timeout: COPILOT_TIMEOUT_MS
    });
    return response;
  }
};

export default copilotService;
