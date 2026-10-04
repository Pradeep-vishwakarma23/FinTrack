import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import goalService from '../../services/goalService.js';

export const fetchGoals = createAsyncThunk(
  'goals/fetchGoals',
  async ({ isRefresh = false } = {}, { rejectWithValue }) => {
    try {
      const response = await goalService.getGoals();
      const items = Array.isArray(response?.data) ? response.data : [];
      return {
        items,
        isRefresh
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to load financial goals. Please try again.'
      );
    }
  }
);

export const createGoal = createAsyncThunk(
  'goals/createGoal',
  async (goalData, { rejectWithValue }) => {
    try {
      const response = await goalService.createGoal(goalData);
      return response?.data || response;
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to create financial goal. Please check your inputs.'
      );
    }
  }
);

export const updateGoal = createAsyncThunk(
  'goals/updateGoal',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await goalService.updateGoal(id, data);
      return response?.data || response;
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to update financial goal.'
      );
    }
  }
);

export const deleteGoal = createAsyncThunk(
  'goals/deleteGoal',
  async (id, { rejectWithValue }) => {
    try {
      await goalService.deleteGoal(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to delete financial goal.'
      );
    }
  }
);

const initialState = {
  items: [],
  isLoading: false,
  isRefreshing: false,
  actionLoading: false,
  error: null,
  actionError: null,
  filterStatus: 'All', // 'All' | 'Active' | 'Completed' | 'Paused' | 'Cancelled'
  selectedGoal: null,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDetailModalOpen: false
};

export const goalSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    openCreateModal: (state) => {
      state.isCreateModalOpen = true;
      state.actionError = null;
    },
    closeCreateModal: (state) => {
      state.isCreateModalOpen = false;
      state.actionError = null;
    },
    openEditModal: (state, action) => {
      state.selectedGoal = action.payload;
      state.isEditModalOpen = true;
      state.actionError = null;
    },
    closeEditModal: (state) => {
      state.isEditModalOpen = false;
      state.selectedGoal = null;
      state.actionError = null;
    },
    openDetailModal: (state, action) => {
      state.selectedGoal = action.payload;
      state.isDetailModalOpen = true;
    },
    closeDetailModal: (state) => {
      state.isDetailModalOpen = false;
      state.selectedGoal = null;
    },
    clearGoalError: (state) => {
      state.error = null;
      state.actionError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchGoals
      .addCase(fetchGoals.pending, (state, action) => {
        if (action.meta?.arg?.isRefresh) {
          state.isRefreshing = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.items = action.payload.items;
        state.error = null;
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload;
      })

      // createGoal
      .addCase(createGoal.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createGoal.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionError = null;
        state.isCreateModalOpen = false;
        const newGoal = action.payload;
        if (newGoal) {
          state.items = [...state.items, newGoal].sort(
            (a, b) => new Date(a.targetDate) - new Date(b.targetDate)
          );
        }
      })
      .addCase(createGoal.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // updateGoal
      .addCase(updateGoal.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateGoal.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionError = null;
        state.isEditModalOpen = false;
        const updated = action.payload;
        if (updated) {
          const index = state.items.findIndex(
            (g) => (g._id || g.id) === (updated._id || updated.id)
          );
          if (index !== -1) {
            state.items[index] = updated;
          }
          if (
            state.selectedGoal &&
            (state.selectedGoal._id || state.selectedGoal.id) === (updated._id || updated.id)
          ) {
            state.selectedGoal = updated;
          }
          state.items.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
        }
      })
      .addCase(updateGoal.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // deleteGoal
      .addCase(deleteGoal.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionError = null;
        const deletedId = action.payload;
        state.items = state.items.filter(
          (g) => (g._id || g.id) !== deletedId
        );
        state.isDetailModalOpen = false;
        state.selectedGoal = null;
      })
      .addCase(deleteGoal.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  }
});

export const {
  setFilterStatus,
  openCreateModal,
  closeCreateModal,
  openEditModal,
  closeEditModal,
  openDetailModal,
  closeDetailModal,
  clearGoalError
} = goalSlice.actions;

export default goalSlice.reducer;
