import React, { useState } from 'react';
import {
  Alert,
  Platform,
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
import { CustomButton } from '../components/CustomButton';
import { DeliverySlot } from '../types/order.types';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
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
  const { selectedAddress, addresses } = useUser();
  const summary = getPriceSummary();
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot>(SLOTS_DATA[0]);
  const groceryColors = useGroceryColors();
  const isDark = isCategoryDark() || groceryColors.cardBackground === '#000000';
  const dynStyles = getStyles(isDark);

  const availableSlotsForDate = SLOTS_DATA.filter((s) => s.date === selectedDate);

  return (
    <SafeAreaView style={dynStyles.container}>
      <Header title="Select Delivery Slot" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={dynStyles.scrollPadding}>
        <Text style={dynStyles.sectionTitle}>Select Delivery Day</Text>
        <View style={dynStyles.dateRow}>
          {DATES_LIST.map((d) => (
            <TouchableOpacity
              key={d}
              style={[dynStyles.dateChip, selectedDate === d && dynStyles.activeDateChip]}
              onPress={() => {
                setSelectedDate(d);
                const firstForDate = SLOTS_DATA.find((s) => s.date === d && s.available);
                if (firstForDate) setSelectedSlot(firstForDate);
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={selectedDate === d ? (isDark ? '#000000' : colors.white) : (isDark ? '#FFFFFF' : colors.primary)}
              />
              <Text
                style={[
                  dynStyles.dateChipText,
                  selectedDate === d && dynStyles.activeDateChipText,
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={dynStyles.sectionTitle}>Available Time Slots</Text>
        <View style={dynStyles.slotsGrid}>
          {availableSlotsForDate.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id;
            return (
              <TouchableOpacity
                key={slot.id}
                style={[
                  dynStyles.slotCard,
                  !slot.available && dynStyles.disabledSlotCard,
                  isSelected && dynStyles.selectedSlotCard,
                ]}
                onPress={() => slot.available && setSelectedSlot(slot)}
                disabled={!slot.available}
              >
                <View style={dynStyles.slotRow}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={
                      !slot.available
                        ? (isDark ? '#9CA3AF' : colors.textMuted)
                        : isSelected
                        ? (isDark ? '#FFFFFF' : colors.primary)
                        : (isDark ? '#E5E7EB' : colors.textSecondary)
                    }
                  />
                  <Text
                    style={[
                      dynStyles.slotTimeText,
                      !slot.available && dynStyles.disabledSlotText,
                      isSelected && dynStyles.selectedSlotText,
                    ]}
                  >
                    {slot.startTime} - {slot.endTime}
                  </Text>
                </View>
                {!slot.available && (
                  <Text style={dynStyles.fullText}>SLOT FULL</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={dynStyles.footer}>
        <View style={dynStyles.selectedSummary}>
          <Text style={dynStyles.summaryLabel}>Selected Slot:</Text>
          <Text style={dynStyles.summaryVal}>
            {selectedDate}, {selectedSlot?.startTime} - {selectedSlot?.endTime}
          </Text>
        </View>

        <CustomButton
          title="Proceed to Payment"
          onPress={() => {
            if (!selectedAddress && (!addresses || addresses.length === 0)) {
              const msg = '⚠️ Please add a delivery address before proceeding to payment.';
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.alert(msg);
              } else {
                Alert.alert('Delivery Address Required', msg);
              }
              navigation.navigate('Address');
              return;
            }
            navigation.navigate('Payment', { grandTotal: summary.total });
          }}
          size="large"
          style={dynStyles.proceedBtn}
        />
      </View>
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
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
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
    backgroundColor: isDark ? '#000000' : colors.white,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.2)' : colors.border,
    gap: 4,
  },
  activeDateChip: {
    backgroundColor: isDark ? '#FFFFFF' : colors.primary,
    borderColor: isDark ? '#FFFFFF' : colors.primary,
  },
  dateChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
  },
  activeDateChipText: {
    color: isDark ? '#000000' : colors.white,
  },
  slotsGrid: {
    gap: spacing.sm,
  },
  slotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? '#000000' : colors.white,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.2)' : colors.border,
  },
  selectedSlotCard: {
    borderColor: isDark ? '#5FA300' : colors.primary,
    backgroundColor: isDark ? 'rgba(95,163,0,0.2)' : colors.primaryLight,
    borderWidth: 2,
  },
  disabledSlotCard: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.borderLight,
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
    color: isDark ? '#FFFFFF' : colors.textPrimary,
  },
  selectedSlotText: {
    color: isDark ? '#FFFFFF' : colors.primaryDark,
    fontWeight: typography.weights.bold,
  },
  disabledSlotText: {
    color: isDark ? '#9CA3AF' : colors.textMuted,
  },
  fullText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: isDark ? '#EF4444' : colors.danger,
  },
  footer: {
    backgroundColor: isDark ? '#000000' : colors.cardBackground,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
  },
  selectedSummary: {
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.sizes.xs,
    color: isDark ? '#E5E7EB' : colors.textMuted,
  },
  summaryVal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.primaryDark,
  },
  proceedBtn: {
    width: '100%',
  },
});
