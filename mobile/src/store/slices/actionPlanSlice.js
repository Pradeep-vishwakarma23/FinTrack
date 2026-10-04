import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import actionPlanService from '../../services/actionPlanService.js';

export const fetchActionPlans = createAsyncThunk(
  'actionPlans/fetchActionPlans',
  async ({ isRefresh = false, params = {} } = {}, { rejectWithValue }) => {
    try {
      const response = await actionPlanService.getActionPlans(params);
      const items = Array.isArray(response?.data) ? response.data : [];
      return {
        items,
        isRefresh
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to load financial action plans.'
      );
    }
  }
);

export const generateActionPlans = createAsyncThunk(
  'actionPlans/generateActionPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await actionPlanService.generateActionPlans();
      return response;
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to generate financial action plans.'
      );
    }
  }
);

export const completeActionPlan = createAsyncThunk(
  'actionPlans/completeActionPlan',
  async (id, { rejectWithValue }) => {
    try {
      const response = await actionPlanService.completeActionPlan(id);
      return response?.data || response;
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to mark action plan as completed.'
      );
    }
  }
);

export const dismissActionPlan = createAsyncThunk(
  'actionPlans/dismissActionPlan',
  async (id, { rejectWithValue }) => {
    try {
      const response = await actionPlanService.dismissActionPlan(id);
      return response?.data || response;
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to dismiss action plan.'
      );
    }
  }
);

export const createActionPlan = createAsyncThunk(
  'actionPlans/createActionPlan',
  async (planData, { rejectWithValue }) => {
    try {
      const response = await actionPlanService.createActionPlan(planData);
      return response?.data || response;
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to create action plan.'
      );
    }
  }
);

export const deleteActionPlan = createAsyncThunk(
  'actionPlans/deleteActionPlan',
  async (id, { rejectWithValue }) => {
    try {
      await actionPlanService.deleteActionPlan(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to delete action plan.'
      );
    }
  }
);

const initialState = {
  items: [],
  isLoading: false,
  isRefreshing: false,
  isGenerating: false,
  generateSummary: null, // { generatedCount, skippedCount, message }
  actionLoadingId: null,
  error: null,
  actionError: null,
  filterPriority: 'All', // 'All' | 'High' | 'Medium' | 'Low'
  filterStatus: 'Active'  // 'Active' | 'All' | 'Completed' | 'Dismissed'
};

export const actionPlanSlice = createSlice({
  name: 'actionPlans',
  initialState,
  reducers: {
    setFilterPriority: (state, action) => {
      state.filterPriority = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    clearActionPlanError: (state) => {
      state.error = null;
      state.actionError = null;
    },
    clearGenerateSummary: (state) => {
      state.generateSummary = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchActionPlans
      .addCase(fetchActionPlans.pending, (state, action) => {
        if (action.meta?.arg?.isRefresh) {
          state.isRefreshing = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchActionPlans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.items = action.payload.items;
        state.error = null;
      })
      .addCase(fetchActionPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload;
      })

      // generateActionPlans
      .addCase(generateActionPlans.pending, (state) => {
        state.isGenerating = true;
        state.actionError = null;
        state.generateSummary = null;
      })
      .addCase(generateActionPlans.fulfilled, (state, action) => {
        state.isGenerating = false;
        const generated = action.payload?.generated || [];
        const skipped = action.payload?.skippedDuplicates || [];
        state.generateSummary = {
          generatedCount: generated.length,
          skippedCount: skipped.length,
          message: action.payload?.message || `${generated.length} plans generated`
        };
        for (const plan of generated) {
          const exists = state.items.some((p) => (p._id || p.id) === (plan._id || plan.id));
          if (!exists) {
            state.items.unshift(plan);
          }
        }
      })
      .addCase(generateActionPlans.rejected, (state, action) => {
        state.isGenerating = false;
        state.actionError = action.payload;
      })

      // completeActionPlan
      .addCase(completeActionPlan.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg;
        state.actionError = null;
      })
      .addCase(completeActionPlan.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        const updated = action.payload;
        if (updated) {
          const index = state.items.findIndex(
            (p) => (p._id || p.id) === (updated._id || updated.id)
          );
          if (index !== -1) {
            state.items[index] = updated;
          }
        }
      })
      .addCase(completeActionPlan.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.actionError = action.payload;
      })

      // dismissActionPlan
      .addCase(dismissActionPlan.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg;
        state.actionError = null;
      })
      .addCase(dismissActionPlan.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        const updated = action.payload;
        if (updated) {
          const index = state.items.findIndex(
            (p) => (p._id || p.id) === (updated._id || updated.id)
          );
          if (index !== -1) {
            state.items[index] = updated;
          }
        }
      })
      .addCase(dismissActionPlan.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.actionError = action.payload;
      })

      // createActionPlan
      .addCase(createActionPlan.pending, (state) => {
        state.actionLoadingId = 'create';
        state.actionError = null;
      })
      .addCase(createActionPlan.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(createActionPlan.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.actionError = action.payload;
      })

      // deleteActionPlan
      .addCase(deleteActionPlan.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg;
        state.actionError = null;
      })
      .addCase(deleteActionPlan.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        const deletedId = action.payload;
        state.items = state.items.filter((p) => (p._id || p.id) !== deletedId);
      })
      .addCase(deleteActionPlan.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.actionError = action.payload;
      });
  }
});

export const {
  setFilterPriority,
  setFilterStatus,
  clearActionPlanError,
  clearGenerateSummary
} = actionPlanSlice.actions;

export default actionPlanSlice.reducer;
