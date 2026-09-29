import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  Wallet,
  CreditCard,
  Building2,
  Banknote,
  Check,
  Lock,
  Zap,
} from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';
import { useHomeTheme, COLORS, RADII, SPACING, SHADOWS } from '../theme';

const UPI_ICONS = {
  gpay: require('../assets/upi/gpay.png'),
  phonepe: require('../assets/upi/phonepe.png'),
  paytm: require('../assets/upi/paytm.png'),
  bhim: require('../assets/upi/bhim.png'),
};

interface PaymentScreenProps {
  navigation: any;
}

type ExtendedPaymentMethod = 'upi' | 'wallet' | 'card' | 'netbanking' | 'pay_on_visit';

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useHomeTheme();
  const {
    totalAmount,
    baseAmount,
    discountAmount,
    createBooking,
    selectedCategory,
    selectedDate,
    selectedTimeSlot,
    currentAddress,
  } = useBooking();

  const [selectedMethod, setSelectedMethod] = useState<ExtendedPaymentMethod>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'cred'>('gpay');
  const [upiUsername, setUpiUsername] = useState('');
  const [selectedUpiHandle, setSelectedUpiHandle] = useState('@okhdfcbank');
  
  // Card input states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [processing, setProcessing] = useState(false);

  const upiHandles = ['@okhdfcbank', '@okicici', '@okaxis', '@ybl', '@paytm'];

  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [customBankName, setCustomBankName] = useState('');

  const popularBanks = [
    { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
    { id: 'icici', name: 'ICICI Bank', code: 'ICICI' },
    { id: 'sbi', name: 'State Bank of India', code: 'SBI' },
    { id: 'axis', name: 'Axis Bank', code: 'AXIS' },
    { id: 'kotak', name: 'Kotak Mahindra Bank', code: 'KOTAK' },
    { id: 'pnb', name: 'Punjab National Bank', code: 'PNB' },
  ];

  const handlePay = () => {
    setProcessing(true);

    setTimeout(() => {
      setProcessing(false);
      createBooking();
      navigation.navigate('BookingConfirmation');
    }, 1500);
  };

  const formattedAmount = totalAmount.toFixed(2);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Home Visit Payment</Text>
        </View>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 60 + insets.bottom },
        ]}
      >
        {/* Section Heading */}
        <View style={styles.headingSection}>
          <Text style={styles.mainHeading}>Select Payment Method</Text>
          <Text style={styles.subHeading}>
            Choose your preferred mode to complete payment
          </Text>
        </View>

        {/* 1. UPI Payment Option Container (Active by default) */}
        <View
          style={[
            styles.paymentCard,
            selectedMethod === 'upi' ? styles.activePaymentCard : styles.inactivePaymentCard,
          ]}
        >
          <TouchableOpacity
            style={styles.cardHeader}
            activeOpacity={0.85}
            onPress={() => setSelectedMethod('upi')}
          >
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryLight }]}>
                <Smartphone size={20} color={COLORS.primary} />
              </View>
              <View style={styles.cardHeaderTextWrapper}>
                <View style={styles.titleWithBadgeRow}>
                  <Text style={styles.cardTitle}>UPI</Text>
                  <View style={styles.fastestBadge}>
                    <Zap size={10} color={COLORS.primaryDark} style={{ marginRight: 2 }} />
                    <Text style={styles.fastestText}>FASTEST</Text>
                  </View>
                </View>
                <Text style={styles.cardSubtitle}>
                  Google Pay, PhonePe, Paytm & UPI ID
                </Text>
              </View>
            </View>

            <View style={[styles.radioOuter, selectedMethod === 'upi' && styles.radioOuterSelected]}>
              {selectedMethod === 'upi' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* UPI Expandable Body */}
          {selectedMethod === 'upi' && (
            <View style={styles.cardBody}>
              <View style={styles.innerDivider} />

              {/* Popular UPI Apps from Reference Image */}
              <Text style={styles.innerLabel}>Popular UPI Apps:</Text>
              <View style={styles.upiAppsGrid}>
                {/* Google Pay */}
                <TouchableOpacity
                  style={[
                    styles.upiAppCard,
                    selectedUpiApp === 'gpay' && styles.selectedUpiAppCard,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedUpiApp('gpay')}
                >
                  <View style={[styles.appLogoCircle, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.border }]}>
                    <Image
                      source={UPI_ICONS.gpay}
                      style={{ width: 38, height: 38 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.upiAppName}>Google Pay</Text>
                </TouchableOpacity>

                {/* PhonePe */}
                <TouchableOpacity
                  style={[
                    styles.upiAppCard,
                    selectedUpiApp === 'phonepe' && styles.selectedUpiAppCard,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedUpiApp('phonepe')}
                >
                  <View style={[styles.appLogoCircle, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.border }]}>
                    <Image
                      source={UPI_ICONS.phonepe}
                      style={{ width: 44, height: 44 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.upiAppName}>PhonePe</Text>
                </TouchableOpacity>

                {/* Paytm */}
                <TouchableOpacity
                  style={[
                    styles.upiAppCard,
                    selectedUpiApp === 'paytm' && styles.selectedUpiAppCard,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedUpiApp('paytm')}
                >
                  <View style={[styles.appLogoCircle, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.border }]}>
                    <Image
                      source={UPI_ICONS.paytm}
                      style={{ width: 38, height: 38 }}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.upiAppName}>Paytm</Text>
                </TouchableOpacity>

                {/* CRED */}
                <TouchableOpacity
                  style={[
                    styles.upiAppCard,
                    selectedUpiApp === 'cred' && styles.selectedUpiAppCard,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedUpiApp('cred')}
                >
                  <View style={[styles.appLogoCircle, { backgroundColor: '#000000', borderWidth: 1, borderColor: '#334155' }]}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M4 4h16v11a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V4z"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <Path
                        d="M8 8h8v6a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8z"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    </Svg>
                  </View>
                  <Text style={styles.upiAppName}>CRED</Text>
                </TouchableOpacity>
              </View>

              {/* Or Enter UPI ID */}
              <Text style={[styles.innerLabel, { marginTop: SPACING.md }]}>
                Or Enter UPI ID / VPA:
              </Text>
              <View style={styles.vpaInputRow}>
                <TextInput
                  style={styles.vpaInput}
                  placeholder="username"
                  placeholderTextColor={COLORS.textMuted}
                  value={upiUsername}
                  onChangeText={setUpiUsername}
                  autoCapitalize="none"
                />
                <View style={styles.vpaHandleSuffix}>
                  <Text style={styles.vpaHandleText}>{selectedUpiHandle}</Text>
                </View>
              </View>

              {/* Quick Handle Chips */}
              <View style={styles.handleChipsRow}>
                {upiHandles.map((handle) => {
                  const isHandleActive = selectedUpiHandle === handle;
                  return (
                    <TouchableOpacity
                      key={handle}
                      style={[
                        styles.handleChip,
                        isHandleActive && styles.activeHandleChip,
                      ]}
                      onPress={() => setSelectedUpiHandle(handle)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.handleChipText,
                          isHandleActive && styles.activeHandleChipText,
                        ]}
                      >
                        {handle}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* UPI Pay Button */}
              <TouchableOpacity
                style={styles.greenPayButton}
                activeOpacity={0.85}
                onPress={handlePay}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.greenPayButtonText}>
                    Pay ₹{formattedAmount} with UPI
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 2. One Buddy Wallet */}
        <View
          style={[
            styles.paymentCard,
            selectedMethod === 'wallet' ? styles.activePaymentCard : styles.inactivePaymentCard,
          ]}
        >
          <TouchableOpacity
            style={styles.cardHeader}
            activeOpacity={0.85}
            onPress={() => setSelectedMethod('wallet')}
          >
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.secondaryLight }]}>
                <Wallet size={20} color={COLORS.secondary} />
              </View>
              <View style={styles.cardHeaderTextWrapper}>
                <Text style={styles.cardTitle}>One Buddy Wallet</Text>
                <Text style={styles.cardSubtitle}>Available Balance: ₹500.00</Text>
              </View>
            </View>

            <View style={[styles.radioOuter, selectedMethod === 'wallet' && styles.radioOuterSelected]}>
              {selectedMethod === 'wallet' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {selectedMethod === 'wallet' && (
            <View style={styles.cardBody}>
              <View style={styles.innerDivider} />
              <Text style={styles.walletNote}>
                ₹{formattedAmount} will be deducted from your wallet balance (₹500.00).
              </Text>
              <TouchableOpacity
                style={styles.greenPayButton}
                activeOpacity={0.85}
                onPress={handlePay}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.greenPayButtonText}>
                    Pay ₹{formattedAmount} via Wallet
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 3. Credit / Debit Cards */}
        <View
          style={[
            styles.paymentCard,
            selectedMethod === 'card' ? styles.activePaymentCard : styles.inactivePaymentCard,
          ]}
        >
          <TouchableOpacity
            style={styles.cardHeader}
            activeOpacity={0.85}
            onPress={() => setSelectedMethod('card')}
          >
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.accentLight }]}>
                <CreditCard size={20} color={COLORS.accent} />
              </View>
              <View style={styles.cardHeaderTextWrapper}>
                <Text style={styles.cardTitle}>Credit / Debit Cards</Text>
                <Text style={styles.cardSubtitle}>
                  Visa, MasterCard, RuPay, Maestro & Amex
                </Text>
              </View>
            </View>

            <View style={[styles.radioOuter, selectedMethod === 'card' && styles.radioOuterSelected]}>
              {selectedMethod === 'card' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {selectedMethod === 'card' && (
            <View style={styles.cardBody}>
              <View style={styles.innerDivider} />
              <TextInput
                style={styles.cardInput}
                placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                value={cardNumber}
                onChangeText={setCardNumber}
              />
              <View style={styles.cardInlineRow}>
                <TextInput
                  style={[styles.cardInput, { flex: 1, marginRight: SPACING.sm }]}
                  placeholder="MM / YY"
                  placeholderTextColor={COLORS.textMuted}
                  value={cardExpiry}
                  onChangeText={setCardExpiry}
                />
                <TextInput
                  style={[styles.cardInput, { flex: 1 }]}
                  placeholder="CVV"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  value={cardCvv}
                  onChangeText={setCardCvv}
                />
              </View>
              <TouchableOpacity
                style={styles.greenPayButton}
                activeOpacity={0.85}
                onPress={handlePay}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.greenPayButtonText}>
                    Pay ₹{formattedAmount} with Card
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 4. Net Banking */}
        <View
          style={[
            styles.paymentCard,
            selectedMethod === 'netbanking' ? styles.activePaymentCard : styles.inactivePaymentCard,
          ]}
        >
          <TouchableOpacity
            style={styles.cardHeader}
            activeOpacity={0.85}
            onPress={() => setSelectedMethod('netbanking')}
          >
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#F1F5F9' }]}>
                <Building2 size={20} color={COLORS.textPrimary} />
              </View>
              <View style={styles.cardHeaderTextWrapper}>
                <Text style={styles.cardTitle}>Net Banking</Text>
                <Text style={styles.cardSubtitle}>
                  HDFC, ICICI, SBI, Axis & 50+ Indian banks
                </Text>
              </View>
            </View>

            <View style={[styles.radioOuter, selectedMethod === 'netbanking' && styles.radioOuterSelected]}>
              {selectedMethod === 'netbanking' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {selectedMethod === 'netbanking' && (
            <View style={styles.cardBody}>
              <View style={styles.innerDivider} />
              
              <Text style={styles.innerLabel}>Popular Banks:</Text>
              <View style={styles.bankGrid}>
                {popularBanks.map((bank) => {
                  const isBankSelected = selectedBank === bank.name && !customBankName;
                  return (
                    <TouchableOpacity
                      key={bank.id}
                      style={[
                        styles.bankCard,
                        isBankSelected && styles.selectedBankCard,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedBank(bank.name);
                        setCustomBankName('');
                      }}
                    >
                      <View style={[styles.bankBadgeCircle, isBankSelected && styles.selectedBankBadgeCircle]}>
                        <Building2 size={16} color={isBankSelected ? COLORS.primary : COLORS.textSecondary} />
                      </View>
                      <Text style={[styles.bankNameText, isBankSelected && styles.selectedBankNameText]} numberOfLines={1}>
                        {bank.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.innerLabel, { marginTop: SPACING.md }]}>
                Or Enter / Search Other Bank:
              </Text>
              <TextInput
                style={styles.bankInput}
                placeholder="e.g. Bank of Baroda, Canara Bank, Union Bank"
                placeholderTextColor={COLORS.textMuted}
                value={customBankName}
                onChangeText={(text) => {
                  setCustomBankName(text);
                  if (text.trim()) setSelectedBank(text.trim());
                }}
              />

              <TouchableOpacity
                style={styles.greenPayButton}
                activeOpacity={0.85}
                onPress={handlePay}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.greenPayButtonText}>
                    Pay ₹{formattedAmount} via {customBankName.trim() || selectedBank}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 5. Pay on Visit */}
        <View
          style={[
            styles.paymentCard,
            selectedMethod === 'pay_on_visit' ? styles.activePaymentCard : styles.inactivePaymentCard,
          ]}
        >
          <TouchableOpacity
            style={styles.cardHeader}
            activeOpacity={0.85}
            onPress={() => setSelectedMethod('pay_on_visit')}
          >
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.successLight }]}>
                <Banknote size={20} color={COLORS.success} />
              </View>
              <View style={styles.cardHeaderTextWrapper}>
                <View style={styles.titleWithBadgeRow}>
                  <Text style={styles.cardTitle}>Pay on Visit (Cash / UPI)</Text>
                  <View style={[styles.fastestBadge, { backgroundColor: COLORS.successLight }]}>
                    <Text style={[styles.fastestText, { color: COLORS.success }]}>ZERO ADVANCE</Text>
                  </View>
                </View>
                <Text style={styles.cardSubtitle}>
                  Pay technician directly after service completion
                </Text>
              </View>
            </View>

            <View style={[styles.radioOuter, selectedMethod === 'pay_on_visit' && styles.radioOuterSelected]}>
              {selectedMethod === 'pay_on_visit' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {selectedMethod === 'pay_on_visit' && (
            <View style={styles.cardBody}>
              <View style={styles.innerDivider} />
              <Text style={styles.walletNote}>
                No advance payment needed. Pay ₹{formattedAmount} via Cash or QR scan after the work is finished.
              </Text>
              <TouchableOpacity
                style={styles.greenPayButton}
                activeOpacity={0.85}
                onPress={handlePay}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.greenPayButtonText}>
                    Confirm Booking (Pay ₹{formattedAmount} on Visit)
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: SPACING.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  securityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  headerRightPlaceholder: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  headingSection: {
    marginVertical: SPACING.md,
  },
  mainHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  subHeading: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  paymentCard: {
    borderRadius: RADII.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  activePaymentCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    ...SHADOWS.md,
  },
  inactivePaymentCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardHeaderTextWrapper: {
    flex: 1,
  },
  titleWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  fastestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.pill,
    marginLeft: 6,
  },
  fastestText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: RADII.pill,
    borderWidth: 1.5,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primary,
  },
  cardBody: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  innerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  innerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  upiAppsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  upiAppCard: {
    width: '23%',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.lg,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedUpiAppCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  appLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: RADII.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  phonePeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  paytmRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paytmTextBlue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  paytmTextCyan: {
    color: '#00BAF2',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  upiAppName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  vpaInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  vpaInput: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  vpaHandleSuffix: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  vpaHandleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  handleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
  },
  handleChip: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeHandleChip: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  handleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeHandleChipText: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  greenPayButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADII.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.md,
  },
  greenPayButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  walletNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  cardInput: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  cardInlineRow: {
    flexDirection: 'row',
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  bankCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  selectedBankCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  bankBadgeCircle: {
    width: 28,
    height: 28,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  selectedBankBadgeCircle: {
    backgroundColor: '#FFFFFF',
  },
  bankNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  selectedBankNameText: {
    color: COLORS.primaryDark,
  },
  bankInput: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
});
