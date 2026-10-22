import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MapView, Marker } from '../components/MockMap';
import { COLORS, FONTS, RADIUS, useRideTheme } from '../theme';

interface RideAssigningProps {
  route?: {
    params?: {
      vehicle?: any;
      pickup?: any;
      destination?: string;
      price?: number;
    };
  };
  onDriverAssigned?: (bookingData: any) => void;
  onCancelRide?: () => void;
  onBack?: () => void;
  isDark?: boolean;
}

const { width } = Dimensions.get('window');
const ASSIGNING_DURATION_SEC = 8; // 8 seconds to assign

export const RideAssigningScreen: React.FC<RideAssigningProps> = ({
  route,
  onDriverAssigned,
  onCancelRide,
  onBack,
  isDark: isDarkProp,
}) => {
  const theme = useRideTheme();
  const isDark = isDarkProp ?? theme.isDark;
  const insets = useSafeAreaInsets();

  // Safe top offset so top elements sit comfortably below the Android status bar / clock
  const safeTop = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  ) + 10;
  const vehicle = route?.params?.vehicle || { name: 'Auto', baseFare: 89, type: 'auto' };
  const pickup = route?.params?.pickup || {
    title: '1373, Madhapur, Hyderabad',
    subtitle: 'VIP Hills, Jaihind Enclave',
    latitude: 17.368,
    longitude: 78.485,
    fare: 89,
  };
  const destination = route?.params?.destination || 'Ammerpet, Hyderabad';
  const rawDest = route?.params?.destination as any;
  const destinationTitle = typeof rawDest === 'string'
    ? rawDest
    : (rawDest?.title || 'Destination');
  const pickupTitle = pickup?.title || pickup?.subtitle || '1373, Madhapur, Hyderabad';
  const pickupSubtitle = pickup?.subtitle || pickup?.description || 'VIP Hills, Jaihind Enclave';
  const baseFare = Number(route?.params?.price || vehicle?.baseFare || 89);

  const [boostAmount, setBoostAmount] = useState<number>(0);
  const [boostConfirmed, setBoostConfirmed] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(ASSIGNING_DURATION_SEC);
  const [isAssigned, setIsAssigned] = useState<boolean>(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState<boolean>(false);

  // Centered Alert animation state
  const [centerAlert, setCenterAlert] = useState<{
    visible: boolean;
    title: string;
    subtitle: string;
    icon: 'car' | 'checkmark-circle' | 'time';
    color: string;
  }>({
    visible: true,
    title: 'Ride requested',
    subtitle: 'Finding drivers nearby for your pickup…',
    icon: 'car',
    color: '#54B713',
  });

  const centerAlertFade = useRef(new Animated.Value(0)).current;
  const centerAlertScale = useRef(new Animated.Value(0.85)).current;
  const progressBarAnim = useRef(new Animated.Value(0)).current;
  const isTransitioningRef = useRef(false);

  const pickupCoord = {
    latitude: pickup.latitude || 17.355,
    longitude: pickup.longitude || 78.405,
  };
  const dropCoord = {
    latitude: 17.425,
    longitude: 78.475,
  };

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  // Hardware back press listener
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  // Show center alert smoothly
  const triggerCenterAlert = useCallback((
    title: string,
    subtitle: string,
    icon: 'car' | 'checkmark-circle' | 'time',
    color: string,
    autoHideMs = 3000
  ) => {
    setCenterAlert({ visible: true, title, subtitle, icon, color });
    Animated.parallel([
      Animated.timing(centerAlertFade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(centerAlertScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    if (autoHideMs > 0) {
      setTimeout(() => {
        Animated.timing(centerAlertFade, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setCenterAlert((prev) => ({ ...prev, visible: false }));
        });
      }, autoHideMs);
    }
  }, [centerAlertFade, centerAlertScale]);

  // Initial center alert on mount
  useEffect(() => {
    triggerCenterAlert(
      'Ride requested',
      'Finding drivers nearby for your pickup…',
      'car',
      '#54B713',
      3200
    );
  }, [triggerCenterAlert]);

  // Animated progress bar filling across 60 seconds
  useEffect(() => {
    Animated.timing(progressBarAnim, {
      toValue: 1,
      duration: ASSIGNING_DURATION_SEC * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [progressBarAnim]);

  // 1-minute countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // When timer hits 0 or driver is assigned
  useEffect(() => {
    if (secondsLeft === 0 && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      setIsAssigned(true);

      const driverName = vehicle.driverName || 'Driver';
      const plate = vehicle.plate || '';

      // Trigger smooth centered alert: "Driver assigned"
      triggerCenterAlert(
        'Driver assigned!',
        plate ? `${driverName} (${plate}) is on the way to pick you up.` : `${driverName} is on the way to pick you up.`,
        'checkmark-circle',
        '#16A34A',
        0 // keep visible until transition
      );

      // Smoothly navigate to Live Tracking after 1.8 seconds
      const timeout = setTimeout(() => {
        if (onDriverAssigned) {
          onDriverAssigned({
            vehicle: {
              ...vehicle,
              driverName,
              plate,
            },
            pickup,
            destination,
            price: baseFare + boostAmount,
          });
        }
      }, 1800);

      return () => clearTimeout(timeout);
    }
  }, [secondsLeft, onDriverAssigned, triggerCenterAlert, vehicle, pickup, destination, baseFare, boostAmount]);

  const currentPrice = (baseFare + boostAmount).toFixed(2);

  const vehicleLabel =
    vehicle?.name ||
    (vehicle?.type === 'bike' ? 'Bike' : vehicle?.type === 'auto' ? 'Auto' : 'Cab');

  return (
    <View style={styles.container}>
      {/* 1. Map Section with Loading Overlay */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          showRoute={true}
          pickupCoord={pickupCoord}
          destCoord={dropCoord}
          showLandmarks={false}
          showOneBuddyOverlay={true}
          rideType={vehicle?.type || vehicle?.id || 'auto'}
          overlayTop="11%"
          overlayLeft="50%"
          overlaySize={54}
        >
          <Marker
            coordinate={pickupCoord}
            title={pickupTitle}
            type="pickup"
          />
          <Marker
            coordinate={dropCoord}
            title={destinationTitle}
            isDestination={true}
            type="drop"
          />
          {isAssigned && (
            <Marker
              coordinate={{
                latitude: pickupCoord.latitude + 0.007,
                longitude: pickupCoord.longitude + 0.008,
              }}
              title={vehicle?.plate ? `${vehicle.driverName || 'Driver'} (${vehicle.plate})` : (vehicle?.driverName || 'Driver')}
              type="vehicle"
              rideType={vehicle?.type || vehicle?.id || 'auto'}
            />
          )}
        </MapView>

        {/* Floating Top Header Row with Back Button & Status Pill */}
        <View style={[styles.topHeaderRow, { top: safeTop }]}>
          <TouchableOpacity
            style={[
              styles.floatingBackButton,
              isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.12)' },
            ]}
            onPress={handleBack}
            activeOpacity={0.8}
            accessibilityLabel="Go back to check pickup"
          >
            <Ionicons name="chevron-down" size={24} color={isDark ? '#F1F1EC' : '#0F172A'} />
          </TouchableOpacity>

          <View style={[styles.topHeaderPill, isDark && styles.topHeaderPillDark]}>
            <View style={styles.topHeaderPillDot} />
            <Text
              style={[styles.topHeaderPillText, isDark && { color: '#F1F1EC' }]}
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {isAssigned ? 'Driver Assigned' : 'Finding Drivers Nearby'}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Middle-of-the-Page Smooth User-Friendly Alert */}
      {centerAlert.visible && (
        <Animated.View
          style={[
            styles.centerAlertCard,
            {
              opacity: centerAlertFade,
              transform: [{ scale: centerAlertScale }],
            },
            isDark && { backgroundColor: 'rgba(29, 30, 34, 0.98)', borderColor: 'rgba(84, 183, 19, 0.3)' },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.centerAlertIconCircle, { backgroundColor: isDark ? '#24262B' : '#F0FDF4' }]}>
            <Ionicons name={centerAlert.icon} size={28} color={centerAlert.color} />
          </View>
          <Text style={[styles.centerAlertTitle, isDark && { color: '#F1F1EC' }]}>{centerAlert.title}</Text>
          <Text style={[styles.centerAlertSubtitle, isDark && { color: '#9BA08F' }]}>{centerAlert.subtitle}</Text>
          <View style={[styles.centerAlertTimerPill, isDark && { backgroundColor: 'rgba(84, 183, 19, 0.15)', borderColor: 'rgba(84, 183, 19, 0.3)' }]}>
            <Ionicons name="timer-outline" size={13} color={isDark ? '#66D21E' : '#16A34A'} style={{ marginRight: 4 }} />
            <Text style={[styles.centerAlertTimerText, isDark && { color: '#66D21E' }]}>
              {isAssigned ? 'Confirmed' : `Assigning in ${secondsLeft}s`}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* 3. Bottom Sheet Matching Screenshot */}
      <View style={[styles.bottomSheet, isDark && { backgroundColor: '#1D1E22' }]}>
        <View style={[styles.dragHandle, isDark && { backgroundColor: '#3E424B' }]} />

        {/* Header Title & Subtitle */}
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, isDark && { color: '#F1F1EC' }]}>
            {isAssigned ? 'Driver assigned' : 'Ride requested'}
          </Text>
          <Text style={[styles.sheetSubtitle, isDark && { color: '#9BA08F' }]}>
            {isAssigned
              ? 'Connecting you to your live driver…'
              : `Finding drivers nearby · ${secondsLeft}s`}
          </Text>
        </View>

        {/* Animated Loading Bar */}
        <View style={[styles.progressBarTrack, isDark && { backgroundColor: '#24262B' }]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressBarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScrollContent}
        >
          {/* Card 0: Pickup & Drop Location Names */}
          <View style={[styles.locationsCard, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
            <View style={styles.locationsRow}>
              {/* Route Indicator: Green Square -> Line -> Green Circle */}
              <View style={styles.locationsIndicatorCol}>
                <View style={styles.pickupSquareDot} />
                <View style={[styles.locationLineConnector, isDark && { backgroundColor: '#3E424B' }]} />
                <View style={styles.dropCircleDot} />
              </View>

              {/* Location details */}
              <View style={styles.locationsContentCol}>
                {/* Pickup Location */}
                <View style={styles.locationItemBlock}>
                  <Text style={[styles.locationMiniTag, { color: '#EF4444' }]}>PICKUP LOCATION</Text>
                  <Text style={[styles.locationMainTitle, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>
                    {pickupTitle}
                  </Text>
                  {pickupSubtitle && pickupSubtitle !== pickupTitle ? (
                    <Text style={[styles.locationSubText, isDark && { color: '#9BA08F' }]} numberOfLines={1}>
                      {pickupSubtitle}
                    </Text>
                  ) : null}
                </View>

                {/* Divider between pickup and drop */}
                <View style={[styles.locationItemDivider, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />

                {/* Drop Location */}
                <View style={styles.locationItemBlock}>
                  <Text style={[styles.locationMiniTag, { color: '#54B713' }]}>DROP LOCATION</Text>
                  <Text style={[styles.locationMainTitle, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>
                    {destinationTitle}
                  </Text>
                  <Text style={[styles.locationSubText, isDark && { color: '#9BA08F' }]} numberOfLines={1}>
                    Destination point
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Card 1: Vehicle & Pickup Details */}
          <View style={[styles.detailsCard, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
            <View style={styles.detailsLeft}>
              <Text style={[styles.detailsTypeLabel, isDark && { color: '#9BA08F' }]}>{vehicleLabel} details</Text>
              <Text style={[styles.detailsMainHeading, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>
                Meet at the pickup point
              </Text>
              <View style={[styles.cashBadge, isDark && { backgroundColor: 'rgba(84, 183, 19, 0.16)' }]}>
                <Ionicons name="cash-outline" size={13} color={isDark ? '#66D21E' : '#16A34A'} style={{ marginRight: 4 }} />
                <Text style={[styles.cashBadgeText, isDark && { color: '#66D21E' }]}>Cash</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.moreOptionsButton, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' }]}
              onPress={() => setShowOptionsSheet(true)}
              hitSlop={8}
              accessibilityLabel="Ride options"
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={isDark ? '#F1F1EC' : '#64748B'} />
            </TouchableOpacity>
          </View>

          {/* Card 2: Fare Boost (Add extra to get a faster ride) */}
          <View style={[styles.boostCard, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
            <Text style={[styles.boostTitle, isDark && { color: '#F1F1EC' }]}>Add extra to get a faster ride</Text>

            <View style={styles.chipsRow}>
              {[20, 30, 40].map((amount) => {
                const isSelected = boostAmount === amount;
                return (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.boostChip,
                      isDark && { backgroundColor: '#1D1E22' },
                      isSelected && styles.boostChipSelected,
                      isSelected && isDark && { backgroundColor: 'rgba(84, 183, 19, 0.18)', borderColor: '#54B713' },
                    ]}
                    onPress={() => {
                      setBoostAmount(isSelected ? 0 : amount);
                      setBoostConfirmed(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.boostChipText,
                        isDark && { color: '#F1F1EC' },
                        isSelected && styles.boostChipTextSelected,
                        isSelected && isDark && { color: '#66D21E' },
                      ]}
                    >
                      +₹{amount}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.priceRow}>
              <Ionicons name="cash-outline" size={16} color={isDark ? '#9BA08F' : '#0F172A'} style={{ marginRight: 6 }} />
              <Text style={[styles.currentPriceLabel, isDark && { color: '#9BA08F' }]}>
                Current price: <Text style={[styles.currentPriceValue, isDark && { color: '#F1F1EC' }]}>₹{currentPrice}</Text>
              </Text>
            </View>

            <Text style={[styles.boostNote, isDark && { color: '#9BA08F' }]}>
              100% of the extra amount goes to your driver.
            </Text>

            <TouchableOpacity
              style={[
                styles.confirmBoostBtn,
                (boostAmount === 0 || boostConfirmed) && (isDark ? { backgroundColor: '#1D1E22' } : styles.confirmBoostBtnDisabled),
              ]}
              onPress={() => {
                if (boostAmount > 0) {
                  setBoostConfirmed(true);
                  triggerCenterAlert(
                    'Fare boosted!',
                    `+₹${boostAmount} added to prioritize your ride.`,
                    'checkmark-circle',
                    '#54B713',
                    2500
                  );
                }
              }}
              disabled={boostAmount === 0 || boostConfirmed}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.confirmBoostBtnText,
                  (boostAmount === 0 || boostConfirmed) && (isDark ? { color: '#64748B' } : styles.confirmBoostBtnTextDisabled),
                ]}
              >
                {boostConfirmed ? 'Boost Applied' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card 3: Promo & Safety Card */}
          <View style={[styles.promoCard, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(84, 183, 19, 0.25)' }]}>
            <View style={styles.promoBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#54B713" />
              <Text style={styles.promoBadgeText}>OneBuddy Safety First</Text>
            </View>
            <Text style={[styles.promoTitle, isDark && { color: '#F1F1EC' }]}>Verified Drivers & Live Route Tracking</Text>
            <Text style={[styles.promoSubtitle, isDark && { color: '#9BA08F' }]}>
              Every ride is monitored 24/7 with emergency SOS support and driver background verification.
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Trip Options Sheet Modal */}
      <Modal
        visible={showOptionsSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsSheet(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowOptionsSheet(false)}>
          <View style={[styles.modalContent, isDark && { backgroundColor: '#1D1E22' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && { color: '#F1F1EC' }]}>Ride Options</Text>
              <TouchableOpacity onPress={() => setShowOptionsSheet(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={isDark ? '#F1F1EC' : '#0F172A'} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.optionsActionRow, isDark && { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}
              onPress={() => {
                setShowOptionsSheet(false);
                handleBack();
              }}
            >
              <Ionicons name="arrow-back-outline" size={20} color={isDark ? '#F1F1EC' : '#0F172A'} />
              <Text style={[styles.optionsActionText, isDark && { color: '#F1F1EC' }]}>Change Pickup Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionsActionRow, { borderBottomWidth: 0 }]}
              onPress={() => {
                setShowOptionsSheet(false);
                if (onCancelRide) {
                  onCancelRide();
                } else {
                  handleBack();
                }
              }}
            >
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              <Text style={[styles.optionsActionText, { color: '#EF4444' }]}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FCF7',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  topHeaderRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 30,
    gap: 10,
  },
  floatingBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 14,
    height: 40,
    borderRadius: RADIUS.pill,
    gap: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    flexShrink: 1,
  },
  topHeaderPillDark: {
    backgroundColor: 'rgba(29, 30, 34, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  topHeaderPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#54B713',
  },
  topHeaderPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    includeFontPadding: false,
  },
  floatingSafetyButton: {
    position: 'absolute',
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 20,
  },
  safetyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: FONTS.semiBold,
  },

  // ── Center Alert Card ────────────────────────────────────────────────────
  centerAlertCard: {
    position: 'absolute',
    top: '32%',
    left: 24,
    right: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 16,
    zIndex: 100,
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
  },
  centerAlertIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  centerAlertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 3,
  },
  centerAlertSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 18,
  },
  centerAlertTimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  centerAlertTimerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },

  // ── Bottom Sheet ─────────────────────────────────────────────────────────
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
    maxHeight: '52%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  progressBarTrack: {
    width: '100%',
    height: 3.5,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  sheetScrollContent: {
    gap: 12,
    paddingBottom: 16,
  },

  // Card 1
  detailsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  detailsLeft: {
    flex: 1,
  },
  detailsTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  detailsMainHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  cashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cashBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  moreOptionsButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Card 2: Boost Fare
  boostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  boostTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  boostChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  boostChipSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#54B713',
  },
  boostChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  boostChipTextSelected: {
    color: '#15803D',
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentPriceLabel: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  currentPriceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  boostNote: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    marginTop: 2,
  },
  confirmBoostBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#54B713',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBoostBtnDisabled: {
    backgroundColor: '#F1F5F9',
  },
  confirmBoostBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmBoostBtnTextDisabled: {
    color: '#94A3B8',
  },

  // Card 3: Promo / Safety
  promoCard: {
    backgroundColor: '#F8FCF7',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    padding: 16,
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  promoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  safetyOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  safetyOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  optionsActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionsActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  locationsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  locationsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  locationsIndicatorCol: {
    width: 20,
    alignItems: 'center',
    paddingVertical: 4,
    marginRight: 10,
  },
  pickupSquareDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    borderWidth: 0,
  },
  pickupCircleDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    borderWidth: 0,
  },
  locationLineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: '#CBD5E1',
    marginVertical: 4,
    minHeight: 28,
  },
  dropCircleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#54B713',
    borderWidth: 0,
  },
  dropSquareDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#54B713',
    borderWidth: 0,
  },
  locationsContentCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  locationItemBlock: {
    justifyContent: 'center',
  },
  locationMiniTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  locationMainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  locationSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  locationItemDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
});

export default RideAssigningScreen;
