import api from './api.js';

/**
 * Dashboard API Service for FinTrack Mobile
 * Reuses existing backend endpoints:
 * - GET /api/dashboard/summary
 * - GET /api/budget
 * - GET /api/transactions
 */
export const dashboardService = {
  /**
   * Fetch consolidated dashboard summary metrics
   * Returns totalIncome, totalExpense, savings, budgetRemaining, monthlyBudget,
   * categoryBreakdown, monthlyTrend, recentTransactions, and stagedCount.
   */
  async getSummary(month) {
    const params = month ? { month } : {};
    const response = await api.get('/dashboard/summary', { params });
    return response?.data || response;
  },

  /**
   * Fetch current user budget limits
   */
  async getBudget() {
    const response = await api.get('/budget');
    return response?.data || response;
  },

  /**
   * Fetch recent confirmed transactions
   */
  async getRecentTransactions(limit = 5) {
    const response = await api.get(`/transactions?limit=${limit}`);
    return response?.data?.transactions || response?.data || [];
  }
};

export default dashboardService;
