import notificationReducer, {
  openPermissionModal,
  closePermissionModal,
  setConnectedState,
  clearNotificationError,
  addLocalDetectedEvent,
  checkNotificationPermission,
  fetchNotificationStats,
  ingestNotificationEvent,
  toggleNotificationService,
} from '../src/store/slices/notificationSlice.js';

describe('FinTrack Mobile - Notification Redux Slice Tests', () => {
  const initialState = {
    isConnected: false,
    isPermissionGranted: false,
    isEnabled: false,
    isListening: false,
    isLoading: false,
    stats: {
      totalEvents: 0,
      stagedCount: 0,
      confirmedCount: 0,
      ignoredCount: 0,
      duplicatesCount: 0,
      lastDetectedAt: null,
    },
    recentEvents: [],
    isPermissionModalOpen: false,
    error: null,
  };

  it('should return initial state by default', () => {
    expect(notificationReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('should handle synchronous modal and state actions', () => {
    let state = notificationReducer(initialState, openPermissionModal());
    expect(state.isPermissionModalOpen).toBe(true);

    state = notificationReducer(state, closePermissionModal());
    expect(state.isPermissionModalOpen).toBe(false);

    state = notificationReducer(state, setConnectedState(true));
    expect(state.isConnected).toBe(true);

    state = notificationReducer({ ...state, error: 'Err' }, clearNotificationError());
    expect(state.error).toBeNull();
  });

  it('should handle addLocalDetectedEvent by pushing to recentEvents and incrementing count', () => {
    const mockEvent = {
      merchant: 'Swiggy',
      amount: 480,
      type: 'expense',
      detectedAt: new Date().toISOString(),
    };

    const state = notificationReducer(initialState, addLocalDetectedEvent(mockEvent));
    expect(state.recentEvents).toHaveLength(1);
    expect(state.stats.totalEvents).toBe(1);
    expect(state.stats.lastDetectedAt).toBeDefined();
  });

  it('should handle checkNotificationPermission.fulfilled', () => {
    const state = notificationReducer(
      { ...initialState, isEnabled: true },
      checkNotificationPermission.fulfilled({ isGranted: true }, 'req_1')
    );

    expect(state.isPermissionGranted).toBe(true);
    expect(state.isConnected).toBe(true);
  });

  it('should handle fetchNotificationStats.fulfilled', () => {
    const mockStats = {
      totalEvents: 18,
      stagedCount: 10,
      confirmedCount: 8,
      duplicatesCount: 2,
    };

    const state = notificationReducer(
      initialState,
      fetchNotificationStats.fulfilled(mockStats, 'req_2')
    );

    expect(state.isLoading).toBe(false);
    expect(state.stats.totalEvents).toBe(18);
    expect(state.stats.stagedCount).toBe(10);
  });

  it('should handle ingestNotificationEvent.fulfilled by updating recentEvents and counters', () => {
    const mockEvent = {
      merchant: 'Amazon',
      amount: 1250,
      type: 'expense',
    };

    const state = notificationReducer(
      initialState,
      ingestNotificationEvent.fulfilled(
        { isValid: true, event: mockEvent, response: {} },
        'req_3',
        mockEvent
      )
    );

    expect(state.recentEvents).toHaveLength(1);
    expect(state.stats.totalEvents).toBe(1);
    expect(state.stats.stagedCount).toBe(1);
  });

  it('should handle ingestNotificationEvent.fulfilled with duplicate flag by incrementing duplicatesCount', () => {
    const mockEvent = {
      merchant: 'ABC Store',
      amount: 350,
      type: 'expense',
    };

    const state = notificationReducer(
      initialState,
      ingestNotificationEvent.fulfilled(
        { isValid: true, event: mockEvent, response: { isDuplicate: true } },
        'req_3_dupe',
        mockEvent
      )
    );

    expect(state.stats.totalEvents).toBe(1);
    expect(state.stats.stagedCount).toBe(1);
    expect(state.stats.duplicatesCount).toBe(1);
  });

  it('should handle toggleNotificationService.fulfilled with permission requirement', () => {
    const state = notificationReducer(
      initialState,
      toggleNotificationService.fulfilled(
        { enabled: false, requirePermission: true },
        'req_4',
        true
      )
    );

    expect(state.isEnabled).toBe(false);
    expect(state.isPermissionModalOpen).toBe(true);
  });
});
