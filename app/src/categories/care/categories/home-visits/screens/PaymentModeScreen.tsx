import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BookingStepper, colors, Header, PrimaryButton, useColors } from '../components/UI';
import { useBooking } from '../context/BookingContext';

interface Props {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

type PayOption = 'online' | 'after_visit' | null;

export function PaymentModeScreen({ navigation }: Props) {
  const { selectedDoctor, choosePayment, confirmBooking } = useBooking();
  const tc = useColors();
  const [selected, setSelected] = useState<PayOption>(null);

  const fee = selectedDoctor?.fee ?? 0;
  const platformFee = 50;
  const totalAmount = fee + platformFee;

  const handleContinue = () => {
    if (!selected) return;

    if (selected === 'online') {
      // Go to the online payment screen (UPI/Card selection)
      navigation.navigate('Payment');
    } else {
      // Pay After Visit: confirm booking with Cash on Visit and go to Confirmation
      choosePayment('Cash on Visit');
      confirmBooking('Cash on Visit');
      navigation.navigate('Confirmation');
    }
  };

  const st = useMemo(() => createStyles(tc), [tc]);

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: tc.bg }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={st.container}>
        <Header title="Payment method" onBack={() => navigation.goBack()} />
        <BookingStepper currentStep={3} />

        <Text style={st.subtitle}>How would you like to pay for your home visit?</Text>

        {/* Bill Summary */}
        <View style={st.billCard}>
          <Text style={st.billTitle}>Bill Summary</Text>
          <View style={st.billRow}>
            <Text style={st.billLabel}>Consultation Fee</Text>
            <Text style={st.billValue}>₹{fee}</Text>
          </View>
          <View style={st.billRow}>
            <Text style={st.billLabel}>Platform Fee</Text>
            <Text style={st.billValue}>₹{platformFee}</Text>
          </View>
          <View style={st.billDivider} />
          <View style={st.billRow}>
            <Text style={st.billTotalLabel}>Total Amount</Text>
            <Text style={st.billTotalValue}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Payment Options */}
        <Text style={st.optionsHeading}>Choose payment option</Text>

        {/* Pay Online Option */}
        <Pressable
          style={[st.optionCard, selected === 'online' && st.optionCardSelected]}
          onPress={() => setSelected('online')}
        >
          <View style={[st.radioOuter, selected === 'online' && st.radioOuterSelected]}>
            {selected === 'online' && <View style={st.radioInner} />}
          </View>
          <View style={st.optionContent}>
            <View style={st.optionTitleRow}>
              <Ionicons name="card-outline" size={22} color={selected === 'online' ? colors.primary : tc.muted} />
              <Text style={[st.optionTitle, selected === 'online' && st.optionTitleSelected]}>Pay Online</Text>
            </View>
            <Text style={st.optionDesc}>
              Pay securely using UPI, Debit/Credit Card, or Net Banking. Instant confirmation.
            </Text>
            <View style={st.badgeRow}>
              <View style={[st.badge, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="shield-checkmark-outline" size={12} color="#059669" />
                <Text style={[st.badgeText, { color: '#059669' }]}>Secure</Text>
              </View>
              <View style={[st.badge, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="flash-outline" size={12} color="#2563EB" />
                <Text style={[st.badgeText, { color: '#2563EB' }]}>Instant</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Pay After Visit Option */}
        <Pressable
          style={[st.optionCard, selected === 'after_visit' && st.optionCardSelected]}
          onPress={() => setSelected('after_visit')}
        >
          <View style={[st.radioOuter, selected === 'after_visit' && st.radioOuterSelected]}>
            {selected === 'after_visit' && <View style={st.radioInner} />}
          </View>
          <View style={st.optionContent}>
            <View style={st.optionTitleRow}>
              <Ionicons name="time-outline" size={22} color={selected === 'after_visit' ? '#EA580C' : tc.muted} />
              <Text style={[st.optionTitle, selected === 'after_visit' && { color: '#EA580C' }]}>Pay After Visit</Text>
            </View>
            <Text style={st.optionDesc}>
              Pay the doctor/nurse directly after the home visit is completed. Cash or UPI accepted on-site.
            </Text>
            <View style={st.badgeRow}>
              <View style={[st.badge, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="cash-outline" size={12} color="#EA580C" />
                <Text style={[st.badgeText, { color: '#EA580C' }]}>Cash/UPI</Text>
              </View>
              <View style={[st.badge, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="alert-circle-outline" size={12} color="#D97706" />
                <Text style={[st.badgeText, { color: '#D97706' }]}>Unpaid until visit</Text>
              </View>
            </View>
          </View>
        </Pressable>

        <View style={{ marginTop: 24 }}>
          <PrimaryButton
            title={selected === 'after_visit' ? 'Confirm Booking (Pay Later)' : 'Continue to Payment'}
            onPress={handleContinue}
            disabled={!selected}
          />
        </View>

        {selected === 'after_visit' && (
          <Text style={st.noteText}>
            💡 Note: Your booking will be confirmed but marked as <Text style={{ fontWeight: '800', color: '#EA580C' }}>Unpaid</Text>. 
            Please ensure payment is made to the professional during or after the visit.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (tc: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    safe: { flex: 1 },
    container: { padding: 20, paddingBottom: 40 },
    subtitle: {
      color: tc.muted,
      fontSize: 14,
      marginBottom: 18,
      lineHeight: 20,
    },

    // Bill Summary Card
    billCard: {
      backgroundColor: tc.surface,
      borderRadius: 16,
      padding: 18,
      marginBottom: 22,
      borderWidth: 1,
      borderColor: tc.border,
    },
    billTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: tc.ink,
      marginBottom: 14,
    },
    billRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    billLabel: {
      fontSize: 13,
      color: tc.muted,
      fontWeight: '500',
    },
    billValue: {
      fontSize: 13,
      color: tc.ink,
      fontWeight: '600',
    },
    billDivider: {
      height: 1,
      backgroundColor: tc.border,
      marginVertical: 10,
    },
    billTotalLabel: {
      fontSize: 15,
      color: tc.ink,
      fontWeight: '800',
    },
    billTotalValue: {
      fontSize: 17,
      color: colors.primary,
      fontWeight: '800',
    },

    // Options
    optionsHeading: {
      fontSize: 15,
      fontWeight: '800',
      color: tc.ink,
      marginBottom: 14,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: tc.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1.5,
      borderColor: tc.border,
    },
    optionCardSelected: {
      borderColor: colors.primary,
      backgroundColor: tc.isDark ? '#1A2E14' : '#F0FBE9',
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: tc.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      marginRight: 12,
    },
    radioOuterSelected: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    optionContent: {
      flex: 1,
    },
    optionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: tc.ink,
    },
    optionTitleSelected: {
      color: colors.primary,
    },
    optionDesc: {
      fontSize: 12.5,
      color: tc.muted,
      lineHeight: 18,
      marginBottom: 10,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },

    noteText: {
      marginTop: 14,
      fontSize: 12.5,
      color: tc.muted,
      lineHeight: 19,
      textAlign: 'center',
      paddingHorizontal: 8,
    },
  });
