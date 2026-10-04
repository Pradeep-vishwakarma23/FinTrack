import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card, Text, Badge, Button } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatDate } from '../../utils/formatters.js';

export const BatchHistoryCard = ({
  batch,
  onReviewPress,
  onDeletePress,
}) => {
  if (!batch) return null;

  const total = batch.processedRecords || batch.totalRecords || 0;
  const confirmed = batch.confirmedRecords || 0;
  const ignored = batch.ignoredRecords || 0;
  const pending = Math.max(0, total - confirmed - ignored);

  const getSourceBadge = () => {
    switch (batch.source) {
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

  const getStatusBadge = () => {
    if (batch.status === 'COMPLETED' || pending === 0) {
      return <Badge label="COMPLETED" variant="success" size="sm" />;
    }
    if (batch.status === 'FAILED') {
      return <Badge label="FAILED" variant="danger" size="sm" />;
    }
    return <Badge label="REVIEW REQUIRED" variant="warning" size="sm" />;
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Import Batch?',
      'This will remove this batch record and discard all unconfirmed staged transactions associated with it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => onDeletePress(batch._id || batch.id),
        },
      ]
    );
  };

  return (
    <Card style={styles.container} testID={`batch-card-${batch._id || batch.id}`}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.badgesRow}>
          {getSourceBadge()}
          <View style={{ width: spacing.xs }} />
          {getStatusBadge()}
        </View>
        <Text variant="caption" color={colors.textMuted}>
          {formatDate(batch.createdAt || new Date())}
        </Text>
      </View>

      {/* File Name / Identifier */}
      <Text variant="subtitle" color={colors.textPrimary} style={styles.fileName} numberOfLines={1}>
        {batch.fileName || 'Financial Statement Batch'}
      </Text>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text variant="bodySmall" weight="bold" color={colors.textPrimary}>
            {total}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            Detected
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text variant="bodySmall" weight="bold" color={colors.success}>
            {confirmed}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            Confirmed
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text variant="bodySmall" weight="bold" color={colors.danger}>
            {ignored}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            Ignored
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text variant="bodySmall" weight="bold" color={pending > 0 ? colors.warning : colors.textMuted}>
            {pending}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            Pending
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        {onDeletePress && (
          <Button
            title="Discard"
            variant="ghost"
            size="sm"
            onPress={handleDiscard}
            style={styles.discardBtn}
          />
        )}
        {pending > 0 && onReviewPress && (
          <Button
            title={`Review Staged (${pending})`}
            variant="primary"
            size="sm"
            onPress={() => onReviewPress(batch._id || batch.id)}
            style={styles.reviewBtn}
          />
        )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 15,
    marginBottom: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.surfaceBorder,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
  },
  discardBtn: {
    minHeight: 36,
  },
  reviewBtn: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
});

export default BatchHistoryCard;
