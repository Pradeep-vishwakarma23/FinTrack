import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/index.js';
import Text from './Text.jsx';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  isPassword = false,
  leftIcon,
  rightIcon,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  editable = true,
  containerStyle,
  inputStyle,
  testID,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="label" color={error ? colors.danger : colors.textSecondary}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.focusedWrapper,
          Boolean(error) && styles.errorWrapper,
          !editable && styles.disabledWrapper,
        ]}
      >
        {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}

        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholderText}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          testID={testID}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.rightIconWrapper}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            <Text variant="caption" color={colors.primaryLight} weight="semiBold">
              {showPassword ? 'HIDE' : 'SHOW'}
            </Text>
          </TouchableOpacity>
        )}

        {!isPassword && rightIcon && (
          <View style={styles.rightIconWrapper}>{rightIcon}</View>
        )}
      </View>

      {error ? (
        <Text variant="caption" color={colors.danger} style={styles.errorText}>
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" color={colors.textMuted} style={styles.helperText}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
    minHeight: 50,
  },
  focusedWrapper: {
    borderColor: colors.inputBorderFocused,
    backgroundColor: colors.surfaceElevated,
  },
  errorWrapper: {
    borderColor: colors.danger,
  },
  disabledWrapper: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    lineHeight: typography.lineHeights.md,
    paddingVertical: spacing.sm + 2,
  },
  leftIconWrapper: {
    marginRight: spacing.sm,
  },
  rightIconWrapper: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  errorText: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  helperText: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default Input;
