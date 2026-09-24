import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, useRideTheme } from '../theme';

export interface FeedbackRideDetails {
  riderName?: string;
  vehicleNumber?: string;
  vehicleType?: 'bike' | 'scooter' | 'auto' | 'cab' | 'xl4' | 'xl7' | string;
  pickup?: string;
  dropOff?: string;
  distance?: string;
  duration?: string;
  amount?: number | string;
  fare?: string;
}

export interface FeedbackScreenProps {
  ride?: FeedbackRideDetails;
  onDone?: () => void;
  onClose?: () => void;
  isDark?: boolean;
}

const DEFAULT_RIDE: FeedbackRideDetails = {
  riderName: 'Aarav Sharma',
  vehicleNumber: 'TS 09 EA 4821',
  vehicleType: 'cab',
  pickup: '1373, Madhapur, Hyderabad',
  dropOff: 'Ammerpet, Hyderabad',
  distance: '6.8 km',
  duration: '1 min',
  amount: 140,
};

const COMPLIMENTS = [
  'Smooth Driving',
  'Clean Vehicle',
  'Polite Driver',
  'On-Time Pickup',
  'Great Route',
  'Helpful & Friendly',
];

export default function FeedbackScreen({
  ride = DEFAULT_RIDE,
  onDone,
  onClose,
  isDark: isDarkProp,
}: FeedbackScreenProps) {
  const theme = useRideTheme();
  const isDark = isDarkProp ?? theme.isDark;
  const insets = useSafeAreaInsets();
  const [ratingVisible, setRatingVisible] = useState(false);

  const mergedRide: FeedbackRideDetails = {
    ...DEFAULT_RIDE,
    ...ride,
    pickup: ride.pickup || DEFAULT_RIDE.pickup,
    dropOff: ride.dropOff || DEFAULT_RIDE.dropOff,
    amount:
      ride.amount !== undefined && ride.amount !== null
        ? (typeof ride.amount === 'string' ? ride.amount.replace('₹', '').trim() : ride.amount)
        : (ride.fare ? ride.fare.replace('₹', '').trim() : DEFAULT_RIDE.amount),
  };

  const handleFinish = () => {
    if (onDone) {
      onDone();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }, isDark && { backgroundColor: '#121214' }]}>
      {/* Top Bar with Brand & Close Button */}
      <View style={styles.topBar}>
        <View style={styles.brandPill}>
          <Text style={[styles.brandOne, isDark && { color: '#F1F1EC' }]}>
            One<Text style={styles.brandBuddy}>Buddy</Text>
          </Text>
          <View style={styles.brandBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
            <Text style={styles.brandBadgeText}>Completed</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.topCloseButton, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' }]}
          onPress={handleFinish}
          hitSlop={12}
          accessibilityLabel="Close feedback"
        >
          <Ionicons name="close" size={22} color={isDark ? '#F1F1EC' : '#0F172A'} />
        </TouchableOpacity>
      </View>

      <CompleteStep
        ride={mergedRide}
        onRate={() => setRatingVisible(true)}
        isDark={isDark}
      />

      {ratingVisible && (
        <RatingSheet
          ride={mergedRide}
          onClose={() => setRatingVisible(false)}
          onDone={handleFinish}
          bottomInset={insets.bottom}
          isDark={isDark}
        />
      )}
    </View>
  );
}

function CompleteStep({
  ride,
  onRate,
  isDark,
}: {
  ride: FeedbackRideDetails;
  onRate: () => void;
  isDark?: boolean;
}) {
  const fareDisplay =
    ride.amount !== undefined && ride.amount !== null
      ? String(ride.amount).replace('₹', '').trim()
      : (ride.fare ? String(ride.fare).replace('₹', '').trim() : '89');

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.successIconBadge}>
        <Ionicons name="checkmark" size={32} color="#FFFFFF" />
      </View>

      <Text style={styles.eyebrow}>RIDE COMPLETED</Text>
      <Text style={[styles.title, isDark && { color: '#F1F1EC' }]}>Thanks for riding!</Text>
      <Text style={[styles.subtitle, isDark && { color: '#9BA08F' }]}>Your trip details and payment summary are ready.</Text>

      {/* Summary Card */}
      <View style={[styles.summary, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(84, 183, 19, 0.3)' }]}>
        <View style={styles.summaryHeader}>
          <Ionicons name="receipt-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Ride Summary</Text>
        </View>
        <DetailRow label="Rider Name" value={ride.riderName || 'Sai Krishna'} isDark={isDark} />
        <DetailRow label="Vehicle Number" value={ride.vehicleNumber || 'AP 16 TG 6843'} isDark={isDark} />
        <DetailRow label="Vehicle Type" value={ride.vehicleType || 'Cab'} isDark={isDark} />
        <DetailRow label="Pickup Point" value={ride.pickup || '1373, Madhapur, Hyderabad'} isDark={isDark} />
        <DetailRow label="Drop Destination" value={ride.dropOff || 'Ammerpet, Hyderabad'} isDark={isDark} />
        <DetailRow label="Trip Distance" value={ride.distance || '6.8 km'} isDark={isDark} />
        <DetailRow label="Travel Duration" value={ride.duration || '10 sec'} isDark={isDark} />
      </View>

      {/* 1. Pay to ride Non-Button Text Display */}
      <View style={[styles.payToRideCard, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(84, 183, 19, 0.3)' }]}>
        <View>
          <Text style={[styles.payToRideLabel, isDark && { color: '#F1F1EC' }]}>Pay to ride</Text>
          <Text style={[styles.payToRideSub, isDark && { color: '#66D21E' }]}>Paid via OneBuddy UPI / Cash</Text>
        </View>
        <Text style={[styles.payToRideAmount, isDark && { color: '#66D21E' }]}>₹{fareDisplay}</Text>
      </View>

      {/* 2. Rate Your Rider Button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onRate}
        activeOpacity={0.88}
        accessibilityRole="button"
      >
        <Ionicons name="star" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.primaryButtonText}>Rate Your Rider</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function RatingSheet({
  ride,
  onClose,
  onDone,
  bottomInset,
  isDark,
}: {
  ride: FeedbackRideDetails;
  onClose: () => void;
  onDone: () => void;
  bottomInset: number;
  isDark?: boolean;
}) {
  const [rating, setRating] = useState<number>(0);
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const vehicleType = (ride.vehicleType || 'cab').toLowerCase();
  const vehicleIconName: any = vehicleType.includes('bike')
    ? 'bicycle'
    : vehicleType.includes('auto')
    ? 'car-outline'
    : 'car';

  const toggleCompliment = (item: string) => {
    setSelectedCompliments((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const submitRating = () => {
    if (!rating) {
      Alert.alert('Choose a rating', 'Please select at least 1 star before submitting.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <View style={styles.sheetLayer}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View
        style={[
          styles.ratingSheet,
          { paddingBottom: Math.max(bottomInset, 20) },
          isDark && { backgroundColor: '#1D1E22' },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close rating"
          style={[styles.closeButton, isDark && { backgroundColor: '#24262B' }]}
          onPress={onClose}
          hitSlop={10}
        >
          <Ionicons name="close" size={20} color={isDark ? '#F1F1EC' : '#64748B'} />
        </TouchableOpacity>

        <View style={[styles.sheetHandle, isDark && { backgroundColor: '#3E424B' }]} />

        {submitted ? (
          <View style={styles.submittedContainer}>
            <View style={styles.submittedCheckCircle}>
              <Ionicons name="checkmark-sharp" size={38} color="#FFFFFF" />
            </View>
            <Text style={[styles.submittedTitle, isDark && { color: '#F1F1EC' }]}>Thank You!</Text>
            <Text style={[styles.submittedSub, isDark && { color: '#9BA08F' }]}>
              Your feedback helps us make OneBuddy rides better for everyone.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onDone}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
            <Text style={[styles.sheetTitle, isDark && { color: '#F1F1EC' }]}>Rate Your Driver</Text>
            <Text style={[styles.description, isDark && { color: '#9BA08F' }]}>
              How was your trip experience with {ride.riderName}?
            </Text>

            {/* Rider Identity Card */}
            <View style={[styles.riderCard, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(84, 183, 19, 0.3)' }]}>
              <View style={[styles.vehicleVisual, isDark && { backgroundColor: '#1D1E22' }]}>
                <Ionicons name={vehicleIconName} size={28} color="#54B713" />
              </View>
              <View style={styles.riderInfo}>
                <Text style={[styles.riderName, isDark && { color: '#F1F1EC' }]}>{ride.riderName}</Text>
                <Text style={[styles.vehicleNumber, isDark && { color: '#9BA08F' }]}>{ride.vehicleNumber}</Text>
                <Text style={[styles.vehicleTypeTag, isDark && { color: '#66D21E' }]}>
                  {vehicleType.toUpperCase()} · Verified Partner
                </Text>
              </View>
            </View>

            {/* Star Rating */}
            <Text style={[styles.ratingLabel, isDark && { color: '#9BA08F' }]}>YOUR RATING</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                  hitSlop={8}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={38}
                    color={star <= rating ? '#FBBF24' : (isDark ? '#3E424B' : '#CBD5E1')}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.ratingTextScore, isDark && { color: '#F1F1EC' }]}>
              {rating === 0
                ? 'Tap a star to rate your driver'
                : rating === 5
                ? 'Excellent! ⭐⭐⭐⭐⭐'
                : rating === 4
                ? 'Very Good! ⭐⭐⭐⭐'
                : rating === 3
                ? 'Good ⭐⭐⭐'
                : rating === 2
                ? 'Could be better ⭐⭐'
                : 'Poor ⭐'}
            </Text>

            {/* Compliments Chips */}
            <Text style={[styles.sectionSmallLabel, isDark && { color: '#9BA08F' }]}>WHAT WENT WELL?</Text>
            <View style={styles.chipsWrap}>
              {COMPLIMENTS.map((item) => {
                const active = selectedCompliments.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.complimentChip,
                      isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' },
                      active && styles.complimentChipActive,
                      active && isDark && { backgroundColor: 'rgba(84, 183, 19, 0.18)', borderColor: '#54B713' },
                    ]}
                    onPress={() => toggleCompliment(item)}
                    activeOpacity={0.75}
                  >
                    {active && (
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={isDark ? '#66D21E' : '#54B713'}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.complimentChipText,
                        isDark && { color: '#F1F1EC' },
                        active && styles.complimentChipTextActive,
                        active && isDark && { color: '#66D21E' },
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional Comment Box */}
            <TextInput
              style={[
                styles.commentInput,
                isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#F1F1EC' },
              ]}
              placeholder="Leave additional feedback (optional)…"
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={2}
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={submitRating}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryButtonText}>Submit Rating</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={onDone}
              activeOpacity={0.75}
            >
              <Text style={[styles.skipButtonText, isDark && { color: '#9BA08F' }]}>Skip & Return to Home</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function DetailRow({ label, value, isDark }: { label: string; value: string; isDark?: boolean }) {
  return (
    <View style={[styles.detailRow, isDark && { backgroundColor: '#24262B' }]}>
      <Text style={[styles.detailLabel, isDark && { color: '#9BA08F' }]}>{label}</Text>
      <Text style={[styles.detailValue, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FCF7',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandOne: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#0F172A',
    fontWeight: '800',
  },
  brandBuddy: {
    color: COLORS.primary,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  brandBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#16A34A',
    fontWeight: '700',
  },
  topCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
    alignItems: 'center',
  },
  successIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  eyebrow: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  title: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  summary: {
    width: '100%',
    marginTop: 22,
    borderWidth: 1.5,
    borderColor: '#54B713',
    borderRadius: 20,
    overflow: 'hidden',
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#54B713',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginVertical: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  detailValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    flex: 1.4,
    textAlign: 'right',
  },
  payToRideCard: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  payToRideLabel: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONTS.bold,
  },
  payToRideSub: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  payToRideAmount: {
    color: '#15803D',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: FONTS.bold,
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#54B713',
    borderRadius: RADIUS.pill,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#54B713',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
  sheetLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  ratingSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
    maxHeight: '90%',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 12,
  },
  sheetTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  riderCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    borderRadius: 18,
    padding: 12,
    marginTop: 14,
    backgroundColor: '#F0FDF4',
  },
  vehicleVisual: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  vehicleNumber: {
    color: '#475569',
    fontSize: 13,
    marginTop: 1,
    fontWeight: '600',
  },
  vehicleTypeTag: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  ratingLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 16,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  starButton: {
    padding: 2,
  },
  ratingTextScore: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  sectionSmallLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  complimentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  complimentChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#54B713',
  },
  complimentChipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  complimentChipTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  commentInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginTop: 12,
    minHeight: 48,
  },
  skipButton: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  skipButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  submittedContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 24,
  },
  submittedCheckCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#54B713',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#54B713',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  submittedTitle: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  submittedSub: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});
