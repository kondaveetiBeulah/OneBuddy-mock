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
          style={styles.headerCircleBtn}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenterCard}>
          <View style={styles.pulseLiveDot} />
          <View>
            <Text style={styles.headerOrderText}>
              Order #{activeBooking?.bookingId || 'HS-482190'}
            </Text>
            <Text style={styles.headerCategoryText}>
              {activeBooking?.category.title || 'Home Service'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs', { initialTab: 'Home' })}
          style={styles.headerCircleBtn}
          activeOpacity={0.8}
        >
          <Home size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Floating Simulator Bar */}
      <View style={styles.floatingSimBar}>
        <Text style={styles.simTitle}>SIMULATE:</Text>
        <TouchableOpacity
          style={[styles.simBtn, currentStageIndex <= 1 && styles.disabledSimBtn]}
          disabled={currentStageIndex <= 1}
          onPress={rewindToPreviousStage}
          activeOpacity={0.7}
        >
          <RotateCcw size={12} color={COLORS.textPrimary} />
          <Text style={styles.simBtnText}>Prev</Text>
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
        style={styles.bottomSheetScroll}
        contentContainerStyle={[
          styles.bottomSheetContent,
          { paddingBottom: 110 + insets.bottom },
        ]}
      >
        {/* Drag Handle Indicator */}
        <View style={styles.sheetHandleRow}>
          <View style={styles.sheetHandle} />
        </View>

        {/* Live Status Banner */}
        <View
          style={[
            styles.statusBanner,
            currentStage === 'ARRIVED' ? styles.arrivedBanner : null,
          ]}
        >
          <View style={styles.statusBannerTopRow}>
            <View style={styles.statusTitleRow}>
              {currentStage === 'ARRIVED' ? (
                <CheckCircle size={18} color="#15803D" style={{ marginRight: 6 }} />
              ) : (
                <Clock size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              )}
              <Text style={styles.statusBannerTitle}>{banner.title}</Text>
            </View>

            <View style={[styles.statusBannerBadge, { backgroundColor: banner.badgeBg }]}>
              <Text style={[styles.statusBannerBadgeText, { color: banner.badgeColor }]}>
                {banner.badge}
              </Text>
            </View>
          </View>

          <Text style={styles.statusBannerSub}>{banner.subtitle}</Text>
        </View>

        {/* OTP Card (Visible when technician is ARRIVED) */}
        {currentStage === 'ARRIVED' && (
          <View style={styles.sectionMargin}>
            <OTPCard otp={otp} providerName={provider?.name} />
          </View>
        )}

        {/* Service Completed Callout - Message only, review modal opens automatically */}
        {currentStage === 'COMPLETED' && (
          <View style={[styles.sectionMargin, styles.completedBannerBox]}>
            <View style={styles.completedHeaderRow}>
              <CheckCircle size={22} color="#15803D" style={{ marginRight: 8 }} />
              <Text style={styles.completedHeaderTitle}>All Tasks Completed!</Text>
            </View>
            <Text style={styles.completedHeaderSub}>
              Your service request has been successfully finished.
            </Text>
          </View>
        )}

        {/* Assigned Provider Card */}
        <View style={styles.sectionMargin}>
          <Text style={styles.sectionTitle}>Assigned Service Professional</Text>
          <Card style={styles.providerCard} variant="elevated">
            <View style={styles.providerRow}>
              <Image
                source={{
                  uri:
                    provider?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
                }}
                style={styles.avatar}
              />
              <View style={styles.providerMeta}>
                <View style={styles.providerNameRow}>
                  <Text style={styles.providerName}>{provider?.name || 'Rajesh Kumar'}</Text>
                  <View style={styles.proBadge}>
                    <Award size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
                    <Text style={styles.proBadgeText}>{provider?.badge || 'Super Pro'}</Text>
                  </View>
                </View>

                <View style={styles.ratingRow}>
                  <RatingStars rating={provider?.rating || 4.9} size={12} />
                  <Text style={styles.ratingValue}>{provider?.rating || 4.9}</Text>
                  <Text style={styles.jobsValue}>
                    ({provider?.jobsCompleted || 486}+ jobs)
                  </Text>
                </View>

                <View style={styles.vehicleRow}>
                  <Car size={12} color={COLORS.textSecondary} />
                  <Text style={styles.vehicleText}>
                    {provider?.vehicleNo || 'KA 03 EJ 4821'} ({provider?.experienceYears || 6} yrs exp)
                  </Text>
                </View>
              </View>

              {/* Call & Message Direct Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.actionCircleBtn}
                  onPress={handleCall}
                  activeOpacity={0.75}
                >
                  <Phone size={16} color={COLORS.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionCircleBtn, { backgroundColor: COLORS.secondaryLight }]}
                  onPress={() => setChatVisible(true)}
                  activeOpacity={0.75}
                >
                  <MessageSquare size={16} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </View>

        {/* Order Progress Timeline (With Done progress indicator) */}
        <View style={styles.sectionMargin}>
          <Text style={styles.sectionTitle}>Order Progress</Text>
          <Card style={styles.timelineCard} variant="outlined">
            <StatusTimeline currentStage={currentStage} />
          </Card>
        </View>

        {/* Scheduled Destination Summary */}
        <View style={styles.sectionMargin}>
          <Text style={styles.sectionTitle}>Service Location</Text>
          <Card style={styles.addressCard} variant="flat">
            <View style={styles.addressRow}>
              <View style={styles.pinCircle}>
                <MapPin size={16} color={COLORS.primary} />
              </View>
              <View style={styles.addressTextWrapper}>
                <Text style={styles.addressLabel}>{activeBooking?.address.label || 'Home'}</Text>
                <Text style={styles.addressStreet} numberOfLines={2}>
                  {activeBooking?.address.houseNo}, {activeBooking?.address.street}
                </Text>
                <Text style={styles.addressCity}>
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
