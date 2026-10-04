import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Text,
  Header,
  Card,
  Button,
  Badge,
  LoadingIndicator,
  ErrorBanner,
} from '../../components/index.js';
import {
  StagedTransactionCard,
  StagedEditModal,
} from '../../components/imports/index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import {
  fetchStagedTransactions,
  confirmStagedTransaction,
  ignoreStagedTransaction,
  updateAndConfirmStaged,
  confirmAllStagedTransactions,
  openEditModal,
  closeEditModal,
  clearImportError,
} from '../../store/slices/importSlice.js';

export const StagedReviewScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const batchId = route?.params?.batchId || 'all';

  const {
    stagedTransactions,
    isLoadingStaged,
    isReviewing,
    selectedTransaction,
    isEditModalOpen,
    error,
  } = useSelector((state) => state.imports);

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'HIGH_CONF' | 'REVIEW_REQ' | 'DUPLICATES'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    dispatch(fetchStagedTransactions(batchId));
  }, [dispatch, batchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Filter staged transactions based on active filter chip
  const filteredTransactions = useMemo(() => {
    return stagedTransactions.filter((tx) => {
      const conf = Number(tx.confidence ?? 0.85);
      const isHigh = conf >= 0.85;

      switch (activeFilter) {
        case 'HIGH_CONF':
          return isHigh && !tx.isDuplicate;
        case 'REVIEW_REQ':
          return !isHigh || tx.isDuplicate;
        case 'DUPLICATES':
          return tx.isDuplicate;
        case 'ALL':
        default:
          return true;
      }
    });
  }, [stagedTransactions, activeFilter]);

  const handleConfirm = (id) => {
    dispatch(confirmStagedTransaction(id));
  };

  const handleIgnore = (id) => {
    dispatch(ignoreStagedTransaction(id));
  };

  const handleEdit = (tx) => {
    dispatch(openEditModal(tx));
  };

  const handleSaveAndConfirm = (id, data) => {
    dispatch(updateAndConfirmStaged({ id, data }));
  };

  const handleConfirmAll = () => {
    const count = stagedTransactions.length;
    if (count === 0) return;

    Alert.alert(
      'Confirm All Detected Transactions?',
      `Are you sure you want to verify and commit all ${count} transactions to your primary financial ledger?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Confirm All (${count})`,
          style: 'default',
          onPress: () => dispatch(confirmAllStagedTransactions(batchId)),
        },
      ]
    );
  };

  const renderEmptyState = () => {
    if (isLoadingStaged) return null;

    if (stagedTransactions.length === 0) {
      return (
        <Card style={styles.emptyCard} testID="all-caught-up-card">
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text variant="title" color={colors.textPrimary} align="center" style={styles.emptyTitle}>
            All Caught Up!
          </Text>
          <Text variant="bodySmall" color={colors.textSecondary} align="center" style={styles.emptySub}>
            All detected transactions have been verified and added to your confirmed ledger.
          </Text>
          <View style={styles.emptyActions}>
            <Button
              title="View Transactions Ledger"
              variant="primary"
              size="md"
              onPress={() => navigation.navigate('Transactions')}
              style={styles.emptyActionBtn}
            />
            <Button
              title="Return to Dashboard"
              variant="secondary"
              size="sm"
              onPress={() => navigation.navigate('Home')}
              style={styles.emptyActionBtn}
            />
          </View>
        </Card>
      );
    }

    return (
      <Card style={styles.emptyCard} testID="no-matching-filter-card">
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text variant="title" color={colors.textPrimary} align="center" style={styles.emptyTitle}>
          No transactions in this view
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary} align="center" style={styles.emptySub}>
          No staged items match the selected filter category.
        </Text>
        <Button
          title="Show All Transactions"
          variant="secondary"
          size="sm"
          onPress={() => setActiveFilter('ALL')}
          style={{ minWidth: 160 }}
        />
      </Card>
    );
  };

  return (
    <Container safeArea={true} style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerWrapper}>
        <Header
          title="Review Queue"
          subtitle={`${stagedTransactions.length} Pending Verification`}
          showBack={Boolean(navigation?.canGoBack && navigation.canGoBack())}
          onBack={() => navigation.goBack()}
        />
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item._id || item.id || String(Math.random())}
        renderItem={({ item }) => (
          <StagedTransactionCard
            transaction={item}
            onConfirm={handleConfirm}
            onEdit={handleEdit}
            onIgnore={handleIgnore}
            isProcessing={isReviewing}
          />
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Staging Explanation Card */}
            <Card variant="info" style={styles.infoBanner}>
              <View style={styles.infoBadgeRow}>
                <Badge label="STAGING QUEUE" variant="info" size="sm" />
                <Text variant="caption" color={colors.secondary} weight="semiBold" style={{ marginLeft: 6 }}>
                  PROTECTED FINANCIAL PIPELINE
                </Text>
              </View>
              <Text variant="caption" color={colors.textSecondary} style={{ marginTop: 4, lineHeight: 16 }}>
                Transactions in this queue are not yet part of your confirmed totals or budget calculations. Review, edit, or confirm each item below.
              </Text>
            </Card>

            {/* Bulk Confirm All Action (if multiple staged items exist) */}
            {stagedTransactions.length > 1 && (
              <View style={styles.bulkActionRow}>
                <Text variant="bodySmall" color={colors.textSecondary}>
                  {stagedTransactions.length} items waiting
                </Text>
                <Button
                  title={`⚡ Confirm All (${stagedTransactions.length})`}
                  variant="primary"
                  size="sm"
                  onPress={handleConfirmAll}
                  disabled={isReviewing}
                  testID="confirm-all-button"
                />
              </View>
            )}

            {/* Filter Chips */}
            <View style={styles.filterRow}>
              {[
                { key: 'ALL', label: `All (${stagedTransactions.length})` },
                {
                  key: 'HIGH_CONF',
                  label: `🎯 High Conf (${
                    stagedTransactions.filter((t) => Number(t.confidence ?? 0.85) >= 0.85 && !t.isDuplicate).length
                  })`,
                },
                {
                  key: 'REVIEW_REQ',
                  label: `⚠️ Review Req (${
                    stagedTransactions.filter((t) => Number(t.confidence ?? 0.85) < 0.85 || t.isDuplicate).length
                  })`,
                },
                {
                  key: 'DUPLICATES',
                  label: `⚠️ Dupes (${stagedTransactions.filter((t) => t.isDuplicate).length})`,
                },
              ].map((chip) => {
                const isSelected = activeFilter === chip.key;
                return (
                  <TouchableOpacity
                    key={chip.key}
                    style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                    onPress={() => setActiveFilter(chip.key)}
                    activeOpacity={0.7}
                  >
                    <Text
                      variant="caption"
                      color={isSelected ? colors.primary : colors.textMuted}
                      weight={isSelected ? 'bold' : 'normal'}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Error Banner */}
            {error && (
              <ErrorBanner
                message={error}
                onRetry={loadData}
                onDismiss={() => dispatch(clearImportError())}
              />
            )}
          </View>
        }
        ListEmptyComponent={renderEmptyState()}
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

      {/* Edit Staged Transaction Modal */}
      <StagedEditModal
        visible={isEditModalOpen}
        transaction={selectedTransaction}
        isLoading={isReviewing}
        onSave={handleSaveAndConfirm}
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
    paddingBottom: 110,
  },
  listHeader: {
    marginBottom: spacing.sm,
  },
  infoBanner: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  filterChipSelected: {
    backgroundColor: colors.mintBg,
    borderColor: colors.primary,
  },
  emptyCard: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    marginBottom: spacing.xs,
  },
  emptySub: {
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  emptyActions: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyActionBtn: {
    width: '100%',
    maxWidth: 240,
  },
});

export default StagedReviewScreen;
