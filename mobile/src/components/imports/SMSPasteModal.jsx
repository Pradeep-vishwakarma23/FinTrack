import React, { useState } from 'react';
import {
  View,
  Modal,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Card, Text, Button, Badge } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

const SAMPLE_SMS_DATASET = [
  '₹480 debited via UPI to SWIGGY on 26-Sep-2026. Avail Bal: ₹24,520.',
  'Your A/C XX8901 is credited with INR 45,000.00 on 25-Sep-26 towards Monthly Salary from TECH CORP. Bal: ₹70,000.',
  'Rs 1,250.00 spent on HDFC Card XX4521 at AMAZON INDIA on 24-Sep-2026. Avail Limit: ₹85,000.',
  'Paid ₹349 for Airtel Broadband Bill via GooglePay UPI ref 4293810293 on 23-Sep-2026.',
  '₹2,100 debited from SBI Account for GROCERIES at DMART STORE on 22-Sep-2026.',
];

export const SMSPasteModal = ({
  visible,
  isLoading,
  onSubmit,
  onClose,
}) => {
  const [text, setText] = useState('');
  const [inputError, setInputError] = useState('');

  if (!visible) return null;

  const handleLoadSample = () => {
    setText(SAMPLE_SMS_DATASET.join('\n\n'));
    setInputError('');
  };

  const handleProcess = () => {
    if (!text || text.trim().length < 5) {
      setInputError('Please enter at least one bank transaction SMS or load sample data.');
      return;
    }
    setInputError('');
    onSubmit(text);
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
        <Card style={styles.modalContent} testID="sms-paste-modal">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWithBadge}>
              <Text variant="title" style={styles.title}>
                Import SMS Messages
              </Text>
              <Badge label="LOCAL EXTRACTION" variant="success" size="sm" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={isLoading}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* Explanatory subtitle */}
            <Text variant="bodySmall" color={colors.textSecondary} style={styles.instructions}>
              Paste bank transaction SMS alerts or use the demo generator below. FinTrack will automatically extract the merchant, amount, category, and date for staging.
            </Text>

            {/* Quick Demo Button */}
            <View style={styles.sampleBar}>
              <Text variant="caption" color={colors.textMuted}>
                Testing without copying real SMS?
              </Text>
              <TouchableOpacity
                onPress={handleLoadSample}
                style={styles.sampleBtn}
                activeOpacity={0.75}
                disabled={isLoading}
              >
                <Text variant="caption" color={colors.primaryLight} weight="bold">
                  ⚡ Load Demo SMS Batch
                </Text>
              </TouchableOpacity>
            </View>

            {/* Text Input Area */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textArea}
                value={text}
                onChangeText={(val) => {
                  setText(val);
                  if (inputError) setInputError('');
                }}
                placeholder="Paste SMS messages here (e.g. ₹480 debited via UPI to Swiggy...)"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                editable={!isLoading}
                testID="sms-paste-input"
              />
            </View>

            {inputError ? (
              <Text variant="caption" color={colors.danger} style={styles.errorText}>
                {inputError}
              </Text>
            ) : null}

            {/* Privacy Reminder */}
            <View style={styles.privacyNotice}>
              <Text variant="caption" color={colors.secondaryLight} weight="semiBold">
                🔒 Privacy Guarantee:
              </Text>
              <Text variant="caption" color={colors.textMuted} style={{ marginTop: 2, lineHeight: 16 }}>
                Sensitive OTPs and personal identifiers are rejected by the parser. Raw message text is processed in memory and never logged or stored permanently.
              </Text>
            </View>
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
              title={isLoading ? 'Processing...' : 'Process Messages'}
              variant="primary"
              size="md"
              loading={isLoading}
              onPress={handleProcess}
              style={styles.processBtn}
              testID="process-sms-button"
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
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleWithBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  scrollBody: {
    marginBottom: spacing.md,
  },
  instructions: {
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  sampleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  sampleBtn: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
  inputWrapper: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  textArea: {
    color: colors.textPrimary,
    padding: spacing.md,
    fontSize: 14,
    minHeight: 140,
  },
  errorText: {
    marginTop: spacing.xs,
  },
  privacyNotice: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
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
  processBtn: {
    flex: 2,
  },
});

export default SMSPasteModal;
