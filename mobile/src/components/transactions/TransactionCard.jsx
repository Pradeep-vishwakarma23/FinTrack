import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatCurrency, formatDate, getConfidenceColor } from '../../utils/formatters.js';

// Format source indicators
export const getSourceBadge = (source) => {
  switch (String(source).toLowerCase()) {
    case 'notification':
      return { label: '📱 Notification', variant: 'primary' };
    case 'sms':
      return { label: '💬 SMS', variant: 'warning' };
    case 'email':
      return { label: '✉️ Email', variant: 'info' };
    case 'csv':
      return { label: '📄 CSV', variant: 'default' };
    case 'excel':
      return { label: '📊 Excel', variant: 'default' };
    case 'pdf':
      return { label: '📑 PDF', variant: 'default' };
    case 'receipt_ocr':
      return { label: '🧾 Receipt', variant: 'default' };
    case 'manual':
      return { label: '✏️ Manual', variant: 'default' };
    default:
      return null;
  }
};

export const TransactionCard = ({ transaction, onPress }) => {
  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const merchantName = transaction.merchant || transaction.title || 'Unknown Merchant';
  const dateStr = formatDate(transaction.transactionDate || transaction.createdAt, { short: true });
  const sourceBadge = getSourceBadge(transaction.source);
  
  // Format confidence percentage (e.g. 0.96 -> 96%)
  const hasConfidence = transaction.confidence !== undefined && transaction.source !== 'manual';
  const confidencePercent = hasConfidence
    ? Math.round((transaction.confidence <= 1 ? transaction.confidence * 100 : transaction.confidence))
    : null;

  return (
    <Card
      style={styles.card}
      onPress={onPress}
      testID={`transaction-card-${transaction._id || transaction.id}`}
    >
      <View style={styles.cardRow}>
        {/* Left: Type Indicator Icon */}
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: isIncome ? colors.successBg : colors.dangerBg },
          ]}
        >
          <Text
            style={{
              fontSize: 18,
              color: isIncome ? colors.success : colors.danger,
              fontWeight: 'bold',
            }}
          >
            {isIncome ? '↓' : '↑'}
          </Text>
        </View>

        {/* Middle: Merchant, Category, Date, Source */}
        <View style={styles.detailsCol}>
          <View style={styles.titleRow}>
            <Text variant="body" weight="bold" color={colors.textPrimary} numberOfLines={1} style={styles.merchantText}>
              {merchantName}
            </Text>
            {transaction.isDuplicate && (
              <Badge label="DUPLICATE" variant="warning" size="sm" style={styles.duplicateBadge} />
            )}
          </View>

          <View style={styles.metaRow}>
            <Text variant="caption" color={colors.textSecondary}>
              {transaction.category || 'General'} • {dateStr}
            </Text>
            {transaction.paymentMethod && (
              <Text variant="caption" color={colors.textMuted} style={styles.metaDivider}>
                • {String(transaction.paymentMethod).toUpperCase()}
              </Text>
            )}
          </View>

          <View style={styles.badgesRow}>
            {sourceBadge && (
              <Badge label={sourceBadge.label} variant={sourceBadge.variant} size="sm" style={styles.badgeItem} />
            )}
            {confidencePercent !== null && (
              <Badge
                label={`AI: ${confidencePercent}%`}
                variant={confidencePercent >= 90 ? 'success' : 'warning'}
                size="sm"
                style={styles.badgeItem}
              />
            )}
          </View>
        </View>

        {/* Right: Amount */}
        <View style={styles.amountCol}>
          <Text
            variant="body"
            weight="heavy"
            color={isIncome ? colors.success : colors.danger}
            numberOfLines={1}
          >
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Text>
          <Text variant="caption" color={colors.textMuted} style={styles.chevron}>
            Details ›
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  merchantText: {
    flexShrink: 1,
  },
  duplicateBadge: {
    marginLeft: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaDivider: {
    marginLeft: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  badgeItem: {
    marginRight: spacing.xs,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  chevron: {
    marginTop: 4,
    color: colors.primaryLight,
  },
});

export default TransactionCard;
