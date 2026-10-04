import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from '../index.js';
import { formatCurrency } from '../../utils/formatters.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const TopMerchantsSection = ({ merchants = [], onExplain }) => {
  const list = Array.isArray(merchants) ? merchants : [];

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text variant="subtitle" weight="bold">
          Top Merchants & Payees
        </Text>
        <Text variant="caption" color={colors.textSecondary}>
          Highest spend recipients
        </Text>
      </View>

      {list.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.emptyText}>
            No merchant records available for this period.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {list.map((m, idx) => (
            <View key={m.merchant || idx} style={styles.merchantRow}>
              <View style={styles.rankBadge}>
                <Text variant="caption" color={colors.primaryLight} weight="bold">
                  {idx + 1}
                </Text>
              </View>

              <View style={styles.merchantInfo}>
                <Text variant="body" weight="bold" numberOfLines={1}>
                  {m.merchant}
                </Text>
                <Text variant="caption" color={colors.textMuted}>
                  {m.count} {m.count === 1 ? 'txn' : 'txns'} • Avg: {formatCurrency(m.averageTicket)}
                </Text>
              </View>

              <View style={styles.spendInfo}>
                <Text variant="body" color={colors.textPrimary} weight="bold">
                  {formatCurrency(m.totalSpend)}
                </Text>
                <Text variant="caption" color={colors.textMuted}>
                  {m.percentage}% of expenses
                </Text>
                {onExplain && (
                  <TouchableOpacity
                    onPress={() => onExplain(m)}
                    style={styles.explainItemBtn}
                    activeOpacity={0.7}
                    testID={`explain-merchant-${idx}`}
                  >
                    <Text variant="caption" color={colors.primaryLight} weight="bold">
                      💡 Explain
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
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
    marginBottom: spacing.md,
  },
  emptyBox: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  listContainer: {
    gap: spacing.sm,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  merchantInfo: {
    flex: 1,
    minWidth: 130,
    marginRight: spacing.xs,
  },
  spendInfo: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
  explainItemBtn: {
    marginTop: 2,
    paddingVertical: 1,
    paddingHorizontal: spacing.xs + 2,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight + '40',
  },
});

export default TopMerchantsSection;
