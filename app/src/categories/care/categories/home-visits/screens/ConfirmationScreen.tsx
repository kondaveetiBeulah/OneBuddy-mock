import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, useColors, Header, PrimaryButton } from '../components/UI';
import { useBooking } from '../context/BookingContext';

interface Props {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
    reset: (config: any) => void;
  };
}

export function ConfirmationScreen({ navigation }: Props) {
  const { booking, reset } = useBooking();
  const tc = useColors();
  if (!booking) return null;

  const isPaid = booking.paymentMode !== 'Cash on Visit';
  const paymentStatus = isPaid ? 'Paid' : 'Unpaid (Pay on Visit)';

  const date = new Date(`${booking.date}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const sendWhatsApp = () => {
    const rawPhone = booking.patient.phone.replace(/[^0-9]/g, '');
    const targetPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const message = encodeURIComponent(
      `🏥 *ONEBUDDY HOME VISIT BOOKING*\n` +
      `📌 Booking ID: ${booking.id}\n` +
      `👨‍⚕️ Doctor / Nurse: ${booking.doctor.name} (${booking.doctor.specialty})\n` +
      `📅 Date & Slot: ${date}, ${booking.slot.label}\n` +
      `👤 Patient: ${booking.patient.fullName}\n` +
      `📍 Visit Address: ${booking.patient.address}\n` +
      `💳 Total Amount: ₹${booking.total} (${paymentStatus})\n` +
      `📞 Professional Contact: ${booking.doctor.phone}`
    );
    Linking.openURL(`whatsapp://send?phone=${targetPhone}&text=${message}`).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=${targetPhone}&text=${message}`);
    });
  };

  const isNurse = booking.doctor.name.startsWith('Nurse') || booking.doctor.issueIds?.includes('nursing');
  const professionalTitle = isNurse ? 'nurse' : 'doctor';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.bg }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="Booking confirmed" onBack={() => { reset(); navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); }} />
        <View style={styles.success}>
          <View style={styles.check}>
            <Ionicons name="checkmark" size={35} color={colors.white} />
          </View>
          <Text style={[styles.heading, { color: tc.ink }]}>Booking confirmed</Text>
          <Text style={[styles.sub, { color: tc.muted }]}>Your {professionalTitle} is scheduled for your home visit.</Text>
        </View>

        <View style={[styles.receipt, { backgroundColor: tc.surface, borderColor: tc.border }]}>
          <View style={styles.receiptTop}>
            <Text style={[styles.receiptLabel, { color: tc.muted }]}>BOOKING ID</Text>
            <Text style={styles.bookingId}>{booking.id}</Text>
          </View>

          <View style={styles.doctorRow}>
            <View style={[styles.avatar, { backgroundColor: tc.soft, borderColor: tc.border }]}>
              {booking.doctor.avatar ? (
                <Image source={{ uri: booking.doctor.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.initials}>{booking.doctor.initials}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.doctor, { color: tc.ink }]}>{booking.doctor.name}</Text>
              <Text style={[styles.muted, { color: tc.muted }]}>{booking.doctor.specialty}</Text>
            </View>
          </View>

          <View style={styles.detail}>
            <Ionicons name="calendar-outline" size={19} color={colors.green} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: tc.muted }]}>DATE & TIME</Text>
              <Text style={[styles.detailValue, { color: tc.ink }]}>
                {date}, {booking.slot.label}
              </Text>
            </View>
          </View>

          <View style={styles.detail}>
            <Ionicons name="location-outline" size={19} color={colors.green} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: tc.muted }]}>VISIT ADDRESS</Text>
              <Text style={[styles.detailValue, { color: tc.ink }]}>{booking.patient.address}</Text>
            </View>
          </View>

          <View style={styles.detail}>
            <Ionicons name="cash-outline" size={19} color={colors.green} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: tc.muted }]}>AMOUNT</Text>
              <View style={styles.statusRow}>
                <Text style={[styles.detailValue, { color: tc.ink }]}>
                  ₹{booking.total} · <Text style={{ color: isPaid ? '#16A34A' : '#EA580C', fontWeight: '800' }}>{paymentStatus}</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        <PrimaryButton title="Send confirmation on WhatsApp" onPress={sendWhatsApp} />
        <View style={styles.gap} />
        <PrimaryButton
          title="Return to home"
          onPress={() => {
            reset();
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { padding: 22, paddingTop: 25, paddingBottom: 40 },
  success: { alignItems: 'center', marginBottom: 24 },
  check: { backgroundColor: colors.green, width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  heading: { color: colors.ink, fontSize: 24, fontWeight: '800', marginTop: 14 },
  sub: { color: colors.muted, marginTop: 6, textAlign: 'center', fontSize: 13 },
  receipt: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 18, marginBottom: 22, backgroundColor: colors.white },
  receiptTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  receiptLabel: { fontSize: 11, color: colors.muted, letterSpacing: 1, fontWeight: '800' },
  bookingId: { color: colors.green, fontWeight: '800', fontSize: 14 },
  doctorRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { backgroundColor: colors.soft, width: 48, height: 48, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  avatarImage: { width: 48, height: 48, borderRadius: 14 },
  initials: { color: colors.darkGreen, fontWeight: '800', fontSize: 16 },
  doctor: { color: colors.ink, fontWeight: '800', marginLeft: 12, fontSize: 15 },
  muted: { color: colors.muted, marginLeft: 12, marginTop: 2, fontSize: 12 },
  detail: { flexDirection: 'row', gap: 12, marginTop: 16 },
  detailLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  detailValue: { color: colors.ink, fontSize: 13, fontWeight: '600', marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  gap: { height: 12 },
});
