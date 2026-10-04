import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { Text } from '../index.js';
import { colors, spacing, borderRadius, shadows } from '../../theme/index.js';
import { openCopilot } from '../../store/slices/copilotSlice.js';

export const FloatingCopilotButton = ({ style, testID = 'floating-copilot-btn' }) => {
  const dispatch = useDispatch();

  return (
    <TouchableOpacity
      style={[styles.floatingButton, style]}
      onPress={() => dispatch(openCopilot())}
      activeOpacity={0.85}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Open FinTrack AI Copilot"
    >
      <Text style={styles.sparkleIcon}>✦</Text>
      <Text variant="caption" color={colors.textPrimary} weight="bold" style={styles.buttonText}>
        FinTrack Copilot
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 96 : 76,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    ...shadows.glow,
    elevation: 5,
    zIndex: 99,
  },
  sparkleIcon: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: 'bold',
  },
  buttonText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
});

export default FloatingCopilotButton;
