import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Text, Badge, Button } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const PendingDetectedBanner = ({
  stagedCount = 0,
  onReviewPress,
}) => {
  if (stagedCount <= 0) return null;

  return (
    <Card variant="warning" style={styles.container} testID="pending-detected-banner">
      <View style={styles.headerRow}>
        <View style={styles.titleWithBadge}>
          <Badge label="ACTION REQUIRED" variant="warning" size="sm" />
          <Text variant="caption" color={colors.warning} weight="bold" style={styles.badgeText}>
            ⚡ AUTOMATIC INGESTION
          </Text>
        </View>
        <Text variant="bodySmall" color={colors.warning} weight="bold">
          {stagedCount} {stagedCount === 1 ? 'Item' : 'Items'}
        </Text>
      </View>

      <Text variant="subtitle" color={colors.textPrimary} style={styles.title}>
        Transactions Waiting for Review
      </Text>

      <Text variant="bodySmall" color={colors.textSecondary} style={styles.description}>
        FinTrack automatically intercepted {stagedCount} {stagedCount === 1 ? 'transaction' : 'transactions'} awaiting your verification before being committed to your primary ledger.
      </Text>

      <View style={styles.actionRow}>
        <Button
          title={`Review Detected (${stagedCount})`}
          variant="primary"
          size="sm"
          onPress={onReviewPress}
          style={styles.reviewButton}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    marginLeft: spacing.xs,
  },
  title: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  description: {
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
  },
  reviewButton: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
  },
});

export default PendingDetectedBanner;
