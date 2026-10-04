import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card, Text, Badge, Button } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

export const StagedTransactionCard = ({
  transaction,
  onConfirm,
  onEdit,
  onIgnore,
  isProcessing = false,
}) => {
  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const amountPrefix = isIncome ? '+' : isTransfer ? '' : '-';
  const amountColor = isIncome ? colors.income : isTransfer ? colors.textPrimary : colors.expense;

  // Confidence calculations
  const rawConfidence = Number(transaction.confidence ?? 0.85);
  const confidencePercent = Math.round(rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence);
  const isHighConfidence = confidencePercent >= 85;
  const isMediumConfidence = confidencePercent >= 60 && confidencePercent < 85;

  const getConfidenceBadge = () => {
    if (isHighConfidence) {
      return (
        <Badge
          label={`🎯 ${confidencePercent}% High Confidence`}
          variant="success"
          size="sm"
        />
      );
    }
    if (isMediumConfidence) {
      return (
        <Badge
          label={`⚡ ${confidencePercent}% Medium Confidence`}
          variant="warning"
          size="sm"
        />
      );
    }
    return (
      <Badge
        label={`⚠️ ${confidencePercent}% Review Recommended`}
        variant="danger"
        size="sm"
      />
    );
  };

  const getSourceBadge = () => {
    switch (transaction.source) {
      case 'notification':
      case 'android_notification':
        return <Badge label="🔔 NOTIFICATION" variant="warning" size="sm" />;
      case 'csv':
        return <Badge label="📄 CSV" variant="primary" size="sm" />;
      case 'excel':
        return <Badge label="📊 EXCEL" variant="info" size="sm" />;
      case 'sms':
        return <Badge label="💬 SMS" variant="success" size="sm" />;
      default:
        return <Badge label="⚡ AUTO" variant="secondary" size="sm" />;
    }
  };

  const handleIgnore = () => {
    Alert.alert(
      'Ignore Detected Transaction?',
      `Are you sure you want to ignore "${transaction.title || transaction.merchant || 'this transaction'}"? It will not be added to your ledger.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ignore',
          style: 'destructive',
          onPress: () => onIgnore(transaction._id || transaction.id),
        },
      ]
    );
  };

  return (
    <Card style={styles.container} testID={`staged-card-${transaction._id || transaction.id}`}>
      {/* Top Meta Row: Source + Confidence */}
      <View style={styles.metaRow}>
        <View style={styles.leftBadges}>
          {getSourceBadge()}
          <View style={{ width: spacing.xs }} />
          <Badge
            label={transaction.category || 'Uncategorized'}
            variant="secondary"
            size="sm"
          />
        </View>
        {getConfidenceBadge()}
      </View>

      {/* Duplicate Warning Alert */}
      {transaction.isDuplicate && (
        <View style={styles.duplicateBanner} testID="duplicate-warning-banner">
          <Text style={styles.duplicateIcon}>⚠️</Text>
          <View style={styles.duplicateTextCol}>
            <Text variant="caption" color={colors.warning} weight="bold">
              Possible Duplicate Detected
            </Text>
            <Text variant="caption" color={colors.textMuted}>
              A similar transaction exists in your confirmed ledger or batch.
            </Text>
          </View>
        </View>
      )}

      {/* Main Details: Merchant & Amount */}
      <View style={styles.mainRow}>
        <View style={styles.detailsCol}>
          <Text variant="subtitle" color={colors.textPrimary} numberOfLines={1} style={styles.titleText}>
            {transaction.merchant || transaction.title || 'Unknown Merchant'}
          </Text>
          <View style={styles.subInfoRow}>
            <Text variant="caption" color={colors.textMuted}>
              {formatDate(transaction.transactionDate || transaction.date || new Date())}
            </Text>
            <Text variant="caption" color={colors.textMuted} style={styles.dot}>
              •
            </Text>
            <Text variant="caption" color={colors.secondaryLight} weight="medium">
              {transaction.paymentMethod?.toUpperCase() || 'UPI'}
            </Text>
            {transaction.type && (
              <>
                <Text variant="caption" color={colors.textMuted} style={styles.dot}>
                  •
                </Text>
                <Text
                  variant="caption"
                  color={isIncome ? colors.income : colors.textSecondary}
                  weight="medium"
                >
                  {transaction.type.toUpperCase()}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountCol}>
          <Text variant="subtitle" color={amountColor} weight="bold">
            {amountPrefix}
            {formatCurrency(transaction.amount)}
          </Text>
          <Badge label="STAGED" variant="warning" size="sm" style={styles.stagedBadge} />
        </View>
      </View>

      {/* Description or Raw Extraction Reference */}
      {(transaction.description || transaction.sourceReference) ? (
        <Text variant="caption" color={colors.textMuted} numberOfLines={2} style={styles.description}>
          {transaction.description || `Ref: ${transaction.sourceReference}`}
        </Text>
      ) : null}

      {/* Actions Row: [Ignore] [Edit] [Confirm] */}
      <View style={styles.actionRow}>
        <Button
          title="Ignore"
          variant="ghost"
          size="sm"
          onPress={handleIgnore}
          disabled={isProcessing}
          style={styles.ignoreBtn}
          testID={`ignore-btn-${transaction._id || transaction.id}`}
        />
        <Button
          title="Edit"
          variant="secondary"
          size="sm"
          onPress={() => onEdit(transaction)}
          disabled={isProcessing}
          style={styles.editBtn}
          testID={`edit-btn-${transaction._id || transaction.id}`}
        />
        <Button
          title="Confirm"
          variant="primary"
          size="sm"
          onPress={() => onConfirm(transaction._id || transaction.id)}
          disabled={isProcessing}
          style={styles.confirmBtn}
          testID={`confirm-btn-${transaction._id || transaction.id}`}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  leftBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duplicateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    marginBottom: spacing.sm,
  },
  duplicateIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
    marginLeft: 2,
  },
  duplicateTextCol: {
    flex: 1,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailsCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  titleText: {
    fontSize: 16,
    marginBottom: 2,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dot: {
    marginHorizontal: 4,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  stagedBadge: {
    marginTop: 2,
  },
  description: {
    lineHeight: 16,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  ignoreBtn: {
    minHeight: 36,
  },
  editBtn: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  confirmBtn: {
    minHeight: 36,
    paddingHorizontal: spacing.lg,
  },
});

export default StagedTransactionCard;
