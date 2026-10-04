import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Text,
  Card,
  Button,
  Badge,
  Header,
} from '../../components/index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { logoutUser } from '../../store/slices/authSlice.js';
import { formatDate } from '../../utils/formatters.js';

export const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, apiBaseUrl } = useSelector((state) => state.auth);
  const { pendingCount } = useSelector((state) => state.imports);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <Container scrollable safeArea={true} contentContainerStyle={styles.container}>
      <Header title="My Profile" subtitle="Account Settings & Security" showBrand={true} />

      {/* Profile Info Card */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text variant="title" style={styles.userName}>
              {user?.name || 'FinTrack User'}
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              {user?.email || 'N/A'}
            </Text>
            <View style={styles.badgeWrapper}>
              <Badge label="AUTHENTICATED" variant="success" size="sm" />
            </View>
          </View>
        </View>
      </Card>

      {/* Connected Sources & Ingestion */}
      <Card style={styles.sectionCard}>
        <View style={styles.sourceHeaderRow}>
          <Text variant="subtitle" style={styles.sectionTitle}>
            Connected Sources & Imports
          </Text>
          {pendingCount > 0 && (
            <Badge label={`⚡ ${pendingCount} STAGED`} variant="warning" size="sm" />
          )}
        </View>

        <Text variant="caption" color={colors.textSecondary} style={{ lineHeight: 18, marginBottom: spacing.md }}>
          Import bank statements via CSV or Excel, paste SMS alerts, and verify detected transactions in the staging queue.
        </Text>

        <View style={styles.sourceActionButtons}>
          <Button
            title="🔔 Android Push Notifications"
            variant="primary"
            size="md"
            onPress={() => navigation.navigate('ConnectedSources')}
            style={styles.sourceBtn}
            testID="profile-notifications-button"
          />
          <Button
            title="📥 Import Statements (CSV / Excel / SMS)"
            variant="secondary"
            size="md"
            onPress={() => navigation.navigate('Imports')}
            style={styles.sourceBtn}
            testID="profile-import-button"
          />
          <Button
            title={`⚡ Review Staged Queue (${pendingCount})`}
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('StagedReview', { batchId: 'all' })}
            style={styles.sourceBtn}
            testID="profile-review-staged-button"
          />
        </View>
      </Card>

      {/* Financial Reports & Statements */}
      <Card style={styles.sectionCard}>
        <Text variant="subtitle" style={styles.sectionTitle}>
          Financial Reports & Export
        </Text>
        <Text variant="caption" color={colors.textSecondary} style={{ lineHeight: 18, marginBottom: spacing.md }}>
          Generate certified period statements, review category & merchant audits, and export PDF reports.
        </Text>
        <Button
          title="📄 View & Download Financial Reports"
          variant="primary"
          size="md"
          onPress={() => navigation.navigate('Reports')}
          style={styles.sourceBtn}
          testID="profile-reports-button"
        />
      </Card>

      {/* Account Details */}
      <Card style={styles.sectionCard}>
        <Text variant="subtitle" style={styles.sectionTitle}>
          Account Details
        </Text>

        <View style={styles.detailRow}>
          <Text variant="bodySmall" color={colors.textSecondary}>
            User ID
          </Text>
          <Text variant="bodySmall" color={colors.textPrimary} weight="medium">
            {user?.id || user?._id || 'N/A'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text variant="bodySmall" color={colors.textSecondary}>
            Email Address
          </Text>
          <Text variant="bodySmall" color={colors.textPrimary} weight="medium">
            {user?.email || 'N/A'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text variant="bodySmall" color={colors.textSecondary}>
            Member Since
          </Text>
          <Text variant="bodySmall" color={colors.textPrimary} weight="medium">
            {user?.createdAt ? formatDate(user.createdAt) : 'Recently'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text variant="bodySmall" color={colors.textSecondary}>
            Server Endpoint
          </Text>
          <Text variant="caption" color={colors.secondary} weight="medium" numberOfLines={1}>
            {apiBaseUrl}
          </Text>
        </View>
      </Card>

      {/* Security & Multi-Tenant Info */}
      <Card style={styles.sectionCard}>
        <Text variant="subtitle" style={styles.sectionTitle}>
          Security & Privacy
        </Text>
        <Text variant="caption" color={colors.textSecondary} style={{ lineHeight: 18, marginBottom: spacing.md }}>
          FinTrack uses hardware-backed SecureStore token encryption, strict multi-tenant database isolation, and on-device regex sanitization to keep your financial data private.
        </Text>
        <View style={styles.securityBadges}>
          <Badge label="JWT AUTH" variant="primary" size="sm" />
          <View style={{ width: spacing.xs }} />
          <Badge label="ENCRYPTED STORAGE" variant="info" size="sm" />
          <View style={{ width: spacing.xs }} />
          <Badge label="NO OTP LOGGING" variant="success" size="sm" />
        </View>
      </Card>

      {/* Logout Action */}
      <Button
        title="Sign Out"
        variant="danger"
        onPress={handleLogout}
        style={styles.logoutButton}
        testID="profile-logout-button"
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    paddingBottom: 110,
  },
  profileCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBadge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.mintBg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  avatarInfo: {
    flex: 1,
  },
  userName: {
    marginBottom: 2,
  },
  badgeWrapper: {
    marginTop: spacing.xs,
  },
  sectionCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  sourceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sourceActionButtons: {
    gap: spacing.sm,
  },
  sourceBtn: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  securityBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  logoutButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});

export default ProfileScreen;
