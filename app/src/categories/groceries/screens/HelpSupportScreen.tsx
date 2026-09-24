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
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Help & Support" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need Urgent Help?</Text>
          <Text style={styles.contactSub}>
            Our customer care team is available 24/7 to assist you.
          </Text>

          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactBtn}>
              <Ionicons name="call-outline" size={20} color={colors.white} />
              <Text style={styles.contactBtnText}>Call Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: colors.secondary }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.white} />
              <Text style={styles.contactBtnText}>Live Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        {FAQS.map((faq, idx) => (
          <View key={idx} style={styles.faqCard}>
            <Text style={styles.questionText}>Q: {faq.q}</Text>
            <Text style={styles.answerText}>{faq.a}</Text>
          </View>
        ))}
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
  contactCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  contactTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  contactSub: {
    fontSize: typography.sizes.xs,
    color: colors.primaryLight,
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
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    borderRadius: spacing.borderRadius.md,
    gap: spacing.xs,
  },
  contactBtnText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  questionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  answerText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
