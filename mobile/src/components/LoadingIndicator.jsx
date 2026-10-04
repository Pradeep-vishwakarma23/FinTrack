import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/index.js';
import Text from './Text.jsx';

export const LoadingIndicator = ({
  message = 'Loading...',
  fullScreen = false,
  size = 'large',
  color = colors.primary,
  style,
}) => {
  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        style,
      ]}
    >
      <ActivityIndicator size={size} color={color} />
      {message ? (
        <Text
          variant="bodySmall"
          color={colors.textSecondary}
          weight="medium"
          style={styles.message}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  message: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

export default LoadingIndicator;
