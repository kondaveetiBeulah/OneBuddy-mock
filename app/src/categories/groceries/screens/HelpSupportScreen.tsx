import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';
import { useGroceryColors } from '../theme/colors';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
import { Header } from '../components/Header';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

type HelpSupportScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const FAQS = [
  {
    q: 'How fast is 1Buddy delivery?',
    a: 'We deliver your fresh groceries in 15 to 30 minutes from your nearest local fulfillment store.',
  },
  {
    q: 'What if I receive a damaged or missing item?',
    a: 'We offer an instant 100% replacement or refund within 2 hours of delivery. Just tap on Order Details and choose Report Issue.',
  },
  {
    q: 'What are the accepted payment methods?',
    a: 'We accept UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, Cash on Delivery, and online banking.',
  },
  {
    q: 'Is there a minimum order limit?',
    a: 'No minimum order value! Orders above ₹499 qualify for FREE delivery.',
  },
];

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ navigation }) => {
  const groceryColors = useGroceryColors();
  const isDark = isCategoryDark() || groceryColors.cardBackground === '#000000';
  const dynStyles = getStyles(isDark);
  return (
    <SafeAreaView style={dynStyles.container}>
      <Header title="Help & Support" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={dynStyles.scrollPadding}>
        <View style={dynStyles.contactCard}>
          <Text style={dynStyles.contactTitle}>Need Urgent Help?</Text>
          <Text style={dynStyles.contactSub}>
            Our customer care team is available 24/7 to assist you.
          </Text>

          <View style={dynStyles.contactRow}>
            <TouchableOpacity style={dynStyles.contactBtn}>
              <Ionicons name="call-outline" size={20} color={isDark ? '#000000' : colors.white} />
              <Text style={dynStyles.contactBtnText}>Call Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[dynStyles.contactBtn, { backgroundColor: isDark ? '#FFFFFF' : colors.secondary }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={isDark ? '#000000' : colors.white} />
              <Text style={dynStyles.contactBtnText}>Live Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={dynStyles.sectionTitle}>Frequently Asked Questions</Text>

        {FAQS.map((faq, idx) => (
          <View key={idx} style={dynStyles.faqCard}>
            <Text style={dynStyles.questionText}>Q: {faq.q}</Text>
            <Text style={dynStyles.answerText}>{faq.a}</Text>
          </View>
        ))}
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
  contactCard: {
    backgroundColor: isDark ? '#000000' : colors.primaryDark,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'transparent',
  },
  contactTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
  contactSub: {
    fontSize: typography.sizes.xs,
    color: isDark ? '#E5E7EB' : colors.primaryLight,
    marginVertical: spacing.xs,
  },
  contactRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? '#FFFFFF' : colors.primary,
    paddingVertical: spacing.sm + 2,
    borderRadius: spacing.borderRadius.md,
    gap: spacing.xs,
  },
  contactBtnText: {
    color: isDark ? '#000000' : colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    marginBottom: spacing.sm,
  },
  faqCard: {
    backgroundColor: isDark ? '#000000' : colors.white,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
  },
  questionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    marginBottom: 4,
  },
  answerText: {
    fontSize: typography.sizes.xs,
    color: isDark ? '#E5E7EB' : colors.textSecondary,
    lineHeight: 18,
  },
});
