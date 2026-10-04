import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import transactionService from '../../services/transactionService.js';

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async ({ isRefresh = false, isLoadMore = false } = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState().transactions;
      const { filters, pagination } = state;

      const targetPage = isLoadMore ? pagination.page + 1 : 1;

      const params = {
        page: targetPage,
        limit: pagination.limit || 15,
        type: filters.type,
        category: filters.category,
        source: filters.source,
        search: filters.search,
        sort: filters.sort,
      };

      const response = await transactionService.getTransactions(params);
      const items = Array.isArray(response?.data) ? response.data : [];
      const respPagination = response?.pagination || {
        page: targetPage,
        limit: 15,
        total: items.length,
        pages: 1,
      };
      const summary = response?.summary || {
        totalIncome: 0,
        totalExpense: 0,
        net: 0,
        stagedCount: 0,
      };

      return {
        items,
        pagination: respPagination,
        summary,
        isLoadMore,
        isRefresh,
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to load transactions. Please try again.'
      );
    }
  }
);

export const addNewTransaction = createAsyncThunk(
  'transactions/addNewTransaction',
  async (transactionData, { rejectWithValue }) => {
    try {
      const response = await transactionService.createTransaction(transactionData);
      return {
        transaction: response?.data || response,
        isDuplicate: Boolean(response?.isDuplicate),
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to create transaction. Please check your inputs.'
      );
    }
  }
);

export const editTransaction = createAsyncThunk(
  'transactions/editTransaction',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await transactionService.updateTransaction(id, data);
      return response?.data || response;
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to update transaction.'
      );
    }
  }
);

export const removeTransaction = createAsyncThunk(
  'transactions/removeTransaction',
  async (id, { rejectWithValue }) => {
    try {
      await transactionService.deleteTransaction(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Failed to delete transaction.'
      );
    }
  }
);

const initialState = {
  items: [],
  pagination: {
    page: 1,
    limit: 15,
    total: 0,
    pages: 1,
  },
  summary: {
    totalIncome: 0,
    totalExpense: 0,
    net: 0,
    stagedCount: 0,
  },
  filters: {
    type: 'All',
    category: 'All',
    source: 'All',
    search: '',
    sort: 'latest',
  },
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  hasMore: true,
  error: null,
  selectedTransaction: null,
  isAddModalOpen: false,
  isEditModalOpen: false,
  isDetailModalOpen: false,
  isDuplicateAlertOpen: false,
  duplicateWarningItem: null,
};

export const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.filters.search = action.payload;
    },
    setTypeFilter: (state, action) => {
      state.filters.type = action.payload;
    },
    setCategoryFilter: (state, action) => {
      state.filters.category = action.payload;
    },
    setSourceFilter: (state, action) => {
      state.filters.source = action.payload;
    },
    setSort: (state, action) => {
      state.filters.sort = action.payload;
    },
    resetFilters: (state) => {
      state.filters = {
        type: 'All',
        category: 'All',
        source: 'All',
        search: '',
        sort: 'latest',
      };
    },
    setSelectedTransaction: (state, action) => {
      state.selectedTransaction = action.payload;
    },
    openAddModal: (state) => {
      state.isAddModalOpen = true;
    },
    closeAddModal: (state) => {
      state.isAddModalOpen = false;
      state.isDuplicateAlertOpen = false;
      state.duplicateWarningItem = null;
    },
    openEditModal: (state, action) => {
      state.selectedTransaction = action.payload;
      state.isEditModalOpen = true;
    },
    closeEditModal: (state) => {
      state.isEditModalOpen = false;
    },
    openDetailModal: (state, action) => {
      state.selectedTransaction = action.payload;
      state.isDetailModalOpen = true;
    },
    closeDetailModal: (state) => {
      state.isDetailModalOpen = false;
      state.selectedTransaction = null;
    },
    dismissDuplicateAlert: (state) => {
      state.isDuplicateAlertOpen = false;
      state.duplicateWarningItem = null;
    },
    clearTransactionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTransactions
      .addCase(fetchTransactions.pending, (state, action) => {
        if (action.meta.arg?.isRefresh) {
          state.isRefreshing = true;
        } else if (action.meta.arg?.isLoadMore) {
          state.isLoadingMore = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.isLoadingMore = false;

        const { items, pagination, summary, isLoadMore } = action.payload;

        if (isLoadMore) {
          // Append and deduplicate items
          const existingIds = new Set(state.items.map((i) => i._id || i.id));
          const newUnique = items.filter((i) => !existingIds.has(i._id || i.id));
          state.items = [...state.items, ...newUnique];
        } else {
          state.items = items;
        }

        state.pagination = pagination;
        state.summary = summary;
        state.hasMore = pagination.page < pagination.pages;
        state.error = null;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.isLoadingMore = false;
        state.error = action.payload;
      })

      // addNewTransaction
      .addCase(addNewTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addNewTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        const { transaction, isDuplicate } = action.payload;

        if (transaction) {
          state.items = [transaction, ...state.items];
          state.pagination.total += 1;

          // Update summary totals
          if (transaction.type === 'income') {
            state.summary.totalIncome += Number(transaction.amount || 0);
          } else {
            state.summary.totalExpense += Number(transaction.amount || 0);
          }
          state.summary.net = state.summary.totalIncome - state.summary.totalExpense;
        }

        if (isDuplicate) {
          state.isDuplicateAlertOpen = true;
          state.duplicateWarningItem = transaction;
        }

        state.isAddModalOpen = false;
      })
      .addCase(addNewTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // editTransaction
      .addCase(editTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(editTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        const updated = action.payload;
        if (updated) {
          const index = state.items.findIndex(
            (i) => (i._id || i.id) === (updated._id || updated.id)
          );
          if (index !== -1) {
            state.items[index] = updated;
          }
          if (state.selectedTransaction && (state.selectedTransaction._id || state.selectedTransaction.id) === (updated._id || updated.id)) {
            state.selectedTransaction = updated;
          }
        }
        state.isEditModalOpen = false;
      })
      .addCase(editTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // removeTransaction
      .addCase(removeTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        const deletedId = action.payload;
        state.items = state.items.filter((i) => (i._id || i.id) !== deletedId);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        state.isDetailModalOpen = false;
        state.selectedTransaction = null;
      })
      .addCase(removeTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSearch,
  setTypeFilter,
  setCategoryFilter,
  setSourceFilter,
  setSort,
  resetFilters,
  setSelectedTransaction,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDetailModal,
  closeDetailModal,
  dismissDuplicateAlert,
  clearTransactionError,
} = transactionSlice.actions;

export default transactionSlice.reducer;
