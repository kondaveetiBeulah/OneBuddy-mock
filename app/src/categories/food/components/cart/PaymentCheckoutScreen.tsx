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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useOptionalCart } from '../../context/CartContext';
import type { CartItem } from '../types';

let Notifications: any = null;
if (Platform.OS !== 'web') {
    try {
        Notifications = require('expo-notifications');
    } catch (e) {
        console.log('Push notifications are not supported in this environment (e.g. Expo Go Android SDK 53+).');
    }
}

// ─── Theme & Colors ────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceLight: '#F3F4F6',
    surfaceHighlight: '#E5E7EB',
    accent: '#65A30D',
    accentDark: '#4D7C0F',
    accentLight: '#D9F99D',
    razorpayBlue: '#0C2340',
    razorpayAccent: '#3395FF',
    razorpayDark: '#07162C',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    success: '#4CAF50',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    error: '#FF5252',
    cardRadius: 18,
    pillRadius: 24,
};

// ─── Types ─────────────────────────────────────────────────────────────────
export type PaymentMode = 'upi' | 'onebuddywallet' | 'card' | 'netbanking' | 'wallet' | 'cod';

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
    onBack?: () => void;
    onOrderSuccess?: (orderDetails: any) => void;
    onFinishReceipt?: () => void;
    hideCOD?: boolean;
    hideReceiptModal?: boolean;
    title?: string;
    subtitle?: string;
    isDark?: boolean;
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

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function PaymentCheckoutScreen({
    grandTotal = 1499.0,
    cartItems = [],
    onBack,
    onOrderSuccess,
    onFinishReceipt,
    hideCOD = false,
    hideReceiptModal = false,
    title = 'Payment Checkout',
    subtitle,
    isDark = false,
}: PaymentCheckoutScreenProps) {

    // ── State Calculations ───────────────────────────────────────────────────
    const subtotal = useMemo(() => {
        if (!cartItems || cartItems.length === 0) return grandTotal;
        return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [cartItems, grandTotal]);

    const deliveryFee = cartItems.length > 0 ? 49.0 : 0;
    const taxes = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
    const discount = Math.max(0, Math.round((subtotal + deliveryFee + taxes - grandTotal) * 100) / 100);
    const calculatedTotal = grandTotal > 0 ? grandTotal : subtotal + deliveryFee + taxes - discount;

    // ── Payment Mode State ───────────────────────────────────────────────────
    const insets = useSafeAreaInsets();
    const topInset = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0);
    const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);
    const cartContext = useOptionalCart();
    const [selectedMode, setSelectedMode] = useState<PaymentMode>('upi');
    const [itemsBreakdownExpanded, setItemsBreakdownExpanded] = useState<boolean>(false);

    // ── Cards Sub-State ──────────────────────────────────────────────────────
    const [cardNumber, setCardNumber] = useState<string>('');
    const [cardExpiry, setCardExpiry] = useState<string>('');
    const [cardCvv, setCardCvv] = useState<string>('');
    const [cardHolder, setCardHolder] = useState<string>('');
    const [saveCard, setSaveCard] = useState<boolean>(true);

    // ── UPI Sub-State ────────────────────────────────────────────────────────
    const [upiIdInput, setUpiIdInput] = useState<string>('');
    const [selectedUpiHandle, setSelectedUpiHandle] = useState<string>('@okhdfcbank');
    const [vpaVerified, setVpaVerified] = useState<boolean>(true);
    const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);

    // ── Net Banking Sub-State ────────────────────────────────────────────────
    const [selectedBankId, setSelectedBankId] = useState<string>('hdfc');
    const [bankSearchQuery, setBankSearchQuery] = useState<string>('');

    // ── Wallets Sub-State ────────────────────────────────────────────────────
    const [selectedWalletId, setSelectedWalletId] = useState<string>('paytm');

    // ── Processing & Splash & Success State ──────────────────────────────────
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [processingStatusText, setProcessingStatusText] = useState<string>('Connecting to Payment Gateway...');
    const [showSplashScreen, setShowSplashScreen] = useState<boolean>(false);
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
    const splashScaleAnim = useRef(new Animated.Value(0.5)).current;
    const splashFadeAnim = useRef(new Animated.Value(0)).current;
    const successCardAnim = useRef(new Animated.Value(50)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const confettiAnim = useRef(new Animated.Value(0)).current;

    // Pulse animation for badges / loaders
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 900, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const togglePaymentMode = (mode: PaymentMode) => {
        setSelectedMode(mode);
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
        } else {
            setProcessingStatusText('Connecting to Banking Server...');
        }

        // Phase 1: Banking authorization (1.3s)
        setTimeout(() => {
            setProcessingStatusText('Payment Approved • Finalizing Order...');

            setTimeout(() => {
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
                    modeLabel = `${wallet?.name || 'Paytm Wallet'}`;
                } else {
                    modeLabel = `UPI (${upiIdInput || 'alex'}${selectedUpiHandle})`;
                }

                const newOrder = {
                    txnId: generateTxnId(),
                    amount: calculatedTotal,
                    paymentModeLabel: modeLabel,
                    dateFormatted: generateFormattedDate(),
                    items: cartItems,
                    isCod: activeMode === 'cod',
                };
                
                if (cartContext && typeof cartContext.placeOrder === 'function') {
                    try {
                        const placed = cartContext.placeOrder('Selected Address');
                        if (placed && placed.orderId) {
                            newOrder.txnId = placed.orderId;
                        }
                    } catch(e) {
                        console.log('Failed to save order to context', e);
                    }
                }

                setCompletedOrder(newOrder);

                // Trigger push notification
                if (Notifications && Platform.OS !== 'web') {
                    try {
                        Notifications.scheduleNotificationAsync({
                            content: {
                                title: "Order Placed Successfully! 🎉",
                                body: `Your payment of ${formatINR(calculatedTotal)} was successful. Your order is being prepared!`,
                                data: { orderId: newOrder.txnId },
                            },
                            trigger: null,
                        });
                    } catch (e) {
                        console.log('Failed to trigger notification', e);
                    }
                }

                // Launch Step 6 Celebratory Splash Screen
                setShowSplashScreen(true);
                splashFadeAnim.setValue(0);
                splashScaleAnim.setValue(0.6);
                confettiAnim.setValue(0);

                Animated.parallel([
                    Animated.timing(splashFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.spring(splashScaleAnim, { toValue: 1, speed: 12, bounciness: 8, useNativeDriver: true }),
                    Animated.timing(confettiAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                ]).start();

                // After 2.2 seconds on the Splash Screen, transition smoothly to the Receipt Modal (if not suppressed)
                setTimeout(() => {
                    setShowSplashScreen(false);
                    if (!hideReceiptModal && !hideCOD) {
                        setShowSuccessModal(true);
                        successCardAnim.setValue(60);
                        Animated.spring(successCardAnim, { toValue: 0, speed: 14, bounciness: 6, useNativeDriver: true }).start();
                    }
                    if (onOrderSuccess) onOrderSuccess(newOrder);
                }, 2200);

            }, 1000);
        }, 1300);
    };

    const cardScheme = detectCardScheme(cardNumber || '4829');

    const filteredOtherBanks = useMemo(() => {
        if (!bankSearchQuery.trim()) return OTHER_BANKS;
        return OTHER_BANKS.filter(b => b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()));
    }, [bankSearchQuery]);

    return (
        <View style={[styles.safeArea, isDark && { backgroundColor: '#0F172A' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#1E293B' : COLORS.background} />

            {/* ── Top Payment Header ── */}
            <View style={[styles.screenHeader, { paddingTop: topInset + 12 }, isDark && { backgroundColor: '#1E293B', borderBottomColor: '#334155' }]}>
                <TouchableOpacity
                    onPress={onBack}
                    style={[styles.backButton, isDark && { backgroundColor: '#334155', borderWidth: 1, borderColor: '#64748B' }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Back"
                >
                    <Ionicons name="arrow-back" size={22} color={isDark ? '#FFFFFF' : COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, isDark && { color: '#FFFFFF' }]}>{title}</Text>
                    <View style={styles.secureBadgeRow}>
                        <Ionicons name="shield-checkmark" size={12} color={COLORS.accent} style={{ marginRight: 4 }} />
                        <Text style={styles.secureBadgeText}>{subtitle || '100% Safe & Encrypted'}</Text>
                    </View>
                </View>
                <View style={styles.headerRightPlaceholder} />
            </View>

            <ScrollView
                style={styles.mainScrollView}
                contentContainerStyle={[styles.mainScrollContent, { paddingBottom: bottomInset + 30 }]}
                showsVerticalScrollIndicator={false}
            >

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
                            <Ionicons name="phone-portrait-outline" size={20} color="#0F172A" />
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
                                            <Image source={{ uri: app.iconUrl }} style={{ width: 32, height: 32, resizeMode: 'contain', marginBottom: 8 }} />
                                            <Text style={styles.upiAppTileName}>{app.name}</Text>
                                            {isSelected && (
                                                <View style={styles.selectedUpiAppBadge}>
                                                    <Text style={styles.badgeCheck}>✓</Text>
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
                                        setSelectedUpiApp(null);
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
                                    const isUpiValid = !!selectedUpiApp || (!!upiIdInput && vpaVerified);
                                    return (
                                        <TouchableOpacity
                                            style={[styles.rpPrimaryActionBtn, (!isUpiValid || isProcessing) && { opacity: 0.6 }]}
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

                {/* ── 1.5 One Buddy Wallet ── */}
                <View style={[styles.rpListItemCard, selectedMode === 'onebuddywallet' && styles.rpListItemCardActive]}>
                    <TouchableOpacity
                        style={styles.rpListItemHeader}
                        onPress={() => togglePaymentMode('onebuddywallet')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.rpListIconCircle}>
                            <Image 
                                source={{ uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4rFtYIByYl_GKYaAwdgvKHkg2hTqp2oJWwdCmYbNRAg" }} 
                                style={{ width: 24, height: 24, borderRadius: 4 }}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={styles.rpListTextContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.rpListTitle}>One Buddy Wallet</Text>
                            </View>
                            <Text style={styles.rpListSub}>Available Balance: ₹500.00</Text>
                        </View>
                        <View style={styles.radioCircle}>
                            {selectedMode === 'onebuddywallet' && <View style={styles.radioInner} />}
                        </View>
                    </TouchableOpacity>

                    {selectedMode === 'onebuddywallet' && (
                        <View style={styles.rpListExpandedBody}>
                            {calculatedTotal > 500 && (
                                <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                                    <Text style={{ color: COLORS.warning, fontSize: 13, fontWeight: '500' }}>
                                        Insufficient balance! The remaining {formatINR(calculatedTotal - 500)} will be paid via Cash on Delivery.
                                    </Text>
                                </View>
                            )}
                            <View style={styles.payBtnSpacingWrapper}>
                                <TouchableOpacity
                                    style={styles.rpPrimaryActionBtn}
                                    onPress={() => handleInitiatePayment('onebuddywallet')}
                                    disabled={isProcessing}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.rpPrimaryActionBtnText}>
                                        Pay With One Buddy Wallet
                                    </Text>
                                </TouchableOpacity>
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
                            <Ionicons name="card-outline" size={20} color="#0F172A" />
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
                            <Ionicons name="business-outline" size={20} color="#0F172A" />
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


                {/* ── 5. Cash on Delivery (COD) ── */}
                {!hideCOD && (
                    <View style={[styles.rpListItemCard, selectedMode === 'cod' && styles.rpListItemCardActive]}>
                        <TouchableOpacity
                            style={styles.rpListItemHeader}
                            onPress={() => togglePaymentMode('cod')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.rpListIconCircle}>
                                <Ionicons name="cash-outline" size={22} color="#0F172A" />
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
                                        <Text style={styles.codBullet}>✓</Text>
                                        <Text style={styles.codDetailText}>No advance payment needed today</Text>
                                    </View>
                                    <View style={styles.codDetailRow}>
                                        <Text style={styles.codBullet}>✓</Text>
                                        <Text style={styles.codDetailText}>
                                            Exact amount due on delivery:{' '}
                                            <Text style={{ fontWeight: '800', color: COLORS.accent }}>
                                                {formatINR(calculatedTotal)}
                                            </Text>
                                        </Text>
                                    </View>
                                    <View style={styles.codDetailRow}>
                                        <Text style={styles.codBullet}>✓</Text>
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
                )}

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
          3. CELEBRATORY ORDER SPLASH SCREEN (STEP 6 TRANSITION)
      ══════════════════════════════════════════════════════════════════════ */}
            <Modal visible={showSplashScreen} transparent animationType="fade">
                <View style={styles.splashOverlay}>
                    <Animated.View
                        style={[
                            styles.splashCard,
                            {
                                opacity: splashFadeAnim,
                                transform: [{ scale: splashScaleAnim }],
                            },
                        ]}
                    >
                        {/* Confetti simulation dots */}
                        <View style={styles.confettiContainer}>
                            <View style={[styles.confettiDot, { top: -10, left: 20, backgroundColor: '#F59E0B' }]} />
                            <View style={[styles.confettiDot, { top: 20, right: 30, backgroundColor: '#10B981' }]} />
                            <View style={[styles.confettiDot, { bottom: 10, left: 40, backgroundColor: '#3395FF' }]} />
                            <View style={[styles.confettiDot, { bottom: 30, right: 20, backgroundColor: '#EC4899' }]} />
                        </View>

                        <Animated.View style={[styles.splashIconCircle, { transform: [{ scale: pulseAnim }] }]}>
                            <Text style={styles.splashCheckmark}>✓</Text>
                        </Animated.View>

                        <Text style={styles.splashTitle}>🎉 Payment Successful!</Text>
                        <Text style={styles.splashSubtitle}>Your order with One Buddy is confirmed!</Text>

                        <View style={styles.splashAmountPill}>
                            <Text style={styles.splashAmountText}>
                                {completedOrder?.isCod ? 'Amount to Pay: ' : 'Amount Paid: '}
                                <Text style={{ fontWeight: '900', color: COLORS.accent }}>
                                    {formatINR(completedOrder?.amount || calculatedTotal)}
                                </Text>
                            </Text>
                        </View>

                        <Text style={styles.splashGeneratingText}>Generating receipt & order tracker...</Text>
                    </Animated.View>
                </View>
            </Modal>

            {/* ══════════════════════════════════════════════════════════════════════
          4. POST-PAYMENT / ORDER SUCCESS RECEIPT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
            {!hideReceiptModal && !hideCOD && (
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowSuccessModal(false);
                    if (onBack) onBack();
                }}
            >
                <View style={styles.receiptModalOverlay}>
                    <Animated.View
                        style={[
                            styles.receiptModalCard,
                            {
                                transform: [{ translateY: successCardAnim }],
                            },
                        ]}
                    >
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.receiptScrollContent}>
                            {/* Header Badge */}
                            <View style={styles.receiptTopHeader}>
                                <View style={styles.receiptSuccessIconBox}>
                                    <Text style={styles.receiptSuccessCheck}>✓</Text>
                                </View>
                                <Text style={styles.receiptMainTitle}>Thanks for your order!</Text>
                                <Text style={styles.receiptSubTitle}>
                                    We've received your order and the kitchen is preparing it.
                                </Text>
                            </View>

                            {/* Authentic Digital Receipt Container */}
                            <View style={styles.digitalReceiptBody}>
                                {/* Merchant Top */}
                                <View style={styles.receiptMerchantHeader}>
                                    <View style={styles.receiptMerchantLogo}>
                                        <Text style={styles.receiptMerchantInitials}>OB</Text>
                                    </View>
                                    <View style={{ marginLeft: 12 }}>
                                        <Text style={styles.receiptMerchantName}>One Buddy Kitchen</Text>
                                        <Text style={styles.receiptMerchantSub}>Order Receipt • Tax Invoice</Text>
                                    </View>
                                </View>

                                <View style={styles.receiptPerforatedLine} />

                                {/* Key Details Rows */}
                                <View style={styles.receiptDetailItemRow}>
                                    <Text style={styles.receiptDetailKey}>Merchant</Text>
                                    <Text style={styles.receiptDetailValBold}>One Buddy</Text>
                                </View>

                                <View style={styles.receiptDetailItemRow}>
                                    <Text style={styles.receiptDetailKey}>
                                        {completedOrder?.isCod ? 'Amount Due on Delivery' : 'Amount Paid'}
                                    </Text>
                                    <Text style={[styles.receiptDetailValBold, { color: COLORS.accent, fontSize: 17 }]}>
                                        {formatINR(completedOrder?.amount || calculatedTotal)}
                                    </Text>
                                </View>

                                <View style={styles.receiptDetailItemRow}>
                                    <Text style={styles.receiptDetailKey}>Payment Method</Text>
                                    <Text style={styles.receiptDetailValBold}>
                                        {completedOrder?.paymentModeLabel || 'UPI (Instant)'}
                                    </Text>
                                </View>

                                <View style={styles.receiptDetailItemRow}>
                                    <Text style={styles.receiptDetailKey}>Date & Time</Text>
                                    <Text style={styles.receiptDetailVal}>
                                        {completedOrder?.dateFormatted || generateFormattedDate()}
                                    </Text>
                                </View>

                                <View style={styles.receiptDetailItemRow}>
                                    <Text style={styles.receiptDetailKey}>Transaction ID</Text>
                                    <Text style={styles.receiptDetailTxnId}>
                                        {completedOrder?.txnId || generateTxnId()}
                                    </Text>
                                </View>

                                <View style={styles.receiptPerforatedLine} />

                                {/* Items Purchased List */}
                                <Text style={styles.receiptItemsHeading}>Items Purchased ({cartItems.length}):</Text>
                                <View style={styles.receiptItemsList}>
                                    {cartItems.map((item) => (
                                        <View key={item.id} style={styles.receiptItemSingleRow}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.receiptItemSingleName}>
                                                    {item.name}
                                                </Text>
                                                {item.customization ? (
                                                    <Text style={styles.receiptItemSingleCust}>
                                                        {item.customization}
                                                    </Text>
                                                ) : null}
                                            </View>
                                            <Text style={styles.receiptItemSingleQty}>× {item.quantity}</Text>
                                            <Text style={styles.receiptItemSinglePrice}>
                                                {formatINR(item.price * item.quantity)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.receiptPerforatedLine} />

                                {/* Delivery Timeline / Tracking */}
                                <View style={styles.receiptTrackerBox}>
                                    <Text style={styles.trackerHeading}>⚡ Live Delivery Status</Text>
                                    <View style={styles.trackerStepsRow}>
                                        <View style={styles.trackerStepItem}>
                                            <View style={[styles.trackerDot, styles.trackerDotDone]}>
                                                <Text style={styles.trackerCheck}>✓</Text>
                                            </View>
                                            <Text style={styles.trackerLabelDone}>Placed</Text>
                                        </View>
                                        <View style={[styles.trackerLine, styles.trackerLineDone]} />
                                        <View style={styles.trackerStepItem}>
                                            <View style={[styles.trackerDot, styles.trackerDotDone]}>
                                                <Text style={styles.trackerCheck}>✓</Text>
                                            </View>
                                            <Text style={styles.trackerLabelDone}>Confirmed</Text>
                                        </View>
                                        <View style={[styles.trackerLine, styles.trackerLineActive]} />
                                        <View style={styles.trackerStepItem}>
                                            <View style={[styles.trackerDot, styles.trackerDotActive]}>
                                                <Text style={styles.trackerActiveText}>🔥</Text>
                                            </View>
                                            <Text style={styles.trackerLabelActive}>Kitchen</Text>
                                        </View>
                                        <View style={styles.trackerLine} />
                                        <View style={styles.trackerStepItem}>
                                            <View style={styles.trackerDot}>
                                                <Text style={styles.trackerPendingText}>🛵</Text>
                                            </View>
                                            <Text style={styles.trackerLabel}>Delivery</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.etaLiveNotice}>
                                        Arriving in approx <Text style={{ fontWeight: '800', color: COLORS.accent }}>20–25 mins</Text>
                                    </Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.receiptActionsWrapper}>
                                <TouchableOpacity
                                    style={styles.closeReceiptBtn}
                                    onPress={() => {
                                        setShowSuccessModal(false);
                                        if (onFinishReceipt) onFinishReceipt();
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.closeReceiptBtnText}>Live Track Order</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>
            )}
        </View>
    );
}

// ─── STYLES ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    screenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: COLORS.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: COLORS.textPrimary,
        fontSize: 20,
        fontWeight: '700',
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        color: COLORS.textPrimary,
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
        color: '#111827',
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
        color: '#111827',
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
        color: '#111827',
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
        color: '#111827',
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
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    rpListItemCardActive: {
        borderColor: COLORS.razorpayAccent,
        backgroundColor: COLORS.surface,
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
        backgroundColor: COLORS.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rpListTextContainer: {
        flex: 1,
    },
    rpListTitle: {
        color: COLORS.textPrimary,
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
        color: COLORS.textMuted,
        fontSize: 11,
        marginTop: 2,
    },
    rpListExpandedBody: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border + '88',
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
        position: 'relative',
    },
    upiAppTileSelected: {
        backgroundColor: 'rgba(51, 149, 255, 0.1)',
        borderColor: COLORS.razorpayAccent,
    },
    selectedUpiAppBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: COLORS.success,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.surface,
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
        color: '#111827',
        fontSize: 10,
        fontWeight: '900',
    },
    cardVisNumber: {
        color: '#111827',
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
        color: '#111827',
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
        color: '#111827',
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
        color: '#111827',
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
        color: '#111827',
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
        backgroundColor: COLORS.accent,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    rpPrimaryActionBtnText: {
        color: COLORS.background,
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
        color: '#111827',
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
        color: '#111827',
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

    // ══════════════════════════════════════════════════════════════════════════
    // POST-PAYMENT ORDER SUCCESS RECEIPT MODAL
    // ═══════════════════════════════════════════════════════════════════════
    receiptModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(5, 7, 15, 0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Platform.OS === 'web' ? 20 : 10,
    },
    receiptModalCard: {
        width: '100%',
        maxWidth: 520,
        maxHeight: '94%',
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    receiptScrollContent: {
        padding: 20,
    },
    receiptTopHeader: {
        alignItems: 'center',
        marginBottom: 18,
    },
    receiptSuccessIconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    receiptSuccessCheck: {
        color: '#111827',
        fontSize: 28,
        fontWeight: '900',
    },
    receiptMainTitle: {
        color: COLORS.textPrimary,
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 4,
        textAlign: 'center',
    },
    receiptSubTitle: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 12,
    },
    digitalReceiptBody: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    receiptMerchantHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    receiptMerchantLogo: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    receiptMerchantInitials: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: '900',
    },
    receiptMerchantName: {
        color: COLORS.textPrimary,
        fontSize: 15,
        fontWeight: '800',
    },
    receiptMerchantSub: {
        color: COLORS.textMuted,
        fontSize: 11,
    },
    receiptPerforatedLine: {
        height: 1,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        marginVertical: 12,
    },
    receiptDetailItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    receiptDetailKey: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    receiptDetailVal: {
        color: COLORS.textPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
    receiptDetailValBold: {
        color: COLORS.textPrimary,
        fontSize: 13,
        fontWeight: '800',
    },
    receiptDetailTxnId: {
        color: COLORS.razorpayAccent,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    receiptItemsHeading: {
        color: COLORS.textPrimary,
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
    },
    receiptItemsList: {
        marginBottom: 4,
    },
    receiptItemSingleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    receiptItemSingleName: {
        color: COLORS.textPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
    receiptItemSingleCust: {
        color: COLORS.textMuted,
        fontSize: 10,
    },
    receiptItemSingleQty: {
        color: COLORS.accent,
        fontSize: 12,
        fontWeight: '700',
        marginHorizontal: 12,
    },
    receiptItemSinglePrice: {
        color: COLORS.textPrimary,
        fontSize: 12,
        fontWeight: '700',
    },
    receiptTrackerBox: {
        backgroundColor: COLORS.surfaceHighlight,
        borderRadius: 12,
        padding: 12,
        marginTop: 4,
    },
    trackerHeading: {
        color: COLORS.textPrimary,
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 10,
    },
    trackerStepsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    trackerStepItem: {
        alignItems: 'center',
    },
    trackerDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: COLORS.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 3,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    trackerDotDone: {
        backgroundColor: COLORS.success,
        borderColor: COLORS.success,
    },
    trackerDotActive: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    trackerCheck: {
        color: '#111827',
        fontSize: 10,
        fontWeight: '900',
    },
    trackerActiveText: {
        fontSize: 10,
    },
    trackerPendingText: {
        fontSize: 10,
    },
    trackerLabel: {
        color: COLORS.textMuted,
        fontSize: 9,
        fontWeight: '500',
    },
    trackerLabelDone: {
        color: COLORS.success,
        fontSize: 9,
        fontWeight: '700',
    },
    trackerLabelActive: {
        color: COLORS.accent,
        fontSize: 9,
        fontWeight: '800',
    },
    trackerLine: {
        flex: 1,
        height: 2,
        backgroundColor: COLORS.border,
        marginHorizontal: 4,
        marginTop: -10,
    },
    trackerLineDone: {
        backgroundColor: COLORS.success,
    },
    trackerLineActive: {
        backgroundColor: COLORS.accent,
    },
    etaLiveNotice: {
        color: COLORS.textSecondary,
        fontSize: 11,
        textAlign: 'center',
    },
    receiptActionsWrapper: {
        marginTop: 18,
    },
    closeReceiptBtn: {
        backgroundColor: COLORS.accent,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    closeReceiptBtnText: {
        color: COLORS.background,
        fontSize: 15,
        fontWeight: '800',
    },
});




