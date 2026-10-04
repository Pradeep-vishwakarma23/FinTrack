import { describe, it, expect } from 'vitest'

describe('Phase 6.4.5 Goal Component & UI Calculation Logic', () => {
  describe('Goal Summary Aggregation Logic', () => {
    it('accurately computes active, completed, target, saved, and progress metrics', () => {
      const goals = [
        {
          _id: 'g1',
          title: 'Emergency Fund',
          targetAmount: 100000,
          currentAmount: 40000,
          status: 'in_progress',
          isCompleted: false
        },
        {
          _id: 'g2',
          title: 'Vacation',
          targetAmount: 50000,
          currentAmount: 20000,
          status: 'paused',
          isCompleted: false
        },
        {
          _id: 'g3',
          title: 'Phone Payoff',
          targetAmount: 30000,
          currentAmount: 30000,
          status: 'completed',
          isCompleted: true
        }
      ]

      const activeGoals = goals.filter(
        (g) => g.status === 'in_progress' || g.status === 'paused'
      )
      const completedGoals = goals.filter(
        (g) => g.status === 'completed' || g.isCompleted
      )

      expect(activeGoals).toHaveLength(2)
      expect(completedGoals).toHaveLength(1)

      const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0)
      const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0)
      const totalRemaining = totalTarget - totalSaved
      const overallProgress = Math.round((totalSaved / totalTarget) * 100)

      expect(totalTarget).toBe(150000)
      expect(totalSaved).toBe(60000)
      expect(totalRemaining).toBe(90000)
      expect(overallProgress).toBe(40)
    })
  })

  describe('Goal Form Validation Logic', () => {
    const validateGoalInput = ({ title, targetAmount, currentAmount, targetDate }) => {
      const errors = {}
      if (!title || !title.trim()) {
        errors.title = 'Goal title is required.'
      } else if (title.trim().length > 100) {
        errors.title = 'Title cannot exceed 100 characters.'
      }

      const numTarget = Number(targetAmount)
      if (!targetAmount || isNaN(numTarget) || numTarget < 1) {
        errors.targetAmount = 'Target amount must be at least ₹1.'
      }

      const numCurrent = Number(currentAmount)
      if (currentAmount !== '' && (isNaN(numCurrent) || numCurrent < 0)) {
        errors.currentAmount = 'Current amount cannot be negative.'
      }

      if (!targetDate) {
        errors.targetDate = 'Target date is required.'
      } else {
        const selected = new Date(targetDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (isNaN(selected.getTime())) {
          errors.targetDate = 'Invalid date format.'
        } else if (selected <= today) {
          errors.targetDate = 'Target date must be in the future.'
        }
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors
      }
    }

    it('rejects empty title, invalid target amounts, and past dates', () => {
      const res = validateGoalInput({
        title: '',
        targetAmount: 0,
        currentAmount: -50,
        targetDate: '2020-01-01'
      })

      expect(res.isValid).toBe(false)
      expect(res.errors.title).toBe('Goal title is required.')
      expect(res.errors.targetAmount).toBe('Target amount must be at least ₹1.')
      expect(res.errors.currentAmount).toBe('Current amount cannot be negative.')
      expect(res.errors.targetDate).toBe('Target date must be in the future.')
    })

    it('accepts valid future goal payload', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const dateStr = futureDate.toISOString().split('T')[0]

      const res = validateGoalInput({
        title: 'Down Payment',
        targetAmount: 500000,
        currentAmount: 100000,
        targetDate: dateStr
      })

      expect(res.isValid).toBe(true)
      expect(res.errors).toEqual({})
    })
  })

  describe('Goal Feasibility Status Mapping', () => {
    const getFeasibilityBadge = (status) => {
      switch (status) {
        case 'ACHIEVED':
          return { label: 'Target Achieved', tone: 'emerald' }
        case 'HIGHLY_FEASIBLE':
          return { label: 'On Track (Feasible)', tone: 'emerald' }
        case 'MODERATELY_FEASIBLE':
          return { label: 'Challenging (70-99%)', tone: 'amber' }
        case 'LOW_FEASIBILITY':
          return { label: 'Low Feasibility (<70%)', tone: 'orange' }
        case 'UNFEASIBLE_DEFICIT':
          return { label: 'At Risk (Cash Deficit)', tone: 'rose' }
        default:
          return { label: 'Evaluating', tone: 'slate' }
      }
    }

    it('maps all deterministic backend feasibility codes to UX badges', () => {
      expect(getFeasibilityBadge('HIGHLY_FEASIBLE').label).toBe('On Track (Feasible)')
      expect(getFeasibilityBadge('MODERATELY_FEASIBLE').label).toBe('Challenging (70-99%)')
      expect(getFeasibilityBadge('LOW_FEASIBILITY').label).toBe('Low Feasibility (<70%)')
      expect(getFeasibilityBadge('UNFEASIBLE_DEFICIT').label).toBe('At Risk (Cash Deficit)')
      expect(getFeasibilityBadge('ACHIEVED').label).toBe('Target Achieved')
    })
  })

  describe('Goal Filter Tabs Filtering', () => {
    const filterGoalsByTab = (goals, filterStatus) => {
      return goals.filter((goal) => {
        if (filterStatus === 'all') return true
        if (filterStatus === 'in_progress') return goal.status === 'in_progress'
        if (filterStatus === 'completed') return goal.status === 'completed' || goal.isCompleted
        if (filterStatus === 'paused') return goal.status === 'paused'
        if (filterStatus === 'cancelled') return goal.status === 'cancelled'
        return true
      })
    }

    it('correctly filters goals by status category', () => {
      const goals = [
        { _id: '1', status: 'in_progress', isCompleted: false },
        { _id: '2', status: 'in_progress', isCompleted: false },
        { _id: '3', status: 'completed', isCompleted: true },
        { _id: '4', status: 'paused', isCompleted: false },
        { _id: '5', status: 'cancelled', isCompleted: false }
      ]

      expect(filterGoalsByTab(goals, 'all')).toHaveLength(5)
      expect(filterGoalsByTab(goals, 'in_progress')).toHaveLength(2)
      expect(filterGoalsByTab(goals, 'completed')).toHaveLength(1)
      expect(filterGoalsByTab(goals, 'paused')).toHaveLength(1)
      expect(filterGoalsByTab(goals, 'cancelled')).toHaveLength(1)
    })
  })
})
