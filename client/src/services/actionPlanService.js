import API from './api'

/**
 * Financial Action Plan Service for FinTrack Web (Phase 7.5)
 * Communicates strictly with backend deterministic Action Plan endpoints:
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
   * Retrieves all action plans for the authenticated user, optionally filtered by status.
   * @param {Object} [params]
   * @param {string} [params.status]
   */
  getActionPlans: async (params = {}) => {
    const response = await API.get('/action-plans', { params })
    return response.data
  },

  /**
   * Retrieves a single action plan by ID.
   * @param {string} id
   */
  getActionPlanById: async (id) => {
    const response = await API.get(`/action-plans/${id}`)
    return response.data
  },

  /**
   * Creates a new financial action plan.
   * @param {Object} planData
   */
  createActionPlan: async (planData) => {
    const response = await API.post('/action-plans', planData)
    return response.data
  },

  /**
   * Updates an existing action plan.
   * @param {string} id
   * @param {Object} planData
   */
  updateActionPlan: async (id, planData) => {
    const response = await API.put(`/action-plans/${id}`, planData)
    return response.data
  },

  /**
   * Deletes an action plan.
   * @param {string} id
   */
  deleteActionPlan: async (id) => {
    const response = await API.delete(`/action-plans/${id}`)
    return response.data
  },

  /**
   * Automatically analyzes verified intelligence and generates deterministic candidate plans.
   */
  generateActionPlans: async () => {
    const response = await API.post('/action-plans/generate')
    return response.data
  },

  /**
   * Marks an action plan as COMPLETED.
   * @param {string} id
   */
  completeActionPlan: async (id) => {
    const response = await API.post(`/action-plans/${id}/complete`)
    return response.data
  },

  /**
   * Marks an action plan as DISMISSED.
   * @param {string} id
   */
  dismissActionPlan: async (id) => {
    const response = await API.post(`/action-plans/${id}/dismiss`)
    return response.data
  }
}

export default actionPlanService
