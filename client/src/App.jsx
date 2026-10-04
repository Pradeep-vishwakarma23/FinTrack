import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import './App.css'

// Pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budget from './pages/Budget'
import Insights from './pages/Insights'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Imports from './pages/Imports'
import Goals from './pages/Goals'

// Layout
import Layout from './components/layout/Layout'

// Redux
import { useDispatch, useSelector } from 'react-redux'
import { refreshUser } from './redux/slices/authSlice'

function ProtectedRoute() {
  const { isAuthenticated, token } = useSelector((state) => state.auth)
  const hasToken = isAuthenticated || !!token || !!localStorage.getItem('token')

  if (!hasToken) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function PublicRoute({ children }) {
  const { isAuthenticated, token } = useSelector((state) => state.auth)
  const hasToken = isAuthenticated || !!token || !!localStorage.getItem('token')

  if (hasToken) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      dispatch(refreshUser())
    }
  }, [dispatch])

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/imports" element={<Imports />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        {/* Catch-all Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App