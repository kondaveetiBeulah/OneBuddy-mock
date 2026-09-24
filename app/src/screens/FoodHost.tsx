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
import { FoodDataProvider } from '../categories/food/context/FoodDataContext';
import { CartProvider } from '../categories/food/context/CartContext';
import { FilterProvider } from '../categories/food/context/FilterContext';
import { FoodExitContext } from '../categories/food/context/FoodExitContext';
import { RootNavigator } from '../categories/food/navigation/RootNavigator';
import { FoodDeliveryIcon } from '../categories/food/components/common/FoodDeliveryIcon';

interface FoodHostProps {
  visible: boolean;
  onClose: () => void;
}

function FoodLoadingScreen({ isDark }: { isDark: boolean }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.loadingContainer,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: isDark ? '#121214' : '#FFFFFF',
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: '#FFFFFF' },
        ]}
      >
        <FoodDeliveryIcon width={72} height={72} />
      </View>
      <Text style={[styles.loadingTitle, isDark && { color: '#F1F1EC' }]}>
        One<Text style={{ color: '#65A30D' }}>Buddy</Text> Food Express
      </Text>
      <Text style={[styles.loadingSub, isDark && { color: '#9BA08F' }]}>
        Loading fresh dishes and menus...
      </Text>
      <ActivityIndicator size="small" color="#65A30D" style={styles.loadingIndicator} />
    </View>
  );
}

export default function FoodHost({
  visible,
  onClose,
}: FoodHostProps): React.JSX.Element | null {
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
        background: isDark ? '#121214' : '#F3F4F6',
        card: isDark ? '#1D1E22' : '#FFFFFF',
        text: isDark ? '#F1F1EC' : '#111827',
        border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
        primary: '#65A30D',
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
        { backgroundColor: isDark ? '#121214' : '#F3F4F6' },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#121214' : '#FFFFFF'}
      />
      <SafeAreaProvider>
        {!isReady ? (
          <FoodLoadingScreen isDark={isDark} />
        ) : (
          <FoodDataProvider>
            <CartProvider>
              <FilterProvider>
                <FoodExitContext.Provider value={{ onClose }}>
                  <NavigationIndependentTree>
                    <NavigationContainer
                      ref={navigationRef}
                      theme={navigationTheme}
                    >
                      <RootNavigator />
                    </NavigationContainer>
                  </NavigationIndependentTree>
                </FoodExitContext.Provider>
              </FilterProvider>
            </CartProvider>
          </FoodDataProvider>
        )}
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
