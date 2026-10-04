import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, LoadingIndicator } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const DashboardSkeleton = () => {
  return (
    <View style={styles.container} testID="dashboard-skeleton">
      {/* Header Placeholder */}
      <View style={styles.headerBox}>
        <View style={styles.textLineLarge} />
        <View style={styles.textLineSmall} />
      </View>

      {/* KPI Grid Skeleton */}
      <View style={styles.kpiGrid}>
        <Card style={styles.kpiCard}>
          <View style={styles.textLineSmall} />
          <View style={styles.amountLine} />
        </Card>
        <Card style={styles.kpiCard}>
          <View style={styles.textLineSmall} />
          <View style={styles.amountLine} />
        </Card>
      </View>
      <View style={styles.kpiGrid}>
        <Card style={styles.kpiCard}>
          <View style={styles.textLineSmall} />
          <View style={styles.amountLine} />
        </Card>
        <Card style={styles.kpiCard}>
          <View style={styles.textLineSmall} />
          <View style={styles.amountLine} />
        </Card>
      </View>

      {/* Main Content Loading Card */}
      <Card style={styles.mainLoadingCard}>
        <LoadingIndicator message="Loading financial intelligence..." size="large" />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  headerBox: {
    marginBottom: spacing.lg,
  },
  textLineLarge: {
    width: 200,
    height: 24,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  textLineSmall: {
    width: 140,
    height: 14,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
  },
  amountLine: {
    width: 90,
    height: 22,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  kpiCard: {
    width: '48.5%',
    padding: spacing.md,
    height: 90,
    justifyContent: 'center',
  },
  mainLoadingCard: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
});

export default DashboardSkeleton;
