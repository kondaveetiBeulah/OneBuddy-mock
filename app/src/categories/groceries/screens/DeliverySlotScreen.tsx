import React, { useState } from 'react';
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
import { CustomButton } from '../components/CustomButton';
import { DeliverySlot } from '../types/order.types';
import { useCart } from '../context/CartContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

type DeliverySlotScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const DATES_LIST = ['Today', 'Tomorrow', 'Day After Tomorrow'];

const SLOTS_DATA: DeliverySlot[] = [
  { id: 's1', date: 'Today', startTime: '08:00 AM', endTime: '10:00 AM', available: true },
  { id: 's2', date: 'Today', startTime: '10:00 AM', endTime: '12:00 PM', available: true },
  { id: 's3', date: 'Today', startTime: '02:00 PM', endTime: '04:00 PM', available: true },
  { id: 's4', date: 'Today', startTime: '05:00 PM', endTime: '07:00 PM', available: true },
  { id: 's5', date: 'Today', startTime: '07:00 PM', endTime: '09:00 PM', available: false },

  { id: 's6', date: 'Tomorrow', startTime: '08:00 AM', endTime: '10:00 AM', available: true },
  { id: 's7', date: 'Tomorrow', startTime: '10:00 AM', endTime: '12:00 PM', available: true },
  { id: 's8', date: 'Tomorrow', startTime: '02:00 PM', endTime: '04:00 PM', available: true },
  { id: 's9', date: 'Tomorrow', startTime: '06:00 PM', endTime: '08:00 PM', available: true },

  { id: 's10', date: 'Day After Tomorrow', startTime: '08:00 AM', endTime: '10:00 AM', available: true },
  { id: 's11', date: 'Day After Tomorrow', startTime: '02:00 PM', endTime: '04:00 PM', available: true },
];

export const DeliverySlotScreen: React.FC<DeliverySlotScreenProps> = ({ navigation }) => {
  const { getPriceSummary } = useCart();
  const summary = getPriceSummary();
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot>(SLOTS_DATA[0]);

  const availableSlotsForDate = SLOTS_DATA.filter((s) => s.date === selectedDate);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Select Delivery Slot" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <Text style={styles.sectionTitle}>Select Delivery Day</Text>
        <View style={styles.dateRow}>
          {DATES_LIST.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dateChip, selectedDate === d && styles.activeDateChip]}
              onPress={() => {
                setSelectedDate(d);
                const firstForDate = SLOTS_DATA.find((s) => s.date === d && s.available);
                if (firstForDate) setSelectedSlot(firstForDate);
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={selectedDate === d ? colors.white : colors.primary}
              />
              <Text
                style={[
                  styles.dateChipText,
                  selectedDate === d && styles.activeDateChipText,
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Available Time Slots</Text>
        <View style={styles.slotsGrid}>
          {availableSlotsForDate.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id;
            return (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.slotCard,
                  !slot.available && styles.disabledSlotCard,
                  isSelected && styles.selectedSlotCard,
                ]}
                onPress={() => slot.available && setSelectedSlot(slot)}
                disabled={!slot.available}
              >
                <View style={styles.slotRow}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={
                      !slot.available
                        ? colors.textMuted
                        : isSelected
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.slotTimeText,
                      !slot.available && styles.disabledSlotText,
                      isSelected && styles.selectedSlotText,
                    ]}
                  >
                    {slot.startTime} - {slot.endTime}
                  </Text>
                </View>
                {!slot.available && (
                  <Text style={styles.fullText}>SLOT FULL</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.selectedSummary}>
          <Text style={styles.summaryLabel}>Selected Slot:</Text>
          <Text style={styles.summaryVal}>
            {selectedDate}, {selectedSlot?.startTime} - {selectedSlot?.endTime}
          </Text>
        </View>

        <CustomButton
          title="Proceed to Payment"
          onPress={() => navigation.navigate('Payment', { grandTotal: summary.total })}
          size="large"
          style={styles.proceedBtn}
        />
      </View>
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
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dateChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 4,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  activeDateChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  activeDateChipText: {
    color: colors.white,
  },
  slotsGrid: {
    gap: spacing.sm,
  },
  slotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedSlotCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
  },
  disabledSlotCard: {
    backgroundColor: colors.borderLight,
    opacity: 0.6,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  slotTimeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  selectedSlotText: {
    color: colors.primaryDark,
    fontWeight: typography.weights.bold,
  },
  disabledSlotText: {
    color: colors.textMuted,
  },
  fullText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.danger,
  },
  footer: {
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  selectedSummary: {
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  summaryVal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  proceedBtn: {
    width: '100%',
  },
});
