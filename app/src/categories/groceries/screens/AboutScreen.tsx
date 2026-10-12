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
import { useGroceryColors } from '../theme/colors';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
import { Header } from '../components/Header';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

type AboutScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const groceryColors = useGroceryColors();
  const isDark = isCategoryDark() || groceryColors.cardBackground === '#000000';
  const dynStyles = getStyles(isDark);
  return (
    <SafeAreaView style={dynStyles.container}>
      <Header title="About 1Buddy" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={dynStyles.scrollPadding}>
        <View style={dynStyles.heroBox}>
          <View style={dynStyles.logoCircle}>
            <Ionicons name="basket" size={54} color={isDark ? '#000000' : colors.white} />
          </View>
          <Text style={dynStyles.appName}>1Buddy Grocery Store</Text>
          <Text style={dynStyles.appTagline}>
            Fresh groceries. Delivered to your door.
          </Text>
          <Text style={dynStyles.appVersion}>Version 1.0.0 (Phase 1 Frontend)</Text>
        </View>

        <View style={dynStyles.card}>
          <Text style={dynStyles.cardTitle}>Our Mission</Text>
          <Text style={dynStyles.cardText}>
            1Buddy Grocery Store is built to deliver farm-fresh fruits, organic vegetables, daily dairy products, and household essentials directly to your doorstep in minutes.
          </Text>

          <Text style={dynStyles.cardTitle}>Phase 1 Frontend Architecture</Text>
          <Text style={dynStyles.cardText}>
            This application is constructed using React Native, Expo, TypeScript, Context API, and AsyncStorage. It features a fully decoupled service architecture designed for seamless Firebase / Node.js backend integration in Phase 2.
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
  heroBox: {
    alignItems: 'center',
    backgroundColor: isDark ? '#000000' : colors.primaryDark,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'transparent',
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: isDark ? '#FFFFFF' : colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
  appTagline: {
    fontSize: typography.sizes.xs,
    color: isDark ? '#E5E7EB' : colors.primaryLight,
    marginVertical: spacing.xs,
  },
  appVersion: {
    fontSize: 10,
    color: isDark ? '#FFA726' : colors.secondary,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: isDark ? '#000000' : colors.white,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardText: {
    fontSize: typography.sizes.sm,
    color: isDark ? '#E5E7EB' : colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
});
