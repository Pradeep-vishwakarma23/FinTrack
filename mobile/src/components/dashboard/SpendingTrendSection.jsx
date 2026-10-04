import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatCurrency } from '../../utils/formatters.js';

export const SpendingTrendSection = ({ monthlyTrend = [] }) => {
  const hasTrend = Array.isArray(monthlyTrend) && monthlyTrend.length > 0;

  // Find max value for scaling bar heights
  const maxAmount = hasTrend
    ? Math.max(...monthlyTrend.map((m) => Math.max(m.income || 0, m.expense || 0, 1)))
    : 1;

  return (
    <Card style={styles.container} testID="spending-trend-section">
      <View style={styles.headerRow}>
        <Text variant="subtitle" color={colors.textPrimary}>
          Monthly Spending Trend
        </Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text variant="caption" color={colors.textSecondary}>Inflow</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
            <Text variant="caption" color={colors.textSecondary}>Outflow</Text>
          </View>
        </View>
      </View>

      {!hasTrend ? (
        <View style={styles.emptyState}>
          <Text variant="bodySmall" color={colors.textMuted} align="center">
            No monthly timeline data recorded yet. Historical trends will populate as you add or detect transactions.
          </Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <View style={styles.barsRow}>
            {monthlyTrend.slice(-6).map((item, index) => {
              const incomeHeight = Math.max(6, Math.round(((item.income || 0) / maxAmount) * 100));
              const expenseHeight = Math.max(6, Math.round(((item.expense || 0) / maxAmount) * 100));
              
              // Format month label (e.g. "2026-09" -> "Sep")
              let monthLabel = item.month || '';
              if (monthLabel.includes('-')) {
                const parts = monthLabel.split('-');
                const monthNum = parseInt(parts[1], 10) - 1;
                const date = new Date(2026, monthNum, 1);
                monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
              }

              return (
                <View key={`${item.month}_${index}`} style={styles.barGroup}>
                  {/* Bars */}
                  <View style={styles.barPair}>
                    {/* Income Bar */}
                    <View
                      style={[
                        styles.bar,
                        { height: `${incomeHeight}%`, backgroundColor: colors.success },
                      ]}
                    />
                    {/* Expense Bar */}
                    <View
                      style={[
                        styles.bar,
                        { height: `${expenseHeight}%`, backgroundColor: colors.danger },
                      ]}
                    />
                  </View>

                  {/* Month Label */}
                  <Text variant="caption" color={colors.textMuted} style={styles.monthLabel}>
                    {monthLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    marginRight: 4,
  },
  emptyState: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  chartContainer: {
    height: 140,
    marginTop: spacing.sm,
    justifyContent: 'flex-end',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
    paddingBottom: spacing.sm,
  },
  barGroup: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    width: 44,
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    width: 28,
    justifyContent: 'space-between',
  },
  bar: {
    width: 12,
    borderTopLeftRadius: borderRadius.xs,
    borderTopRightRadius: borderRadius.xs,
  },
  monthLabel: {
    marginTop: spacing.xs,
    fontSize: 10,
  },
});

export default SpendingTrendSection;
