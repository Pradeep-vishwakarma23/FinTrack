import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import importService from '../../services/importService.js';
import { fetchDashboardData } from './dashboardSlice.js';
import { fetchTransactions } from './transactionSlice.js';

// 1. Fetch historical import batches
export const fetchImportBatches = createAsyncThunk(
  'imports/fetchBatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await importService.getImportBatches();
      return response.data || [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch import history');
    }
  }
);

// 2. Fetch staged transactions awaiting review
export const fetchStagedTransactions = createAsyncThunk(
  'imports/fetchStagedTransactions',
  async (batchId = 'all', { rejectWithValue }) => {
    try {
      const response = await importService.getStagedTransactions(batchId);
      return { batchId, transactions: response.data || [] };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch staged transactions');
    }
  }
);

// 3. Upload CSV file
export const uploadCSVFile = createAsyncThunk(
  'imports/uploadCSV',
  async (fileData, { dispatch, rejectWithValue }) => {
    try {
      const response = await importService.uploadCSV(fileData);
      // Refresh batches & staged transactions
      dispatch(fetchImportBatches());
      dispatch(fetchStagedTransactions('all'));
      dispatch(fetchDashboardData({ isRefresh: true }));
      return response;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to upload and parse CSV file');
    }
  }
);

// 4. Upload Excel file
export const uploadExcelFile = createAsyncThunk(
  'imports/uploadExcel',
  async (fileData, { dispatch, rejectWithValue }) => {
    try {
      const response = await importService.uploadExcel(fileData);
      dispatch(fetchImportBatches());
      dispatch(fetchStagedTransactions('all'));
      dispatch(fetchDashboardData({ isRefresh: true }));
      return response;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to upload and parse Excel file');
    }
  }
);

// 5. Ingest SMS text / messages array
export const ingestSMSMessages = createAsyncThunk(
  'imports/ingestSMS',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const response = await importService.ingestSMS(payload);
      dispatch(fetchImportBatches());
      dispatch(fetchStagedTransactions('all'));
      dispatch(fetchDashboardData({ isRefresh: true }));
      return response;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to process SMS messages');
    }
  }
);

// 6. Confirm single staged transaction
export const confirmStagedTransaction = createAsyncThunk(
  'imports/confirmTransaction',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await importService.confirmTransaction(id);
      // Synchronize confirmed ledger and dashboard totals
      dispatch(fetchDashboardData({ isRefresh: true }));
      dispatch(fetchTransactions({ isRefresh: true }));
      return { id, data: response.data };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to confirm transaction');
    }
  }
);

// 7. Ignore staged transaction
export const ignoreStagedTransaction = createAsyncThunk(
  'imports/ignoreTransaction',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await importService.ignoreTransaction(id);
      dispatch(fetchDashboardData({ isRefresh: true }));
      return { id, data: response.data };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to ignore transaction');
    }
  }
);

// 8. Update and confirm staged transaction
export const updateAndConfirmStaged = createAsyncThunk(
  'imports/updateAndConfirm',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      await importService.updateStagedTransaction(id, data);
      const confirmRes = await importService.confirmTransaction(id);
      dispatch(fetchDashboardData({ isRefresh: true }));
      dispatch(fetchTransactions({ isRefresh: true }));
      return { id, data: confirmRes.data };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update and confirm transaction');
    }
  }
);

// 9. Bulk confirm all staged transactions in batch or all
export const confirmAllStagedTransactions = createAsyncThunk(
  'imports/confirmAll',
  async (batchId = 'all', { dispatch, rejectWithValue }) => {
    try {
      const response = await importService.confirmAllBatch(batchId);
      dispatch(fetchImportBatches());
      dispatch(fetchDashboardData({ isRefresh: true }));
      dispatch(fetchTransactions({ isRefresh: true }));
      return { batchId, response };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to bulk confirm transactions');
    }
  }
);

// 10. Delete import batch
export const deleteBatch = createAsyncThunk(
  'imports/deleteBatch',
  async (batchId, { dispatch, rejectWithValue }) => {
    try {
      const response = await importService.deleteImportBatch(batchId);
      dispatch(fetchStagedTransactions('all'));
      dispatch(fetchDashboardData({ isRefresh: true }));
      return { batchId, response };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete import batch');
    }
  }
);

const initialState = {
  batches: [],
  stagedTransactions: [],
  pendingCount: 0,
  selectedBatchId: 'all',
  selectedTransaction: null,
  isEditModalOpen: false,
  isSMSPasteModalOpen: false,
  isLoadingBatches: false,
  isLoadingStaged: false,
  isUploading: false,
  uploadStage: 'idle', // 'idle' | 'uploading' | 'parsing' | 'completed' | 'error'
  isReviewing: false,
  lastImportResult: null,
  error: null,
  uploadError: null,
};

export const importSlice = createSlice({
  name: 'imports',
  initialState,
  reducers: {
    setSelectedBatchId: (state, action) => {
      state.selectedBatchId = action.payload;
    },
    openEditModal: (state, action) => {
      state.selectedTransaction = action.payload;
      state.isEditModalOpen = true;
    },
    closeEditModal: (state) => {
      state.isEditModalOpen = false;
      state.selectedTransaction = null;
    },
    openSMSPasteModal: (state) => {
      state.isSMSPasteModalOpen = true;
    },
    closeSMSPasteModal: (state) => {
      state.isSMSPasteModalOpen = false;
    },
    clearImportError: (state) => {
      state.error = null;
      state.uploadError = null;
    },
    clearLastImportResult: (state) => {
      state.lastImportResult = null;
      state.uploadStage = 'idle';
    },
    resetUploadStage: (state) => {
      state.uploadStage = 'idle';
      state.uploadError = null;
    },
    setUploadStage: (state, action) => {
      state.uploadStage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Batches
      .addCase(fetchImportBatches.pending, (state) => {
        state.isLoadingBatches = true;
        state.error = null;
      })
      .addCase(fetchImportBatches.fulfilled, (state, action) => {
        state.isLoadingBatches = false;
        state.batches = action.payload;
      })
      .addCase(fetchImportBatches.rejected, (state, action) => {
        state.isLoadingBatches = false;
        state.error = action.payload;
      })

      // Fetch Staged Transactions
      .addCase(fetchStagedTransactions.pending, (state) => {
        state.isLoadingStaged = true;
        state.error = null;
      })
      .addCase(fetchStagedTransactions.fulfilled, (state, action) => {
        state.isLoadingStaged = false;
        state.stagedTransactions = action.payload.transactions;
        state.pendingCount = action.payload.transactions.length;
      })
      .addCase(fetchStagedTransactions.rejected, (state, action) => {
        state.isLoadingStaged = false;
        state.error = action.payload;
      })

      // Upload CSV
      .addCase(uploadCSVFile.pending, (state) => {
        state.isUploading = true;
        state.uploadStage = 'uploading';
        state.uploadError = null;
      })
      .addCase(uploadCSVFile.fulfilled, (state, action) => {
        state.isUploading = false;
        state.uploadStage = 'completed';
        state.lastImportResult = action.payload;
      })
      .addCase(uploadCSVFile.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadStage = 'error';
        state.uploadError = action.payload;
      })

      // Upload Excel
      .addCase(uploadExcelFile.pending, (state) => {
        state.isUploading = true;
        state.uploadStage = 'uploading';
        state.uploadError = null;
      })
      .addCase(uploadExcelFile.fulfilled, (state, action) => {
        state.isUploading = false;
        state.uploadStage = 'completed';
        state.lastImportResult = action.payload;
      })
      .addCase(uploadExcelFile.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadStage = 'error';
        state.uploadError = action.payload;
      })

      // Ingest SMS
      .addCase(ingestSMSMessages.pending, (state) => {
        state.isUploading = true;
        state.uploadStage = 'uploading';
        state.uploadError = null;
      })
      .addCase(ingestSMSMessages.fulfilled, (state, action) => {
        state.isUploading = false;
        state.uploadStage = 'completed';
        state.lastImportResult = action.payload;
        state.isSMSPasteModalOpen = false;
      })
      .addCase(ingestSMSMessages.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadStage = 'error';
        state.uploadError = action.payload;
      })

      // Confirm Transaction
      .addCase(confirmStagedTransaction.pending, (state) => {
        state.isReviewing = true;
      })
      .addCase(confirmStagedTransaction.fulfilled, (state, action) => {
        state.isReviewing = false;
        state.stagedTransactions = state.stagedTransactions.filter(
          (t) => (t._id || t.id) !== action.payload.id
        );
        state.pendingCount = Math.max(0, state.pendingCount - 1);
      })
      .addCase(confirmStagedTransaction.rejected, (state, action) => {
        state.isReviewing = false;
        state.error = action.payload;
      })

      // Ignore Transaction
      .addCase(ignoreStagedTransaction.pending, (state) => {
        state.isReviewing = true;
      })
      .addCase(ignoreStagedTransaction.fulfilled, (state, action) => {
        state.isReviewing = false;
        state.stagedTransactions = state.stagedTransactions.filter(
          (t) => (t._id || t.id) !== action.payload.id
        );
        state.pendingCount = Math.max(0, state.pendingCount - 1);
      })
      .addCase(ignoreStagedTransaction.rejected, (state, action) => {
        state.isReviewing = false;
        state.error = action.payload;
      })

      // Update and Confirm
      .addCase(updateAndConfirmStaged.pending, (state) => {
        state.isReviewing = true;
      })
      .addCase(updateAndConfirmStaged.fulfilled, (state, action) => {
        state.isReviewing = false;
        state.isEditModalOpen = false;
        state.selectedTransaction = null;
        state.stagedTransactions = state.stagedTransactions.filter(
          (t) => (t._id || t.id) !== action.payload.id
        );
        state.pendingCount = Math.max(0, state.pendingCount - 1);
      })
      .addCase(updateAndConfirmStaged.rejected, (state, action) => {
        state.isReviewing = false;
        state.error = action.payload;
      })

      // Confirm All
      .addCase(confirmAllStagedTransactions.pending, (state) => {
        state.isReviewing = true;
      })
      .addCase(confirmAllStagedTransactions.fulfilled, (state, action) => {
        state.isReviewing = false;
        if (action.payload.batchId === 'all') {
          state.stagedTransactions = [];
          state.pendingCount = 0;
        } else {
          state.stagedTransactions = state.stagedTransactions.filter(
            (t) => String(t.importBatchId) !== String(action.payload.batchId)
          );
          state.pendingCount = state.stagedTransactions.length;
        }
      })
      .addCase(confirmAllStagedTransactions.rejected, (state, action) => {
        state.isReviewing = false;
        state.error = action.payload;
      })

      // Delete Batch
      .addCase(deleteBatch.fulfilled, (state, action) => {
        state.batches = state.batches.filter(
          (b) => (b._id || b.id) !== action.payload.batchId
        );
        state.stagedTransactions = state.stagedTransactions.filter(
          (t) => String(t.importBatchId) !== String(action.payload.batchId)
        );
        state.pendingCount = state.stagedTransactions.length;
      });
  },
});

export const {
  setSelectedBatchId,
  openEditModal,
  closeEditModal,
  openSMSPasteModal,
  closeSMSPasteModal,
  clearImportError,
  clearLastImportResult,
  resetUploadStage,
  setUploadStage,
} = importSlice.actions;

export default importSlice.reducer;
