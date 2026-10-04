import API from './api'

export const getDashboardSummary = (month) =>
  API.get('/dashboard/summary', { params: month ? { month } : {} })
