import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BookingStepper, colors, useColors, PrimaryButton } from '../components/UI';
import { useBooking } from '../context/BookingContext';
import { doctors, getDateKey } from '../mockData';

interface Props {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
  route?: {
    params?: {
      doctorId?: string;
    };
  };
}

export function AvailabilityScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedDoctor, chooseSlot } = useBooking();
  const tc = useColors();
  const doctor = selectedDoctor ?? doctors.find((item) => item.id === route?.params?.doctorId) ?? doctors[0];
  const [date, setDate] = useState(getDateKey(0));
  const [slotId, setSlotId] = useState<string>();

  const days = [0, 1, 2, 3].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      key: getDateKey(offset),
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: d.getDate(),
    };
  });

  const selected = doctor?.slots[date]?.find((slot) => slot.id === slotId);

  return (
    <View style={styles.layerContainer}>
      {/* Dimmed backdrop - tapping dismisses layer */}
      <Pressable
        style={styles.backdrop}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Dismiss choose time"
      />

      {/* Layer Sheet */}
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: tc.surface }]}>
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Header Row with Back and Close Button */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.closeBtn, { backgroundColor: tc.soft }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={tc.ink} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: tc.ink }]}>Choose a time</Text>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.closeBtn, { backgroundColor: tc.soft }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color={tc.ink} />
          </Pressable>
        </View>

        {/* Stepper */}
        <View style={styles.stepperWrap}>
          <BookingStepper currentStep={1} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Doctor Brief Card */}
          <View style={[styles.doctorCard, { backgroundColor: tc.soft, borderColor: tc.border }]}>
            <View style={[styles.avatar, { backgroundColor: tc.white, borderColor: tc.border }]}>
              {doctor.avatar ? (
                <Image source={{ uri: doctor.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.initials}>{doctor.initials}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.doctorName, { color: tc.ink }]} numberOfLines={1}>
                {doctor.name}
              </Text>
              <Text style={[styles.doctorSpecialty, { color: tc.muted }]} numberOfLines={1}>
                {doctor.specialty}
              </Text>
            </View>
            <View style={styles.feeBadge}>
              <Text style={styles.feeLabel}>Fee</Text>
              <Text style={styles.feeAmount}>₹{doctor.fee}</Text>
            </View>
          </View>

          {/* Select Date */}
          <Text style={[styles.sectionLabel, { color: tc.ink }]}>Select Date</Text>
          <View style={styles.daysRow}>
            {days.map((item) => {
              const isActive = date === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => {
                    setDate(item.key);
                    setSlotId(undefined);
                  }}
                  style={[styles.dayCard, { backgroundColor: tc.white, borderColor: tc.border }, isActive && styles.dayCardActive]}
                >
                  <Text style={[styles.dayName, { color: tc.muted }, isActive && styles.dayTextActive]}>
                    {item.day}
                  </Text>
                  <Text style={[styles.dayNumber, { color: tc.ink }, isActive && styles.dayTextActive]}>
                    {item.date}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Available Slots */}
          <Text style={[styles.sectionLabel, { color: tc.ink }]}>Available Slots</Text>
          <View style={styles.slotsGrid}>
            {doctor.slots[date]?.map((slot) => {
              const isActive = slotId === slot.id;
              return (
                <Pressable
                  key={slot.id}
                  onPress={() => setSlotId(slot.id)}
                  style={[styles.slotChip, { backgroundColor: tc.white, borderColor: tc.border }, isActive && styles.slotChipActive]}
                >
                  <Text style={[styles.slotChipText, { color: tc.ink }, isActive && styles.slotChipTextActive]}>
                    {slot.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Action Button - positioned with compact, zero extra space */}
          <View style={styles.btnWrap}>
            <PrimaryButton
              title="Continue to patient details"
              disabled={!selected}
              onPress={() => {
                if (selected) {
                  chooseSlot(date, selected);
                  navigation.navigate('PatientDetails');
                }
              }}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperWrap: {
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.soft,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarImage: { width: 44, height: 44, borderRadius: 12 },
  initials: { color: colors.darkGreen, fontWeight: '800', fontSize: 15 },
  doctorName: { color: colors.ink, fontWeight: '800', fontSize: 14 },
  doctorSpecialty: { color: colors.muted, fontSize: 11, marginTop: 2, fontWeight: '600' },
  feeBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  feeLabel: { fontSize: 10, color: '#047857', fontWeight: '600' },
  feeAmount: { fontSize: 13, color: '#047857', fontWeight: '800' },
  sectionLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  dayCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  dayCardActive: {
    borderColor: colors.green,
    backgroundColor: colors.soft,
  },
  dayName: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  dayNumber: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  dayTextActive: {
    color: colors.darkGreen,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  slotChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },
  slotChipActive: {
    borderColor: colors.green,
    backgroundColor: colors.soft,
  },
  slotChipText: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 12,
  },
  slotChipTextActive: {
    color: colors.darkGreen,
    fontWeight: '800',
  },
  btnWrap: {
    marginTop: 4,
  },
});
