import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const FinancialAlertsSection = ({ alerts = [] }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <View style={styles.container} testID="financial-alerts-section">
      <Text variant="subtitle" color={colors.textPrimary} style={styles.sectionHeader}>
        Financial Insights & Alerts
      </Text>

      {alerts.map((alert) => {
        const isDanger = alert.type === 'danger';
        const isWarning = alert.type === 'warning';
        const isSuccess = alert.type === 'success';

        const borderColor = isDanger
          ? colors.dangerBorder
          : isWarning
          ? colors.warningBorder
          : colors.successBorder;

        const iconSymbol = isDanger ? '⚠️' : isWarning ? '⚡' : '🎯';

        return (
          <Card
            key={alert.id}
            variant={isDanger ? 'danger' : isWarning ? 'warning' : 'success'}
            style={[styles.alertCard, { borderColor }]}
          >
            <View style={styles.alertHeader}>
              <View style={styles.iconTitleRow}>
                <Text style={styles.alertIcon}>{iconSymbol}</Text>
                <Text variant="body" weight="bold" color={colors.textPrimary}>
                  {alert.title}
                </Text>
              </View>
              <Badge
                label={alert.type.toUpperCase()}
                variant={isDanger ? 'danger' : isWarning ? 'warning' : 'success'}
                size="sm"
              />
            </View>

            <Text variant="bodySmall" color={colors.textSecondary} style={styles.alertMessage}>
              {alert.message}
            </Text>
          </Card>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  alertCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  alertMessage: {
    lineHeight: 18,
    marginTop: 2,
  },
});

export default FinancialAlertsSection;
