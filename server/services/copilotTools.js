/**
 * FinTrack LLM Architecture Phase 1: Copilot Deterministic Financial Tool Layer
 * Read-only, deterministic financial query tools operating strictly on confirmed ledger transactions.
 * Never executes arbitrary MongoDB queries or database mutations.
 * Enforces strict user isolation.
 */

import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import { parseMonthQuery } from '../controllers/intelligenceController.js';
import {
  calculateFinancialMetrics,
  calculateCategorySpending as calculateCategorySpendingService,
  calculateMerchantAnalytics,
  detectAnomalies as detectAnomaliesService,
  calculateForecastAndRisk
} from './bankingIntelligenceService.js';
import { enrichGoalWithCalculations } from './goalService.js';

/**
 * Validates that userId is provided and non-empty.
 */
const validateUserId = (userId) => {
  if (!userId || (typeof userId === 'string' && userId.trim().length === 0)) {
    const error = new Error('userId is required');
    error.statusCode = 400;
    throw error;
  }
};

/**
 * Helper to fetch confirmed ledger transactions and budget within target and historical date windows.
 * Strictly scopes by { userId, status: 'confirmed' }.
 */
const fetchLedgerData = async ({ userId, month }) => {
  validateUserId(userId);
  const { startDate, endDate, referenceDate, historicalStart, monthKey } = parseMonthQuery(month);

  const [currentTransactions, historicalTransactions, budget] = await Promise.all([
    Transaction.find({
      userId,
      status: 'confirmed',
      transactionDate: { $gte: startDate, $lte: endDate }
    }).sort({ transactionDate: -1 }),
    Transaction.find({
      userId,
      status: 'confirmed',
      transactionDate: { $gte: historicalStart, $lt: startDate }
    }),
    Budget.findOne({ userId })
  ]);

  return {
    monthKey,
    startDate,
    endDate,
    referenceDate,
    currentTransactions: currentTransactions || [],
    historicalTransactions: historicalTransactions || [],
    budget: budget || null
  };
};

/**
 * 1. getFinancialSummary
 * Returns verified income, expenses, net savings, savings rate, deficit status, and budget progress.
 */
export const getFinancialSummary = async ({ userId, month } = {}) => {
  const { monthKey, currentTransactions, budget } = await fetchLedgerData({ userId, month });
  const metrics = calculateFinancialMetrics(currentTransactions, budget);

  return {
    totalIncome: metrics.totalIncome,
    totalExpense: metrics.totalExpense,
    netSavings: metrics.netSavings,
    savingsRate: metrics.savingsRate,
    isDeficit: metrics.isDeficit,
    monthlyBudget: metrics.monthlyBudget,
    budgetRemaining: metrics.budgetRemaining,
    transactionCount: metrics.transactionCount,
    incomeCount: metrics.incomeCount,
    expenseCount: metrics.expenseCount,
    period: monthKey,
    provider: 'deterministic'
  };
};

/**
 * 2. getCategorySpending
 * Returns category-specific spending or complete category breakdown.
 */
export const getCategorySpending = async ({ userId, month, category } = {}) => {
  const { monthKey, currentTransactions, budget } = await fetchLedgerData({ userId, month });
  const breakdown = calculateCategorySpendingService(currentTransactions, budget);

  if (category && typeof category === 'string' && category.trim().length > 0) {
    const trimmedCat = category.trim();
    const matched = breakdown.find(
      (c) => c.category.toLowerCase() === trimmedCat.toLowerCase()
    );

    if (matched) {
      return {
        category: matched.category,
        amount: matched.amount,
        percentage: matched.percentage,
        transactionCount: matched.count,
        count: matched.count,
        averageTicket: matched.averageTicket,
        budgetLimit: matched.budgetLimit,
        budgetUtilization: matched.budgetUtilization,
        isOverBudget: matched.isOverBudget,
        period: monthKey,
        provider: 'deterministic'
      };
    }

    let budgetLimit = null;
    if (budget?.categoryBudgets && Array.isArray(budget.categoryBudgets)) {
      const cbMatch = budget.categoryBudgets.find(
        (cb) => cb?.category && cb.category.trim().toLowerCase() === trimmedCat.toLowerCase()
      );
      if (cbMatch) {
        budgetLimit = Number(cbMatch.limit) || 0;
      }
    }

    return {
      category: trimmedCat,
      amount: 0,
      percentage: 0,
      transactionCount: 0,
      count: 0,
      averageTicket: 0,
      budgetLimit,
      budgetUtilization: 0,
      isOverBudget: false,
      period: monthKey,
      provider: 'deterministic'
    };
  }

  return {
    categories: breakdown.map((c) => ({
      category: c.category,
      amount: c.amount,
      percentage: c.percentage,
      transactionCount: c.count,
      count: c.count,
      averageTicket: c.averageTicket,
      budgetLimit: c.budgetLimit,
      budgetUtilization: c.budgetUtilization,
      isOverBudget: c.isOverBudget
    })),
    totalCategoriesCount: breakdown.length,
    period: monthKey,
    provider: 'deterministic'
  };
};

/**
 * 3. getMerchantSpending
 * Returns spending for a specific merchant or top merchants up to limit.
 */
export const getMerchantSpending = async ({ userId, month, limit = 10, merchant } = {}) => {
  const { monthKey, currentTransactions } = await fetchLedgerData({ userId, month });

  if (merchant && typeof merchant === 'string' && merchant.trim().length > 0) {
    const trimmedMerchant = merchant.trim().toLowerCase();
    const allMerchants = calculateMerchantAnalytics(currentTransactions, { limit: 10000 });
    const matched = allMerchants.find(
      (m) =>
        m.merchant.toLowerCase() === trimmedMerchant ||
        m.merchant.toLowerCase().includes(trimmedMerchant)
    );

    if (matched) {
      return {
        merchant: matched.merchant,
        totalSpend: matched.totalSpend,
        count: matched.count,
        transactionCount: matched.count,
        averageTicket: matched.averageTicket,
        percentage: matched.percentage,
        lastTransactionDate: matched.lastTransactionDate,
        period: monthKey,
        provider: 'deterministic'
      };
    }

    return {
      merchant: merchant.trim(),
      totalSpend: 0,
      count: 0,
      transactionCount: 0,
      averageTicket: 0,
      percentage: 0,
      lastTransactionDate: null,
      period: monthKey,
      provider: 'deterministic'
    };
  }

  const safeLimit = Math.max(1, parseInt(limit, 10) || 10);
  const topMerchants = calculateMerchantAnalytics(currentTransactions, { limit: safeLimit });

  return {
    merchants: topMerchants.map((m) => ({
      merchant: m.merchant,
      totalSpend: m.totalSpend,
      count: m.count,
      transactionCount: m.count,
      averageTicket: m.averageTicket,
      percentage: m.percentage,
      lastTransactionDate: m.lastTransactionDate
    })),
    limit: safeLimit,
    period: monthKey,
    provider: 'deterministic'
  };
};

/**
 * 4. getForecast
 * Returns existing verified run-rate forecast metrics.
 */
export const getForecast = async ({ userId, month } = {}) => {
  const { monthKey, currentTransactions, historicalTransactions, budget, referenceDate } =
    await fetchLedgerData({ userId, month });

  const forecast = calculateForecastAndRisk({
    currentTransactions,
    historicalTransactions,
    budget,
    referenceDate
  });

  return {
    dailyBurnRate: forecast.dailyBurnRate,
    projectedMonthEndSpend: forecast.projectedExpense,
    projectedExpense: forecast.projectedExpense,
    currentMonthExpense: forecast.currentMonthExpense,
    daysElapsed: forecast.daysElapsed,
    daysRemaining: forecast.daysRemaining,
    totalDaysInMonth: forecast.totalDaysInMonth,
    confidence: forecast.confidence,
    forecastMethod: forecast.forecastMethod,
    historicalAverageExpense: forecast.historicalAverageExpense,
    riskLevel: forecast.riskLevel,
    riskDetails: forecast.riskDetails,
    period: monthKey,
    provider: 'deterministic'
  };
};

/**
 * 5. getBudgetRisk
 * Returns verified budget velocity and risk metrics.
 */
export const getBudgetRisk = async ({ userId, month } = {}) => {
  const { monthKey, currentTransactions, historicalTransactions, budget, referenceDate } =
    await fetchLedgerData({ userId, month });

  const forecast = calculateForecastAndRisk({
    currentTransactions,
    historicalTransactions,
    budget,
    referenceDate
  });
  const metrics = calculateFinancialMetrics(currentTransactions, budget);

  return {
    budgetVelocity: forecast.budgetVelocity,
    riskLevel: forecast.riskLevel,
    projectedBudgetVariance: forecast.riskDetails?.projectedVariance ?? 0,
    budgetRemaining: metrics.budgetRemaining,
    monthlyBudget: forecast.monthlyBudget,
    currentUtilization: forecast.riskDetails?.currentUtilization ?? 0,
    projectedUtilization: forecast.riskDetails?.projectedUtilization ?? 0,
    statusMessage: forecast.riskDetails?.message ?? 'No monthly budget target configured.',
    riskDetails: forecast.riskDetails,
    period: monthKey,
    provider: 'deterministic'
  };
};

/**
 * 6. getAnomalies
 * Returns verified anomaly detection results.
 */
export const getAnomalies = async ({ userId, month } = {}) => {
  const { monthKey, currentTransactions, historicalTransactions, budget } =
    await fetchLedgerData({ userId, month });

  const anomalies = detectAnomaliesService(currentTransactions, budget, historicalTransactions);

  return {
    anomalies: anomalies.map((a) => ({
      anomalyType: a.anomalyType,
      severity: a.severity,
      transactionId: a.transactionId,
      title: a.title,
      merchant: a.merchant,
      category: a.category,
      amount: a.amount,
      transactionDate: a.transactionDate,
      reason: a.reason,
      baselineValue: a.baselineValue
    })),
    totalAnomaliesCount: anomalies.length,
    period: monthKey,
    provider: 'deterministic'
  };
};

/**
 * 7. getGoalStatus
 * Returns active goals enriched with deterministic progress and feasibility metrics.
 * Strictly read-only; never modifies goal records.
 */
export const getGoalStatus = async ({ userId, month } = {}) => {
  validateUserId(userId);
  const { monthKey, currentTransactions, budget, referenceDate } =
    await fetchLedgerData({ userId, month });

  const metrics = calculateFinancialMetrics(currentTransactions, budget);
  const netMonthlySavings = metrics.netSavings;

  const goalsQuery = Goal.find({
    userId,
    status: { $ne: 'cancelled' }
  });
  const goals = typeof goalsQuery?.sort === 'function'
    ? await goalsQuery.sort({ priority: -1, createdAt: -1 })
    : await goalsQuery;

  const enrichedGoals = (goals || []).map((g) => {
    const enriched = enrichGoalWithCalculations(g, { referenceDate, netMonthlySavings });
    return {
      id: enriched._id ? String(enriched._id) : undefined,
      title: enriched.title,
      targetAmount: enriched.targetAmount,
      currentAmount: enriched.currentAmount,
      progress: enriched.progressPercentage,
      progressPercentage: enriched.progressPercentage,
      remainingAmount: enriched.remainingAmount,
      monthsRemaining: enriched.monthsRemaining,
      requiredMonthlySavings: enriched.requiredMonthlySavings,
      feasibility: enriched.feasibility,
      status: enriched.status,
      isCompleted: enriched.isCompleted,
      isOverdue: enriched.isOverdue,
      targetDate: enriched.targetDate,
      category: enriched.category
    };
  });

  return {
    goals: enrichedGoals,
    activeGoalsCount: enrichedGoals.filter((g) => !g.isCompleted && g.status !== 'cancelled').length,
    netMonthlySavings,
    period: monthKey,
    provider: 'deterministic'
  };
};
