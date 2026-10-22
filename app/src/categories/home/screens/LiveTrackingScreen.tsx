import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  RotateCcw,
  FastForward,
  Car,
  Home,
  CheckCircle,
  MapPin,
  Clock,
  Award,
} from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';
import { TrackingStage } from '../types';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { LiveMap } from '../components/tracking/LiveMap';
import { StatusTimeline } from '../components/tracking/StatusTimeline';
import { OTPCard } from '../components/tracking/OTPCard';
import { RatingStars } from '../components/common/RatingStars';
import { ChatModal } from '../components/common/ChatModal';
import { RatingReviewModal } from '../components/tracking/RatingReviewModal';
import { useHomeTheme, COLORS, RADII, SPACING, SHADOWS } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = Math.round(SCREEN_HEIGHT * 0.44);

interface LiveTrackingScreenProps {
  navigation: any;
}

export const LiveTrackingScreen: React.FC<LiveTrackingScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useHomeTheme();
  const {
    activeBooking,
    assignedProvider,
    advanceToNextStage,
    rewindToPreviousStage,
    updateTrackingStage,
    markFeedbackDismissed,
    isFeedbackDismissed,
  } = useBooking();

  const currentStage: TrackingStage = activeBooking?.stage || 'CONFIRMED';
  const bookingId = activeBooking?.bookingId || '';
  const provider = assignedProvider || activeBooking?.provider;
  const otp = activeBooking?.otp || '4821';

  const [chatVisible, setChatVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const hasShownReviewRef = useRef(false);

  // Auto-open rating & review layer modal EXACTLY ONCE when service reaches COMPLETED
  useEffect(() => {
    if (
      currentStage === 'COMPLETED' &&
      bookingId &&
      !isFeedbackDismissed(bookingId) &&
      !hasShownReviewRef.current
    ) {
      hasShownReviewRef.current = true;
      const timer = setTimeout(() => {
        setReviewVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStage, bookingId, isFeedbackDismissed]);

  const handleCloseReview = () => {
    hasShownReviewRef.current = true;
    if (bookingId) {
      markFeedbackDismissed(bookingId);
    }
    setReviewVisible(false);
  };

  const handleCall = () => {
    if (provider?.phone) {
      Linking.openURL(`tel:${provider.phone}`);
    }
  };

  const stagesSequence: TrackingStage[] = [
    'CONFIRMED',
    'ASSIGNED',
    'EN_ROUTE',
    'ARRIVED',
    'IN_PROGRESS',
    'COMPLETED',
  ];

  const currentStageIndex = stagesSequence.indexOf(currentStage);

  const getStageBannerInfo = () => {
    switch (currentStage) {
      case 'CONFIRMED':
        return {
          title: 'Booking Placed',
          subtitle: 'Matching top-rated verified professional nearby...',
          badge: 'PENDING',
          badgeBg: '#FEF3C7',
          badgeColor: '#D97706',
        };
      case 'ASSIGNED':
        return {
          title: `${provider?.name || 'Technician'} Assigned`,
          subtitle: 'Preparing toolkit and heading to your location shortly.',
          badge: 'ASSIGNED',
          badgeBg: COLORS.primaryLight,
          badgeColor: COLORS.primary,
        };
      case 'EN_ROUTE':
        return {
          title: 'Professional is On The Way',
          subtitle: `ETA ~${activeBooking?.etaMinutes || 12} mins (${activeBooking?.distanceKm || 2.4} km away)`,
          badge: 'EN ROUTE',
          badgeBg: '#DCFCE7',
          badgeColor: '#16A34A',
        };
      case 'ARRIVED':
        return {
          title: 'Professional Has Arrived!',
          subtitle: 'Technician reached your doorstep. Please share the OTP below.',
          badge: 'ARRIVED • OTP READY',
          badgeBg: '#DCFCE7',
          badgeColor: '#15803D',
        };
      case 'IN_PROGRESS':
        return {
          title: 'Service In Progress',
          subtitle: 'Professional is executing your requested service work.',
          badge: 'WORKING NOW',
          badgeBg: '#E0F2FE',
          badgeColor: '#0284C7',
        };
      case 'COMPLETED':
        return {
          title: 'Service Successfully Completed!',
          subtitle: 'Work finished. Please rate your experience to finish.',
          badge: 'COMPLETED',
          badgeBg: '#DCFCE7',
          badgeColor: '#15803D',
        };
    }
  };

  const banner = getStageBannerInfo();

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      {/* 1. Fixed Real-Time 2D Vector Map Canvas (Edge-to-Edge, Full Bleed) */}
      <View style={[styles.mapContainer, { height: MAP_HEIGHT }]}>
        <LiveMap
          stage={currentStage}
          etaMinutes={activeBooking?.etaMinutes || 12}
          distanceKm={activeBooking?.distanceKm || 2.4}
          providerName={provider?.name}
          vehicleNo={provider?.vehicleNo}
          onMovementComplete={() => {
            updateTrackingStage('ARRIVED');
          }}
        />
      </View>

      {/* Floating Top Navigation Bar over Map */}
      <View style={[styles.floatingHeader, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { initialTab: 'Home' })}
          style={[
            styles.headerCircleBtn,
            isDark && { backgroundColor: 'rgba(29, 30, 34, 0.94)', borderColor: 'rgba(255, 255, 255, 0.12)', borderWidth: 1 },
          ]}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={isDark ? '#F1F1EC' : COLORS.textPrimary} />
        </TouchableOpacity>

        <View
          style={[
            styles.headerCenterCard,
            isDark && { backgroundColor: 'rgba(29, 30, 34, 0.94)', borderColor: 'rgba(255, 255, 255, 0.12)', borderWidth: 1 },
          ]}
        >
          <View style={styles.pulseLiveDot} />
          <View>
            <Text style={[styles.headerOrderText, isDark && { color: '#F1F1EC' }]}>
              Order #{activeBooking?.bookingId || 'HS-482190'}
            </Text>
            <Text style={[styles.headerCategoryText, isDark && { color: '#9BA08F' }]}>
              {activeBooking?.category.title || 'Home Service'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { initialTab: 'Home' })}
          style={[
            styles.headerCircleBtn,
            isDark && { backgroundColor: 'rgba(29, 30, 34, 0.94)', borderColor: 'rgba(255, 255, 255, 0.12)', borderWidth: 1 },
          ]}
          activeOpacity={0.8}
        >
          <Home size={18} color={isDark ? '#F1F1EC' : COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Floating Simulator Bar */}
      <View
        style={[
          styles.floatingSimBar,
          isDark && { backgroundColor: 'rgba(18, 18, 20, 0.94)', borderColor: 'rgba(255, 255, 255, 0.12)', borderWidth: 1 },
        ]}
      >
        <Text style={styles.simTitle}>SIMULATE:</Text>
        <TouchableOpacity
          style={[
            styles.simBtn,
            isDark && { backgroundColor: '#24262B' },
            currentStageIndex <= 1 && styles.disabledSimBtn,
          ]}
          disabled={currentStageIndex <= 1}
          onPress={rewindToPreviousStage}
          activeOpacity={0.7}
        >
          <RotateCcw size={12} color={isDark ? '#F1F1EC' : COLORS.textPrimary} />
          <Text style={[styles.simBtnText, isDark && { color: '#F1F1EC' }]}>Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.simBtn,
            styles.simBtnPrimary,
            currentStageIndex === stagesSequence.length - 1 && styles.disabledSimBtn,
          ]}
          disabled={currentStageIndex === stagesSequence.length - 1}
          onPress={advanceToNextStage}
          activeOpacity={0.7}
        >
          <Text style={styles.simBtnTextPrimary}>Next Step</Text>
          <FastForward size={12} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 2. Scrollable Detail Bottom Sheet (Fixed to screen below map) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[styles.bottomSheetScroll, { backgroundColor: colors.surface }]}
        contentContainerStyle={[
          styles.bottomSheetContent,
          { paddingBottom: 110 + insets.bottom },
        ]}
      >
        {/* Drag Handle Indicator */}
        <View style={styles.sheetHandleRow}>
          <View style={[styles.sheetHandle, isDark && { backgroundColor: '#3E424B' }]} />
        </View>

        {/* Live Status Banner */}
        <View
          style={[
            styles.statusBanner,
            isDark && { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
            currentStage === 'ARRIVED' ? (isDark ? styles.arrivedBannerDark : styles.arrivedBanner) : null,
          ]}
        >
          <View style={styles.statusBannerTopRow}>
            <View style={styles.statusTitleRow}>
              {currentStage === 'ARRIVED' ? (
                <CheckCircle size={18} color={isDark ? '#4ADE80' : '#15803D'} style={{ marginRight: 6 }} />
              ) : (
                <Clock size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              )}
              <Text style={[styles.statusBannerTitle, { color: colors.textPrimary }]}>{banner.title}</Text>
            </View>

            <View style={[styles.statusBannerBadge, { backgroundColor: isDark ? (currentStage === 'COMPLETED' || currentStage === 'ARRIVED' || currentStage === 'EN_ROUTE' ? 'rgba(84, 183, 19, 0.2)' : 'rgba(234, 179, 8, 0.2)') : banner.badgeBg }]}>
              <Text style={[styles.statusBannerBadgeText, { color: isDark ? (currentStage === 'COMPLETED' || currentStage === 'ARRIVED' || currentStage === 'EN_ROUTE' ? '#66D21E' : '#FBBF24') : banner.badgeColor }]}>
                {banner.badge}
              </Text>
            </View>
          </View>

          <Text style={[styles.statusBannerSub, { color: colors.textSecondary }]}>{banner.subtitle}</Text>
        </View>

        {/* OTP Card (Visible when technician is ARRIVED) */}
        {currentStage === 'ARRIVED' && (
          <View style={styles.sectionMargin}>
            <OTPCard otp={otp} providerName={provider?.name} />
          </View>
        )}

        {/* Service Completed Callout - Message only, review modal opens automatically */}
        {currentStage === 'COMPLETED' && (
          <View style={[styles.sectionMargin, isDark ? styles.completedBannerBoxDark : styles.completedBannerBox]}>
            <View style={styles.completedHeaderRow}>
              <CheckCircle size={22} color={isDark ? '#4ADE80' : '#15803D'} style={{ marginRight: 8 }} />
              <Text style={[styles.completedHeaderTitle, isDark && { color: '#4ADE80' }]}>All Tasks Completed!</Text>
            </View>
            <Text style={[styles.completedHeaderSub, isDark && { color: '#86EFAC' }]}>
              Your service request has been successfully finished.
            </Text>
          </View>
        )}

        {/* Assigned Provider Card */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Assigned Service Professional</Text>
          <Card style={[styles.providerCard, { backgroundColor: colors.surface }]} variant="elevated">
            <View style={styles.providerRow}>
              {provider?.avatar ? (
                <Image
                  source={{ uri: provider.avatar }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: isDark ? colors.surfaceSubtle : '#E2E8F0', alignItems: 'center', justifyContent: 'center' }]}>
                  <Award size={20} color={colors.textSecondary} />
                </View>
              )}
              <View style={styles.providerMeta}>
                <View style={styles.providerNameRow}>
                  <Text style={[styles.providerName, { color: colors.textPrimary }]}>{provider?.name || 'Assigned Technician'}</Text>
                  {provider?.badge ? (
                    <View style={styles.proBadge}>
                      <Award size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
                      <Text style={styles.proBadgeText}>{provider.badge}</Text>
                    </View>
                  ) : null}
                </View>

                {provider?.rating ? (
                  <View style={styles.ratingRow}>
                    <RatingStars rating={provider.rating} size={12} />
                    <Text style={[styles.ratingValue, { color: colors.textPrimary }]}>{provider.rating}</Text>
                    {provider?.jobsCompleted ? (
                      <Text style={[styles.jobsValue, { color: colors.textMuted }]}>
                        ({provider.jobsCompleted}+ jobs)
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {provider?.vehicleNo ? (
                  <View style={styles.vehicleRow}>
                    <Car size={12} color={colors.textSecondary} />
                    <Text style={[styles.vehicleText, { color: colors.textSecondary }]}>
                      {provider.vehicleNo} {provider?.experienceYears ? `(${provider.experienceYears} yrs exp)` : ''}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Call & Message Direct Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={[
                    styles.actionCircleBtn,
                    isDark && { backgroundColor: 'rgba(84, 183, 19, 0.2)' },
                  ]}
                  onPress={handleCall}
                  activeOpacity={0.75}
                >
                  <Phone size={16} color={isDark ? '#66D21E' : COLORS.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionCircleBtn,
                    { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : COLORS.secondaryLight },
                  ]}
                  onPress={() => setChatVisible(true)}
                  activeOpacity={0.75}
                >
                  <MessageSquare size={16} color={isDark ? '#60A5FA' : COLORS.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </View>

        {/* Order Progress Timeline (With Done progress indicator) */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Order Progress</Text>
          <Card style={[styles.timelineCard, { backgroundColor: colors.surface }]} variant="outlined">
            <StatusTimeline currentStage={currentStage} />
          </Card>
        </View>

        {/* Scheduled Destination Summary */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service Location</Text>
          <Card style={[styles.addressCard, { backgroundColor: colors.surfaceSubtle }]} variant="flat">
            <View style={styles.addressRow}>
              <View style={[styles.pinCircle, isDark && { backgroundColor: 'rgba(84, 183, 19, 0.2)' }]}>
                <MapPin size={16} color={isDark ? '#66D21E' : COLORS.primary} />
              </View>
              <View style={styles.addressTextWrapper}>
                <Text style={[styles.addressLabel, { color: colors.textPrimary }]}>{activeBooking?.address.label || 'Home'}</Text>
                <Text style={[styles.addressStreet, { color: colors.textSecondary }]} numberOfLines={2}>
                  {activeBooking?.address.houseNo}, {activeBooking?.address.street}
                </Text>
                <Text style={[styles.addressCity, { color: colors.textMuted }]}>
                  {activeBooking?.address.city} - {activeBooking?.address.pincode}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Interactive Direct Chat Modal with Technician */}
      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        technicianName={provider?.name}
        technicianAvatar={provider?.avatar}
        onCall={handleCall}
      />

      {/* Rating & Review Overlay Modal (Appears when completed) */}
      <RatingReviewModal
        visible={reviewVisible}
        onClose={handleCloseReview}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F4FAF2',
  },
  mapContainer: {
    width: '100%',
    position: 'relative',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    zIndex: 30,
  },
  headerCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  headerCenterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    ...SHADOWS.md,
  },
  pulseLiveDot: {
    width: 8,
    height: 8,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  headerOrderText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerCategoryText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  floatingSimBar: {
    position: 'absolute',
    top: MAP_HEIGHT - 44,
    left: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 32, 23, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    zIndex: 25,
    ...SHADOWS.md,
  },
  simTitle: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginRight: 6,
  },
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADII.md,
    marginLeft: 4,
  },
  simBtnPrimary: {
    backgroundColor: COLORS.primary,
  },
  disabledSimBtn: {
    opacity: 0.4,
  },
  simBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 2,
  },
  simBtnTextPrimary: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 2,
  },
  bottomSheetScroll: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    ...SHADOWS.lg,
  },
  bottomSheetContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  sheetHandleRow: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.borderDark,
  },
  statusBanner: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xs,
  },
  arrivedBanner: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  arrivedBannerDark: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  statusBannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.xs,
  },
  statusBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statusBannerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  statusBannerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusBannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  sectionMargin: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  providerCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.border,
  },
  providerMeta: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADII.pill,
    marginLeft: 6,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingValue: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 3,
  },
  jobsValue: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 3,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  vehicleText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
  },
  actionCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  timelineCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
  },
  addressCard: {
    backgroundColor: COLORS.surfaceSubtle,
    padding: SPACING.md,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  addressTextWrapper: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addressStreet: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addressCity: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  completedBannerBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: RADII.xl,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    ...SHADOWS.sm,
  },
  completedBannerBoxDark: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: RADII.xl,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    ...SHADOWS.sm,
  },
  completedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  completedHeaderSub: {
    fontSize: 12,
    color: '#166534',
    marginTop: 4,
    lineHeight: 16,
  },
  bottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.float,
  },
});
