import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { formatCurrency } from '../../utils/formatters.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const FinancialHealthHero = ({ metrics = {}, onExplain }) => {
  const totalIncome = metrics.totalIncome || 0;
  const totalExpense = metrics.totalExpense || 0;
  const netSavings = metrics.netSavings || 0;
  const savingsRate = metrics.savingsRate !== undefined ? metrics.savingsRate : 0;
  const isDeficit = metrics.isDeficit || netSavings < 0;
  const transactionCount = metrics.transactionCount || 0;

  return (
    <Card variant="glow" style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text variant="caption" color={colors.primaryLight} weight="bold">
            FINANCIAL HEALTH SNAPSHOT
          </Text>
        </View>
        <View style={styles.badgeRow}>
          {onExplain && (
            <TouchableOpacity
              onPress={onExplain}
              style={styles.explainBtn}
              activeOpacity={0.7}
              testID="explain-savings-rate-btn"
            >
              <Text variant="caption" color={colors.primaryLight} weight="bold">
                💡 Explain
              </Text>
            </TouchableOpacity>
          )}
          <Badge
            label={isDeficit ? 'DEFICIT' : 'HEALTHY SAVINGS'}
            variant={isDeficit ? 'danger' : 'success'}
            size="sm"
          />
        </View>
      </View>

      <Text variant="display" color={isDeficit ? colors.danger : colors.success} style={styles.savingsValue}>
        {formatCurrency(netSavings)}
      </Text>
      <Text variant="caption" color={colors.textSecondary} style={styles.savingsSubtitle}>
        Net Savings ({savingsRate}% savings rate on earnings)
      </Text>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text variant="caption" color={colors.textMuted}>
            Income
          </Text>
          <Text variant="subtitle" color={colors.success} weight="bold">
            {formatCurrency(totalIncome)}
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text variant="caption" color={colors.textMuted}>
            Expenses
          </Text>
          <Text variant="subtitle" color={colors.danger} weight="bold">
            {formatCurrency(totalExpense)}
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text variant="caption" color={colors.textMuted}>
            Ledger
          </Text>
          <Text variant="subtitle" color={colors.textPrimary} weight="bold">
            {transactionCount} Items
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  titleContainer: {
    flex: 1,
    minWidth: 150,
    justifyContent: 'center',
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
  savingsValue: {
    marginTop: spacing.xs,
  },
  savingsSubtitle: {
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginVertical: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
  },
});

export default FinancialHealthHero;
