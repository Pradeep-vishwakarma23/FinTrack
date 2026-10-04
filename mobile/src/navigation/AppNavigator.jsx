import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import HomeScreen from '../screens/dashboard/HomeScreen.jsx';
import TransactionsScreen from '../screens/transactions/TransactionsScreen.jsx';
import InsightsScreen from '../screens/insights/InsightsScreen.jsx';
import GoalsScreen from '../screens/goals/GoalsScreen.jsx';
import ProfileScreen from '../screens/profile/ProfileScreen.jsx';
import ImportsScreen from '../screens/imports/ImportsScreen.jsx';
import StagedReviewScreen from '../screens/imports/StagedReviewScreen.jsx';
import ConnectedSourcesScreen from '../screens/notifications/ConnectedSourcesScreen.jsx';
import ReportsScreen from '../screens/reports/ReportsScreen.jsx';
import {
  CopilotBottomSheet,
  ExplainThisModal,
} from '../components/copilot/index.js';
import { colors, borderRadius } from '../theme/index.js';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Custom Tab Bar Icon Component (Vector Feather/Lucide Icons)
const TabIcon = ({ name, focused }) => {
  const getIconName = () => {
    switch (name) {
      case 'Home':
        return 'home';
      case 'Transactions':
        return 'credit-card';
      case 'Insights':
        return 'bar-chart-2';
      case 'Goals':
        return 'target';
      case 'Profile':
        return 'user';
      default:
        return 'circle';
    }
  };

  const iconColor = focused ? colors.primary : colors.textSecondary;

  return (
    <View style={[styles.iconContainer, focused && styles.focusedIconContainer]}>
      <Feather name={getIconName()} size={19} color={iconColor} />
    </View>
  );
};

// Bottom Tabs Navigator (Pure White Bar, Mint Active Pill, Emerald Icon)
const MainTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ tabBarLabel: 'Ledger' }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ tabBarLabel: 'Insights' }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{ tabBarLabel: 'Goals' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <View style={styles.navigatorContainer}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Imports" component={ImportsScreen} />
        <Stack.Screen name="StagedReview" component={StagedReviewScreen} />
        <Stack.Screen name="ConnectedSources" component={ConnectedSourcesScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
      </Stack.Navigator>

      {/* Global Mobile AI Financial Copilot Bottom Sheet */}
      <CopilotBottomSheet />

      {/* Global Explain Metric Modal */}
      <ExplainThisModal />
    </View>
  );
};

const styles = StyleSheet.create({
  navigatorContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    width: 36,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusedIconContainer: {
    backgroundColor: colors.mintBg,
  },
});

export default AppNavigator;
