import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dashboardService from '../../services/dashboardService.js';
import intelligenceService from '../../services/intelligenceService.js';

export const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Generate explainable, data-grounded financial alerts from actual metrics
 */
export const computeFinancialAlerts = ({
  totalIncome = 0,
  totalExpense = 0,
  monthlyBudget = 0,
  categoryBreakdown = [],
  categoryBudgets = [],
  stagedCount = 0,
}) => {
  const alerts = [];

  // 1. Pending Detected Transactions Alert
  if (stagedCount > 0) {
    alerts.push({
      id: 'alert_pending_staged',
      type: 'warning',
      title: 'Transactions Waiting for Review',
      message: `${stagedCount} financial ${stagedCount === 1 ? 'event' : 'events'} detected and staged for verification.`,
      actionLabel: 'Review',
      priority: 1,
    });
  }

  // 2. Budget Overrun / High Utilization Alert
  if (monthlyBudget > 0) {
    const budgetUsedPercent = Math.round((totalExpense / monthlyBudget) * 100);
    if (totalExpense > monthlyBudget) {
      alerts.push({
        id: 'alert_budget_exceeded',
        type: 'danger',
        title: 'Monthly Budget Exceeded',
        message: `Total spending (₹${totalExpense.toLocaleString('en-IN')}) has exceeded your monthly budget of ₹${monthlyBudget.toLocaleString('en-IN')}.`,
        priority: 2,
      });
    } else if (budgetUsedPercent >= 80) {
      alerts.push({
        id: 'alert_budget_warning',
        type: 'warning',
        title: 'Budget Limit Approaching',
        message: `You have utilized ${budgetUsedPercent}% of your ₹${monthlyBudget.toLocaleString('en-IN')} monthly budget.`,
        priority: 3,
      });
    }
  }

  // 3. Negative Cashflow Alert
  if (totalIncome > 0 && totalExpense > totalIncome) {
    alerts.push({
      id: 'alert_negative_savings',
      type: 'danger',
      title: 'Negative Net Savings',
      message: `Your expenses exceed your recorded income by ₹${(totalExpense - totalIncome).toLocaleString('en-IN')} for this period.`,
      priority: 4,
    });
  }

  // 4. Category Budget Overruns
  if (Array.isArray(categoryBudgets) && categoryBudgets.length > 0) {
    categoryBudgets.forEach((cb) => {
      const catSpend = categoryBreakdown.find((c) => c.category?.toLowerCase() === cb.category?.toLowerCase());
      if (catSpend && catSpend.amount > cb.limit) {
        alerts.push({
          id: `alert_cat_budget_${cb.category}`,
          type: 'warning',
          title: `${cb.category} Budget Exceeded`,
          message: `Spent ₹${catSpend.amount.toLocaleString('en-IN')} vs category budget of ₹${cb.limit.toLocaleString('en-IN')}.`,
          priority: 5,
        });
      }
    });
  }

  // 5. Positive Savings Milestone
  if (totalIncome > 0 && totalExpense < totalIncome) {
    const savingsRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
    if (savingsRate >= 40) {
      alerts.push({
        id: 'alert_healthy_savings',
        type: 'success',
        title: 'Strong Savings Rate',
        message: `You have saved ${savingsRate}% of your income this period. Keep it up!`,
        priority: 6,
      });
    }
  }

  return alerts;
};

// Async thunk to fetch dashboard data unified with Phase 6.1 Banking Intelligence
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async ({ month, isRefresh = false } = {}, { rejectWithValue }) => {
    try {
      const monthParam = month || getCurrentMonthKey();

      const [intelligenceRes, dashboardRes] = await Promise.all([
        intelligenceService.getSummary(monthParam),
        dashboardService.getSummary(monthParam),
      ]);

      const intData = intelligenceRes?.data || intelligenceRes;
      const dashData = dashboardRes?.data || dashboardRes;

      const metrics = intData?.metrics || {};
      const categorySpending = intData?.categorySpending || [];

      // Authoritative monthly financial metrics from Banking Intelligence (Phase 6.1)
      const totalIncome = Number(metrics.totalIncome !== undefined ? metrics.totalIncome : dashData?.totalIncome || 0);
      const totalExpense = Number(metrics.totalExpense !== undefined ? metrics.totalExpense : dashData?.totalExpense || 0);
      const savings = Number(
        metrics.netSavings !== undefined
          ? metrics.netSavings
          : dashData?.savings !== undefined
          ? dashData.savings
          : totalIncome - totalExpense
      );
      const savingsRate = Number(
        metrics.savingsRate !== undefined
          ? metrics.savingsRate
          : dashData?.savingsRate !== undefined
          ? dashData.savingsRate
          : totalIncome > 0
          ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
          : 0
      );
      const monthlyBudget = Number(metrics.monthlyBudget !== undefined ? metrics.monthlyBudget : dashData?.monthlyBudget || 0);
      const budgetRemaining = Number(
        metrics.budgetRemaining !== undefined
          ? metrics.budgetRemaining
          : dashData?.budgetRemaining !== undefined
          ? dashData.budgetRemaining
          : monthlyBudget > 0
          ? monthlyBudget - totalExpense
          : savings
      );

      // Category breakdown from Banking Intelligence (Phase 6.1)
      const categoryBreakdown = (categorySpending.length > 0 ? categorySpending : dashData?.categoryBreakdown || []).map((c) => ({
        category: c.category,
        amount: Number(c.amount || 0),
        percentage: Number(c.percentage || 0),
        budgetLimit: Number(c.budgetLimit || 0),
        budgetUtilization: Number(c.budgetUtilization || 0),
        isOverBudget: Boolean(c.isOverBudget),
      }));

      const categoryBudgets = Array.isArray(dashData?.categoryBudgets) ? dashData.categoryBudgets : [];
      const monthlyTrend = Array.isArray(dashData?.monthlyTrend) ? dashData.monthlyTrend : [];
      const recentTransactions = Array.isArray(dashData?.recentTransactions) ? dashData.recentTransactions : [];
      const stagedCount = Number(dashData?.stagedCount || 0);

      const alerts = computeFinancialAlerts({
        totalIncome,
        totalExpense,
        monthlyBudget,
        categoryBreakdown,
        categoryBudgets,
        stagedCount,
      });

      return {
        totalIncome,
        totalExpense,
        savings,
        savingsRate,
        budgetRemaining,
        monthlyBudget,
        categoryBudgets,
        categoryBreakdown,
        monthlyTrend,
        recentTransactions,
        stagedCount,
        alerts,
        period: monthParam,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(
        error?.message || 'Unable to load your financial data. Please try again.'
      );
    }
  }
);

const initialState = {
  data: {
    totalIncome: 0,
    totalExpense: 0,
    savings: 0,
    savingsRate: 0,
    budgetRemaining: 0,
    monthlyBudget: 0,
    categoryBudgets: [],
    categoryBreakdown: [],
    monthlyTrend: [],
    recentTransactions: [],
    stagedCount: 0,
  },
  alerts: [],
  period: getCurrentMonthKey(),
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,
};

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setPeriod: (state, action) => {
      state.period = action.payload;
    },
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state, action) => {
        if (action.meta.arg?.isRefresh) {
          state.isRefreshing = true;
        } else if (!state.lastUpdated) {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.data = {
          totalIncome: action.payload.totalIncome,
          totalExpense: action.payload.totalExpense,
          savings: action.payload.savings,
          savingsRate: action.payload.savingsRate,
          budgetRemaining: action.payload.budgetRemaining,
          monthlyBudget: action.payload.monthlyBudget,
          categoryBudgets: action.payload.categoryBudgets,
          categoryBreakdown: action.payload.categoryBreakdown,
          monthlyTrend: action.payload.monthlyTrend,
          recentTransactions: action.payload.recentTransactions,
          stagedCount: action.payload.stagedCount,
        };
        state.alerts = action.payload.alerts;
        state.period = action.payload.period;
        state.lastUpdated = action.payload.lastUpdated;
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload;
      });
  },
});

export const { setPeriod, clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
