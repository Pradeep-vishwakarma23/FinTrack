import api from './api.js';

/**
 * Goal API Service for FinTrack Mobile
 * Reuses existing backend endpoints:
 * - GET /api/goals (retrieves user goals enriched with deterministic calculations)
 * - POST /api/goals (creates a new financial goal with validation)
 * - GET /api/goals/:id (retrieves single goal by ID)
 * - PUT /api/goals/:id (updates existing goal)
 * - DELETE /api/goals/:id (deletes goal by ID)
 */
export const goalService = {
  /**
   * Fetch all goals for the authenticated user
   */
  async getGoals() {
    const response = await api.get('/goals');
    return response;
  },

  /**
   * Fetch a single goal by ID
   */
  async getGoal(id) {
    const response = await api.get(`/goals/${id}`);
    return response;
  },

  /**
   * Create a new financial goal
   * @param {Object} goalData
   */
  async createGoal(goalData) {
    const payload = {
      title: (goalData.title || '').trim(),
      targetAmount: Number(goalData.targetAmount),
      currentAmount: goalData.currentAmount !== undefined ? Number(goalData.currentAmount) : 0,
      targetDate: goalData.targetDate,
      category: (goalData.category || 'General').trim(),
      priority: goalData.priority || 'medium',
      status: goalData.status || 'in_progress',
      monthlyTarget: goalData.monthlyTarget ? Number(goalData.monthlyTarget) : 0,
      notes: (goalData.notes || '').trim()
    };

    const response = await api.post('/goals', payload);
    return response;
  },

  /**
   * Update an existing financial goal
   * @param {string} id
   * @param {Object} goalData
   */
  async updateGoal(id, goalData) {
    const payload = {};
    if (goalData.title !== undefined) payload.title = goalData.title.trim();
    if (goalData.targetAmount !== undefined) payload.targetAmount = Number(goalData.targetAmount);
    if (goalData.currentAmount !== undefined) payload.currentAmount = Number(goalData.currentAmount);
    if (goalData.targetDate !== undefined) payload.targetDate = goalData.targetDate;
    if (goalData.category !== undefined) payload.category = goalData.category.trim();
    if (goalData.priority !== undefined) payload.priority = goalData.priority;
    if (goalData.status !== undefined) payload.status = goalData.status;
    if (goalData.monthlyTarget !== undefined) payload.monthlyTarget = Number(goalData.monthlyTarget);
    if (goalData.notes !== undefined) payload.notes = goalData.notes.trim();

    const response = await api.put(`/goals/${id}`, payload);
    return response;
  },

  /**
   * Delete an existing financial goal
   * @param {string} id
   */
  async deleteGoal(id) {
    const response = await api.delete(`/goals/${id}`);
    return response;
  }
};

export default goalService;
