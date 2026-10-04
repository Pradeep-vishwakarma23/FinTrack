import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatCurrency } from '../../utils/formatters.js';

export const FinancialSummaryCards = ({
  totalIncome = 0,
  totalExpense = 0,
  savings = 0,
  savingsRate = 0,
}) => {
  const isSavingsPositive = savings >= 0;

  // Safe percentage calculation for cash flow distribution
  const expensePercentage = totalIncome > 0
    ? Math.min(Math.round((totalExpense / totalIncome) * 100), 100)
    : totalExpense > 0
    ? 100
    : 0;
  const savingsPercentage = totalIncome > 0
    ? Math.max(Math.round((savings / totalIncome) * 100), 0)
    : 0;

  return (
    <View style={styles.container}>
      {/* 1. Large Financial Position Hero Card */}
      <Card
        variant={isSavingsPositive ? 'glow' : 'danger'}
        style={styles.heroCard}
        testID="financial-position-hero-card"
      >
        <View style={styles.heroHeader}>
          <View style={{ flex: 1, marginRight: spacing.xs }}>
            <Text variant="caption" color={colors.mintLight} weight="bold" style={styles.heroKicker}>
              FINANCIAL POSITION
            </Text>
            <Text variant="subtitle" weight="bold" color={colors.textPrimary} style={styles.heroTitle}>
              {isSavingsPositive ? 'Healthy Financial Balance' : 'Outflow Exceeds Inflow'}
            </Text>
          </View>

          <Badge
            label={isSavingsPositive ? '↑ Surplus Cash Flow' : '↓ Deficit Alert'}
            variant={isSavingsPositive ? 'success' : 'danger'}
            size="sm"
          />
        </View>

        {/* Hero Balance Summary Numbers */}
        <View style={styles.heroMetricsGrid}>
          <View style={styles.heroMetricCol}>
            <Text variant="caption" color={colors.textSecondary}>
              Inflow
            </Text>
            <Text variant="body" weight="bold" color={colors.success} numberOfLines={1}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>

          <View style={[styles.heroMetricCol, styles.metricBorderLeft]}>
            <Text variant="caption" color={colors.textSecondary}>
              Outflow
            </Text>
            <Text variant="body" weight="bold" color={colors.danger} numberOfLines={1}>
              {formatCurrency(totalExpense)}
            </Text>
          </View>

          <View style={[styles.heroMetricCol, styles.metricBorderLeft]}>
            <Text variant="caption" color={colors.textSecondary}>
              Net Retained
            </Text>
            <Text
              variant="body"
              weight="bold"
              color={isSavingsPositive ? colors.mintLight : colors.danger}
              numberOfLines={1}
            >
              {formatCurrency(savings)}
            </Text>
          </View>
        </View>

        {/* Cash Flow Distribution Progress Bar */}
        <View style={styles.ratioSection}>
          <View style={styles.ratioLabelsRow}>
            <Text variant="caption" color={colors.textSecondary}>
              Expense ({expensePercentage}%)
            </Text>
            {totalIncome > 0 && (
              <Text variant="caption" color={colors.mintLight}>
                Retained ({savingsPercentage}%)
              </Text>
            )}
          </View>

          <View style={styles.ratioTrack}>
            <View
              style={[
                styles.expenseBar,
                { width: `${expensePercentage}%` },
              ]}
            />
            {totalIncome > 0 && savings > 0 && (
              <View
                style={[
                  styles.savingsBar,
                  { width: `${savingsPercentage}%` },
                ]}
              />
            )}
          </View>
        </View>
      </Card>

      {/* 2. Row 1: Income & Expenses Detail Cards */}
      <View style={styles.row}>
        {/* Income Card */}
        <Card style={styles.halfCard} testID="kpi-income-card">
          <View style={styles.cardHeader}>
            <Text variant="caption" color={colors.textSecondary} weight="semiBold">
              INCOME
            </Text>
            <Badge label="+" variant="success" size="sm" />
          </View>
          <Text variant="title" color={colors.success} style={styles.amountText} numberOfLines={1}>
            {formatCurrency(totalIncome)}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            Confirmed inflow
          </Text>
        </Card>

        {/* Expense Card */}
        <Card style={styles.halfCard} testID="kpi-expense-card">
          <View style={styles.cardHeader}>
            <Text variant="caption" color={colors.textSecondary} weight="semiBold">
              EXPENSES
            </Text>
            <Badge label="−" variant="danger" size="sm" />
          </View>
          <Text variant="title" color={colors.danger} style={styles.amountText} numberOfLines={1}>
            {formatCurrency(totalExpense)}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            Verified outflow
          </Text>
        </Card>
      </View>

      {/* 3. Row 2: Net Savings & Savings Rate */}
      <View style={styles.row}>
        {/* Net Savings Card */}
        <Card
          variant={isSavingsPositive ? 'glow' : 'danger'}
          style={styles.halfCard}
          testID="kpi-savings-card"
        >
          <View style={styles.cardHeader}>
            <Text variant="caption" color={colors.textSecondary} weight="semiBold">
              NET SAVINGS
            </Text>
            <Badge
              label={isSavingsPositive ? 'NET +' : 'DEFICIT'}
              variant={isSavingsPositive ? 'primary' : 'danger'}
              size="sm"
            />
          </View>
          <Text
            variant="title"
            color={isSavingsPositive ? colors.mintLight : colors.danger}
            style={styles.amountText}
            numberOfLines={1}
          >
            {formatCurrency(savings)}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            {isSavingsPositive ? 'Retained capital' : 'Period cash deficit'}
          </Text>
        </Card>

        {/* Savings Rate Card */}
        <Card style={styles.halfCard} testID="kpi-savings-rate-card">
          <View style={styles.cardHeader}>
            <Text variant="caption" color={colors.textSecondary} weight="semiBold">
              SAVINGS RATE
            </Text>
            <Badge
              label={`${savingsRate}%`}
              variant={savingsRate >= 40 ? 'success' : savingsRate >= 0 ? 'primary' : 'danger'}
              size="sm"
            />
          </View>
          <Text
            variant="title"
            color={savingsRate >= 0 ? colors.textPrimary : colors.danger}
            style={styles.amountText}
          >
            {savingsRate}%
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            {totalIncome > 0 ? 'Of total earnings' : 'Zero recorded income'}
          </Text>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  heroCard: {
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  heroKicker: {
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 17,
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHeader,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  heroMetricCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  metricBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: colors.surfaceBorder,
  },
  ratioSection: {
    marginTop: 2,
  },
  ratioLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ratioTrack: {
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceBorder,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  expenseBar: {
    height: '100%',
    backgroundColor: colors.danger,
    borderRadius: borderRadius.full,
  },
  savingsBar: {
    height: '100%',
    backgroundColor: colors.mint,
    borderRadius: borderRadius.full,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  halfCard: {
    flex: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  amountText: {
    marginVertical: spacing.xs,
  },
});

export default FinancialSummaryCards;
