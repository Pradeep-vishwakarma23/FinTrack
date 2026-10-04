import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/index.js';
import Text from './Text.jsx';

export const ErrorBanner = ({
  message,
  type = 'danger',
  onDismiss,
  onRetry,
  style,
}) => {
  if (!message) return null;

  const getVariantStyles = () => {
    switch (type) {
      case 'warning':
        return {
          container: styles.warningContainer,
          textColor: colors.warning,
          icon: '⚠️',
        };
      case 'info':
        return {
          container: styles.infoContainer,
          textColor: colors.info,
          icon: 'ℹ️',
        };
      case 'success':
        return {
          container: styles.successContainer,
          textColor: colors.success,
          icon: '✓',
        };
      default:
        return {
          container: styles.dangerContainer,
          textColor: colors.danger,
          icon: '⚠️',
        };
    }
  };

  const { container, textColor, icon } = getVariantStyles();

  return (
    <View style={[styles.base, container, style]}>
      <View style={styles.iconWrapper}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>

      <View style={styles.contentWrapper}>
        <Text variant="bodySmall" color={textColor} weight="medium">
          {message}
        </Text>
      </View>

      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text variant="caption" color={textColor} weight="bold">
            RETRY
          </Text>
        </TouchableOpacity>
      )}

      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          activeOpacity={0.7}
        >
          <Text variant="bodySmall" color={colors.textMuted} weight="bold">
            ✕
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  dangerContainer: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  warningContainer: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
  },
  infoContainer: {
    backgroundColor: colors.infoBg,
    borderColor: colors.infoBorder,
  },
  successContainer: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  iconWrapper: {
    marginRight: spacing.sm,
  },
  contentWrapper: {
    flex: 1,
  },
  retryButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.xs,
    marginLeft: spacing.sm,
  },
  dismissButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default ErrorBanner;
