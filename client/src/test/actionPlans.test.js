import { describe, it, expect, vi, beforeEach } from 'vitest'
import actionPlanService from '../services/actionPlanService'
import API from '../services/api'
import actionPlanReducer, {
  setFilterPriority,
  setFilterStatus,
  clearActionPlanError,
  clearGenerateSummary,
  fetchActionPlans,
  generateActionPlans,
  completeActionPlan,
  dismissActionPlan,
  deleteActionPlan
} from '../redux/slices/actionPlanSlice'

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

describe('Phase 7.5 Web Financial Action Plans Service & Slice Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('actionPlanService API calls', () => {
    it('fetches action plans with getActionPlans', async () => {
      API.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: [
            {
              _id: 'plan_1',
              title: 'Reduce Shopping Spending',
              actionType: 'REDUCE_CATEGORY',
              targetAmount: 500,
              monthlyImpact: 500,
              potentialSixMonthImpact: 3000,
              priority: 'HIGH',
              status: 'ACTIVE'
            }
          ]
        }
      })

      const res = await actionPlanService.getActionPlans({ status: 'ACTIVE' })
      expect(API.get).toHaveBeenCalledWith('/action-plans', { params: { status: 'ACTIVE' } })
      expect(res.success).toBe(true)
      expect(res.data).toHaveLength(1)
      expect(res.data[0].monthlyImpact).toBe(500)
    })

    it('triggers deterministic generation with generateActionPlans', async () => {
      API.post.mockResolvedValueOnce({
        data: {
          success: true,
          generated: [
            {
              _id: 'plan_gen_1',
              title: 'Mitigate Cash Deficit',
              actionType: 'INCREASE_SAVINGS',
              monthlyImpact: 2500,
              priority: 'HIGH',
              status: 'ACTIVE'
            }
          ],
          skippedDuplicates: []
        }
      })

      const res = await actionPlanService.generateActionPlans()
      expect(API.post).toHaveBeenCalledWith('/action-plans/generate')
      expect(res.success).toBe(true)
      expect(res.generated).toHaveLength(1)
    })

    it('completes an action plan via completeActionPlan', async () => {
      API.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            _id: 'plan_1',
            status: 'COMPLETED',
            completedAt: new Date().toISOString()
          }
        }
      })

      const res = await actionPlanService.completeActionPlan('plan_1')
      expect(API.post).toHaveBeenCalledWith('/action-plans/plan_1/complete')
      expect(res.data.status).toBe('COMPLETED')
    })

    it('dismisses an action plan via dismissActionPlan', async () => {
      API.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            _id: 'plan_1',
            status: 'DISMISSED',
            dismissedAt: new Date().toISOString()
          }
        }
      })

      const res = await actionPlanService.dismissActionPlan('plan_1')
      expect(API.post).toHaveBeenCalledWith('/action-plans/plan_1/dismiss')
      expect(res.data.status).toBe('DISMISSED')
    })

    it('deletes an action plan via deleteActionPlan', async () => {
      API.delete.mockResolvedValueOnce({
        data: { success: true, message: 'Action plan deleted' }
      })

      const res = await actionPlanService.deleteActionPlan('plan_1')
      expect(API.delete).toHaveBeenCalledWith('/action-plans/plan_1')
      expect(res.success).toBe(true)
    })
  })

  describe('actionPlanSlice Reducer and Actions', () => {
    it('handles filter actions and clear actions', () => {
      let state = actionPlanReducer(undefined, setFilterPriority('HIGH'))
      expect(state.filterPriority).toBe('HIGH')

      state = actionPlanReducer(state, setFilterStatus('COMPLETED'))
      expect(state.filterStatus).toBe('COMPLETED')

      state = actionPlanReducer(
        { ...state, error: 'Some error', actionError: 'Some action error', generateSummary: { count: 1 } },
        clearActionPlanError()
      )
      expect(state.error).toBe('')
      expect(state.actionError).toBe('')

      state = actionPlanReducer(state, clearGenerateSummary())
      expect(state.generateSummary).toBeNull()
    })

    it('handles fetchActionPlans.fulfilled and rejected', () => {
      const mockPlans = [
        { _id: 'p1', title: 'Plan 1', monthlyImpact: 100, priority: 'HIGH', status: 'ACTIVE' },
        { _id: 'p2', title: 'Plan 2', monthlyImpact: 200, priority: 'MEDIUM', status: 'ACTIVE' }
      ]

      let state = actionPlanReducer(undefined, {
        type: fetchActionPlans.fulfilled.type,
        payload: mockPlans
      })

      expect(state.loading).toBe(false)
      expect(state.plans).toHaveLength(2)
      expect(state.error).toBe('')

      state = actionPlanReducer(state, {
        type: fetchActionPlans.rejected.type,
        payload: 'Network Error'
      })
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Network Error')
    })

    it('handles generateActionPlans.fulfilled with prepended unique plans', () => {
      const initialPlans = [
        { _id: 'p1', title: 'Old Plan', monthlyImpact: 100, status: 'ACTIVE' }
      ]
      const newPlans = [
        { _id: 'p2', title: 'Generated Plan 2', monthlyImpact: 300, status: 'ACTIVE' },
        { _id: 'p1', title: 'Old Plan duplicate', monthlyImpact: 100, status: 'ACTIVE' }
      ]

      const state = actionPlanReducer(
        { ...actionPlanReducer(undefined, { type: '@@INIT' }), plans: initialPlans, generating: true },
        {
          type: generateActionPlans.fulfilled.type,
          payload: {
            success: true,
            generated: newPlans,
            skippedDuplicates: [{ _id: 'p1' }],
            message: '2 actions evaluated'
          }
        }
      )

      expect(state.generating).toBe(false)
      expect(state.generateSummary).toEqual({
        generatedCount: 2,
        skippedCount: 1,
        message: '2 actions evaluated'
      })
      // p2 added, p1 already existed
      expect(state.plans).toHaveLength(2)
      expect(state.plans[0]._id).toBe('p2')
    })

    it('handles completeActionPlan.fulfilled and updates status in place', () => {
      const initialPlans = [
        { _id: 'p1', title: 'Plan 1', status: 'ACTIVE' },
        { _id: 'p2', title: 'Plan 2', status: 'ACTIVE' }
      ]

      const updatedPlan = { _id: 'p1', title: 'Plan 1', status: 'COMPLETED', completedAt: '2026-09-30' }

      const state = actionPlanReducer(
        { ...actionPlanReducer(undefined, { type: '@@INIT' }), plans: initialPlans },
        {
          type: completeActionPlan.fulfilled.type,
          payload: updatedPlan,
          meta: { arg: 'p1' }
        }
      )

      expect(state.plans[0].status).toBe('COMPLETED')
      expect(state.plans[1].status).toBe('ACTIVE')
    })

    it('handles dismissActionPlan.fulfilled and updates status in place', () => {
      const initialPlans = [
        { _id: 'p1', title: 'Plan 1', status: 'ACTIVE' }
      ]

      const updatedPlan = { _id: 'p1', title: 'Plan 1', status: 'DISMISSED', dismissedAt: '2026-09-30' }

      const state = actionPlanReducer(
        { ...actionPlanReducer(undefined, { type: '@@INIT' }), plans: initialPlans },
        {
          type: dismissActionPlan.fulfilled.type,
          payload: updatedPlan,
          meta: { arg: 'p1' }
        }
      )

      expect(state.plans[0].status).toBe('DISMISSED')
    })

    it('handles deleteActionPlan.fulfilled and removes plan from list', () => {
      const initialPlans = [
        { _id: 'p1', title: 'Plan 1' },
        { _id: 'p2', title: 'Plan 2' }
      ]

      const state = actionPlanReducer(
        { ...actionPlanReducer(undefined, { type: '@@INIT' }), plans: initialPlans },
        {
          type: deleteActionPlan.fulfilled.type,
          payload: 'p1',
          meta: { arg: 'p1' }
        }
      )

      expect(state.plans).toHaveLength(1)
      expect(state.plans[0]._id).toBe('p2')
    })
  })
})
