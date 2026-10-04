import mongoose from 'mongoose';
import Goal from '../models/Goal.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { enrichGoalWithCalculations } from '../services/goalService.js';
import { calculateFinancialMetrics } from '../services/bankingIntelligenceService.js';
import { parseMonthQuery } from './intelligenceController.js';

/**
 * Helper to fetch user's net monthly savings for the current month to evaluate goal feasibility.
 */
const getCurrentNetMonthlySavings = async (userId) => {
  try {
    const { startDate, endDate } = parseMonthQuery();
    const [transactions, budget] = await Promise.all([
      Transaction.find({
        userId,
        status: 'confirmed',
        transactionDate: { $gte: startDate, $lte: endDate }
      }),
      Budget.findOne({ userId })
    ]);
    const metrics = calculateFinancialMetrics(transactions, budget);
    return metrics.netSavings || 0;
  } catch {
    return 0;
  }
};

/**
 * GET /api/goals
 * Returns all goals for the authenticated user, enriched with deterministic calculations.
 */
export const getGoals = async (req, res) => {
  try {
    const [goals, netMonthlySavings] = await Promise.all([
      Goal.find({ userId: req.userId }).sort({ targetDate: 1, createdAt: -1 }),
      getCurrentNetMonthlySavings(req.userId)
    ]);

    const enriched = goals.map((g) =>
      enrichGoalWithCalculations(g, { netMonthlySavings })
    );

    return res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    console.error('[Goal Controller] getGoals error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching goals.'
    });
  }
};

/**
 * POST /api/goals
 * Creates a new financial goal with strict validation.
 */
export const createGoal = async (req, res) => {
  try {
    const {
      title,
      targetAmount,
      currentAmount = 0,
      targetDate,
      category = 'General',
      priority = 'medium',
      status = 'in_progress',
      monthlyTarget = 0,
      notes = ''
    } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Goal title is required.'
      });
    }

    const numTarget = Number(targetAmount);
    if (isNaN(numTarget) || numTarget < 1) {
      return res.status(400).json({
        success: false,
        message: 'Target amount must be a positive number greater than or equal to ₹1.'
      });
    }

    const numCurrent = Number(currentAmount);
    if (isNaN(numCurrent) || numCurrent < 0) {
      return res.status(400).json({
        success: false,
        message: 'Current amount cannot be negative.'
      });
    }

    if (!targetDate) {
      return res.status(400).json({
        success: false,
        message: 'Target date is required.'
      });
    }

    const parsedTargetDate = new Date(targetDate);
    if (isNaN(parsedTargetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target date format.'
      });
    }

    // Target date must be in the future (at least tomorrow)
    const now = new Date();
    if (parsedTargetDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'Target date must be in the future.'
      });
    }

    const validPriorities = ['low', 'medium', 'high'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Priority must be low, medium, or high.'
      });
    }

    const validStatuses = ['in_progress', 'completed', 'paused', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be in_progress, completed, paused, or cancelled.'
      });
    }

    const newGoal = new Goal({
      userId: req.userId,
      title: title.trim(),
      targetAmount: numTarget,
      currentAmount: numCurrent,
      targetDate: parsedTargetDate,
      category: category ? String(category).trim() : 'General',
      priority,
      status: numCurrent >= numTarget ? 'completed' : status,
      monthlyTarget: Math.max(0, Number(monthlyTarget) || 0),
      notes: notes ? String(notes).trim() : ''
    });

    await newGoal.save();

    const netMonthlySavings = await getCurrentNetMonthlySavings(req.userId);
    const enriched = enrichGoalWithCalculations(newGoal, { netMonthlySavings });

    return res.status(201).json({
      success: true,
      data: enriched
    });
  } catch (error) {
    console.error('[Goal Controller] createGoal error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating goal.'
    });
  }
};

/**
 * GET /api/goals/:id
 * Retrieves a single goal by ID for the authenticated user.
 */
export const getGoalById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format.'
      });
    }

    const goal = await Goal.findOne({ _id: id, userId: req.userId });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or does not belong to user.'
      });
    }

    const netMonthlySavings = await getCurrentNetMonthlySavings(req.userId);
    const enriched = enrichGoalWithCalculations(goal, { netMonthlySavings });

    return res.status(200).json({
      success: true,
      data: enriched
    });
  } catch (error) {
    console.error('[Goal Controller] getGoalById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving goal.'
    });
  }
};

/**
 * PUT /api/goals/:id
 * Updates goal properties for the authenticated user.
 */
export const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format.'
      });
    }

    const goal = await Goal.findOne({ _id: id, userId: req.userId });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or does not belong to user.'
      });
    }

    const {
      title,
      targetAmount,
      currentAmount,
      targetDate,
      category,
      priority,
      status,
      monthlyTarget,
      notes
    } = req.body || {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Goal title cannot be empty.'
        });
      }
      goal.title = title.trim();
    }

    if (targetAmount !== undefined) {
      const numTarget = Number(targetAmount);
      if (isNaN(numTarget) || numTarget < 1) {
        return res.status(400).json({
          success: false,
          message: 'Target amount must be at least ₹1.'
        });
      }
      goal.targetAmount = numTarget;
    }

    if (currentAmount !== undefined) {
      const numCurrent = Number(currentAmount);
      if (isNaN(numCurrent) || numCurrent < 0) {
        return res.status(400).json({
          success: false,
          message: 'Current amount cannot be negative.'
        });
      }
      goal.currentAmount = numCurrent;
    }

    if (targetDate !== undefined) {
      const parsed = new Date(targetDate);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target date format.'
        });
      }
      goal.targetDate = parsed;
    }

    if (category !== undefined) goal.category = String(category).trim();
    if (priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Priority must be low, medium, or high.'
        });
      }
      goal.priority = priority;
    }

    if (status !== undefined) {
      if (!['in_progress', 'completed', 'paused', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be in_progress, completed, paused, or cancelled.'
        });
      }
      goal.status = status;
    }

    if (monthlyTarget !== undefined) goal.monthlyTarget = Math.max(0, Number(monthlyTarget) || 0);
    if (notes !== undefined) goal.notes = String(notes).trim();

    // Auto-complete status if target reached
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'in_progress') {
      goal.status = 'completed';
    }

    await goal.save();

    const netMonthlySavings = await getCurrentNetMonthlySavings(req.userId);
    const enriched = enrichGoalWithCalculations(goal, { netMonthlySavings });

    return res.status(200).json({
      success: true,
      data: enriched
    });
  } catch (error) {
    console.error('[Goal Controller] updateGoal error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating goal.'
    });
  }
};

/**
 * DELETE /api/goals/:id
 * Deletes a financial goal belonging to the authenticated user.
 */
export const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal ID format.'
      });
    }

    const result = await Goal.deleteOne({ _id: id, userId: req.userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or does not belong to user.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Goal deleted successfully.'
    });
  } catch (error) {
    console.error('[Goal Controller] deleteGoal error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting goal.'
    });
  }
};
