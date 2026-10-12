import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar as CalendarIcon,
  Clock,
  Sun,
  Sunset,
  Moon,
  CheckCircle,
  ArrowRight,
} from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';
import { TimeSlot, DayOption } from '../types';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useHomeTheme, COLORS, RADII, SPACING, SHADOWS } from '../theme';

interface DateTimePickerScreenProps {
  navigation: any;
}

export const DateTimePickerScreen: React.FC<DateTimePickerScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useHomeTheme();
  const {
    upcomingDays,
    selectedDate,
    setSelectedDate,
    timeSlots,
    selectedTimeSlot,
    setSelectedTimeSlot,
    selectedSubServices,
    currentAddress,
  } = useBooking();

  const isSlotPassed = (timeRange: string, isToday?: boolean): boolean => {
    if (!isToday) return false;
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    // Parse start time e.g. "08:00 AM", "01:00 PM"
    const startTimePart = timeRange.split(' - ')[0].trim();
    const [time, meridiem] = startTimePart.split(' ');
    let [hours, mins] = time.split(':').map(Number);
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    const slotDecimal = hours + mins / 60;

    return currentHour >= slotDecimal;
  };

  const morningSlots = timeSlots.filter((t) => t.period === 'Morning');
  const afternoonSlots = timeSlots.filter((t) => t.period === 'Afternoon');
  const eveningSlots = timeSlots.filter((t) => t.period === 'Evening');

  const handleContinue = () => {
    if (!currentAddress) {
      Alert.alert(
        'Delivery Address Required',
        'Please add or select a service delivery address before proceeding to payment.',
        [
          { text: 'Add Address', onPress: () => navigation.navigate('Address', { fromBooking: true }) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    if (selectedDate && selectedTimeSlot) {
      navigation.navigate('Payment');
    }
  };

  const renderSlotGroup = (
    title: string,
    icon: React.ReactNode,
    slots: TimeSlot[]
  ) => {
    const isTwoSlots = slots.length === 2 || title.toLowerCase().includes('evening');
    return (
      <View style={styles.periodGroup}>
        <View style={styles.periodHeader}>
          {icon}
          <Text style={styles.periodTitle}>{title}</Text>
        </View>

        <View style={[styles.slotsGrid, isTwoSlots && styles.twoSlotsGrid]}>
          {slots.map((slot) => {
            const passed = isSlotPassed(slot.timeRange, selectedDate?.isToday);
            const isAvailable = slot.available && !passed;
            const isSelected = selectedTimeSlot?.id === slot.id && isAvailable;

            return (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.smallSlotCard,
                  isTwoSlots && styles.twoSlotCard,
                  isSelected && styles.selectedSlotCard,
                  !isAvailable && styles.disabledSlotCard,
                ]}
                disabled={!isAvailable}
                activeOpacity={0.75}
                onPress={() => setSelectedTimeSlot(slot)}
              >
                <View style={styles.slotCardTop}>
                  <Clock
                    size={13}
                    color={
                      isSelected
                        ? COLORS.primary
                        : !isAvailable
                        ? COLORS.textMuted
                        : COLORS.textSecondary
                    }
                  />
                  {isSelected ? (
                    <CheckCircle size={13} color={COLORS.primary} />
                  ) : !isAvailable ? (
                    <Text style={styles.passedText}>Passed</Text>
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.slotCardTime,
                    isSelected && styles.selectedSlotTime,
                    !isAvailable && styles.disabledSlotTime,
                  ]}
                  numberOfLines={1}
                >
                  {slot.timeRange.split(' - ')[0]}
                </Text>
                <Text
                  style={[
                    styles.slotCardRange,
                    isSelected && styles.selectedSlotRange,
                    !isAvailable && styles.disabledSlotRange,
                  ]}
                  numberOfLines={1}
                >
                  to {slot.timeRange.split(' - ')[1]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <Header
        title="Select Date & Time"
        subtitle="When would you like the professional to arrive?"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
      >
        {/* Selected Services Quick Recap Pill */}
        <View style={styles.summaryBar}>
          <Text style={styles.summaryBarLabel}>
            Booking for {selectedSubServices.length} {selectedSubServices.length === 1 ? 'service' : 'services'}:
          </Text>
          <Text style={styles.summaryBarItems} numberOfLines={1}>
            {selectedSubServices.map((s) => s.title).join(', ')}
          </Text>
        </View>

        {/* 1. Date Selection Strip */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.headerLeft}>
              <CalendarIcon size={18} color={COLORS.primary} />
              <Text style={styles.sectionHeading}>Select Service Date</Text>
            </View>
            <Text style={styles.selectedMonthText}>
              {selectedDate?.monthName} 2026
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStripContainer}
          >
            {upcomingDays.map((day) => {
              const isSelected = selectedDate?.id === day.id;
              return (
                <TouchableOpacity
                  key={day.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDate(day)}
                  style={[
                    styles.dayCard,
                    isSelected && styles.selectedDayCard,
                  ]}
                >

                  <Text
                    style={[
                      styles.dayName,
                      isSelected && styles.selectedDayText,
                    ]}
                  >
                    {day.dayName}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected && styles.selectedDayText,
                    ]}
                  >
                    {day.dayNumber}
                  </Text>
                  <Text
                    style={[
                      styles.monthLabel,
                      isSelected && styles.selectedDayText,
                    ]}
                  >
                    {day.monthName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. Small Card Time Slots Section */}
        <View style={[styles.sectionContainer, { marginTop: SPACING.md }]}>
          <View style={styles.headerLeft}>
            <Clock size={18} color={COLORS.primary} />
            <Text style={styles.sectionHeading}>Select Arrival Time Slot</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Technician will reach within the chosen window
          </Text>

          {/* Morning Slots */}
          {renderSlotGroup(
            'Morning Slots',
            <Sun size={15} color="#F59E0B" style={{ marginRight: 6 }} />,
            morningSlots
          )}

          {/* Afternoon Slots */}
          {renderSlotGroup(
            'Afternoon Slots',
            <Sunset size={15} color="#EA580C" style={{ marginRight: 6 }} />,
            afternoonSlots
          )}

          {/* Evening Slots */}
          {renderSlotGroup(
            'Evening Slots',
            <Moon size={15} color="#6366F1" style={{ marginRight: 6 }} />,
            eveningSlots
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, SPACING.md) },
        ]}
      >
        <View style={styles.bottomSummary}>
          <Text style={styles.bottomSelectedDate}>
            {selectedDate?.fullDate || 'No date chosen'}
          </Text>
          <Text style={styles.bottomSelectedTime}>
            {selectedTimeSlot ? selectedTimeSlot.timeRange : 'Select a time slot'}
          </Text>
        </View>

        <Button
          title="Continue to Payment"
          onPress={handleContinue}
          disabled={!selectedDate || !selectedTimeSlot || isSlotPassed(selectedTimeSlot.timeRange, selectedDate?.isToday)}
          rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
          size="lg"
          style={{ width: '52%' }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  summaryBar: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  summaryBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  summaryBarItems: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  sectionContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginLeft: 6,
  },
  selectedMonthText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.xs,
  },
  dateStripContainer: {
    paddingVertical: SPACING.xs,
  },
  dayCard: {
    width: 72,
    height: 94,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    position: 'relative',
    ...SHADOWS.sm,
  },
  selectedDayCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
    ...SHADOWS.md,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginVertical: 1,
  },
  monthLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  periodGroup: {
    marginTop: SPACING.sm,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  periodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  twoSlotsGrid: {
    justifyContent: 'flex-start',
    gap: SPACING.sm,
  },
  twoSlotCard: {
    flex: 1,
    width: undefined,
  },
  smallSlotCard: {
    width: '31.5%',
    backgroundColor: COLORS.surface,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    justifyContent: 'space-between',
    minHeight: 74,
    ...SHADOWS.sm,
  },
  selectedSlotCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    ...SHADOWS.md,
  },
  disabledSlotCard: {
    opacity: 0.45,
    backgroundColor: COLORS.surfaceSubtle,
    borderColor: COLORS.border,
  },
  slotCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  passedText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.danger,
  },
  slotCardTime: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  selectedSlotTime: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  disabledSlotTime: {
    color: COLORS.textMuted,
  },
  slotCardRange: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  selectedSlotRange: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  disabledSlotRange: {
    color: COLORS.textMuted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.float,
  },
  bottomSummary: {
    flex: 1,
    marginRight: SPACING.md,
  },
  bottomSelectedDate: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  bottomSelectedTime: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
});
