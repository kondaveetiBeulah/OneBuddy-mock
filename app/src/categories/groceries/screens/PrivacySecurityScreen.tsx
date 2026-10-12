import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';
import { useGroceryColors } from '../theme/colors';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
import { Header } from '../components/Header';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

type PrivacySecurityScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const PrivacySecurityScreen: React.FC<PrivacySecurityScreenProps> = ({
  navigation,
}) => {
  const groceryColors = useGroceryColors();
  const isDark = isCategoryDark() || groceryColors.cardBackground === '#000000';
  const dynStyles = getStyles(isDark);
  return (
    <SafeAreaView style={dynStyles.container}>
      <Header title="Privacy & Security" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={dynStyles.scrollPadding}>
        <View style={dynStyles.card}>
          <Text style={dynStyles.title}>Data Protection Commitment</Text>
          <Text style={dynStyles.paragraph}>
            At 1Buddy Grocery Store, your privacy is our utmost priority. We use industry-standard encryption protocols to protect your personal details, saved addresses, and payment preferences.
          </Text>

          <Text style={dynStyles.title}>Location Access</Text>
          <Text style={dynStyles.paragraph}>
            We only access your device location while the app is in use to provide accurate 15-minute grocery delivery estimates and pinpoint local store availability in your area.
          </Text>

          <Text style={dynStyles.title}>Secure Payments</Text>
          <Text style={dynStyles.paragraph}>
            1Buddy never stores your full card numbers or CVV. All electronic transactions are securely processed through RBI-compliant payment gateways.
          </Text>
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
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: typography.sizes.sm,
    color: isDark ? '#E5E7EB' : colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
});
