import api from './api.js';

/**
 * Mobile Import Service
 * Connects React Native to FinTrack's ingestion infrastructure:
 * - CSV statements
 * - Excel spreadsheets (.xlsx, .xls)
 * - SMS / text messages
 * - Staged transaction review pipeline
 */

/**
 * Upload CSV file for parsing and staging
 * @param {FormData|Object} fileData - FormData with file or file object
 */
export const uploadCSV = async (fileData) => {
  let payload = fileData;
  if (!(fileData instanceof FormData) && fileData?.uri) {
    const formData = new FormData();
    formData.append('file', {
      uri: fileData.uri,
      name: fileData.name || 'statement.csv',
      type: fileData.mimeType || 'text/csv',
    });
    payload = formData;
  }

  return api.post('/imports/csv', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Upload Excel spreadsheet (.xlsx / .xls) for parsing and staging
 * @param {FormData|Object} fileData - FormData with file or file object
 */
export const uploadExcel = async (fileData) => {
  let payload = fileData;
  if (!(fileData instanceof FormData) && fileData?.uri) {
    const formData = new FormData();
    formData.append('file', {
      uri: fileData.uri,
      name: fileData.name || 'statement.xlsx',
      type: fileData.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    payload = formData;
  }

  return api.post('/imports/excel', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Ingest raw SMS messages or message dataset
 * @param {Object|FormData} payload - { messages: string[] } or { text: string } or FormData
 * @param {boolean} isFormData - Flag if multipart upload
 */
export const ingestSMS = async (payload, isFormData = false) => {
  if (isFormData || payload instanceof FormData) {
    return api.post('/imports/sms', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
  return api.post('/imports/sms', payload);
};

/**
 * Retrieve all historical import batches for the authenticated user
 */
export const getImportBatches = async () => {
  return api.get('/imports');
};

/**
 * Retrieve details of a specific import batch
 * @param {string} id - ImportBatch ID
 */
export const getImportBatchById = async (id) => {
  return api.get(`/imports/${id}`);
};

/**
 * Retrieve staged transactions awaiting verification
 * @param {string} batchId - Batch ID or 'all' for all staged transactions
 */
export const getStagedTransactions = async (batchId = 'all') => {
  return api.get(`/imports/${batchId}/transactions`);
};

/**
 * Update a staged transaction's details prior to confirmation
 * @param {string} id - Transaction ID
 * @param {Object} data - Updated fields (title, merchant, amount, category, type, etc.)
 */
export const updateStagedTransaction = async (id, data) => {
  return api.patch(`/imports/transactions/${id}`, data);
};

/**
 * Confirm a single staged transaction and commit to primary ledger
 * @param {string} id - Transaction ID
 */
export const confirmTransaction = async (id) => {
  return api.post(`/imports/transactions/${id}/confirm`);
};

/**
 * Mark a staged transaction as ignored
 * @param {string} id - Transaction ID
 */
export const ignoreTransaction = async (id) => {
  return api.post(`/imports/transactions/${id}/ignore`);
};

/**
 * Bulk confirm all staged transactions in a batch or across all batches
 * @param {string} batchId - Batch ID or 'all'
 */
export const confirmAllBatch = async (batchId = 'all') => {
  return api.post(`/imports/${batchId}/confirm-all`);
};

/**
 * Delete an import batch and discard all unconfirmed staged transactions
 * @param {string} batchId - Batch ID
 */
export const deleteImportBatch = async (batchId) => {
  return api.delete(`/imports/${batchId}`);
};

export default {
  uploadCSV,
  uploadExcel,
  ingestSMS,
  getImportBatches,
  getImportBatchById,
  getStagedTransactions,
  updateStagedTransaction,
  confirmTransaction,
  ignoreTransaction,
  confirmAllBatch,
  deleteImportBatch,
};
