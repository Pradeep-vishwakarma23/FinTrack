import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors.js';

/**
 * FinTrack Official Brand Logo for Mobile
 * Reusable across splash, auth, navbar headers, and drawer.
 * Variants: 'full' | 'compact' | 'icon'
 */
export const FinTrackMark = ({ size = 36 }) => {
  const scale = size / 36;
  return (
    <View
      style={[
        styles.markContainer,
        {
          width: size,
          height: size,
          borderRadius: Math.max(6, 10 * scale),
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel="FinTrack Logo Symbol"
    >
      {/* Upper Ribbon Loop */}
      <View
        style={[
          styles.ribbonUpper,
          {
            top: 4 * scale,
            left: 5 * scale,
            width: 22 * scale,
            height: 10 * scale,
            borderTopLeftRadius: 8 * scale,
            borderTopRightRadius: 8 * scale,
            borderBottomRightRadius: 6 * scale,
          },
        ]}
      />
      {/* Mid Ribbon Bar */}
      <View
        style={[
          styles.ribbonMid,
          {
            top: 13 * scale,
            left: 5 * scale,
            width: 16 * scale,
            height: 5 * scale,
            borderRadius: 3 * scale,
          },
        ]}
      />
      {/* 3 Rising Financial Bars */}
      <View style={[styles.barsRow, { bottom: 4 * scale, left: 6 * scale }]}>
        <View style={[styles.bar, { width: 3.5 * scale, height: 7 * scale, borderRadius: 1.5 * scale }]} />
        <View style={[styles.bar, { width: 3.5 * scale, height: 11 * scale, borderRadius: 1.5 * scale }]} />
        <View style={[styles.bar, { width: 3.5 * scale, height: 15 * scale, borderRadius: 1.5 * scale }]} />
      </View>
    </View>
  );
};

export const FinTrackLogo = ({
  variant = 'full', // 'full' | 'compact' | 'icon'
  size = 'md', // 'sm' | 'md' | 'lg'
  isDark = false, // Defaults to false for FinTrack light theme (#F7FBF9 / #FFFFFF)
  style,
}) => {
  const markSizes = {
    sm: 28,
    md: 38,
    lg: 52,
  };

  const fontSizes = {
    sm: { title: 16, sub: 7 },
    md: { title: 22, sub: 9 },
    lg: { title: 28, sub: 11 },
  };

  const currentMarkSize = markSizes[size] || markSizes.md;
  const currentFontSize = fontSizes[size] || fontSizes.md;

  if (variant === 'icon') {
    return (
      <View style={[styles.container, style]}>
        <FinTrackMark size={currentMarkSize} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <FinTrackMark size={currentMarkSize} />
      <View style={styles.textContainer}>
        <View style={styles.wordmarkRow}>
          <Text style={[styles.finText, { fontSize: currentFontSize.title, color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Fin
          </Text>
          <Text style={[styles.trackText, { fontSize: currentFontSize.title }]}>
            Track
          </Text>
          <Text style={[styles.trademarkText, { fontSize: currentFontSize.title * 0.45 }]}>
            ™
          </Text>
        </View>
        {variant === 'full' && (
          <Text style={[styles.taglineText, { fontSize: currentFontSize.sub }]}>
            AI-POWERED PERSONAL FINANCE
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markContainer: {
    backgroundColor: '#0F1F19',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ribbonUpper: {
    position: 'absolute',
    backgroundColor: '#10B981',
  },
  ribbonMid: {
    position: 'absolute',
    backgroundColor: '#059669',
  },
  barsRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2.5,
  },
  bar: {
    backgroundColor: '#10B981',
  },
  textContainer: {
    justifyContent: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  finText: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  trackText: {
    color: '#10B981',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  trademarkText: {
    color: '#10B981',
    fontWeight: '700',
    marginLeft: 1,
  },
  taglineText: {
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 1.1,
    marginTop: 1,
  },
});

export default FinTrackLogo;
