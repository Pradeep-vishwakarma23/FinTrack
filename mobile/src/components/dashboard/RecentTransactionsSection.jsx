import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

// Format source indicators without emojis
const formatSourceBadge = (source) => {
  switch (String(source).toLowerCase()) {
    case 'sms':
      return { label: 'SMS', variant: 'warning' };
    case 'notification':
      return { label: 'Notification', variant: 'primary' };
    case 'email':
      return { label: 'Email', variant: 'info' };
    case 'csv':
      return { label: 'CSV', variant: 'default' };
    case 'excel':
      return { label: 'Excel', variant: 'default' };
    case 'manual':
      return { label: 'Manual', variant: 'default' };
    default:
      return null;
  }
};

export const RecentTransactionsSection = ({
  transactions = [],
  onViewAllPress,
}) => {
  const hasTransactions = Array.isArray(transactions) && transactions.length > 0;

  return (
    <Card style={styles.container} testID="recent-transactions-section">
      <View style={styles.headerRow}>
        <View>
          <Text variant="caption" color={colors.mintLight} weight="bold" style={styles.kicker}>
            LEDGER STREAM
          </Text>
          <Text variant="subtitle" color={colors.textPrimary} style={styles.sectionTitle}>
            Recent Activity
          </Text>
        </View>

        {hasTransactions && (
          <TouchableOpacity
            onPress={onViewAllPress}
            activeOpacity={0.7}
            style={styles.viewAllBtn}
            testID="home-view-all-tx-btn"
          >
            <Text variant="bodySmall" color={colors.mintLight} weight="bold">
              View All →
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!hasTransactions ? (
        <View style={styles.emptyState}>
          <Text variant="body" weight="medium" color={colors.textPrimary} align="center" style={styles.emptyTitle}>
            No transactions yet
          </Text>
          <Text variant="bodySmall" color={colors.textMuted} align="center">
            Add your first transaction or connect an automatic source (SMS, bank statements) to populate your ledger.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {transactions.map((tx, idx) => {
            const isIncome = tx.type === 'income';
            const sourceBadge = formatSourceBadge(tx.source);
            const merchantOrTitle = tx.merchant || tx.title || 'Unknown Merchant';
            const dateStr = formatDate(tx.transactionDate || tx.createdAt, { short: true });

            return (
              <View
                key={tx._id || tx.id || `tx_${idx}`}
                style={[
                  styles.transactionItem,
                  idx < transactions.length - 1 && styles.borderBottom,
                ]}
              >
                {/* Left: Icon / Indicator */}
                <View
                  style={[
                    styles.typeIndicator,
                    {
                      backgroundColor: isIncome ? colors.successBg : colors.dangerBg,
                      borderColor: isIncome ? colors.successBorder : colors.dangerBorder,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: isIncome ? colors.success : colors.danger,
                      fontWeight: 'bold',
                    }}
                  >
                    {isIncome ? '↓' : '↑'}
                  </Text>
                </View>

                {/* Middle: Details */}
                <View style={styles.detailsCol}>
                  <Text variant="body" weight="semiBold" color={colors.textPrimary} numberOfLines={1}>
                    {merchantOrTitle}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text variant="caption" color={colors.textSecondary}>
                      {tx.category || 'General'} • {dateStr}
                    </Text>
                    {sourceBadge && (
                      <View style={{ marginLeft: spacing.xs }}>
                        <Badge label={sourceBadge.label} variant={sourceBadge.variant} size="sm" />
                      </View>
                    )}
                  </View>
                </View>

                {/* Right: Amount */}
                <View style={styles.amountCol}>
                  <Text
                    variant="body"
                    weight="bold"
                    color={isIncome ? colors.success : colors.danger}
                  >
                    {isIncome ? '+' : '−'}{formatCurrency(tx.amount)}
                  </Text>
                  {tx.paymentMethod && (
                    <Text variant="caption" color={colors.textMuted}>
                      {String(tx.paymentMethod).toUpperCase()}
                    </Text>
                  )}
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
  container: {
    padding: spacing.md,
    marginBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
  },
  viewAllBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  emptyState: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  emptyTitle: {
    marginBottom: spacing.xs,
  },
  listContainer: {
    marginTop: spacing.xs,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  typeIndicator: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  amountCol: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
});

export default RecentTransactionsSection;
