import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Text, Input, Button, Badge, ErrorBanner } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { editTransaction } from '../../store/slices/transactionSlice.js';

const CATEGORIES = [
  'Food',
  'Shopping',
  'Bills',
  'Transport',
  'Entertainment',
  'Healthcare',
  'Education',
  'Salary',
  'Rent',
  'Investments',
  'Other',
];

const PAYMENT_METHODS = [
  { label: 'UPI', value: 'upi' },
  { label: 'Card', value: 'card' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Cash', value: 'cash' },
  { label: 'Wallet', value: 'wallet' },
];

export const EditTransactionModal = ({ visible, transaction, onClose }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.transactions);

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Food');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (transaction) {
      setType(transaction.type || 'expense');
      setAmount(String(transaction.amount || ''));
      setMerchant(transaction.merchant || transaction.title || '');
      setCategory(transaction.category || 'Food');
      setPaymentMethod(transaction.paymentMethod || 'upi');
      setNotes(transaction.description || '');
      setFormErrors({});
    }
  }, [transaction]);

  const validate = () => {
    const errors = {};
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      errors.amount = 'Please enter a valid amount greater than 0';
    }

    if (!merchant || !merchant.trim()) {
      errors.merchant = 'Merchant or title is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validate() || !transaction) return;

    dispatch(
      editTransaction({
        id: transaction._id || transaction.id,
        data: {
          type,
          amount: parseFloat(amount),
          merchant: merchant.trim(),
          title: merchant.trim(),
          category,
          paymentMethod,
          description: notes.trim(),
        },
      })
    );
  };

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.dragHandle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerRow}>
              <Text variant="title" color={colors.textPrimary}>
                Edit Transaction
              </Text>
              <Badge label="MODIFY" variant="primary" size="sm" />
            </View>

            {error && <ErrorBanner message={error} />}

            {/* Type Selector Toggle */}
            <View style={styles.typeToggleContainer}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'expense' && styles.activeExpenseType]}
                onPress={() => setType('expense')}
                activeOpacity={0.7}
              >
                <Text
                  variant="body"
                  weight="bold"
                  color={type === 'expense' ? '#FFFFFF' : colors.textSecondary}
                >
                  Expense ↑
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, type === 'income' && styles.activeIncomeType]}
                onPress={() => setType('income')}
                activeOpacity={0.7}
              >
                <Text
                  variant="body"
                  weight="bold"
                  color={type === 'income' ? '#FFFFFF' : colors.textSecondary}
                >
                  Income ↓
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <Input
              label="Amount (₹)"
              value={amount}
              onChangeText={(val) => {
                setAmount(val);
                if (formErrors.amount) setFormErrors({ ...formErrors, amount: null });
              }}
              keyboardType="numeric"
              error={formErrors.amount}
              testID="edit-amount-input"
            />

            {/* Merchant / Title Input */}
            <Input
              label="Merchant / Title"
              value={merchant}
              onChangeText={(val) => {
                setMerchant(val);
                if (formErrors.merchant) setFormErrors({ ...formErrors, merchant: null });
              }}
              error={formErrors.merchant}
              testID="edit-merchant-input"
            />

            {/* Category Selector */}
            <View style={styles.sectionBlock}>
              <Text variant="label">Category</Text>
              <View style={styles.pillsGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category.toLowerCase() === cat.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={`edit_cat_${cat}`}
                      style={[styles.catPill, isSelected && styles.activeCatPill]}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        variant="caption"
                        color={isSelected ? '#FFFFFF' : colors.textSecondary}
                        weight={isSelected ? 'bold' : 'medium'}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Payment Method Selector */}
            <View style={styles.sectionBlock}>
              <Text variant="label">Payment Method</Text>
              <View style={styles.pillsGrid}>
                {PAYMENT_METHODS.map((pm) => {
                  const isSelected = paymentMethod === pm.value;
                  return (
                    <TouchableOpacity
                      key={`edit_pm_${pm.value}`}
                      style={[styles.catPill, isSelected && styles.activePillSecondary]}
                      onPress={() => setPaymentMethod(pm.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        variant="caption"
                        color={isSelected ? '#FFFFFF' : colors.textSecondary}
                        weight={isSelected ? 'bold' : 'medium'}
                      >
                        {pm.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notes / Description Input */}
            <Input
              label="Notes / Description"
              value={notes}
              onChangeText={setNotes}
            />

            {/* Actions */}
            <View style={styles.modalActionsRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={onClose}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Save Changes"
                variant="primary"
                loading={isLoading}
                onPress={handleSave}
                style={{ flex: 1 }}
                testID="edit-save-button"
              />
            </View>
          </ScrollView>
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
    maxHeight: '92%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceBorder,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  activeExpenseType: {
    backgroundColor: colors.danger,
  },
  activeIncomeType: {
    backgroundColor: colors.success,
  },
  sectionBlock: {
    marginBottom: spacing.lg,
  },
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  catPill: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  activeCatPill: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  activePillSecondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondaryLight,
  },
  modalActionsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});

export default EditTransactionModal;
