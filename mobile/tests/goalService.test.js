import goalService from '../src/services/goalService.js';
import api from '../src/services/api.js';

jest.mock('../src/services/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('FinTrack Mobile - Goal Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. should call GET /goals and retrieve enriched user goals', async () => {
    const mockGoalsResponse = {
      success: true,
      count: 1,
      data: [
        {
          _id: 'goal_101',
          title: 'Emergency Fund',
          targetAmount: 50000,
          currentAmount: 15000,
          remainingAmount: 35000,
          progressPercentage: 30,
          targetDate: '2027-06-30T00:00:00.000Z',
          monthsRemaining: 9,
          requiredMonthlySavings: 3888.89,
          category: 'Emergency Fund',
          priority: 'high',
          status: 'in_progress',
          feasibility: {
            status: 'HIGHLY_FEASIBLE',
            score: 100,
            message: 'Current net monthly savings fully cover required monthly contribution.'
          }
        }
      ]
    };
    api.get.mockResolvedValueOnce(mockGoalsResponse);

    const result = await goalService.getGoals();

    expect(api.get).toHaveBeenCalledWith('/goals');
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe('Emergency Fund');
    expect(result.data[0].feasibility.status).toBe('HIGHLY_FEASIBLE');
  });

  it('2. should call GET /goals/:id for single goal retrieval', async () => {
    const mockGoal = {
      success: true,
      data: { _id: 'goal_101', title: 'Emergency Fund', targetAmount: 50000 }
    };
    api.get.mockResolvedValueOnce(mockGoal);

    const result = await goalService.getGoal('goal_101');

    expect(api.get).toHaveBeenCalledWith('/goals/goal_101');
    expect(result.data._id).toBe('goal_101');
  });

  it('3. should call POST /goals with formatted goal payload', async () => {
    const goalInput = {
      title: 'Vacation to Japan',
      targetAmount: 100000,
      currentAmount: 20000,
      targetDate: '2027-04-01',
      category: 'Travel & Vacation',
      priority: 'medium',
      monthlyTarget: 10000,
      notes: 'Save from monthly surplus'
    };

    const mockCreated = {
      success: true,
      data: {
        _id: 'goal_102',
        ...goalInput,
        remainingAmount: 80000,
        progressPercentage: 20
      }
    };
    api.post.mockResolvedValueOnce(mockCreated);

    const result = await goalService.createGoal(goalInput);

    expect(api.post).toHaveBeenCalledWith('/goals', {
      title: 'Vacation to Japan',
      targetAmount: 100000,
      currentAmount: 20000,
      targetDate: '2027-04-01',
      category: 'Travel & Vacation',
      priority: 'medium',
      status: 'in_progress',
      monthlyTarget: 10000,
      notes: 'Save from monthly surplus'
    });
    expect(result.data._id).toBe('goal_102');
  });

  it('4. should call PUT /goals/:id for updating goal progress', async () => {
    api.put.mockResolvedValueOnce({
      success: true,
      data: { _id: 'goal_101', currentAmount: 25000, progressPercentage: 50 }
    });

    const result = await goalService.updateGoal('goal_101', {
      currentAmount: 25000
    });

    expect(api.put).toHaveBeenCalledWith('/goals/goal_101', {
      currentAmount: 25000
    });
    expect(result.data.currentAmount).toBe(25000);
  });

  it('5. should call DELETE /goals/:id for deleting goal', async () => {
    api.delete.mockResolvedValueOnce({
      success: true,
      message: 'Goal deleted successfully.'
    });

    const result = await goalService.deleteGoal('goal_101');

    expect(api.delete).toHaveBeenCalledWith('/goals/goal_101');
    expect(result.success).toBe(true);
  });

  it('6. should reject on API failure', async () => {
    api.post.mockRejectedValueOnce({
      success: false,
      message: 'Target date must be in the future.'
    });

    await expect(
      goalService.createGoal({ title: 'Invalid', targetAmount: 100, targetDate: '2020-01-01' })
    ).rejects.toEqual({
      success: false,
      message: 'Target date must be in the future.'
    });
  });
});
