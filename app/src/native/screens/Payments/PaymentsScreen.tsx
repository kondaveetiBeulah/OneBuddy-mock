import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  TextInput,
  BackHandler,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useNativeColors } from '../../constants/colors';

// -----------------------------------------------------------------------
// PaymentsScreen — fully standalone, drop-in React Native screen.
// Merged from settings-files/payments-1/payments-app/PaymentsScreen.tsx
// Updated to match the OneBuddy logo theme.
// -----------------------------------------------------------------------

// ---------------- Types -------------------------------------------------

export type SavedCard = { id: string; brand: string; last4: string; expiry: string; isDefault?: boolean };
export type UpiHandle = { id: string; vpa: string; isDefault?: boolean };
export type Transaction = { id: string; title: string; date: string; amount: number };

export type PageName = 'main' | 'wallet' | 'addMoney' | 'upiDetail' | 'addUpi' | 'cardDetail' | 'addCard';

export interface PaymentsScreenRef {
  canGoBack: () => boolean;
  goBack: () => boolean;
}

export interface PaymentsScreenProps {
  onBack?: () => void;
  initialWalletBalance?: number;
  initialCards?: SavedCard[];
  initialUpiHandles?: UpiHandle[];
  onAddMoney?: (amount: number) => void;
  onCardsChange?: (cards: SavedCard[]) => void;
  onUpiChange?: (handles: UpiHandle[]) => void;
}

// ---------------- Icons (inline SVG, no icon library needed) ----------

interface IconProps {
  size?: number;
  color: string;
}

function ChevronLeftIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WalletIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M16 13h2.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M3 9h18" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function PlusCircleIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function UpiIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={13} height={16} rx={2.5} stroke={color} strokeWidth={2} />
      <Path d="M9.5 18h0.01" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M17 8l4 4-4 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CardIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={2.5} y={5} width={19} height={14} rx={2.5} stroke={color} strokeWidth={2} />
      <Path d="M2.5 10h19" stroke={color} strokeWidth={2} />
      <Path d="M6 15h4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function HistoryIcon({ size = 15, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 3-6.7" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M3 4v5h5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 8v4l3 2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ---------------- Mock data ------------------

const INITIAL_WALLET_BALANCE = 1248.0;
const CASHBACK_EARNED = 86.5;
const REFUNDS_PENDING = 0;

const INITIAL_SAVED_CARDS: SavedCard[] = [
  { id: 'card_1', brand: 'Visa', last4: '4821', expiry: '08/28', isDefault: true },
  { id: 'card_2', brand: 'Mastercard', last4: '0099', expiry: '02/27' },
];

const INITIAL_UPI_HANDLES: UpiHandle[] = [{ id: 'upi_1', vpa: 'user@okhdfc', isDefault: true }];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', title: 'Order #45231 refund', date: '18 Aug, 4:12 PM', amount: 240 },
  { id: 't2', title: 'Grocery order payment', date: '16 Aug, 11:02 AM', amount: -560 },
  { id: 't3', title: 'Cashback credited', date: '12 Aug, 9:30 AM', amount: 45 },
  { id: 't4', title: 'Wallet top-up', date: '05 Aug, 7:45 PM', amount: 1000 },
];

const QUICK_ADD_AMOUNTS = [100, 250, 500, 1000];

const formatRupees = (value: number) =>
  `\u20b9${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ---------------- Small reusable pieces --------------------------------

type PaymentsColors = ReturnType<typeof useNativeColors>;
type PaymentsStyles = ReturnType<typeof createStyles>;

function SectionLabel({ children, styles }: { children: string; styles: PaymentsStyles }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function Divider({ styles }: { styles: PaymentsStyles }) {
  return <View style={styles.divider} />;
}

function Row({
  icon,
  title,
  subtitle,
  badge,
  onPress,
  showChevron,
  colors,
  styles,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  onPress?: () => void;
  showChevron?: boolean;
  colors: PaymentsColors;
  styles: PaymentsStyles;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper activeOpacity={0.7} onPress={onPress} style={styles.row}>
      {!!icon && <View style={styles.rowIconWrap}>{icon}</View>}
      <View style={styles.rowTextWrap}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {title}
          </Text>
          {!!badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        {!!subtitle && (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {showChevron && <ChevronRightIcon size={18} color={colors.grayDim} />}
    </Wrapper>
  );
}

function PageHeader({
  title,
  onBack,
  colors,
  styles,
}: {
  title: string;
  onBack: () => void;
  colors: PaymentsColors;
  styles: PaymentsStyles;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerIconBtn} onPress={onBack}>
        <ChevronLeftIcon size={18} color={colors.white} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerIconBtn} />
    </View>
  );
}

// ---------------- Screen ------------------------------------------------

const PaymentsScreen = React.forwardRef<PaymentsScreenRef, PaymentsScreenProps>(function PaymentsScreen(
  {
    onBack,
    initialWalletBalance,
    initialCards,
    initialUpiHandles,
    onAddMoney,
    onCardsChange,
    onUpiChange,
  },
  ref
) {
  const COLORS = useNativeColors();
  const styles = createStyles(COLORS);

  // ---- internal page stack ----
  const [pageStack, setPageStack] = useState<PageName[]>(['main']);
  const page = pageStack[pageStack.length - 1] ?? 'main';

  // ---- toast ----
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    toastAnim.setValue(0);
    Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
        setToastVisible(false)
      );
    }, 2000);
  };

  // ---- data state ----
  const [walletBalance, setWalletBalance] = useState(initialWalletBalance ?? INITIAL_WALLET_BALANCE);
  const [cards, setCards] = useState<SavedCard[]>(initialCards ?? INITIAL_SAVED_CARDS);
  const [upiHandles, setUpiHandles] = useState<UpiHandle[]>(initialUpiHandles ?? INITIAL_UPI_HANDLES);

  // ---- which UPI / card is open on its detail page ----
  const [selectedUpiId, setSelectedUpiId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const selectedUpi = upiHandles.find((h) => h.id === selectedUpiId) || null;
  const selectedCard = cards.find((c) => c.id === selectedCardId) || null;

  // ---- add-money form state ----
  const [amountChip, setAmountChip] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const enteredAmount = customAmount ? parseFloat(customAmount) : amountChip ?? 0;
  const isAmountValid = enteredAmount > 0;

  // ---- add-upi form state ----
  const [newVpa, setNewVpa] = useState('');
  const isVpaValid = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(newVpa.trim());

  // ---- add-card form state ----
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardName, setCardName] = useState('');
  const isCardValid =
    cardNumber.replace(/\s/g, '').length >= 12 && /^\d{2}\/\d{2}$/.test(cardExpiry) && cardName.trim().length > 1;

  const goTo = (p: PageName) => {
    setPageStack((prev) => (prev[prev.length - 1] === p ? prev : [...prev, p]));
  };
  const goHome = () => {
    setPageStack(['main']);
  };

  const handleBack = useCallback(() => {
    if (pageStack.length > 1) {
      setPageStack((prev) => prev.slice(0, -1));
      return true;
    }
    if (onBack) {
      onBack();
      return true;
    }
    return false;
  }, [pageStack, onBack]);

  useImperativeHandle(
    ref,
    () => ({
      canGoBack: () => pageStack.length > 1,
      goBack: handleBack,
    }),
    [pageStack, handleBack]
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      return handleBack();
    });
    return () => sub.remove();
  }, [handleBack]);

  const resetAddMoneyForm = () => {
    setAmountChip(null);
    setCustomAmount('');
  };

  const handleConfirmAddMoney = () => {
    if (!isAmountValid) return;
    setWalletBalance((prev) => prev + enteredAmount);
    onAddMoney?.(enteredAmount);
    resetAddMoneyForm();
    showToast(`${formatRupees(enteredAmount)} added to wallet`);
    setPageStack(['main', 'wallet']);
  };

  const handleUpiSetDefault = (id: string) => {
    setUpiHandles((prev) => {
      const next = prev.map((h) => ({ ...h, isDefault: h.id === id }));
      onUpiChange?.(next);
      return next;
    });
    showToast('Default UPI ID updated');
  };

  const handleUpiRemove = (id: string) => {
    setUpiHandles((prev) => {
      const next = prev.filter((h) => h.id !== id);
      onUpiChange?.(next);
      return next;
    });
    setSelectedUpiId(null);
    showToast('UPI ID removed');
    goHome();
  };

  const handleAddUpi = () => {
    if (!isVpaValid) return;
    const handle: UpiHandle = { id: `upi_${Date.now()}`, vpa: newVpa.trim(), isDefault: upiHandles.length === 0 };
    setUpiHandles((prev) => {
      const next = [...prev, handle];
      onUpiChange?.(next);
      return next;
    });
    setNewVpa('');
    showToast('UPI ID linked');
    goHome();
  };

  const handleCardSetDefault = (id: string) => {
    setCards((prev) => {
      const next = prev.map((c) => ({ ...c, isDefault: c.id === id }));
      onCardsChange?.(next);
      return next;
    });
    showToast('Default card updated');
  };

  const handleCardRemove = (id: string) => {
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      onCardsChange?.(next);
      return next;
    });
    setSelectedCardId(null);
    showToast('Card removed');
    goHome();
  };

  const handleAddCard = () => {
    if (!isCardValid) return;
    const last4 = cardNumber.replace(/\s/g, '').slice(-4);
    const card: SavedCard = {
      id: `card_${Date.now()}`,
      brand: 'Card',
      last4,
      expiry: cardExpiry,
      isDefault: cards.length === 0,
    };
    setCards((prev) => {
      const next = [...prev, card];
      onCardsChange?.(next);
      return next;
    });
    setCardNumber('');
    setCardExpiry('');
    setCardName('');
    showToast('Card added');
    goHome();
  };

  const Toast = toastVisible && (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        },
      ]}
    >
      <Text style={styles.toastText}>{toastMessage}</Text>
    </Animated.View>
  );

  // =======================================================================
  // PAGE: Wallet — full screen with balance + recent activity
  // =======================================================================
  if (page === 'wallet') {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <PageHeader title="Wallet" onBack={handleBack} colors={COLORS} styles={styles} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.amountBig}>{formatRupees(walletBalance)}</Text>
          <Text style={styles.amountCurrency}>Available balance</Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => goTo('addMoney')}>
            <Text style={styles.primaryBtnText}>Add money</Text>
          </TouchableOpacity>

          <Text style={[styles.inputLabel, { marginTop: 24 }]}>RECENT ACTIVITY</Text>
          <View style={styles.card}>
            {MOCK_TRANSACTIONS.map((txn, index) => (
              <React.Fragment key={txn.id}>
                {index > 0 && <Divider styles={styles} />}
                <View style={styles.txnRow}>
                  <View>
                    <Text style={styles.txnTitle}>{txn.title}</Text>
                    <Text style={styles.txnDate}>{txn.date}</Text>
                  </View>
                  <Text style={[styles.txnAmount, txn.amount >= 0 ? styles.txnAmountPositive : styles.txnAmountNegative]}>
                    {txn.amount >= 0 ? '+' : '-'}
                    {formatRupees(Math.abs(txn.amount))}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </ScrollView>
        {Toast}
      </View>
    );
  }

  // =======================================================================
  // PAGE: Add money — full screen
  // =======================================================================
  if (page === 'addMoney') {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <PageHeader title="Add money" onBack={handleBack} colors={COLORS} styles={styles} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.inputLabel}>QUICK AMOUNTS</Text>
          <View style={styles.chipRow}>
            {QUICK_ADD_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[styles.chip, amountChip === amt && styles.chipActive]}
                onPress={() => {
                  setAmountChip(amt);
                  setCustomAmount('');
                }}
              >
                <Text style={[styles.chipText, amountChip === amt && styles.chipTextActive]}>
                  {'\u20b9'}
                  {amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>OR ENTER CUSTOM AMOUNT</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            placeholderTextColor={COLORS.grayDim}
            keyboardType="numeric"
            value={customAmount}
            onChangeText={(text) => {
              setCustomAmount(text.replace(/[^0-9.]/g, ''));
              setAmountChip(null);
            }}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, !isAmountValid && styles.primaryBtnDisabled]}
            disabled={!isAmountValid}
            onPress={handleConfirmAddMoney}
          >
            <Text style={styles.primaryBtnText}>
              {isAmountValid ? `Add \u20b9${enteredAmount.toLocaleString('en-IN')}` : 'Enter an amount'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
        {Toast}
      </View>
    );
  }

  // =======================================================================
  // PAGE: UPI detail — full screen
  // =======================================================================
  if (page === 'upiDetail' && selectedUpi) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <PageHeader title="UPI ID" onBack={handleBack} colors={COLORS} styles={styles} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.detailKeyRow}>
              <Text style={styles.detailKey}>VPA</Text>
              <Text style={styles.detailValue}>{selectedUpi.vpa}</Text>
            </View>
            <View style={[styles.detailKeyRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailKey}>Status</Text>
              <Text style={styles.detailValue}>{selectedUpi.isDefault ? 'Default' : 'Active'}</Text>
            </View>
          </View>

          {!selectedUpi.isDefault && (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => handleUpiSetDefault(selectedUpi.id)}>
              <Text style={styles.primaryBtnText}>Set as default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleUpiRemove(selectedUpi.id)}>
            <Text style={styles.dangerBtnText}>Remove UPI ID</Text>
          </TouchableOpacity>
        </ScrollView>
        {Toast}
      </View>
    );
  }

  // =======================================================================
  // PAGE: Add UPI — full screen
  // =======================================================================
  if (page === 'addUpi') {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <PageHeader title="Add UPI ID" onBack={handleBack} colors={COLORS} styles={styles} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.inputLabel}>UPI ID</Text>
          <TextInput
            style={styles.input}
            placeholder="yourname@bank"
            placeholderTextColor={COLORS.grayDim}
            autoCapitalize="none"
            value={newVpa}
            onChangeText={setNewVpa}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, !isVpaValid && styles.primaryBtnDisabled]}
            disabled={!isVpaValid}
            onPress={handleAddUpi}
          >
            <Text style={styles.primaryBtnText}>Link UPI ID</Text>
          </TouchableOpacity>
        </ScrollView>
        {Toast}
      </View>
    );
  }

  // =======================================================================
  // PAGE: Card detail — full screen
  // =======================================================================
  if (page === 'cardDetail' && selectedCard) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <PageHeader title="Saved card" onBack={handleBack} colors={COLORS} styles={styles} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.detailKeyRow}>
              <Text style={styles.detailKey}>Card</Text>
              <Text style={styles.detailValue}>
                {selectedCard.brand} {'\u2022\u2022\u2022\u2022'} {selectedCard.last4}
              </Text>
            </View>
            <View style={styles.detailKeyRow}>
              <Text style={styles.detailKey}>Expires</Text>
              <Text style={styles.detailValue}>{selectedCard.expiry}</Text>
            </View>
            <View style={[styles.detailKeyRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailKey}>Status</Text>
              <Text style={styles.detailValue}>{selectedCard.isDefault ? 'Default' : 'Active'}</Text>
            </View>
          </View>

          {!selectedCard.isDefault && (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => handleCardSetDefault(selectedCard.id)}>
              <Text style={styles.primaryBtnText}>Set as default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleCardRemove(selectedCard.id)}>
            <Text style={styles.dangerBtnText}>Remove card</Text>
          </TouchableOpacity>
        </ScrollView>
        {Toast}
      </View>
    );
  }

  // =======================================================================
  // PAGE: Add card — full screen
  // =======================================================================
  if (page === 'addCard') {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <PageHeader title="Add new card" onBack={handleBack} colors={COLORS} styles={styles} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.inputLabel}>CARD NUMBER</Text>
          <TextInput
            style={styles.input}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={COLORS.grayDim}
            keyboardType="numeric"
            value={cardNumber}
            onChangeText={setCardNumber}
          />
          <Text style={styles.inputLabel}>EXPIRY (MM/YY)</Text>
          <TextInput
            style={styles.input}
            placeholder="08/28"
            placeholderTextColor={COLORS.grayDim}
            value={cardExpiry}
            onChangeText={setCardExpiry}
          />
          <Text style={styles.inputLabel}>NAME ON CARD</Text>
          <TextInput
            style={styles.input}
            placeholder="As printed on card"
            placeholderTextColor={COLORS.grayDim}
            value={cardName}
            onChangeText={setCardName}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, !isCardValid && styles.primaryBtnDisabled]}
            disabled={!isCardValid}
            onPress={handleAddCard}
          >
            <Text style={styles.primaryBtnText}>Save card</Text>
          </TouchableOpacity>
        </ScrollView>
        {Toast}
      </View>
    );
  }

  // =======================================================================
  // PAGE: Main payments list (default)
  // =======================================================================
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <PageHeader title="Payments" onBack={handleBack} colors={COLORS} styles={styles} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subHeader}>Manage how you pay, all in one place.</Text>

        {/* ---------- Balance, cashback & refunds ---------- */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceCardTitle}>Balance, cashback & refunds</Text>

          <View style={styles.balanceRow}>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceValue}>{formatRupees(walletBalance)}</Text>
              <Text style={styles.balanceLabel}>Wallet balance</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Text style={[styles.balanceValue, styles.balanceValueAccent]}>
                {formatRupees(CASHBACK_EARNED)}
              </Text>
              <Text style={styles.balanceLabel}>Cashback earned</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceValue}>{formatRupees(REFUNDS_PENDING)}</Text>
              <Text style={styles.balanceLabel}>Refunds</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.balanceHistoryBtn} onPress={() => goTo('wallet')}>
            <Text style={styles.balanceHistoryText}>View transaction history</Text>
            <HistoryIcon size={15} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {/* ---------- Wallet ---------- */}
        <SectionLabel styles={styles}>WALLET</SectionLabel>
        <View style={styles.card}>
          <Row
            colors={COLORS}
            styles={styles}
            icon={<WalletIcon size={17} color={COLORS.accent} />}
            title="Wallet"
            subtitle={`Available balance: ${formatRupees(walletBalance)}`}
            onPress={() => goTo('wallet')}
            showChevron
          />
          <Divider styles={styles} />
          <Row
            colors={COLORS}
            styles={styles}
            icon={<PlusCircleIcon size={17} color={COLORS.accent} />}
            title="Add money"
            subtitle="Top up your wallet instantly"
            onPress={() => goTo('addMoney')}
            showChevron
          />
        </View>

        {/* ---------- UPI ---------- */}
        <SectionLabel styles={styles}>UPI</SectionLabel>
        <View style={styles.card}>
          {upiHandles.map((handle, index) => (
            <React.Fragment key={handle.id}>
              {index > 0 && <Divider styles={styles} />}
              <Row
                colors={COLORS}
                styles={styles}
                icon={<UpiIcon size={17} color={COLORS.accent} />}
                title={handle.vpa}
                subtitle={handle.isDefault ? 'Default UPI ID' : undefined}
                badge={handle.isDefault ? 'Default' : undefined}
                onPress={() => {
                  setSelectedUpiId(handle.id);
                  goTo('upiDetail');
                }}
                showChevron
              />
            </React.Fragment>
          ))}
          <Divider styles={styles} />
          <Row
            colors={COLORS}
            styles={styles}
            icon={<PlusCircleIcon size={17} color={COLORS.accent} />}
            title="Add new UPI ID"
            subtitle="Link a UPI ID or scan a QR"
            onPress={() => goTo('addUpi')}
            showChevron
          />
        </View>

        {/* ---------- Saved card ---------- */}
        <SectionLabel styles={styles}>SAVED CARD</SectionLabel>
        <View style={styles.card}>
          {cards.map((card, index) => (
            <React.Fragment key={card.id}>
              {index > 0 && <Divider styles={styles} />}
              <Row
                colors={COLORS}
                styles={styles}
                icon={<CardIcon size={17} color={COLORS.accent} />}
                title={`\u2022\u2022\u2022\u2022 ${card.last4}`}
                subtitle={`${card.brand} \u00b7 Expires ${card.expiry}`}
                badge={card.isDefault ? 'Default' : undefined}
                onPress={() => {
                  setSelectedCardId(card.id);
                  goTo('cardDetail');
                }}
                showChevron
              />
            </React.Fragment>
          ))}
          <Divider styles={styles} />
          <Row
            colors={COLORS}
            styles={styles}
            icon={<PlusCircleIcon size={17} color={COLORS.accent} />}
            title="Add new card"
            subtitle="Debit or credit card"
            onPress={() => goTo('addCard')}
            showChevron
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {Toast}
    </View>
  );
});

export default PaymentsScreen;

// ---------------- Styles ------------------------------------------------
// A factory, not a module-level constant: colors change with the app theme,
// so the stylesheet has to be rebuilt from the current palette on every
// render instead of being computed once (dark-only) at import time.

function createStyles(COLORS: ReturnType<typeof useNativeColors>) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 14,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4 },

  subHeader: { color: COLORS.gray, fontSize: 13, lineHeight: 18, marginTop: 4, marginBottom: 20 },

  sectionLabel: {
    color: COLORS.grayDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  divider: { height: 1, backgroundColor: COLORS.border },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTextWrap: { flex: 1, paddingRight: 12 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  rowSubtitle: { color: COLORS.gray, fontSize: 12.5, lineHeight: 17, marginTop: 3 },

  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.accentDeep,
  },
  badgeText: { color: COLORS.accent, fontSize: 10.5, fontWeight: '700' },

  balanceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 24,
  },
  balanceCardTitle: { color: COLORS.white, fontSize: 15, fontWeight: '700', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceStat: { flex: 1, alignItems: 'center' },
  balanceDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  balanceValue: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  balanceValueAccent: { color: COLORS.accent },
  balanceLabel: { color: COLORS.gray, fontSize: 11, marginTop: 4, textAlign: 'center' },
  balanceHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  balanceHistoryText: { color: COLORS.accent, fontSize: 13, fontWeight: '700' },

  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 34,
    backgroundColor: '#1D1E22',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.accentDeep,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  toastText: { color: COLORS.white, fontSize: 13.5, fontWeight: '600', textAlign: 'center' },

  primaryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 18,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  secondaryBtn: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },

  dangerBtnText: { color: COLORS.danger, fontSize: 14, fontWeight: '600' },

  input: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.white,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  inputLabel: { color: COLORS.gray, fontSize: 12, marginTop: 14, marginBottom: 2 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(95,163,0,0.18)' },
  chipText: { color: COLORS.white, fontSize: 13.5, fontWeight: '600' },
  chipTextActive: { color: COLORS.accentLight },

  amountBig: { color: COLORS.white, fontSize: 34, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  amountCurrency: { color: COLORS.gray, fontSize: 14, textAlign: 'center', marginTop: 2 },

  txnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  txnTitle: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  txnDate: { color: COLORS.grayDim, fontSize: 11.5, marginTop: 2 },
  txnAmount: { fontSize: 14, fontWeight: '700' },
  txnAmountPositive: { color: '#7EC400' },
  txnAmountNegative: { color: COLORS.white },

  detailKeyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailKey: { color: COLORS.gray, fontSize: 13 },
  detailValue: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  });
}
