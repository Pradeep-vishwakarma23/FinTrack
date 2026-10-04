import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Button, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const PermissionExplanationModal = ({
  visible,
  onOpenSettings,
  onCancel,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Card style={styles.modalContent} testID="permission-explanation-modal">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.icon}>🔔</Text>
              <Text variant="title" style={styles.title}>
                Enable Notification Access
              </Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Explanation content */}
          <View style={styles.body}>
            <Text variant="bodySmall" color={colors.textPrimary} style={styles.paragraph}>
              FinTrack can automatically detect financial transaction alerts from your Android push notifications.
            </Text>

            <View style={styles.guaranteeBox}>
              <View style={styles.pointRow}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text variant="bodySmall" color={colors.textSecondary} style={styles.pointText}>
                  Filtered on-device before any financial information is processed.
                </Text>
              </View>

              <View style={styles.pointRow}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text variant="bodySmall" color={colors.textSecondary} style={styles.pointText}>
                  Sensitive OTPs, PINs, CVVs, and passwords are never collected or stored.
                </Text>
              </View>

              <View style={styles.pointRow}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text variant="bodySmall" color={colors.textSecondary} style={styles.pointText}>
                  Transactions remain staged. You control whether to Confirm, Edit, or Ignore.
                </Text>
              </View>
            </View>

            <Text variant="caption" color={colors.textMuted} style={styles.footnote}>
              In the Android Settings screen, locate "FinTrack" and toggle Notification Access to allow on-device financial detection.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              variant="secondary"
              size="md"
              onPress={onCancel}
              style={styles.cancelBtn}
            />
            <Button
              title="Open Android Settings"
              variant="primary"
              size="md"
              onPress={onOpenSettings}
              style={styles.settingsBtn}
              testID="open-settings-button"
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    padding: spacing.xl,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.surfaceBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 22,
    marginRight: spacing.xs,
  },
  title: {
    fontSize: 17,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 18,
    color: colors.textMuted,
  },
  body: {
    marginBottom: spacing.lg,
  },
  paragraph: {
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  guaranteeBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  checkIcon: {
    color: colors.success,
    fontWeight: 'bold',
    marginRight: spacing.xs,
    fontSize: 14,
  },
  pointText: {
    flex: 1,
    lineHeight: 18,
  },
  footnote: {
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
  },
  settingsBtn: {
    flex: 2,
  },
});

export default PermissionExplanationModal;
