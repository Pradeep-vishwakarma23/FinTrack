import { describe, it, expect } from 'vitest'
import store from '../redux/store'
import { setUser, logout } from '../redux/slices/authSlice'
import { addTransaction, setFilters, removeTransaction } from '../redux/slices/transactionSlice'
import { setBudget, updateRemaining } from '../redux/slices/budgetSlice'
import { setInsights, setPredictions } from '../redux/slices/insightSlice'

describe('Redux Store and Slice Reducers', () => {
  it('initializes store with all slices registered', () => {
    const state = store.getState()
    expect(state).toHaveProperty('auth')
    expect(state).toHaveProperty('transactions')
    expect(state).toHaveProperty('budget')
    expect(state).toHaveProperty('insights')
    expect(state).toHaveProperty('imports')
    expect(state).toHaveProperty('copilot')
    expect(state).toHaveProperty('goals')
  })

  it('handles authSlice setUser and logout actions', () => {
    store.dispatch(
      setUser({
        user: { id: 'u1', name: 'Test User', email: 'test@example.com' },
        token: 'sample_token_xyz'
      })
    )
    let state = store.getState().auth
    expect(state.isAuthenticated).toBe(true)
    expect(state.user.name).toBe('Test User')

    store.dispatch(logout())
    state = store.getState().auth
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
  })

  it('handles transactionSlice addTransaction and removeTransaction actions', () => {
    const sampleTx = {
      _id: 'tx101',
      title: 'Groceries',
      amount: 2500,
      type: 'expense',
      category: 'Food'
    }

    store.dispatch(addTransaction(sampleTx))
    let state = store.getState().transactions
    expect(state.transactions).toContainEqual(sampleTx)

    store.dispatch(setFilters({ category: 'Food' }))
    state = store.getState().transactions
    expect(state.filters.category).toBe('Food')

    store.dispatch(removeTransaction('tx101'))
    state = store.getState().transactions
    expect(state.transactions.find((t) => t._id === 'tx101')).toBeUndefined()
  })

  it('handles budgetSlice setBudget and updateRemaining actions', () => {
    store.dispatch(
      setBudget({
        monthlyBudget: 40000,
        categoryBudgets: [{ category: 'Food', limit: 8000 }],
        remaining: 15000
      })
    )
    let state = store.getState().budget
    expect(state.monthlyBudget).toBe(40000)
    expect(state.categories).toHaveLength(1)
    expect(state.remaining).toBe(15000)

    store.dispatch(updateRemaining(12000))
    state = store.getState().budget
    expect(state.remaining).toBe(12000)
  })

  it('handles insightSlice setInsights and setPredictions actions', () => {
    store.dispatch(setInsights(['Insight 1', 'Insight 2']))
    store.dispatch(setPredictions({ predictedExpense: 20000, confidence: 85, budgetRisk: false }))

    const state = store.getState().insights
    expect(state.insights).toHaveLength(2)
    expect(state.predictions.predictedExpense).toBe(20000)
    expect(state.predictions.confidence).toBe(85)
  })
})
