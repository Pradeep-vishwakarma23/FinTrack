import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '../Text.jsx';
import { FinTrackLogo } from '../brand/FinTrackLogo.jsx';
import { colors, spacing, borderRadius } from '../../theme/index.js';

// Greeting based on time of day
const getGreetingTime = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Formats YYYY-MM into a display string (e.g. "Sep 2026" or "Current Month")
const formatPeriodDisplay = (periodKey) => {
  if (!periodKey || typeof periodKey !== 'string' || !periodKey.includes('-')) {
    return 'Current Month';
  }
  const [yearStr, monthStr] = periodKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return periodKey;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const MobileFinancialHero = ({
  user,
  period,
  isRefreshing = false,
  onOpenMonthPicker,
  onRefresh,
  onAvatarPress,
}) => {
  const userName = user?.name ? user.name.split(' ')[0] : 'User';
  const greeting = `${getGreetingTime()}, ${userName}`;
  const periodLabel = formatPeriodDisplay(period);

  return (
    <View style={styles.container}>
      {/* Top Bar: Brand Logo + Eyebrow + User Avatar */}
      <View style={styles.topRow}>
        <View style={styles.leftBrandRow}>
          <FinTrackLogo variant="compact" size="sm" isDark={false} />
          <View style={styles.eyebrowBadge}>
            <View style={styles.statusDot} />
            <Text variant="caption" color={colors.primary} weight="bold" style={styles.eyebrowText}>
              FINANCIAL OVERVIEW
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={onAvatarPress}
          activeOpacity={0.8}
          testID="home-avatar-btn"
          accessibilityLabel="Open User Profile"
        >
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Editorial Headline */}
      <View style={styles.headlineBlock}>
        <Text variant="bodySmall" color={colors.textSecondary} weight="medium">
          {greeting}
        </Text>
        <Text variant="hero" color={colors.textPrimary} style={styles.heroTitle}>
          Your money,{'\n'}
          <Text variant="hero" color={colors.mint} style={styles.heroTitleItalic}>
            understood.
          </Text>
        </Text>
        <Text variant="caption" color={colors.textMuted} style={styles.subtitle}>
          Real-time cash flow, budget velocity & verified ledger balance.
        </Text>
      </View>

      {/* Period Selector & Sync Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.periodPill}
          onPress={onOpenMonthPicker}
          activeOpacity={0.75}
          testID="home-period-pill"
          accessibilityLabel={`Selected period: ${periodLabel}. Tap to change month.`}
        >
          <Text variant="caption" color={colors.primary} weight="bold">
            📅 {periodLabel} ▾
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRefresh}
          activeOpacity={0.7}
          style={styles.refreshBtn}
          testID="home-refresh-btn"
          accessibilityLabel="Refresh dashboard ledger"
        >
          <Text variant="caption" color={colors.textSecondary} weight="medium">
            {isRefreshing ? 'Syncing...' : 'Tap to refresh ↻'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  leftBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    flex: 1,
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mintBg,
    borderColor: colors.mintBorder,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.mint,
    marginRight: 5,
  },
  eyebrowText: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.mint,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headlineBlock: {
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '300',
    marginVertical: 4,
    letterSpacing: -0.5,
  },
  heroTitleItalic: {
    fontStyle: 'italic',
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 2,
    lineHeight: 18,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  periodPill: {
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.mintBorder,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  refreshBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
});

export default MobileFinancialHero;
