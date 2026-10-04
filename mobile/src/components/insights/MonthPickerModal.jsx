import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Card, Text, Button, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const formatMonthDisplay = (periodStr) => {
  if (!periodStr || typeof periodStr !== 'string') return 'Current Month';
  const parts = periodStr.split('-');
  if (parts.length !== 2) return periodStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const d = new Date(year, month, 1);
  if (isNaN(d.getTime())) return periodStr;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/**
 * Computes previous or next YYYY-MM period.
 */
export const shiftMonth = (periodStr, offset = 0) => {
  const parts = (periodStr || getCurrentMonthKey()).split('-');
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10) - 1 + offset;

  const d = new Date(year, month, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Generates past N months list for quick 1-tap selection up to current month.
 */
export const getRecentMonthsList = (count = 6) => {
  const list = [];
  const currentKey = getCurrentMonthKey();
  for (let i = 0; i < count; i++) {
    const key = shiftMonth(currentKey, -i);
    list.push({
      key,
      label: formatMonthDisplay(key),
      isCurrent: i === 0,
    });
  }
  return list;
};

export const MonthPickerModal = ({
  visible,
  currentPeriod,
  currentMonth,
  onSelect,
  onSelectMonth,
  onClose,
}) => {
  const maxMonthKey = getCurrentMonthKey();
  const initialPeriod = currentPeriod || currentMonth || maxMonthKey;
  const [tempPeriod, setTempPeriod] = useState(initialPeriod);

  useEffect(() => {
    if (visible) {
      setTempPeriod(currentPeriod || currentMonth || maxMonthKey);
    }
  }, [visible, currentPeriod, currentMonth, maxMonthKey]);

  if (!visible) return null;

  const canGoNext = tempPeriod < maxMonthKey;
  const quickList = getRecentMonthsList(6);

  const handlePrev = () => {
    setTempPeriod((prev) => shiftMonth(prev, -1));
  };

  const handleNext = () => {
    if (canGoNext) {
      setTempPeriod((prev) => shiftMonth(prev, 1));
    }
  };

  const handleDone = () => {
    const callback = onSelect || onSelectMonth;
    if (typeof callback === 'function') {
      callback(tempPeriod);
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Card style={styles.modalContent} testID="month-picker-modal">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text variant="title" style={styles.title}>
                Select Month
              </Text>
              <Badge label="HISTORICAL INTELLIGENCE" variant="primary" size="sm" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="close-month-modal-btn">
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            <Text variant="bodySmall" color={colors.textSecondary} style={styles.subtitle}>
              Browse confirmed ledger analytics and spending forecasts for any past or current month.
            </Text>

            {/* Stepper Navigator */}
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={handlePrev}
                activeOpacity={0.7}
                testID="prev-month-btn"
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <Text style={styles.navButtonText}>◀</Text>
              </TouchableOpacity>

              <View style={styles.selectedDisplay}>
                <Text variant="subtitle" color={colors.textPrimary} weight="bold">
                  {formatMonthDisplay(tempPeriod)}
                </Text>
                <Text variant="caption" color={colors.primary} weight="semiBold" style={{ marginTop: 2 }}>
                  {tempPeriod}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
                onPress={handleNext}
                disabled={!canGoNext}
                activeOpacity={0.7}
                testID="next-month-btn"
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <Text style={[styles.navButtonText, !canGoNext && styles.navButtonTextDisabled]}>
                  ▶
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Presets Grid */}
            <Text variant="caption" color={colors.textMuted} weight="semiBold" style={styles.presetsLabel}>
              QUICK MONTH SELECTOR
            </Text>

            <View style={styles.presetsGrid}>
              {quickList.map((m) => {
                const isSelected = m.key === tempPeriod;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                    onPress={() => setTempPeriod(m.key)}
                    activeOpacity={0.75}
                    testID={`month-chip-${m.key}`}
                  >
                    <Text
                      variant="caption"
                      color={isSelected ? colors.primary : colors.textSecondary}
                      weight={isSelected ? 'bold' : 'normal'}
                    >
                      {m.label}
                    </Text>
                    {m.isCurrent && (
                      <Badge label="CURRENT" variant="success" size="sm" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              variant="secondary"
              size="md"
              onPress={onClose}
              style={styles.cancelBtn}
              testID="cancel-month-btn"
            />
            <Button
              title="Done"
              variant="primary"
              size="md"
              onPress={handleDone}
              style={styles.doneBtn}
              testID="done-month-btn"
            />
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 18,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 18,
    color: colors.textMuted,
  },
  body: {
    marginBottom: spacing.md,
  },
  subtitle: {
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
    borderColor: colors.surfaceBorder,
  },
  navButtonText: {
    fontSize: 16,
    color: colors.primary,
  },
  navButtonTextDisabled: {
    color: colors.textMuted,
  },
  selectedDisplay: {
    alignItems: 'center',
  },
  presetsLabel: {
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  presetsGrid: {
    gap: spacing.xs,
  },
  presetChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  presetChipSelected: {
    backgroundColor: colors.mintBg,
    borderColor: colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  cancelBtn: {
    flex: 1,
  },
  doneBtn: {
    flex: 1,
  },
});

export default MonthPickerModal;
