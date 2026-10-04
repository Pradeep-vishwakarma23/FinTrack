import { describe, it, expect, beforeEach, vi } from 'vitest'
import store from '../redux/store'
import {
  openCreateModal,
  openEditModal,
  closeModal,
  setFilterStatus,
  clearGoalError,
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal
} from '../redux/slices/goalSlice'
import API from '../services/api'

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

describe('Phase 6.4.5 Redux Store Goal Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    store.dispatch(closeModal())
    store.dispatch(clearGoalError())
    store.dispatch(setFilterStatus('all'))
  })

  it('1. Initializes Redux store with goals slice', () => {
    const state = store.getState().goals
    expect(state).toBeDefined()
    expect(state).toHaveProperty('goals')
    expect(state).toHaveProperty('loading')
    expect(state).toHaveProperty('isModalOpen')
    expect(state).toHaveProperty('modalMode')
    expect(state).toHaveProperty('filterStatus')
  })

  it('2. Handles modal open, edit, and close actions in live store', () => {
    store.dispatch(openCreateModal())
    expect(store.getState().goals.isModalOpen).toBe(true)
    expect(store.getState().goals.modalMode).toBe('create')

    const mockGoal = { _id: 'g_100', title: 'Vacation Fund', targetAmount: 75000 }
    store.dispatch(openEditModal(mockGoal))
    expect(store.getState().goals.isModalOpen).toBe(true)
    expect(store.getState().goals.modalMode).toBe('edit')
    expect(store.getState().goals.selectedGoal).toEqual(mockGoal)

    store.dispatch(closeModal())
    expect(store.getState().goals.isModalOpen).toBe(false)
    expect(store.getState().goals.selectedGoal).toBeNull()
  })

  it('3. Executes fetchGoals thunk and enriches store with deterministic calculations', async () => {
    const mockGoals = [
      {
        _id: 'g_1',
        title: 'Emergency Fund',
        targetAmount: 50000,
        currentAmount: 15000,
        remainingAmount: 35000,
        progressPercentage: 30,
        monthsRemaining: 7,
        requiredMonthlySavings: 5000,
        feasibility: {
          status: 'HIGHLY_FEASIBLE',
          score: 100,
          message: 'Current net monthly savings fully cover required monthly contribution.'
        },
        status: 'in_progress',
        targetDate: '2027-04-01T00:00:00.000Z'
      }
    ]
    API.get.mockResolvedValueOnce({ data: { success: true, data: mockGoals } })

    await store.dispatch(fetchGoals())

    const state = store.getState().goals
    expect(state.loading).toBe(false)
    expect(state.goals).toHaveLength(1)
    expect(state.goals[0].title).toBe('Emergency Fund')
    expect(state.goals[0].feasibility.status).toBe('HIGHLY_FEASIBLE')
    expect(state.goals[0].remainingAmount).toBe(35000)
    expect(state.goals[0].requiredMonthlySavings).toBe(5000)
  })

  it('4. Executes createGoal thunk and appends new goal to store', async () => {
    const newGoalPayload = {
      title: 'New Laptop',
      targetAmount: 80000,
      currentAmount: 10000,
      targetDate: '2027-02-01',
      category: 'Gadgets & Tech',
      priority: 'high'
    }

    const createdGoal = {
      _id: 'g_2',
      ...newGoalPayload,
      remainingAmount: 70000,
      progressPercentage: 12.5,
      monthsRemaining: 5,
      requiredMonthlySavings: 14000,
      feasibility: {
        status: 'LOW_FEASIBILITY',
        score: 40,
        message: 'Current savings cover only 40% of required contribution.'
      },
      status: 'in_progress'
    }
    API.post.mockResolvedValueOnce({ data: { success: true, data: createdGoal } })

    store.dispatch(openCreateModal())
    expect(store.getState().goals.isModalOpen).toBe(true)

    await store.dispatch(createGoal(newGoalPayload))

    const state = store.getState().goals
    expect(state.actionLoading).toBe(false)
    expect(state.isModalOpen).toBe(false)
    const found = state.goals.find((g) => g._id === 'g_2')
    expect(found).toBeDefined()
    expect(found.title).toBe('New Laptop')
    expect(found.feasibility.status).toBe('LOW_FEASIBILITY')
  })

  it('5. Executes updateGoal thunk and modifies matching goal in store', async () => {
    const updatedGoal = {
      _id: 'g_1',
      title: 'Emergency Fund (Updated)',
      targetAmount: 60000,
      currentAmount: 20000,
      remainingAmount: 40000,
      progressPercentage: 33.3,
      targetDate: '2027-04-01T00:00:00.000Z',
      status: 'in_progress'
    }
    API.put.mockResolvedValueOnce({ data: { success: true, data: updatedGoal } })

    await store.dispatch(updateGoal({ id: 'g_1', data: { targetAmount: 60000, currentAmount: 20000 } }))

    const state = store.getState().goals
    expect(state.actionLoading).toBe(false)
    const found = state.goals.find((g) => g._id === 'g_1')
    expect(found).toBeDefined()
    expect(found.title).toBe('Emergency Fund (Updated)')
    expect(found.targetAmount).toBe(60000)
  })

  it('6. Executes deleteGoal thunk and removes goal from store', async () => {
    API.delete.mockResolvedValueOnce({ data: { success: true, message: 'Goal deleted.' } })

    await store.dispatch(deleteGoal('g_2'))

    const state = store.getState().goals
    const found = state.goals.find((g) => g._id === 'g_2')
    expect(found).toBeUndefined()
  })

  it('7. Handles filter status switching', () => {
    store.dispatch(setFilterStatus('completed'))
    expect(store.getState().goals.filterStatus).toBe('completed')

    store.dispatch(setFilterStatus('in_progress'))
    expect(store.getState().goals.filterStatus).toBe('in_progress')
  })
})
