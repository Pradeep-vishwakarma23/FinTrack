import API from './api';

export const uploadCSV = (formData) =>
  API.post('/imports/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const uploadExcel = (formData) =>
  API.post('/imports/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const ingestSMS = (payload, isFormData = false) => {
  if (isFormData) {
    return API.post('/imports/sms', payload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return API.post('/imports/sms', payload);
};

export const getImportBatches = () => API.get('/imports');

export const getImportBatchById = (id) => API.get(`/imports/${id}`);

export const getStagedTransactions = (batchId) => API.get(`/imports/${batchId}/transactions`);

export const updateStagedTransaction = (id, data) => API.patch(`/imports/transactions/${id}`, data);

export const confirmTransaction = (id) => API.post(`/imports/transactions/${id}/confirm`);

export const ignoreTransaction = (id) => API.post(`/imports/transactions/${id}/ignore`);

export const confirmAllBatch = (batchId) => API.post(`/imports/${batchId}/confirm-all`);

export const deleteImportBatch = (batchId) => API.delete(`/imports/${batchId}`);
