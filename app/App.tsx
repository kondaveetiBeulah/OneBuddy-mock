import React from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider } from './src/firebase/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import { OtpAuthProvider } from './src/auth/OtpAuthContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { ServicePreferencesProvider } from './src/native/screens/ServicePreferences';
import RootNavigator from './src/navigation/RootNavigator';
import { brand, schemes } from './src/design/tokens';
import { initDynamicRefreshRate } from './src/utils/dynamicRefreshRate';

/**
 * React Navigation is the app shell now. The WebView, the generated HTML
 * document and the postMessage bridge are gone; every screen that used to be
 * opened by a message from the page is a typed route in RootNavigator.
 *
 * Provider order matters: SettingsProvider reads the Firebase session, and
 * ThemeProvider reads settings, so both sit above the navigator rather than
 * inside each host as they did before.
 */
function Shell() {
  const { scheme } = useAppTheme();
  return (
    <>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={schemes[scheme].bgDeep}
      />
      <RootNavigator />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts(Ionicons.font);

  React.useEffect(() => {
    initDynamicRefreshRate({ minRate: 60, maxRate: 120 });
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#EFF2E8', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={brand.gold} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <SettingsProvider>
            <ThemeProvider>
              <OtpAuthProvider>
                <ProfileProvider>
                  <ServicePreferencesProvider>
                    <Shell />
                  </ServicePreferencesProvider>
                </ProfileProvider>
              </OtpAuthProvider>
            </ThemeProvider>
          </SettingsProvider>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
