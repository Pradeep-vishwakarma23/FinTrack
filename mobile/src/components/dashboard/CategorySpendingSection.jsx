import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatCurrency } from '../../utils/formatters.js';

// Curated harmonious category colors
const CATEGORY_COLORS = {
  Food: '#EF4444',
  Dining: '#F97316',
  Shopping: '#EC4899',
  Bills: '#3B82F6',
  Utilities: '#06B6D4',
  Transport: '#8B5CF6',
  Travel: '#A855F7',
  Entertainment: '#F59E0B',
  Groceries: '#10B981',
  Health: '#14B8A6',
  Salary: '#22C55E',
  Investment: '#6366F1',
  Other: '#64748B',
};

export const CategorySpendingSection = ({
  categoryBreakdown = [],
  totalExpense = 0,
}) => {
  const hasCategories = Array.isArray(categoryBreakdown) && categoryBreakdown.length > 0;

  return (
    <Card style={styles.container} testID="category-spending-section">
      <View style={styles.headerRow}>
        <Text variant="subtitle" color={colors.textPrimary}>
          Category Spending
        </Text>
        {hasCategories && (
          <Badge
            label={`${categoryBreakdown.length} Categories`}
            variant="primary"
            size="sm"
          />
        )}
      </View>

      {!hasCategories ? (
        <View style={styles.emptyState}>
          <Text variant="bodySmall" color={colors.textMuted} align="center">
            No expenses recorded yet. Once transactions are confirmed, category spending breakdown will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {categoryBreakdown.map((item, index) => {
            const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
            const percentage = item.percentage !== undefined
              ? item.percentage
              : totalExpense > 0
              ? Number(((item.amount / totalExpense) * 100).toFixed(1))
              : 0;

            return (
              <View key={`${item.category}_${index}`} style={styles.categoryItem}>
                <View style={styles.itemTopRow}>
                  <View style={styles.categoryNameRow}>
                    <View style={[styles.colorChip, { backgroundColor: catColor }]} />
                    <Text variant="body" weight="medium" color={colors.textPrimary}>
                      {item.category}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text variant="body" weight="bold" color={colors.textPrimary}>
                      {formatCurrency(item.amount)}
                    </Text>
                    <Text variant="caption" color={colors.textMuted}>
                      {percentage}%
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(100, Math.max(2, percentage))}%`,
                        backgroundColor: catColor,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
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
    marginBottom: spacing.md,
  },
  emptyState: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  listContainer: {
    marginTop: spacing.xs,
  },
  categoryItem: {
    marginBottom: spacing.md,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorChip: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  progressTrack: {
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});

export default CategorySpendingSection;
