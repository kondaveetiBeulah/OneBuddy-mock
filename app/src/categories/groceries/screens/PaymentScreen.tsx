import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Image,
  Modal,
  Platform,
  Dimensions,
  StatusBar,
  Easing,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { CartItem } from '../types';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { orderService } from '../services/orderService';
import { storageHelper, STORAGE_KEYS } from '../utils/helpers';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation.types';
import { colors, typography, spacing, useGroceryColors } from '../theme';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

// ─── Theme & Colors ────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  get background() { return colors.background; },
  get surface() { return colors.cardBackground; },
  get surfaceLight() { return colors.background; },
  get surfaceHighlight() { return colors.primaryLight; },
  get accent() { return colors.primary; },
  get accentDark() { return colors.primaryDark; },
  get accentLight() { return colors.primaryLight; },
  razorpayBlue: '#0C2340',
  razorpayAccent: '#3395FF',
  razorpayDark: '#07162C',
  get textPrimary() { return colors.textPrimary; },
  get textSecondary() { return colors.textSecondary; },
  get textMuted() { return colors.textMuted; },
  get border() { return colors.border; },
  get borderLight() { return colors.borderLight; },
  get success() { return colors.success; },
  get successLight() { return colors.successLight; },
  get warning() { return colors.warning; },
  get error() { return colors.danger; },
  cardRadius: 18,
  pillRadius: 24,
};

// ─── Types ─────────────────────────────────────────────────────────────────
export type PaymentMode = 'upi' | 'card' | 'netbanking' | 'onebuddywallet' | 'wallet' | 'cod';

export interface BankOption {
  id: string;
  name: string;
  code: string;
  iconText: string;
  color: string;
  popular?: boolean;
}

export interface WalletOption {
  id: string;
  name: string;
  iconText: string;
  color: string;
  balance: number;
}

export interface PaymentCheckoutScreenProps {
  grandTotal?: number;
  cartItems?: CartItem[];
  couponDiscount?: number;
  tip?: number;
  onBack?: () => void;
  onOrderSuccess?: (orderDetails: any) => Promise<string | null | any> | void;
  onRedirectToConfirmation?: (orderId: string) => void;
}

// ─── Preset Data ───────────────────────────────────────────────────────────
const POPULAR_BANKS: BankOption[] = [
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC', iconText: 'HDFC', color: '#004C8F', popular: true },
  { id: 'icici', name: 'ICICI Bank', code: 'ICIC', iconText: 'ICICI', color: '#B02A30', popular: true },
  { id: 'sbi', name: 'State Bank of India', code: 'SBIN', iconText: 'SBI', color: '#280071', popular: true },
  { id: 'axis', name: 'Axis Bank', code: 'UTIB', iconText: 'AXIS', color: '#97144D', popular: true },
  { id: 'kotak', name: 'Kotak Bank', code: 'KKBK', iconText: 'KOTAK', color: '#E81B24', popular: true },
  { id: 'pnb', name: 'Punjab National Bank', code: 'PUNB', iconText: 'PNB', color: '#A20F26', popular: true },
];

const OTHER_BANKS: BankOption[] = [
  { id: 'yes', name: 'Yes Bank', code: 'YESB', iconText: 'YES', color: '#005A9C' },
  { id: 'bob', name: 'Bank of Baroda', code: 'BARB', iconText: 'BOB', color: '#F26522' },
  { id: 'indus', name: 'IndusInd Bank', code: 'INDB', iconText: 'INDUS', color: '#8F1E24' },
  { id: 'canara', name: 'Canara Bank', code: 'CNRB', iconText: 'CANARA', color: '#0091DA' },
  { id: 'union', name: 'Union Bank of India', code: 'UBIN', iconText: 'UNION', color: '#0054A6' },
  { id: 'idfc', name: 'IDFC FIRST Bank', code: 'IDFB', iconText: 'IDFC', color: '#991B1E' },
  { id: 'federal', name: 'Federal Bank', code: 'FDRL', iconText: 'FED', color: '#003A70' },
  { id: 'rbl', name: 'RBL Bank', code: 'RATN', iconText: 'RBL', color: '#B31B1B' },
  { id: 'central', name: 'Central Bank of India', code: 'CBIN', iconText: 'CBI', color: '#005691' },
  { id: 'indian', name: 'Indian Bank', code: 'IDIB', iconText: 'IND', color: '#002E6D' },
  { id: 'iob', name: 'Indian Overseas Bank', code: 'IOBA', iconText: 'IOB', color: '#0B4F6C' },
  { id: 'uco', name: 'UCO Bank', code: 'UCBA', iconText: 'UCO', color: '#0072BB' },
  { id: 'bom', name: 'Bank of Maharashtra', code: 'MAHB', iconText: 'BOM', color: '#00529B' },
  { id: 'kvb', name: 'Karur Vysya Bank', code: 'KVBL', iconText: 'KVB', color: '#C8102E' },
  { id: 'sib', name: 'South Indian Bank', code: 'SIBL', iconText: 'SIB', color: '#9E2A2B' },
  { id: 'bandhan', name: 'Bandhan Bank', code: 'BDBL', iconText: 'BNDN', color: '#003366' },
  { id: 'aubank', name: 'AU Small Finance Bank', code: 'AUBL', iconText: 'AU', color: '#6A1B9A' },
  { id: 'dbs', name: 'DBS Bank India', code: 'DBSS', iconText: 'DBS', color: '#E53935' },
  { id: 'scb', name: 'Standard Chartered Bank', code: 'SCBL', iconText: 'SCB', color: '#00853E' },
  { id: 'citi', name: 'Citi Bank', code: 'CITI', iconText: 'CITI', color: '#003B70' },
];

const WALLET_OPTIONS: WalletOption[] = [
  { id: 'paytm', name: 'Paytm Wallet', iconText: 'Paytm', color: '#00B9F5', balance: 340.0 },
  { id: 'phonepe', name: 'PhonePe Wallet', iconText: 'PhonePe', color: '#5F259F', balance: 185.5 },
  { id: 'amazon', name: 'Amazon Pay', iconText: 'Amazon', color: '#FF9900', balance: 500.0 },
  { id: 'mobikwik', name: 'MobiKwik', iconText: 'MobiKwik', color: '#0070BA', balance: 75.0 },
  { id: 'airtel', name: 'Airtel Money', iconText: 'Airtel', color: '#EE1C25', balance: 0.0 },
];

const UPI_HANDLES = ['@okhdfcbank', '@okicici', '@okaxis', '@ybl', '@paytm'];

// ─── Helper Functions ──────────────────────────────────────────────────────
const formatINR = (val: number): string => {
  if (isNaN(val)) return '₹0.00';
  return '₹' + val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatCardNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(' ') : digits;
};

const formatExpiry = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
};

const detectCardScheme = (num: string): { name: string; icon: string; color: string } => {
  const cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('4')) return { name: 'Visa', icon: 'VISA', color: '#1A1F71' };
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return { name: 'MasterCard', icon: 'MC', color: '#EB001B' };
  if (/^60|^65|^64/.test(cleaned)) return { name: 'RuPay', icon: 'RuPay', color: '#00A859' };
  if (/^3[47]/.test(cleaned)) return { name: 'Amex', icon: 'AMEX', color: '#0077A6' };
  return { name: 'Card', icon: 'CARD', color: '#3395FF' };
};

const generateTxnId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 10; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `pay_OB${rand}`;
};

const generateFormattedDate = (): string => {
  const d = new Date();
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const getEstimatedDeliveryTime = (): string => {
  const now = new Date();
  const delivery = new Date(now.getTime() + 25 * 60 * 1000);
  return delivery.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
function PaymentCheckoutScreen({
  grandTotal,
  cartItems = [],
  couponDiscount = 0,
  tip = 0,
  onBack,
  onOrderSuccess,
  onRedirectToConfirmation,
}: PaymentCheckoutScreenProps) {
  const groceryColors = useGroceryColors();
  const isDark = isCategoryDark() || groceryColors.cardBackground === '#000000';
  const styles = useMemo(() => getStyles(isDark), [isDark]);

  // Helper getters for items
  const getItemId = (item: any, idx: number) => item.product?.id || item.id || `item_${idx}`;
  const getItemName = (item: any) => item.product?.name || item.name || 'Item';
  const getItemPrice = (item: any) => item.product ? (item.product.discountPrice || item.product.price) : (item.price || 0);
  const getItemQty = (item: any) => item.quantity || 1;
  const getItemCustom = (item: any) => item.product?.unit || item.customization || '';

  // ── State Calculations ───────────────────────────────────────────────────
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + getItemPrice(item) * getItemQty(item), 0);
  }, [cartItems]);

  const isFreeDelivery = subtotal > 100;
  const deliveryFee = isFreeDelivery || cartItems.length === 0 ? 0 : 29.0;
  const calculatedTotal = typeof grandTotal === 'number' && grandTotal > 0
    ? grandTotal
    : Math.max(0, subtotal + deliveryFee + tip - couponDiscount);

  // ── Payment Mode State ───────────────────────────────────────────────────
  const [selectedMode, setSelectedMode] = useState<PaymentMode>('upi');
  const [itemsBreakdownExpanded, setItemsBreakdownExpanded] = useState<boolean>(false);

  // ── Cards Sub-State ──────────────────────────────────────────────────────
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [saveCard, setSaveCard] = useState<boolean>(true);

  // ── UPI Sub-State ────────────────────────────────────────────────────────
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);
  const [upiIdInput, setUpiIdInput] = useState<string>('');
  const [selectedUpiHandle, setSelectedUpiHandle] = useState<string>('@okhdfcbank');
  const [vpaVerified, setVpaVerified] = useState<boolean>(true);

  // ── Net Banking Sub-State ────────────────────────────────────────────────
  const [selectedBankId, setSelectedBankId] = useState<string>('hdfc');
  const [bankSearchQuery, setBankSearchQuery] = useState<string>('');

  // ── Wallets Sub-State ────────────────────────────────────────────────────
  const [selectedWalletId, setSelectedWalletId] = useState<string>('paytm');

  // ── Processing & Success Popup State ─────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatusText, setProcessingStatusText] = useState<string>('Connecting to Payment Gateway...');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<{
    txnId: string;
    amount: number;
    paymentModeLabel: string;
    dateFormatted: string;
    items: CartItem[];
    isCod: boolean;
  } | null>(null);

  // ── Animated Values ──────────────────────────────────────────────────────
  const successModalScaleAnim = useRef(new Animated.Value(0.8)).current;
  const successModalFadeAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScaleAnim = useRef(new Animated.Value(0)).current;
  const checkmarkCircleAnim = useRef(new Animated.Value(0.4)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── References for Timers & Order ID ──────────────────────────────────────
  const createdOrderIdRef = useRef<string | null>(null);
  const redirectTimerRef = useRef<any>(null);
  const isRedirectingRef = useRef<boolean>(false);

  // Pulse animation for badges / loaders
  useEffect(() => {
    const loopAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loopAnim.start();
    return () => {
      loopAnim.stop();
      pulseAnim.setValue(1);
    };
  }, [pulseAnim]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const togglePaymentMode = (mode: PaymentMode) => {
    setSelectedMode(mode);
  };

  // ── Redirection Trigger Handler ──────────────────────────────────────────
  const triggerRedirect = (targetOrderId?: string) => {
    if (isRedirectingRef.current) return;
    isRedirectingRef.current = true;

    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);

    const finalOrderId =
      targetOrderId ||
      createdOrderIdRef.current ||
      `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    setShowSuccessModal(false);

    if (onRedirectToConfirmation) {
      onRedirectToConfirmation(finalOrderId);
    }
  };

  // ── Payment Processing Handler ───────────────────────────────────────────
  const handleInitiatePayment = (overrideMode?: PaymentMode) => {
    const activeMode = overrideMode || selectedMode;
    setIsProcessing(true);

    if (activeMode === 'cod') {
      setProcessingStatusText('Confirming Order Details...');
    } else if (activeMode === 'card') {
      setProcessingStatusText('Securing 3D Authentication...');
    } else if (activeMode === 'upi') {
      setProcessingStatusText('Awaiting UPI Authorization...');
    } else if (activeMode === 'onebuddywallet') {
      setProcessingStatusText('Debiting One Buddy Wallet...');
    } else {
      setProcessingStatusText('Connecting to Banking Server...');
    }

    // Phase 1: Banking authorization simulation
    setTimeout(() => {
      setProcessingStatusText('Payment Approved • Finalizing Order...');

      setTimeout(async () => {
        setIsProcessing(false);

        // Prepare order summary object
        let modeLabel = 'UPI';
        if (activeMode === 'cod') modeLabel = 'Cash on Delivery (COD)';
        else if (activeMode === 'card') {
          const scheme = detectCardScheme(cardNumber || '4829');
          modeLabel = `${scheme.name} Card (•••• ${cardNumber.replace(/\s/g, '').slice(-4) || '4829'})`;
        } else if (activeMode === 'netbanking') {
          const bank = POPULAR_BANKS.find(b => b.id === selectedBankId) || OTHER_BANKS.find(b => b.id === selectedBankId);
          modeLabel = `Net Banking (${bank?.name || 'HDFC Bank'})`;
        } else if (activeMode === 'wallet') {
          const wallet = WALLET_OPTIONS.find(w => w.id === selectedWalletId);
          modeLabel = wallet?.name || 'Paytm Wallet';
        } else if (activeMode === 'onebuddywallet') {
          modeLabel = 'One Buddy Wallet';
        } else {
          if (selectedUpiApp) {
            modeLabel = `UPI (${selectedUpiApp})`;
          } else {
            modeLabel = `UPI (${upiIdInput || 'alex'}${selectedUpiHandle})`;
          }
        }

        const newOrder = {
          txnId: generateTxnId(),
          amount: calculatedTotal,
          paymentModeLabel: modeLabel,
          dateFormatted: generateFormattedDate(),
          items: cartItems,
          isCod: activeMode === 'cod',
        };

        setCompletedOrder(newOrder);
        isRedirectingRef.current = false;
        createdOrderIdRef.current = null;

        // Reset animation values
        successModalScaleAnim.setValue(0.8);
        successModalFadeAnim.setValue(0);
        checkmarkCircleAnim.setValue(0.4);
        checkmarkScaleAnim.setValue(0);

        // Show Payment Success Popup Modal
        setShowSuccessModal(true);

        // Animate modal popup & bouncy tick mark entrance
        Animated.parallel([
          Animated.spring(successModalScaleAnim, {
            toValue: 1,
            friction: 7,
            tension: 50,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(successModalFadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.spring(checkmarkCircleAnim, {
            toValue: 1,
            friction: 5,
            tension: 60,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.sequence([
            Animated.delay(100),
            Animated.spring(checkmarkScaleAnim, {
              toValue: 1,
              friction: 4,
              tension: 70,
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]),
        ]).start();

        // Initiate backend order creation in background
        if (onOrderSuccess) {
          try {
            const res = await onOrderSuccess(newOrder);
            if (typeof res === 'string') {
              createdOrderIdRef.current = res;
            } else if (res && res.id) {
              createdOrderIdRef.current = res.id;
            }
          } catch (err) {
            console.error('Order creation error:', err);
          }
        }

        // Auto-redirect to Thank You page after 1.8 seconds (tick mark animation)
        redirectTimerRef.current = setTimeout(() => {
          triggerRedirect();
        }, 1800);
      }, 700);
    }, 900);
  };

  const cardScheme = detectCardScheme(cardNumber || '4829');

  const filteredOtherBanks = useMemo(() => {
    if (!bankSearchQuery.trim()) return OTHER_BANKS;
    return OTHER_BANKS.filter(b => b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()));
  }, [bankSearchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#000000" : COLORS.background} />

      {/* ── Top Payment Header ── */}
      <View style={styles.screenHeader}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Payment Checkout</Text>
          <View style={styles.secureBadgeRow}>
            <Text style={styles.secureLockIcon}>🔒</Text>
            <Text style={styles.secureBadgeText}>100% Safe & Encrypted</Text>
          </View>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Razorpay Merchant & Amount Header Card ── */}
        <View style={styles.rpHeaderCard}>
          <View style={styles.rpHeaderTopRow}>
            <View style={styles.rpBrandRow}>
              <View style={styles.rpMerchantLogo}>
                <Text style={styles.rpMerchantLogoInitials}>OB</Text>
              </View>
              <View style={styles.rpMerchantDetails}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.rpMerchantName}>One Buddy</Text>
                  <View style={styles.rpVerifiedBadge}>
                    <Text style={styles.rpVerifiedIcon}>✓</Text>
                  </View>
                </View>
                <Text style={styles.rpMerchantSubtitle}>support@onebuddy.com</Text>
              </View>
            </View>
            <Image
              source={{ uri: 'https://razorpay.com/assets/razorpay-logo.svg' }}
              style={{ width: 70, height: 20 }}
              defaultSource={{ uri: 'https://badges.razorpay.com/badge-light.png' }}
            />
          </View>

          {/* Dynamic Amount Banner & Expandable Breakdown */}
          <TouchableOpacity
            style={styles.rpAmountBanner}
            onPress={() => setItemsBreakdownExpanded(!itemsBreakdownExpanded)}
            activeOpacity={0.85}
          >
            <View>
              <Text style={styles.rpAmountLabel}>Total Amount to Pay</Text>
              <Text style={styles.rpAmountValue}>{formatINR(calculatedTotal)}</Text>
            </View>
            <View style={styles.rpDetailsToggle}>
              <Text style={styles.rpDetailsToggleText}>
                {itemsBreakdownExpanded ? 'Hide Items ▲' : 'View Items ▼'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Accordion Inside Header */}
          {itemsBreakdownExpanded && (
            <View style={styles.rpBreakdownBox}>
              {cartItems.map((item, idx) => (
                <View key={getItemId(item, idx)} style={styles.rpBreakdownItemRow}>
                  <Text style={styles.rpBreakdownItemName} numberOfLines={1}>
                    {getItemName(item)} × {getItemQty(item)}
                  </Text>
                  <Text style={styles.rpBreakdownItemPrice}>
                    {formatINR(getItemPrice(item) * getItemQty(item))}
                  </Text>
                </View>
              ))}
              <View style={styles.rpBreakdownDivider} />
              <View style={styles.rpBreakdownItemRow}>
                <Text style={styles.rpBreakdownMuted}>Item Subtotal</Text>
                <Text style={styles.rpBreakdownMuted}>{formatINR(subtotal)}</Text>
              </View>
              <View style={styles.rpBreakdownItemRow}>
                <Text style={styles.rpBreakdownMuted}>Delivery Fee</Text>
                <Text style={styles.rpBreakdownMuted}>
                  {deliveryFee === 0 ? 'FREE' : formatINR(deliveryFee)}
                </Text>
              </View>
              {couponDiscount > 0 && (
                <View style={styles.rpBreakdownItemRow}>
                  <Text style={[styles.rpBreakdownMuted, { color: colors.primary }]}>Coupon Discount</Text>
                  <Text style={[styles.rpBreakdownMuted, { color: colors.primary }]}>- {formatINR(couponDiscount)}</Text>
                </View>
              )}
              {tip > 0 && (
                <View style={styles.rpBreakdownItemRow}>
                  <Text style={styles.rpBreakdownMuted}>Delivery Partner Tip</Text>
                  <Text style={styles.rpBreakdownMuted}>{formatINR(tip)}</Text>
                </View>
              )}
              <View style={styles.rpBreakdownDivider} />
              <View style={styles.rpBreakdownItemRow}>
                <Text style={[styles.rpBreakdownItemName, { fontWeight: '700' }]}>Total Amount</Text>
                <Text style={[styles.rpBreakdownItemPrice, { fontWeight: '700', color: colors.primary }]}>
                  {formatINR(calculatedTotal)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Section Title ── */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionMainTitle}>Select Payment Method</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred mode to complete payment</Text>
        </View>

        {/* ══════════════════════════════════════════════════════════════════════
            PAYMENT METHODS ACCORDION LIST
        ══════════════════════════════════════════════════════════════════════ */}

        {/* ── 1. UPI (GPay, PhonePe, Paytm, VPA) ── */}
        <View style={[styles.rpListItemCard, selectedMode === 'upi' && styles.rpListItemCardActive]}>
          <TouchableOpacity
            style={styles.rpListItemHeader}
            onPress={() => togglePaymentMode('upi')}
            activeOpacity={0.8}
          >
            <View style={styles.rpListIconCircle}>
              <Ionicons name="phone-portrait-outline" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </View>
            <View style={styles.rpListTextContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.rpListTitle}>UPI</Text>
                <View style={styles.rpFastBadge}>
                  <Text style={styles.rpFastBadgeText}>⚡ FASTEST</Text>
                </View>
              </View>
              <Text style={styles.rpListSub}>Google Pay, PhonePe, Paytm & UPI ID</Text>
            </View>
            <View style={styles.radioCircle}>
              {selectedMode === 'upi' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* Expanded UPI Form */}
          {selectedMode === 'upi' && (
            <View style={styles.rpListExpandedBody}>
              <Text style={styles.inputFieldLabel}>Popular UPI Apps:</Text>
              <View style={styles.upiAppsRowGrid}>
                {[
                  { name: 'Google Pay', iconUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/google-pay-icon.png' },
                  { name: 'PhonePe', iconUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/phonepe-icon.png' },
                  { name: 'Paytm', iconUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/paytm-icon.png' },
                  { name: 'CRED', iconUrl: 'https://play-lh.googleusercontent.com/PJvM1900ufKia-hc7l7eaU0quGrOm_sx1x_szS_-lA7kRm9sb7gr1cgI8uQMH7tq3n-vnx0SkIUZa19fwz2G=w240-h480-rw' },
                ].map((app) => {
                  const isSelected = selectedUpiApp === app.name;
                  return (
                    <TouchableOpacity
                      key={app.name}
                      style={[styles.upiAppTile, isSelected && styles.upiAppTileSelected]}
                      onPress={() => {
                        setSelectedUpiApp(app.name);
                        setUpiIdInput('');
                        setVpaVerified(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: app.iconUrl }} style={{ width: 32, height: 32, marginBottom: 8 }} resizeMode="contain" />
                      <Text style={styles.upiAppTileName}>{app.name}</Text>
                      {isSelected && (
                        <View style={styles.upiAppCheckBadge}>
                          <Text style={styles.upiAppCheckText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>Or Enter UPI ID / VPA:</Text>
              <View style={styles.vpaInputWrapper}>
                <TextInput
                  style={styles.vpaTextInput}
                  placeholder="username"
                  placeholderTextColor={COLORS.textMuted}
                  value={upiIdInput}
                  onChangeText={(t) => {
                    setUpiIdInput(t);
                    setVpaVerified(t.length > 2);
                    if (t.length > 0) setSelectedUpiApp(null);
                  }}
                  autoCapitalize="none"
                />
                <View style={styles.vpaHandleSuffix}>
                  <Text style={styles.vpaHandleSuffixText}>{selectedUpiHandle}</Text>
                </View>
              </View>

              {/* Quick Handle Selection Pills */}
              <View style={styles.handlesChipsRow}>
                {UPI_HANDLES.map((handle) => (
                  <TouchableOpacity
                    key={handle}
                    style={[
                      styles.handleChip,
                      selectedUpiHandle === handle && styles.handleChipActive,
                    ]}
                    onPress={() => setSelectedUpiHandle(handle)}
                  >
                    <Text
                      style={[
                        styles.handleChipText,
                        selectedUpiHandle === handle && styles.handleChipTextActive,
                      ]}
                    >
                      {handle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {vpaVerified && upiIdInput.length > 0 && (
                <View style={styles.verifiedVpaNotice}>
                  <Text style={styles.verifiedVpaNoticeText}>
                    ✓ Verified: {upiIdInput}{selectedUpiHandle} (Alex Johnson)
                  </Text>
                </View>
              )}

              <View style={styles.payBtnSpacingWrapper}>
                {(() => {
                  const isUpiValid = (vpaVerified && upiIdInput.length > 0) || selectedUpiApp !== null;
                  return (
                    <TouchableOpacity
                      style={[styles.rpPrimaryActionBtn, !isUpiValid && { opacity: 0.6 }]}
                      onPress={() => handleInitiatePayment('upi')}
                      disabled={!isUpiValid || isProcessing}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.rpPrimaryActionBtnText}>
                        Pay {formatINR(calculatedTotal)} with UPI
                      </Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            </View>
          )}
        </View>

        {/* ── 1.5. One Buddy Wallet ── */}
        <View style={[styles.rpListItemCard, selectedMode === 'onebuddywallet' && styles.rpListItemCardActive]}>
          <TouchableOpacity
            style={styles.rpListItemHeader}
            onPress={() => togglePaymentMode('onebuddywallet')}
            activeOpacity={0.8}
          >
            <View style={styles.rpListIconCircle}>
              <Ionicons name="wallet-outline" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </View>
            <View style={styles.rpListTextContainer}>
              <Text style={styles.rpListTitle}>One Buddy Wallet</Text>
              <Text style={styles.rpListSub}>Available Balance: <Text style={{ color: COLORS.accent, fontWeight: '700' }}>{formatINR(1250.0)}</Text></Text>
            </View>
            <View style={styles.radioCircle}>
              {selectedMode === 'onebuddywallet' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* Expanded One Buddy Wallet Form */}
          {selectedMode === 'onebuddywallet' && (
            <View style={styles.rpListExpandedBody}>
              <View style={styles.payBtnSpacingWrapper}>
                {(() => {
                  const walletBalance: number = 1250.0;
                  const amountToDebit = Math.min(walletBalance, calculatedTotal);
                  const amountRemaining = Math.max(0, calculatedTotal - walletBalance);

                  return (
                    <View>
                      {amountRemaining > 0 && (
                        <Text style={{ color: COLORS.warning, marginBottom: 12, textAlign: 'center', fontSize: 13 }}>
                          Insufficient balance. {formatINR(amountRemaining)} will be paid via Cash on Delivery.
                        </Text>
                      )}
                      <TouchableOpacity
                        style={[styles.rpPrimaryActionBtn, walletBalance === 0 && { opacity: 0.5 }]}
                        onPress={() => handleInitiatePayment('onebuddywallet')}
                        disabled={isProcessing || walletBalance === 0}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.rpPrimaryActionBtnText}>
                          {amountRemaining > 0 
                            ? `Debit ${formatINR(amountToDebit)} + ${formatINR(amountRemaining)} COD`
                            : `Pay with One Buddy Wallet • ${formatINR(calculatedTotal)}`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </View>
            </View>
          )}
        </View>

        {/* ── 2. Credit / Debit Cards ── */}
        <View style={[styles.rpListItemCard, selectedMode === 'card' && styles.rpListItemCardActive]}>
          <TouchableOpacity
            style={styles.rpListItemHeader}
            onPress={() => togglePaymentMode('card')}
            activeOpacity={0.8}
          >
            <View style={styles.rpListIconCircle}>
              <Ionicons name="card-outline" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </View>
            <View style={styles.rpListTextContainer}>
              <Text style={styles.rpListTitle}>Credit / Debit Cards</Text>
              <Text style={styles.rpListSub}>Visa, MasterCard, RuPay, Maestro & Amex</Text>
            </View>
            <View style={styles.radioCircle}>
              {selectedMode === 'card' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* Expanded Card Form */}
          {selectedMode === 'card' && (
            <View style={styles.rpListExpandedBody}>
              {/* Interactive Card Visualizer */}
              <View style={[styles.cardVisualizer, { borderColor: cardScheme.color }]}>
                <View style={styles.cardVisTopRow}>
                  <View style={styles.cardChipIcon} />
                  <View style={[styles.cardSchemeBadge, { backgroundColor: cardScheme.color }]}>
                    <Text style={styles.cardSchemeBadgeText}>{cardScheme.icon}</Text>
                  </View>
                </View>

                <Text style={styles.cardVisNumber}>
                  {cardNumber ? formatCardNumber(cardNumber) : '•••• •••• •••• 4829'}
                </Text>

                <View style={styles.cardVisBottomRow}>
                  <View>
                    <Text style={styles.cardVisLabel}>CARD HOLDER</Text>
                    <Text style={styles.cardVisValue} numberOfLines={1}>
                      {cardHolder || 'ALEX JOHNSON'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.cardVisLabel}>EXPIRES</Text>
                    <Text style={styles.cardVisValue}>{cardExpiry || '12/28'}</Text>
                  </View>
                </View>
              </View>

              {/* Card Input Form */}
              <View style={styles.cardForm}>
                <Text style={styles.inputFieldLabel}>Card Number</Text>
                <View style={styles.textInputWrapper}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="4532 •••• •••• ••••"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    maxLength={19}
                    value={cardNumber}
                    onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                  />
                  <Text style={styles.inputRightTag}>{cardScheme.name}</Text>
                </View>

                <View style={styles.formRowTwoCols}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputFieldLabel}>Expiry Date</Text>
                    <View style={styles.textInputWrapper}>
                      <TextInput
                        style={styles.formInput}
                        placeholder="MM / YY"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                        maxLength={5}
                        value={cardExpiry}
                        onChangeText={(t) => setCardExpiry(formatExpiry(t))}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.inputFieldLabel}>CVV / CVC</Text>
                    <View style={styles.textInputWrapper}>
                      <TextInput
                        style={styles.formInput}
                        placeholder="•••"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                        value={cardCvv}
                        onChangeText={setCardCvv}
                      />
                      <Ionicons name="information-circle-outline" size={17} color={COLORS.textMuted} style={styles.inputHelpIcon} />
                    </View>
                  </View>
                </View>

                <Text style={styles.inputFieldLabel}>Name on Card</Text>
                <View style={styles.textInputWrapper}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Alex Johnson"
                    placeholderTextColor={COLORS.textMuted}
                    value={cardHolder}
                    onChangeText={setCardHolder}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Save Card Toggle */}
                <TouchableOpacity
                  style={styles.saveCardCheckboxRow}
                  onPress={() => setSaveCard(!saveCard)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.customCheckbox, saveCard && styles.customCheckboxActive]}>
                    {saveCard && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.saveCardTitle}>Save card securely as per RBI guidelines</Text>
                    <Text style={styles.saveCardSub}>Tokenized encryption for future seamless checkout</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.payBtnSpacingWrapper}>
                  <TouchableOpacity
                    style={styles.rpPrimaryActionBtn}
                    onPress={() => handleInitiatePayment('card')}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.rpPrimaryActionBtnText}>
                      Pay {formatINR(calculatedTotal)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── 3. Net Banking ── */}
        <View style={[styles.rpListItemCard, selectedMode === 'netbanking' && styles.rpListItemCardActive]}>
          <TouchableOpacity
            style={styles.rpListItemHeader}
            onPress={() => togglePaymentMode('netbanking')}
            activeOpacity={0.8}
          >
            <View style={styles.rpListIconCircle}>
              <Ionicons name="business-outline" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </View>
            <View style={styles.rpListTextContainer}>
              <Text style={styles.rpListTitle}>Net Banking</Text>
              <Text style={styles.rpListSub}>HDFC, ICICI, SBI, Axis & 50+ Indian banks</Text>
            </View>
            <View style={styles.radioCircle}>
              {selectedMode === 'netbanking' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* Expanded Net Banking Form */}
          {selectedMode === 'netbanking' && (
            <View style={styles.rpListExpandedBody}>
              <Text style={styles.inputFieldLabel}>Popular Indian Banks:</Text>
              <View style={styles.banksGrid}>
                {POPULAR_BANKS.map((bank) => {
                  const isSelected = selectedBankId === bank.id;
                  return (
                    <TouchableOpacity
                      key={bank.id}
                      style={[styles.bankCard, isSelected && styles.bankCardSelected]}
                      onPress={() => setSelectedBankId(bank.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.bankLogoCircle, { backgroundColor: bank.color }]}>
                        <Text style={styles.bankLogoInitials}>{bank.iconText}</Text>
                      </View>
                      <Text style={[styles.bankCardName, isSelected && styles.bankCardNameSelected]} numberOfLines={1}>
                        {bank.name}
                      </Text>
                      {isSelected && <View style={styles.selectedBankBadge}><Text style={styles.badgeCheck}>✓</Text></View>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Search Other Banks */}
              <Text style={[styles.inputFieldLabel, { marginTop: 14 }]}>All Other Banks ({filteredOtherBanks.length}):</Text>
              <View style={styles.textInputWrapper}>
                <TextInput
                  style={styles.formInput}
                  placeholder="Search from 50+ other banks..."
                  placeholderTextColor={COLORS.textMuted}
                  value={bankSearchQuery}
                  onChangeText={setBankSearchQuery}
                />
                <Ionicons name="search-outline" size={17} color={COLORS.textMuted} />
              </View>

              {/* Scrollable Container for All Other Banks */}
              <View style={styles.otherBanksScrollWrapper}>
                <ScrollView
                  style={styles.otherBanksScrollList}
                  contentContainerStyle={styles.otherBanksScrollContent}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {filteredOtherBanks.map((bank) => {
                    const isSelected = selectedBankId === bank.id;
                    return (
                      <TouchableOpacity
                        key={bank.id}
                        style={[styles.otherBankRow, isSelected && styles.otherBankRowSelected]}
                        onPress={() => setSelectedBankId(bank.id)}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.smallBankBadge, { backgroundColor: bank.color }]}>
                          <Text style={styles.smallBankBadgeText}>{bank.iconText}</Text>
                        </View>
                        <Text style={[styles.otherBankName, isSelected && styles.otherBankNameSelected]}>
                          {bank.name}
                        </Text>
                        <View style={styles.radioCircle}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Bottom Spacing Wrapper for Pay Button */}
              <View style={styles.payBtnSpacingWrapper}>
                <TouchableOpacity
                  style={styles.rpPrimaryActionBtn}
                  onPress={() => handleInitiatePayment('netbanking')}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  <Text style={styles.rpPrimaryActionBtnText}>
                    Pay via Netbanking • {formatINR(calculatedTotal)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── 4. Wallets ── */}
        <View style={[styles.rpListItemCard, selectedMode === 'wallet' && styles.rpListItemCardActive]}>
          <TouchableOpacity
            style={styles.rpListItemHeader}
            onPress={() => togglePaymentMode('wallet')}
            activeOpacity={0.8}
          >
            <View style={styles.rpListIconCircle}>
              <Ionicons name="wallet-outline" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </View>
            <View style={styles.rpListTextContainer}>
              <Text style={styles.rpListTitle}>Wallets</Text>
              <Text style={styles.rpListSub}>Paytm, PhonePe, Amazon Pay, MobiKwik</Text>
            </View>
            <View style={styles.radioCircle}>
              {selectedMode === 'wallet' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* Expanded Wallets Form */}
          {selectedMode === 'wallet' && (
            <View style={styles.rpListExpandedBody}>
              <Text style={styles.inputFieldLabel}>Choose Digital Wallet:</Text>
              <View style={styles.walletsList}>
                {WALLET_OPTIONS.map((w) => {
                  const isSelected = selectedWalletId === w.id;
                  return (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.walletCard, isSelected && styles.walletCardSelected]}
                      onPress={() => setSelectedWalletId(w.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.walletIconCircle, { backgroundColor: w.color }]}>
                        <Ionicons name="wallet" size={16} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.walletName}>{w.name}</Text>
                        <Text style={styles.walletBalanceText}>
                          Available Balance: <Text style={{ color: COLORS.accent, fontWeight: '700' }}>{formatINR(w.balance)}</Text>
                        </Text>
                      </View>
                      <View style={styles.radioCircle}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.payBtnSpacingWrapper}>
                {(() => {
                  const selectedWallet = WALLET_OPTIONS.find(w => w.id === selectedWalletId);
                  const walletBalance = selectedWallet?.balance || 0;
                  const amountToDebit = Math.min(walletBalance, calculatedTotal);
                  const amountRemaining = Math.max(0, calculatedTotal - walletBalance);

                  return (
                    <View>
                      {amountRemaining > 0 && (
                        <Text style={{ color: COLORS.warning, marginBottom: 12, textAlign: 'center', fontSize: 13 }}>
                          Insufficient balance. {formatINR(amountRemaining)} will be paid via Cash on Delivery.
                        </Text>
                      )}
                      <TouchableOpacity
                        style={[styles.rpPrimaryActionBtn, walletBalance === 0 && { opacity: 0.5 }]}
                        onPress={() => handleInitiatePayment('wallet')}
                        disabled={isProcessing || walletBalance === 0}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.rpPrimaryActionBtnText}>
                          {amountRemaining > 0 
                            ? `Debit ${formatINR(amountToDebit)} + ${formatINR(amountRemaining)} COD`
                            : `Pay with Wallet • ${formatINR(calculatedTotal)}`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </View>
            </View>
          )}
        </View>

        {/* ── 5. Cash on Delivery (COD) ── */}
        <View style={[styles.rpListItemCard, selectedMode === 'cod' && styles.rpListItemCardActive]}>
          <TouchableOpacity
            style={styles.rpListItemHeader}
            onPress={() => togglePaymentMode('cod')}
            activeOpacity={0.8}
          >
            <View style={styles.rpListIconCircle}>
              <Ionicons name="cash-outline" size={22} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </View>
            <View style={styles.rpListTextContainer}>
              <Text style={styles.rpListTitle}>Cash on Delivery</Text>
              <Text style={styles.rpListSub}>Pay via Cash or UPI at your doorstep</Text>
            </View>
            <View style={styles.radioCircle}>
              {selectedMode === 'cod' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* Expanded COD Form */}
          {selectedMode === 'cod' && (
            <View style={styles.rpListExpandedBody}>
              <View style={styles.codDetailsList}>
                <View style={styles.codDetailRow}>
                  <Ionicons name="cash-outline" size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
                  <Text style={styles.codDetailText}>No advance payment needed today</Text>
                </View>
                <View style={styles.codDetailRow}>
                  <Ionicons name="bicycle-outline" size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
                  <Text style={styles.codDetailText}>
                    Exact amount due on delivery:{' '}
                    <Text style={{ fontWeight: '800', color: COLORS.accent }}>
                      {formatINR(calculatedTotal)}
                    </Text>
                  </Text>
                </View>
                <View style={styles.codDetailRow}>
                  <Ionicons name="qr-code-outline" size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
                  <Text style={styles.codDetailText}>Digital QR & Cash both accepted at doorstep</Text>
                </View>
              </View>

              <View style={styles.payBtnSpacingWrapper}>
                <TouchableOpacity
                  style={styles.rpPrimaryActionBtn}
                  onPress={() => handleInitiatePayment('cod')}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  <Text style={styles.rpPrimaryActionBtnText}>
                    Confirm Cash on Delivery ({formatINR(calculatedTotal)})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Razorpay Security Trust Footer ── */}
        <View style={styles.trustFooter}>
          <Ionicons name="shield-checkmark" size={13} color={COLORS.razorpayAccent} style={{ marginRight: 5 }} />
          <Text style={styles.trustFooterText}>
            Secured by <Text style={{ fontWeight: '800', color: COLORS.razorpayAccent }}>Razorpay</Text> • 256-bit SSL Encryption • PCI-DSS Certified
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Payment Authorization Loader Overlay ── */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <Animated.View style={[styles.processingSpinner, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="flash" size={32} color={COLORS.razorpayAccent} />
            </Animated.View>
            <Text style={styles.processingTitle}>Authorizing Payment</Text>
            <Text style={styles.processingStatus}>{processingStatusText}</Text>
            <Text style={styles.processingNote}>Please do not refresh or close this window</Text>
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PAYMENT SUCCESS POPUP MODAL (Animated Tick Mark & Auto-Redirect)
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        onRequestClose={() => triggerRedirect()}
      >
        <View style={styles.successModalBackdrop}>
          <Animated.View
            style={[
              styles.successModalCard,
              {
                opacity: successModalFadeAnim,
                transform: [{ scale: successModalScaleAnim }],
              },
            ]}
          >
            {/* Confetti simulation dots */}
            <View style={[styles.confettiContainer, { pointerEvents: 'none' as any }]}>
              <View style={[styles.confettiDot, { top: 15, left: 25, backgroundColor: '#F59E0B' }]} />
              <View style={[styles.confettiDot, { top: 30, right: 35, backgroundColor: '#10B981' }]} />
              <View style={[styles.confettiDot, { bottom: 25, left: 35, backgroundColor: '#3395FF' }]} />
              <View style={[styles.confettiDot, { bottom: 40, right: 30, backgroundColor: '#EC4899' }]} />
              <View style={[styles.confettiDot, { top: 75, left: 15, backgroundColor: '#8B5CF6' }]} />
              <View style={[styles.confettiDot, { top: 80, right: 20, backgroundColor: '#F97316' }]} />
            </View>

            {/* Glowing animated checkmark badge */}
            <Animated.View
              style={[
                styles.successIconCircleOuter,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Animated.View
                style={[
                  styles.successIconCircle,
                  { transform: [{ scale: checkmarkCircleAnim }] },
                ]}
              >
                <Animated.View style={{ transform: [{ scale: checkmarkScaleAnim }] }}>
                  <Ionicons name="checkmark-sharp" size={48} color={isDark ? "#000000" : "#FFFFFF"} />
                </Animated.View>
              </Animated.View>
            </Animated.View>

            {/* Headline */}
            <Text style={styles.successModalTitle}>
              {completedOrder?.isCod ? 'Order Placed Successfully! 🎉' : 'Payment Successful! 🎉'}
            </Text>
            <Text style={styles.successModalSubtitle}>
              {completedOrder?.isCod
                ? 'Your order has been confirmed. Please keep cash or UPI ready at delivery.'
                : 'Your payment was completed securely. We have received your order!'}
            </Text>

            {/* Paid Amount Highlight Badge */}
            <View style={styles.successAmountBadge}>
              <Text style={styles.successAmountLabel}>
                {completedOrder?.isCod ? 'Total Amount Due' : 'Amount Paid'}
              </Text>
              <Text style={styles.successAmountValue}>
                {formatINR(completedOrder?.amount || calculatedTotal)}
              </Text>
            </View>

            {/* Transaction Details Box */}
            <View style={styles.successDetailsBox}>
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Transaction ID</Text>
                <Text style={styles.successDetailTxnId}>
                  {completedOrder?.txnId || 'pay_OB102938'}
                </Text>
              </View>
              <View style={styles.successDetailDivider} />
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Payment Mode</Text>
                <Text style={styles.successDetailValue} numberOfLines={1}>
                  {completedOrder?.paymentModeLabel || 'UPI'}
                </Text>
              </View>
              <View style={styles.successDetailDivider} />
              <View style={styles.successDetailRow}>
                <Text style={styles.successDetailLabel}>Status</Text>
                <View style={styles.successStatusRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.primaryDark} />
                  <Text style={styles.successStatusText}>Confirmed</Text>
                </View>
              </View>
            </View>

            {/* Subtle redirect indicator */}
            <View style={styles.autoRedirectNotice}>
              <Text style={styles.autoRedirectText}>Taking you to order summary...</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────
const getStyles = (isDark: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: isDark ? '#000000' : COLORS.background,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.15)' : COLORS.border,
    backgroundColor: isDark ? '#000000' : COLORS.surface,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: isDark ? '#000000' : COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: isDark ? 1 : 0,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    color: isDark ? '#FFFFFF' : COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: isDark ? '#FFFFFF' : COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  secureLockIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  secureBadgeText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  headerRightPlaceholder: {
    width: 38,
  },

  // ── Main Scroll View
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // ── Razorpay Header Card ──
  rpHeaderCard: {
    backgroundColor: COLORS.razorpayBlue,
    borderRadius: COLORS.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E3A60',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  rpHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  rpBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rpMerchantLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpMerchantLogoInitials: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '900',
  },
  rpMerchantDetails: {
    marginLeft: 10,
  },
  rpMerchantName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  rpVerifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.razorpayAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  rpVerifiedIcon: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  rpMerchantSubtitle: {
    color: '#8BA6C8',
    fontSize: 11,
  },
  rpAmountBanner: {
    backgroundColor: '#07162C',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#183459',
  },
  rpAmountLabel: {
    color: '#8BA6C8',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  rpAmountValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  rpDetailsToggle: {
    backgroundColor: 'rgba(51, 149, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rpDetailsToggleText: {
    color: COLORS.razorpayAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  rpBreakdownBox: {
    backgroundColor: '#07162C',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  rpBreakdownItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  rpBreakdownItemName: {
    color: '#8BA6C8',
    fontSize: 12,
    flex: 1,
  },
  rpBreakdownItemPrice: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  rpBreakdownDivider: {
    height: 1,
    backgroundColor: '#1E3A60',
    marginVertical: 6,
  },
  rpBreakdownMuted: {
    color: '#617D9F',
    fontSize: 11,
  },

  // ── Section Titles ──
  sectionTitleRow: {
    marginBottom: 14,
  },
  sectionMainTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  // ── List Item Card Styles (Accordion) ──
  rpListItemCard: {
    backgroundColor: isDark ? '#000000' : COLORS.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  rpListItemCardActive: {
    borderColor: COLORS.razorpayAccent,
    backgroundColor: isDark ? '#000000' : COLORS.surface,
  },
  rpListItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rpListIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? '#000000' : COLORS.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: isDark ? 1 : 0,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  rpListTextContainer: {
    flex: 1,
  },
  rpListTitle: {
    color: isDark ? '#FFFFFF' : COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  rpFastBadge: {
    backgroundColor: COLORS.success + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  rpFastBadgeText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '800',
  },
  rpListSub: {
    color: isDark ? '#9CA3AF' : COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  rpListExpandedBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.15)' : COLORS.border + '88',
    backgroundColor: isDark ? '#000000' : undefined,
  },

  // ── UPI Apps Grid
  upiAppsRowGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  upiAppTile: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  upiAppTileSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surfaceHighlight,
  },
  upiAppCheckBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  upiAppCheckText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: '900',
  },
  upiAppTileName: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },

  // ── UPI VPA Input
  inputFieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  vpaInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 8,
  },
  vpaTextInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  vpaHandleSuffix: {
    backgroundColor: COLORS.surfaceHighlight,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  vpaHandleSuffixText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  handlesChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  handleChip: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  handleChipActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surfaceHighlight,
  },
  handleChipText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  handleChipTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  verifiedVpaNotice: {
    backgroundColor: COLORS.success + '22',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  verifiedVpaNoticeText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Card Styles
  cardVisualizer: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.razorpayAccent,
    marginBottom: 12,
  },
  cardVisTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardChipIcon: {
    width: 28,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#D4AF37',
  },
  cardSchemeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardSchemeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  cardVisNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },
  cardVisBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardVisLabel: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '600',
  },
  cardVisValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  cardForm: {
    marginTop: 2,
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  formInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    paddingVertical: 8,
  },
  inputRightTag: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  formRowTwoCols: {
    flexDirection: 'row',
  },
  inputHelpIcon: {
    fontSize: 13,
  },
  saveCardCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  customCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  customCheckboxActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  checkboxTick: {
    color: COLORS.background,
    fontSize: 11,
    fontWeight: '900',
  },
  saveCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  saveCardSub: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 1,
  },

  // ── Net Banking Styles
  banksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  bankCard: {
    width: '31.5%',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  bankCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surfaceHighlight,
  },
  bankLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bankLogoInitials: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  bankCardName: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  bankCardNameSelected: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  selectedBankBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCheck: {
    color: COLORS.background,
    fontSize: 7,
    fontWeight: '900',
  },

  // Scrollable container for All Other Banks
  otherBanksScrollWrapper: {
    maxHeight: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceLight,
    overflow: 'hidden',
    marginBottom: 8,
  },
  otherBanksScrollList: {
    maxHeight: 160,
  },
  otherBanksScrollContent: {
    padding: 6,
  },
  otherBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceHighlight,
    marginBottom: 4,
  },
  otherBankRowSelected: {
    borderColor: COLORS.accent,
    borderWidth: 1,
    backgroundColor: '#262A3D',
  },
  smallBankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  smallBankBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  otherBankName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    flex: 1,
    fontWeight: '600',
  },
  otherBankNameSelected: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },

  // ── Wallets Styles
  walletsList: {
    marginTop: 2,
    marginBottom: 8,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  walletCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surfaceHighlight,
  },
  walletIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletIconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  walletName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  walletBalanceText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },

  // ── COD Styles
  codDetailsList: {
    width: '100%',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  codDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  codBullet: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '900',
    marginRight: 8,
  },
  codDetailText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    flex: 1,
  },

  // ── Bottom Spacing Wrapper for Pay Buttons
  payBtnSpacingWrapper: {
    marginTop: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },

  // ── Primary Razorpay Action Button
  rpPrimaryActionBtn: {
    backgroundColor: isDark ? '#FFFFFF' : COLORS.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: isDark ? '#FFFFFF' : COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rpPrimaryActionBtnText: {
    color: isDark ? '#000000' : COLORS.background,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Trust Footer
  trustFooter: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustFooterText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  // ── Radio Circle Helper
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },

  // ── Processing Overlay
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 22, 44, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 100,
  },
  processingCard: {
    alignItems: 'center',
  },
  processingSpinner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(51, 149, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.razorpayAccent,
  },
  processingTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  processingStatus: {
    color: COLORS.razorpayAccent,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  processingNote: {
    color: '#8BA6C8',
    fontSize: 11,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 6 CELEBRATORY SPLASH SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  splashOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  splashCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
    position: 'relative',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  splashIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  splashCheckmark: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
  },
  splashTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  splashSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  splashAmountPill: {
    backgroundColor: COLORS.surfaceHighlight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 16,
  },
  splashAmountText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  splashGeneratingText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },

  // ── Success Popup Modal Styles ──
  successModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 18, 30, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: isDark ? '#000000' : colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  successIconCircleOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: isDark ? '#000000' : colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : colors.primaryMedium,
  },
  successIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: isDark ? '#FFFFFF' : colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: isDark ? '#FFFFFF' : colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  successModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  successModalSubtitle: {
    fontSize: 13.5,
    color: isDark ? '#E5E7EB' : colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  successAmountBadge: {
    backgroundColor: isDark ? '#000000' : colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : colors.primaryMedium,
  },
  successAmountLabel: {
    fontSize: 12,
    color: isDark ? '#9CA3AF' : colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  successAmountValue: {
    fontSize: 22,
    fontWeight: '800',
    color: isDark ? '#FFFFFF' : colors.primaryDark,
  },
  successDetailsBox: {
    backgroundColor: isDark ? '#000000' : colors.background,
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : colors.borderLight,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successDetailLabel: {
    fontSize: 12.5,
    color: isDark ? '#9CA3AF' : colors.textMuted,
    fontWeight: '500',
  },
  successDetailValue: {
    fontSize: 13,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  successDetailTxnId: {
    fontSize: 12.5,
    color: '#0284C7',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  successDetailDivider: {
    height: 1,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : colors.borderLight,
    marginVertical: 8,
  },
  successStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  successStatusText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  autoRedirectNotice: {
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoRedirectText: {
    fontSize: 12,
    color: isDark ? '#9CA3AF' : colors.textMuted,
    fontStyle: 'italic',
  },
});

type PaymentScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Payment'>;
  route?: RouteProp<RootStackParamList, 'Payment'>;
};

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
  const { cartItems, getPriceSummary, clearCart } = useCart();
  const { user, selectedAddress } = useUser();
  const summary = getPriceSummary();

  const passedTotal = route?.params?.grandTotal;
  const grandTotal = typeof passedTotal === 'number' && passedTotal > 0 ? passedTotal : summary.total;
  const couponDiscount = route?.params?.couponDiscount || summary.discount || 0;
  const tip = route?.params?.tip || 0;

  useEffect(() => {
    const verifyAddress = async () => {
      if (!selectedAddress) {
        try {
          const stored = await storageHelper.getItem<any[]>(STORAGE_KEYS.SAVED_ADDRESSES);
          if (!stored || stored.length === 0) {
            const msg = '⚠️ Please add a delivery address to proceed to payment.';
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.alert(msg);
            } else {
              Alert.alert('Delivery Address Required', msg);
            }
            navigation.navigate('Address');
          }
        } catch {
          // ignore
        }
      }
    };
    verifyAddress();
  }, [selectedAddress, navigation]);

  const handleOrderSuccess = async (orderDetails: any): Promise<string | null> => {
    try {
      let activeAddress = selectedAddress;
      if (!activeAddress) {
        try {
          const stored = await storageHelper.getItem<any[]>(STORAGE_KEYS.SAVED_ADDRESSES);
          if (stored && stored.length > 0) {
            const first = stored[0];
            activeAddress = {
              id: first.id || 'addr_1',
              name: first.receiverName || user?.name || 'Customer',
              phone: first.receiverPhone || user?.phone || '9876543210',
              houseNumber: first.houseNo || 'Flat 402, Royal Residency',
              street: first.building || 'Main Road',
              area: first.landmark || 'Suryaraopeta',
              city: 'Kurnool',
              state: 'Andhra Pradesh',
              pincode: '518001',
              type: (first.label?.toLowerCase() as any) || 'home',
              isDefault: true,
            };
          }
        } catch (err) {
          console.warn('Could not read saved addresses from storage', err);
        }
      }

      if (!activeAddress) {
        const msg = '⚠️ Delivery Address Required: Please add your delivery address to proceed to payment.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert(msg);
        } else {
          Alert.alert('Delivery Address Required', msg);
        }
        navigation.navigate('Address');
        return null;
      }

      const order = await orderService.createOrder({
        userId: user?.id || 'guest_user',
        items: cartItems,
        subtotal: summary.subtotal,
        discount: couponDiscount,
        deliveryFee: summary.deliveryFee,
        tax: 0,
        total: grandTotal,
        deliveryAddress: activeAddress,
        deliverySlot: {
          id: 'slot_selected',
          date: 'Today',
          startTime: '09:00 AM',
          endTime: '11:00 AM',
          available: true,
        },
        paymentMethod: orderDetails?.isCod ? 'cash_on_delivery' : 'upi',
      });

      clearCart();
      return order.id;
    } catch (e) {
      console.error('Order creation failed', e);
      return null;
    }
  };

  const handleRedirectToConfirmation = (orderId: string) => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'OrderConfirmation', params: { orderId } }],
    });
  };

  return (
    <PaymentCheckoutScreen
      grandTotal={grandTotal}
      cartItems={cartItems}
      couponDiscount={couponDiscount}
      tip={tip}
      onBack={() => navigation.goBack()}
      onOrderSuccess={handleOrderSuccess}
      onRedirectToConfirmation={handleRedirectToConfirmation}
    />
  );
};
