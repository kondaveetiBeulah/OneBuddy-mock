import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';
import { Header } from '../components/Header';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

type AboutScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="About 1Buddy" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.heroBox}>
          <View style={styles.logoCircle}>
            <Ionicons name="basket" size={54} color={colors.white} />
          </View>
          <Text style={styles.appName}>1Buddy Grocery Store</Text>
          <Text style={styles.appTagline}>
            Fresh groceries. Delivered to your door.
          </Text>
          <Text style={styles.appVersion}>Version 1.0.0 (Phase 1 Frontend)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardText}>
            1Buddy Grocery Store is built to deliver farm-fresh fruits, organic vegetables, daily dairy products, and household essentials directly to your doorstep in minutes.
          </Text>

          <Text style={styles.cardTitle}>Phase 1 Frontend Architecture</Text>
          <Text style={styles.cardText}>
            This application is constructed using React Native, Expo, TypeScript, Context API, and AsyncStorage. It features a fully decoupled service architecture designed for seamless Firebase / Node.js backend integration in Phase 2.
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
  heroBox: {
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  appTagline: {
    fontSize: typography.sizes.xs,
    color: colors.primaryLight,
    marginVertical: spacing.xs,
  },
  appVersion: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
});
