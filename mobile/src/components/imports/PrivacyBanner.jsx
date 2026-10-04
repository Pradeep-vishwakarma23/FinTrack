import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const PrivacyBanner = ({ style }) => {
  return (
    <Card variant="info" style={[styles.container, style]} testID="privacy-banner">
      <View style={styles.headerRow}>
        <Badge label="PRIVACY & SECURITY" variant="info" size="sm" />
        <Text variant="caption" color={colors.secondaryLight} weight="semiBold" style={styles.shieldText}>
          🔒 ZERO-OTP RETENTION
        </Text>
      </View>

      <Text variant="subtitle" color={colors.textPrimary} style={styles.title}>
        Your data is processed only for financial transaction detection
      </Text>

      <Text variant="bodySmall" color={colors.textSecondary} style={styles.body}>
        FinTrack extracts transaction metadata (merchant, amount, date, category) using safe deterministic patterns. Sensitive authentication tokens, passwords, and OTPs are filtered on ingestion and are never stored or logged.
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  shieldText: {
    marginLeft: spacing.xs,
  },
  title: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    fontSize: 15,
  },
  body: {
    lineHeight: 18,
  },
});

export default PrivacyBanner;
