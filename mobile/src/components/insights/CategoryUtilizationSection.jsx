import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Badge } from '../index.js';
import { formatCurrency } from '../../utils/formatters.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const CategoryUtilizationSection = ({ categories = [], onExplain }) => {
  const list = Array.isArray(categories) ? categories : [];

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text variant="subtitle" weight="bold">
          Category Spending & Limits
        </Text>
        <Text variant="caption" color={colors.textSecondary}>
          Budget utilization per category
        </Text>
      </View>

      {list.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text variant="bodySmall" color={colors.textSecondary} style={styles.emptyText}>
            No category spending recorded for this period.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {list.map((cat, idx) => {
            const hasLimit = cat.budgetLimit !== null && cat.budgetLimit > 0;
            const isOver = cat.isOverBudget;
            const utilization = cat.budgetUtilization || 0;

            return (
              <View key={cat.category || idx} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <View style={styles.catTitleRow}>
                    <Text variant="body" weight="bold">
                      {cat.category}
                    </Text>
                    {isOver && (
                      <Badge label="OVER BUDGET" variant="danger" size="sm" />
                    )}
                    {onExplain && (
                      <TouchableOpacity
                        onPress={() => onExplain(cat)}
                        style={styles.explainItemBtn}
                        activeOpacity={0.7}
                        testID={`explain-category-${idx}`}
                      >
                        <Text variant="caption" color={colors.primaryLight} weight="bold">
                          💡 Explain
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text variant="body" color={colors.textPrimary} weight="bold">
                    {formatCurrency(cat.amount)}
                  </Text>
                </View>

                <View style={styles.subInfoRow}>
                  <Text variant="caption" color={colors.textMuted}>
                    {cat.count} txns • {cat.percentage}% of expenses
                  </Text>
                  {hasLimit && (
                    <Text variant="caption" color={isOver ? colors.danger : colors.textSecondary}>
                      Limit: {formatCurrency(cat.budgetLimit)} ({utilization}%)
                    </Text>
                  )}
                </View>

                {hasLimit ? (
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(utilization, 100)}%`,
                          backgroundColor: isOver
                            ? colors.danger
                            : utilization >= 80
                            ? colors.warning
                            : colors.primary,
                        },
                      ]}
                    />
                  </View>
                ) : (
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(cat.percentage, 100)}%`,
                          backgroundColor: colors.surfaceBorder,
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    marginBottom: spacing.md,
  },
  emptyBox: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  listContainer: {
    gap: spacing.md,
  },
  categoryItem: {
    gap: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  catTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
    minWidth: 140,
  },
  explainItemBtn: {
    paddingVertical: 1,
    paddingHorizontal: spacing.xs + 2,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight + '40',
  },
  subInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});

export default CategoryUtilizationSection;
