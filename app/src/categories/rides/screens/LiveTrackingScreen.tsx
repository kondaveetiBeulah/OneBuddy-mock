/**
 * Production-ready 2D Live Ride Booking Tracking Screen (OneBuddy Custom Layout).
 *
 * Features:
 * - Clean top layout without yellow location banner (full bleed 2D map view)
 * - Sleek floating OneBuddy header pill (Brand logo + Live status badge)
 * - Pure 2D Live Tracking Map with smooth animated vehicle along Madhapur route
 * - Custom OneBuddy bottom layout:
 *   1. OneBuddyRideHero (ETA, driver proximity, PIN box)
 *   2. OneBuddy Vehicle Selector (Auto, Cab, Bike)
 *   3. OneBuddyDriverCard (Driver avatar, verified check, rating, automotive plate, vehicle graphic)
 *   4. RideQuickActions (OneBuddy green Call button, Chat, Safety, Cancel)
 *   5. OneBuddyRouteTimeline (Visual pickup and destination route, fare, payment badge)
 * - Interactive modals for calling, messaging, safety toolkit, and ride cancellation
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Icon from '../components/Icon';
import { LiveTrackingMap2D } from '../components/LiveTrackingMap2D';
import { OneBuddyRideHero } from '../components/ride/OneBuddyRideHero';
import { OneBuddyDriverCard } from '../components/ride/OneBuddyDriverCard';
import { OneBuddyRouteTimeline } from '../components/ride/OneBuddyRouteTimeline';
import { RideQuickActions } from '../components/ride/RideQuickActions';
import { HelpSupportModal } from '../components/ride/HelpSupportModal';
import { Row, Sheet, Toast } from '../components/UI';

import type { RideDetails, RideType } from '../types/tracking';
import {
  RIDE_CHAT_OPTIONS,
  RIDE_PRESETS,
} from '../data/tracking';
import { useDynamicRefreshRate } from '../hooks/useDynamicRefreshRate';
import { COLORS, FONTS, GUTTER, RADIUS, useRideTheme } from '../theme';

export interface LiveTrackingScreenProps {
  showBookingNotifications?: boolean;
  initialRideType?: RideType;
  customRideDetails?: Partial<RideDetails>;
  onBack?: () => void;
  onCallDriver?: () => void;
  onChatDriver?: () => void;
  onCancelRide?: () => void;
  onRideCompleted?: () => void;
  isDark?: boolean;
}

export default function LiveTrackingScreen({
  showBookingNotifications = false,
  initialRideType = 'auto',
  customRideDetails,
  onBack,
  onCallDriver,
  onChatDriver,
  onCancelRide,
  onRideCompleted,
  isDark: isDarkProp,
}: LiveTrackingScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const theme = useRideTheme();
  const isDark = isDarkProp ?? theme.isDark;

  // Compute safe top spacing so headers never combine with Android status bar / clock
  const safeTop = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  ) + 10;

  // Scale refresh rate up to 120 FPS dynamically for smooth map tracking
  useDynamicRefreshRate(true);

  const normalizeType = (t?: string): RideType => {
    const s = (t || '').toLowerCase();
    if (s.includes('bike') || s.includes('scooter')) return 'bike';
    if (s.includes('cab') || s.includes('car') || s.includes('mini') || s.includes('xl') || s.includes('premier')) return 'cab';
    return 'auto';
  };

  // Active vehicle type locked to the user's previous selection (auto, cab, or bike)
  const [selectedRideType, setSelectedRideType] = useState<RideType>(normalizeType(initialRideType));

  useEffect(() => {
    if (initialRideType) {
      setSelectedRideType(normalizeType(initialRideType));
    }
  }, [initialRideType]);

  const activePreset = RIDE_PRESETS[selectedRideType] || RIDE_PRESETS.auto;

  // Dynamic ride details merged with active preset
  const ride: RideDetails = {
    ...activePreset,
    ...customRideDetails,
    pickupSpotName: customRideDetails?.pickupSpotName || activePreset.pickupSpotName,
    pickupAddress: customRideDetails?.pickupAddress || activePreset.pickupAddress,
    dropSpotName: customRideDetails?.dropSpotName || activePreset.dropSpotName,
    dropAddress: customRideDetails?.dropAddress || activePreset.dropAddress,
    fare: customRideDetails?.fare || activePreset.fare,
    driver: {
      ...activePreset.driver,
      ...(customRideDetails?.driver || {}),
    },
  };

  // Map state
  const [autoCenter, setAutoCenter] = useState(false);
  const [isPlaying, setIsPlaying] = useState(!showBookingNotifications);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // 3-Phase Booking Notification state: 0 = Searching, 1 = Found, 2 = Assigned, 3 = Complete / Riding
  const [assignmentState, setAssignmentState] = useState(0);
  const [showNotification, setShowNotification] = useState(showBookingNotifications);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-30)).current;

  // ── Journey Progression State Machine ──────────────────────────────────────
  // 'booking' -> 'approaching' -> 'arrived_at_pickup' -> 'in_transit' -> 'destination_reached' -> 'completed'
  const [journeyPhase, setJourneyPhase] = useState<
    'booking' | 'approaching' | 'arrived_at_pickup' | 'in_transit' | 'destination_reached' | 'completed'
  >(showBookingNotifications ? 'booking' : 'approaching');

  const [journeySecondsLeft, setJourneySecondsLeft] = useState<number>(10);
  const journeyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showJourneyStartedBanner, setShowJourneyStartedBanner] = useState(false);
  const bannerFadeAnim = useRef(new Animated.Value(0)).current;

  // Hardware back press handler to navigate to previous screen
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  // Initial booking flow animation (if triggered standalone)
  useEffect(() => {
    if (!showBookingNotifications) {
      setIsPlaying(true);
      setJourneyPhase('approaching');
      return;
    }

    setIsPlaying(false);
    setAssignmentState(0);
    setShowNotification(true);
    setJourneyPhase('booking');

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 1: Searching -> Phase 2: Driver Found after 3s
    const t1 = setTimeout(() => {
      setAssignmentState(1);
    }, 3000);

    // Phase 2: Driver Found -> Phase 3: Ride Booked / Assigned after 5.5s
    const t2 = setTimeout(() => {
      setAssignmentState(2);
    }, 5500);

    // Phase 3: Start vehicle moving to pickup at 8s
    const t3 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -30,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowNotification(false);
        setAssignmentState(3);
        setIsPlaying(true);
        setJourneyPhase('approaching');
      });
    }, 8000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [showBookingNotifications]);

  // Handle vehicle arriving at pickup point and journey start
  useEffect(() => {
    if (journeyPhase !== 'approaching') return;

    // After 6s of approaching, driver reaches pickup location
    const tArrive = setTimeout(() => {
      setJourneyPhase('arrived_at_pickup');
    }, 6000);

    return () => clearTimeout(tArrive);
  }, [journeyPhase]);

  // Start journey function
  const handleStartJourney = useCallback(() => {
    setJourneyPhase('in_transit');
    setJourneySecondsLeft(10);
    setShowJourneyStartedBanner(true);

    Animated.sequence([
      Animated.timing(bannerFadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(bannerFadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowJourneyStartedBanner(false);
    });
  }, [bannerFadeAnim]);

  // Auto-start journey after 3.5s at pickup if user doesn't press "Board Vehicle"
  useEffect(() => {
    if (journeyPhase !== 'arrived_at_pickup') return;

    const tAutoBoard = setTimeout(() => {
      handleStartJourney();
    }, 3500);

    return () => clearTimeout(tAutoBoard);
  }, [journeyPhase, handleStartJourney]);

  // 10-second live countdown timer during in_transit
  useEffect(() => {
    if (journeyPhase !== 'in_transit') return;

    journeyTimerRef.current = setInterval(() => {
      setJourneySecondsLeft((prev) => {
        if (prev <= 1) {
          if (journeyTimerRef.current) clearInterval(journeyTimerRef.current);
          setJourneyPhase('destination_reached');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (journeyTimerRef.current) clearInterval(journeyTimerRef.current);
    };
  }, [journeyPhase]);

  // Auto-dismiss Destination Reached modal after 2 seconds and open Feedback Screen
  useEffect(() => {
    if (journeyPhase !== 'destination_reached') return;

    const tComplete = setTimeout(() => {
      setJourneyPhase('completed');
      if (onRideCompleted) {
        onRideCompleted();
      }
    }, 2000);

    return () => clearTimeout(tComplete);
  }, [journeyPhase, onRideCompleted]);

  // Modals & Sheets
  const [sheet, setSheet] = useState<'help' | 'chat' | 'safety' | 'cancel' | 'options' | null>(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const CANCEL_REASONS = [
    'Driver is taking too long',
    'Driver asked to cancel / not moving',
    'Changed my mind / Plans changed',
    'Entered wrong pickup or drop address',
    'Found alternative transport',
    'Booked by mistake',
  ];

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const handleCall = useCallback(() => {
    if (onCallDriver) {
      onCallDriver();
    } else {
      showToast(`Connecting masked free call to ${ride.driver.name} (${ride.driver.phone})…`);
    }
  }, [onCallDriver, ride.driver, showToast]);

  const handleChat = useCallback(() => {
    if (onChatDriver) {
      onChatDriver();
    } else {
      setSheet('chat');
    }
  }, [onChatDriver]);

  const handleSafety = useCallback(() => {
    setSheet('safety');
  }, []);

  const handleCancel = useCallback(() => {
    setSelectedCancelReason(null);
    setSheet('cancel');
  }, []);

  const confirmCancellation = useCallback(() => {
    if (!selectedCancelReason) {
      showToast('Please select a reason to cancel');
      return;
    }
    setSheet(null);
    if (onCancelRide) {
      onCancelRide();
    } else {
      showToast('Your ride has been cancelled with zero cancellation fee');
    }
  }, [selectedCancelReason, onCancelRide, showToast]);

  const firstName = ride.driver.name.split(' ')[0];

  // Live status subtitle & hero configuration based on journey phase
  const heroStatusText =
    journeyPhase === 'booking'
      ? 'CONNECTING DRIVER'
      : journeyPhase === 'approaching'
      ? 'DRIVER EN ROUTE'
      : journeyPhase === 'arrived_at_pickup'
      ? 'DRIVER AT PICKUP'
      : journeyPhase === 'in_transit'
      ? 'JOURNEY IN PROGRESS'
      : 'ARRIVED AT DROP';

  const heroDistanceText =
    journeyPhase === 'in_transit'
      ? `${journeySecondsLeft}s left · On way to ${ride.dropSpotName}`
      : journeyPhase === 'arrived_at_pickup'
      ? 'Driver is waiting at pickup spot'
      : ride.distanceText;

  const heroEtaMinutes =
    journeyPhase === 'in_transit'
      ? Math.max(1, Math.ceil(journeySecondsLeft / 60))
      : ride.etaMinutes;

  return (
    <View style={[styles.screen, isDark && { backgroundColor: '#121214' }]}>
      {/* 1. Pure 2D Live Tracking Map with Extended Area */}
      <View style={styles.mapContainer}>
        <LiveTrackingMap2D
          rideType={selectedRideType}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onReset={() => {}}
          driverName={ride.driver.name}
          pickupSpotName={ride.pickupSpotName}
          dropSpotName={ride.dropSpotName}
          autoCenterEnabled={autoCenter}
          onToggleAutoCenter={setAutoCenter}
          bottomOffset={12}
          journeyPhase={journeyPhase}
        />

        {/* Floating Top Header Row with OneBuddy Brand & Top-Right Help and Support */}
        <View style={[styles.topHeaderRow, { top: safeTop }]}>
          <Pressable
            style={({ pressed }) => [
              styles.topBrandPill,
              isDark && styles.topBrandPillDark,
              pressed && { opacity: 0.8 },
            ]}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go to home"
          >
            {onBack && (
              <View style={styles.backBtn}>
                <Icon name="back" size={15} color={isDark ? '#F1F1EC' : '#0F172A'} strokeWidth={2.5} />
              </View>
            )}
            <View style={styles.brandRow}>
              <Text style={[styles.brandOne, isDark && { color: '#F1F1EC' }]}>One</Text>
              <Text style={styles.brandBuddy}>Buddy</Text>
            </View>
            <View style={[styles.divider, isDark && { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </Pressable>

          {/* Floating Help and Support Button at Top-Right Corner */}
          <Pressable
            style={({ pressed }) => [
              styles.topHelpBtn,
              isDark && styles.topHelpBtnDark,
              pressed && styles.topHelpBtnPressed,
            ]}
            onPress={() => setSheet('help')}
            accessibilityRole="button"
            accessibilityLabel="Help and Support"
          >
            <View style={[styles.topHelpIconWrap, isDark && { backgroundColor: 'rgba(84, 183, 19, 0.2)' }]}>
              <Icon name="help" size={14} color={isDark ? '#66D21E' : COLORS.primaryDark} strokeWidth={2.4} />
            </View>
            <Text
              style={[
                styles.topHelpText,
                isDark && { color: '#66D21E' },
              ]}
              numberOfLines={1}
            >
              Help & Support
            </Text>
          </Pressable>
        </View>

        {/* Floating Journey Started Pop-up Banner */}
        {showJourneyStartedBanner && (
          <Animated.View
            style={[
              styles.journeyStartBanner,
              {
                top: safeTop + 48,
                opacity: bannerFadeAnim,
              },
            ]}
          >
            <View style={styles.journeyStartIcon}>
              <Ionicons name="navigate" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.journeyStartContent}>
              <Text style={styles.journeyStartTitle}>Your journey starts now!</Text>
              <Text style={styles.journeyStartSubtitle} numberOfLines={1}>
                Heading towards {ride.dropSpotName || 'your destination'} · ETA: 10s
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Top Booking Status Card (Animated 3-Phase Header) */}
        {showNotification && (
          <Animated.View
            style={[
              styles.topStatusCard,
              isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.1)' },
              {
                top: safeTop + 48,
                opacity: fadeAnim,
                transform: [{ translateY: translateYAnim }],
              },
            ]}
          >
            <View style={styles.statusHeaderRow}>
              <View
                style={[
                  styles.statusIconCircle,
                  isDark && { backgroundColor: 'rgba(84, 183, 19, 0.18)' },
                  assignmentState === 2 && (isDark ? { backgroundColor: 'rgba(84, 183, 19, 0.28)' } : styles.statusIconCircleSuccess),
                ]}
              >
                {assignmentState === 0 ? (
                  <ActivityIndicator size="small" color="#54B713" />
                ) : (
                  <Ionicons
                    name={assignmentState === 2 ? 'checkmark-done-circle' : 'checkmark-circle'}
                    size={24}
                    color="#54B713"
                  />
                )}
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusTitle, isDark && { color: '#F1F1EC' }]}>
                  {assignmentState === 0 && 'Searching for Drivers…'}
                  {assignmentState === 1 && 'Driver Found!'}
                  {assignmentState === 2 && 'Ride Booked Successfully'}
                </Text>
                <Text style={[styles.statusSubtitle, isDark && { color: '#9BA08F' }]}>
                  {assignmentState === 0 && 'Connecting with nearby partners'}
                  {assignmentState === 1 && 'Assigning vehicle to your pickup'}
                  {assignmentState === 2 && 'Driver is arriving in 3 mins'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusPhaseDots, isDark && { borderTopColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <View style={[styles.phaseDot, isDark && { backgroundColor: '#3E424B' }, assignmentState >= 0 && styles.phaseDotActive]} />
              <View style={[styles.phaseDot, isDark && { backgroundColor: '#3E424B' }, assignmentState >= 1 && styles.phaseDotActive]} />
              <View style={[styles.phaseDot, isDark && { backgroundColor: '#3E424B' }, assignmentState >= 2 && styles.phaseDotActive]} />
            </View>
          </Animated.View>
        )}
      </View>

      {/* 2. Custom OneBuddy Bottom Sheet (Takes all remaining screen space) */}
      <View style={[styles.bottomSheet, isDark && { backgroundColor: '#1D1E22' }]}>
        {/* Interactive Drag Handle to Toggle Map Space */}
        <Pressable
          style={styles.gripWrap}
          onPress={() => setIsMapExpanded((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={isMapExpanded ? 'Collapse map view' : 'Expand map view'}
        >
          <View style={[styles.grip, isDark && { backgroundColor: '#3E424B' }]} />
        </Pressable>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Row: ETA, Proximity, and Ride PIN */}
          <OneBuddyRideHero
            etaMinutes={heroEtaMinutes}
            driverName={firstName}
            distanceText={heroDistanceText}
            pin={ride.pin}
            statusText={heroStatusText}
            isDark={isDark}
          />

          {/* Unified Driver & Vehicle Card (Avatar, Plate, Model, and Vehicle Graphic) */}
          <OneBuddyDriverCard
            rideType={selectedRideType}
            driver={ride.driver}
            isDark={isDark}
          />

          {/* Action Dock (Call Driver, Chat, Safety, Cancel) */}
          <RideQuickActions
            driverFirstName={firstName}
            onCall={handleCall}
            onMessage={handleChat}
            onSafety={handleSafety}
            onCancel={handleCancel}
            isDark={isDark}
          />

          {/* Visual Route Journey (Pickup, Drop-off, Fare & Payment) */}
          <OneBuddyRouteTimeline
            pickupName={ride.pickupSpotName}
            pickupAddress={ride.pickupAddress}
            dropName={ride.dropSpotName}
            dropAddress={ride.dropAddress}
            fare={ride.fare}
            paymentMethod={ride.paymentMethod}
            onChangeDestination={() => setSheet('options')}
            isDark={isDark}
          />
        </ScrollView>
      </View>

      {/* ------------------------------------------------ Modal Sheets -- */}
      {/* 1. Quick Chat Modal */}
      <Sheet
        visible={sheet === 'chat'}
        title={`Message ${firstName}`}
        onClose={() => setSheet(null)}
      >
        <Text style={styles.sheetSubheading}>Quick messages for your driver:</Text>
        {RIDE_CHAT_OPTIONS.map((option, i) => (
          <Row
            key={i}
            title={option.title}
            chevron={false}
            onPress={() => {
              setSheet(null);
              showToast(option.toast || `Sent "${option.title}" to driver`);
            }}
          />
        ))}
      </Sheet>

      {/* 2. Safety Toolkit Modal */}
      <Sheet
        visible={sheet === 'safety'}
        title="Safety Toolkit"
        onClose={() => setSheet(null)}
      >
        <Text style={[styles.sheetSubheading, isDark && { color: '#9BA08F' }]}>
          Emergency assistance and real-time safety tools:
        </Text>
        <View style={styles.safetyRow}>
          <Pressable
            style={[styles.safetyBtn, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' }]}
            onPress={() => {
              setSheet(null);
              showToast('Connecting to Police Control Room (112)…');
            }}
          >
            <Text style={styles.safetyBtnIcon}>🚨</Text>
            <Text style={[styles.safetyBtnLabel, isDark && { color: '#F1F1EC' }]}>Emergency</Text>
          </Pressable>
          <Pressable
            style={[styles.safetyBtn, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' }]}
            onPress={() => {
              setSheet(null);
              showToast('Trip details shared with your contacts');
            }}
          >
            <Text style={styles.safetyBtnIcon}>📍</Text>
            <Text style={[styles.safetyBtnLabel, isDark && { color: '#F1F1EC' }]}>Share Trip</Text>
          </Pressable>
          <Pressable
            style={[styles.safetyBtn, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' }]}
            onPress={() => {
              setSheet(null);
              showToast('Calling OneBuddy Safety Helpline…');
            }}
          >
            <Text style={styles.safetyBtnIcon}>📞</Text>
            <Text style={[styles.safetyBtnLabel, isDark && { color: '#F1F1EC' }]}>Safety Line</Text>
          </Pressable>
        </View>
        <Text style={[styles.safetyNote, isDark && { color: '#9BA08F' }]}>
          Ride is being monitored by OneBuddy Safety team in real-time.
        </Text>
      </Sheet>

      {/* 3. Cancel Ride Modal */}
      <Sheet
        visible={sheet === 'cancel'}
        title="Why are you cancelling?"
        onClose={() => {
          setSheet(null);
          setSelectedCancelReason(null);
        }}
      >
        <Text style={[styles.sheetSubheading, isDark && { color: '#9BA08F' }]}>
          Please select a reason so we can improve your experience:
        </Text>

        <View style={styles.reasonsList}>
          {CANCEL_REASONS.map((reason) => {
            const isSelected = selectedCancelReason === reason;
            return (
              <Pressable
                key={reason}
                style={[
                  styles.reasonOption,
                  isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' },
                  isSelected && (isDark ? { backgroundColor: 'rgba(84, 183, 19, 0.15)', borderColor: '#54B713' } : styles.reasonOptionSelected),
                ]}
                onPress={() => setSelectedCancelReason(reason)}
              >
                <View style={[styles.reasonRadio, isDark && { borderColor: '#64748B' }, isSelected && styles.reasonRadioSelected]}>
                  {isSelected && <View style={styles.reasonRadioDot} />}
                </View>
                <Text style={[styles.reasonOptionText, isDark && { color: '#F1F1EC' }, isSelected && (isDark ? { color: '#F1F1EC', fontWeight: '700' } : styles.reasonOptionTextSelected)]}>
                  {reason}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.cancelConfirmBtn, !selectedCancelReason && styles.cancelConfirmBtnDisabled]}
          onPress={confirmCancellation}
          disabled={!selectedCancelReason}
        >
          <Text style={styles.cancelConfirmText}>
            {selectedCancelReason ? 'Cancel Ride' : 'Select a reason to cancel'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.keepRideBtn, isDark && { backgroundColor: '#24262B' }]}
          onPress={() => {
            setSheet(null);
            setSelectedCancelReason(null);
          }}
        >
          <Text style={[styles.keepRideText, isDark && { color: '#F1F1EC' }]}>No, Keep My Ride</Text>
        </Pressable>
      </Sheet>

      {/* 4. Help & Support Modal */}
      <HelpSupportModal
        visible={sheet === 'help'}
        onClose={() => setSheet(null)}
        ride={ride}
        onOpenSafety={() => setSheet('safety')}
        onToast={showToast}
        isDark={isDark}
      />

      {/* 5. Options / Change Destination Modal */}
      <Sheet
        visible={sheet === 'options'}
        title="Trip Options"
        onClose={() => setSheet(null)}
      >
        <Row
          title="Change Destination"
          onPress={() => {
            setSheet(null);
            showToast('Destination change request sent to driver');
          }}
        />
        <View style={{ marginTop: 8 }}>
          <Row
            title="Add a Stop"
            onPress={() => {
              setSheet(null);
              showToast('Stop added to your route');
            }}
          />
        </View>
      </Sheet>

      {/* 6. Driver Reached Pickup Spot Pop-up Modal */}
      <Modal
        visible={journeyPhase === 'arrived_at_pickup'}
        transparent
        animationType="fade"
      >
        <View style={styles.destModalBackdrop}>
          <View style={[styles.destModalCard, isDark && { backgroundColor: '#1D1E22' }]}>
            <View style={styles.destCelebrationCircle}>
              <Ionicons name="location" size={44} color="#FFFFFF" />
            </View>
            <Text style={[styles.destModalTitle, isDark && { color: '#F1F1EC' }]}>Driver has reached your location!</Text>
            <Text style={[styles.destModalSubtitle, isDark && { color: '#9BA08F' }]} numberOfLines={2}>
              {firstName} ({ride.driver.vehiclePlate}) has arrived at {ride.pickupSpotName || 'your pickup point'}.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.boardVehicleBtn,
                pressed && styles.boardVehicleBtnPressed,
              ]}
              onPress={handleStartJourney}
            >
              <Text style={styles.boardVehicleBtnText}>Board Vehicle</Text>
            </Pressable>
            <Text style={[styles.destModalAutoText, isDark && { color: '#9BA08F' }]}>Trip starting automatically…</Text>
          </View>
        </View>
      </Modal>

      {/* 7. Destination Reached Pop-up Modal (Auto disappears in 2 seconds) */}
      <Modal
        visible={journeyPhase === 'destination_reached'}
        transparent
        animationType="fade"
      >
        <View style={styles.destModalBackdrop}>
          <View style={[styles.destModalCard, isDark && { backgroundColor: '#1D1E22' }]}>
            <View style={styles.destCelebrationCircle}>
              <Ionicons name="checkmark-done-circle" size={48} color="#FFFFFF" />
            </View>
            <Text style={[styles.destModalTitle, isDark && { color: '#F1F1EC' }]}>You reached your destination!</Text>
            <Text style={[styles.destModalSubtitle, isDark && { color: '#9BA08F' }]} numberOfLines={2}>
              {ride.dropSpotName || 'Destination'}
            </Text>
            <View style={[styles.destFareBadge, isDark && { backgroundColor: 'rgba(84, 183, 19, 0.15)', borderColor: '#54B713' }]}>
              <Text style={styles.destFareText}>Fare: {ride.fare || '₹140'}</Text>
            </View>
            <Text style={[styles.destModalAutoText, isDark && { color: '#9BA08F' }]}>Opening rating & feedback…</Text>
          </View>
        </View>
      </Modal>

      {/* Toast notification overlay */}
      {toast ? <Toast message={toast} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E8F4E8',
    overflow: 'hidden',
  },

  // ── Floating Top Header ──────────────────────────────────────────────────
  topHeaderRow: {
    position: 'absolute',
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 30,
  },
  topBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    height: 40,
    gap: 7,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topBrandPillDark: {
    backgroundColor: 'rgba(29, 30, 34, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  backBtn: {
    marginRight: 2,
    padding: 2,
  },
  backArrow: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: FONTS.medium,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  brandOne: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#0F172A',
    fontWeight: '800',
    includeFontPadding: false,
  },
  brandBuddy: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#54B713',
    fontWeight: '800',
    includeFontPadding: false,
    marginRight: 2,
    paddingRight: 4,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 3,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 4,
    flexShrink: 0,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  liveText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    color: '#16A34A',
    includeFontPadding: false,
    paddingRight: 4,
  },
  topHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    height: 38,
    gap: 5,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topHelpBtnDark: {
    backgroundColor: 'rgba(29, 30, 34, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  topHelpBtnPressed: {
    opacity: 0.8,
  },
  topHelpIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHelpText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    fontWeight: '700',
    color: COLORS.primaryDark,
    includeFontPadding: false,
  },

  // ── Bottom Sheet ─────────────────────────────────────────────────────────
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  gripWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  grip: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  scrollContent: {
    paddingHorizontal: GUTTER,
    paddingBottom: 16,
    gap: 12,
  },

  // ── Modal Sheet Content ──────────────────────────────────────────────────
  sheetSubheading: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 20,
  },

  // Safety Sheet
  safetyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  safetyBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  safetyBtnIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  safetyBtnLabel: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#0F172A',
    textAlign: 'center',
  },
  safetyNote: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 17,
  },

  // Cancel Sheet
  reasonsList: {
    marginBottom: 16,
    gap: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  reasonOptionSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: COLORS.primary,
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reasonRadioSelected: {
    borderColor: COLORS.primary,
  },
  reasonRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  reasonOptionText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#334155',
    flex: 1,
  },
  reasonOptionTextSelected: {
    fontFamily: FONTS.bold,
    color: '#0F172A',
  },
  cancelConfirmBtn: {
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cancelConfirmBtnDisabled: {
    backgroundColor: '#FDA4AF',
    opacity: 0.65,
  },
  cancelConfirmText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  keepRideBtn: {
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepRideText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: '#0F172A',
  },

  // ── 3-Phase Booking Status Card ───────────────────────────────────────────
  topStatusCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIconCircleSuccess: {
    backgroundColor: '#BBF7D0',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#64748B',
  },
  statusPhaseDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  phaseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  phaseDotActive: {
    width: 20,
    backgroundColor: '#16A34A',
  },

  // Destination Reached Modal
  destModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  destModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  destCelebrationCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#54B713',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#54B713',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  destModalTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#0F172A',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  destModalSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
  },
  destFareBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 14,
  },
  destFareText: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '800',
  },
  destModalAutoText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: FONTS.medium,
  },
  boardVehicleBtn: {
    width: '100%',
    backgroundColor: '#54B713',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#54B713',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  boardVehicleBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  boardVehicleBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONTS.bold,
  },

  // Floating Journey Started Top Banner
  journeyStartBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 40,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#54B713',
  },
  journeyStartIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#54B713',
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyStartContent: {
    flex: 1,
  },
  journeyStartTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  journeyStartSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
});
