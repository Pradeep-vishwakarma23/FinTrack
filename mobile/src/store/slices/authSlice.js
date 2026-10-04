import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService.js';
import { setApiBaseUrl, getApiBaseUrl } from '../../services/api.js';

// Restore stored credentials on app startup
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const session = await authService.restoreSession();
      if (!session) {
        return { isAuthenticated: false, user: null, token: null };
      }
      return {
        isAuthenticated: true,
        user: session.user,
        token: session.token,
        isOffline: Boolean(session.isOffline)
      };
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to restore session');
    }
  }
);

// Log in with email & password
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password);
      return {
        user: response.user,
        token: response.token,
        message: response.message
      };
    } catch (error) {
      return rejectWithValue(error?.message || 'Login failed. Please check your credentials.');
    }
  }
);

// Sign up a new user
export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.signup(name, email, password);
      return {
        user: response.user,
        token: response.token,
        message: response.message
      };
    } catch (error) {
      return rejectWithValue(error?.message || 'Signup failed. Please try again.');
    }
  }
);

// Fetch current user profile
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getMe();
      return response.user;
    } catch (error) {
      return rejectWithValue(error?.message || 'Failed to fetch user profile');
    }
  }
);

// Log out user
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    await authService.logout();
    return true;
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isRestoringSession: true,
  error: null,
  successMessage: null,
  isOffline: false,
  apiBaseUrl: getApiBaseUrl(),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    setApiUrl: (state, action) => {
      state.apiBaseUrl = action.payload;
      setApiBaseUrl(action.payload);
    },
    sessionExpired: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.isRestoringSession = false;
      state.error = 'Your session has expired. Please log in again.';
    }
  },
  extraReducers: (builder) => {
    builder
      // restoreSession
      .addCase(restoreSession.pending, (state) => {
        state.isRestoringSession = true;
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isRestoringSession = false;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isOffline = Boolean(action.payload.isOffline);
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.isRestoringSession = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })

      // loginUser
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

      // signupUser
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

      // fetchUserProfile
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })

      // logoutUser
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.successMessage = null;
      });
  }
});

export const { clearError, setApiUrl, sessionExpired } = authSlice.actions;
export default authSlice.reducer;
