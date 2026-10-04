import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatCurrency } from '../../utils/formatters.js';

export const TransactionSummaryBar = ({
  totalIncome = 0,
  totalExpense = 0,
  net = 0,
}) => {
  const isNetPositive = net >= 0;

  return (
    <Card style={styles.container} testID="transaction-summary-bar">
      <View style={styles.metricsRow}>
        {/* Inflow */}
        <View style={styles.metricCol}>
          <Text variant="caption" color={colors.textMuted} weight="semiBold">
            FILTERED INFLOW
          </Text>
          <Text variant="body" weight="bold" color={colors.success} numberOfLines={1}>
            +{formatCurrency(totalIncome)}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Outflow */}
        <View style={styles.metricCol}>
          <Text variant="caption" color={colors.textMuted} weight="semiBold">
            FILTERED OUTFLOW
          </Text>
          <Text variant="body" weight="bold" color={colors.danger} numberOfLines={1}>
            -{formatCurrency(totalExpense)}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Net */}
        <View style={styles.metricCol}>
          <Text variant="caption" color={colors.textMuted} weight="semiBold">
            NET BALANCE
          </Text>
          <Text
            variant="body"
            weight="bold"
            color={isNetPositive ? colors.primaryLight : colors.danger}
            numberOfLines={1}
          >
            {formatCurrency(net)}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.surfaceBorder,
  },
});

export default TransactionSummaryBar;
