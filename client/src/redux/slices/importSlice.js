import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as importService from '../../services/importService';

const getError = (error) =>
  error.response?.data?.message || error.message || 'Something went wrong';

export const fetchBatches = createAsyncThunk('imports/fetchBatches', async (_, { rejectWithValue }) => {
  try {
    const response = await importService.getImportBatches();
    return response.data.data || [];
  } catch (error) {
    return rejectWithValue(getError(error));
  }
});

export const uploadFile = createAsyncThunk('imports/uploadFile', async ({ type, file }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response =
      type === 'excel'
        ? await importService.uploadExcel(formData)
        : await importService.uploadCSV(formData);

    return response.data;
  } catch (error) {
    return rejectWithValue(getError(error));
  }
});

export const importSMS = createAsyncThunk(
  'imports/importSMS',
  async ({ payload, isFormData = false }, { rejectWithValue }) => {
    try {
      const response = await importService.ingestSMS(payload, isFormData);
      return response.data;
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

export const fetchStagedTransactions = createAsyncThunk(
  'imports/fetchStaged',
  async (batchId, { rejectWithValue }) => {
    try {
      const response = await importService.getStagedTransactions(batchId);
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

export const confirmStagedTransaction = createAsyncThunk(
  'imports/confirmTransaction',
  async (id, { rejectWithValue }) => {
    try {
      const response = await importService.confirmTransaction(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

export const ignoreStagedTransaction = createAsyncThunk(
  'imports/ignoreTransaction',
  async (id, { rejectWithValue }) => {
    try {
      const response = await importService.ignoreTransaction(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

export const editStagedTransaction = createAsyncThunk(
  'imports/editTransaction',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await importService.updateStagedTransaction(id, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

export const confirmAllStaged = createAsyncThunk(
  'imports/confirmAll',
  async (batchId, { rejectWithValue }) => {
    try {
      const response = await importService.confirmAllBatch(batchId);
      return { batchId, ...response.data };
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

export const removeBatch = createAsyncThunk(
  'imports/deleteBatch',
  async (batchId, { rejectWithValue }) => {
    try {
      await importService.deleteImportBatch(batchId);
      return batchId;
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

const initialState = {
  batches: [],
  currentBatch: null,
  stagedTransactions: [],
  loading: false,
  uploading: false,
  error: '',
  successMessage: ''
};

const importSlice = createSlice({
  name: 'imports',
  initialState,
  reducers: {
    setCurrentBatch: (state, action) => {
      state.currentBatch = action.payload;
    },
    clearImportState: (state) => {
      state.error = '';
      state.successMessage = '';
    },
    setStagedTransactions: (state, action) => {
      state.stagedTransactions = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchBatches
      .addCase(fetchBatches.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.loading = false;
        state.batches = action.payload;
      })
      .addCase(fetchBatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // uploadFile
      .addCase(uploadFile.pending, (state) => {
        state.uploading = true;
        state.error = '';
        state.successMessage = '';
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.uploading = false;
        if (action.payload.batch) {
          state.batches.unshift(action.payload.batch);
          state.currentBatch = action.payload.batch;
        }
        state.successMessage = action.payload.message || 'File uploaded and staged successfully!';
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })
      // importSMS
      .addCase(importSMS.pending, (state) => {
        state.uploading = true;
        state.error = '';
        state.successMessage = '';
      })
      .addCase(importSMS.fulfilled, (state, action) => {
        state.uploading = false;
        if (action.payload.batch) {
          state.batches.unshift(action.payload.batch);
          state.currentBatch = action.payload.batch;
        }
        state.successMessage = action.payload.message || 'SMS messages parsed and staged successfully!';
      })
      .addCase(importSMS.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })
      // fetchStagedTransactions
      .addCase(fetchStagedTransactions.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchStagedTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.stagedTransactions = action.payload;
      })
      .addCase(fetchStagedTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // confirmStagedTransaction
      .addCase(confirmStagedTransaction.fulfilled, (state, action) => {
        const confirmed = action.payload;
        if (confirmed) {
          const idx = state.stagedTransactions.findIndex((t) => t._id === confirmed._id);
          if (idx !== -1) {
            state.stagedTransactions[idx] = confirmed;
          }
        }
      })
      // ignoreStagedTransaction
      .addCase(ignoreStagedTransaction.fulfilled, (state, action) => {
        const ignored = action.payload;
        if (ignored) {
          const idx = state.stagedTransactions.findIndex((t) => t._id === ignored._id);
          if (idx !== -1) {
            state.stagedTransactions[idx] = ignored;
          }
        }
      })
      // editStagedTransaction
      .addCase(editStagedTransaction.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const idx = state.stagedTransactions.findIndex((t) => t._id === updated._id);
          if (idx !== -1) {
            state.stagedTransactions[idx] = updated;
          }
        }
      })
      // confirmAllStaged
      .addCase(confirmAllStaged.fulfilled, (state, action) => {
        state.stagedTransactions = state.stagedTransactions.map((t) => ({
          ...t,
          status: 'confirmed',
          confidence: 1.0
        }));
        if (state.currentBatch && state.currentBatch._id === action.payload.batchId) {
          state.currentBatch.status = 'COMPLETED';
        }
        state.successMessage = action.payload.message || 'All staged transactions confirmed!';
      })
      // removeBatch
      .addCase(removeBatch.fulfilled, (state, action) => {
        state.batches = state.batches.filter((b) => b._id !== action.payload);
        if (state.currentBatch && state.currentBatch._id === action.payload) {
          state.currentBatch = null;
          state.stagedTransactions = [];
        }
      });
  }
});

export const { setCurrentBatch, clearImportState, setStagedTransactions } = importSlice.actions;
export default importSlice.reducer;
