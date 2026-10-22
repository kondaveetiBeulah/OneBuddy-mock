import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../theme';
import { useGroceryColors } from '../theme/colors';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
import { Header } from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

export const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const groceryColors = useGroceryColors();
  const isDark = isCategoryDark() || groceryColors.cardBackground === '#000000';
  const dynStyles = getStyles(isDark);

  return (
    <SafeAreaView style={dynStyles.container}>
      <Header title="My Orders" showBack onBack={() => navigation.goBack()} />

      <View style={dynStyles.emptyContainer}>
        <Text style={dynStyles.emptyTitle}>No orders found</Text>
        <Text style={dynStyles.emptySubtitle}>
          When you order fresh groceries from 1Buddy, your orders will appear here.
        </Text>
        <TouchableOpacity
          style={dynStyles.shopBtn}
          onPress={() => navigation.navigate('Main')}
          activeOpacity={0.8}
        >
          <Text style={dynStyles.shopBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000000' : colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: isDark ? '#9CA3AF' : colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  shopBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

