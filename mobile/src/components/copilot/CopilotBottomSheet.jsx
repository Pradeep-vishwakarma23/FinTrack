import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Text, Badge, FinTrackMark } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import {
  sendCopilotMessage,
  closeCopilot,
  startNewConversation,
  clearCopilotError,
} from '../../store/slices/copilotSlice.js';
import { getCurrentMonthKey } from '../../store/slices/intelligenceSlice.js';

export const CopilotBottomSheet = () => {
  const dispatch = useDispatch();
  const {
    isBottomSheetOpen = false,
    messages = [],
    isSending = false,
    error = null,
    provider = 'gemini',
    month: copilotMonth = null,
  } = useSelector((state) => state?.copilot || {});

  const { period: intelligenceMonth } = useSelector((state) => state?.intelligence || {});
  const activeMonth = copilotMonth || intelligenceMonth || getCurrentMonthKey();

  const [inputMessage, setInputMessage] = useState('');
  const scrollViewRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isBottomSheetOpen) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isSending, isBottomSheetOpen]);

  const handleSend = (textToSend) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputMessage).trim();
    if (!text || isSending) return;

    if (text.length > 500) return;

    dispatch(sendCopilotMessage({ message: text, month: activeMonth }));
    setInputMessage('');
  };

  const formatMonthTitle = (monthStr) => {
    if (!monthStr || !monthStr.includes('-')) return monthStr;
    const [y, m] = monthStr.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const starterPrompts = [
    'Why is my savings rate negative?',
    'Which category contributed the most?',
    'What if I reduce my top category by 20%?',
    'How can I increase my monthly savings?'
  ];

  if (!isBottomSheetOpen) return null;

  return (
    <Modal
      visible={isBottomSheetOpen}
      transparent
      animationType="slide"
      onRequestClose={() => dispatch(closeCopilot())}
    >
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerTitleRow}>
                <FinTrackMark size={24} />
                <Text variant="title" color={colors.textPrimary} style={styles.headerTitle}>
                  FinTrack Copilot
                </Text>
                <Badge
                  label={provider === 'gemini' ? 'Gemini ✦' : 'Assistant • Fallback'}
                  variant={provider === 'gemini' ? 'success' : 'warning'}
                  size="sm"
                />
              </View>
              <Text variant="caption" color={colors.textSecondary} style={styles.monthSubtitle}>
                Analyzing: <Text variant="caption" weight="bold" color={colors.textPrimary}>{formatMonthTitle(activeMonth)}</Text>
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => dispatch(startNewConversation())}
                style={styles.newConvButton}
                activeOpacity={0.7}
                testID="copilot-new-conversation-btn"
                accessibilityRole="button"
                accessibilityLabel="Start new conversation"
              >
                <Text variant="caption" color={colors.primary} weight="bold">
                  + New
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => dispatch(closeCopilot())}
                style={styles.closeButton}
                activeOpacity={0.7}
                testID="copilot-close-btn"
                accessibilityRole="button"
                accessibilityLabel="Close Copilot"
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages ScrollView */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Empty State with Starter Prompts */}
            {messages.length === 0 && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <FinTrackMark size={32} />
                </View>
                <Text variant="subtitle" weight="bold" color={colors.textPrimary} style={styles.emptyTitle}>
                  How can I assist your finances?
                </Text>
                <Text variant="caption" color={colors.textSecondary} style={styles.emptySubtitle}>
                  Ask multi-turn questions grounded strictly in your confirmed {formatMonthTitle(activeMonth)} financial ledger.
                </Text>

                <View style={styles.starterSection}>
                  <Text variant="caption" color={colors.textMuted} weight="bold" style={styles.starterLabel}>
                    SUGGESTED QUESTIONS
                  </Text>
                  {starterPrompts.map((prompt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.starterPromptButton}
                      onPress={() => handleSend(prompt)}
                      activeOpacity={0.75}
                      testID={`starter-prompt-${idx}`}
                    >
                      <Text variant="caption" color={colors.textPrimary} style={{ flex: 1, marginRight: 6 }}>
                        {prompt}
                      </Text>
                      <Text variant="caption" color={colors.primary} weight="bold">→</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Render Messages */}
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <View
                  key={msg.id || index}
                  style={[
                    styles.messageWrapper,
                    isUser ? styles.userMessageWrapper : styles.assistantMessageWrapper,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isUser ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    <Text
                      variant="bodySmall"
                      color={isUser ? '#FFFFFF' : colors.textPrimary}
                      style={styles.messageText}
                    >
                      {msg.content}
                    </Text>
                  </View>

                  {/* Follow-up Chips for Assistant Replies */}
                  {!isUser && Array.isArray(msg.suggestedFollowUps) && msg.suggestedFollowUps.length > 0 && (
                    <View style={styles.followUpsRow}>
                      {msg.suggestedFollowUps.map((chip, cIdx) => (
                        <TouchableOpacity
                          key={cIdx}
                          style={styles.followUpChip}
                          onPress={() => handleSend(chip)}
                          disabled={isSending}
                          activeOpacity={0.7}
                          testID={`follow-up-chip-${cIdx}`}
                        >
                          <Text variant="caption" color={colors.primary} weight="semiBold">
                            ✦ {chip}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Thinking / Sending Indicator */}
            {isSending && (
              <View style={styles.thinkingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text variant="caption" color={colors.textSecondary} style={styles.thinkingText}>
                  Analyzing confirmed ledger facts...
                </Text>
              </View>
            )}

            {/* Error Banner */}
            {error && (
              <View style={styles.errorContainer}>
                <Text variant="caption" color={colors.danger} style={styles.errorText}>
                  ⚠️ {error}
                </Text>
                <TouchableOpacity onPress={() => dispatch(clearCopilotError())}>
                  <Text variant="caption" color={colors.danger} weight="bold">✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Input Footer */}
          <View style={styles.inputFooter}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={inputMessage}
                onChangeText={(text) => setInputMessage(text.slice(0, 500))}
                placeholder={`Ask about ${formatMonthTitle(activeMonth)} finances...`}
                placeholderTextColor={colors.placeholderText}
                multiline
                maxLength={500}
                editable={!isSending}
                testID="copilot-input-field"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputMessage.trim() || isSending) && styles.sendButtonDisabled,
                ]}
                onPress={() => handleSend()}
                disabled={!inputMessage.trim() || isSending}
                activeOpacity={0.7}
                testID="copilot-send-btn"
                accessibilityRole="button"
                accessibilityLabel="Send message to Copilot"
              >
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.charCountRow}>
              <Text variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>
                {inputMessage.length}/500
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '86%',
    borderTopWidth: 1,
    borderColor: colors.surfaceBorder,
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  monthSubtitle: {
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  newConvButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors.mintBg,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  messagesScroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  messagesContent: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
  starterSection: {
    width: '100%',
    gap: spacing.xs,
  },
  starterLabel: {
    letterSpacing: 1,
    marginBottom: 4,
  },
  starterPromptButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 4,
  },
  messageWrapper: {
    marginVertical: 4,
    maxWidth: '90%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
  },
  assistantMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.xs,
  },
  assistantBubble: {
    backgroundColor: colors.surfaceHeader,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderBottomLeftRadius: borderRadius.xs,
  },
  messageText: {
    lineHeight: 20,
  },
  followUpsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  followUpChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.mintBg,
    borderWidth: 1,
    borderColor: colors.surfaceBorderActive,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surfaceHeader,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  thinkingText: {
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  errorText: {
    flex: 1,
  },
  inputFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    backgroundColor: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    maxHeight: 80,
    fontSize: 14,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  charCountRow: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
});

export default CopilotBottomSheet;
