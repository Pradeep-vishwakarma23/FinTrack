import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatCurrency } from '../../utils/formatters.js';

export const GoalSummaryCard = ({ goals = [] }) => {
  const activeGoals = goals.filter(
    (g) => g.status === 'in_progress' || g.status === 'paused'
  );
  const completedGoals = goals.filter(
    (g) => g.status === 'completed' || g.isCompleted
  );

  const totalTarget = activeGoals.reduce((sum, g) => sum + (Number(g.targetAmount) || 0), 0);
  const totalSaved = activeGoals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
  const totalRemaining = Math.max(0, totalTarget - totalSaved);
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <Card variant="elevated" style={styles.container} testID="goal-summary-card">
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text variant="caption" color={colors.primaryLight} weight="bold" style={styles.overline}>
            SAVINGS SUMMARY
          </Text>
          <View style={styles.savedAmountRow}>
            <Text variant="title" color={colors.textPrimary} style={styles.title}>
              {formatCurrency(totalSaved)}
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              saved
            </Text>
          </View>
        </View>

        <View style={styles.badgeGroup}>
          <View style={styles.countBadge}>
            <Text variant="caption" color={colors.primaryLight} weight="bold">
              {activeGoals.length} Active
            </Text>
          </View>
          {completedGoals.length > 0 && (
            <View style={styles.completedBadge}>
              <Text variant="caption" color={colors.success} weight="bold">
                ✓ {completedGoals.length} Done
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabels}>
          <Text variant="caption" color={colors.textSecondary}>
            Overall Progress ({overallProgress}%)
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            Target: {formatCurrency(totalTarget)}
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${overallProgress}%` }
            ]}
          />
        </View>
      </View>

      {/* Stat Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCol}>
          <Text variant="caption" color={colors.textMuted}>Remaining</Text>
          <Text variant="bodySmall" weight="bold" color={colors.textPrimary} style={styles.statVal}>
            {formatCurrency(totalRemaining)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statCol}>
          <Text variant="caption" color={colors.textMuted}>Active Target</Text>
          <Text variant="bodySmall" weight="bold" color={colors.textPrimary} style={styles.statVal}>
            {formatCurrency(totalTarget)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statCol}>
          <Text variant="caption" color={colors.textMuted}>Completed</Text>
          <Text variant="bodySmall" weight="bold" color={colors.success} style={styles.statVal}>
            {completedGoals.length} Goals
          </Text>
        </View>
      </View>
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
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  headerLeft: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingRight: spacing.xs,
  },
  overline: {
    letterSpacing: 1,
    marginBottom: 2,
  },
  savedAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'nowrap',
    gap: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  badgeGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  countBadge: {
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  completedBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  progressSection: {
    marginVertical: spacing.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    marginTop: spacing.xs,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.surfaceBorder,
  },
});

export default GoalSummaryCard;
