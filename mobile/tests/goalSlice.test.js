import goalReducer, {
  setFilterStatus,
  openCreateModal,
  closeCreateModal,
  openEditModal,
  closeEditModal,
  openDetailModal,
  closeDetailModal,
  clearGoalError,
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from '../src/store/slices/goalSlice.js';

describe('FinTrack Mobile - Goal Slice Redux', () => {
  const initialState = {
    items: [],
    isLoading: false,
    isRefreshing: false,
    actionLoading: false,
    error: null,
    actionError: null,
    filterStatus: 'All',
    selectedGoal: null,
    isCreateModalOpen: false,
    isEditModalOpen: false,
    isDetailModalOpen: false,
  };

  it('1. should return initial state by default', () => {
    const state = goalReducer(undefined, { type: 'UNKNOWN_ACTION' });
    expect(state.items).toEqual([]);
    expect(state.filterStatus).toBe('All');
    expect(state.isLoading).toBe(false);
  });

  it('2. should handle filter and modal open/close reducers', () => {
    let state = goalReducer(initialState, setFilterStatus('Active'));
    expect(state.filterStatus).toBe('Active');

    state = goalReducer(state, openCreateModal());
    expect(state.isCreateModalOpen).toBe(true);

    state = goalReducer(state, closeCreateModal());
    expect(state.isCreateModalOpen).toBe(false);

    const mockGoal = { _id: 'g_1', title: 'Vacation' };
    state = goalReducer(state, openEditModal(mockGoal));
    expect(state.isEditModalOpen).toBe(true);
    expect(state.selectedGoal).toEqual(mockGoal);

    state = goalReducer(state, closeEditModal());
    expect(state.isEditModalOpen).toBe(false);
    expect(state.selectedGoal).toBeNull();

    state = goalReducer(state, openDetailModal(mockGoal));
    expect(state.isDetailModalOpen).toBe(true);
    expect(state.selectedGoal).toEqual(mockGoal);

    state = goalReducer(state, closeDetailModal());
    expect(state.isDetailModalOpen).toBe(false);
    expect(state.selectedGoal).toBeNull();
  });

  it('3. should handle clearGoalError', () => {
    const stateWithError = {
      ...initialState,
      error: 'Failed to load',
      actionError: 'Validation failed',
    };
    const state = goalReducer(stateWithError, clearGoalError());
    expect(state.error).toBeNull();
    expect(state.actionError).toBeNull();
  });

  it('4. should handle fetchGoals pending, fulfilled, and rejected', () => {
    // Pending (initial load)
    let state = goalReducer(initialState, { type: fetchGoals.pending.type });
    expect(state.isLoading).toBe(true);
    expect(state.isRefreshing).toBe(false);

    // Pending (refresh)
    state = goalReducer(initialState, {
      type: fetchGoals.pending.type,
      meta: { arg: { isRefresh: true } },
    });
    expect(state.isLoading).toBe(false);
    expect(state.isRefreshing).toBe(true);

    // Fulfilled
    const mockGoals = [
      { _id: 'g_1', title: 'Car Fund', targetAmount: 200000 },
      { _id: 'g_2', title: 'Emergency Fund', targetAmount: 50000 },
    ];
    state = goalReducer(state, {
      type: fetchGoals.fulfilled.type,
      payload: { items: mockGoals, isRefresh: true },
    });
    expect(state.isLoading).toBe(false);
    expect(state.isRefreshing).toBe(false);
    expect(state.items).toEqual(mockGoals);

    // Rejected
    state = goalReducer(initialState, {
      type: fetchGoals.rejected.type,
      payload: 'Network Error',
    });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Network Error');
  });

  it('5. should handle createGoal lifecycle', () => {
    const existingGoals = [
      { _id: 'g_1', title: 'Laptop', targetDate: '2027-10-01' },
    ];
    let state = { ...initialState, items: existingGoals, isCreateModalOpen: true };

    // Pending
    state = goalReducer(state, { type: createGoal.pending.type });
    expect(state.actionLoading).toBe(true);
    expect(state.actionError).toBeNull();

    // Fulfilled
    const newGoal = { _id: 'g_2', title: 'New Trip', targetDate: '2027-04-01' };
    state = goalReducer(state, {
      type: createGoal.fulfilled.type,
      payload: newGoal,
    });
    expect(state.actionLoading).toBe(false);
    expect(state.isCreateModalOpen).toBe(false);
    expect(state.items).toHaveLength(2);
    // Should be sorted by targetDate ascending: 2027-04-01 before 2027-10-01
    expect(state.items[0]._id).toBe('g_2');

    // Rejected
    state = goalReducer(state, {
      type: createGoal.rejected.type,
      payload: 'Target amount must be at least ₹1.',
    });
    expect(state.actionLoading).toBe(false);
    expect(state.actionError).toBe('Target amount must be at least ₹1.');
  });

  it('6. should handle updateGoal lifecycle', () => {
    const existingGoals = [
      { _id: 'g_1', title: 'Emergency Fund', currentAmount: 10000, targetDate: '2027-06-01' },
    ];
    let state = {
      ...initialState,
      items: existingGoals,
      isEditModalOpen: true,
      selectedGoal: existingGoals[0],
    };

    // Pending
    state = goalReducer(state, { type: updateGoal.pending.type });
    expect(state.actionLoading).toBe(true);

    // Fulfilled
    const updatedGoal = {
      _id: 'g_1',
      title: 'Emergency Fund',
      currentAmount: 20000,
      targetDate: '2027-06-01',
    };
    state = goalReducer(state, {
      type: updateGoal.fulfilled.type,
      payload: updatedGoal,
    });
    expect(state.actionLoading).toBe(false);
    expect(state.isEditModalOpen).toBe(false);
    expect(state.items[0].currentAmount).toBe(20000);
    expect(state.selectedGoal.currentAmount).toBe(20000);

    // Rejected
    state = goalReducer(state, {
      type: updateGoal.rejected.type,
      payload: 'Update failed',
    });
    expect(state.actionLoading).toBe(false);
    expect(state.actionError).toBe('Update failed');
  });

  it('7. should handle deleteGoal lifecycle', () => {
    const existingGoals = [
      { _id: 'g_1', title: 'Goal 1' },
      { _id: 'g_2', title: 'Goal 2' },
    ];
    let state = {
      ...initialState,
      items: existingGoals,
      isDetailModalOpen: true,
      selectedGoal: existingGoals[0],
    };

    // Pending
    state = goalReducer(state, { type: deleteGoal.pending.type });
    expect(state.actionLoading).toBe(true);

    // Fulfilled
    state = goalReducer(state, {
      type: deleteGoal.fulfilled.type,
      payload: 'g_1',
    });
    expect(state.actionLoading).toBe(false);
    expect(state.items).toHaveLength(1);
    expect(state.items[0]._id).toBe('g_2');
    expect(state.isDetailModalOpen).toBe(false);
    expect(state.selectedGoal).toBeNull();

    // Rejected
    state = goalReducer(state, {
      type: deleteGoal.rejected.type,
      payload: 'Delete failed',
    });
    expect(state.actionLoading).toBe(false);
    expect(state.actionError).toBe('Delete failed');
  });
});
