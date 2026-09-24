import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';
import { Header } from '../components/Header';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

type PrivacySecurityScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const PrivacySecurityScreen: React.FC<PrivacySecurityScreenProps> = ({
  navigation,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Privacy & Security" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.card}>
          <Text style={styles.title}>Data Protection Commitment</Text>
          <Text style={styles.paragraph}>
            At 1Buddy Grocery Store, your privacy is our utmost priority. We use industry-standard encryption protocols to protect your personal details, saved addresses, and payment preferences.
          </Text>

          <Text style={styles.title}>Location Access</Text>
          <Text style={styles.paragraph}>
            We only access your device location while the app is in use to provide accurate 15-minute grocery delivery estimates and pinpoint local store availability in your area.
          </Text>

          <Text style={styles.title}>Secure Payments</Text>
          <Text style={styles.paragraph}>
            1Buddy never stores your full card numbers or CVV. All electronic transactions are securely processed through RBI-compliant payment gateways.
          </Text>
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
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
});
