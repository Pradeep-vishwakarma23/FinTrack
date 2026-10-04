import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
  Linking,
} from 'react-native';
import {
  Container,
  Text,
  Header,
  Card,
  Badge,
  Button,
  ErrorBanner,
  LoadingIndicator,
} from '../../components/index.js';
import { MonthPickerModal } from '../../components/insights/index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import reportService from '../../services/reportService.js';

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const ReportsScreen = ({ navigation }) => {
  const [period, setPeriod] = useState(getCurrentMonthKey());
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const fetchReportData = useCallback(async (targetMonth = period, isPullRefresh = false) => {
    try {
      if (isPullRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const res = await reportService.getMonthlyReport(targetMonth);
      if (res && res.data) {
        setReport(res.data);
      } else {
        setReport(null);
      }
    } catch (err) {
      console.warn('[ReportsScreen] Error fetching report:', err?.message || err);
      setError(err?.message || 'Failed to load report for the selected month.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReportData(period, false);
  }, [fetchReportData, period]);

  const handleSelectMonth = (newMonth) => {
    if (newMonth && newMonth !== period) {
      setPeriod(newMonth);
    }
  };

  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    try {
      setIsDownloading(true);
      const downloadResult = await reportService.downloadMonthlyReportPDF(period);

      if (downloadResult && downloadResult.success) {
        const targetUri = downloadResult.shareUri || downloadResult.uri;

        const sharePdfFile = async () => {
          try {
            await Share.share({
              title: downloadResult.filename,
              message: `FinTrack Financial Statement for ${period}`,
              url: targetUri,
            });
          } catch (shareErr) {
            console.warn('[ReportsScreen] Share error:', shareErr?.message || shareErr);
          }
        };

        const openPdfFile = async () => {
          try {
            await Linking.openURL(targetUri);
          } catch (openErr) {
            console.warn('[ReportsScreen] Linking.openURL error:', openErr?.message || openErr);
            Alert.alert(
              'Unable to Open PDF',
              'Unable to open the PDF. The report is still available to share.',
              [
                {
                  text: 'Share',
                  onPress: sharePdfFile,
                },
                {
                  text: 'OK',
                  style: 'cancel',
                },
              ]
            );
          }
        };

        const isUserStorage = Boolean(downloadResult.savedToUserStorage);
        const dialogTitle = isUserStorage ? 'Report Exported' : 'Report Ready';
        const dialogMessage = isUserStorage
          ? `Financial statement for ${period} saved successfully (${downloadResult.filename}).`
          : `Financial statement for ${period} is ready in FinTrack documents (${downloadResult.filename}).`;

        Alert.alert(
          dialogTitle,
          dialogMessage,
          [
            {
              text: 'Open PDF',
              onPress: openPdfFile,
            },
            {
              text: 'Share',
              onPress: sharePdfFile,
            },
            {
              text: 'Done',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (err) {
      console.warn('[ReportsScreen] Error downloading PDF report:', err?.message || err);
      Alert.alert(
        'Export Failed',
        'Unable to download report. Please try again.'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const summary = report?.summary || {
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    savingsRate: 0,
  };
  const categories = report?.categories || [];
  const merchants = report?.merchants || [];
  const budget = report?.budget;
  const trends = report?.trends;
  const recurring = report?.recurring || [];
  const goals = report?.goals || [];
  const actionPlans = report?.actionPlans || [];
  const anomalies = report?.anomalies || [];
  const transactions = report?.transactions || [];
  const txSummary = report?.transactionSummary || {
    incomeTransactions: 0,
    expenseTransactions: 0,
    transferTransactions: 0,
    totalTransactions: 0,
  };

  return (
    <View style={styles.screenWrapper}>
      <Container
        scrollable
        safeArea={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchReportData(period, true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.container}
      >
        {/* Navigation & Header */}
        <Header
          title="Financial Statement"
          subtitle="Verified period audit & exportable reports"
          showBack={Boolean(navigation?.canGoBack && navigation.canGoBack())}
          onBack={() => navigation.goBack()}
        />

        {/* Period Selector & PDF Export Action */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.periodPill}
            onPress={() => setIsPickerVisible(true)}
            activeOpacity={0.75}
            testID="report-period-pill"
          >
            <Text variant="caption" color={colors.primary} weight="bold">
              📅 {period} ▾
            </Text>
          </TouchableOpacity>

          <Button
            title={isDownloading ? '⏳ Downloading...' : '📥 Download PDF'}
            variant="primary"
            size="sm"
            onPress={handleDownloadPDF}
            loading={isDownloading}
            disabled={isDownloading}
            testID="report-download-pdf-btn"
          />
        </View>

        {/* Error Banner */}
        {error && (
          <ErrorBanner
            message={error}
            onRetry={() => fetchReportData(period, false)}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Loading Indicator */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingIndicator message={`Compiling report for ${period}...`} />
          </View>
        ) : report ? (
          <View style={styles.reportContent}>
            {/* 1. Summary Cards Strip */}
            <View style={styles.summaryGrid}>
              <Card style={[styles.summaryCard, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                <Text variant="caption" color={colors.textSecondary} weight="medium">
                  TOTAL INFLOW
                </Text>
                <Text variant="title" color={colors.success} style={styles.metricVal}>
                  {formatCurrency(summary.totalIncome)}
                </Text>
                <Text variant="caption" color={colors.textMuted}>
                  {txSummary.incomeTransactions} deposits
                </Text>
              </Card>

              <Card style={[styles.summaryCard, { borderColor: 'rgba(225, 29, 72, 0.3)' }]}>
                <Text variant="caption" color={colors.textSecondary} weight="medium">
                  TOTAL OUTFLOW
                </Text>
                <Text variant="title" color={colors.danger} style={styles.metricVal}>
                  {formatCurrency(summary.totalExpenses)}
                </Text>
                <Text variant="caption" color={colors.textMuted}>
                  {txSummary.expenseTransactions} payments
                </Text>
              </Card>
            </View>

            <View style={styles.summaryGrid}>
              <Card style={styles.summaryCard}>
                <Text variant="caption" color={colors.textSecondary} weight="medium">
                  NET SAVINGS
                </Text>
                <Text
                  variant="title"
                  color={summary.netSavings >= 0 ? colors.success : colors.danger}
                  style={styles.metricVal}
                >
                  {formatCurrency(summary.netSavings)}
                </Text>
                <Text variant="caption" color={colors.textMuted}>
                  {summary.netSavings >= 0 ? 'Surplus' : 'Deficit'}
                </Text>
              </Card>

              <Card style={styles.summaryCard}>
                <Text variant="caption" color={colors.textSecondary} weight="medium">
                  SAVINGS RATE
                </Text>
                <Text
                  variant="title"
                  color={summary.savingsRate >= 20 ? colors.primary : colors.warning}
                  style={styles.metricVal}
                >
                  {`${summary.savingsRate}%`}
                </Text>
                <Text variant="caption" color={colors.textMuted}>
                  Benchmark: ≥ 20%
                </Text>
              </Card>
            </View>

            {/* 2. Budget Performance */}
            <Card style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <Text variant="subtitle" weight="bold">
                  Budget Performance
                </Text>
                {budget && (
                  <Badge
                    label={`Risk: ${budget.riskLevel}`}
                    variant={
                      budget.riskLevel === 'Exceeded'
                        ? 'danger'
                        : budget.riskLevel === 'High'
                        ? 'warning'
                        : 'success'
                    }
                    size="sm"
                  />
                )}
              </View>

              {budget ? (
                <View style={styles.budgetStats}>
                  <View style={styles.statCol}>
                    <Text variant="caption" color={colors.textSecondary}>Limit</Text>
                    <Text variant="body" weight="semibold">{formatCurrency(budget.monthlyBudget)}</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text variant="caption" color={colors.textSecondary}>Spent ({budget.utilization}%)</Text>
                    <Text variant="body" color={colors.danger} weight="semibold">{formatCurrency(budget.spent)}</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text variant="caption" color={colors.textSecondary}>Remaining</Text>
                    <Text variant="body" color={colors.success} weight="semibold">{formatCurrency(budget.remaining)}</Text>
                  </View>
                </View>
              ) : (
                <Text variant="bodySmall" color={colors.textMuted} style={styles.emptyText}>
                  No monthly budget configured for this period.
                </Text>
              )}
            </Card>

            {/* 3. Trends & Momentum */}
            <Card style={styles.sectionCard}>
              <Text variant="subtitle" weight="bold" style={{ marginBottom: spacing.sm }}>
                Multi-Month Trends & Momentum
              </Text>
              {trends?.available ? (
                <View style={styles.trendGrid}>
                  <View style={styles.trendBox}>
                    <Text variant="caption" color={colors.textSecondary}>Savings Momentum</Text>
                    <Text variant="bodySmall" weight="semibold" color={colors.primary} style={{ textTransform: 'capitalize' }}>
                      {trends.savingsMomentum?.toLowerCase().replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <View style={styles.trendBox}>
                    <Text variant="caption" color={colors.textSecondary}>Expense Trend</Text>
                    <Text variant="bodySmall" weight="semibold" style={{ textTransform: 'capitalize' }}>
                      {trends.expenseTrend}
                    </Text>
                  </View>
                  <View style={styles.trendBox}>
                    <Text variant="caption" color={colors.textSecondary}>Income Trend</Text>
                    <Text variant="bodySmall" weight="semibold" style={{ textTransform: 'capitalize' }}>
                      {trends.incomeTrend}
                    </Text>
                  </View>
                  <View style={styles.trendBox}>
                    <Text variant="caption" color={colors.textSecondary}>Savings Trend</Text>
                    <Text variant="bodySmall" weight="semibold" style={{ textTransform: 'capitalize' }}>
                      {trends.savingsTrend}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text variant="bodySmall" color={colors.textMuted} style={styles.emptyText}>
                  {trends?.message || 'Insufficient historical data for trend analysis.'}
                </Text>
              )}
            </Card>

            {/* 4. Category Breakdown */}
            <Card style={styles.sectionCard}>
              <Text variant="subtitle" weight="bold" style={{ marginBottom: spacing.sm }}>
                Expense Categories ({categories.length})
              </Text>
              {categories.length === 0 ? (
                <Text variant="bodySmall" color={colors.textMuted} style={styles.emptyText}>
                  No expense records found for this period.
                </Text>
              ) : (
                categories.map((c, idx) => (
                  <View key={idx} style={styles.listRow}>
                    <View style={styles.listColLeft}>
                      <Text variant="bodySmall" weight="semibold">{c.category}</Text>
                      <Text variant="caption" color={colors.textMuted}>{c.count || 0} payments</Text>
                    </View>
                    <View style={styles.listColRight}>
                      <Text variant="bodySmall" weight="bold" color={colors.danger}>
                        {formatCurrency(c.amount)}
                      </Text>
                      <Text variant="caption" color={colors.textSecondary}>{c.percentage}%</Text>
                    </View>
                  </View>
                ))
              )}
            </Card>

            {/* 5. Top Merchants */}
            <Card style={styles.sectionCard}>
              <Text variant="subtitle" weight="bold" style={{ marginBottom: spacing.sm }}>
                Top Merchants
              </Text>
              {merchants.length === 0 ? (
                <Text variant="bodySmall" color={colors.textMuted} style={styles.emptyText}>
                  No merchant data recorded for this period.
                </Text>
              ) : (
                merchants.slice(0, 5).map((m, idx) => (
                  <View key={idx} style={styles.listRow}>
                    <View style={styles.listColLeft}>
                      <Text variant="bodySmall" weight="semibold" numberOfLines={1}>{m.merchant}</Text>
                      <Text variant="caption" color={colors.textMuted}>{m.transactionCount} transactions</Text>
                    </View>
                    <Text variant="bodySmall" weight="bold">
                      {formatCurrency(m.totalSpending)}
                    </Text>
                  </View>
                ))
              )}
            </Card>

            {/* 6. Recurring Commitments */}
            <Card style={styles.sectionCard}>
              <Text variant="subtitle" weight="bold" style={{ marginBottom: spacing.sm }}>
                Recurring Commitments ({recurring.length})
              </Text>
              {recurring.length === 0 ? (
                <Text variant="bodySmall" color={colors.textMuted} style={styles.emptyText}>
                  No recurring commitments detected.
                </Text>
              ) : (
                recurring.map((sub, idx) => (
                  <View key={idx} style={styles.listRow}>
                    <View style={styles.listColLeft}>
                      <Text variant="bodySmall" weight="semibold">{sub.merchant}</Text>
                      <Text variant="caption" color={colors.textMuted} style={{ textTransform: 'capitalize' }}>
                        {sub.cadence} • Next: {sub.nextExpectedPayment || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.listColRight}>
                      <Text variant="bodySmall" weight="bold">{formatCurrency(sub.typicalAmount)}</Text>
                      <Badge label={sub.confidence} variant="info" size="sm" />
                    </View>
                  </View>
                ))
              )}
            </Card>

            {/* 7. Savings Goals */}
            <Card style={styles.sectionCard}>
              <Text variant="subtitle" weight="bold" style={{ marginBottom: spacing.sm }}>
                Savings Goals ({goals.length})
              </Text>
              {goals.length === 0 ? (
                <Text variant="bodySmall" color={colors.textMuted} style={styles.emptyText}>
                  No active savings goals found.
                </Text>
              ) : (
                goals.map((g, idx) => (
                  <View key={idx} style={styles.goalItem}>
                    <View style={styles.goalHeaderRow}>
                      <Text variant="bodySmall" weight="semibold">{g.name}</Text>
                      <Text variant="caption" color={colors.textSecondary}>
                        {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)} ({g.progressPercentage}%)
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${Math.min(100, g.progressPercentage)}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.goalFooterRow}>
                      <Text variant="caption" color={colors.textMuted}>
                        Req: {formatCurrency(g.requiredMonthlySavings)}/mo
                      </Text>
                      <Text variant="caption" color={colors.primary} style={{ textTransform: 'capitalize' }}>
                        {g.feasibility?.toLowerCase().replace(/_/g, ' ')}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </Card>

            {/* 8. Action Plans */}
            <Card style={styles.sectionCard}>
              <Text variant="subtitle" weight="bold" style={{ marginBottom: spacing.sm }}>
                Financial Action Plans ({actionPlans.length})
              </Text>
              {actionPlans.length === 0 ? (
                <Text variant="bodySmall" color={colors.textMuted} style={styles.emptyText}>
                  No active action plans for this period.
                </Text>
              ) : (
                actionPlans.map((plan, idx) => (
                  <View key={idx} style={styles.actionPlanItem}>
                    <View style={styles.goalHeaderRow}>
                      <Text variant="bodySmall" weight="semibold" style={{ flex: 1, marginRight: spacing.xs }}>
                        {plan.title}
                      </Text>
                      <Badge
                        label={plan.priority}
                        variant={plan.priority === 'HIGH' ? 'danger' : 'info'}
                        size="sm"
                      />
                    </View>
                    <Text variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                      {plan.rationale}
                    </Text>
                    <View style={styles.impactPill}>
                      <Text variant="caption" color={colors.success} weight="semibold">
                        Potential Monthly Impact: {formatCurrency(plan.potentialMonthlyImpact)} (6-Mo: {formatCurrency(plan.potentialSixMonthImpact)})
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </Card>

            {/* 9. Anomalies */}
            <Card style={styles.sectionCard}>
              <Text variant="subtitle" weight="bold" style={{ marginBottom: spacing.sm }}>
                Detected Anomalies ({anomalies.length})
              </Text>
              {anomalies.length === 0 ? (
                <Text variant="bodySmall" color={colors.textMuted} style={styles.emptyText}>
                  No spending anomalies detected in this period.
                </Text>
              ) : (
                anomalies.map((a, idx) => (
                  <View key={idx} style={styles.anomalyItem}>
                    <View style={styles.goalHeaderRow}>
                      <Text variant="bodySmall" weight="semibold">{a.merchant}</Text>
                      <Text variant="bodySmall" color={colors.danger} weight="bold">
                        {formatCurrency(a.amount)}
                      </Text>
                    </View>
                    <Text variant="caption" color={colors.textMuted}>{a.reason}</Text>
                  </View>
                ))
              )}
            </Card>

            {/* 10. Ledger Transactions */}
            <Card style={styles.sectionCard}>
              <Text variant="subtitle" weight="bold" style={{ marginBottom: spacing.sm }}>
                Confirmed Transactions ({transactions.length})
              </Text>
              {transactions.length === 0 ? (
                <Text variant="bodySmall" color={colors.textMuted} style={styles.emptyText}>
                  No confirmed transactions recorded in this period.
                </Text>
              ) : (
                transactions.slice(0, 20).map((t, idx) => {
                  const isIncome = t.type === 'income';
                  return (
                    <View key={t._id || idx} style={styles.listRow}>
                      <View style={styles.listColLeft}>
                        <Text variant="bodySmall" weight="semibold" numberOfLines={1}>
                          {t.title}
                        </Text>
                        <Text variant="caption" color={colors.textMuted}>
                          {t.category} • {formatDate(t.transactionDate)}
                        </Text>
                      </View>
                      <Text
                        variant="bodySmall"
                        weight="bold"
                        color={isIncome ? colors.success : colors.danger}
                      >
                        {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                      </Text>
                    </View>
                  );
                })
              )}
            </Card>
          </View>
        ) : null}

        {/* Month Picker Modal */}
        <MonthPickerModal
          visible={isPickerVisible}
          currentPeriod={period}
          onSelect={handleSelectMonth}
          onClose={() => setIsPickerVisible(false)}
        />
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    paddingBottom: 110,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  periodPill: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportContent: {
    gap: spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  metricVal: {
    marginVertical: spacing.xs - 2,
    fontWeight: '700',
  },
  sectionCard: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  budgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceHover,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statCol: {
    alignItems: 'center',
  },
  trendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  trendBox: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surfaceHover,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  listColLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  listColRight: {
    alignItems: 'flex-end',
  },
  goalItem: {
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surfaceBorder,
    borderRadius: borderRadius.full,
    marginVertical: spacing.xs,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
  },
  goalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionPlanItem: {
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  impactPill: {
    backgroundColor: colors.mintBg,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  anomalyItem: {
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});

export default ReportsScreen;
