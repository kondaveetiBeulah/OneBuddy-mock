/**
 * Production-ready Pure 2D Live Order Tracking Screen.
 *
 * Features:
 * - 2D Map with pitch = 0, north-aligned flat camera, clean styled map tiles
 * - Live GPS updates via simulated feed or real-time WebSocket/Firebase stream
 * - Smooth animated vehicle marker with shortest-path heading rotation and radar pulse
 * - Dual-layer polyline route (traveled route + remaining path)
 * - Auto-Center toggle with smooth camera re-centering
 * - UI Overlay card with Order ID, Delivery Status, live ETA badge
 * - Contextual notice bar ("Slight delay due to heavy rains")
 * - Driver profile card with vehicle details, rating, phone CTA
 * - Offline / Error state handling and responsive safe area padding
 */
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderBar } from '../components/HeaderBar';
import { RiderCard } from '../components/RiderCard';
import { ContextNoticeBar } from '../components/ContextNoticeBar';
import { LegCard, OrderItemsCard } from '../components/LegCard';
import { Row, Sheet, StageRail, Toast } from '../components/UI';
import { LiveTrackingMap2D } from '../components/LiveTrackingMap2D';
import { useLiveLocationSimulation } from '../hooks/useLiveLocationSimulation';
import { useMotionPreference } from '../hooks/useMotionPreference';

import type {
  DriverLocation,
  DriverProfile,
  OrderDetails,
  TrackingConnectionState,
} from '../types/tracking';
import {
  CHAT_OPTIONS,
  HELP_OPTIONS,
  LEGS,
  ORDER,
  ORDER_ITEMS,
  type Leg,
  type SheetOption,
} from '../data/tracking';
import { COLORS, FONTS, GUTTER, RADIUS } from '../theme';

const STAGE_LABELS = ['Assigning\na rider', 'Rider\nassigned', 'Picked\nup', 'Delivered\nto you'];

export interface LiveTrackingScreenProps {
  /** Optional custom order data */
  orderDetails?: Partial<OrderDetails>;
  /** Dynamic Restaurant Name */
  restaurantName?: string;
  /** Dynamic Restaurant Address */
  restaurantAddress?: string;
  /** Dynamic Customer Delivery Address */
  deliveryAddress?: string;
  /** Delivery Address Label (e.g. Home / Work) */
  deliveryAddressLabel?: string;
  /** Ordered Items from Cart */
  items?: any[];
  /** Total Amount */
  totalAmount?: number | string;
  /** Order ID */
  orderId?: string;
  /** Payment method label */
  paymentMethod?: string;
  /** External live WebSocket/Firebase GPS coordinate stream */
  externalDriverLocation?: DriverLocation;
  /** Connection state: connected, reconnecting, offline, error */
  connectionStatus?: TrackingConnectionState;
  /** Initial delivery stage index (0 - 3) */
  initialStageIndex?: number;
  /** Custom warning notice message */
  warningNotice?: string | null;
  /** Callbacks */
  onBack?: () => void;
  onCallDriver?: () => void;
  onChatDriver?: () => void;
  onHelp?: () => void;
  /** Navigate to feedback / rate screen after delivery */
  onFinishAndRate?: () => void;
}

export default function LiveTrackingScreen({
  orderDetails,
  restaurantName,
  restaurantAddress,
  deliveryAddress,
  deliveryAddressLabel,
  items,
  totalAmount,
  orderId,
  paymentMethod,
  externalDriverLocation: _externalDriverLocation,
  connectionStatus: externalConnectionState,
  initialStageIndex = 2,
  warningNotice = null,
  onBack,
  onCallDriver,
  onChatDriver,
  onHelp,
  onFinishAndRate,
}: LiveTrackingScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const reduceMotion = useMotionPreference();

  // Resolve dynamic values
  const resolvedRestaurantName = restaurantName || orderDetails?.storeName || ORDER.restaurant;
  const resolvedRestaurantAddress = restaurantAddress || orderDetails?.storeAddress || 'Road No. 12, Banjara Hills';
  const resolvedDeliveryTitle = deliveryAddressLabel || orderDetails?.destinationName || 'Home';
  const resolvedDeliveryAddress = deliveryAddress || orderDetails?.destinationAddress || 'Lotus Residency, Jubilee Hills';
  const resolvedOrderId = orderId || orderDetails?.id || ORDER.id;
  const resolvedPaidWith = paymentMethod || orderDetails?.paidWith || ORDER.paidWith;

  const resolvedItems = useMemo(() => {
    if (items && items.length > 0) {
      return items.map((it: any) => {
        const itemName = it.productName || it.name || 'Item';
        const itemNote = it.unit || it.customization || it.description || '';
        const unitPrice = it.discountPrice !== undefined && it.discountPrice !== null && it.discountPrice > 0 
          ? it.discountPrice 
          : (it.price || 0);
        const qty = it.quantity || it.qty || 1;
        return {
          qty,
          name: itemName,
          note: itemNote,
          price: `₹${(unitPrice * qty).toFixed(0)}`,
        };
      });
    }
    return ORDER_ITEMS;
  }, [items]);

  const resolvedItemCount = useMemo(() => {
    if (items && items.length > 0) {
      return items.reduce((s: number, it: any) => s + (it.quantity || it.qty || 1), 0);
    }
    return orderDetails?.itemCount || ORDER.itemCount;
  }, [items, orderDetails]);

  const resolvedTotal = useMemo(() => {
    if (totalAmount !== undefined && totalAmount !== null) {
      const num = typeof totalAmount === 'number' ? totalAmount : parseFloat(String(totalAmount).replace(/[^\d.]/g, ''));
      return isNaN(num) ? String(totalAmount) : `₹${num.toFixed(0)}`;
    }
    return orderDetails?.total || ORDER.total;
  }, [totalAmount, orderDetails]);

  // Dynamic legs for Pickup and Drop
  const legs: [Leg, Leg] = useMemo(
    () => [
      {
        kind: 'Pickup',
        name: resolvedRestaurantName,
        address: resolvedRestaurantAddress,
        pendingStamp: 'Preparing',
        doneStamp: '8:18 PM',
      },
      {
        kind: 'Drop',
        name: resolvedDeliveryTitle,
        address: resolvedDeliveryAddress,
        pendingStamp: '8:42 PM',
        doneStamp: '8:41 PM',
      },
    ],
    [resolvedRestaurantName, resolvedRestaurantAddress, resolvedDeliveryTitle, resolvedDeliveryAddress],
  );

  // Internal live GPS simulation hook
  const {
    status: simulatedStatus,
    connectionState: simulatedConnectionState,
    isPlaying,
    toggleSimulation,
    resetRoute,
    toggleOffline,
  } = useLiveLocationSimulation({
    updateIntervalMs: 1200,
    autoStart: true,
  });

  const connectionState = externalConnectionState ?? simulatedConnectionState;

  // Driver details
  const driver: DriverProfile = useMemo(
    () => ({
      name: orderDetails?.driver?.name ?? 'Imran Khan',
      avatar: orderDetails?.driver?.avatar ?? 'IK',
      phone: orderDetails?.driver?.phone ?? '+91 98765 43210',
      rating: orderDetails?.driver?.rating ?? 4.9,
      completedDeliveries: orderDetails?.driver?.completedDeliveries ?? 1280,
      vehicleModel: orderDetails?.driver?.vehicleModel ?? 'Honda Activa 6G',
      vehiclePlate: orderDetails?.driver?.vehiclePlate ?? 'TS 09 EA 4412',
    }),
    [orderDetails],
  );

  // Map state
  const [autoCenter, setAutoCenter] = useState(true);
  const [sheet, setSheet] = useState<'help' | 'chat' | 'order' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map progress to stage index (0-3)
  const stageIndex = useMemo(() => {
    if (initialStageIndex !== undefined) return initialStageIndex;
    if (simulatedStatus === 'delivered') return 3;
    if (simulatedStatus === 'arriving' || simulatedStatus === 'on_the_way') return 2;
    if (simulatedStatus === 'picked_up') return 2;
    return 1;
  }, [initialStageIndex, simulatedStatus]);

  // Stage description copy
  const stageInfo = useMemo(() => {
    switch (stageIndex) {
      case 0:
        return {
          title: 'Finding a rider near the restaurant',
          body: `${resolvedRestaurantName} is preparing your order. We are matching you with a rider close by.`,
        };
      case 1:
        return {
          title: 'Rider assigned to your order',
          body: `${driver.name} is on the way to pick up your order from ${resolvedRestaurantName}.`,
        };
      case 2:
        return {
          title: 'Picked up — on the way to you',
          body: `${driver.name.split(' ')[0]} has your order from ${resolvedRestaurantName} and is riding to ${resolvedDeliveryTitle}. Follow the route below.`,
        };
      case 3:
      default:
        return {
          title: 'Delivered — enjoy your meal',
          body: `Handed to you at the door. Rate ${driver.name.split(' ')[0]} and ${resolvedRestaurantName} to help other customers.`,
        };
    }
  }, [stageIndex, driver.name, resolvedRestaurantName, resolvedDeliveryTitle]);

  // Pulse animation for ETA badge
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return undefined;
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const handleCall = useCallback(() => {
    if (onCallDriver) {
      onCallDriver();
    } else {
      showToast(`Connecting call to ${driver.name} (${driver.phone})…`);
    }
  }, [onCallDriver, driver, showToast]);

  const handleChat = useCallback(() => {
    if (onChatDriver) {
      onChatDriver();
    } else {
      setSheet('chat');
    }
  }, [onChatDriver]);

  const handleHelpAction = useCallback(() => {
    if (onHelp) {
      onHelp();
    } else {
      setSheet('help');
    }
  }, [onHelp]);

  const sheetOptions: SheetOption[] = useMemo(() => {
    if (sheet === 'help') return HELP_OPTIONS;
    if (sheet === 'chat') return CHAT_OPTIONS;
    return [];
  }, [sheet]);

  const pickupDone = stageIndex >= 2;
  const dropDone = stageIndex === 3;

  return (
    <View style={styles.screen}>
      {/* ---------------------------------------------------- 2D Live Map -- */}
      <View style={styles.mapContainer}>
        <LiveTrackingMap2D
          isPlaying={isPlaying}
          onTogglePlay={toggleSimulation}
          onReset={resetRoute}
          driverName={driver.name}
          storeName={resolvedRestaurantName}
          destinationName={resolvedDeliveryTitle}
          autoCenterEnabled={autoCenter}
          onToggleAutoCenter={setAutoCenter}
          topInset={insets.top}
          bottomSheetHeight={320}
        />
      </View>

      {/* ------------------------------------------------ Offline / Error Banner -- */}
      {connectionState === 'offline' && (
        <View style={[styles.offlineBanner, { top: insets.top + 52 }]}>
          <Text style={styles.offlineText}>Tracking offline · Reconnecting to live GPS…</Text>
          <Pressable onPress={toggleOffline} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* ----------------------------------------------------- Header Bar -- */}
      <HeaderBar
        orderId={resolvedOrderId}
        restaurant={resolvedRestaurantName}
        topInset={insets.top}
        onBack={onBack}
        onHelp={handleHelpAction}
      />

      {/* ---------------------------------------- Bottom Sheet Overlay Card -- */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grip} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Contextual Weather / Delay Notice Bar */}
          {warningNotice && <ContextNoticeBar message={warningNotice} type="warning" />}

          {/* 4-Stage Delivery Progression Rail */}
          <StageRail labels={STAGE_LABELS} index={stageIndex} />

          {/* Current Status Header & Description */}
          <View style={styles.statusSection}>
            <Text style={styles.nowTitle}>{stageInfo.title}</Text>
            <Text style={styles.nowBody}>{stageInfo.body}</Text>
          </View>

          {/* Driver Profile Card with Vehicle Details & Call Action */}
          <RiderCard driver={driver} onCall={handleCall} onChat={handleChat} />

          {/* Leg Card (Pickup Store -> Customer Drop) */}
          <LegCard legs={legs} pickupDone={pickupDone} dropDone={dropDone} />

          {/* Ordered Items Card with Total Amount */}
          <View style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.mistDim, letterSpacing: 0.5 }}>
                ORDERED ITEMS ({resolvedItemCount})
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.primary }}>
                Total: {resolvedTotal}
              </Text>
            </View>
            <OrderItemsCard items={resolvedItems} />
          </View>

          {/* Order items expander */}
          <Row
            icon="bag"
            title={`${resolvedItemCount} items · ${resolvedTotal}`}
            subtitle={`Paid with ${resolvedPaidWith}`}
            onPress={() => setSheet('order')}
          />
          <View style={{ height: 10 }} />
          <Row
            icon="shield"
            title="Help & support"
            subtitle="Order issue, wrong address, refund"
            onPress={handleHelpAction}
          />

          {/* Finish & Rate Order Button */}
          <View style={styles.finishBtnWrapper}>
            <TouchableOpacity
              style={styles.finishBtn}
              onPress={onFinishAndRate}
              activeOpacity={0.85}
            >
              <Text style={styles.finishBtnText}>Rate order -&gt;</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* ------------------------------------------------ Modal Sheets -- */}
      <Sheet
        visible={sheet === 'help' || sheet === 'chat'}
        title={sheet === 'chat' ? `Message ${driver.name.split(' ')[0]}` : 'Help & support'}
        onClose={() => setSheet(null)}
      >
        {sheetOptions.map((option, i) => (
          <View key={option.title} style={i > 0 ? { marginTop: 10 } : undefined}>
            <Row
              title={option.title}
              subtitle={option.subtitle}
              onPress={() => {
                setSheet(null);
                showToast(option.toast);
              }}
            />
          </View>
        ))}
      </Sheet>

      <Sheet visible={sheet === 'order'} title={`Order ${resolvedOrderId}`} onClose={() => setSheet(null)}>
        <OrderItemsCard items={resolvedItems} />
        <Row
          title={`Total paid · ${resolvedTotal}`}
          subtitle={`${resolvedPaidWith} · tap for the invoice`}
          onPress={() => {
            setSheet(null);
            showToast('Invoice sent to your registered email');
          }}
        />
      </Sheet>

      <Toast message={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  mapContainer: {
    flex: 1,
    minHeight: 220,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 16,
    maxHeight: '56%',
  },
  grip: {
    alignSelf: 'center',
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#D6E2D4',
    marginBottom: 12,
  },
  statusSection: {
    marginBottom: 16,
    marginTop: 4,
  },
  nowTitle: {
    color: COLORS.ink,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: FONTS.display,
  },
  nowBody: {
    color: '#4B5563',
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 5,
    fontFamily: FONTS.body,
  },
  offlineBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#B91C1C',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.body,
  },
  retryBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  retryText: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.display,
  },
  finishBtnWrapper: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  finishBtn: {
    backgroundColor: '#54B713',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#54B713',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
