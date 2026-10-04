import React, { useState } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Card, Text, Badge, Button } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { getSourceBadge } from './TransactionCard.jsx';

export const TransactionDetailModal = ({
  visible,
  transaction,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const merchantName = transaction.merchant || transaction.title || 'Transaction Details';
  const sourceBadge = getSourceBadge(transaction.source);
  
  const hasConfidence = transaction.confidence !== undefined && transaction.source !== 'manual';
  const confidencePercent = hasConfidence
    ? Math.round((transaction.confidence <= 1 ? transaction.confidence * 100 : transaction.confidence))
    : null;

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(transaction._id || transaction.id);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Top Bar / Drag handle */}
          <View style={styles.dragHandle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header / Amount Banner */}
            <View style={styles.amountBanner}>
              <View
                style={[
                  styles.typePill,
                  { backgroundColor: isIncome ? colors.successBg : colors.dangerBg },
                ]}
              >
                <Text
                  variant="caption"
                  color={isIncome ? colors.success : colors.danger}
                  weight="bold"
                >
                  {isIncome ? 'INCOME / INFLOW' : 'EXPENSE / OUTFLOW'}
                </Text>
              </View>

              <Text
                variant="hero"
                color={isIncome ? colors.success : colors.danger}
                style={styles.amountText}
              >
                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
              </Text>

              <Text variant="title" color={colors.textPrimary} align="center" style={styles.merchantHeader}>
                {merchantName}
              </Text>
            </View>

            {/* AI Intelligence & Confidence Card */}
            {hasConfidence && (
              <Card variant="glow" style={styles.aiCard}>
                <View style={styles.aiHeader}>
                  <View style={styles.aiBadgeRow}>
                    <Badge label="AI TRANSACTION ENGINE" variant="primary" size="sm" />
                    <Badge
                      label={`${confidencePercent}% Confidence`}
                      variant={confidencePercent >= 90 ? 'success' : 'warning'}
                      size="sm"
                      style={{ marginLeft: spacing.xs }}
                    />
                  </View>
                </View>
                <Text variant="caption" color={colors.textSecondary} style={styles.aiReason}>
                  {transaction.metadata?.reason ||
                    `Automatically extracted from ${transaction.source} stream with high categorization certainty.`}
                </Text>
              </Card>
            )}

            {/* Metadata Details Grid */}
            <Card style={styles.detailsCard}>
              <Text variant="subtitle" color={colors.textPrimary} style={styles.sectionTitle}>
                Transaction Details
              </Text>

              <View style={styles.detailRow}>
                <Text variant="caption" color={colors.textMuted}>CATEGORY</Text>
                <Text variant="bodySmall" color={colors.textPrimary} weight="semiBold">
                  {transaction.category || 'General'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text variant="caption" color={colors.textMuted}>TRANSACTION DATE</Text>
                <Text variant="bodySmall" color={colors.textPrimary} weight="medium">
                  {formatDate(transaction.transactionDate || transaction.createdAt)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text variant="caption" color={colors.textMuted}>PAYMENT METHOD</Text>
                <Text variant="bodySmall" color={colors.textPrimary} weight="medium">
                  {String(transaction.paymentMethod || 'card').toUpperCase()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text variant="caption" color={colors.textMuted}>INGESTION SOURCE</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {sourceBadge ? (
                    <Badge label={sourceBadge.label} variant={sourceBadge.variant} size="sm" />
                  ) : (
                    <Text variant="bodySmall" color={colors.textSecondary}>Manual</Text>
                  )}
                </View>
              </View>

              {transaction.externalTransactionId ? (
                <View style={styles.detailRow}>
                  <Text variant="caption" color={colors.textMuted}>REFERENCE ID</Text>
                  <Text variant="caption" color={colors.secondary} weight="medium">
                    {transaction.externalTransactionId}
                  </Text>
                </View>
              ) : null}

              {transaction.isDuplicate ? (
                <View style={styles.detailRow}>
                  <Text variant="caption" color={colors.warning}>DUPLICATE STATUS</Text>
                  <Badge label="POSSIBLE DUPLICATE" variant="warning" size="sm" />
                </View>
              ) : null}

              {transaction.description ? (
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text variant="caption" color={colors.textMuted}>NOTES / DESCRIPTION</Text>
                  <Text variant="bodySmall" color={colors.textSecondary} style={{ marginTop: 2 }}>
                    {transaction.description}
                  </Text>
                </View>
              ) : null}
            </Card>

            {/* Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <Button
                title="Edit Transaction"
                variant="secondary"
                onPress={() => onEdit(transaction)}
                style={{ flex: 1, marginRight: spacing.sm }}
                testID="transaction-detail-edit"
              />
              <Button
                title="Delete"
                variant="danger"
                loading={isDeleting}
                onPress={handleDelete}
                style={{ flex: 1 }}
                testID="transaction-detail-delete"
              />
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text variant="bodySmall" color={colors.textMuted} weight="bold">
                Close Details
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceBorder,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  amountBanner: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  typePill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  amountText: {
    marginVertical: spacing.xs,
  },
  merchantHeader: {
    marginTop: 2,
  },
  aiCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  aiHeader: {
    marginBottom: spacing.xs,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiReason: {
    lineHeight: 18,
  },
  detailsCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  detailRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    justifyContent: 'space-between',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});

export default TransactionDetailModal;
