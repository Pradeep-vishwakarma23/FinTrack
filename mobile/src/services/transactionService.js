import api from './api.js';

/**
 * Transaction API Service for FinTrack Mobile
 * Reuses existing backend endpoints:
 * - GET /api/transactions (with search, category, type, source, sort, pagination)
 * - POST /api/transactions (manual transaction entry with duplicate detection)
 * - PUT /api/transactions/:id (update existing transaction)
 * - DELETE /api/transactions/:id (delete existing transaction)
 */
export const transactionService = {
  /**
   * Fetch paginated list of confirmed transactions
   */
  async getTransactions(params = {}) {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.category && params.category !== 'All') queryParams.append('category', params.category);
    if (params.type && params.type !== 'All') queryParams.append('type', params.type);
    if (params.source && params.source !== 'All') queryParams.append('source', params.source);
    if (params.search && params.search.trim()) queryParams.append('search', params.search.trim());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const url = queryString ? `/transactions?${queryString}` : '/transactions';

    const response = await api.get(url);
    return response;
  },

  /**
   * Create a new transaction manually
   */
  async createTransaction(transactionData) {
    const response = await api.post('/transactions', {
      type: transactionData.type || 'expense',
      title: (transactionData.title || transactionData.merchant || '').trim(),
      merchant: (transactionData.merchant || transactionData.title || '').trim(),
      amount: Number(transactionData.amount),
      category: (transactionData.category || 'Other').trim(),
      paymentMethod: transactionData.paymentMethod || 'card',
      description: (transactionData.description || '').trim(),
      transactionDate: transactionData.transactionDate || new Date().toISOString(),
      source: transactionData.source || 'manual',
    });
    return response;
  },

  /**
   * Update an existing transaction
   */
  async updateTransaction(id, transactionData) {
    const payload = {};
    if (transactionData.type) payload.type = transactionData.type;
    if (transactionData.title) payload.title = transactionData.title.trim();
    if (transactionData.merchant) payload.merchant = transactionData.merchant.trim();
    if (transactionData.amount !== undefined) payload.amount = Number(transactionData.amount);
    if (transactionData.category) payload.category = transactionData.category.trim();
    if (transactionData.paymentMethod) payload.paymentMethod = transactionData.paymentMethod;
    if (transactionData.description !== undefined) payload.description = transactionData.description.trim();
    if (transactionData.transactionDate) payload.transactionDate = transactionData.transactionDate;

    const response = await api.put(`/transactions/${id}`, payload);
    return response;
  },

  /**
   * Delete an existing transaction
   */
  async deleteTransaction(id) {
    const response = await api.delete(`/transactions/${id}`);
    return response;
  }
};

export default transactionService;
