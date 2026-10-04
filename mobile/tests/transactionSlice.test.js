import transactionReducer, {
  setSearch,
  setTypeFilter,
  setCategoryFilter,
  setSourceFilter,
  setSort,
  resetFilters,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDetailModal,
  closeDetailModal,
  dismissDuplicateAlert,
  fetchTransactions,
  addNewTransaction,
  editTransaction,
  removeTransaction,
} from '../src/store/slices/transactionSlice.js';

describe('FinTrack Mobile - Transaction Slice & Ledger State', () => {
  const initialTestState = {
    items: [],
    pagination: { page: 1, limit: 15, total: 0, pages: 1 },
    summary: { totalIncome: 0, totalExpense: 0, net: 0, stagedCount: 0 },
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

  it('should return default initial state', () => {
    const state = transactionReducer(undefined, { type: 'UNKNOWN_ACTION' });
    expect(state.items).toEqual([]);
    expect(state.filters.type).toBe('All');
    expect(state.filters.sort).toBe('latest');
    expect(state.isAddModalOpen).toBe(false);
  });

  it('should update filters and sort options', () => {
    let state = transactionReducer(initialTestState, setTypeFilter('expense'));
    expect(state.filters.type).toBe('expense');

    state = transactionReducer(state, setCategoryFilter('Food'));
    expect(state.filters.category).toBe('Food');

    state = transactionReducer(state, setSourceFilter('sms'));
    expect(state.filters.source).toBe('sms');

    state = transactionReducer(state, setSort('amount_desc'));
    expect(state.filters.sort).toBe('amount_desc');

    state = transactionReducer(state, setSearch('Swiggy'));
    expect(state.filters.search).toBe('Swiggy');

    // Reset filters
    state = transactionReducer(state, resetFilters());
    expect(state.filters.type).toBe('All');
    expect(state.filters.category).toBe('All');
    expect(state.filters.source).toBe('All');
    expect(state.filters.search).toBe('');
    expect(state.filters.sort).toBe('latest');
  });

  it('should handle modal visibility actions', () => {
    let state = transactionReducer(initialTestState, openAddModal());
    expect(state.isAddModalOpen).toBe(true);

    state = transactionReducer(state, closeAddModal());
    expect(state.isAddModalOpen).toBe(false);

    const mockTx = { id: 'tx_123', title: 'Swiggy', amount: 480 };
    state = transactionReducer(state, openDetailModal(mockTx));
    expect(state.isDetailModalOpen).toBe(true);
    expect(state.selectedTransaction).toEqual(mockTx);

    state = transactionReducer(state, closeDetailModal());
    expect(state.isDetailModalOpen).toBe(false);
    expect(state.selectedTransaction).toBeNull();
  });

  describe('fetchTransactions Reducer Handling', () => {
    it('should set items and pagination on initial fetch fulfilled', () => {
      const mockItems = [
        { _id: '1', title: 'Swiggy', amount: 480, type: 'expense' },
        { _id: '2', title: 'Salary', amount: 50000, type: 'income' },
      ];
      const payload = {
        items: mockItems,
        pagination: { page: 1, limit: 15, total: 2, pages: 1 },
        summary: { totalIncome: 50000, totalExpense: 480, net: 49520, stagedCount: 1 },
        isLoadMore: false,
        isRefresh: false,
      };

      const state = transactionReducer(initialTestState, {
        type: fetchTransactions.fulfilled.type,
        payload,
      });

      expect(state.items.length).toBe(2);
      expect(state.pagination.total).toBe(2);
      expect(state.summary.net).toBe(49520);
      expect(state.summary.stagedCount).toBe(1);
      expect(state.hasMore).toBe(false);
    });

    it('should append and deduplicate items on isLoadMore', () => {
      const existingState = {
        ...initialTestState,
        items: [{ _id: '1', title: 'Item 1' }],
        pagination: { page: 1, limit: 10, total: 20, pages: 2 },
      };

      const payload = {
        items: [
          { _id: '1', title: 'Item 1 (duplicate)' },
          { _id: '2', title: 'Item 2 (new)' },
        ],
        pagination: { page: 2, limit: 10, total: 20, pages: 2 },
        summary: { totalIncome: 0, totalExpense: 0, net: 0, stagedCount: 0 },
        isLoadMore: true,
      };

      const state = transactionReducer(existingState, {
        type: fetchTransactions.fulfilled.type,
        payload,
      });

      expect(state.items.length).toBe(2);
      expect(state.items[1]._id).toBe('2');
    });
  });

  describe('CRUD Operations Reducer Handling', () => {
    it('should prepend new transaction on addNewTransaction.fulfilled and update summary', () => {
      const newTx = { _id: 'new_1', title: 'Amazon', amount: 1200, type: 'expense' };
      const state = transactionReducer(initialTestState, {
        type: addNewTransaction.fulfilled.type,
        payload: { transaction: newTx, isDuplicate: false },
      });

      expect(state.items.length).toBe(1);
      expect(state.items[0].title).toBe('Amazon');
      expect(state.summary.totalExpense).toBe(1200);
      expect(state.summary.net).toBe(-1200);
    });

    it('should trigger duplicate warning alert on duplicate manual entry', () => {
      const dupTx = { _id: 'dup_1', title: 'Swiggy', amount: 480, isDuplicate: true };
      const state = transactionReducer(initialTestState, {
        type: addNewTransaction.fulfilled.type,
        payload: { transaction: dupTx, isDuplicate: true },
      });

      expect(state.isDuplicateAlertOpen).toBe(true);
      expect(state.duplicateWarningItem).toEqual(dupTx);
    });

    it('should update existing transaction on editTransaction.fulfilled', () => {
      const existingState = {
        ...initialTestState,
        items: [{ _id: 'tx_1', title: 'Old Title', amount: 100 }],
      };

      const updatedTx = { _id: 'tx_1', title: 'Updated Title', amount: 250 };
      const state = transactionReducer(existingState, {
        type: editTransaction.fulfilled.type,
        payload: updatedTx,
      });

      expect(state.items[0].title).toBe('Updated Title');
      expect(state.items[0].amount).toBe(250);
      expect(state.isEditModalOpen).toBe(false);
    });

    it('should remove transaction on removeTransaction.fulfilled', () => {
      const existingState = {
        ...initialTestState,
        items: [
          { _id: 'tx_1', title: 'Keep' },
          { _id: 'tx_2', title: 'Delete' },
        ],
        pagination: { page: 1, limit: 15, total: 2, pages: 1 },
      };

      const state = transactionReducer(existingState, {
        type: removeTransaction.fulfilled.type,
        payload: 'tx_2',
      });

      expect(state.items.length).toBe(1);
      expect(state.items[0]._id).toBe('tx_1');
      expect(state.pagination.total).toBe(1);
    });
  });
});
