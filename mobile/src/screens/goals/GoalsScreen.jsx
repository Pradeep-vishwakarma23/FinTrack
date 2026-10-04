import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Text,
  Header,
  Button,
  ErrorBanner,
  LoadingIndicator,
  Card,
} from '../../components/index.js';
import {
  GoalCard,
  GoalSummaryCard,
  GoalFormModal,
} from '../../components/goals/index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import {
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  setFilterStatus,
  openCreateModal,
  closeCreateModal,
  openEditModal,
  closeEditModal,
  clearGoalError,
} from '../../store/slices/goalSlice.js';
import {
  openCopilot,
  sendCopilotMessage,
} from '../../store/slices/copilotSlice.js';
import { formatDate, formatCurrency } from '../../utils/formatters.js';

export const GoalsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    items,
    isLoading,
    isRefreshing,
    actionLoading,
    error,
    actionError,
    filterStatus,
    selectedGoal,
    isCreateModalOpen,
    isEditModalOpen,
  } = useSelector((state) => state.goals);

  const loadGoals = useCallback(
    (isRefresh = false) => {
      dispatch(fetchGoals({ isRefresh }));
    },
    [dispatch]
  );

  useEffect(() => {
    loadGoals(false);
  }, [loadGoals]);

  const handleRefresh = () => {
    if (!isRefreshing) {
      loadGoals(true);
    }
  };

  // Filter goals based on status
  const filteredGoals = items.filter((goal) => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Active') return goal.status === 'in_progress';
    if (filterStatus === 'Completed') return goal.status === 'completed' || goal.isCompleted;
    if (filterStatus === 'Paused') return goal.status === 'paused';
    if (filterStatus === 'Cancelled') return goal.status === 'cancelled';
    return true;
  });

  const handleCreateSubmit = (payload) => {
    dispatch(createGoal(payload));
  };

  const handleEditSubmit = (payload) => {
    const goalId = selectedGoal?._id || selectedGoal?.id;
    if (goalId) {
      dispatch(updateGoal({ id: goalId, data: payload }));
    }
  };

  const handleDeletePress = (goal) => {
    const goalId = goal?._id || goal?.id;
    Alert.alert(
      'Delete Financial Goal',
      `Are you sure you want to delete "${goal.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteGoal(goalId)),
        },
      ]
    );
  };

  const handleAskCopilot = (goal) => {
    const dateFormatted = formatDate(goal.targetDate, { short: true });
    const prompt = `How can I achieve my goal "${goal.title}" of ${formatCurrency(goal.targetAmount)} by ${dateFormatted}?`;
    
    dispatch(openCopilot());
    dispatch(sendCopilotMessage({ message: prompt }));
  };

  const filterTabs = [
    { key: 'All', count: items.length },
    { key: 'Active', count: items.filter((g) => g.status === 'in_progress').length },
    { key: 'Completed', count: items.filter((g) => g.status === 'completed' || g.isCompleted).length },
    { key: 'Paused', count: items.filter((g) => g.status === 'paused').length },
    { key: 'Cancelled', count: items.filter((g) => g.status === 'cancelled').length },
  ];

  const renderEmptyState = () => {
    if (isLoading) return null;

    if (items.length > 0 && filteredGoals.length === 0) {
      return (
        <Card style={styles.emptyCard} testID="filter-empty-state">
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text variant="title" color={colors.textPrimary} align="center" style={styles.emptyTitle}>
            No {filterStatus.toLowerCase()} goals
          </Text>
          <Text variant="bodySmall" color={colors.textSecondary} align="center" style={styles.emptySub}>
            You have no financial goals currently marked as {filterStatus.toLowerCase()}.
          </Text>
          <Button
            title="Show All Goals"
            variant="secondary"
            size="sm"
            onPress={() => dispatch(setFilterStatus('All'))}
            style={styles.emptyButton}
            testID="show-all-goals-btn"
          />
        </Card>
      );
    }

    return (
      <Card style={styles.emptyCard} testID="no-goals-empty-state">
        <Text style={styles.emptyIcon}>🎯</Text>
        <Text variant="title" color={colors.textPrimary} align="center" style={styles.emptyTitle}>
          Turn your financial progress into a plan.
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary} align="center" style={styles.emptySub}>
          Set savings targets for vacations, emergency funds, gadgets, or investments with automated feasibility evaluation.
        </Text>
        <Button
          title="+ Create Your First Goal"
          variant="primary"
          size="md"
          onPress={() => dispatch(openCreateModal())}
          style={styles.emptyButton}
          testID="empty-create-goal-btn"
        />
      </Card>
    );
  };

  return (
    <Container safeArea={true} style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerWrapper}>
        <Header
          title="Financial Goals"
          subtitle="Turn your plans into measurable progress."
          showBrand={true}
          rightActionText="+ Add"
          onRightAction={() => dispatch(openCreateModal())}
        />
      </View>

      {/* Main Content List */}
      <FlatList
        data={filteredGoals}
        keyExtractor={(item) => item._id || item.id || String(Math.random())}
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            onEdit={(g) => dispatch(openEditModal(g))}
            onDelete={handleDeletePress}
            onAskCopilot={handleAskCopilot}
          />
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Global Error Banner */}
            {error && (
              <ErrorBanner
                message={error}
                onRetry={() => loadGoals(false)}
                onDismiss={() => dispatch(clearGoalError())}
              />
            )}

            {/* Aggregate Goal Summary Header */}
            {items.length > 0 && <GoalSummaryCard goals={items} />}

            {/* Filter Pills Bar (Horizontally Scrollable without Edge Clipping) */}
            {items.length > 0 && (
              <View style={styles.filterScrollWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterListContent}
                >
                  {filterTabs.map((tab) => {
                    const isSelected = filterStatus === tab.key;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        onPress={() => dispatch(setFilterStatus(tab.key))}
                        style={[
                          styles.filterPill,
                          isSelected && styles.filterPillSelected,
                        ]}
                        activeOpacity={0.7}
                        testID={`filter-tab-${tab.key}`}
                      >
                        <Text
                          variant="caption"
                          weight={isSelected ? 'bold' : 'normal'}
                          color={isSelected ? '#FFFFFF' : colors.textSecondary}
                        >
                          {tab.key}
                        </Text>
                        <View
                          style={[
                            styles.filterCountBadge,
                            isSelected && styles.filterCountBadgeSelected,
                          ]}
                        >
                          <Text
                            variant="caption"
                            style={styles.filterCountText}
                            color={isSelected ? colors.primary : colors.textMuted}
                          >
                            {tab.count}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Dedicated GoalsScreen Floating Actions Dock (FinTrack Copilot + Add Goal) */}
      <View style={styles.floatingActionDock} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.copilotDockButton}
          onPress={() => dispatch(openCopilot())}
          activeOpacity={0.85}
          testID="floating-copilot-btn"
          accessibilityRole="button"
          accessibilityLabel="Open FinTrack AI Copilot"
        >
          <Text style={styles.copilotDockSparkle}>✦</Text>
          <Text variant="caption" color={colors.textPrimary} weight="bold" style={styles.copilotDockText}>
            FinTrack Copilot
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addGoalDockButton}
          onPress={() => dispatch(openCreateModal())}
          activeOpacity={0.85}
          testID="floating-add-goal-button"
          accessibilityRole="button"
          accessibilityLabel="Create new financial goal"
        >
          <Text style={styles.addGoalDockText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Create Goal Modal */}
      <GoalFormModal
        visible={isCreateModalOpen}
        mode="create"
        onClose={() => dispatch(closeCreateModal())}
        onSubmit={handleCreateSubmit}
        loading={actionLoading}
        error={actionError}
      />

      {/* Edit Goal Modal */}
      <GoalFormModal
        visible={isEditModalOpen}
        mode="edit"
        initialGoal={selectedGoal}
        onClose={() => dispatch(closeEditModal())}
        onSubmit={handleEditSubmit}
        loading={actionLoading}
        error={actionError}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 120 : 96,
  },
  listHeader: {
    marginBottom: spacing.xs,
  },
  filterScrollWrapper: {
    marginVertical: spacing.sm,
    marginHorizontal: -spacing.lg,
  },
  filterListContent: {
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xxl + spacing.lg,
    gap: spacing.xs,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 6,
  },
  filterPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  filterCountBadge: {
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  filterCountBadgeSelected: {
    backgroundColor: colors.primaryDark,
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyCard: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    marginBottom: spacing.xs,
  },
  emptySub: {
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    minWidth: 180,
  },
  floatingActionDock: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 18 : 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 99,
  },
  copilotDockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 5,
  },
  copilotDockSparkle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: 'bold',
  },
  copilotDockText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  addGoalDockButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  addGoalDockText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: -2,
  },
});

export default GoalsScreen;
