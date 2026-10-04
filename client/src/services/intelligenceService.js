import API from './api'

export const intelligenceService = {
  getSummary: (month) => API.get('/intelligence/summary', { params: month ? { month } : {} }),
  getMerchants: (month, limit = 10) => API.get('/intelligence/merchants', { params: { ...(month ? { month } : {}), limit } }),
  getAnomalies: (month) => API.get('/intelligence/anomalies', { params: month ? { month } : {} }),
  getForecast: (month) => API.get('/intelligence/forecast', { params: month ? { month } : {} }),
  getSubscriptions: () => API.get('/intelligence/subscriptions'),
  getTrends: (range = '6m', referenceMonth = null) =>
    API.get('/intelligence/trends', { params: { range, ...(referenceMonth ? { referenceMonth } : {}) } })
}

export default intelligenceService
