import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const ActionPlanSection = ({
  plans = [],
  isLoading = false,
  isGenerating = false,
  generateSummary = null,
  actionLoadingId = null,
  actionError = null,
  onGenerate,
  onComplete,
  onDismiss,
  onExplain,
  onClearError,
  onClearSummary
}) => {
  const [filterStatus, setFilterStatus] = useState('Active');
  const [filterPriority, setFilterPriority] = useState('All');

  const list = Array.isArray(plans) ? plans : [];

  const filteredPlans = list.filter((plan) => {
    const currentStatus = (plan.status || 'ACTIVE').toUpperCase();
    const matchesStatus =
      filterStatus === 'All'
        ? true
        : currentStatus === filterStatus.toUpperCase();

    const currentPriority = (plan.priority || 'MEDIUM').toUpperCase();
    const matchesPriority =
      filterPriority === 'All'
        ? true
        : currentPriority === filterPriority.toUpperCase();

    return matchesStatus && matchesPriority;
  });

  const activePlans = list.filter((p) => (p.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
  const totalMonthlyImpact = activePlans.reduce((sum, p) => sum + (p.monthlyImpact || 0), 0);
  const totalSixMonthImpact = activePlans.reduce(
    (sum, p) => sum + (p.potentialSixMonthImpact || (p.monthlyImpact || 0) * 6),
    0
  );

  return (
    <Card style={styles.card} testID="action-plan-section-card">
      {/* 1. Header & Generate CTA */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={styles.badgeRow}>
            <Text variant="subtitle" weight="bold">
              Action Plans
            </Text>
            <Badge label="AI Powered" variant="info" size="sm" />
          </View>
          <Text variant="caption" color={colors.textSecondary}>
            Realistic financial steps from verified ledger facts
          </Text>
        </View>

        {onGenerate && (
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={onGenerate}
            disabled={isGenerating}
            activeOpacity={0.7}
            testID="generate-action-plans-btn"
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text variant="caption" color="#fff" weight="bold">
                ✨ Generate
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Generation / Action Feedback */}
      {actionError && (
        <View style={styles.errorBox} testID="action-plan-error-box">
          <Text variant="caption" color={colors.danger} style={{ flex: 1 }}>
            ⚠️ {actionError}
          </Text>
          {onClearError && (
            <TouchableOpacity onPress={onClearError}>
              <Text variant="caption" color={colors.danger} weight="bold">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {generateSummary && (
        <View style={styles.summaryBox} testID="action-plan-summary-box">
          <Text variant="caption" color={colors.success} style={{ flex: 1 }} weight="semibold">
            🎉 {generateSummary.generatedCount > 0
              ? `Generated ${generateSummary.generatedCount} action plan(s)`
              : 'All intelligence covered by active action plans'}
            {generateSummary.skippedCount > 0 ? ` (${generateSummary.skippedCount} skipped)` : ''}
          </Text>
          {onClearSummary && (
            <TouchableOpacity onPress={onClearSummary}>
              <Text variant="caption" color={colors.success} weight="bold">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 3. Summary Stats Banner if active plans exist */}
      {activePlans.length > 0 && (
        <View style={styles.statsBanner} testID="action-plan-stats-banner">
          <View style={styles.statItem}>
            <Text variant="caption" color={colors.textMuted} style={styles.uppercaseLabel}>
              Potential Monthly
            </Text>
            <Text variant="subtitle" color={colors.success} weight="bold">
              +{formatCurrency(totalMonthlyImpact)}/mo
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="caption" color={colors.textMuted} style={styles.uppercaseLabel}>
              Potential 6-Month
            </Text>
            <Text variant="subtitle" color={colors.primaryLight} weight="bold">
              +{formatCurrency(totalSixMonthImpact)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="caption" color={colors.textMuted} style={styles.uppercaseLabel}>
              Active Steps
            </Text>
            <Text variant="subtitle" color={colors.textPrimary} weight="bold">
              {activePlans.length}
            </Text>
          </View>
        </View>
      )}

      {/* 4. Filter Chips */}
      {list.length > 0 && (
        <View style={styles.filtersWrapper}>
          <View style={styles.filterGroup}>
            {['Active', 'Completed', 'Dismissed', 'All'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  filterStatus === status && styles.filterChipActive
                ]}
                onPress={() => setFilterStatus(status)}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  color={filterStatus === status ? colors.textPrimary : colors.textSecondary}
                  weight={filterStatus === status ? 'bold' : 'normal'}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 5. Plans List or Empty State */}
      {isLoading && list.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primaryLight} />
          <Text variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
            Loading action plans...
          </Text>
        </View>
      ) : list.length === 0 ? (
        <View style={styles.emptyBox} testID="empty-action-plans-box">
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text variant="bodySmall" weight="bold" color={colors.textPrimary}>
            No Action Plans Yet
          </Text>
          <Text variant="caption" color={colors.textSecondary} style={styles.emptyText}>
            Tap Generate to analyze your verified expenses, subscriptions, and goals for realistic financial steps.
          </Text>
          {onGenerate && (
            <TouchableOpacity
              style={styles.emptyGenerateBtn}
              onPress={onGenerate}
              disabled={isGenerating}
              activeOpacity={0.8}
              testID="empty-generate-btn"
            >
              <Text variant="caption" color="#fff" weight="bold">
                {isGenerating ? 'Analyzing Intelligence...' : '✨ Generate Action Plans'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : filteredPlans.length === 0 ? (
        <View style={styles.emptyFilterBox}>
          <Text variant="caption" color={colors.textSecondary}>
            No action plans match filter &apos;{filterStatus}&apos;.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {filteredPlans.map((plan) => {
            const planId = plan._id || plan.id;
            const priority = (plan.priority || 'MEDIUM').toUpperCase();
            const status = (plan.status || 'ACTIVE').toUpperCase();
            const isActive = status === 'ACTIVE';
            const isCompleted = status === 'COMPLETED';
            const isDismissed = status === 'DISMISSED';
            const isProcessing = actionLoadingId === planId;

            return (
              <View
                key={planId}
                style={[
                  styles.planCard,
                  isCompleted && styles.planCardCompleted,
                  isDismissed && styles.planCardDismissed
                ]}
                testID={`action-plan-item-${planId}`}
              >
                {/* Header: Type, Priority, Status */}
                <View style={styles.itemHeaderRow}>
                  <View style={styles.typeBadge}>
                    <Text variant="caption" color={colors.textSecondary} weight="bold">
                      {plan.category ? `${plan.category} • ` : ''}{plan.actionType ? plan.actionType.replace(/_/g, ' ') : 'ACTION'}
                    </Text>
                  </View>

                  <View style={styles.priorityGroup}>
                    <Badge
                      label={priority}
                      variant={priority === 'HIGH' ? 'danger' : priority === 'MEDIUM' ? 'warning' : 'info'}
                      size="sm"
                    />
                    {isCompleted && <Badge label="✓ Completed" variant="success" size="sm" />}
                    {isDismissed && <Badge label="✕ Dismissed" variant="default" size="sm" />}
                  </View>
                </View>

                {/* Title & Description */}
                <Text
                  variant="body"
                  weight="bold"
                  color={isCompleted ? colors.textMuted : colors.textPrimary}
                  style={isCompleted ? styles.strikeTitle : undefined}
                >
                  {plan.title}
                </Text>
                <Text variant="caption" color={colors.textSecondary} style={styles.descriptionText}>
                  {plan.description}
                </Text>

                {/* Measurable Targets & Impact Matrix */}
                <View style={styles.impactGrid}>
                  {plan.targetAmount > 0 && (
                    <View style={styles.impactCol}>
                      <Text variant="caption" color={colors.textMuted} style={styles.uppercaseLabel}>
                        Target
                      </Text>
                      <Text variant="bodySmall" weight="bold" color={colors.textPrimary}>
                        {formatCurrency(plan.targetAmount)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.impactCol}>
                    <Text variant="caption" color={colors.success} style={styles.uppercaseLabel}>
                      Monthly Impact
                    </Text>
                    <Text variant="bodySmall" weight="bold" color={colors.success}>
                      +{formatCurrency(plan.monthlyImpact)}/mo
                    </Text>
                  </View>
                  <View style={styles.impactCol}>
                    <Text variant="caption" color={colors.primaryLight} style={styles.uppercaseLabel}>
                      6-Mo Impact
                    </Text>
                    <Text variant="bodySmall" weight="bold" color={colors.primaryLight}>
                      +{formatCurrency(plan.potentialSixMonthImpact || plan.monthlyImpact * 6)}
                    </Text>
                  </View>
                </View>

                {/* Rationale */}
                {plan.rationale ? (
                  <View style={styles.rationaleBox}>
                    <Text variant="caption" color={colors.textSecondary}>
                      <Text variant="caption" weight="bold" color={colors.textPrimary}>💡 Rationale: </Text>
                      {plan.rationale}
                    </Text>
                  </View>
                ) : null}

                {/* Action Buttons */}
                <View style={styles.footerRow}>
                  {onExplain && (
                    <TouchableOpacity
                      style={styles.explainBtn}
                      onPress={() => onExplain(plan)}
                      activeOpacity={0.7}
                    >
                      <Text variant="caption" color={colors.primaryLight} weight="bold">
                        🤖 Explain
                      </Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.actionBtnsGroup}>
                    {isActive && (
                      <>
                        {onDismiss && (
                          <TouchableOpacity
                            style={styles.dismissBtn}
                            onPress={() => onDismiss(planId)}
                            disabled={isProcessing}
                            activeOpacity={0.7}
                            testID={`dismiss-plan-btn-${planId}`}
                          >
                            <Text variant="caption" color={colors.textSecondary} weight="bold">
                              Dismiss
                            </Text>
                          </TouchableOpacity>
                        )}

                        {onComplete && (
                          <TouchableOpacity
                            style={styles.completeBtn}
                            onPress={() => onComplete(planId)}
                            disabled={isProcessing}
                            activeOpacity={0.7}
                            testID={`complete-plan-btn-${planId}`}
                          >
                            {isProcessing ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text variant="caption" color="#fff" weight="bold">
                                ✓ Complete
                              </Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </>
                    )}

                    {!isActive && (
                      <Text variant="caption" color={colors.textMuted}>
                        {isCompleted && plan.completedAt ? `Completed ${formatDate(plan.completedAt, { short: true })}` : ''}
                        {isDismissed && plan.dismissedAt ? `Dismissed ${formatDate(plan.dismissedAt, { short: true })}` : ''}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
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
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flex: 1,
    minWidth: 150,
    marginRight: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: 2,
  },
  generateBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '18',
    padding: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.danger + '40',
    marginBottom: spacing.sm,
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '18',
    padding: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.success + '40',
    marginBottom: spacing.sm,
  },
  statsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.surfaceBorder,
  },
  uppercaseLabel: {
    textTransform: 'uppercase',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  filtersWrapper: {
    marginBottom: spacing.sm,
  },
  filterGroup: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    padding: 3,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  filterChipActive: {
    backgroundColor: colors.surface,
  },
  loadingBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  emptyGenerateBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  emptyFilterBox: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  listContainer: {
    gap: spacing.sm,
  },
  planCard: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  planCardCompleted: {
    backgroundColor: colors.success + '08',
    borderColor: colors.success + '30',
  },
  planCardDismissed: {
    opacity: 0.6,
  },
  strikeTitle: {
    textDecorationLine: 'line-through',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    flex: 1,
    marginRight: spacing.xs,
  },
  priorityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  descriptionText: {
    marginTop: 2,
    marginBottom: spacing.xs + 2,
  },
  impactGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: 'space-around',
    marginBottom: spacing.xs + 2,
  },
  impactCol: {
    alignItems: 'center',
  },
  rationaleBox: {
    backgroundColor: colors.surface,
    padding: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryLight,
    marginBottom: spacing.xs + 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  explainBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.xs + 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  actionBtnsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dismissBtn: {
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  completeBtn: {
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
    minWidth: 75,
    alignItems: 'center',
  },
});

export default ActionPlanSection;
