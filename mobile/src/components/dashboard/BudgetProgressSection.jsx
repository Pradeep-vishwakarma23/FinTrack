import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatCurrency } from '../../utils/formatters.js';

export const BudgetProgressSection = ({
  monthlyBudget = 0,
  totalExpense = 0,
  budgetRemaining = 0,
  categoryBudgets = [],
  categoryBreakdown = [],
}) => {
  const hasMonthlyBudget = Number(monthlyBudget) > 0;
  const hasCategoryBudgets = Array.isArray(categoryBudgets) && categoryBudgets.length > 0;

  // Monthly Budget calculations
  const monthlyUsagePercent = hasMonthlyBudget
    ? Math.round((totalExpense / monthlyBudget) * 100)
    : 0;
  const isMonthlyOver = hasMonthlyBudget && totalExpense > monthlyBudget;

  return (
    <Card style={styles.container} testID="budget-progress-section">
      <View style={styles.headerRow}>
        <Text variant="subtitle" color={colors.textPrimary}>
          Budget & Limits
        </Text>
        {hasMonthlyBudget && (
          <Badge
            label={`${monthlyUsagePercent}% Used`}
            variant={isMonthlyOver ? 'danger' : monthlyUsagePercent >= 80 ? 'warning' : 'primary'}
            size="sm"
          />
        )}
      </View>

      {!hasMonthlyBudget && !hasCategoryBudgets ? (
        <View style={styles.emptyState}>
          <Text variant="body" weight="medium" color={colors.textPrimary} align="center" style={styles.emptyTitle}>
            No budgets created yet
          </Text>
          <Text variant="bodySmall" color={colors.textMuted} align="center">
            Set your monthly spending target on the web dashboard to track utilization and receive proactive alerts.
          </Text>
        </View>
      ) : (
        <View>
          {/* Overall Monthly Budget Card */}
          {hasMonthlyBudget && (
            <View style={styles.overallBudgetBox}>
              <View style={styles.metricRow}>
                <Text variant="body" weight="bold" color={colors.textPrimary}>
                  Overall Monthly Budget
                </Text>
                <Text variant="body" weight="bold" color={isMonthlyOver ? colors.danger : colors.textPrimary}>
                  {formatCurrency(totalExpense)} / {formatCurrency(monthlyBudget)}
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(100, Math.max(2, monthlyUsagePercent))}%`,
                      backgroundColor: isMonthlyOver
                        ? colors.danger
                        : monthlyUsagePercent >= 80
                        ? colors.warning
                        : colors.primary,
                    },
                  ]}
                />
              </View>

              <View style={styles.remainingRow}>
                <Text variant="caption" color={colors.textMuted}>
                  {isMonthlyOver ? 'Over budget by:' : 'Remaining budget:'}
                </Text>
                <Text
                  variant="caption"
                  weight="bold"
                  color={isMonthlyOver ? colors.danger : colors.success}
                >
                  {formatCurrency(Math.abs(budgetRemaining))}
                </Text>
              </View>
            </View>
          )}

          {/* Category Budgets */}
          {hasCategoryBudgets && (
            <View style={styles.categoryBudgetsList}>
              <Text variant="caption" color={colors.textSecondary} weight="semiBold" style={styles.categorySubhead}>
                CATEGORY BUDGETS
              </Text>

              {categoryBudgets.map((cb, idx) => {
                const catSpent = categoryBreakdown.find(
                  (c) => c.category?.toLowerCase() === cb.category?.toLowerCase()
                )?.amount || 0;
                const catLimit = cb.limit || 1;
                const catPercent = Math.round((catSpent / catLimit) * 100);
                const isCatOver = catSpent > catLimit;

                return (
                  <View key={`${cb.category}_${idx}`} style={styles.categoryBudgetItem}>
                    <View style={styles.catBudgetTop}>
                      <Text variant="bodySmall" weight="medium" color={colors.textPrimary}>
                        {cb.category}
                      </Text>
                      <Text
                        variant="bodySmall"
                        weight="bold"
                        color={isCatOver ? colors.danger : colors.textPrimary}
                      >
                        {formatCurrency(catSpent)} / {formatCurrency(catLimit)} ({catPercent}%)
                      </Text>
                    </View>

                    <View style={styles.catProgressTrack}>
                      <View
                        style={[
                          styles.catProgressBar,
                          {
                            width: `${Math.min(100, Math.max(2, catPercent))}%`,
                            backgroundColor: isCatOver
                              ? colors.danger
                              : catPercent >= 80
                              ? colors.warning
                              : colors.secondary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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
  emptyState: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  emptyTitle: {
    marginBottom: spacing.xs,
  },
  overallBudgetBox: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressTrack: {
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  categoryBudgetsList: {
    marginTop: spacing.sm,
  },
  categorySubhead: {
    marginBottom: spacing.xs,
  },
  categoryBudgetItem: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  catBudgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catProgressTrack: {
    height: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  catProgressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});

export default BudgetProgressSection;
