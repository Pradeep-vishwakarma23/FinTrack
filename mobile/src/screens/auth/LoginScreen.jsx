import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
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
import { validateLoginForm } from '../../utils/validators.js';
import { loginUser, clearError, setApiUrl } from '../../store/slices/authSlice.js';
import { getApiBaseUrl } from '../../services/api.js';

export const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, error, apiBaseUrl } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [showServerModal, setShowServerModal] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(apiBaseUrl || getApiBaseUrl());

  const handleLogin = async () => {
    dispatch(clearError());
    const validation = validateLoginForm({ email, password });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    dispatch(loginUser({ email, password }));
  };

  const handleQuickFillDemo = () => {
    setEmail('test@example.com');
    setPassword('password123');
    setFormErrors({});
    dispatch(clearError());
  };

  const handleSaveServerUrl = () => {
    if (customServerUrl && customServerUrl.trim()) {
      dispatch(setApiUrl(customServerUrl.trim()));
    }
    setShowServerModal(false);
  };

  return (
    <Container scrollable contentContainerStyle={styles.container}>
      {/* Top Branding */}
      <View style={styles.brandHeader}>
        <FinTrackLogo variant="full" size="lg" isDark={false} style={styles.logo} />
        <Text variant="caption" color={colors.textSecondary} align="center" style={styles.brandSubtitle}>
          AI-Powered Personal Finance Intelligence System
        </Text>
        <View style={styles.taglineBadge}>
          <Badge label="AUTOMATIC DETECTION & ANALYTICS" variant="primary" size="sm" />
        </View>
      </View>

      {/* Main Login Card */}
      <Card style={styles.card}>
        <Text variant="title" style={styles.cardTitle}>
          Welcome Back
        </Text>
        <Text variant="bodySmall" color={colors.textSecondary} style={styles.cardSubtitle}>
          Sign in to access your financial intelligence ledger
        </Text>

        {error ? (
          <ErrorBanner
            message={error}
            onDismiss={() => dispatch(clearError())}
          />
        ) : null}

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
          testID="login-email-input"
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (formErrors.password) setFormErrors({ ...formErrors, password: null });
          }}
          isPassword
          error={formErrors.password}
          testID="login-password-input"
        />

        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={isLoading}
          style={styles.signInButton}
          testID="login-submit-button"
        />

        {/* Demo Account Quick-Fill */}
        <TouchableOpacity
          style={styles.demoFillButton}
          onPress={handleQuickFillDemo}
          activeOpacity={0.7}
        >
          <Text variant="caption" color={colors.secondary} weight="semiBold">
            ⚡ Quick-fill Demo Account (test@example.com)
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Signup Navigation Link */}
      <View style={styles.footerRow}>
        <Text variant="bodySmall" color={colors.textSecondary}>
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity
          onPress={() => {
            dispatch(clearError());
            navigation.navigate('Signup');
          }}
          activeOpacity={0.7}
        >
          <Text variant="bodySmall" color={colors.primary} weight="bold">
            Create Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Server Endpoint Settings Toggle */}
      <TouchableOpacity
        style={styles.serverSettingsLink}
        onPress={() => setShowServerModal(true)}
        activeOpacity={0.7}
      >
        <Text variant="caption" color={colors.textMuted}>
          Server: {apiBaseUrl || getApiBaseUrl()} ⚙️
        </Text>
      </TouchableOpacity>

      {/* Server Config Modal */}
      <Modal
        visible={showServerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowServerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Text variant="title" style={styles.modalTitle}>
              Backend API Endpoint
            </Text>
            <Text variant="caption" color={colors.textSecondary} style={styles.modalSubtitle}>
              Configure the host URL for Android emulator (10.0.2.2:5000), iOS simulator (localhost:5000), or physical device.
            </Text>

            <Input
              label="API Base URL"
              value={customServerUrl}
              onChangeText={setCustomServerUrl}
              placeholder="http://10.0.2.2:5000/api"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtonsRow}>
              <Button
                title="Cancel"
                variant="secondary"
                size="sm"
                onPress={() => setShowServerModal(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Save & Apply"
                size="sm"
                onPress={handleSaveServerUrl}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
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
  brandSubtitle: {
    marginTop: spacing.xs,
    maxWidth: 280,
  },
  taglineBadge: {
    marginTop: spacing.md,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
  },
  cardTitle: {
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    marginBottom: spacing.lg,
  },
  signInButton: {
    marginTop: spacing.sm,
  },
  demoFillButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  serverSettingsLink: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    padding: spacing.xl,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
  },
  modalTitle: {
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    marginBottom: spacing.lg,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
});

export default LoginScreen;
