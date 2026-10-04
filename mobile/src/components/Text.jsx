import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { colors, typography } from '../theme/index.js';

export const Text = ({
  children,
  variant = 'body',
  color,
  align = 'left',
  weight,
  style,
  numberOfLines,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'hero':
        return styles.hero;
      case 'title':
        return styles.title;
      case 'subtitle':
        return styles.subtitle;
      case 'body':
        return styles.body;
      case 'bodySmall':
        return styles.bodySmall;
      case 'caption':
        return styles.caption;
      case 'badge':
        return styles.badge;
      case 'label':
        return styles.label;
      default:
        return styles.body;
    }
  };

  const customStyle = [
    getVariantStyle(),
    color ? { color } : null,
    align ? { textAlign: align } : null,
    weight ? { fontWeight: typography.weights[weight] || weight } : null,
    style,
  ];

  return (
    <RNText style={customStyle} numberOfLines={numberOfLines} {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  hero: {
    fontSize: typography.sizes.hero,
    lineHeight: typography.lineHeights.hero,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
  },
  title: {
    fontSize: typography.sizes.xxl,
    lineHeight: typography.lineHeights.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    lineHeight: typography.lineHeights.lg,
    fontWeight: typography.weights.semiBold,
    color: colors.textSecondary,
  },
  body: {
    fontSize: typography.sizes.md,
    lineHeight: typography.lineHeights.md,
    fontWeight: typography.weights.regular,
    color: colors.textPrimary,
  },
  bodySmall: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.weights.regular,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: typography.sizes.xs,
    lineHeight: typography.lineHeights.xs,
    fontWeight: typography.weights.regular,
    color: colors.textMuted,
  },
  label: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  badge: {
    fontSize: typography.sizes.xs,
    lineHeight: typography.lineHeights.xs,
    fontWeight: typography.weights.bold,
  }
});

export default Text;
