import { describe, it, expect, vi, beforeEach } from 'vitest'
import goalService from '../services/goalService'
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

describe('Phase 6.4.5 Goal Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. getGoals() calls GET /goals', async () => {
    const mockGoalsResponse = {
      success: true,
      count: 2,
      data: [
        {
          _id: 'goal_1',
          title: 'Emergency Fund',
          targetAmount: 50000,
          currentAmount: 15000,
          targetDate: '2027-03-31T00:00:00.000Z',
          category: 'Savings',
          priority: 'high',
          status: 'in_progress',
          remainingAmount: 35000,
          progressPercentage: 30,
          monthsRemaining: 7,
          requiredMonthlySavings: 5000,
          feasibility: {
            status: 'HIGHLY_FEASIBLE',
            score: 100,
            message: 'Current net monthly savings fully cover required monthly contribution.'
          }
        }
      ]
    }
    API.get.mockResolvedValueOnce({ data: mockGoalsResponse })

    const res = await goalService.getGoals()
    expect(API.get).toHaveBeenCalledWith('/goals')
    expect(res.success).toBe(true)
    expect(res.data).toHaveLength(1)
    expect(res.data[0].title).toBe('Emergency Fund')
    expect(res.data[0].feasibility.status).toBe('HIGHLY_FEASIBLE')
  })

  it('2. createGoal() sends payload to POST /goals', async () => {
    const payload = {
      title: 'Japan Vacation',
      targetAmount: 120000,
      currentAmount: 20000,
      targetDate: '2027-05-01',
      category: 'Travel & Vacation',
      priority: 'medium',
      notes: 'Savings for Tokyo trip'
    }

    const mockCreateResponse = {
      success: true,
      data: {
        _id: 'goal_2',
        ...payload,
        remainingAmount: 100000,
        progressPercentage: 16.7,
        monthsRemaining: 8,
        requiredMonthlySavings: 12500,
        feasibility: {
          status: 'MODERATELY_FEASIBLE',
          score: 80,
          message: 'Current savings cover 80% of required contribution.'
        }
      }
    }
    API.post.mockResolvedValueOnce({ data: mockCreateResponse })

    const res = await goalService.createGoal(payload)
    expect(API.post).toHaveBeenCalledWith('/goals', payload)
    expect(res.success).toBe(true)
    expect(res.data._id).toBe('goal_2')
    expect(res.data.remainingAmount).toBe(100000)
  })

  it('3. getGoalById() calls GET /goals/:id', async () => {
    const mockGoal = {
      success: true,
      data: { _id: 'goal_1', title: 'Emergency Fund' }
    }
    API.get.mockResolvedValueOnce({ data: mockGoal })

    const res = await goalService.getGoalById('goal_1')
    expect(API.get).toHaveBeenCalledWith('/goals/goal_1')
    expect(res.data._id).toBe('goal_1')
  })

  it('4. updateGoal() sends updated fields to PUT /goals/:id', async () => {
    const updatePayload = {
      currentAmount: 25000,
      notes: 'Added bonus to emergency fund'
    }
    const mockUpdateResponse = {
      success: true,
      data: {
        _id: 'goal_1',
        title: 'Emergency Fund',
        targetAmount: 50000,
        currentAmount: 25000,
        remainingAmount: 25000,
        progressPercentage: 50
      }
    }
    API.put.mockResolvedValueOnce({ data: mockUpdateResponse })

    const res = await goalService.updateGoal('goal_1', updatePayload)
    expect(API.put).toHaveBeenCalledWith('/goals/goal_1', updatePayload)
    expect(res.success).toBe(true)
    expect(res.data.currentAmount).toBe(25000)
    expect(res.data.progressPercentage).toBe(50)
  })

  it('5. deleteGoal() calls DELETE /goals/:id', async () => {
    const mockDeleteResponse = {
      success: true,
      message: 'Goal deleted successfully.'
    }
    API.delete.mockResolvedValueOnce({ data: mockDeleteResponse })

    const res = await goalService.deleteGoal('goal_1')
    expect(API.delete).toHaveBeenCalledWith('/goals/goal_1')
    expect(res.success).toBe(true)
  })

  it('6. handles server and network errors gracefully', async () => {
    API.post.mockRejectedValueOnce(new Error('Validation Failed: Target date must be in future'))

    await expect(
      goalService.createGoal({ title: 'Invalid Goal', targetAmount: -100 })
    ).rejects.toThrow('Validation Failed: Target date must be in future')
  })
})
