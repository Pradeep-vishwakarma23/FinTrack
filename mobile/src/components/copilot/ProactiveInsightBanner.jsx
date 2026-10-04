import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Text, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import {
  fetchProactiveInsights,
  openCopilot,
  sendCopilotMessage,
} from '../../store/slices/copilotSlice.js';
import { getCurrentMonthKey } from '../../store/slices/intelligenceSlice.js';

export const ProactiveInsightBanner = ({ month, style }) => {
  const dispatch = useDispatch();
  const { proactiveInsights = [], insightsLoading = false, insightsError = null } = useSelector(
    (state) => state?.copilot || {}
  );
  const { period: intelligenceMonth } = useSelector((state) => state?.intelligence || {});
  const activeMonth = month || intelligenceMonth || getCurrentMonthKey();

  useEffect(() => {
    if (activeMonth) {
      dispatch(fetchProactiveInsights(activeMonth));
    }
  }, [dispatch, activeMonth]);

  if (insightsLoading && (!proactiveInsights || proactiveInsights.length === 0)) {
    return null;
  }

  if (insightsError || !proactiveInsights || proactiveInsights.length === 0) {
    return null;
  }

  const handleActionPress = (insight) => {
    dispatch(openCopilot());
    const prompt =
      insight.type === 'danger'
        ? 'What is causing my deficit this month and how can I fix it?'
        : insight.id === 'insight_category_concentration'
        ? 'How can I balance my spending across categories?'
        : `Explain my latest financial alert: ${insight.title}`;

    dispatch(sendCopilotMessage({ message: prompt, month: activeMonth }));
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'danger':
        return {
          bg: colors.danger + '15',
          border: colors.danger + '40',
          badgeVariant: 'danger',
          icon: '🚨',
          btnBg: colors.danger,
          btnText: '#FFFFFF',
        };
      case 'warning':
        return {
          bg: colors.warning + '15',
          border: colors.warning + '40',
          badgeVariant: 'warning',
          icon: '⚠️',
          btnBg: colors.warning,
          btnText: '#000000',
        };
      case 'success':
        return {
          bg: colors.success + '15',
          border: colors.success + '40',
          badgeVariant: 'success',
          icon: '🎉',
          btnBg: colors.success,
          btnText: '#FFFFFF',
        };
      default:
        return {
          bg: colors.primary + '15',
          border: colors.primary + '40',
          badgeVariant: 'primary',
          icon: '💡',
          btnBg: colors.primary,
          btnText: '#FFFFFF',
        };
    }
  };

  return (
    <View style={[styles.container, style]} testID="proactive-insights-container">
      {proactiveInsights.map((insight) => {
        const theme = getTypeStyles(insight.type);
        return (
          <View
            key={insight.id || insight.title}
            style={[
              styles.card,
              { backgroundColor: theme.bg, borderColor: theme.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Text style={styles.icon}>{theme.icon}</Text>
                <View style={styles.titleArea}>
                  <View style={styles.badgeRow}>
                    <Badge
                      label={(insight.type || 'info').toUpperCase()}
                      variant={theme.badgeVariant}
                      size="sm"
                    />
                    <Text variant="caption" color={colors.textPrimary} weight="bold" numberOfLines={1}>
                      {insight.title}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <Text variant="caption" color={colors.textSecondary} style={styles.message}>
              {insight.message}
            </Text>

            {insight.actionLabel ? (
              <TouchableOpacity
                onPress={() => handleActionPress(insight)}
                style={[styles.actionBtn, { backgroundColor: theme.btnBg }]}
                activeOpacity={0.8}
                testID={`proactive-action-${insight.id || 'btn'}`}
              >
                <Text variant="caption" color={theme.btnText} weight="bold">
                  {insight.actionLabel} →
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  icon: {
    fontSize: 16,
  },
  titleArea: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  message: {
    lineHeight: 18,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
});

export default ProactiveInsightBanner;
