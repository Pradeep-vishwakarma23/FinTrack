import authReducer, {
  clearError,
  setApiUrl,
  sessionExpired,
  loginUser,
  signupUser,
  logoutUser,
  restoreSession,
} from '../src/store/slices/authSlice.js';

describe('FinTrack Mobile - Redux Auth Slice', () => {
  const initialTestState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    isRestoringSession: true,
    error: null,
    successMessage: null,
    isOffline: false,
    apiBaseUrl: 'http://localhost:5000/api',
  };

  it('should return initial state by default', () => {
    const state = authReducer(undefined, { type: 'UNKNOWN_ACTION' });
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isRestoringSession).toBe(true);
  });

  it('should clear errors with clearError', () => {
    const stateWithError = {
      ...initialTestState,
      error: 'Invalid credentials',
      successMessage: 'Success',
    };
    const nextState = authReducer(stateWithError, clearError());
    expect(nextState.error).toBeNull();
    expect(nextState.successMessage).toBeNull();
  });

  it('should update apiBaseUrl with setApiUrl', () => {
    const nextState = authReducer(initialTestState, setApiUrl('http://192.168.1.100:5000/api'));
    expect(nextState.apiBaseUrl).toBe('http://192.168.1.100:5000/api');
  });

  it('should handle sessionExpired by resetting auth and setting session expired message', () => {
    const activeState = {
      ...initialTestState,
      user: { id: 'u1', name: 'Alex' },
      token: 'jwt_sample_token',
      isAuthenticated: true,
    };
    const nextState = authReducer(activeState, sessionExpired());
    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.user).toBeNull();
    expect(nextState.token).toBeNull();
    expect(nextState.error).toContain('session has expired');
  });

  it('should handle loginUser.pending, fulfilled, and rejected', () => {
    // Pending
    let state = authReducer(initialTestState, { type: loginUser.pending.type });
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();

    // Fulfilled
    const userPayload = {
      user: { id: 'u123', name: 'Alex Sharma', email: 'alex@example.com' },
      token: 'mock_jwt_token_123',
      message: 'Logged in successfully',
    };
    state = authReducer(state, {
      type: loginUser.fulfilled.type,
      payload: userPayload,
    });
    expect(state.isLoading).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.name).toBe('Alex Sharma');
    expect(state.token).toBe('mock_jwt_token_123');
    expect(state.successMessage).toBe('Logged in successfully');

    // Rejected
    state = authReducer(state, {
      type: loginUser.rejected.type,
      payload: 'Invalid email or password',
    });
    expect(state.isLoading).toBe(false);
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('Invalid email or password');
  });

  it('should handle signupUser.fulfilled', () => {
    const userPayload = {
      user: { id: 'u456', name: 'New User', email: 'new@example.com' },
      token: 'mock_jwt_token_456',
      message: 'Account created successfully',
    };
    const state = authReducer(initialTestState, {
      type: signupUser.fulfilled.type,
      payload: userPayload,
    });
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.email).toBe('new@example.com');
    expect(state.token).toBe('mock_jwt_token_456');
  });

  it('should handle logoutUser.fulfilled', () => {
    const loggedInState = {
      ...initialTestState,
      user: { id: 'u123', name: 'Alex' },
      token: 'jwt_token',
      isAuthenticated: true,
    };
    const state = authReducer(loggedInState, {
      type: logoutUser.fulfilled.type,
    });
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('should handle restoreSession.fulfilled with valid session', () => {
    const sessionPayload = {
      isAuthenticated: true,
      user: { id: 'u123', name: 'Restored User' },
      token: 'valid_token',
      isOffline: false,
    };
    const state = authReducer(initialTestState, {
      type: restoreSession.fulfilled.type,
      payload: sessionPayload,
    });
    expect(state.isRestoringSession).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.name).toBe('Restored User');
  });

  it('should handle restoreSession.fulfilled with no session', () => {
    const sessionPayload = {
      isAuthenticated: false,
      user: null,
      token: null,
      isOffline: false,
    };
    const state = authReducer(initialTestState, {
      type: restoreSession.fulfilled.type,
      payload: sessionPayload,
    });
    expect(state.isRestoringSession).toBe(false);
    expect(state.isAuthenticated).toBe(false);
  });
});
