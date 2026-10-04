import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { formatCurrency } from '../../utils/formatters.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const ExpenseForecastCard = ({ forecast = {}, onExplain }) => {
  const projectedExpense = forecast.projectedExpense || 0;
  const dailyBurnRate = forecast.dailyBurnRate || 0;
  const daysElapsed = forecast.daysElapsed || 1;
  const totalDays = forecast.totalDaysInMonth || 30;
  const confidence = forecast.confidence || 0;
  const method = forecast.forecastMethod || 'Linear month-to-date run-rate';

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text variant="subtitle" weight="bold">
            Expense Run-Rate Forecast
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            Projected expenditure by month end
          </Text>
        </View>
        <View style={styles.badgeRow}>
          {onExplain && (
            <TouchableOpacity
              onPress={onExplain}
              style={styles.explainBtn}
              activeOpacity={0.7}
              testID="explain-forecast-btn"
            >
              <Text variant="caption" color={colors.primaryLight} weight="bold">
                💡 Explain
              </Text>
            </TouchableOpacity>
          )}
          <Badge
            label={`Day ${daysElapsed}/${totalDays}`}
            variant="secondary"
            size="sm"
          />
        </View>
      </View>

      <View style={styles.projectionBox}>
        <Text variant="caption" color={colors.primaryLight} weight="semiBold">
          PROJECTED TOTAL SPEND
        </Text>
        <Text variant="title" color={colors.textPrimary} style={styles.projectionValue}>
          {formatCurrency(projectedExpense)}
        </Text>
        <View style={styles.burnRateRow}>
          <Text variant="caption" color={colors.textSecondary}>
            Daily Burn Rate:
          </Text>
          <Text variant="caption" color={colors.textPrimary} weight="bold">
            {formatCurrency(dailyBurnRate)} / day
          </Text>
        </View>
      </View>

      {/* Confidence Score Meter */}
      <View style={styles.confidenceSection}>
        <View style={styles.confidenceRow}>
          <Text variant="caption" color={colors.textSecondary} weight="semiBold">
            Forecast Confidence
          </Text>
          <Text variant="caption" color={colors.primaryLight} weight="bold">
            {confidence}%
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(confidence, 100)}%` },
            ]}
          />
        </View>
      </View>

      <Text variant="caption" color={colors.textMuted} style={styles.methodText}>
        {method}
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
  projectionBox: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.md,
  },
  projectionValue: {
    marginTop: spacing.xs,
    fontSize: 22,
    fontWeight: '900',
  },
  burnRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  confidenceSection: {
    marginBottom: spacing.sm,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surfaceBorder,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  methodText: {
    fontSize: 10,
    marginTop: 2,
  },
});

export default ExpenseForecastCard;
