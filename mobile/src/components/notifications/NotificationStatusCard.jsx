import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Badge, Button } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatDate } from '../../utils/formatters.js';

export const NotificationStatusCard = ({
  isConnected,
  isEnabled,
  lastDetectedAt,
  onToggle,
  onOpenSettings,
}) => {
  return (
    <Card style={styles.container} testID="notification-status-card">
      {/* Status Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Text style={styles.icon}>🔔</Text>
          <View>
            <Text variant="subtitle" color={colors.textPrimary}>
              Android Financial Notifications
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              Local background push detection
            </Text>
          </View>
        </View>

        <Badge
          label={isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          variant={isConnected ? 'success' : 'secondary'}
          size="sm"
        />
      </View>

      {/* Connection Indicator & Info */}
      <View style={styles.statusBox}>
        <View style={styles.statusDotRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? colors.success : colors.textMuted },
            ]}
          />
          <Text
            variant="bodySmall"
            weight="bold"
            color={isConnected ? colors.success : colors.textMuted}
          >
            {isConnected
              ? '● Notification Listener Active'
              : '○ Listener Inactive / Permission Required'}
          </Text>
        </View>

        <Text variant="caption" color={colors.textSecondary} style={styles.lastEventText}>
          Last detected event:{' '}
          {lastDetectedAt
            ? formatDate(lastDetectedAt, { time: true })
            : 'No events intercepted yet'}
        </Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.actionRow}>
        <Button
          title={isEnabled ? 'Disable Detection' : 'Enable Notification Detection'}
          variant={isEnabled ? 'danger' : 'primary'}
          size="md"
          onPress={() => onToggle(!isEnabled)}
          style={styles.toggleBtn}
          testID="notification-toggle-button"
        />
        {!isConnected && isEnabled && onOpenSettings && (
          <Button
            title="Grant Permission"
            variant="secondary"
            size="md"
            onPress={onOpenSettings}
            style={styles.settingsBtn}
            testID="grant-permission-button"
          />
        )}
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
    marginBottom: spacing.md,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  statusBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  lastEventText: {
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleBtn: {
    flex: 1,
  },
  settingsBtn: {
    flex: 1,
  },
});

export default NotificationStatusCard;
