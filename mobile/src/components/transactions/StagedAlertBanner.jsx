import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Badge, Button } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const StagedAlertBanner = ({ stagedCount = 0, onReviewPress }) => {
  if (stagedCount <= 0) return null;

  return (
    <Card variant="warning" style={styles.container} testID="staged-transactions-alert">
      <View style={styles.contentRow}>
        <View style={styles.textCol}>
          <View style={styles.badgeRow}>
            <Badge label="INCOMING EVENTS" variant="warning" size="sm" />
            <Text variant="caption" color={colors.warning} weight="bold" style={styles.countText}>
              {stagedCount} Staged
            </Text>
          </View>
          <Text variant="bodySmall" color={colors.textPrimary} weight="medium" style={styles.title}>
            Automatic financial events are waiting for your verification.
          </Text>
        </View>

        {onReviewPress && (
          <Button
            title="Review"
            variant="primary"
            size="sm"
            onPress={onReviewPress}
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
    marginBottom: spacing.sm,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  countText: {
    marginLeft: spacing.xs,
  },
  title: {
    lineHeight: 18,
  },
  reviewBtn: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
});

export default StagedAlertBanner;
