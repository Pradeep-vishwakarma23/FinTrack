import api from './api.js';

/**
 * Banking Intelligence API Service for FinTrack Mobile
 * Communicates with Phase 6.1 intelligence endpoints:
 * - GET /api/intelligence/summary?month=YYYY-MM
 * - GET /api/intelligence/merchants?month=YYYY-MM&limit=10
 * - GET /api/intelligence/anomalies?month=YYYY-MM
 * - GET /api/intelligence/forecast?month=YYYY-MM
 */
export const intelligenceService = {
  /**
   * Fetch consolidated banking intelligence summary
   */
  async getSummary(month) {
    const params = month ? { month } : {};
    const response = await api.get('/intelligence/summary', { params });
    return response?.data || response;
  },

  /**
   * Fetch top merchant analytics, frequency, and average ticket size
   */
  async getMerchants(month, limit = 10) {
    const params = { ...(month ? { month } : {}), limit };
    const response = await api.get('/intelligence/merchants', { params });
    return response?.data || response;
  },

  /**
   * Fetch detected spending anomalies (budget shocks, statistical category outliers)
   */
  async getAnomalies(month) {
    const params = month ? { month } : {};
    const response = await api.get('/intelligence/anomalies', { params });
    return response?.data || response;
  },

  /**
   * Fetch daily burn rate, run-rate forecast, and budget velocity risk
   */
  async getForecast(month) {
    const params = month ? { month } : {};
    const response = await api.get('/intelligence/forecast', { params });
    return response?.data || response;
  },

  /**
   * Fetch recurring subscriptions, cadence detection, price increases, and next payment dates
   */
  async getSubscriptions() {
    const response = await api.get('/intelligence/subscriptions');
    return response?.data || response;
  },

  /**
   * Fetch multi-month financial trends, MoM comparisons, category shifts, and savings momentum
   */
  async getTrends(range = '6m', referenceMonth = null) {
    const params = { range, ...(referenceMonth ? { referenceMonth } : {}) };
    const response = await api.get('/intelligence/trends', { params });
    return response?.data || response;
  }
};

export default intelligenceService;
