import mongoose from 'mongoose';
import ActionPlan, { ACTION_TYPES, ACTION_STATUSES, ACTION_PRIORITIES, ACTION_SOURCES } from '../models/ActionPlan.js';
import Goal from '../models/Goal.js';
import { enrichGoalWithCalculations } from './goalService.js';
import { detectRecurringSubscriptions } from './subscriptionService.js';
import { calculateMultiMonthTrends } from './trendIntelligenceService.js';
import { buildGroundedContext, isValidMonthFormat } from './aiAdvisorService.js';

/**
 * Creates a unique deterministic identity key for deduplication.
 */
export const getActionPlanKey = (plan = {}) => {
  const type = plan.actionType || '';
  if (type === 'REDUCE_CATEGORY') {
    return `${type}:${(plan.category || '').toLowerCase().trim()}`;
  }
  if (type === 'GOAL_CONTRIBUTION') {
    const goalId = plan.relatedGoalId ? plan.relatedGoalId.toString() : '';
    return `${type}:${goalId || (plan.title || '').toLowerCase().trim()}`;
  }
  if (type === 'REDUCE_RECURRING') {
    const merchant = (plan.metadata?.merchant || plan.title || '').toLowerCase().trim();
    return `${type}:${merchant}`;
  }
  return `${type}:${(plan.title || '').toLowerCase().trim()}`;
};

/**
 * Pure deterministic generation of Candidate Action Plans based on verified financial intelligence.
 * Does NOT mutate the database.
 */
export const generateCandidateActionPlans = async ({ userId, month } = {}) => {
  if (!userId) {
    throw new Error('User ID is required for generating action plans.');
  }

  const targetMonth = (month && isValidMonthFormat(month))
    ? month
    : new Date().toISOString().slice(0, 7);

  // 1. Gather all authoritative background intelligence in parallel
  const [context, recurringRes, trendsRes, goals] = await Promise.all([
    buildGroundedContext({ userId, month: targetMonth }),
    detectRecurringSubscriptions({ userId }),
    calculateMultiMonthTrends({ userId, range: '6m', referenceMonth: targetMonth }),
    Goal.find({ userId, status: { $in: ['in_progress', 'paused'] } })
  ]);

  const candidates = [];
  const metrics = context.metrics || {};
  const totalIncome = metrics.totalIncome || 0;
  const totalExpense = metrics.totalExpense || 0;
  const netSavings = metrics.netSavings || 0;
  const categorySpending = context.categorySpending || [];
  const anomalies = context.anomalies || [];
  const forecast = context.forecast || {};
  const subscriptions = recurringRes.subscriptions || [];

  // =========================================================================
  // CASE A: NEGATIVE NET SAVINGS / ACTIVE CASH DEFICIT (HIGH Priority)
  // =========================================================================
  if (netSavings < 0) {
    const deficit = Math.abs(netSavings);
    candidates.push({
      userId,
      title: 'Eliminate Monthly Cash Deficit',
      description: `Reduce monthly discretionary spending by ₹${deficit.toLocaleString('en-IN')} to balance income and expenses.`,
      actionType: 'INCREASE_SAVINGS',
      category: 'General',
      currentAmount: totalExpense,
      targetAmount: Math.max(0, totalIncome),
      monthlyImpact: deficit,
      potentialSixMonthImpact: Number((deficit * 6).toFixed(2)),
      priority: 'HIGH',
      status: 'ACTIVE',
      source: 'AUTOMATIC',
      rationale: `Monthly expenses (₹${totalExpense.toLocaleString('en-IN')}) exceed verified earnings (₹${totalIncome.toLocaleString('en-IN')}), creating an active deficit of -₹${deficit.toLocaleString('en-IN')}.`,
      metadata: { deficit, totalIncome, totalExpense }
    });
  }

  // =========================================================================
  // CASE B: HIGH OR RAPIDLY INCREASING EXPENSE CATEGORIES
  // =========================================================================
  categorySpending.forEach((cat) => {
    if (!cat || cat.amount <= 0) return;

    // Check trend in multi-month trends
    const trendItem = trendsRes.categories?.find(
      (c) => c.category.toLowerCase() === cat.category.toLowerCase()
    );
    const isIncreasing = trendItem && trendItem.trend === 'increasing';
    const isMajorShare = cat.percentage >= 25; // 25%+ of total expenses

    if (isIncreasing || isMajorShare) {
      // 10-15% targeted reduction rounded to nearest 50
      const reductionRate = isMajorShare ? 0.15 : 0.10;
      const targetReduction = Math.max(100, Math.round((cat.amount * reductionRate) / 50) * 50);
      const targetAmount = Math.max(0, cat.amount - targetReduction);
      const priority = (isMajorShare && cat.percentage >= 35) || netSavings < 0 ? 'HIGH' : 'MEDIUM';

      candidates.push({
        userId,
        title: `Reduce ${cat.category} Spending`,
        description: `Target a ${Math.round(reductionRate * 100)}% spending reduction in ${cat.category} to free up ₹${targetReduction.toLocaleString('en-IN')}/month.`,
        actionType: 'REDUCE_CATEGORY',
        category: cat.category,
        currentAmount: cat.amount,
        targetAmount,
        monthlyImpact: targetReduction,
        potentialSixMonthImpact: Number((targetReduction * 6).toFixed(2)),
        priority,
        status: 'ACTIVE',
        source: 'AUTOMATIC',
        rationale: `${cat.category} spending is ₹${cat.amount.toLocaleString('en-IN')} (${cat.percentage}% of expenses)${isIncreasing ? ' and shows an increasing multi-month trajectory' : ''}.`,
        metadata: { category: cat.category, originalAmount: cat.amount, reductionRate }
      });
    }
  });

  // =========================================================================
  // CASE C: RECURRING PRICE INCREASES
  // =========================================================================
  subscriptions.forEach((sub) => {
    if (sub.hasPriceIncrease && sub.previousAmount > 0 && sub.latestAmount > sub.previousAmount) {
      const priceDelta = sub.latestAmount - sub.previousAmount;
      candidates.push({
        userId,
        title: `Review ${sub.merchant} Price Increase`,
        description: `Your recurring payment for ${sub.merchant} increased from ₹${sub.previousAmount.toLocaleString('en-IN')} to ₹${sub.latestAmount.toLocaleString('en-IN')}.`,
        actionType: 'REDUCE_RECURRING',
        category: sub.category || 'Subscriptions',
        currentAmount: sub.latestAmount,
        targetAmount: sub.previousAmount,
        monthlyImpact: priceDelta,
        potentialSixMonthImpact: Number((priceDelta * 6).toFixed(2)),
        priority: priceDelta >= 200 || netSavings < 0 ? 'HIGH' : 'MEDIUM',
        status: 'ACTIVE',
        source: 'AUTOMATIC',
        rationale: `Detected recurring price adjustment (+₹${priceDelta.toLocaleString('en-IN')}/month) from ${sub.merchant}.`,
        metadata: { merchant: sub.merchant, previousAmount: sub.previousAmount, latestAmount: sub.latestAmount }
      });
    }
  });

  // =========================================================================
  // CASE D: SAVINGS MOMENTUM DECLINING
  // =========================================================================
  if (trendsRes.momentum?.state === 'DECLINING' && netSavings >= 0) {
    const momentumDelta = Math.abs(trendsRes.momentum.netSavingsDelta || 1000);
    const targetSavingsBoost = Math.max(500, Math.round(momentumDelta / 100) * 100);

    candidates.push({
      userId,
      title: 'Rebuild Savings Momentum',
      description: `Increase monthly net savings by ₹${targetSavingsBoost.toLocaleString('en-IN')} to reverse declining momentum.`,
      actionType: 'INCREASE_SAVINGS',
      category: 'Savings',
      currentAmount: netSavings,
      targetAmount: netSavings + targetSavingsBoost,
      monthlyImpact: targetSavingsBoost,
      potentialSixMonthImpact: Number((targetSavingsBoost * 6).toFixed(2)),
      priority: 'MEDIUM',
      status: 'ACTIVE',
      source: 'AUTOMATIC',
      rationale: `Savings momentum is currently DECLINING with a multi-month net savings reduction of ₹${momentumDelta.toLocaleString('en-IN')}.`,
      metadata: { momentumState: 'DECLINING', momentumDelta }
    });
  }

  // =========================================================================
  // CASE E: ACTIVE GOAL CONTRIBUTIONS
  // =========================================================================
  goals.forEach((goal) => {
    const enriched = enrichGoalWithCalculations(goal, { netMonthlySavings: netSavings });
    if (!enriched.isCompleted && enriched.remainingAmount > 0 && enriched.requiredMonthlySavings > 0) {
      const isUnfeasible = enriched.feasibility?.status === 'UNFEASIBLE_DEFICIT' || enriched.feasibility?.status === 'LOW_FEASIBILITY';

      candidates.push({
        userId,
        title: `Fund Goal: ${enriched.title}`,
        description: `Maintain a monthly contribution of ₹${enriched.requiredMonthlySavings.toLocaleString('en-IN')} to reach target on time.`,
        actionType: 'GOAL_CONTRIBUTION',
        category: enriched.category || 'Goals',
        currentAmount: enriched.currentAmount,
        targetAmount: enriched.targetAmount,
        monthlyImpact: enriched.requiredMonthlySavings,
        potentialSixMonthImpact: Number((enriched.requiredMonthlySavings * Math.min(6, enriched.monthsRemaining || 6)).toFixed(2)),
        targetDate: enriched.targetDate,
        priority: isUnfeasible ? 'HIGH' : 'MEDIUM',
        status: 'ACTIVE',
        source: 'AUTOMATIC',
        rationale: `Goal requires ₹${enriched.requiredMonthlySavings.toLocaleString('en-IN')}/month over ${enriched.monthsRemaining} remaining month(s) to reach ₹${enriched.targetAmount.toLocaleString('en-IN')}. Current progress: ${enriched.progressPercentage}%.`,
        relatedGoalId: enriched._id,
        metadata: {
          goalId: enriched._id,
          targetAmount: enriched.targetAmount,
          remainingAmount: enriched.remainingAmount,
          requiredMonthlySavings: enriched.requiredMonthlySavings,
          feasibility: enriched.feasibility?.status
        }
      });
    }
  });

  // =========================================================================
  // CASE F: SPENDING ANOMALY REVIEW
  // =========================================================================
  if (anomalies.length > 0) {
    const topAnom = anomalies[0];
    if (topAnom.amount >= 1000) {
      candidates.push({
        userId,
        title: `Review Outlier Spending: ${topAnom.title || topAnom.merchant || topAnom.category}`,
        description: `Review uncharacteristic transaction of ₹${topAnom.amount.toLocaleString('en-IN')} in ${topAnom.category}.`,
        actionType: 'REVIEW_ANOMALY',
        category: topAnom.category,
        currentAmount: topAnom.amount,
        targetAmount: 0,
        monthlyImpact: topAnom.amount,
        potentialSixMonthImpact: topAnom.amount,
        priority: topAnom.severity === 'HIGH' ? 'HIGH' : 'LOW',
        status: 'ACTIVE',
        source: 'AUTOMATIC',
        rationale: topAnom.reason || `Detected statistical outlier (${topAnom.anomalyType}) in ${topAnom.category}.`,
        metadata: { anomalyId: topAnom.transactionId, anomalyType: topAnom.anomalyType, severity: topAnom.severity }
      });
    }
  }

  // Sort candidates deterministically: HIGH priority first, then highest monthlyImpact
  const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
  candidates.sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    if (pDiff !== 0) return pDiff;
    return (b.monthlyImpact || 0) - (a.monthlyImpact || 0);
  });

  return candidates;
};

/**
 * Generates and saves candidate action plans to the database while preventing duplicate active plans.
 */
export const generateAndSaveActionPlans = async ({ userId, month } = {}) => {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  const candidates = await generateCandidateActionPlans({ userId, month });

  // Find existing ACTIVE and PAUSED action plans for user
  const existingPlans = await ActionPlan.find({
    userId,
    status: { $in: ['ACTIVE', 'PAUSED'] }
  });

  const existingKeys = new Set(existingPlans.map(getActionPlanKey));

  const toCreate = [];
  const skippedDuplicates = [];

  for (const cand of candidates) {
    const key = getActionPlanKey(cand);
    if (existingKeys.has(key)) {
      skippedDuplicates.push({
        title: cand.title,
        actionType: cand.actionType,
        reason: 'Active or paused plan already exists'
      });
    } else {
      existingKeys.add(key);
      toCreate.push(cand);
    }
  }

  let generated = [];
  if (toCreate.length > 0) {
    generated = await ActionPlan.insertMany(toCreate);
  }

  const totalActive = await ActionPlan.countDocuments({
    userId,
    status: 'ACTIVE'
  });

  return {
    success: true,
    count: generated.length,
    generated,
    skippedDuplicates,
    totalActive
  };
};

/**
 * Retrieves action plans with filtering, sorting, and user isolation.
 */
export const getActionPlans = async ({
  userId,
  status,
  actionType,
  priority,
  limit = 50
} = {}) => {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  const filter = { userId };

  if (status) {
    filter.status = status;
  }
  if (actionType) {
    filter.actionType = actionType;
  }
  if (priority) {
    filter.priority = priority;
  }

  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));

  return ActionPlan.find(filter)
    .sort({ status: 1, priority: 1, createdAt: -1 })
    .limit(safeLimit);
};

/**
 * Retrieves a single action plan by ID with strict user isolation.
 */
export const getActionPlanById = async ({ userId, actionId }) => {
  if (!userId || !actionId) {
    throw new Error('User ID and Action ID are required.');
  }

  if (!mongoose.Types.ObjectId.isValid(actionId)) {
    const error = new Error('Invalid Action Plan ID format.');
    error.statusCode = 400;
    throw error;
  }

  const plan = await ActionPlan.findOne({ _id: actionId, userId });
  if (!plan) {
    const error = new Error('Action plan not found.');
    error.statusCode = 404;
    throw error;
  }

  return plan;
};

/**
 * Creates a manual or copilot action plan with validation.
 */
export const createActionPlan = async ({
  userId,
  title,
  description = '',
  actionType,
  category = '',
  targetAmount = 0,
  currentAmount = 0,
  monthlyImpact = 0,
  potentialSixMonthImpact,
  targetDate,
  priority = 'MEDIUM',
  source = 'MANUAL',
  rationale = '',
  relatedGoalId,
  metadata = {}
} = {}) => {
  if (!userId) {
    const err = new Error('User ID is required.');
    err.statusCode = 400;
    throw err;
  }
  if (!title || !title.trim()) {
    const err = new Error('Action plan title is required.');
    err.statusCode = 400;
    throw err;
  }
  if (!actionType || !ACTION_TYPES.includes(actionType)) {
    const err = new Error(`Invalid action type. Must be one of: ${ACTION_TYPES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const impact = Math.max(0, Number(monthlyImpact) || 0);
  const sixMonthImpact = potentialSixMonthImpact !== undefined
    ? Math.max(0, Number(potentialSixMonthImpact) || 0)
    : Number((impact * 6).toFixed(2));

  const plan = new ActionPlan({
    userId,
    title: title.trim(),
    description: description.trim(),
    actionType,
    category: category.trim(),
    targetAmount: Math.max(0, Number(targetAmount) || 0),
    currentAmount: Math.max(0, Number(currentAmount) || 0),
    monthlyImpact: impact,
    potentialSixMonthImpact: sixMonthImpact,
    targetDate: targetDate ? new Date(targetDate) : undefined,
    priority: ACTION_PRIORITIES.includes(priority) ? priority : 'MEDIUM',
    status: 'ACTIVE',
    source: ACTION_SOURCES.includes(source) ? source : 'MANUAL',
    rationale: rationale.trim(),
    relatedGoalId: relatedGoalId && mongoose.Types.ObjectId.isValid(relatedGoalId) ? relatedGoalId : null,
    metadata
  });

  return plan.save();
};

/**
 * Updates an action plan with user isolation.
 */
export const updateActionPlan = async ({ userId, actionId, updateData = {} }) => {
  const plan = await getActionPlanById({ userId, actionId });

  const allowedFields = [
    'title',
    'description',
    'category',
    'targetAmount',
    'currentAmount',
    'monthlyImpact',
    'potentialSixMonthImpact',
    'targetDate',
    'priority',
    'status',
    'rationale',
    'metadata'
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      plan[field] = updateData[field];
    }
  });

  if (updateData.status === 'COMPLETED' && !plan.completedAt) {
    plan.completedAt = new Date();
  }
  if (updateData.status === 'DISMISSED' && !plan.dismissedAt) {
    plan.dismissedAt = new Date();
  }

  return plan.save();
};

/**
 * Deletes an action plan with user isolation.
 */
export const deleteActionPlan = async ({ userId, actionId }) => {
  const plan = await getActionPlanById({ userId, actionId });
  await ActionPlan.deleteOne({ _id: plan._id, userId });
  return { success: true, message: 'Action plan deleted successfully.' };
};

/**
 * Marks an action plan as COMPLETED.
 */
export const completeActionPlan = async ({ userId, actionId }) => {
  const plan = await getActionPlanById({ userId, actionId });
  plan.status = 'COMPLETED';
  plan.completedAt = new Date();
  await plan.save();
  return plan;
};

/**
 * Marks an action plan as DISMISSED.
 */
export const dismissActionPlan = async ({ userId, actionId }) => {
  const plan = await getActionPlanById({ userId, actionId });
  plan.status = 'DISMISSED';
  plan.dismissedAt = new Date();
  await plan.save();
  return plan;
};
