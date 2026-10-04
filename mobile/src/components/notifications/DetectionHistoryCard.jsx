import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const DetectionHistoryCard = ({
  stats = {},
  style,
}) => {
  const totalEvents = stats.totalEvents || 0;
  const staged = stats.stagedCount || 0;
  const confirmed = stats.confirmedCount || 0;
  const duplicates = stats.duplicatesCount || 0;
  const ignored = stats.ignoredCount || 0;
  const discarded = Math.max(0, totalEvents - staged - confirmed - ignored);

  return (
    <Card style={[styles.container, style]} testID="detection-history-card">
      <View style={styles.headerRow}>
        <Text variant="subtitle" color={colors.textPrimary}>
          Detection Activity & Ingestion Stats
        </Text>
        <Badge label="REAL-TIME METRICS" variant="info" size="sm" />
      </View>

      <Text variant="caption" color={colors.textSecondary} style={styles.subtext}>
        Local on-device parsing metrics and transaction conversion pipeline history.
      </Text>

      {/* Grid of Metric Cards */}
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text variant="title" color={colors.textPrimary} style={styles.countText}>
            {totalEvents}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            Events Processed
          </Text>
        </View>

        <View style={styles.gridItem}>
          <Text variant="title" color={colors.warning} style={styles.countText}>
            {staged}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            Staged in Queue
          </Text>
        </View>

        <View style={styles.gridItem}>
          <Text variant="title" color={colors.success} style={styles.countText}>
            {confirmed}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            Confirmed to Ledger
          </Text>
        </View>

        <View style={styles.gridItem}>
          <Text variant="title" color={colors.danger} style={styles.countText}>
            {duplicates}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            Duplicates Flagged
          </Text>
        </View>
      </View>

      {/* Security Summary Footer */}
      <View style={styles.securityFooter}>
        <Text style={styles.shieldIcon}>🛡️</Text>
        <Text variant="caption" color={colors.secondaryLight} style={styles.footerText}>
          Non-financial and sensitive OTP notifications are filtered locally on-device before any network transfer.
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subtext: {
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  gridItem: {
    flexBasis: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  countText: {
    fontSize: 20,
    marginBottom: 2,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  shieldIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  footerText: {
    flex: 1,
    lineHeight: 16,
  },
});

export default DetectionHistoryCard;
