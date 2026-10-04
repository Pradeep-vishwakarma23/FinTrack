import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export const GoalCard = ({
  goal,
  onEdit,
  onDelete,
  onAskCopilot
}) => {
  const {
    _id,
    id,
    title = 'Untitled Goal',
    targetAmount = 0,
    currentAmount = 0,
    remainingAmount = 0,
    progressPercentage = 0,
    targetDate,
    monthsRemaining = 0,
    requiredMonthlySavings = 0,
    feasibility,
    category = 'General',
    priority = 'medium',
    status = 'in_progress',
    notes,
    isCompleted,
    isOverdue
  } = goal || {};

  const goalId = _id || id;

  // Feasibility mapping based on backend deterministic status
  const getFeasibilityConfig = () => {
    const fStatus = feasibility?.status || (isCompleted ? 'ACHIEVED' : '');
    switch (fStatus) {
      case 'ACHIEVED':
        return {
          label: 'Target Achieved',
          variant: 'success'
        };
      case 'HIGHLY_FEASIBLE':
        return {
          label: 'On Track',
          variant: 'success'
        };
      case 'MODERATELY_FEASIBLE':
        return {
          label: 'Challenging',
          variant: 'warning'
        };
      case 'LOW_FEASIBILITY':
        return {
          label: 'Low Feasibility',
          variant: 'danger'
        };
      case 'UNFEASIBLE_DEFICIT':
        return {
          label: 'At Risk',
          variant: 'danger'
        };
      default:
        return {
          label: 'Evaluating',
          variant: 'default'
        };
    }
  };

  const getPriorityVariant = () => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'low':
        return 'default';
      default:
        return 'primary';
    }
  };

  const getStatusVariant = () => {
    if (isCompleted || status === 'completed') return 'success';
    if (status === 'paused') return 'warning';
    if (status === 'cancelled') return 'danger';
    return 'primary';
  };

  const getStatusLabel = () => {
    if (isCompleted || status === 'completed') return 'Completed';
    if (status === 'paused') return 'Paused';
    if (status === 'cancelled') return 'Cancelled';
    return 'Active';
  };

  const feasibilityConfig = getFeasibilityConfig();
  const safeProgress = Math.min(100, Math.max(0, Number(progressPercentage) || 0));

  return (
    <Card variant="default" style={styles.card} testID={`goal-card-${goalId}`}>
      {/* Top Header Row: Category, Priority, Status, Overdue */}
      <View style={styles.topRow}>
        <View style={styles.badgesRow}>
          <Badge label={`🏷️ ${category}`} variant="default" size="sm" />
          <Badge label={priority.toUpperCase()} variant={getPriorityVariant()} size="sm" />
          <Badge label={getStatusLabel()} variant={getStatusVariant()} size="sm" />
          {isOverdue && <Badge label="OVERDUE" variant="danger" size="sm" />}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onEdit && onEdit(goal)}
            activeOpacity={0.7}
            testID={`edit-goal-${goalId}`}
            accessibilityRole="button"
            accessibilityLabel={`Edit goal ${title}`}
          >
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onDelete && onDelete(goal)}
            activeOpacity={0.7}
            testID={`delete-goal-${goalId}`}
            accessibilityRole="button"
            accessibilityLabel={`Delete goal ${title}`}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Goal Title & Notes */}
      <View style={styles.titleSection}>
        <Text variant="title" color={colors.textPrimary} style={styles.titleText}>
          {title}
        </Text>
        {Boolean(notes) && (
          <Text variant="caption" color={colors.textSecondary} style={styles.notesText} numberOfLines={2}>
            {notes}
          </Text>
        )}
      </View>

      {/* Progress & Amount Row */}
      <View style={styles.amountSection}>
        <View style={styles.amountRow}>
          <View>
            <Text variant="h3" color={colors.textPrimary} weight="bold">
              {formatCurrency(currentAmount)}
            </Text>
            <Text variant="caption" color={colors.textMuted}>
              Target: {formatCurrency(targetAmount)}
            </Text>
          </View>
          <View style={styles.progressPctBox}>
            <Text variant="subtitle" color={colors.primary} weight="bold">
              {safeProgress}%
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${safeProgress}%`,
                backgroundColor:
                  isCompleted || status === 'completed'
                    ? colors.success
                    : safeProgress >= 70
                    ? colors.primary
                    : colors.warning,
              },
            ]}
          />
        </View>

        <View style={styles.timelineRow}>
          <Text variant="caption" color={colors.textSecondary}>
            Remaining: <Text variant="caption" weight="bold" color={colors.textPrimary}>{formatCurrency(remainingAmount)}</Text>
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            Target: <Text variant="caption" weight="bold" color={colors.textPrimary}>{formatDate(targetDate, { short: true })}</Text>
          </Text>
        </View>
      </View>

      {/* Deterministic Monthly Savings & Feasibility Section */}
      <View style={styles.feasibilityContainer}>
        <View style={styles.feasibilityHeader}>
          <Text variant="caption" color={colors.textMuted} weight="bold">
            REQUIRED MONTHLY
          </Text>
          <Badge
            label={feasibilityConfig.label}
            variant={feasibilityConfig.variant}
            size="sm"
          />
        </View>

        <View style={styles.monthlyRow}>
          <Text variant="bodySmall" weight="bold" color={colors.textPrimary}>
            {formatCurrency(requiredMonthlySavings)} / month
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            {monthsRemaining} {monthsRemaining === 1 ? 'month' : 'months'} remaining
          </Text>
        </View>

        {Boolean(feasibility?.message) && (
          <Text variant="caption" color={colors.textSecondary} style={styles.feasibilityMessage}>
            {feasibility.message}
          </Text>
        )}
      </View>

      {/* Ask Copilot CTA */}
      <TouchableOpacity
        style={styles.copilotButton}
        onPress={() => onAskCopilot && onAskCopilot(goal)}
        activeOpacity={0.8}
        testID={`ask-copilot-${goalId}`}
        accessibilityRole="button"
        accessibilityLabel={`Ask Copilot about goal ${title}`}
      >
        <Text style={styles.copilotSparkle}>✨</Text>
        <Text variant="caption" color={colors.primary} weight="bold">
          Ask Copilot about this goal
        </Text>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
    minWidth: 160,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  iconButton: {
    padding: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  actionIcon: {
    fontSize: 14,
  },
  titleSection: {
    marginVertical: spacing.xs,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesText: {
    marginTop: 2,
    lineHeight: 16,
  },
  amountSection: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  progressPctBox: {
    alignItems: 'flex-end',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.surfaceBorder,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressBarFill: {
    height: 8,
    borderRadius: borderRadius.full,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  feasibilityContainer: {
    backgroundColor: colors.surfaceHeader,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  feasibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: 4,
  },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  feasibilityMessage: {
    marginTop: 4,
    lineHeight: 15,
  },
  copilotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.mintBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: spacing.xs,
  },
  copilotSparkle: {
    fontSize: 13,
  },
});

export default GoalCard;
