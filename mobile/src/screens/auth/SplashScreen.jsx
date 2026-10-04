import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Badge, FinTrackLogo, FinTrackMark } from '../../components/index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const SplashScreen = () => {
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <FinTrackLogo variant="full" size="lg" isDark={false} />
      </Animated.View>

      <View style={styles.badgeRow}>
        <Badge label="MOBILE-FIRST" variant="primary" size="sm" />
        <View style={{ width: spacing.sm }} />
        <Badge label="SECURE ENGINE" variant="success" size="sm" />
      </View>

      <View style={styles.footer}>
        <Text variant="caption" color={colors.textMuted}>
          Restoring secure session...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footer: {
    position: 'absolute',
    bottom: spacing.xxxl,
    alignItems: 'center',
  },
});

export default SplashScreen;
