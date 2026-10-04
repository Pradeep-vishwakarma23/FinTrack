import React, { useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
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
  TransactionCard,
  TransactionSummaryBar,
  TransactionSearchBar,
  TransactionFilterBar,
  StagedAlertBanner,
  TransactionDetailModal,
  AddTransactionModal,
  EditTransactionModal,
} from '../../components/transactions/index.js';
import { FloatingCopilotButton } from '../../components/copilot/index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import {
  fetchTransactions,
  setSearch,
  setTypeFilter,
  setCategoryFilter,
  setSourceFilter,
  setSort,
  resetFilters,
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openDetailModal,
  closeDetailModal,
  removeTransaction,
  clearTransactionError,
} from '../../store/slices/transactionSlice.js';

export const TransactionsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    items,
    pagination,
    summary,
    filters,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    selectedTransaction,
    isAddModalOpen,
    isEditModalOpen,
    isDetailModalOpen,
  } = useSelector((state) => state.transactions);

  // Initial fetch and fetch when filters/sort/search change
  const loadTransactions = useCallback(
    (isRefresh = false, isLoadMore = false) => {
      dispatch(fetchTransactions({ isRefresh, isLoadMore }));
    },
    [dispatch]
  );

  useEffect(() => {
    loadTransactions(false, false);
  }, [filters.type, filters.category, filters.source, filters.sort, filters.search, loadTransactions]);

  const handleRefresh = () => {
    if (!isRefreshing) {
      loadTransactions(true, false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore && items.length >= pagination.limit) {
      loadTransactions(false, true);
    }
  };

  const handleDeleteTransaction = (id) => {
    dispatch(removeTransaction(id));
  };

  const isFilterActive =
    filters.type !== 'All' ||
    filters.category !== 'All' ||
    filters.source !== 'All' ||
    filters.search !== '' ||
    filters.sort !== 'latest';

  const renderEmptyState = () => {
    if (isLoading) return null;

    if (isFilterActive) {
      return (
        <Card style={styles.emptyCard} testID="filter-empty-state">
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text variant="title" color={colors.textPrimary} align="center" style={styles.emptyTitle}>
            No matching transactions
          </Text>
          <Text variant="bodySmall" color={colors.textSecondary} align="center" style={styles.emptySub}>
            No financial records match your current search and filter criteria.
          </Text>
          <Button
            title="Clear Filters"
            variant="secondary"
            size="sm"
            onPress={() => dispatch(resetFilters())}
            style={styles.emptyButton}
            testID="clear-filters-button"
          />
        </Card>
      );
    }

    return (
      <Card style={styles.emptyCard} testID="no-transactions-empty-state">
        <Text style={styles.emptyIcon}>💳</Text>
        <Text variant="title" color={colors.textPrimary} align="center" style={styles.emptyTitle}>
          No transactions yet
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary} align="center" style={styles.emptySub}>
          Your confirmed financial activity will appear here. Add your first manual transaction or import bank statements.
        </Text>
        <Button
          title="+ Add Transaction"
          variant="primary"
          size="md"
          onPress={() => dispatch(openAddModal())}
          style={styles.emptyButton}
          testID="empty-add-transaction-button"
        />
      </Card>
    );
  };

  return (
    <Container safeArea={true} style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerWrapper}>
        <Header
          title="Transactions"
          subtitle={`${pagination.total || items.length} Total Records`}
          showBrand={true}
          rightActionText="+ Add"
          onRightAction={() => dispatch(openAddModal())}
        />
      </View>

      {/* Main Content / FlatList */}
      <FlatList
        data={items}
        keyExtractor={(item) => item._id || item.id || String(Math.random())}
        renderItem={({ item }) => (
          <TransactionCard
            transaction={item}
            onPress={() => dispatch(openDetailModal(item))}
          />
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Staged Transactions Notice */}
            <StagedAlertBanner
              stagedCount={summary.stagedCount}
              onReviewPress={() => {
                navigation.navigate('StagedReview', { batchId: 'all' });
              }}
            />

            {/* Search Bar */}
            <TransactionSearchBar
              value={filters.search}
              onChangeText={(text) => dispatch(setSearch(text))}
              onClear={() => dispatch(setSearch(''))}
            />

            {/* Filter Bar */}
            <TransactionFilterBar
              selectedType={filters.type}
              selectedCategory={filters.category}
              selectedSource={filters.source}
              selectedSort={filters.sort}
              onSelectType={(type) => dispatch(setTypeFilter(type))}
              onSelectCategory={(cat) => dispatch(setCategoryFilter(cat))}
              onSelectSource={(src) => dispatch(setSourceFilter(src))}
              onSelectSort={(sort) => dispatch(setSort(sort))}
              onResetFilters={() => dispatch(resetFilters())}
            />

            {/* Filtered Compact Summary */}
            <TransactionSummaryBar
              totalIncome={summary.totalIncome}
              totalExpense={summary.totalExpense}
              net={summary.net}
            />

            {/* Error Banner */}
            {error && (
              <ErrorBanner
                message={error}
                onRetry={() => loadTransactions(false, false)}
                onDismiss={() => dispatch(clearTransactionError())}
              />
            )}
          </View>
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                Loading more transactions...
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
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

      {/* Floating Add Transaction Action */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => dispatch(openAddModal())}
        activeOpacity={0.8}
        testID="floating-add-transaction-button"
        accessibilityRole="button"
        accessibilityLabel="Add new transaction"
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>

      {/* Floating Copilot Launcher */}
      <FloatingCopilotButton />

      {/* Modals */}
      <TransactionDetailModal
        visible={isDetailModalOpen}
        transaction={selectedTransaction}
        onClose={() => dispatch(closeDetailModal())}
        onEdit={(tx) => {
          dispatch(closeDetailModal());
          dispatch(openEditModal(tx));
        }}
        onDelete={handleDeleteTransaction}
      />

      <AddTransactionModal
        visible={isAddModalOpen}
        onClose={() => dispatch(closeAddModal())}
      />

      <EditTransactionModal
        visible={isEditModalOpen}
        transaction={selectedTransaction}
        onClose={() => dispatch(closeEditModal())}
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
    paddingBottom: Platform.OS === 'ios' ? 220 : 200,
  },
  listHeader: {
    marginBottom: spacing.xs,
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
    minWidth: 160,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 96 : 76,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 99,
  },
  floatingButtonText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: -2,
  },
});

export default TransactionsScreen;
