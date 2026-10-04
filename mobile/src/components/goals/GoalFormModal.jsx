import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Text, Input, Button } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

const CATEGORIES = [
  'General',
  'Emergency Fund',
  'Savings',
  'Travel & Vacation',
  'Home & Real Estate',
  'Vehicle',
  'Education',
  'Gadgets & Tech',
  'Investments',
  'Debt Payoff',
  'Other'
];

const PRIORITIES = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' }
];

const STATUSES = [
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Paused', value: 'paused' },
  { label: 'Cancelled', value: 'cancelled' }
];

export const GoalFormModal = ({
  visible,
  mode = 'create', // 'create' | 'edit'
  initialGoal = null,
  onClose,
  onSubmit,
  loading = false,
  error = null
}) => {
  const getDefaultTargetDate = () => {
    const future = new Date();
    future.setMonth(future.getMonth() + 6);
    return future.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: getDefaultTargetDate(),
    category: 'General',
    priority: 'medium',
    status: 'in_progress',
    monthlyTarget: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && initialGoal) {
        let dateStr = '';
        if (initialGoal.targetDate) {
          try {
            dateStr = new Date(initialGoal.targetDate).toISOString().split('T')[0];
          } catch {
            dateStr = '';
          }
        }
        setFormData({
          title: initialGoal.title || '',
          targetAmount: initialGoal.targetAmount !== undefined ? String(initialGoal.targetAmount) : '',
          currentAmount: initialGoal.currentAmount !== undefined ? String(initialGoal.currentAmount) : '0',
          targetDate: dateStr || getDefaultTargetDate(),
          category: initialGoal.category || 'General',
          priority: initialGoal.priority || 'medium',
          status: initialGoal.status || 'in_progress',
          monthlyTarget: initialGoal.monthlyTarget ? String(initialGoal.monthlyTarget) : '',
          notes: initialGoal.notes || ''
        });
      } else {
        setFormData({
          title: '',
          targetAmount: '',
          currentAmount: '0',
          targetDate: getDefaultTargetDate(),
          category: 'General',
          priority: 'medium',
          status: 'in_progress',
          monthlyTarget: '',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [visible, mode, initialGoal]);

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Goal title is required.';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters.';
    }

    const numTarget = Number(formData.targetAmount);
    if (!formData.targetAmount || isNaN(numTarget) || numTarget < 1) {
      newErrors.targetAmount = 'Target amount must be at least ₹1.';
    }

    const numCurrent = Number(formData.currentAmount);
    if (formData.currentAmount !== '' && (isNaN(numCurrent) || numCurrent < 0)) {
      newErrors.currentAmount = 'Current amount cannot be negative.';
    }

    if (!formData.targetDate) {
      newErrors.targetDate = 'Target date is required (YYYY-MM-DD).';
    } else {
      const selected = new Date(formData.targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(selected.getTime())) {
        newErrors.targetDate = 'Invalid date format (use YYYY-MM-DD).';
      } else if (mode === 'create' && selected <= today) {
        newErrors.targetDate = 'Target date must be in the future.';
      }
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      title: formData.title.trim(),
      targetAmount: Number(formData.targetAmount),
      currentAmount: Number(formData.currentAmount || 0),
      targetDate: formData.targetDate,
      category: formData.category,
      priority: formData.priority,
      status: formData.status,
      monthlyTarget: formData.monthlyTarget ? Number(formData.monthlyTarget) : 0,
      notes: formData.notes.trim()
    };

    if (onSubmit) {
      onSubmit(payload);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={!loading ? onClose : undefined}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text variant="subtitle" weight="bold" color={colors.textPrimary}>
                {mode === 'edit' ? 'Edit Financial Goal' : 'Create Financial Goal'}
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                {mode === 'edit'
                  ? 'Update target parameters and saved contributions'
                  : 'Define your savings target with automated feasibility'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              style={styles.closeButton}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* API Error Alert */}
          {Boolean(error) && (
            <View style={styles.errorAlert}>
              <Text variant="caption" color={colors.danger} weight="bold">
                ⚠️ {error}
              </Text>
            </View>
          )}

          {/* Form ScrollView */}
          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <Input
              label="Goal Title *"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="e.g. Emergency Reserve, Vacation"
              error={errors.title}
              editable={!loading}
              maxLength={100}
              testID="goal-title-input"
            />

            {/* Target Amount */}
            <Input
              label="Target Amount (₹) *"
              value={formData.targetAmount}
              onChangeText={(text) => setFormData({ ...formData, targetAmount: text })}
              placeholder="e.g. 50000"
              keyboardType="numeric"
              error={errors.targetAmount}
              editable={!loading}
              testID="goal-target-amount-input"
            />

            {/* Current Saved Amount */}
            <Input
              label="Current Saved (₹)"
              value={formData.currentAmount}
              onChangeText={(text) => setFormData({ ...formData, currentAmount: text })}
              placeholder="0"
              keyboardType="numeric"
              error={errors.currentAmount}
              editable={!loading}
              testID="goal-current-amount-input"
            />

            {/* Target Date */}
            <Input
              label="Target Date (YYYY-MM-DD) *"
              value={formData.targetDate}
              onChangeText={(text) => setFormData({ ...formData, targetDate: text })}
              placeholder="2027-06-30"
              error={errors.targetDate}
              editable={!loading}
              testID="goal-target-date-input"
            />

            {/* Category Selector */}
            <View style={styles.selectorGroup}>
              <Text variant="label" color={colors.textSecondary} style={styles.groupLabel}>
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                {CATEGORIES.map((cat) => {
                  const isSelected = formData.category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setFormData({ ...formData, category: cat })}
                      disabled={loading}
                      style={[
                        styles.pill,
                        isSelected && styles.pillSelected
                      ]}
                      testID={`category-pill-${cat}`}
                    >
                      <Text
                        variant="caption"
                        weight={isSelected ? 'bold' : 'normal'}
                        color={isSelected ? '#FFFFFF' : colors.textSecondary}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Priority Selector */}
            <View style={styles.selectorGroup}>
              <Text variant="label" color={colors.textSecondary} style={styles.groupLabel}>
                Priority
              </Text>
              <View style={styles.buttonRow}>
                {PRIORITIES.map((p) => {
                  const isSelected = formData.priority === p.value;
                  return (
                    <TouchableOpacity
                      key={p.value}
                      onPress={() => setFormData({ ...formData, priority: p.value })}
                      disabled={loading}
                      style={[
                        styles.segmentedButton,
                        isSelected && styles.segmentedButtonSelected
                      ]}
                      testID={`priority-${p.value}`}
                    >
                      <Text
                        variant="caption"
                        weight={isSelected ? 'bold' : 'normal'}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      >
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Status Selector in Edit Mode */}
            {mode === 'edit' && (
              <View style={styles.selectorGroup}>
                <Text variant="label" color={colors.textSecondary} style={styles.groupLabel}>
                  Status
                </Text>
                <View style={styles.buttonRow}>
                  {STATUSES.map((s) => {
                    const isSelected = formData.status === s.value;
                    return (
                      <TouchableOpacity
                        key={s.value}
                        onPress={() => setFormData({ ...formData, status: s.value })}
                        disabled={loading}
                        style={[
                          styles.segmentedButton,
                          isSelected && styles.segmentedButtonSelected
                        ]}
                        testID={`status-${s.value}`}
                      >
                        <Text
                          variant="caption"
                          weight={isSelected ? 'bold' : 'normal'}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        >
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Optional Monthly Target (in create mode) */}
            {mode === 'create' && (
              <Input
                label="Optional Monthly Target (₹)"
                value={formData.monthlyTarget}
                onChangeText={(text) => setFormData({ ...formData, monthlyTarget: text })}
                placeholder="e.g. 5000"
                keyboardType="numeric"
                editable={!loading}
                testID="goal-monthly-target-input"
              />
            )}

            {/* Notes */}
            <Input
              label="Notes & Strategy (Optional)"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="e.g. Save into liquid fund on 5th of each month"
              multiline
              numberOfLines={3}
              maxLength={500}
              editable={!loading}
              testID="goal-notes-input"
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="secondary"
              size="md"
              onPress={onClose}
              disabled={loading}
              style={styles.cancelBtn}
              testID="cancel-goal-form-btn"
            />
            <Button
              title={mode === 'edit' ? 'Save Changes' : 'Create Goal'}
              variant="primary"
              size="md"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitBtn}
              testID="submit-goal-form-btn"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  errorAlert: {
    backgroundColor: colors.dangerBg,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  formScroll: {
    maxHeight: 400,
  },
  selectorGroup: {
    marginBottom: spacing.md,
  },
  groupLabel: {
    marginBottom: spacing.xs,
  },
  pillScroll: {
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: spacing.xs,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segmentedButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  segmentedButtonSelected: {
    backgroundColor: colors.mintBg,
    borderColor: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 1,
  },
});

export default GoalFormModal;
