import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { restoreSession } from '../store/slices/authSlice.js';
import { ingestNotificationEvent } from '../store/slices/notificationSlice.js';
import notificationListenerService from '../services/notificationListenerService.js';
import AuthNavigator from './AuthNavigator.jsx';
import AppNavigator from './AppNavigator.jsx';
import SplashScreen from '../screens/auth/SplashScreen.jsx';
import { colors } from '../theme/index.js';

const FinTrackNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: '#FFFFFF',
    text: colors.textPrimary,
    border: colors.surfaceBorder,
    notification: colors.primary,
  },
};

export const RootNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isRestoringSession } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  // Phase 5: Android Notification Ingestion Service Lifecycle
  useEffect(() => {
    if (isAuthenticated) {
      notificationListenerService.startListening((normalizedEvent) => {
        dispatch(ingestNotificationEvent(normalizedEvent));
      });
    } else {
      notificationListenerService.stopListening();
    }

    return () => {
      notificationListenerService.stopListening();
    };
  }, [isAuthenticated, dispatch]);

  if (isRestoringSession) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={FinTrackNavigationTheme}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
