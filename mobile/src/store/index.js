import { configureStore } from '@reduxjs/toolkit';
import authReducer, { sessionExpired } from './slices/authSlice.js';
import dashboardReducer from './slices/dashboardSlice.js';
import transactionReducer from './slices/transactionSlice.js';
import importReducer from './slices/importSlice.js';
import notificationReducer from './slices/notificationSlice.js';
import intelligenceReducer from './slices/intelligenceSlice.js';
import goalReducer from './slices/goalSlice.js';
import copilotReducer from './slices/copilotSlice.js';
import actionPlanReducer from './slices/actionPlanSlice.js';
import { setOnUnauthorizedCallback } from '../services/api.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    transactions: transactionReducer,
    imports: importReducer,
    notifications: notificationReducer,
    intelligence: intelligenceReducer,
    goals: goalReducer,
    copilot: copilotReducer,
    actionPlans: actionPlanReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/restoreSession/fulfilled'],
      },
    }),
});

// Register unauthorized 401 callback to dispatch logout/sessionExpired
setOnUnauthorizedCallback(() => {
  store.dispatch(sessionExpired());
});

export default store;
