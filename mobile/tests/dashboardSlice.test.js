import dashboardReducer, {
  setPeriod,
  clearDashboardError,
  fetchDashboardData,
  computeFinancialAlerts,
  getCurrentMonthKey,
} from '../src/store/slices/dashboardSlice.js';

describe('FinTrack Mobile - Dashboard Slice & Calculation Logic', () => {
  const initialTestState = {
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

  it('should return initial state by default', () => {
    const state = dashboardReducer(undefined, { type: 'UNKNOWN_ACTION' });
    expect(state.data.totalIncome).toBe(0);
    expect(state.data.totalExpense).toBe(0);
    expect(state.period).toBe(getCurrentMonthKey());
    expect(state.isLoading).toBe(false);
  });

  it('should update period with setPeriod', () => {
    const nextState = dashboardReducer(initialTestState, setPeriod('previous_month'));
    expect(nextState.period).toBe('previous_month');
  });

  it('should clear error with clearDashboardError', () => {
    const stateWithError = { ...initialTestState, error: 'Network failure' };
    const nextState = dashboardReducer(stateWithError, clearDashboardError());
    expect(nextState.error).toBeNull();
  });

  it('should handle fetchDashboardData.pending for initial load vs refresh', () => {
    // Initial load
    let state = dashboardReducer(initialTestState, {
      type: fetchDashboardData.pending.type,
      meta: { arg: { isRefresh: false } },
    });
    expect(state.isLoading).toBe(true);
    expect(state.isRefreshing).toBe(false);

    // Refresh load
    state = dashboardReducer(initialTestState, {
      type: fetchDashboardData.pending.type,
      meta: { arg: { isRefresh: true } },
    });
    expect(state.isRefreshing).toBe(true);
  });

  it('should handle fetchDashboardData.fulfilled with valid metrics and update state', () => {
    const mockPayload = {
      totalIncome: 50000,
      totalExpense: 15000,
      savings: 35000,
      savingsRate: 70,
      budgetRemaining: 10000,
      monthlyBudget: 25000,
      categoryBudgets: [{ category: 'Food', limit: 8000 }],
      categoryBreakdown: [{ category: 'Food', amount: 6000, percentage: 40 }],
      monthlyTrend: [{ month: '2026-09', income: 50000, expense: 15000, savings: 35000 }],
      recentTransactions: [
        { title: 'Swiggy', amount: 480, type: 'expense', category: 'Food' },
      ],
      stagedCount: 2,
      alerts: [{ id: 'alert_pending_staged', title: 'Review Required' }],
      lastUpdated: '2026-09-26T15:00:00.000Z',
    };

    const state = dashboardReducer(initialTestState, {
      type: fetchDashboardData.fulfilled.type,
      payload: mockPayload,
    });

    expect(state.isLoading).toBe(false);
    expect(state.isRefreshing).toBe(false);
    expect(state.data.totalIncome).toBe(50000);
    expect(state.data.totalExpense).toBe(15000);
    expect(state.data.savings).toBe(35000);
    expect(state.data.savingsRate).toBe(70);
    expect(state.data.stagedCount).toBe(2);
    expect(state.data.recentTransactions.length).toBe(1);
    expect(state.alerts.length).toBe(1);
    expect(state.lastUpdated).toBe('2026-09-26T15:00:00.000Z');
  });

  it('should handle fetchDashboardData.rejected', () => {
    const state = dashboardReducer(initialTestState, {
      type: fetchDashboardData.rejected.type,
      payload: 'Server error fetching dashboard summary',
    });

    expect(state.isLoading).toBe(false);
    expect(state.isRefreshing).toBe(false);
    expect(state.error).toBe('Server error fetching dashboard summary');
  });

  describe('computeFinancialAlerts (Grounded Logic)', () => {
    it('should generate staged transactions alert when stagedCount > 0', () => {
      const alerts = computeFinancialAlerts({ stagedCount: 3 });
      const stagedAlert = alerts.find((a) => a.id === 'alert_pending_staged');
      expect(stagedAlert).toBeDefined();
      expect(stagedAlert.message).toContain('3 financial events detected');
    });

    it('should generate budget exceeded alert when totalExpense > monthlyBudget', () => {
      const alerts = computeFinancialAlerts({
        totalIncome: 30000,
        totalExpense: 26000,
        monthlyBudget: 25000,
      });
      const budgetAlert = alerts.find((a) => a.id === 'alert_budget_exceeded');
      expect(budgetAlert).toBeDefined();
      expect(budgetAlert.type).toBe('danger');
    });

    it('should generate budget warning when utilization is >= 80%', () => {
      const alerts = computeFinancialAlerts({
        totalIncome: 30000,
        totalExpense: 21000,
        monthlyBudget: 25000, // 84% utilization
      });
      const budgetWarning = alerts.find((a) => a.id === 'alert_budget_warning');
      expect(budgetWarning).toBeDefined();
      expect(budgetWarning.type).toBe('warning');
    });

    it('should generate negative savings alert when expenses exceed income', () => {
      const alerts = computeFinancialAlerts({
        totalIncome: 10000,
        totalExpense: 14000,
      });
      const negativeAlert = alerts.find((a) => a.id === 'alert_negative_savings');
      expect(negativeAlert).toBeDefined();
      expect(negativeAlert.type).toBe('danger');
    });

    it('should generate category budget exceeded alert', () => {
      const alerts = computeFinancialAlerts({
        categoryBudgets: [{ category: 'Food', limit: 5000 }],
        categoryBreakdown: [{ category: 'Food', amount: 6200 }],
      });
      const catAlert = alerts.find((a) => a.id === 'alert_cat_budget_Food');
      expect(catAlert).toBeDefined();
      expect(catAlert.message).toContain('6,200');
    });

    it('should handle zero metrics without generating spurious alerts', () => {
      const alerts = computeFinancialAlerts({
        totalIncome: 0,
        totalExpense: 0,
        monthlyBudget: 0,
        stagedCount: 0,
      });
      expect(alerts.length).toBe(0);
    });
  });

  describe('Phase 6.1 Banking Intelligence Harmonization (September 2026)', () => {
    it('should correctly set Home financial KPIs for 2026-09 matching Insights exactly', () => {
      const septPayload = {
        totalIncome: 625,
        totalExpense: 1075,
        savings: -450,
        savingsRate: -72,
        budgetRemaining: -450,
        monthlyBudget: 0,
        categoryBudgets: [],
        categoryBreakdown: [
          { category: 'Other', amount: 600, percentage: 55.81 },
          { category: 'Shopping', amount: 475, percentage: 44.19 },
        ],
        monthlyTrend: [{ month: '2026-09', income: 625, expense: 1075, savings: -450 }],
        recentTransactions: [],
        stagedCount: 0,
        period: '2026-09',
        alerts: [
          {
            id: 'alert_negative_savings',
            type: 'danger',
            title: 'Negative Net Savings',
            message: 'Your expenses exceed your recorded income by ₹450 for this period.',
            priority: 4,
          },
        ],
        lastUpdated: '2026-09-27T18:00:00.000Z',
      };

      const state = dashboardReducer(initialTestState, {
        type: fetchDashboardData.fulfilled.type,
        payload: septPayload,
      });

      // 1. Home uses selected/current month intelligence data
      expect(state.period).toBe('2026-09');

      // 2. September 2026 exact KPI values
      expect(state.data.totalIncome).toBe(625);
      expect(state.data.totalExpense).toBe(1075);
      expect(state.data.savings).toBe(-450);
      expect(state.data.savingsRate).toBe(-72);

      // 3. Category spending uses confirmed-only September intelligence
      expect(state.data.categoryBreakdown).toEqual([
        { category: 'Other', amount: 600, percentage: 55.81 },
        { category: 'Shopping', amount: 475, percentage: 44.19 },
      ]);

      // 4. Staged transactions do not affect Home KPIs
      expect(state.data.stagedCount).toBe(0);

      // 5. Negative savings alert instead of lifetime positive rate
      expect(state.alerts.some((a) => a.id === 'alert_negative_savings')).toBe(true);
      expect(state.alerts.some((a) => a.id === 'alert_healthy_savings')).toBe(false);
    });

    it('should handle an empty month with zero metrics and empty category breakdown', () => {
      const emptyPayload = {
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
        period: '2026-01',
        alerts: [],
        lastUpdated: '2026-09-27T18:00:00.000Z',
      };

      const state = dashboardReducer(initialTestState, {
        type: fetchDashboardData.fulfilled.type,
        payload: emptyPayload,
      });

      expect(state.data.totalIncome).toBe(0);
      expect(state.data.totalExpense).toBe(0);
      expect(state.data.savings).toBe(0);
      expect(state.data.savingsRate).toBe(0);
      expect(state.data.categoryBreakdown).toHaveLength(0);
      expect(state.alerts).toHaveLength(0);
    });

    it('should set error state and not alter KPIs on API failure (no silent fallback to legacy numbers)', () => {
      const stateBefore = {
        ...initialTestState,
        data: {
          ...initialTestState.data,
          totalIncome: 0,
          totalExpense: 0,
        },
      };

      const stateAfter = dashboardReducer(stateBefore, {
        type: fetchDashboardData.rejected.type,
        payload: 'Unable to connect to intelligence service.',
      });

      expect(stateAfter.isLoading).toBe(false);
      expect(stateAfter.error).toBe('Unable to connect to intelligence service.');
      expect(stateAfter.data.totalIncome).toBe(0);
      expect(stateAfter.data.totalExpense).toBe(0);
    });
  });
});
