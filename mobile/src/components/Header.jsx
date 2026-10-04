import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/index.js';
import Text from './Text.jsx';
import { FinTrackMark } from './brand/FinTrackLogo.jsx';

export const Header = ({
  title,
  subtitle,
  onBack,
  showBack = false,
  showLogo = false,
  showBrand = false,
  rightAction,
  rightActionText,
  onRightAction,
  style,
}) => {
  const hasBack = Boolean(onBack || showBack);
  const displayBrand = Boolean(showLogo || showBrand || (!hasBack && !subtitle));

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftRow}>
        {hasBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            testID="header-back-button"
          >
            <Text variant="body" color={colors.primary} weight="bold">
              ←
            </Text>
          </TouchableOpacity>
        ) : (showLogo || showBrand) ? (
          <View style={styles.logoWrapper}>
            <FinTrackMark size={28} />
          </View>
        ) : null}

        <View style={styles.titleContainer}>
          <Text variant="title" numberOfLines={1} ellipsizeMode="tail" style={styles.titleText}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="caption" color={colors.textSecondary} numberOfLines={1} ellipsizeMode="tail" style={styles.subtitleText}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightRow}>
        {rightAction}
        {rightActionText && onRightAction && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onRightAction}
            activeOpacity={0.7}
            accessibilityRole="button"
            testID="header-right-action"
          >
            <Text variant="bodySmall" color={colors.primary} weight="semiBold">
              {rightActionText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 44,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  logoWrapper: {
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    letterSpacing: -0.3,
  },
  subtitleText: {
    marginTop: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionButton: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

export default Header;
