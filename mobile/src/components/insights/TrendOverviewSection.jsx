import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { formatCurrency } from '../../utils/formatters.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const TrendOverviewSection = ({
  trends,
  range = '6m',
  onRangeChange,
  onExplain
}) => {
  const months = trends?.months || [];
  const comparison = trends?.comparison || {};
  const momentum = trends?.momentum || { state: 'INSUFFICIENT_DATA' };
  const categories = trends?.categories || [];
  const extremes = trends?.extremes || {};

  const incomeMom = comparison.income || { current: 0, previous: 0, change: 0, percentageChange: 0 };
  const expenseMom = comparison.expenses || { current: 0, previous: 0, change: 0, percentageChange: 0 };
  const savingsMom = comparison.savings || { current: 0, previous: 0, change: 0, percentageChange: 0 };

  const momentumVariant =
    momentum.state === 'IMPROVING'
      ? 'success'
      : momentum.state === 'DECLINING'
      ? 'danger'
      : momentum.state === 'STABLE'
      ? 'info'
      : 'default';

  const maxVal = Math.max(
    ...months.map((m) => Math.max(m.income, m.expenses, Math.abs(m.netSavings))),
    1000
  );

  return (
    <Card style={styles.card} testID="trend-overview-card">
      {/* 1. Header & 6M / 12M Range Switcher */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text variant="subtitle" weight="bold">
            Financial Trends
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            Multi-month comparative intelligence ({trends?.period || 'Historical'})
          </Text>
        </View>

        <View style={styles.rangeSelector}>
          <TouchableOpacity
            style={[styles.rangeBtn, range === '6m' && styles.rangeBtnActive]}
            onPress={() => onRangeChange && onRangeChange('6m')}
            activeOpacity={0.7}
            testID="mobile-range-btn-6m"
          >
            <Text
              variant="caption"
              color={range === '6m' ? colors.primaryLight : colors.textMuted}
              weight="bold"
            >
              6M
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rangeBtn, range === '12m' && styles.rangeBtnActive]}
            onPress={() => onRangeChange && onRangeChange('12m')}
            activeOpacity={0.7}
            testID="mobile-range-btn-12m"
          >
            <Text
              variant="caption"
              color={range === '12m' ? colors.primaryLight : colors.textMuted}
              weight="bold"
            >
              12M
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. MoM Metric Cards & Savings Momentum */}
      <View style={styles.metricGrid}>
        <View style={styles.metricTile}>
          <Text variant="caption" color={colors.textMuted}>
            MoM Income
          </Text>
          <Text variant="body" color={colors.success} weight="bold">
            {formatCurrency(incomeMom.current)}
          </Text>
          <Text variant="caption" color={incomeMom.change >= 0 ? colors.success : colors.danger}>
            {incomeMom.change >= 0 ? '+' : ''}{incomeMom.percentageChange}%
          </Text>
        </View>

        <View style={styles.metricTile}>
          <Text variant="caption" color={colors.textMuted}>
            MoM Expenses
          </Text>
          <Text variant="body" color={colors.danger} weight="bold">
            {formatCurrency(expenseMom.current)}
          </Text>
          <Text variant="caption" color={expenseMom.change <= 0 ? colors.success : colors.danger}>
            {expenseMom.change >= 0 ? '+' : ''}{expenseMom.percentageChange}%
          </Text>
        </View>

        <View style={styles.metricTile}>
          <Text variant="caption" color={colors.textMuted}>
            MoM Net Savings
          </Text>
          <Text variant="body" color={colors.textPrimary} weight="bold">
            {formatCurrency(savingsMom.current)}
          </Text>
          <Text variant="caption" color={savingsMom.change >= 0 ? colors.success : colors.danger}>
            {savingsMom.change >= 0 ? '+' : ''}{formatCurrency(savingsMom.change)}
          </Text>
        </View>

        <View style={[styles.metricTile, styles.momentumTile]}>
          <Text variant="caption" color={colors.textMuted}>
            Momentum
          </Text>
          <Badge
            label={momentum.state || 'STABLE'}
            variant={momentumVariant}
            size="sm"
          />
        </View>
      </View>

      {/* 3. Monthly Visual Trend Bars */}
      {months.length > 0 && (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text variant="caption" color={colors.textMuted} weight="bold">
              MONTHLY CASH FLOW TRAJECTORY
            </Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text variant="caption" color={colors.textMuted} style={styles.legendLabel}>In</Text>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Text variant="caption" color={colors.textMuted} style={styles.legendLabel}>Out</Text>
              <View style={[styles.legendDot, { backgroundColor: colors.primaryLight }]} />
              <Text variant="caption" color={colors.textMuted} style={styles.legendLabel}>Save</Text>
            </View>
          </View>

          <View style={styles.barsRow}>
            {months.map((m) => {
              const inH = Math.max(3, Math.round((m.income / maxVal) * 55));
              const exH = Math.max(3, Math.round((m.expenses / maxVal) * 55));
              const svH = Math.max(2, Math.round((Math.max(0, m.netSavings) / maxVal) * 55));

              return (
                <View key={m.month} style={styles.barColumn}>
                  <View style={styles.barGroup}>
                    <View style={[styles.bar, { height: inH, backgroundColor: colors.success }]} />
                    <View style={[styles.bar, { height: exH, backgroundColor: colors.danger }]} />
                    <View style={[styles.bar, { height: svH, backgroundColor: colors.primaryLight }]} />
                  </View>
                  <Text variant="caption" color={colors.textMuted} style={styles.monthLabel}>
                    {m.month.slice(5)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 4. Category Dynamics */}
      {categories.length > 0 && (
        <View style={styles.categorySection}>
          <Text variant="caption" color={colors.textMuted} weight="bold" style={styles.sectionHeading}>
            TOP CATEGORY SHIFTS
          </Text>
          <View style={styles.categoryList}>
            {categories.slice(0, 3).map((c) => {
              const isUp = c.trend === 'increasing';
              return (
                <View key={c.category} style={styles.categoryRow}>
                  <View style={styles.catLeft}>
                    <Text variant="bodySmall" weight="bold" color={colors.textPrimary}>
                      {c.category}
                    </Text>
                    <Text variant="caption" color={colors.textMuted}>
                      Avg: {formatCurrency(c.averageMonthlySpending)}/mo
                    </Text>
                  </View>
                  <View style={styles.catRight}>
                    <Badge
                      label={c.trend}
                      variant={isUp ? 'danger' : c.trend === 'decreasing' ? 'success' : 'info'}
                      size="sm"
                    />
                    <Text variant="caption" color={colors.textMuted}>
                      {c.change >= 0 ? '+' : ''}{formatCurrency(c.change)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 5. Historical Extremes */}
      <View style={styles.extremesContainer}>
        <View style={styles.extremeTile}>
          <Text variant="caption" color={colors.textMuted}>
            Peak Spending
          </Text>
          <Text variant="bodySmall" color={colors.danger} weight="bold">
            {extremes.highestExpenseMonth ? formatCurrency(extremes.highestExpenseMonth.amount) : '₹0'}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            {extremes.highestExpenseMonth?.month || 'N/A'}
          </Text>
        </View>

        <View style={styles.extremeTile}>
          <Text variant="caption" color={colors.textMuted}>
            Peak Savings
          </Text>
          <Text variant="bodySmall" color={colors.success} weight="bold">
            {extremes.highestSavingsMonth ? formatCurrency(extremes.highestSavingsMonth.amount) : '₹0'}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            {extremes.highestSavingsMonth?.month || 'N/A'}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  titleContainer: {
    flex: 1,
    minWidth: 150,
    marginRight: spacing.xs,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 2,
  },
  rangeBtn: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  rangeBtnActive: {
    backgroundColor: colors.surface,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  metricTile: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 2,
  },
  momentumTile: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  chartContainer: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    marginRight: 4,
    fontSize: 10,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 75,
    paddingTop: spacing.xs,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1.5,
    height: 55,
  },
  bar: {
    width: 3.5,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  monthLabel: {
    fontSize: 9,
    marginTop: 3,
  },
  categorySection: {
    marginBottom: spacing.md,
  },
  sectionHeading: {
    marginBottom: spacing.xs,
    fontSize: 10,
  },
  categoryList: {
    gap: spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  catLeft: {
    flex: 1,
  },
  catRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  extremesContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  extremeTile: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 1,
  },
});

export default TrendOverviewSection;
