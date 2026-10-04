import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/index.js';
import Text from './Text.jsx';

export const Badge = ({
  label,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: colors.successBg,
          border: colors.successBorder,
          text: colors.success,
        };
      case 'warning':
        return {
          bg: colors.warningBg,
          border: colors.warningBorder,
          text: colors.warning,
        };
      case 'danger':
        return {
          bg: colors.dangerBg,
          border: colors.dangerBorder,
          text: colors.danger,
        };
      case 'info':
        return {
          bg: colors.infoBg,
          border: colors.infoBorder,
          text: colors.info,
        };
      case 'primary':
        return {
          bg: colors.primaryGlow,
          border: colors.surfaceBorderActive,
          text: colors.primaryLight,
        };
      default:
        return {
          bg: colors.surfaceElevated,
          border: colors.surfaceBorder,
          text: colors.textSecondary,
        };
    }
  };

  const { bg, border, text } = getVariantStyles();

  return (
    <View
      style={[
        styles.base,
        size === 'sm' ? styles.size_sm : styles.size_md,
        { backgroundColor: bg, borderColor: border },
        style,
      ]}
    >
      <Text
        variant="badge"
        color={text}
        style={textStyle}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  size_sm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  size_md: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});

export default Badge;
