import React, { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  StyleSheet,
  View,
  StatusBar,
  Text,
  ActivityIndicator,
  InteractionManager,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  useNavigationContainerRef,
  NavigationIndependentTree,
} from '@react-navigation/native';
import { useAppTheme } from '@/theme/ThemeContext';
import { applyCategoryTheme } from '@/theme/categoryThemeBridge';
import { UserProvider } from '../categories/groceries/context/UserContext';
import { CartProvider } from '../categories/groceries/context/CartContext';
import { WishlistProvider } from '../categories/groceries/context/WishlistContext';
import { GroceriesExitContext } from '../categories/groceries/context/GroceriesExitContext';
import { RootNavigator } from '../categories/groceries/navigation/RootNavigator';
import { colors } from '../categories/groceries/theme';
import { GroceryDeliveryLogo } from '../categories/groceries/components/GroceryDeliveryLogo';

interface GroceriesHostProps {
  visible: boolean;
  onClose: () => void;
}

function GroceriesLoadingScreen({ isDark }: { isDark: boolean }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.loadingContainer,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: isDark ? '#121214' : colors.white,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: '#FFFFFF' },
        ]}
      >
        <GroceryDeliveryLogo size={72} />
      </View>
      <Text style={[styles.loadingTitle, isDark && { color: '#F1F1EC' }]}>
        One<Text style={{ color: '#4FA81A' }}>Buddy</Text> Groceries
      </Text>
      <Text style={[styles.loadingSub, isDark && { color: '#9BA08F' }]}>
        Fetching fresh groceries for you...
      </Text>
      <ActivityIndicator size="small" color="#4FA81A" style={styles.loadingIndicator} />
    </View>
  );
}

export default function GroceriesHost({
  visible,
  onClose,
}: GroceriesHostProps): React.JSX.Element | null {
  const { scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    applyCategoryTheme(scheme);
  }, [scheme]);

  // Synchronously apply theme before rendering screens
  applyCategoryTheme(scheme);

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme : DefaultTheme).colors,
        background: isDark ? '#121214' : colors.background,
        card: isDark ? '#1D1E22' : colors.white,
        text: isDark ? '#F1F1EC' : colors.textPrimary,
        border: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.borderLight,
        primary: colors.primary,
      },
    }),
    [isDark]
  );

  useEffect(() => {
    if (!visible) {
      setIsReady(false);
      return;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        setIsReady(true);
      }, 100);
    });

    const fallbackTimer = setTimeout(() => setIsReady(true), 350);

    return () => {
      task.cancel();
      clearTimeout(fallbackTimer);
    };
  }, [visible]);

  // Handle the Android hardware back button
  useEffect(() => {
    if (!visible) return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (navigationRef.isReady() && navigationRef.canGoBack()) {
          navigationRef.goBack();
          return true; // consumed
        }
        onClose();
        return true; // consumed
      },
    );

    return () => subscription.remove();
  }, [visible, navigationRef, onClose]);

  if (!visible) {
    return null;
  }

  return (
    <View
      key={scheme}
      style={[
        styles.container,
        { backgroundColor: isDark ? '#121214' : colors.background },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#121214' : colors.white}
      />
      <SafeAreaProvider>
        {!isReady ? (
          <GroceriesLoadingScreen isDark={isDark} />
        ) : (
          <UserProvider>
            <CartProvider>
              <WishlistProvider>
                <GroceriesExitContext.Provider value={{ onClose }}>
                  <NavigationIndependentTree>
                    <NavigationContainer
                      ref={navigationRef}
                      theme={navigationTheme}
                    >
                      <RootNavigator />
                    </NavigationContainer>
                  </NavigationIndependentTree>
                </GroceriesExitContext.Provider>
              </WishlistProvider>
            </CartProvider>
          </UserProvider>
        )}
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: 8,
  },
});
