import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import transactionReducer from './slices/transactionSlice'
import budgetReducer from './slices/budgetSlice'
import insightReducer from './slices/insightSlice'
import importReducer from './slices/importSlice'
import copilotReducer from './slices/copilotSlice'
import goalReducer from './slices/goalSlice'
import actionPlanReducer from './slices/actionPlanSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionReducer,
    budget: budgetReducer,
    insights: insightReducer,
    imports: importReducer,
    copilot: copilotReducer,
    goals: goalReducer,
    actionPlans: actionPlanReducer
  }
})

export default store
