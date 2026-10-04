import { buildGroundedContext, isValidMonthFormat } from './aiAdvisorService.js';
import { detectRecurringSubscriptions } from './subscriptionService.js';
import { calculateMultiMonthTrends } from './trendIntelligenceService.js';
import ActionPlan from '../models/ActionPlan.js';

/**
 * Pure deterministic Proactive Financial Insights service.
 * Operates strictly on verified Banking Intelligence facts.
 * Read-only with zero database mutation.
 */

/**
 * Evaluates deterministic triggers and generates ordered proactive alerts.
 */
export const getProactiveInsights = async ({ userId, month }) => {
  const targetMonth = (month && isValidMonthFormat(month))
    ? month
    : new Date().toISOString().slice(0, 7);

  const context = await buildGroundedContext({ userId, month: targetMonth });

  // Handle empty or zero-transaction month
  if (context.transactionCount === 0) {
    return {
      period: context.period,
      count: 0,
      data: []
    };
  }

  const insights = [];
  const metrics = context.metrics;
  const topCategory = context.categorySpending?.[0] || null;
  const anomalies = context.anomalies || [];
  const forecast = context.forecast || {};

  // -----------------------------------------------------------------
  // 1. NET DEFICIT TRIGGER (Priority 1: Danger)
  // -----------------------------------------------------------------
  if (metrics.netSavings < 0) {
    insights.push({
      id: 'insight_deficit_alert',
      type: 'danger',
      title: 'Active Cash Deficit',
      message: `For ${context.period}, your verified ledger shows a net deficit of -₹${Math.abs(metrics.netSavings).toLocaleString('en-IN')} (${metrics.savingsRate}% savings rate) because expenses (₹${metrics.totalExpense.toLocaleString('en-IN')}) exceeded income (₹${metrics.totalIncome.toLocaleString('en-IN')}).`,
      priority: 1,
      actionLabel: 'Explore Action Plan'
    });
  }

  // -----------------------------------------------------------------
  // 2. FORECAST RISK TRIGGER (Priority 1: Danger)
  // -----------------------------------------------------------------
  if (forecast.riskLevel === 'HIGH_RISK' || forecast.riskLevel === 'CRITICAL') {
    insights.push({
      id: 'insight_forecast_risk',
      type: 'danger',
      title: 'Budget Overrun Risk',
      message: `At your current burn velocity of ₹${forecast.dailyBurnRate.toLocaleString('en-IN')}/day, projected month-end expenses of ₹${forecast.projectedExpense.toLocaleString('en-IN')} present a critical budget overrun risk.`,
      priority: 1,
      actionLabel: 'Adjust Daily Budget'
    });
  }

  // -----------------------------------------------------------------
  // 3. ANOMALY DETECTED TRIGGER (Priority 2: Warning)
  // -----------------------------------------------------------------
  if (anomalies.length > 0) {
    const topAnom = anomalies[0];
    insights.push({
      id: 'insight_anomaly_detected',
      type: 'warning',
      title: 'Unusual Spending Detected',
      message: `Detected ${anomalies.length} statistical anomaly: '${topAnom.title}' (₹${topAnom.amount.toLocaleString('en-IN')}) in category '${topAnom.category}'. Reason: ${topAnom.reason}`,
      priority: 2,
      actionLabel: 'Review Anomalies'
    });
  }

  // -----------------------------------------------------------------
  // 4. CATEGORY CONCENTRATION TRIGGER (Priority 2: Warning)
  // -----------------------------------------------------------------
  if (topCategory && topCategory.percentage > 40 && topCategory.amount > 0) {
    insights.push({
      id: 'insight_category_concentration',
      type: 'warning',
      title: 'High Category Concentration',
      message: `'${topCategory.category}' accounts for ${topCategory.percentage}% of your total expenses (₹${topCategory.amount.toLocaleString('en-IN')}). High single-category concentration elevates cash flow volatility.`,
      priority: 2,
      actionLabel: 'View Category Breakdown'
    });
  }

  // -----------------------------------------------------------------
  // 5. SAVINGS MILESTONE TRIGGER (Priority 3: Success)
  // -----------------------------------------------------------------
  if (metrics.savingsRate >= 40 && metrics.totalIncome > 0 && metrics.netSavings > 0) {
    insights.push({
      id: 'insight_savings_milestone',
      type: 'success',
      title: 'Savings Milestone Reached',
      message: `Excellent financial discipline! In ${context.period}, you achieved a ${metrics.savingsRate}% savings rate, retaining ₹${metrics.netSavings.toLocaleString('en-IN')} in net surplus.`,
      priority: 3,
      actionLabel: 'Allocate to Goals'
    });
  }

  // -----------------------------------------------------------------
  // 6. RECURRING SUBSCRIPTIONS & OBLIGATIONS TRIGGERS
  // -----------------------------------------------------------------
  try {
    const recurringData = await detectRecurringSubscriptions({ userId });
    const subs = recurringData?.subscriptions || [];
    const summary = recurringData?.summary || {};

    // Price increase alert (Priority 2: Warning)
    const priceIncreaseSub = subs.find((s) => s.priceIncreaseDetected);
    if (priceIncreaseSub) {
      insights.push({
        id: `insight_sub_price_increase_${priceIncreaseSub.normalizedMerchant}`,
        type: 'warning',
        title: 'Subscription Price Increase',
        message: `Detected a potential price hike for '${priceIncreaseSub.merchant}': recent payment was ₹${priceIncreaseSub.latestAmount.toLocaleString('en-IN')} (+₹${priceIncreaseSub.amountChange.toLocaleString('en-IN')}, +${priceIncreaseSub.percentageChange}%).`,
        priority: 2,
        actionLabel: 'Review Subscriptions'
      });
    }

    // High fixed recurring burden (Priority 2: Warning)
    if (metrics.totalExpense > 0 && summary.estimatedMonthlyRecurringCost > 0) {
      const recurringRatio = (summary.estimatedMonthlyRecurringCost / metrics.totalExpense) * 100;
      if (recurringRatio >= 35 && summary.totalRecurringCommitments >= 2) {
        insights.push({
          id: 'insight_high_recurring_burden',
          type: 'warning',
          title: 'High Fixed Obligations',
          message: `Fixed recurring payments (₹${summary.estimatedMonthlyRecurringCost.toLocaleString('en-IN')}/mo across ${summary.totalRecurringCommitments} commitments) account for ${Math.round(recurringRatio)}% of your monthly expenditure.`,
          priority: 2,
          actionLabel: 'Audit Subscriptions'
        });
      }
    }
  } catch (subErr) {
    // Non-blocking
  }

  // -----------------------------------------------------------------
  // 7. MULTI-MONTH TRENDS & MOMENTUM TRIGGERS
  // -----------------------------------------------------------------
  try {
    const trendData = await calculateMultiMonthTrends({ userId, referenceMonth: targetMonth, range: '6m' });
    const mom = trendData?.comparison || {};
    const momentum = trendData?.momentum || {};

    // Expense growth warning (requires previous month spending > 0)
    if (
      mom.expenses?.previous > 0 &&
      mom.expenses?.change >= 500 &&
      mom.expenses?.percentageChange >= 20
    ) {
      insights.push({
        id: 'insight_trend_expense_spike',
        type: 'warning',
        title: 'Month-over-Month Expense Spike',
        message: `Your spending in ${context.period} increased by ₹${mom.expenses.change.toLocaleString('en-IN')} (+${mom.expenses.percentageChange}%) compared to ${mom.previousMonth}.`,
        priority: 2,
        actionLabel: 'View Spending Trends'
      });
    }

    // Savings momentum improving milestone (requires active multi-month baseline)
    if (
      momentum.state === 'IMPROVING' &&
      momentum.activeMonthsCount >= 2 &&
      mom.savings?.previous !== undefined &&
      mom.savings?.change > 0 &&
      metrics.netSavings > 0
    ) {
      insights.push({
        id: 'insight_trend_savings_momentum',
        type: 'success',
        title: 'Positive Savings Momentum',
        message: `Your savings momentum is improving with a +₹${mom.savings.change.toLocaleString('en-IN')} month-over-month increase in net surplus for ${context.period}.`,
        priority: 3,
        actionLabel: 'View Trends'
      });
    }
  } catch (trendErr) {
    // Non-blocking
  }

  // -----------------------------------------------------------------
  // 7. ACTIVE ACTION PLANS TRIGGER (Priority 2: Info)
  // -----------------------------------------------------------------
  try {
    const activePlans = await ActionPlan.find({ userId, status: 'ACTIVE' }).limit(5);
    if (activePlans.length > 0) {
      const totalImpact = activePlans.reduce((sum, p) => sum + (p.monthlyImpact || 0), 0);
      insights.push({
        id: 'insight_active_action_plans',
        type: 'info',
        title: 'Action Plans Available',
        message: `You have ${activePlans.length} active financial action plan(s) with a potential monthly impact of ₹${totalImpact.toLocaleString('en-IN')}.`,
        priority: 2,
        actionLabel: 'View Action Plans'
      });
    }
  } catch (planErr) {
    // Non-blocking
  }

  // Deterministic stable sorting: Priority (1 > 2 > 3), then id ascending
  insights.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.id.localeCompare(b.id);
  });

  return {
    period: context.period,
    count: insights.length,
    data: insights
  };
};
