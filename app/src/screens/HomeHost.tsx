import React, { useEffect, useMemo } from 'react';
import {
  BackHandler,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  useNavigationContainerRef,
  NavigationIndependentTree,
} from '@react-navigation/native';
import { useAppTheme } from '@/theme/ThemeContext';
import { applyCategoryTheme } from '@/theme/categoryThemeBridge';
import { BookingProvider } from '../categories/home/context/BookingContext';
import { HomeExitContext } from '../categories/home/context/HomeExitContext';
import { AppNavigator } from '../categories/home/navigation/AppNavigator';
import { lightColors, darkColors } from '../categories/home/theme';

interface HomeHostProps {
  visible: boolean;
  onClose: () => void;
}

export default function HomeHost({
  visible,
  onClose,
}: HomeHostProps): React.JSX.Element | null {
  const { scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    applyCategoryTheme(scheme);
  }, [scheme]);

  const activeTheme = isDark ? darkColors : lightColors;

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme : DefaultTheme).colors,
        background: activeTheme.background,
        card: activeTheme.surface,
        text: activeTheme.textPrimary,
        border: activeTheme.border,
        primary: activeTheme.primary,
      },
    }),
    [isDark, activeTheme]
  );

  // Handle hardware back button on Android
  useEffect(() => {
    if (!visible) return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (navigationRef.isReady() && navigationRef.canGoBack()) {
          navigationRef.goBack();
          return true;
        }
        onClose();
        return true;
      }
    );

    return () => subscription.remove();
  }, [visible, navigationRef, onClose]);

  if (!visible) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#121214' : activeTheme.background },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#121214' : activeTheme.surface}
      />
      <BookingProvider>
        <HomeExitContext.Provider value={{ onClose }}>
          <NavigationIndependentTree>
            <NavigationContainer
              ref={navigationRef}
              theme={navigationTheme}
            >
              <AppNavigator />
            </NavigationContainer>
          </NavigationIndependentTree>
        </HomeExitContext.Provider>
      </BookingProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
