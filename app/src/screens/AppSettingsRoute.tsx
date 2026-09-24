import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAppTheme } from '@/theme/ThemeContext';
import { SettingsScreen } from '@/screens/SettingsScreen';

/**
 * Replaces `AppSettingsHost`.
 *
 * The host wrapped `SettingsScreen` in its own `ToastProvider` /
 * `SettingsProvider` / `ThemeProvider` because it opened as a modal over a
 * WebView that owned the real state, and reported every change back down
 * through `createApplyAppSettingsScript`.
 *
 * Those providers now live once at the app root, so this is a plain screen:
 * a theme change made here reaches the dashboard directly, with no seed and
 * no mirror.
 */
export default function AppSettingsRoute() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();

  const dismiss = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      (navigation as any).navigate('HomeTab');
    }
  };

  return (
    <View style={[styles.surface, { backgroundColor: colors.sheetBg }]}>
      <SettingsScreen onBack={dismiss} onClose={dismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { flex: 1 },
});
