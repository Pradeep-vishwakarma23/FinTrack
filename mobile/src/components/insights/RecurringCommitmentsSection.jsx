import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const RecurringCommitmentsSection = ({ subscriptions = [], summary = null, onExplain }) => {
  const list = Array.isArray(subscriptions) ? subscriptions : [];
  const totalMonthlyCost = summary?.estimatedMonthlyRecurringCost ?? list.reduce((sum, s) => {
    switch (s.cadence) {
      case 'weekly': return sum + (s.latestAmount * 4.33);
      case 'biweekly': return sum + (s.latestAmount * 2.17);
      case 'quarterly': return sum + (s.latestAmount / 3);
      case 'monthly':
      default: return sum + s.latestAmount;
    }
  }, 0);

  return (
    <Card style={styles.card} testID="recurring-commitments-card">
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text variant="subtitle" weight="bold">
            Recurring Subscriptions
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            Fixed commitments & auto-pay obligations
          </Text>
        </View>
        <View style={styles.badgeGroup}>
          {list.length > 0 && (
            <View style={styles.costBadge}>
              <Text variant="caption" color={colors.textPrimary} weight="bold">
                ~{formatCurrency(Math.round(totalMonthlyCost))}/mo
              </Text>
            </View>
          )}
          <Badge
            label={`${list.length} Active`}
            variant={list.length > 0 ? 'info' : 'default'}
            size="sm"
          />
        </View>
      </View>

      {list.length === 0 ? (
        <View style={styles.emptyBox} testID="empty-subscriptions-box">
          <Text style={styles.emptyIcon}>🔄</Text>
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.emptyText}>
            No recurring subscriptions detected. Regular obligations will appear here after 3+ payments.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {list.map((item, idx) => {
            const isHighConfidence = item.confidenceLevel === 'HIGH';
            const cadenceLabel = item.cadence
              ? item.cadence.charAt(0).toUpperCase() + item.cadence.slice(1)
              : 'Monthly';

            return (
              <View
                key={item.normalizedMerchant || idx}
                style={styles.subItem}
                testID={`subscription-item-${item.normalizedMerchant || idx}`}
              >
                <View style={styles.itemTopRow}>
                  <View style={styles.itemTitleContainer}>
                    <Text variant="body" weight="bold" numberOfLines={1}>
                      {item.merchant}
                    </Text>
                    <Text variant="caption" color={colors.textMuted}>
                      {item.category || 'Subscription'} • {cadenceLabel}
                    </Text>
                  </View>

                  <View style={styles.amountContainer}>
                    <Text variant="subtitle" color={colors.textPrimary} weight="bold">
                      {formatCurrency(item.latestAmount)}
                    </Text>
                    <Badge
                      label={item.confidenceLevel || 'MEDIUM'}
                      variant={isHighConfidence ? 'success' : 'warning'}
                      size="sm"
                    />
                  </View>
                </View>

                {item.priceIncreaseDetected && (
                  <View style={styles.priceHikeBox} testID={`price-hike-${idx}`}>
                    <Text variant="caption" color={colors.warning} weight="bold">
                      🔺 Price Increased: +{formatCurrency(item.amountChange)} ({item.percentageChange > 0 ? `+${item.percentageChange}%` : ''})
                    </Text>
                  </View>
                )}

                <View style={styles.itemFooterRow}>
                  <Text variant="caption" color={colors.textMuted}>
                    Next Est: {item.estimatedNextPaymentDate ? formatDate(item.estimatedNextPaymentDate, { short: true }) : 'Not scheduled'}
                  </Text>
                  <Text variant="caption" color={colors.textMuted}>
                    {item.transactionCount} payments
                  </Text>
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
    marginBottom: spacing.md,
  },
  titleContainer: {
    flex: 1,
    minWidth: 150,
    marginRight: spacing.xs,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  costBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  emptyBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  listContainer: {
    gap: spacing.sm,
  },
  subItem: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  itemTitleContainer: {
    flex: 1,
    minWidth: 130,
    marginRight: spacing.xs,
  },
  amountContainer: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },
  priceHikeBox: {
    marginTop: spacing.xs,
    paddingVertical: 3,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.warning + '18',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  itemFooterRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default RecurringCommitmentsSection;
