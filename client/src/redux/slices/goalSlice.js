import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import goalService from '../../services/goalService'

const getError = (error) =>
  error.response?.data?.message || error.message || 'Something went wrong with goals.'

/**
 * Fetches all financial goals for the authenticated user.
 */
export const fetchGoals = createAsyncThunk(
  'goals/fetchGoals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await goalService.getGoals()
      return response.data || []
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

/**
 * Creates a new financial goal.
 */
export const createGoal = createAsyncThunk(
  'goals/createGoal',
  async (goalData, { rejectWithValue }) => {
    try {
      const response = await goalService.createGoal(goalData)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

/**
 * Updates an existing financial goal.
 */
export const updateGoal = createAsyncThunk(
  'goals/updateGoal',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await goalService.updateGoal(id, data)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

/**
 * Deletes a financial goal.
 */
export const deleteGoal = createAsyncThunk(
  'goals/deleteGoal',
  async (id, { rejectWithValue }) => {
    try {
      await goalService.deleteGoal(id)
      return id
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

const initialState = {
  goals: [],
  loading: false,
  error: '',
  actionLoading: false,
  actionError: '',
  isModalOpen: false,
  modalMode: 'create', // 'create' | 'edit'
  selectedGoal: null,
  filterStatus: 'all' // 'all' | 'in_progress' | 'completed' | 'paused' | 'cancelled'
}

const goalSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    openCreateModal: (state) => {
      state.isModalOpen = true
      state.modalMode = 'create'
      state.selectedGoal = null
      state.actionError = ''
    },
    openEditModal: (state, action) => {
      state.isModalOpen = true
      state.modalMode = 'edit'
      state.selectedGoal = action.payload
      state.actionError = ''
    },
    closeModal: (state) => {
      state.isModalOpen = false
      state.selectedGoal = null
      state.actionError = ''
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload
    },
    clearGoalError: (state) => {
      state.error = ''
      state.actionError = ''
    }
  },
  extraReducers: (builder) => {
    // fetchGoals
    builder
      .addCase(fetchGoals.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.loading = false
        state.goals = action.payload
        state.error = ''
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch financial goals.'
      })

    // createGoal
    builder
      .addCase(createGoal.pending, (state) => {
        state.actionLoading = true
        state.actionError = ''
      })
      .addCase(createGoal.fulfilled, (state, action) => {
        state.actionLoading = false
        state.actionError = ''
        state.isModalOpen = false
        state.selectedGoal = null
        // Add to list and sort by targetDate
        state.goals.push(action.payload)
        state.goals.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))
      })
      .addCase(createGoal.rejected, (state, action) => {
        state.actionLoading = false
        state.actionError = action.payload || 'Failed to create goal.'
      })

    // updateGoal
    builder
      .addCase(updateGoal.pending, (state) => {
        state.actionLoading = true
        state.actionError = ''
      })
      .addCase(updateGoal.fulfilled, (state, action) => {
        state.actionLoading = false
        state.actionError = ''
        state.isModalOpen = false
        state.selectedGoal = null
        const updated = action.payload
        const index = state.goals.findIndex((g) => g._id === updated._id)
        if (index !== -1) {
          state.goals[index] = updated
        }
        state.goals.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))
      })
      .addCase(updateGoal.rejected, (state, action) => {
        state.actionLoading = false
        state.actionError = action.payload || 'Failed to update goal.'
      })

    // deleteGoal
    builder
      .addCase(deleteGoal.pending, (state) => {
        state.actionLoading = true
        state.actionError = ''
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.actionLoading = false
        state.actionError = ''
        const deletedId = action.payload
        state.goals = state.goals.filter((g) => g._id !== deletedId)
      })
      .addCase(deleteGoal.rejected, (state, action) => {
        state.actionLoading = false
        state.actionError = action.payload || 'Failed to delete goal.'
      })
  }
})

export const {
  openCreateModal,
  openEditModal,
  closeModal,
  setFilterStatus,
  clearGoalError
} = goalSlice.actions

export default goalSlice.reducer
