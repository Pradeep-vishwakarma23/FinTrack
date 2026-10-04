import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme/index.js';

export const Card = ({
  children,
  onPress,
  variant = 'default',
  style,
  contentStyle,
  ...props
}) => {
  const CardContainer = onPress ? TouchableOpacity : View;

  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return styles.elevated;
      case 'glow':
        return styles.glow;
      case 'outline':
        return styles.outline;
      case 'success':
        return styles.success;
      case 'warning':
        return styles.warning;
      case 'danger':
        return styles.danger;
      default:
        return styles.default;
    }
  };

  return (
    <CardContainer
      style={[styles.base, getVariantStyle(), style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      {...props}
    >
      <View style={[styles.innerContent, contentStyle]}>{children}</View>
    </CardContainer>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  innerContent: {
    padding: spacing.lg,
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  glow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
    ...shadows.glow,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  success: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  warning: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  danger: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
});

export default Card;
