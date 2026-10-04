import api from './api.js';

/**
 * Action Plan API Service for FinTrack Mobile (Phase 7.5)
 * Communicates with deterministic backend endpoints:
 * - GET /api/action-plans
 * - POST /api/action-plans
 * - GET /api/action-plans/:id
 * - PUT /api/action-plans/:id
 * - DELETE /api/action-plans/:id
 * - POST /api/action-plans/generate
 * - POST /api/action-plans/:id/complete
 * - POST /api/action-plans/:id/dismiss
 */
export const actionPlanService = {
  /**
   * Fetch all action plans for the authenticated user
   * @param {Object} [params]
   */
  async getActionPlans(params = {}) {
    const response = await api.get('/action-plans', { params });
    return response;
  },

  /**
   * Fetch a single action plan by ID
   * @param {string} id
   */
  async getActionPlan(id) {
    const response = await api.get(`/action-plans/${id}`);
    return response;
  },

  /**
   * Create an action plan manually
   * @param {Object} planData
   */
  async createActionPlan(planData) {
    const response = await api.post('/action-plans', planData);
    return response;
  },

  /**
   * Update an existing action plan
   * @param {string} id
   * @param {Object} planData
   */
  async updateActionPlan(id, planData) {
    const response = await api.put(`/action-plans/${id}`, planData);
    return response;
  },

  /**
   * Delete an action plan
   * @param {string} id
   */
  async deleteActionPlan(id) {
    const response = await api.delete(`/action-plans/${id}`);
    return response;
  },

  /**
   * Generate action plans deterministically from verified intelligence
   */
  async generateActionPlans() {
    const response = await api.post('/action-plans/generate');
    return response;
  },

  /**
   * Mark an action plan as COMPLETED
   * @param {string} id
   */
  async completeActionPlan(id) {
    const response = await api.post(`/action-plans/${id}/complete`);
    return response;
  },

  /**
   * Mark an action plan as DISMISSED
   * @param {string} id
   */
  async dismissActionPlan(id) {
    const response = await api.post(`/action-plans/${id}/dismiss`);
    return response;
  }
};

export default actionPlanService;
