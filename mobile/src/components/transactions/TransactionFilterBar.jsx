import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

const TYPE_OPTIONS = ['All', 'Expense', 'Income'];
const CATEGORY_OPTIONS = [
  'All',
  'Food',
  'Shopping',
  'Bills',
  'Transport',
  'Entertainment',
  'Healthcare',
  'Education',
  'Salary',
  'Rent',
  'Investments',
  'Other',
];
const SOURCE_OPTIONS = [
  { label: 'All Sources', value: 'All' },
  { label: '📱 Notification', value: 'notification' },
  { label: '💬 SMS', value: 'sms' },
  { label: '✉️ Email', value: 'email' },
  { label: '📄 CSV', value: 'csv' },
  { label: '📊 Excel', value: 'excel' },
  { label: '✏️ Manual', value: 'manual' },
];
const SORT_OPTIONS = [
  { label: 'Newest', value: 'latest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Highest Amount', value: 'amount_desc' },
  { label: 'Lowest Amount', value: 'amount_asc' },
];

export const TransactionFilterBar = ({
  selectedType = 'All',
  selectedCategory = 'All',
  selectedSource = 'All',
  selectedSort = 'latest',
  onSelectType,
  onSelectCategory,
  onSelectSource,
  onSelectSort,
  onResetFilters,
}) => {
  const isFilterActive =
    selectedType !== 'All' ||
    selectedCategory !== 'All' ||
    selectedSource !== 'All' ||
    selectedSort !== 'latest';

  return (
    <View style={styles.container} testID="transaction-filter-bar">
      {/* Filter Row 1: Type & Reset */}
      <View style={styles.rowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Type Pills */}
          {TYPE_OPTIONS.map((type) => {
            const isSelected = selectedType.toLowerCase() === type.toLowerCase();
            return (
              <TouchableOpacity
                key={`type_${type}`}
                style={[styles.pill, isSelected && styles.activePill]}
                onPress={() => onSelectType(type === 'All' ? 'All' : type.toLowerCase())}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  weight={isSelected ? 'bold' : 'medium'}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.divider} />

          {/* Sort Pills */}
          {SORT_OPTIONS.map((sort) => {
            const isSelected = selectedSort === sort.value;
            return (
              <TouchableOpacity
                key={`sort_${sort.value}`}
                style={[styles.pill, isSelected && styles.activePill]}
                onPress={() => onSelectSort(sort.value)}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  weight={isSelected ? 'bold' : 'medium'}
                >
                  {sort.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Reset Filter Button */}
          {isFilterActive && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={onResetFilters}
              activeOpacity={0.7}
            >
              <Text variant="caption" color={colors.primaryLight} weight="bold">
                Reset ✕
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Filter Row 2: Categories */}
      <View style={styles.rowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {CATEGORY_OPTIONS.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <TouchableOpacity
                key={`cat_${cat}`}
                style={[styles.smallPill, isSelected && styles.activeSmallPill]}
                onPress={() => onSelectCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  color={isSelected ? colors.primaryLight : colors.textMuted}
                  weight={isSelected ? 'bold' : 'regular'}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Filter Row 3: Sources */}
      <View style={styles.rowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {SOURCE_OPTIONS.map((src) => {
            const isSelected = selectedSource.toLowerCase() === src.value.toLowerCase();
            return (
              <TouchableOpacity
                key={`src_${src.value}`}
                style={[styles.smallPill, isSelected && styles.activeSmallPill]}
                onPress={() => onSelectSource(src.value)}
                activeOpacity={0.7}
              >
                <Text
                  variant="caption"
                  color={isSelected ? colors.secondaryLight : colors.textMuted}
                  weight={isSelected ? 'bold' : 'regular'}
                >
                  {src.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  rowWrapper: {
    marginBottom: spacing.xs,
  },
  scrollContent: {
    paddingVertical: 2,
    alignItems: 'center',
  },
  pill: {
    paddingVertical: spacing.xs + 1,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: spacing.xs,
  },
  activePill: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  smallPill: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeSmallPill: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.surfaceBorderActive,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: colors.surfaceBorder,
    marginHorizontal: spacing.xs,
  },
  resetButton: {
    paddingVertical: spacing.xs + 1,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceHover,
    marginLeft: spacing.xs,
  },
});

export default TransactionFilterBar;
