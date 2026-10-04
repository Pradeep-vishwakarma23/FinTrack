import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import actionPlanService from '../../services/actionPlanService'

const getError = (error) =>
  error.response?.data?.message || error.message || 'Something went wrong with action plans.'

/**
 * Fetches all action plans for the user.
 */
export const fetchActionPlans = createAsyncThunk(
  'actionPlans/fetchActionPlans',
  async (params, { rejectWithValue }) => {
    try {
      const response = await actionPlanService.getActionPlans(params)
      return response.data || []
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

/**
 * Generates deterministic action plans based on verified financial intelligence.
 */
export const generateActionPlans = createAsyncThunk(
  'actionPlans/generateActionPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await actionPlanService.generateActionPlans()
      return response
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

/**
 * Manually creates an action plan.
 */
export const createActionPlan = createAsyncThunk(
  'actionPlans/createActionPlan',
  async (planData, { rejectWithValue }) => {
    try {
      const response = await actionPlanService.createActionPlan(planData)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

/**
 * Marks an action plan as COMPLETED.
 */
export const completeActionPlan = createAsyncThunk(
  'actionPlans/completeActionPlan',
  async (id, { rejectWithValue }) => {
    try {
      const response = await actionPlanService.completeActionPlan(id)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

/**
 * Marks an action plan as DISMISSED.
 */
export const dismissActionPlan = createAsyncThunk(
  'actionPlans/dismissActionPlan',
  async (id, { rejectWithValue }) => {
    try {
      const response = await actionPlanService.dismissActionPlan(id)
      return response.data
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

/**
 * Deletes an action plan.
 */
export const deleteActionPlan = createAsyncThunk(
  'actionPlans/deleteActionPlan',
  async (id, { rejectWithValue }) => {
    try {
      await actionPlanService.deleteActionPlan(id)
      return id
    } catch (error) {
      return rejectWithValue(getError(error))
    }
  }
)

const initialState = {
  plans: [],
  loading: false,
  error: '',
  generating: false,
  generateSummary: null, // { generatedCount, skippedCount, message }
  actionLoadingId: null,
  actionError: '',
  filterPriority: 'ALL', // 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'
  filterStatus: 'ACTIVE'  // 'ACTIVE' | 'ALL' | 'COMPLETED' | 'DISMISSED'
}

const actionPlanSlice = createSlice({
  name: 'actionPlans',
  initialState,
  reducers: {
    setFilterPriority: (state, action) => {
      state.filterPriority = action.payload
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload
    },
    clearActionPlanError: (state) => {
      state.error = ''
      state.actionError = ''
    },
    clearGenerateSummary: (state) => {
      state.generateSummary = null
    }
  },
  extraReducers: (builder) => {
    // fetchActionPlans
    builder
      .addCase(fetchActionPlans.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchActionPlans.fulfilled, (state, action) => {
        state.loading = false
        state.plans = action.payload
        state.error = ''
      })
      .addCase(fetchActionPlans.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch action plans.'
      })

    // generateActionPlans
    builder
      .addCase(generateActionPlans.pending, (state) => {
        state.generating = true
        state.actionError = ''
        state.generateSummary = null
      })
      .addCase(generateActionPlans.fulfilled, (state, action) => {
        state.generating = false
        const generated = action.payload?.generated || []
        const skipped = action.payload?.skippedDuplicates || []
        state.generateSummary = {
          generatedCount: generated.length,
          skippedCount: skipped.length,
          message: action.payload?.message || `${generated.length} actions generated`
        }
        // Prepend newly generated plans if not already present
        for (const plan of generated) {
          const exists = state.plans.some((p) => p._id === plan._id)
          if (!exists) {
            state.plans.unshift(plan)
          }
        }
      })
      .addCase(generateActionPlans.rejected, (state, action) => {
        state.generating = false
        state.actionError = action.payload || 'Failed to generate action plans.'
      })

    // createActionPlan
    builder
      .addCase(createActionPlan.pending, (state) => {
        state.actionLoadingId = 'create'
        state.actionError = ''
      })
      .addCase(createActionPlan.fulfilled, (state, action) => {
        state.actionLoadingId = null
        if (action.payload) {
          state.plans.unshift(action.payload)
        }
      })
      .addCase(createActionPlan.rejected, (state, action) => {
        state.actionLoadingId = null
        state.actionError = action.payload || 'Failed to create action plan.'
      })

    // completeActionPlan
    builder
      .addCase(completeActionPlan.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg
        state.actionError = ''
      })
      .addCase(completeActionPlan.fulfilled, (state, action) => {
        state.actionLoadingId = null
        const updated = action.payload
        if (updated) {
          const index = state.plans.findIndex((p) => p._id === updated._id)
          if (index !== -1) {
            state.plans[index] = updated
          }
        }
      })
      .addCase(completeActionPlan.rejected, (state, action) => {
        state.actionLoadingId = null
        state.actionError = action.payload || 'Failed to complete action plan.'
      })

    // dismissActionPlan
    builder
      .addCase(dismissActionPlan.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg
        state.actionError = ''
      })
      .addCase(dismissActionPlan.fulfilled, (state, action) => {
        state.actionLoadingId = null
        const updated = action.payload
        if (updated) {
          const index = state.plans.findIndex((p) => p._id === updated._id)
          if (index !== -1) {
            state.plans[index] = updated
          }
        }
      })
      .addCase(dismissActionPlan.rejected, (state, action) => {
        state.actionLoadingId = null
        state.actionError = action.payload || 'Failed to dismiss action plan.'
      })

    // deleteActionPlan
    builder
      .addCase(deleteActionPlan.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg
        state.actionError = ''
      })
      .addCase(deleteActionPlan.fulfilled, (state, action) => {
        state.actionLoadingId = null
        const deletedId = action.payload
        state.plans = state.plans.filter((p) => p._id !== deletedId)
      })
      .addCase(deleteActionPlan.rejected, (state, action) => {
        state.actionLoadingId = null
        state.actionError = action.payload || 'Failed to delete action plan.'
      })
  }
})

export const {
  setFilterPriority,
  setFilterStatus,
  clearActionPlanError,
  clearGenerateSummary
} = actionPlanSlice.actions

export default actionPlanSlice.reducer
