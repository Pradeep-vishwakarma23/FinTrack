import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Text,
  Header,
  ErrorBanner,
} from '../../components/index.js';
import {
  FinancialHealthHero,
  ExpenseForecastCard,
  BudgetVelocityRiskCard,
  SpendingAnomaliesSection,
  TopMerchantsSection,
  CategoryUtilizationSection,
  RecurringCommitmentsSection,
  TrendOverviewSection,
  MonthPickerModal,
  AIAdvisorSection,
  ActionPlanSection,
} from '../../components/insights/index.js';
import {
  ProactiveInsightBanner,
  FloatingCopilotButton,
} from '../../components/copilot/index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import {
  fetchIntelligenceData,
  fetchTrends,
  setPeriod,
  setTrendsRange,
  clearIntelligenceError,
} from '../../store/slices/intelligenceSlice.js';
import {
  setCopilotMonth,
  explainCopilotMetric,
} from '../../store/slices/copilotSlice.js';
import {
  fetchActionPlans,
  generateActionPlans,
  completeActionPlan,
  dismissActionPlan,
  clearActionPlanError,
  clearGenerateSummary,
} from '../../store/slices/actionPlanSlice.js';

export const InsightsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    summary,
    merchants,
    anomalies,
    forecast,
    subscriptions,
    subscriptionsSummary,
    trends,
    trendsRange,
    period,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
  } = useSelector((state) => state.intelligence);

  const {
    items: actionPlansList = [],
    isLoading: actionPlansLoading = false,
    isGenerating: actionPlansGenerating = false,
    generateSummary: actionPlanSummary = null,
    actionLoadingId = null,
    actionError: actionPlanError = null,
  } = useSelector((state) => state.actionPlans || {});

  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const loadData = useCallback(
    (isRefresh = false) => {
      dispatch(fetchIntelligenceData({ month: period, isRefresh }));
      dispatch(fetchActionPlans({ isRefresh }));
      dispatch(setCopilotMonth(period));
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

  const handleSelectMonth = (newMonth) => {
    if (newMonth && newMonth !== period) {
      dispatch(setPeriod(newMonth));
      dispatch(setCopilotMonth(newMonth));
      dispatch(fetchIntelligenceData({ month: newMonth }));
    }
  };

  const handleRangeChange = (newRange) => {
    dispatch(setTrendsRange(newRange));
    dispatch(fetchTrends({ range: newRange, referenceMonth: period }));
  };

  const handleExplain = ({ contextType, itemData = {} }) => {
    dispatch(
      explainCopilotMetric({
        contextType,
        month: period,
        itemData,
      })
    );
  };

  const metrics = summary?.metrics || {};
  const categorySpending = summary?.categorySpending || [];
  const topMerchantsList = merchants.length > 0 ? merchants : summary?.topMerchants || [];
  const anomaliesList = anomalies.length > 0 ? anomalies : summary?.anomalies || [];
  const activeForecast = forecast || summary?.forecast || {};

  if (isLoading && !summary && !lastUpdated) {
    return (
      <Container scrollable safeArea={true} contentContainerStyle={styles.container}>
        <Header
          title="Banking Intelligence"
          subtitle="Real-time analytics, anomalies & forecasts"
          showBrand={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.loadingText}>
            Synthesizing financial intelligence & predictive models...
          </Text>
        </View>
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.container}
      >
        {/* 1. Header */}
        <Header
          title="Banking Intelligence"
          subtitle="Real-time analytics, anomalies & forecasts"
          showBrand={true}
        />

        {/* 2. Period Row & Refresh Indicator */}
        <View style={styles.periodRow}>
          <TouchableOpacity
            style={styles.periodPill}
            onPress={() => setIsPickerVisible(true)}
            activeOpacity={0.75}
            testID="period-pill-btn"
          >
            <Text variant="caption" color={colors.primary} weight="bold">
              📅 {period || 'Current Month'} ▾
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {navigation?.navigate && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Reports')}
                activeOpacity={0.7}
                style={styles.periodPill}
                testID="view-reports-btn"
              >
                <Text variant="caption" color={colors.secondary} weight="semibold">
                  📄 Full Report
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleRefresh} activeOpacity={0.7} testID="refresh-intelligence-btn">
              <Text variant="caption" color={colors.textMuted}>
                {isRefreshing ? 'Syncing...' : '↻'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Banner */}
        {error && (
          <ErrorBanner
            message={error}
            onRetry={() => loadData(false)}
            onDismiss={() => dispatch(clearIntelligenceError())}
          />
        )}

        {/* Proactive Financial Insights Banner */}
        <ProactiveInsightBanner month={period} style={styles.proactiveSection} />

        {/* 3. Financial Health Hero Card */}
        <FinancialHealthHero
          metrics={metrics}
          onExplain={() => handleExplain({ contextType: 'savings_rate' })}
        />

        {/* 4. Expense Forecast Card */}
        <ExpenseForecastCard
          forecast={activeForecast}
          onExplain={() => handleExplain({ contextType: 'forecast' })}
        />

        {/* 5. Budget Velocity & Risk Card */}
        <BudgetVelocityRiskCard
          forecast={activeForecast}
          onExplain={() => handleExplain({ contextType: 'budget_velocity' })}
        />

        {/* 6. Spending Anomalies */}
        <SpendingAnomaliesSection
          anomalies={anomaliesList}
          onExplain={(item) => handleExplain({ contextType: 'anomaly', itemData: item })}
        />

        {/* 7. Top Merchants & Payees */}
        <TopMerchantsSection
          merchants={topMerchantsList}
          onExplain={(item) => handleExplain({ contextType: 'merchant', itemData: item })}
        />

        {/* 8. Category Spending & Budget Limits */}
        <CategoryUtilizationSection
          categories={categorySpending}
          onExplain={(item) => handleExplain({ contextType: 'category', itemData: item })}
        />

        {/* 9. Recurring Subscriptions & Fixed Obligations */}
        <RecurringCommitmentsSection
          subscriptions={subscriptions}
          summary={subscriptionsSummary}
          onExplain={(item) => handleExplain({ contextType: 'subscriptions', itemData: item })}
        />

        {/* 10. Multi-Month Financial Trends & Comparative Intelligence */}
        <TrendOverviewSection
          trends={trends}
          range={trendsRange}
          onRangeChange={handleRangeChange}
          onExplain={(item) => handleExplain({ contextType: 'trends', itemData: item })}
        />

        {/* 11. AI-Powered Financial Action Plans (Phase 7.5) */}
        <ActionPlanSection
          plans={actionPlansList}
          isLoading={actionPlansLoading}
          isGenerating={actionPlansGenerating}
          generateSummary={actionPlanSummary}
          actionLoadingId={actionLoadingId}
          actionError={actionPlanError}
          onGenerate={() => dispatch(generateActionPlans())}
          onComplete={(id) => dispatch(completeActionPlan(id))}
          onDismiss={(id) => dispatch(dismissActionPlan(id))}
          onClearError={() => dispatch(clearActionPlanError())}
          onClearSummary={() => dispatch(clearGenerateSummary())}
          onExplain={(item) => handleExplain({ contextType: 'action_plan', itemData: item })}
        />

        {/* 12. Real AI Financial Advisor (Powered by Gemini) */}
        <AIAdvisorSection period={period} />

        {/* 13. Interactive Month Picker Modal */}
        <MonthPickerModal
          visible={isPickerVisible}
          currentPeriod={period}
          onSelect={handleSelectMonth}
          onClose={() => setIsPickerVisible(false)}
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
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    textAlign: 'center',
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  periodPill: {
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
});

export default InsightsScreen;
