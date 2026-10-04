import { describe, it, expect, beforeEach } from 'vitest'
import goalReducer, {
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

describe('Phase 6.4.5 Goal Redux Slice', () => {
  let initialState

  beforeEach(() => {
    initialState = {
      goals: [],
      loading: false,
      error: '',
      actionLoading: false,
      actionError: '',
      isModalOpen: false,
      modalMode: 'create',
      selectedGoal: null,
      filterStatus: 'all'
    }
  })

  it('handles openCreateModal, openEditModal, and closeModal', () => {
    let state = goalReducer(initialState, openCreateModal())
    expect(state.isModalOpen).toBe(true)
    expect(state.modalMode).toBe('create')
    expect(state.selectedGoal).toBeNull()

    const sampleGoal = { _id: 'g1', title: 'Car Fund', targetAmount: 200000 }
    state = goalReducer(state, openEditModal(sampleGoal))
    expect(state.isModalOpen).toBe(true)
    expect(state.modalMode).toBe('edit')
    expect(state.selectedGoal).toEqual(sampleGoal)

    state = goalReducer(state, closeModal())
    expect(state.isModalOpen).toBe(false)
    expect(state.selectedGoal).toBeNull()
  })

  it('handles setFilterStatus and clearGoalError', () => {
    let state = goalReducer(initialState, setFilterStatus('completed'))
    expect(state.filterStatus).toBe('completed')

    state = { ...state, error: 'Network Error', actionError: 'Validation Error' }
    state = goalReducer(state, clearGoalError())
    expect(state.error).toBe('')
    expect(state.actionError).toBe('')
  })

  it('handles fetchGoals lifecycle (pending, fulfilled, rejected)', () => {
    // Pending
    const pendingAction = { type: fetchGoals.pending.type }
    let state = goalReducer(initialState, pendingAction)
    expect(state.loading).toBe(true)
    expect(state.error).toBe('')

    // Fulfilled
    const mockGoals = [
      { _id: 'g1', title: 'Goal 1', targetAmount: 50000, remainingAmount: 30000 },
      { _id: 'g2', title: 'Goal 2', targetAmount: 100000, remainingAmount: 70000 }
    ]
    const fulfilledAction = { type: fetchGoals.fulfilled.type, payload: mockGoals }
    state = goalReducer(state, fulfilledAction)
    expect(state.loading).toBe(false)
    expect(state.goals).toHaveLength(2)
    expect(state.goals[0].title).toBe('Goal 1')

    // Rejected
    const rejectedAction = { type: fetchGoals.rejected.type, payload: 'Failed to fetch goals' }
    state = goalReducer(initialState, rejectedAction)
    expect(state.loading).toBe(false)
    expect(state.error).toBe('Failed to fetch goals')
  })

  it('handles createGoal lifecycle (pending, fulfilled, rejected)', () => {
    const activeState = {
      ...initialState,
      isModalOpen: true,
      goals: [{ _id: 'g1', title: 'Existing Goal', targetDate: '2027-10-01' }]
    }

    // Pending
    let state = goalReducer(activeState, { type: createGoal.pending.type })
    expect(state.actionLoading).toBe(true)
    expect(state.actionError).toBe('')

    // Fulfilled
    const newGoal = { _id: 'g2', title: 'New Vacation Goal', targetDate: '2027-05-01', targetAmount: 40000 }
    state = goalReducer(state, { type: createGoal.fulfilled.type, payload: newGoal })
    expect(state.actionLoading).toBe(false)
    expect(state.isModalOpen).toBe(false)
    expect(state.goals).toHaveLength(2)
    // Sorted by targetDate: 2027-05-01 should come before 2027-10-01
    expect(state.goals[0]._id).toBe('g2')

    // Rejected
    state = goalReducer(activeState, { type: createGoal.rejected.type, payload: 'Target amount must be at least ₹1' })
    expect(state.actionLoading).toBe(false)
    expect(state.actionError).toBe('Target amount must be at least ₹1')
    expect(state.isModalOpen).toBe(true)
  })

  it('handles updateGoal lifecycle (pending, fulfilled, rejected)', () => {
    const existingGoals = [
      { _id: 'g1', title: 'Goal 1', currentAmount: 10000, targetDate: '2027-06-01' },
      { _id: 'g2', title: 'Goal 2', currentAmount: 20000, targetDate: '2027-09-01' }
    ]
    const activeState = {
      ...initialState,
      goals: existingGoals,
      isModalOpen: true,
      selectedGoal: existingGoals[0]
    }

    // Pending
    let state = goalReducer(activeState, { type: updateGoal.pending.type })
    expect(state.actionLoading).toBe(true)

    // Fulfilled
    const updatedGoal = { _id: 'g1', title: 'Goal 1 Updated', currentAmount: 15000, targetDate: '2027-06-01' }
    state = goalReducer(state, { type: updateGoal.fulfilled.type, payload: updatedGoal })
    expect(state.actionLoading).toBe(false)
    expect(state.isModalOpen).toBe(false)
    expect(state.goals[0].title).toBe('Goal 1 Updated')
    expect(state.goals[0].currentAmount).toBe(15000)

    // Rejected
    state = goalReducer(activeState, { type: updateGoal.rejected.type, payload: 'Invalid update' })
    expect(state.actionLoading).toBe(false)
    expect(state.actionError).toBe('Invalid update')
  })

  it('handles deleteGoal lifecycle (pending, fulfilled, rejected)', () => {
    const existingGoals = [
      { _id: 'g1', title: 'Goal 1' },
      { _id: 'g2', title: 'Goal 2' }
    ]
    const activeState = { ...initialState, goals: existingGoals }

    // Pending
    let state = goalReducer(activeState, { type: deleteGoal.pending.type })
    expect(state.actionLoading).toBe(true)

    // Fulfilled
    state = goalReducer(state, { type: deleteGoal.fulfilled.type, payload: 'g1' })
    expect(state.actionLoading).toBe(false)
    expect(state.goals).toHaveLength(1)
    expect(state.goals[0]._id).toBe('g2')

    // Rejected
    state = goalReducer(activeState, { type: deleteGoal.rejected.type, payload: 'Goal not found' })
    expect(state.actionLoading).toBe(false)
    expect(state.actionError).toBe('Goal not found')
  })
})
