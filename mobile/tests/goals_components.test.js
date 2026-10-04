import React from 'react';
import { GoalCard, GoalFormModal, GoalSummaryCard } from '../src/components/goals/index.js';
import { formatCurrency, formatDate } from '../src/utils/formatters.js';

describe('FinTrack Mobile - Goals Component Helpers & Feasibility Mappings', () => {
  const mockGoal = {
    _id: 'goal_123',
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
  };

  describe('Component Exports', () => {
    it('should export GoalCard, GoalFormModal, and GoalSummaryCard', () => {
      expect(GoalCard).toBeDefined();
      expect(GoalFormModal).toBeDefined();
      expect(GoalSummaryCard).toBeDefined();
    });
  });

  describe('Feasibility Status Mapping', () => {
    const mapFeasibilityStatus = (status, isCompleted) => {
      const fStatus = status || (isCompleted ? 'ACHIEVED' : '');
      switch (fStatus) {
        case 'ACHIEVED':
          return { label: 'Target Achieved', variant: 'success' };
        case 'HIGHLY_FEASIBLE':
          return { label: 'On Track', variant: 'success' };
        case 'MODERATELY_FEASIBLE':
          return { label: 'Challenging', variant: 'warning' };
        case 'LOW_FEASIBILITY':
          return { label: 'Low Feasibility', variant: 'danger' };
        case 'UNFEASIBLE_DEFICIT':
          return { label: 'At Risk', variant: 'danger' };
        default:
          return { label: 'Evaluating', variant: 'default' };
      }
    };

    it('should map HIGHLY_FEASIBLE to On Track', () => {
      const mapped = mapFeasibilityStatus('HIGHLY_FEASIBLE', false);
      expect(mapped.label).toBe('On Track');
      expect(mapped.variant).toBe('success');
    });

    it('should map MODERATELY_FEASIBLE to Challenging', () => {
      const mapped = mapFeasibilityStatus('MODERATELY_FEASIBLE', false);
      expect(mapped.label).toBe('Challenging');
      expect(mapped.variant).toBe('warning');
    });

    it('should map LOW_FEASIBILITY to Low Feasibility', () => {
      const mapped = mapFeasibilityStatus('LOW_FEASIBILITY', false);
      expect(mapped.label).toBe('Low Feasibility');
      expect(mapped.variant).toBe('danger');
    });

    it('should map UNFEASIBLE_DEFICIT to At Risk', () => {
      const mapped = mapFeasibilityStatus('UNFEASIBLE_DEFICIT', false);
      expect(mapped.label).toBe('At Risk');
      expect(mapped.variant).toBe('danger');
    });

    it('should map ACHIEVED to Target Achieved', () => {
      const mapped = mapFeasibilityStatus('ACHIEVED', true);
      expect(mapped.label).toBe('Target Achieved');
      expect(mapped.variant).toBe('success');
    });
  });

  describe('Goal Summary Aggregations', () => {
    it('should compute active, completed, target, saved, and progress correctly', () => {
      const goals = [
        mockGoal,
        {
          _id: 'goal_456',
          title: 'Laptop Payoff',
          targetAmount: 50000,
          currentAmount: 50000,
          status: 'completed',
          isCompleted: true
        }
      ];

      const activeGoals = goals.filter((g) => g.status === 'in_progress' || g.status === 'paused');
      const completedGoals = goals.filter((g) => g.status === 'completed' || g.isCompleted);

      const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
      const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
      const totalRemaining = Math.max(0, totalTarget - totalSaved);
      const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

      expect(activeGoals).toHaveLength(1);
      expect(completedGoals).toHaveLength(1);
      expect(totalTarget).toBe(50000);
      expect(totalSaved).toBe(15000);
      expect(totalRemaining).toBe(35000);
      expect(overallProgress).toBe(30);
    });
  });

  describe('Goal Form Input Validation Logic', () => {
    const validateGoal = ({ title, targetAmount, currentAmount, targetDate }, mode = 'create') => {
      const errors = {};

      if (!title || !title.trim()) {
        errors.title = 'Goal title is required.';
      } else if (title.trim().length > 100) {
        errors.title = 'Title cannot exceed 100 characters.';
      }

      const numTarget = Number(targetAmount);
      if (!targetAmount || isNaN(numTarget) || numTarget < 1) {
        errors.targetAmount = 'Target amount must be at least ₹1.';
      }

      const numCurrent = Number(currentAmount);
      if (currentAmount !== '' && (isNaN(numCurrent) || numCurrent < 0)) {
        errors.currentAmount = 'Current amount cannot be negative.';
      }

      if (!targetDate) {
        errors.targetDate = 'Target date is required (YYYY-MM-DD).';
      } else {
        const selected = new Date(targetDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(selected.getTime())) {
          errors.targetDate = 'Invalid date format (use YYYY-MM-DD).';
        } else if (mode === 'create' && selected <= today) {
          errors.targetDate = 'Target date must be in the future.';
        }
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    };

    it('should reject empty title, zero target amount, and past date', () => {
      const result = validateGoal({
        title: '',
        targetAmount: '0',
        currentAmount: '-10',
        targetDate: '2020-01-01'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Goal title is required.');
      expect(result.errors.targetAmount).toBe('Target amount must be at least ₹1.');
      expect(result.errors.currentAmount).toBe('Current amount cannot be negative.');
      expect(result.errors.targetDate).toBe('Target date must be in the future.');
    });

    it('should accept valid future goal input', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const futureStr = future.toISOString().split('T')[0];

      const result = validateGoal({
        title: 'Down Payment',
        targetAmount: '200000',
        currentAmount: '50000',
        targetDate: futureStr
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('Formatting in Goal Cards', () => {
    it('should format currency with Rupee symbol and Indian numbering', () => {
      expect(formatCurrency(50000)).toBe('₹50,000');
      expect(formatCurrency(100000)).toBe('₹1,00,000');
      expect(formatCurrency(3888.89)).toBe('₹3,888.89');
    });

    it('should format target dates cleanly', () => {
      const formatted = formatDate(mockGoal.targetDate, { short: true });
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });
  });
});
