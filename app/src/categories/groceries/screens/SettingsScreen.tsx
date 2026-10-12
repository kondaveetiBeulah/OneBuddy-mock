import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';
import { Header } from '../components/Header';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';
import { useAppTheme } from '@/theme/ThemeContext';
import { useSettings } from '@/context/SettingsContext';

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { scheme } = useAppTheme();
  const { setTheme } = useSettings();
  const isDark = scheme === 'dark';
  const [notifications, setNotifications] = useState(true);
  const [promotions, setPromotions] = useState(true);
  const dynStyles = getStyles(isDark);

  return (
    <SafeAreaView style={dynStyles.container}>
      <Header title="Settings" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={dynStyles.scrollPadding}>
        <View style={dynStyles.card}>
          <View style={dynStyles.row}>
            <Text style={dynStyles.label}>Push Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ true: isDark ? '#5FA300' : colors.primary }}
            />
          </View>
          <View style={dynStyles.row}>
            <Text style={dynStyles.label}>Promotions & Offers</Text>
            <Switch
              value={promotions}
              onValueChange={setPromotions}
              trackColor={{ true: isDark ? '#5FA300' : colors.primary }}
            />
          </View>
          <View style={dynStyles.row}>
            <Text style={dynStyles.label}>Dark Mode (Preview)</Text>
            <Switch
              value={isDark}
              onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
              trackColor={{ true: isDark ? '#5FA300' : colors.primary }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000000' : colors.background,
  },
  scrollPadding: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: isDark ? '#000000' : colors.white,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.12)' : colors.borderLight,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
  },
});
