import API from './api'

export const getMonthlyReport = (paramsOrMonth) => {
  const params = typeof paramsOrMonth === 'string'
    ? { month: paramsOrMonth }
    : (paramsOrMonth || {})
  return API.get('/reports/monthly', { params })
}

export const downloadMonthlyReport = (paramsOrMonth) => {
  const params = typeof paramsOrMonth === 'string'
    ? { month: paramsOrMonth, format: 'pdf' }
    : { ...(paramsOrMonth || {}), format: 'pdf' }
  return API.get('/reports/monthly', {
    params,
    responseType: 'blob'
  })
}

export const downloadMonthlyReportPDF = (month) => {
  return API.get('/reports/monthly/pdf', {
    params: { month },
    responseType: 'blob'
  })
}

export default {
  getMonthlyReport,
  downloadMonthlyReport,
  downloadMonthlyReportPDF
}
