import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '../index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';

export const TransactionSearchBar = ({
  value = '',
  onChangeText,
  onClear,
  placeholder = 'Search merchant, category, notes...',
}) => {
  const [internalText, setInternalText] = useState(value);

  useEffect(() => {
    setInternalText(value);
  }, [value]);

  // Debounce user input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalText !== value) {
        onChangeText(internalText);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [internalText, value, onChangeText]);

  const handleClear = () => {
    setInternalText('');
    if (onClear) onClear();
    else onChangeText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholderText}
          value={internalText}
          onChangeText={setInternalText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          testID="transaction-search-input"
        />
        {internalText ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.7}
            testID="transaction-search-clear"
          >
            <Text variant="caption" color={colors.textMuted} weight="bold">
              ✕
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearButton: {
    padding: spacing.xs,
  },
});

export default TransactionSearchBar;
