import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Card, Text, Input, Button, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

const CATEGORIES = [
  'Food',
  'Shopping',
  'Groceries',
  'Bills',
  'Entertainment',
  'Salary',
  'Investment',
  'Healthcare',
  'Transport',
  'Utilities',
  'Education',
  'Other',
];

const PAYMENT_METHODS = ['upi', 'card', 'netbanking', 'cash'];

export const StagedEditModal = ({
  visible,
  transaction,
  isLoading = false,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [dateStr, setDateStr] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title || transaction.merchant || '');
      setMerchant(transaction.merchant || transaction.title || '');
      setAmount(transaction.amount ? String(transaction.amount) : '');
      setType(transaction.type || 'expense');
      setCategory(transaction.category || 'Food');
      setPaymentMethod(transaction.paymentMethod?.toLowerCase() || 'upi');
      const d = transaction.transactionDate || transaction.date;
      setDateStr(d ? new Date(d).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setErrors({});
    }
  }, [transaction]);

  if (!visible || !transaction) return null;

  const validate = () => {
    const errs = {};
    if (!title.trim() && !merchant.trim()) {
      errs.title = 'Title or Merchant name is required';
    }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Please enter a valid amount greater than 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveAndConfirm = () => {
    if (!validate()) return;

    const updatedData = {
      title: title.trim() || merchant.trim(),
      merchant: merchant.trim() || title.trim(),
      amount: parseFloat(amount),
      type,
      category,
      paymentMethod,
      transactionDate: dateStr ? new Date(dateStr) : new Date(),
    };

    onSave(transaction._id || transaction.id, updatedData);
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
        <Card style={styles.modalContent} testID="staged-edit-modal">
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text variant="title" style={styles.title}>
                Edit Detected Transaction
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                Verify or adjust extracted fields before confirming
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={isLoading}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* Transaction Type Toggle */}
            <Text variant="caption" color={colors.textSecondary} weight="semiBold" style={styles.label}>
              Transaction Type
            </Text>
            <View style={styles.typeRow}>
              {['expense', 'income', 'transfer'].map((t) => {
                const isSelected = type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typePill,
                      isSelected && styles.typePillSelected,
                      isSelected && t === 'income' && styles.typePillIncome,
                      isSelected && t === 'expense' && styles.typePillExpense,
                    ]}
                    onPress={() => setType(t)}
                    activeOpacity={0.8}
                  >
                    <Text
                      variant="caption"
                      weight={isSelected ? 'bold' : 'normal'}
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    >
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Merchant / Title Input */}
            <Input
              label="Merchant / Title"
              value={merchant || title}
              onChangeText={(val) => {
                setMerchant(val);
                setTitle(val);
                if (errors.title) setErrors((e) => ({ ...e, title: null }));
              }}
              placeholder="e.g. Swiggy, Amazon, Salary"
              error={errors.title}
              testID="edit-staged-title-input"
            />

            {/* Amount Input */}
            <Input
              label="Amount (₹)"
              value={amount}
              onChangeText={(val) => {
                setAmount(val);
                if (errors.amount) setErrors((e) => ({ ...e, amount: null }));
              }}
              placeholder="0.00"
              keyboardType="numeric"
              error={errors.amount}
              testID="edit-staged-amount-input"
            />

            {/* Category Selector */}
            <Text variant="caption" color={colors.textSecondary} weight="semiBold" style={styles.label}>
              Category
            </Text>
            <View style={styles.chipGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      variant="caption"
                      color={isSelected ? colors.primaryLight : colors.textMuted}
                      weight={isSelected ? 'bold' : 'normal'}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Payment Method Selector */}
            <Text variant="caption" color={colors.textSecondary} weight="semiBold" style={styles.label}>
              Payment Method
            </Text>
            <View style={styles.chipGrid}>
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm;
                return (
                  <TouchableOpacity
                    key={pm}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setPaymentMethod(pm)}
                    activeOpacity={0.7}
                  >
                    <Text
                      variant="caption"
                      color={isSelected ? colors.secondaryLight : colors.textMuted}
                      weight={isSelected ? 'bold' : 'normal'}
                    >
                      {pm.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Date Input */}
            <Input
              label="Transaction Date (YYYY-MM-DD)"
              value={dateStr}
              onChangeText={setDateStr}
              placeholder="YYYY-MM-DD"
              testID="edit-staged-date-input"
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              variant="secondary"
              size="md"
              onPress={onClose}
              disabled={isLoading}
              style={styles.cancelBtn}
            />
            <Button
              title={isLoading ? 'Saving...' : 'Save & Confirm'}
              variant="primary"
              size="md"
              loading={isLoading}
              onPress={handleSaveAndConfirm}
              style={styles.saveBtn}
              testID="save-confirm-staged-button"
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    padding: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.surfaceBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    marginBottom: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 18,
    color: colors.textMuted,
  },
  scrollBody: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typePill: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  typePillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  typePillIncome: {
    borderColor: colors.income,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  typePillExpense: {
    borderColor: colors.expense,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  chipSelected: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primaryLight,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
  },
});

export default StagedEditModal;
