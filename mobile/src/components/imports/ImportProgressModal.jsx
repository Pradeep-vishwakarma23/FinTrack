import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Card, Text, Button, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const ImportProgressModal = ({
  visible,
  isUploading,
  uploadStage = 'idle',
  result = null,
  error = null,
  onReviewPress,
  onClose,
}) => {
  if (!visible) return null;

  const isCompleted = uploadStage === 'completed' && result;
  const isError = uploadStage === 'error' || Boolean(error);

  const batch = result?.batch || result?.data?.batch;
  const stagedCount = result?.stagedCount || result?.data?.stagedCount || batch?.processedRecords || 0;
  const highConfCount = batch?.summary?.highConfidenceCount ?? 0;
  const needReviewCount = Math.max(0, stagedCount - highConfCount);
  const dupesCount = batch?.duplicateRecords ?? 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Card style={styles.modalContent} testID="import-progress-modal">
          {/* Header */}
          <View style={styles.header}>
            <Text variant="title" style={styles.title}>
              {isCompleted
                ? 'Import Completed'
                : isError
                ? 'Import Failed'
                : 'Processing Financial Data...'}
            </Text>
            {!isUploading && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Progress Steps */}
          {isUploading && (
            <View style={styles.stepList}>
              <View style={styles.stepItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text variant="bodySmall" color={colors.textPrimary}>
                  File/Data received
                </Text>
              </View>
              <View style={styles.stepItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text variant="bodySmall" color={colors.textPrimary}>
                  Transactions extracted & normalized
                </Text>
              </View>
              <View style={styles.stepItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text variant="bodySmall" color={colors.textPrimary}>
                  Smart categories assigned
                </Text>
              </View>
              <View style={styles.stepItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text variant="bodySmall" color={colors.textPrimary}>
                  Duplicate detection check running
                </Text>
              </View>
              <View style={styles.stepItem}>
                <ActivityIndicator size="small" color={colors.primaryLight} style={{ marginRight: spacing.sm }} />
                <Text variant="bodySmall" color={colors.primaryLight} weight="medium">
                  Calculating confidence scores...
                </Text>
              </View>
            </View>
          )}

          {/* Error State */}
          {isError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text variant="bodySmall" color={colors.danger} align="center" style={styles.errorMessage}>
                {error || 'An error occurred while processing your financial data. Please check the file format and try again.'}
              </Text>
              <Button
                title="Close"
                variant="secondary"
                size="md"
                onPress={onClose}
                style={styles.actionBtn}
              />
            </View>
          )}

          {/* Completed State */}
          {isCompleted && (
            <View style={styles.successContainer}>
              <View style={styles.successIconBadge}>
                <Text style={styles.successIcon}>⚡</Text>
              </View>

              <Text variant="subtitle" color={colors.textPrimary} align="center" style={styles.resultTitle}>
                {stagedCount} {stagedCount === 1 ? 'Transaction Detected' : 'Transactions Detected'}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text variant="caption" color={colors.success} weight="bold">
                    {highConfCount}
                  </Text>
                  <Text variant="caption" color={colors.textMuted}>
                    High Confidence
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text variant="caption" color={colors.warning} weight="bold">
                    {needReviewCount}
                  </Text>
                  <Text variant="caption" color={colors.textMuted}>
                    Needs Review
                  </Text>
                </View>

                {dupesCount > 0 && (
                  <View style={styles.statBox}>
                    <Text variant="caption" color={colors.danger} weight="bold">
                      {dupesCount}
                    </Text>
                    <Text variant="caption" color={colors.textMuted}>
                      Duplicates Flagged
                    </Text>
                  </View>
                )}
              </View>

              <Text variant="bodySmall" color={colors.textSecondary} align="center" style={styles.stagedNotice}>
                Transactions are safely staged. Please review and confirm them to update your confirmed ledger and dashboard analytics.
              </Text>

              <View style={styles.buttonRow}>
                <Button
                  title={`Review Staged (${stagedCount})`}
                  variant="primary"
                  size="md"
                  onPress={() => {
                    onClose();
                    if (onReviewPress) onReviewPress();
                  }}
                  style={styles.primaryActionBtn}
                />
                <Button
                  title="Later"
                  variant="ghost"
                  size="sm"
                  onPress={onClose}
                  style={styles.secondaryActionBtn}
                />
              </View>
            </View>
          )}
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
    marginBottom: spacing.lg,
  },
  title: {
    flex: 1,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 18,
    color: colors.textMuted,
  },
  stepList: {
    marginVertical: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkIcon: {
    fontSize: 16,
    color: colors.success,
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  errorIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIconBadge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  successIcon: {
    fontSize: 24,
  },
  resultTitle: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statBox: {
    alignItems: 'center',
  },
  stagedNotice: {
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  buttonRow: {
    width: '100%',
    alignItems: 'center',
  },
  primaryActionBtn: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  secondaryActionBtn: {
    width: '100%',
  },
  actionBtn: {
    width: '100%',
  },
});

export default ImportProgressModal;
