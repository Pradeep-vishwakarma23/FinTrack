import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { formatCurrency } from '../../utils/formatters.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const BudgetVelocityRiskCard = ({ forecast = {}, onExplain }) => {
  const riskLevel = forecast.riskLevel || 'SAFE';
  const monthlyBudget = forecast.monthlyBudget || 0;
  const budgetVelocity = forecast.budgetVelocity;
  const riskDetails = forecast.riskDetails || {};

  const getRiskVariant = () => {
    switch (riskLevel) {
      case 'CRITICAL':
        return 'danger';
      case 'ELEVATED':
        return 'warning';
      default:
        return 'success';
    }
  };

  const variant = getRiskVariant();

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text variant="subtitle" weight="bold">
            Budget Velocity & Risk
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            Pace tracking against monthly targets
          </Text>
        </View>
        <View style={styles.badgeRow}>
          {onExplain && (
            <TouchableOpacity
              onPress={onExplain}
              style={styles.explainBtn}
              activeOpacity={0.7}
              testID="explain-budget-velocity-btn"
            >
              <Text variant="caption" color={colors.primaryLight} weight="bold">
                💡 Explain
              </Text>
            </TouchableOpacity>
          )}
          <Badge
            label={riskLevel}
            variant={variant}
            size="sm"
          />
        </View>
      </View>

      <View style={styles.metricsBox}>
        <View style={styles.metricRow}>
          <Text variant="caption" color={colors.textSecondary}>
            Monthly Target Budget:
          </Text>
          <Text variant="caption" color={colors.textPrimary} weight="bold">
            {monthlyBudget > 0 ? formatCurrency(monthlyBudget) : 'None Set'}
          </Text>
        </View>

        {budgetVelocity !== null && budgetVelocity !== undefined && (
          <View style={styles.metricRow}>
            <Text variant="caption" color={colors.textSecondary}>
              Burn Velocity:
            </Text>
            <Text
              variant="caption"
              color={variant === 'danger' ? colors.danger : variant === 'warning' ? colors.warning : colors.success}
              weight="bold"
            >
              {budgetVelocity}x
            </Text>
          </View>
        )}

        <View style={styles.metricRow}>
          <Text variant="caption" color={colors.textSecondary}>
            Projected Utilization:
          </Text>
          <Text variant="caption" color={colors.textPrimary} weight="bold">
            {riskDetails.projectedUtilization || 0}%
          </Text>
        </View>
      </View>

      <Text variant="caption" color={colors.textSecondary} style={styles.explanationText}>
        {riskDetails.message || 'Spending velocity is currently aligned with your budget parameters.'}
      </Text>
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
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  explainBtn: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs + 2,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight + '40',
  },
  metricsBox: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  explanationText: {
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});

export default BudgetVelocityRiskCard;
