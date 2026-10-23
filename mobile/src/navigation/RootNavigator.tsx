import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LoginScreen } from '../screens/LoginScreen';
import { OtpScreen } from '../screens/OtpScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LoansScreen } from '../screens/LoansScreen';
import { AddLoanScreen } from '../screens/AddLoanScreen';
import { LoanDetailsScreen } from '../screens/LoanDetailsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { OverviewScreen } from '../screens/OverviewScreen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import type { AppStackParamList, AuthStackParamList, MainTabParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    primary: colors.navy,
    card: colors.white,
    text: colors.text,
    border: colors.line,
  },
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={[styles.icon, focused && styles.iconOn]}>
      <Text style={[styles.iconText, focused && styles.iconTextOn]}>{label}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerTitleStyle: { fontWeight: '800', color: colors.navy },
        headerStyle: { backgroundColor: colors.background },
        tabBarStyle: { height: 68, paddingBottom: 8, paddingTop: 8 },
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
      }}>

      <Tabs.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          title: 'MiniLedger',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="Hm" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="Loans"
        component={LoansScreen}
        options={{
          title: 'All loans',
          tabBarIcon: ({ focused }) => <TabIcon label="Ln" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="AddLoan"
        component={AddLoanScreen}
        options={{
          title: 'Add loan',
          tabBarIcon: ({ focused }) => <TabIcon label="+" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Me" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="Overview"
        component={OverviewScreen}
        options={{
          title: 'Overview',
        }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { token, bootstrapping } = useAuth();

  if (bootstrapping) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.navy} />
        <Text style={styles.bootText}>MiniLedger</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {token ? (
        <AppStack.Navigator>
          <AppStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <AppStack.Screen name="LoanDetails" component={LoanDetailsScreen} options={{ title: 'Loan details' }} />
          <AppStack.Screen name="AddLoan" component={AddLoanScreen} options={{ title: 'Add loan' }} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator>
          <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <AuthStack.Screen name="Otp" component={OtpScreen} options={{ title: 'Verify OTP' }} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  bootText: { marginTop: 12, color: colors.navy, fontWeight: '800', fontSize: 20 },
  icon: {
    minWidth: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.line,
  },
  iconOn: { backgroundColor: colors.navy },
  iconText: { fontSize: 11, fontWeight: '800', color: colors.muted },
  iconTextOn: { color: colors.white },
});
