import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Headphones,
  PhoneCall,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Mail,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useHomeTheme, COLORS, RADII, SPACING, SHADOWS } from '../theme';

interface HelpSupportScreenProps {
  navigation: any;
  onGoProfile?: () => void;
}

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({
  navigation,
  onGoProfile,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useHomeTheme();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I reschedule or cancel my service booking?',
      a: 'You can reschedule or cancel your scheduled booking up to 2 hours prior to the slot time directly from the My Bookings screen with zero cancellation fees.',
    },
    {
      q: 'Are all OneBuddy service professionals verified?',
      a: 'Yes, 100% of our technicians undergo rigorous background verification, police clearance checks, skill certification, and identity checks before onboarding.',
    },
    {
      q: 'How does payment and billing work?',
      a: 'You can pay securely online via Google Pay, PhonePe, Paytm, and UPI, or opt for Pay on Visit to pay the technician after work is finished.',
    },
    {
      q: 'What should I do if the technician is delayed?',
      a: 'You can track the technician live on the map. If there is an unexpected traffic delay, you can call them directly through the app or reach our 24x7 support line.',
    },
  ];

  const handleCallSupport = () => {
    Linking.openURL('tel:+918001234567');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@onebuddy.in');
  };

  const handleBack = () => {
    if (onGoProfile) {
      onGoProfile();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { initialTab: 'Profile' });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <Header
        title="Help & Support"
        subtitle="24x7 customer assistance & FAQs"
        showBack={true}
        onBack={handleBack}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
      >
        {/* Support Channels Card */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Contact Support</Text>
          
          <TouchableOpacity
            style={styles.callFullCard}
            activeOpacity={0.8}
            onPress={handleCallSupport}
          >
            <View style={[styles.channelIcon, { backgroundColor: COLORS.primaryLight }]}>
              <PhoneCall size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.channelTitle}>Toll Free Customer Helpline</Text>
              <Text style={styles.channelSub}>1800-123-4567 • Available 24x7</Text>
            </View>
            <View style={styles.callPill}>
              <Text style={styles.callPillText}>Call Now</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emailCard}
            activeOpacity={0.8}
            onPress={handleEmailSupport}
          >
            <View style={styles.emailLeft}>
              <View style={[styles.channelIconSmall, { backgroundColor: COLORS.secondaryLight }]}>
                <Mail size={18} color={COLORS.secondary} />
              </View>
              <View style={{ marginLeft: SPACING.md }}>
                <Text style={styles.emailTitle}>Email Support</Text>
                <Text style={styles.emailSub}>support@onebuddy.in</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* FAQs Accordion */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <Card
                key={idx}
                style={styles.faqCard}
                variant="outlined"
                onPress={() => setExpandedFaq(isExpanded ? null : idx)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  {isExpanded ? (
                    <ChevronDown size={18} color={COLORS.primary} />
                  ) : (
                    <ChevronRight size={18} color={COLORS.textMuted} />
                  )}
                </View>
                {isExpanded && (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{faq.a}</Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: SPACING.md,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  callFullCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  channelIcon: {
    width: 44,
    height: 44,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelIconSmall: {
    width: 36,
    height: 36,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  channelSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  callPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
  },
  callPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  emailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emailSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  faqCard: {
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
    lineHeight: 18,
  },
  faqBody: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  faqAnswer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
});
