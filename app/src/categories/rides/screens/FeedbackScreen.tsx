import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChevronLeft, CircleCheck, Star } from 'lucide-react-native';
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

export const STAR_LABELS: Record<number, string> = {
  1: 'Terrible 😞',
  2: 'Bad 🙁',
  3: 'Okay 😐',
  4: 'Good 😊',
  5: 'Loved it! 🤩',
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

  // Hardware back press listener
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (ratingVisible) {
        setRatingVisible(false);
        return true;
      }
      handleFinish();
      return true;
    });
    return () => sub.remove();
  }, [ratingVisible]);

  // If user tapped "Rate Your Rider", show the full-screen rating page opening from the top/header
  if (ratingVisible) {
    return (
      <RateYourRiderScreen
        ride={mergedRide}
        onBack={() => setRatingVisible(false)}
        onDone={handleFinish}
        isDark={isDark}
      />
    );
  }

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
    </View>
  );
}

/**
 * Ride Complete Step (Receipt & Summary with Rate Rider CTA)
 */
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

      {/* Pay to ride display */}
      <View style={[styles.payToRideCard, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(84, 183, 19, 0.3)' }]}>
        <View>
          <Text style={[styles.payToRideLabel, isDark && { color: '#F1F1EC' }]}>Pay to ride</Text>
          <Text style={[styles.payToRideSub, isDark && { color: '#66D21E' }]}>Paid via OneBuddy UPI / Cash</Text>
        </View>
        <Text style={[styles.payToRideAmount, isDark && { color: '#66D21E' }]}>₹{fareDisplay}</Text>
      </View>

      {/* Rate Your Rider Button */}
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

/**
 * Rate Your Rider Full-Page Screen:
 * Opens from top/header of screen (not a bottom sheet / not starting from the middle).
 * Stars and overall UI are 100% consistent with Food and Grocery feedback screens.
 */
function RateYourRiderScreen({
  ride,
  onBack,
  onDone,
  isDark,
}: {
  ride: FeedbackRideDetails;
  onBack: () => void;
  onDone: () => void;
  isDark?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);
  const [rating, setRating] = useState<number>(5);
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>([
    'Smooth Driving',
    'On-Time Pickup',
  ]);
  const [comments, setComments] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const toggleCompliment = (item: string) => {
    setSelectedCompliments((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Choose a rating', 'Please select at least 1 star before submitting.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 850);
  };

  if (submitted) {
    return (
      <View style={[styles.screen, isDark && { backgroundColor: '#121214' }]}>
        <ThankYouView onReset={onDone} isDark={isDark} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, isDark && { backgroundColor: '#121214' }]}>
      {/* 1. Top Header opening from the top of the screen */}
      <FeedbackHeader onBack={onBack} title="Rate Your Rider" isDark={isDark} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Hero banner matching Food & Grocery */}
        <Hero
          riderName={ride.riderName}
          vehicleType={ride.vehicleType}
          isDark={isDark}
        />

        {/* 3. Rider & Trip Card matching Food/Grocery OrderCard */}
        <RiderCard ride={ride} isDark={isDark} />

        {/* 4. Section Label & Star Rating matching Food & Grocery StarRating */}
        <Text style={[styles.sectionLabel, isDark && { color: '#F1F1EC' }]}>
          Rate your overall experience
        </Text>
        <StarRating rating={rating} onChange={setRating} isDark={isDark} />

        {/* 5. What went well compliments chips */}
        <Text style={[styles.sectionLabel, isDark && { color: '#F1F1EC' }]}>
          What went well?
        </Text>
        <View style={styles.chipsWrap}>
          {COMPLIMENTS.map((item) => {
            const active = selectedCompliments.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.complimentChip,
                  isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' },
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
                    style={{ marginRight: 5 }}
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

        {/* 6. Comments Input matching Food CommentsInput */}
        <Text style={[styles.sectionLabel, isDark && { color: '#F1F1EC' }]}>
          Additional Comments (Optional)
        </Text>
        <CommentsInput value={comments} onChange={setComments} isDark={isDark} />
      </ScrollView>

      {/* 7. Bottom Action Footer matching Food FeedbackFormScreen */}
      <View
        style={[
          styles.footer,
          { paddingBottom: bottomInset + 14 },
          isDark && { backgroundColor: '#1D1E22', borderTopColor: 'rgba(255, 255, 255, 0.08)' },
        ]}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.submitBtn, { opacity: submitting ? 0.7 : 1 }]}
          activeOpacity={0.88}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Submit Feedback</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Top Header Component (starts from very top of screen with back chevron)
 */
function FeedbackHeader({
  onBack,
  title = 'Rate Your Rider',
  isDark,
}: {
  onBack?: () => void;
  title?: string;
  isDark?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0);

  return (
    <View
      style={[
        styles.header,
        { paddingTop: topInset + 12 },
        isDark && { backgroundColor: '#121214', borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
      ]}
    >
      <TouchableOpacity
        onPress={onBack}
        hitSlop={10}
        style={styles.headerBackBtn}
        accessibilityLabel="Go back"
      >
        <ChevronLeft size={24} color={isDark ? '#F1F1EC' : '#111827'} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, isDark && { color: '#F1F1EC' }]}>{title}</Text>
      <View style={{ width: 28 }} />
    </View>
  );
}

/**
 * Hero Banner Component (Matching Food & Grocery Hero.tsx)
 */
function Hero({
  riderName,
  vehicleType,
  isDark,
}: {
  riderName?: string;
  vehicleType?: string;
  isDark?: boolean;
}) {
  const vType = (vehicleType || 'cab').toLowerCase();
  const vehicleEmoji = vType.includes('bike') ? '🛵' : vType.includes('auto') ? '🛺' : '🚗';

  return (
    <View style={styles.heroWrap}>
      <View style={styles.bowlWrap}>
        <Text style={styles.bowlEmoji}>{vehicleEmoji}</Text>
        <View style={styles.heartBadge}>
          <Text style={styles.heartText}>♥</Text>
        </View>
      </View>
      <Text style={[styles.heroThanksTitle, isDark && { color: '#F1F1EC' }]}>
        Thank you for your ride!
      </Text>
      <Text style={[styles.heroThanksSub, isDark && { color: '#9BA08F' }]}>
        {riderName
          ? `We'd love to hear about your experience with ${riderName}.`
          : "We'd love to hear about your experience."}
      </Text>
    </View>
  );
}

/**
 * Rider Card Component (Matching Food OrderCard.tsx)
 */
function RiderCard({
  ride,
  isDark,
}: {
  ride: FeedbackRideDetails;
  isDark?: boolean;
}) {
  const vType = (ride.vehicleType || 'cab').toLowerCase();
  const vehicleIconName: any = vType.includes('bike')
    ? 'bicycle'
    : vType.includes('auto')
    ? 'car-outline'
    : 'car';
  const fareDisplay =
    ride.amount !== undefined && ride.amount !== null
      ? String(ride.amount).replace('₹', '').trim()
      : (ride.fare ? String(ride.fare).replace('₹', '').trim() : '89');

  return (
    <View
      style={[
        styles.riderCardWrap,
        isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' },
      ]}
    >
      <View style={styles.riderCardHeaderRow}>
        <View style={[styles.riderAvatarCircle, isDark && { backgroundColor: '#24262B' }]}>
          <Ionicons name={vehicleIconName} size={24} color="#54B713" />
        </View>
        <View style={styles.riderCardInfo}>
          <View style={styles.riderNameRow}>
            <Text style={[styles.riderNameText, isDark && { color: '#F1F1EC' }]}>
              {ride.riderName || 'Aarav Sharma'}
            </Text>
            <View style={styles.verifiedPartnerBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
              <Text style={styles.verifiedPartnerText}>Verified</Text>
            </View>
          </View>
          <Text style={[styles.riderSubText, isDark && { color: '#9BA08F' }]}>
            {ride.vehicleNumber || 'TS 09 EA 4821'} · {ride.vehicleType || 'Cab'}
          </Text>
        </View>
        <View style={[styles.farePill, isDark && { backgroundColor: 'rgba(84, 183, 19, 0.18)' }]}>
          <Text style={[styles.farePillText, isDark && { color: '#66D21E' }]}>₹{fareDisplay}</Text>
        </View>
      </View>

      <View style={[styles.riderCardDivider, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]} />

      <View style={styles.routeRow}>
        <View style={styles.routeDotsCol}>
          <View style={styles.greenRouteDot} />
          <View style={styles.routeConnectorLine} />
          <View style={styles.redRouteDot} />
        </View>
        <View style={styles.routeTextCol}>
          <Text style={[styles.routeLocationText, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>
            {ride.pickup || '1373, Madhapur, Hyderabad'}
          </Text>
          <Text style={[styles.routeLocationText, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>
            {ride.dropOff || 'Ammerpet, Hyderabad'}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * StarRating Component:
 * EXACT match to Food and Grocery StarRating (lucide-react-native Star, size 40, colors #F0B429 / #E5E7EB, STAR_LABELS)
 */
function StarRating({
  rating,
  onChange,
  isDark,
}: {
  rating: number;
  onChange: (n: number) => void;
  isDark?: boolean;
}) {
  return (
    <View style={styles.starRatingContainer}>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            style={styles.starBtn}
            activeOpacity={0.7}
            accessibilityLabel={`${n} star`}
          >
            <Star
              size={40}
              fill={n <= rating ? '#F0B429' : 'none'}
              color={n <= rating ? '#F0B429' : isDark ? 'rgba(255, 255, 255, 0.15)' : '#E5E7EB'}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        ))}
      </View>
      {rating > 0 && <Text style={styles.starWord}>{STAR_LABELS[rating]}</Text>}
    </View>
  );
}

/**
 * CommentsInput Component (Matching Food CommentsInput.tsx)
 */
function CommentsInput({
  value,
  onChange,
  isDark,
}: {
  value: string;
  onChange: (text: string) => void;
  isDark?: boolean;
}) {
  return (
    <View
      style={[
        styles.commentWrap,
        isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.1)' },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChange}
        maxLength={300}
        placeholder="Share more about your experience with the driver..."
        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
        multiline
        style={[styles.commentField, isDark && { color: '#F1F1EC' }]}
      />
      <Text style={[styles.commentCount, isDark && { color: '#9BA08F' }]}>
        {value.length}/300
      </Text>
    </View>
  );
}

/**
 * ThankYouView Component (Matching Food ThankYouView.tsx)
 */
function ThankYouView({
  onReset,
  isDark,
}: {
  onReset: () => void;
  isDark?: boolean;
}) {
  return (
    <View style={styles.thankYouWrap}>
      <CircleCheck size={64} color="#54B713" strokeWidth={1.5} />
      <Text style={[styles.thankYouTitle, isDark && { color: '#F1F1EC' }]}>Feedback submitted</Text>
      <Text style={[styles.thankYouSub, isDark && { color: '#9BA08F' }]}>
        Thanks for taking the time to share your experience with us.
      </Text>
      <TouchableOpacity onPress={onReset} style={styles.thankYouBtn} activeOpacity={0.88}>
        <Text style={styles.thankYouBtnText}>Go To Home</Text>
      </TouchableOpacity>
    </View>
  );
}

function DetailRow({ label, value, isDark }: { label: string; value: string; isDark?: boolean }) {
  return (
    <View style={[styles.detailRow, isDark && { backgroundColor: '#24262B' }]}>
      <Text style={[styles.detailLabel, isDark && { color: '#9BA08F' }]}>{label}</Text>
      <Text style={[styles.detailValue, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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

  // ── Rate Your Rider Full-Page Screen Styles (Matching Food & Grocery UI) ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerBackBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 24,
  },
  heroWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bowlWrap: {
    marginBottom: 8,
    position: 'relative',
  },
  bowlEmoji: {
    fontSize: 64,
    lineHeight: 72,
  },
  heartBadge: {
    position: 'absolute',
    top: -4,
    right: -16,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    backgroundColor: '#54B713',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  heroThanksTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  heroThanksSub: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
  riderCardWrap: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  riderCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  riderCardInfo: {
    flex: 1,
  },
  riderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riderNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  verifiedPartnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedPartnerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  riderSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  farePill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  farePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  riderCardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDotsCol: {
    alignItems: 'center',
    width: 14,
    marginRight: 10,
  },
  greenRouteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  routeConnectorLine: {
    width: 1.5,
    height: 14,
    backgroundColor: '#CBD5E1',
    marginVertical: 2,
  },
  redRouteDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#DC2626',
  },
  routeTextCol: {
    flex: 1,
    gap: 6,
  },
  routeLocationText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  starRatingContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  starBtn: {
    padding: 4,
  },
  starWord: {
    textAlign: 'center',
    color: '#4FA81A',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 20,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  complimentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  complimentChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#54B713',
  },
  complimentChipText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  complimentChipTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  commentWrap: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  commentField: {
    minHeight: 70,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
  },
  commentCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#54B713',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#54B713',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  thankYouWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 8,
  },
  thankYouTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  thankYouSub: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 16,
    lineHeight: 20,
  },
  thankYouBtn: {
    width: '100%',
    backgroundColor: '#54B713',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#54B713',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  thankYouBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
