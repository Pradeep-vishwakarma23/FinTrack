import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Container, Text, Card, Badge, Header } from '../../components/index.js';
import { colors, spacing } from '../../theme/index.js';

export const TransactionsPlaceholderScreen = () => {
  return (
    <Container scrollable contentContainerStyle={styles.container}>
      <Header title="Transactions" subtitle="Ledger & Automatic Staging" />

      <Card variant="glow" style={styles.card}>
        <Badge label="PHASE 3 ROADMAP" variant="primary" size="sm" />
        <Text variant="title" style={styles.title}>
          Transaction Intelligence
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary} style={styles.description}>
          The full transaction ledger, category filters, date ranges, search bar, and manual transaction entry modal will be activated in Phase 3.
        </Text>
      </Card>

      <Card style={styles.infoCard}>
        <Text variant="subtitle" style={styles.infoTitle}>
          Upcoming Features
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary} style={styles.bullet}>
          • Real-time Staged Transactions Review Queue
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary} style={styles.bullet}>
          • Multi-Source Indicators (Notification, SMS, Email, CSV)
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary} style={styles.bullet}>
          • Confidence Scores & Duplicate Fingerprints
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary} style={styles.bullet}>
          • Instant Confirm / Edit / Ignore Actions
        </Text>
      </Card>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    marginVertical: spacing.sm,
  },
  description: {
    lineHeight: 20,
  },
  infoCard: {
    padding: spacing.lg,
  },
  infoTitle: {
    marginBottom: spacing.md,
  },
  bullet: {
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
});

export default TransactionsPlaceholderScreen;
