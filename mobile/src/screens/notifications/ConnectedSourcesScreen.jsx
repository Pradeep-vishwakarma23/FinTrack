import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
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
  ErrorBanner,
} from '../../components/index.js';
import {
  NotificationStatusCard,
  DetectionHistoryCard,
  PermissionExplanationModal,
} from '../../components/notifications/index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import {
  checkNotificationPermission,
  fetchNotificationStats,
  toggleNotificationService,
  ingestNotificationEvent,
  openPermissionModal,
  closePermissionModal,
  clearNotificationError,
} from '../../store/slices/notificationSlice.js';
import notificationListenerService from '../../services/notificationListenerService.js';

export const ConnectedSourcesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    isConnected,
    isPermissionGranted,
    isEnabled,
    stats,
    isPermissionModalOpen,
    error,
  } = useSelector((state) => state.notifications);
  const { pendingCount } = useSelector((state) => state.imports);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    dispatch(checkNotificationPermission());
    dispatch(fetchNotificationStats());
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleToggle = async (shouldEnable) => {
    const res = await dispatch(toggleNotificationService(shouldEnable)).unwrap();
    if (res.requirePermission) {
      dispatch(openPermissionModal());
    }
  };

  const handleOpenSettings = async () => {
    dispatch(closePermissionModal());
    await notificationListenerService.openNotificationSettings();
    // Re-check permission after returning from Android settings
    setTimeout(() => {
      dispatch(checkNotificationPermission());
      dispatch(fetchNotificationStats());
    }, 1000);
  };

  // Synthetic Test Generator for evaluating detection & staging directly
  const handleSendTestNotification = async (type = 'standard') => {
    let testPayload;
    if (type === 'otp') {
      testPayload = {
        packageName: 'com.google.android.apps.nbu.paisa.user',
        title: 'Bank Verification Code',
        text: 'Your OTP is 482910 to verify transaction. Do not share.',
        postTime: Date.now(),
      };
    } else if (type === 'income') {
      testPayload = {
        packageName: 'com.hdfc.bank',
        title: 'Salary Credit Alert',
        text: 'Your A/c XX8901 is credited with INR 45,000.00 from TECH CORP.',
        postTime: Date.now(),
      };
    } else {
      testPayload = {
        packageName: 'com.phonepe.app',
        title: 'Payment Successful',
        text: 'Paid ₹480 to SWIGGY via PhonePe UPI. Ref: UPI492019.',
        postTime: Date.now(),
      };
    }

    const res = await dispatch(ingestNotificationEvent(testPayload)).unwrap();
    if (!res.isValid) {
      Alert.alert('Sensitive Data Discarded', `Local filter rejected event: ${res.reason}`);
    } else {
      Alert.alert(
        'Transaction Staged! ⚡',
        `Notification intercepted and staged for review. Navigate to Review Queue to confirm.`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Review Now',
            onPress: () => navigation.navigate('StagedReview', { batchId: 'all' }),
          },
        ]
      );
    }
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
      {/* Header */}
      <Header
        title="Connected Sources"
        subtitle="Android Notification Ingestion"
        showBack={Boolean(navigation?.canGoBack && navigation.canGoBack())}
        onBack={() => navigation.goBack()}
      />

      {/* Error Banner */}
      {error && (
        <ErrorBanner
          message={error}
          onRetry={loadData}
          onDismiss={() => dispatch(clearNotificationError())}
        />
      )}

      {/* Main Status & Toggle Card */}
      <NotificationStatusCard
        isConnected={isConnected}
        isEnabled={isEnabled}
        lastDetectedAt={stats.lastDetectedAt}
        onToggle={handleToggle}
        onOpenSettings={() => dispatch(openPermissionModal())}
      />

      {/* Pending Staged Transactions Notice */}
      {pendingCount > 0 && (
        <Card variant="warning" style={styles.pendingCard} testID="connected-sources-pending-card">
          <View style={styles.pendingRow}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color={colors.warning} weight="bold">
                ⚡ {pendingCount} DETECTED ITEMS
              </Text>
              <Text variant="subtitle" color={colors.textPrimary} style={{ marginTop: 2 }}>
                Transactions Waiting for Review
              </Text>
            </View>
            <Button
              title="Review Queue"
              variant="primary"
              size="sm"
              onPress={() => navigation.navigate('StagedReview', { batchId: 'all' })}
              style={styles.reviewBtn}
              testID="connected-sources-review-btn"
            />
          </View>
        </Card>
      )}

      {/* Detection Statistics */}
      <DetectionHistoryCard stats={stats} />

      {/* Sandbox / Testing Section */}
      <Card style={styles.sandboxCard} testID="synthetic-test-section">
        <Text variant="subtitle" color={colors.textPrimary} style={styles.sectionTitle}>
          Evaluate Local Notification Ingestion
        </Text>
        <Text variant="caption" color={colors.textSecondary} style={{ lineHeight: 18, marginBottom: spacing.md }}>
          Test on-device filtering, zero-OTP redaction, and backend staging by generating safe simulated transaction alerts:
        </Text>

        <View style={styles.sandboxButtons}>
          <Button
            title="⚡ Test Debit Notification (Swiggy ₹480)"
            variant="secondary"
            size="sm"
            onPress={() => handleSendTestNotification('standard')}
            style={styles.sandboxBtn}
            testID="test-debit-button"
          />
          <Button
            title="💰 Test Credit Notification (Salary ₹45,000)"
            variant="secondary"
            size="sm"
            onPress={() => handleSendTestNotification('income')}
            style={styles.sandboxBtn}
            testID="test-income-button"
          />
          <Button
            title="🛡️ Test Sensitive OTP Notification (Auto-Reject)"
            variant="danger"
            size="sm"
            onPress={() => handleSendTestNotification('otp')}
            style={styles.sandboxBtn}
            testID="test-otp-button"
          />
        </View>
      </Card>

      {/* Permission Explanation Modal */}
      <PermissionExplanationModal
        visible={isPermissionModalOpen}
        onOpenSettings={handleOpenSettings}
        onCancel={() => dispatch(closePermissionModal())}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    paddingBottom: 110,
  },
  pendingCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewBtn: {
    minHeight: 36,
  },
  sandboxCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  sandboxButtons: {
    gap: spacing.sm,
  },
  sandboxBtn: {
    width: '100%',
  },
});

export default ConnectedSourcesScreen;
