import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { brand, schemes } from '@/design/tokens';
import { useAppTheme } from '@/theme/ThemeContext';
import { useOtpAuth } from '@/auth/OtpAuthContext';
import { useAuth } from '@/firebase/context/AuthContext';

import SplashScreen from '@/screens/SplashScreen';
import AuthScreen from '@/screens/auth/authScreen';
import HomeScreen from '@/screens/HomeScreen';
import AppSettingsRoute from '@/screens/AppSettingsRoute';
import {
  AboutRoute,
  AddressesRoute,
  CareRoute,
  EditProfileRoute,
  FoodRoute,
  GroceriesRoute,
  HelpSupportRoute,
  NotificationsRoute,
  OrdersRoute,
  PaymentsRoute,
  RidesRoute,
  SecurityPrivacyRoute,
  ServicePreferencesRoute,
} from '@/screens/hostRoutes';

import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

/**
 * Bottom tabs.
 *
 * The document had four: Home, Explore, Orders, Account. Orders and Account
 * have real native screens; Explore never did — it was an in-document feed —
 * so it is left out rather than shipped as a dead tab.
 */
function Tabs() {
  const { scheme } = useAppTheme();
  const tokens = schemes[scheme];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.gold,
        tabBarInactiveTintColor: tokens.textDim,
        tabBarStyle: {
          backgroundColor: tokens.bgTint(0.96),
          borderTopColor: tokens.ink(0.06),
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home', tabBarIcon: () => <Text>🏠</Text> }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersRoute}
        options={{ title: 'Orders', tabBarIcon: () => <Text>📋</Text> }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AppSettingsRoute}
        options={{ title: 'Account', tabBarIcon: () => <Text>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { scheme } = useAppTheme();
  const tokens = schemes[scheme];
  const { token, hydrated } = useOtpAuth();
  const { user, initializing } = useAuth();
  const [hasLaunched, setHasLaunched] = useState(false);

  const isAuthenticated = Boolean(token || user);

  useEffect(() => {
    if (!isAuthenticated) {
      setHasLaunched(false);
    }
  }, [isAuthenticated]);

  const navTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme : DefaultTheme).colors,
      background: tokens.bgDeep,
      card: tokens.surface1,
      text: tokens.text,
      border: tokens.ink(0.08),
      primary: brand.gold,
    },
  };

  if (!hydrated || initializing) {
    return (
      <View style={[styles.boot, { backgroundColor: tokens.bgDeep }]}>
        <ActivityIndicator size="large" color={brand.gold} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            {!hasLaunched && (
              <Stack.Screen name="Splash">
                {(props) => (
                  <SplashScreen
                    {...props}
                    isAuthenticated={true}
                    onLaunchComplete={() => setHasLaunched(true)}
                  />
                )}
              </Stack.Screen>
            )}
            <Stack.Screen name="Tabs" component={Tabs} />
            {/* Category sub-apps */}
            <Stack.Group screenOptions={{ animation: 'none' }}>
              <Stack.Screen name="Food" component={FoodRoute} />
              <Stack.Screen name="Groceries" component={GroceriesRoute} />
              <Stack.Screen name="Rides" component={RidesRoute} />
              <Stack.Screen name="Care" component={CareRoute} />
            </Stack.Group>

            {/* Settings destinations — push transition (slide_from_right) */}
            <Stack.Group screenOptions={{ animation: 'slide_from_right' }}>
              <Stack.Screen name="AppSettings" component={AppSettingsRoute} />
              <Stack.Screen name="SecurityPrivacy" component={SecurityPrivacyRoute} />
              <Stack.Screen name="HelpSupport" component={HelpSupportRoute} />
              <Stack.Screen name="About" component={AboutRoute} />
              <Stack.Screen name="Payments" component={PaymentsRoute} />
              <Stack.Screen name="OrdersAndBookings" component={OrdersRoute} />
              <Stack.Screen name="Addresses" component={AddressesRoute} />
              <Stack.Screen name="Notifications" component={NotificationsRoute} />
              <Stack.Screen name="ServicePreferences" component={ServicePreferencesRoute} />
              <Stack.Screen name="EditProfile" component={EditProfileRoute} />
            </Stack.Group>
          </>
        ) : (
          <>
            <Stack.Screen name="Splash">
              {(props) => (
                <SplashScreen
                  {...props}
                  isAuthenticated={false}
                  onLaunchComplete={() => setHasLaunched(true)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
