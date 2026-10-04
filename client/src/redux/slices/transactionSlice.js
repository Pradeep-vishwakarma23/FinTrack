import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as transactionService from '../../services/transactionService'

const getError = (error) =>
  error.response?.data?.message || error.message || 'Something went wrong'

export const fetchTransactions = createAsyncThunk('transactions/fetch', async (params, { rejectWithValue }) => {
  try {
    const response = await transactionService.getTransactions(params)
    return response.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

export const saveTransaction = createAsyncThunk('transactions/save', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = id
      ? await transactionService.updateTransaction(id, data)
      : await transactionService.createTransaction(data)
    return response.data.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

export const removeTransactionById = createAsyncThunk('transactions/delete', async (id, { rejectWithValue }) => {
  try {
    await transactionService.deleteTransaction(id)
    return id
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

const initialState = {
  transactions: [],
  pagination: { page: 1, limit: 10, total: 0, pages: 1 },
  loading: false,
  error: '',
  filters: {
    search: '',
    type: 'all',
    category: 'all',
    sort: 'latest',
    page: 1
  },
  selectedTransaction: null
}

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setTransactions: (state, action) => {
      state.transactions = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setSelectedTransaction: (state, action) => {
      state.selectedTransaction = action.payload
    },
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload)
    },
    updateTransaction: (state, action) => {
      const idx = state.transactions.findIndex((t) => t._id === action.payload._id)
      if (idx !== -1) {
        state.transactions[idx] = action.payload
      }
    },
    removeTransaction: (state, action) => {
      state.transactions = state.transactions.filter((t) => t._id !== action.payload)
    },
    clearTransactionError: (state) => {
      state.error = ''
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchTransactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false
        state.transactions = action.payload.data || []
        state.pagination = action.payload.pagination || state.pagination
        state.error = ''
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // saveTransaction
      .addCase(saveTransaction.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(saveTransaction.fulfilled, (state, action) => {
        state.loading = false
        state.error = ''
        const saved = action.payload
        if (saved && saved._id) {
          const idx = state.transactions.findIndex((t) => t._id === saved._id)
          if (idx !== -1) {
            state.transactions[idx] = saved
          } else {
            state.transactions.unshift(saved)
          }
        }
      })
      .addCase(saveTransaction.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // removeTransactionById
      .addCase(removeTransactionById.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter((t) => t._id !== action.payload)
      })
  }
})

export const {
  setTransactions,
  setLoading,
  setFilters,
  setSelectedTransaction,
  addTransaction,
  updateTransaction,
  removeTransaction,
  clearTransactionError
} = transactionSlice.actions

export default transactionSlice.reducer