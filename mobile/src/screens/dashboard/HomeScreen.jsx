import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  ErrorBanner,
} from '../../components/index.js';
import {
  MobileFinancialHero,
  FinancialSummaryCards,
  PendingDetectedBanner,
  FinancialAlertsSection,
  CategorySpendingSection,
  SpendingTrendSection,
  BudgetProgressSection,
  RecentTransactionsSection,
  DashboardSkeleton,
} from '../../components/dashboard/index.js';
import {
  ProactiveInsightBanner,
  FloatingCopilotButton,
} from '../../components/copilot/index.js';
import { MonthPickerModal } from '../../components/insights/index.js';
import { colors, spacing } from '../../theme/index.js';
import {
  fetchDashboardData,
  setPeriod,
  clearDashboardError,
} from '../../store/slices/dashboardSlice.js';

export const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    data,
    alerts,
    period,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
  } = useSelector((state) => state.dashboard);

  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);

  const loadData = useCallback(
    (isRefresh = false) => {
      dispatch(fetchDashboardData({ month: period, isRefresh }));
    },
    [dispatch, period]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const handleRefresh = () => {
    if (!isRefreshing) {
      loadData(true);
    }
  };

  const handleNavigateToReview = () => {
    navigation.navigate('StagedReview', { batchId: 'all' });
  };

  const handleSelectMonth = (newMonth) => {
    if (newMonth && newMonth !== period) {
      dispatch(setPeriod(newMonth));
      dispatch(fetchDashboardData({ month: newMonth, isRefresh: false }));
    }
  };

  if (isLoading && !data?.totalIncome && !data?.totalExpense && !lastUpdated) {
    return (
      <Container scrollable safeArea={true} contentContainerStyle={styles.container}>
        <DashboardSkeleton />
      </Container>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <Container
        scrollable
        safeArea={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.mint}
            colors={[colors.mint, colors.primary]}
          />
        }
        contentContainerStyle={styles.container}
      >
        {/* 1. Large Editorial Financial Hero & Period Control */}
        <MobileFinancialHero
          user={user}
          period={period}
          isRefreshing={isRefreshing}
          onOpenMonthPicker={() => setIsMonthPickerVisible(true)}
          onRefresh={handleRefresh}
          onAvatarPress={() => navigation.navigate('Profile')}
        />

        {/* Error Banner if API Fails */}
        {error && (
          <ErrorBanner
            message={error}
            onRetry={() => loadData(false)}
            onDismiss={() => dispatch(clearDashboardError())}
          />
        )}

        {/* 2. Pending Detected Transactions Banner */}
        <PendingDetectedBanner
          stagedCount={data.stagedCount}
          onReviewPress={handleNavigateToReview}
        />

        {/* 3. Proactive Financial Intelligence Banner */}
        <ProactiveInsightBanner month={period} style={styles.proactiveSection} />

        {/* 4. Financial Position Hero & 4 Core KPI Cards */}
        <FinancialSummaryCards
          totalIncome={data.totalIncome}
          totalExpense={data.totalExpense}
          savings={data.savings}
          savingsRate={data.savingsRate}
        />

        {/* 5. Financial Alerts */}
        <FinancialAlertsSection alerts={alerts} />

        {/* 6. Category Spending Breakdown */}
        <CategorySpendingSection
          categoryBreakdown={data.categoryBreakdown}
          totalExpense={data.totalExpense}
        />

        {/* 7. Monthly Spending Trend */}
        <SpendingTrendSection monthlyTrend={data.monthlyTrend} />

        {/* 8. Budget Progress */}
        <BudgetProgressSection
          monthlyBudget={data.monthlyBudget}
          totalExpense={data.totalExpense}
          budgetRemaining={data.budgetRemaining}
          categoryBudgets={data.categoryBudgets}
          categoryBreakdown={data.categoryBreakdown}
        />

        {/* 9. Recent Transactions */}
        <RecentTransactionsSection
          transactions={data.recentTransactions}
          onViewAllPress={() => navigation.navigate('Transactions')}
        />

        {/* Month Picker Modal */}
        <MonthPickerModal
          visible={isMonthPickerVisible}
          currentPeriod={period}
          onSelect={handleSelectMonth}
          onClose={() => setIsMonthPickerVisible(false)}
        />
      </Container>

      {/* Floating Copilot Launcher */}
      <FloatingCopilotButton />
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingVertical: spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? 220 : 200,
  },
  proactiveSection: {
    marginBottom: spacing.md,
  },
});

export default HomeScreen;
