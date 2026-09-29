import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  InteractionManager,
  StatusBar,
  StyleSheet,
  Text,
  View,
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
import { BookingProvider } from '../categories/home/context/BookingContext';
import { HomeExitContext } from '../categories/home/context/HomeExitContext';
import { AppNavigator } from '../categories/home/navigation/AppNavigator';
import { AppLogo } from '../categories/home/components/common/AppLogo';
import { lightColors, darkColors } from '../categories/home/theme';

interface HomeHostProps {
  visible: boolean;
  onClose: () => void;
}

function HomeLoadingScreen({ isDark }: { isDark: boolean }) {
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
      <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1D1E22' : '#F4F7F4' }]}>
        <AppLogo size={52} />
      </View>
      <Text style={[styles.loadingTitle, isDark && { color: '#F1F1EC' }]}>
        One<Text style={{ color: '#5CB811' }}>Buddy</Text> Home
      </Text>
      <Text style={[styles.loadingSub, isDark && { color: '#9BA08F' }]}>
        Finding expert technicians and home services...
      </Text>
      <ActivityIndicator size="small" color="#5CB811" style={styles.loadingIndicator} />
    </View>
  );
}

export default function HomeHost({
  visible,
  onClose,
}: HomeHostProps): React.JSX.Element | null {
  const { scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const [isReady, setIsReady] = useState(false);
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
      key={scheme}
      style={[
        styles.container,
        { backgroundColor: isDark ? '#121214' : activeTheme.background },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#121214' : '#FFFFFF'}
      />
      <SafeAreaProvider>
        {!isReady ? (
          <HomeLoadingScreen isDark={isDark} />
        ) : (
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
        )}
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#F4F7F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
