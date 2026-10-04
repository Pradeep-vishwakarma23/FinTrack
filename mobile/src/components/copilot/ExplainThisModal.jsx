import React from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Text, Badge, FinTrackMark } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import {
  closeExplainModal,
  openCopilot,
  sendCopilotMessage,
} from '../../store/slices/copilotSlice.js';
import { getCurrentMonthKey } from '../../store/slices/intelligenceSlice.js';

export const ExplainThisModal = () => {
  const dispatch = useDispatch();
  const {
    isExplainModalOpen = false,
    explanation = null,
    explanationLoading = false,
    explanationError = null,
    explanationContextType = null,
    provider = 'gemini',
    month: copilotMonth = null,
  } = useSelector((state) => state?.copilot || {});

  const { period: intelligenceMonth } = useSelector((state) => state?.intelligence || {});
  const activeMonth = copilotMonth || intelligenceMonth || getCurrentMonthKey();

  if (!isExplainModalOpen) return null;

  const handleAskCopilotMore = () => {
    dispatch(closeExplainModal());
    dispatch(openCopilot());
    const prompt = `Can you explain more about my ${explanationContextType || 'financial metrics'} for ${activeMonth}?`;
    dispatch(sendCopilotMessage({ message: prompt, month: activeMonth }));
  };

  return (
    <Modal
      visible={isExplainModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => dispatch(closeExplainModal())}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <FinTrackMark size={28} />
              <View style={styles.headerTitles}>
                <View style={styles.titleRow}>
                  <Text variant="title" color={colors.textPrimary} weight="bold">
                    Explain Metric
                  </Text>
                  <Badge
                    label={provider === 'gemini' ? 'Gemini ✦' : 'Fallback'}
                    variant={provider === 'gemini' ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>
                <Text variant="caption" color={colors.textSecondary}>
                  Grounded in {activeMonth} Banking Intelligence
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => dispatch(closeExplainModal())}
              style={styles.closeBtn}
              accessibilityLabel="Close Explanation Modal"
              testID="close-explain-modal-btn"
            >
              <Text variant="body" color={colors.textMuted} weight="bold">
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {explanationLoading && (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text variant="caption" color={colors.textMuted} style={styles.loadingText}>
                  Analyzing verified drivers and cash flow...
                </Text>
              </View>
            )}

            {explanationError && (
              <View style={styles.errorBanner}>
                <Text variant="caption" color={colors.danger} weight="medium">
                  ⚠️ {explanationError}
                </Text>
              </View>
            )}

            {!explanationLoading && !explanationError && explanation && (
              <View style={styles.contentSection}>
                {/* Title & Core Explanation */}
                <View style={styles.titleSection}>
                  <Text variant="subtitle" color={colors.textPrimary} weight="bold">
                    {explanation.title}
                  </Text>
                  <View style={styles.explanationBox}>
                    <Text variant="body" color={colors.textSecondary} style={styles.explanationText}>
                      {explanation.explanation}
                    </Text>
                  </View>
                </View>

                {/* Key Drivers */}
                {Array.isArray(explanation.keyDrivers) && explanation.keyDrivers.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <Text variant="caption" color={colors.textMuted} weight="bold" style={styles.sectionTitle}>
                      KEY FINANCIAL DRIVERS
                    </Text>
                    <View style={styles.driversList}>
                      {explanation.keyDrivers.map((driver, idx) => (
                        <View key={idx} style={styles.driverItem}>
                          <Text style={styles.driverIcon}>•</Text>
                          <Text variant="caption" color={colors.textPrimary} style={styles.driverText}>
                            {driver}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Recommended Action */}
                {explanation.recommendedAction ? (
                  <View style={styles.actionCard}>
                    <View style={styles.actionHeader}>
                      <Text style={styles.actionIcon}>✓</Text>
                      <Text variant="caption" color={colors.success} weight="bold">
                        RECOMMENDED ACTION
                      </Text>
                    </View>
                    <Text variant="caption" color={colors.textSecondary} style={styles.actionText}>
                      {explanation.recommendedAction}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => dispatch(closeExplainModal())}
              style={styles.secondaryBtn}
              activeOpacity={0.7}
            >
              <Text variant="caption" color={colors.textSecondary} weight="bold">
                Close
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAskCopilotMore}
              style={styles.primaryBtn}
              activeOpacity={0.8}
              testID="ask-copilot-more-btn"
            >
              <Text variant="caption" color="#FFFFFF" weight="bold">
                Ask Copilot More →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surfaceHeader,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  centerContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    marginTop: spacing.xs,
  },
  errorBanner: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  contentSection: {
    gap: spacing.md,
  },
  titleSection: {
    gap: spacing.xs,
  },
  explanationBox: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  explanationText: {
    lineHeight: 20,
  },
  sectionBlock: {
    gap: spacing.xs,
  },
  sectionTitle: {
    letterSpacing: 0.5,
  },
  driversList: {
    gap: spacing.xs,
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.mintBg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.mintBorder,
  },
  driverIcon: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
  driverText: {
    flex: 1,
  },
  actionCard: {
    padding: spacing.md,
    backgroundColor: colors.successBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.successBorder,
    gap: spacing.xs,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionIcon: {
    fontSize: 14,
    color: colors.success,
    fontWeight: 'bold',
  },
  actionText: {
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    backgroundColor: '#FFFFFF',
  },
  secondaryBtn: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: '#FFFFFF',
  },
  primaryBtn: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
});

export default ExplainThisModal;
