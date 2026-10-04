import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Text,
  Input,
  Button,
  Card,
  ErrorBanner,
  Badge,
  FinTrackLogo,
} from '../../components/index.js';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { validateSignupForm } from '../../utils/validators.js';
import { signupUser, clearError } from '../../store/slices/authSlice.js';

export const SignupScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const handleSignup = async () => {
    dispatch(clearError());
    const validation = validateSignupForm({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    dispatch(signupUser({ name, email, password }));
  };

  return (
    <Container scrollable contentContainerStyle={styles.container}>
      {/* Top Branding */}
      <View style={styles.brandHeader}>
        <FinTrackLogo variant="compact" size="md" isDark={false} style={styles.logo} />
        <Text variant="title" style={styles.brandTitle}>
          Create Account
        </Text>
        <Text variant="caption" color={colors.textSecondary} align="center" style={styles.brandSubtitle}>
          Join FinTrack to activate automated personal finance intelligence
        </Text>
        <View style={styles.taglineBadge}>
          <Badge label="100% PRIVATE & ENCRYPTED" variant="success" size="sm" />
        </View>
      </View>

      {/* Main Signup Card */}
      <Card style={styles.card}>
        {error ? (
          <ErrorBanner
            message={error}
            onDismiss={() => dispatch(clearError())}
          />
        ) : null}

        <Input
          label="Full Name"
          placeholder="e.g. Alex Sharma"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (formErrors.name) setFormErrors({ ...formErrors, name: null });
          }}
          autoCapitalize="words"
          error={formErrors.name}
          testID="signup-name-input"
        />

        <Input
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (formErrors.email) setFormErrors({ ...formErrors, email: null });
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          error={formErrors.email}
          testID="signup-email-input"
        />

        <Input
          label="Password"
          placeholder="At least 6 characters"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (formErrors.password) setFormErrors({ ...formErrors, password: null });
          }}
          isPassword
          error={formErrors.password}
          testID="signup-password-input"
        />

        <Input
          label="Confirm Password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (formErrors.confirmPassword)
              setFormErrors({ ...formErrors, confirmPassword: null });
          }}
          isPassword
          error={formErrors.confirmPassword}
          testID="signup-confirm-password-input"
        />

        <Button
          title="Create Account"
          onPress={handleSignup}
          loading={isLoading}
          style={styles.signupButton}
          testID="signup-submit-button"
        />
      </Card>

      {/* Login Navigation Link */}
      <View style={styles.footerRow}>
        <Text variant="bodySmall" color={colors.textSecondary}>
          Already have an account?{' '}
        </Text>
        <TouchableOpacity
          onPress={() => {
            dispatch(clearError());
            navigation.navigate('Login');
          }}
          activeOpacity={0.7}
        >
          <Text variant="bodySmall" color={colors.primary} weight="bold">
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    marginBottom: spacing.sm,
  },
  brandTitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  brandSubtitle: {
    maxWidth: 280,
  },
  taglineBadge: {
    marginTop: spacing.sm,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
  },
  signupButton: {
    marginTop: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});

export default SignupScreen;
