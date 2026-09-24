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

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Settings" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Push Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Promotions & Offers</Text>
            <Switch
              value={promotions}
              onValueChange={setPromotions}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dark Mode (Preview)</Text>
            <Switch
              value={isDark}
              onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollPadding: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
});
