import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Text,
  Header,
  Card,
  Button,
  Badge,
  ErrorBanner,
} from '../../components/index.js';
import {
  ImportSourceSelector,
  SMSPasteModal,
  BatchHistoryCard,
  PrivacyBanner,
  ImportProgressModal,
} from '../../components/imports/index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import {
  fetchImportBatches,
  fetchStagedTransactions,
  uploadCSVFile,
  uploadExcelFile,
  ingestSMSMessages,
  deleteBatch,
  openSMSPasteModal,
  closeSMSPasteModal,
  clearImportError,
  clearLastImportResult,
} from '../../store/slices/importSlice.js';

export const ImportsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    batches,
    stagedTransactions,
    pendingCount,
    isLoadingBatches,
    isUploading,
    uploadStage,
    uploadError,
    lastImportResult,
    isSMSPasteModalOpen,
    error,
  } = useSelector((state) => state.imports);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const loadData = useCallback(async () => {
    dispatch(fetchImportBatches());
    dispatch(fetchStagedTransactions('all'));
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleSelectCSV = async (file) => {
    setShowProgressModal(true);
    await dispatch(uploadCSVFile(file));
  };

  const handleSelectExcel = async (file) => {
    setShowProgressModal(true);
    await dispatch(uploadExcelFile(file));
  };

  const handleProcessSMS = async (text) => {
    setShowProgressModal(true);
    await dispatch(ingestSMSMessages({ text }));
  };

  const handleDeleteBatch = async (batchId) => {
    await dispatch(deleteBatch(batchId));
  };

  const handleNavigateToReview = (batchId = 'all') => {
    navigation.navigate('StagedReview', { batchId });
  };

  return (
    <Container
      scrollable
      safeArea={true}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      contentContainerStyle={styles.container}
    >
      {/* Top Header */}
      <Header
        title="Financial Imports"
        subtitle="Automatic Ingestion & Data Sources"
        showBack={Boolean(navigation?.canGoBack && navigation.canGoBack())}
        onBack={() => navigation.goBack()}
      />

      {/* Error Banner */}
      {error && (
        <ErrorBanner
          message={error}
          onRetry={loadData}
          onDismiss={() => dispatch(clearImportError())}
        />
      )}

      {/* Pending Staged Transactions Action Banner */}
      {pendingCount > 0 && (
        <Card variant="warning" style={styles.pendingBanner} testID="imports-pending-banner">
          <View style={styles.pendingHeader}>
            <View style={styles.pendingBadgeRow}>
              <Badge label="STAGED INGESTION" variant="warning" size="sm" />
              <Text variant="caption" color={colors.warning} weight="bold" style={styles.pendingCountBadge}>
                ⚡ {pendingCount} {pendingCount === 1 ? 'Transaction' : 'Transactions'}
              </Text>
            </View>
          </View>

          <Text variant="subtitle" color={colors.textPrimary} style={styles.pendingTitle}>
            Transactions Waiting for Verification
          </Text>

          <Text variant="bodySmall" color={colors.textSecondary} style={styles.pendingBody}>
            {pendingCount} detected {pendingCount === 1 ? 'transaction requires' : 'transactions require'} your confirmation before updating your ledger and dashboard analytics.
          </Text>

          <Button
            title={`Review Staged (${pendingCount})`}
            variant="primary"
            size="md"
            onPress={() => handleNavigateToReview('all')}
            style={styles.reviewBtn}
            testID="review-now-button"
          />
        </Card>
      )}

      {/* Source Selector (CSV, Excel, SMS) */}
      <ImportSourceSelector
        onSelectCSV={handleSelectCSV}
        onSelectExcel={handleSelectExcel}
        onSelectSMS={() => dispatch(openSMSPasteModal())}
        isUploading={isUploading}
      />

      {/* Privacy Notice Banner */}
      <PrivacyBanner />

      {/* Batch History Section */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text variant="subtitle" style={styles.sectionTitle}>
            Import Batch History
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            {batches.length} {batches.length === 1 ? 'batch' : 'batches'}
          </Text>
        </View>

        {batches.length === 0 ? (
          <Card style={styles.emptyHistoryCard} testID="empty-batch-history">
            <Text style={styles.emptyHistoryIcon}>📂</Text>
            <Text variant="bodySmall" color={colors.textSecondary} align="center">
              No previous import batches found. Upload your first statement or paste transaction messages above.
            </Text>
          </Card>
        ) : (
          batches.map((batch) => (
            <BatchHistoryCard
              key={batch._id || batch.id}
              batch={batch}
              onReviewPress={handleNavigateToReview}
              onDeletePress={handleDeleteBatch}
            />
          ))
        )}
      </View>

      {/* SMS Paste Modal */}
      <SMSPasteModal
        visible={isSMSPasteModalOpen}
        isLoading={isUploading}
        onSubmit={handleProcessSMS}
        onClose={() => dispatch(closeSMSPasteModal())}
      />

      {/* Import Progress & Feedback Modal */}
      <ImportProgressModal
        visible={showProgressModal}
        isUploading={isUploading}
        uploadStage={uploadStage}
        result={lastImportResult}
        error={uploadError}
        onReviewPress={() => {
          setShowProgressModal(false);
          handleNavigateToReview('all');
        }}
        onClose={() => {
          setShowProgressModal(false);
          dispatch(clearLastImportResult());
        }}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    paddingBottom: 110,
  },
  pendingBanner: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pendingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingCountBadge: {
    marginLeft: spacing.xs,
  },
  pendingTitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  pendingBody: {
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  reviewBtn: {
    width: '100%',
  },
  historySection: {
    marginTop: spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: 0,
  },
  emptyHistoryCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
});

export default ImportsScreen;
