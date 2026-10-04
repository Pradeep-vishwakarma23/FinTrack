import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Container, Text, Card, Badge, Header } from '../../components/index.js';
import { colors, spacing } from '../../theme/index.js';

export const InsightsPlaceholderScreen = () => {
  return (
    <Container scrollable contentContainerStyle={styles.container}>
      <Header title="Insights" subtitle="AI Advisor & Financial Health" />

      <Card variant="glow" style={styles.card}>
        <Badge label="PHASE 7 & 8 ROADMAP" variant="primary" size="sm" />
        <Text variant="title" style={styles.title}>
          Financial Intelligence & AI
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary} style={styles.description}>
          AI financial recommendations, deterministic monthly forecasts, unusual spending anomaly detection, and the grounded "Ask FinTrack" natural language advisor will be activated in Phase 7 & 8.
        </Text>
      </Card>

      <Card style={styles.infoCard}>
        <Text variant="subtitle" style={styles.infoTitle}>
          Upcoming Features
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary} style={styles.bullet}>
          • 0–100 Explainable Financial Health Score
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary} style={styles.bullet}>
          • Grounded "Ask FinTrack" AI Chat Assistant
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary} style={styles.bullet}>
          • Dynamic Expense & Budget Risk Forecasts
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary} style={styles.bullet}>
          • Recurring Subscription & Bill Pattern Detector
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

export default InsightsPlaceholderScreen;
