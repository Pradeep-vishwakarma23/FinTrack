import API from './api'

/**
 * Financial Goals Service for FinTrack Web
 * Communicates strictly with backend Phase 6.4.1 Goal endpoints:
 * - GET /api/goals
 * - POST /api/goals
 * - GET /api/goals/:id
 * - PUT /api/goals/:id
 * - DELETE /api/goals/:id
 */
export const goalService = {
  /**
   * Retrieves all goals for the authenticated user, enriched with deterministic calculations.
   */
  getGoals: async () => {
    const response = await API.get('/goals')
    return response.data
  },

  /**
   * Creates a new financial goal with deterministic validation.
   * @param {Object} goalData
   * @param {string} goalData.title
   * @param {number} goalData.targetAmount
   * @param {number} [goalData.currentAmount=0]
   * @param {string|Date} goalData.targetDate
   * @param {string} [goalData.category='General']
   * @param {string} [goalData.priority='medium']
   * @param {string} [goalData.status='in_progress']
   * @param {number} [goalData.monthlyTarget=0]
   * @param {string} [goalData.notes='']
   */
  createGoal: async (goalData) => {
    const response = await API.post('/goals', goalData)
    return response.data
  },

  /**
   * Retrieves a single financial goal by ID.
   * @param {string} id
   */
  getGoalById: async (id) => {
    const response = await API.get(`/goals/${id}`)
    return response.data
  },

  /**
   * Updates an existing financial goal by ID.
   * @param {string} id
   * @param {Object} goalData
   */
  updateGoal: async (id, goalData) => {
    const response = await API.put(`/goals/${id}`, goalData)
    return response.data
  },

  /**
   * Deletes a financial goal by ID.
   * @param {string} id
   */
  deleteGoal: async (id) => {
    const response = await API.delete(`/goals/${id}`)
    return response.data
  }
}

export default goalService
