import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as authService from '../../services/authService'

const getError = (error) =>
  error.response?.data?.message || error.message || 'Something went wrong'

const getStoredItem = (key) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key)
  }
  return null
}

const setStoredItem = (key, value) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value)
  }
}

const removeStoredItem = (key) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(key)
  }
}

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const response = await authService.login(data)
    return response.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

export const signupUser = createAsyncThunk('auth/signup', async (data, { rejectWithValue }) => {
  try {
    const response = await authService.signup(data)
    return response.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

export const refreshUser = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const response = await authService.getMe()
    return response.data.user
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

export const updateProfileThunk = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const response = await authService.updateProfile(data)
    return response.data.user || response.data.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

const parseStoredUser = () => {
  const storedUser = getStoredItem('user')
  if (!storedUser) return null
  try {
    return JSON.parse(storedUser)
  } catch (err) {
    removeStoredItem('user')
    return null
  }
}

const initialState = {
  user: parseStoredUser(),
  token: getStoredItem('token') || null,
  loading: false,
  error: '',
  isAuthenticated: !!getStoredItem('token')
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setUser: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      state.error = ''
      if (action.payload.token) setStoredItem('token', action.payload.token)
      if (action.payload.user) setStoredItem('user', JSON.stringify(action.payload.user))
    },
    updateUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
      setStoredItem('user', JSON.stringify(action.payload))
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = ''
      removeStoredItem('token')
      removeStoredItem('user')
    },
    clearError: (state) => {
      state.error = ''
    }
  },
  extraReducers: (builder) => {
    builder
      // loginUser
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = ''
        if (action.payload.token) setStoredItem('token', action.payload.token)
        if (action.payload.user) setStoredItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // signupUser
      .addCase(signupUser.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = ''
        if (action.payload.token) setStoredItem('token', action.payload.token)
        if (action.payload.user) setStoredItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // refreshUser
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        setStoredItem('user', JSON.stringify(action.payload))
      })
      .addCase(refreshUser.rejected, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        removeStoredItem('token')
        removeStoredItem('user')
      })
      // updateProfileThunk
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.user = action.payload
        setStoredItem('user', JSON.stringify(action.payload))
      })
  }
})

export const { setLoading, setUser, updateUser, logout, clearError } = authSlice.actions
export default authSlice.reducer