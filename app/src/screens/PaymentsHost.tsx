import React, { useEffect, useState } from 'react';
import { Modal, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PaymentsScreen, type PaymentsScreenRef } from '../native/screens/Payments';
import type { SavedCard, UpiHandle } from '../native/screens/Payments/types';
import { useAuth } from '../firebase/context/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';
import {
  addMoney,
  fetchPaymentsSnapshot,
  removeCard,
  removeUpiHandle,
  saveCard,
  saveUpiHandle,
} from '../firebase/services/paymentsService';

interface PaymentsHostProps {
  visible?: boolean;
  onClose: () => void;
  asModal?: boolean;
}

/**
 * Opens the payments project's screen full-screen over the WebView.
 *
 * When signed in, the wallet balance, cards and UPI handles are loaded from
 * Firestore on open. The wallet balance itself is server-authoritative —
 * "Add money" calls the `addMoney` Cloud Function rather than writing the
 * balance directly (see src/firebase/services/paymentsService.ts) — while
 * cards and UPI handles are synced with a diff against the previous list on
 * every change. Signed out, the screen falls back to its own local mock
 * data exactly as before.
 */
export default function PaymentsHost({
  visible = true,
  onClose,
  asModal = false,
}: PaymentsHostProps): React.JSX.Element {
  const { user, enabled } = useAuth();
  const { colors: themeColors, scheme } = useAppTheme();
  const [walletBalance, setWalletBalance] = useState<number | undefined>(undefined);
  const [cards, setCards] = useState<SavedCard[] | undefined>(undefined);
  const [upiHandles, setUpiHandles] = useState<UpiHandle[] | undefined>(undefined);
  const cardsRef = React.useRef<SavedCard[]>([]);
  const upiRef = React.useRef<UpiHandle[]>([]);
  const paymentsRef = React.useRef<PaymentsScreenRef>(null);

  useEffect(() => {
    if (!visible || !enabled || !user) {
      setWalletBalance(undefined);
      setCards(undefined);
      setUpiHandles(undefined);
      return;
    }
    let cancelled = false;
    fetchPaymentsSnapshot(user.uid).then((snap) => {
      if (cancelled) return;
      setWalletBalance(snap.walletBalance);
      setCards(snap.cards);
      setUpiHandles(snap.upiHandles);
      cardsRef.current = snap.cards;
      upiRef.current = snap.upiHandles;
    });
    return () => {
      cancelled = true;
    };
  }, [visible, enabled, user]);

  const handleAddMoney = (amount: number) => {
    if (enabled && user) {
      void addMoney(amount).catch(() => {
        // The screen has already shown its own optimistic toast; a failed
        // top-up will simply be corrected next time the balance is fetched.
      });
    }
  };

  const diffAndSync = <T extends { id: string }>(
    prevList: T[],
    nextList: T[],
    onAdd: (item: T) => Promise<void>,
    onRemove: (id: string) => Promise<void>
  ) => {
    const nextIds = new Set(nextList.map((i) => i.id));
    nextList.forEach((item) => {
      // Added, or an existing one whose fields changed (e.g. isDefault).
      const prevItem = prevList.find((p) => p.id === item.id);
      if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
        void onAdd(item);
      }
    });
    prevList.forEach((item) => {
      if (!nextIds.has(item.id)) void onRemove(item.id);
    });
  };

  const handleCardsChange = (next: SavedCard[]) => {
    if (enabled && user) {
      diffAndSync(cardsRef.current, next, (c) => saveCard(user.uid, c), (id) => removeCard(user.uid, id));
    }
    cardsRef.current = next;
  };

  const handleUpiChange = (next: UpiHandle[]) => {
    if (enabled && user) {
      diffAndSync(upiRef.current, next, (h) => saveUpiHandle(user.uid, h), (id) => removeUpiHandle(user.uid, id));
    }
    upiRef.current = next;
  };

  const handleRequestClose = () => {
    if (paymentsRef.current?.canGoBack()) {
      paymentsRef.current.goBack();
    } else {
      onClose();
    }
  };

  const content = (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.sheetBg }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <PaymentsScreen
        ref={paymentsRef}
        onBack={onClose}
        initialWalletBalance={walletBalance}
        initialCards={cards}
        initialUpiHandles={upiHandles}
        onAddMoney={handleAddMoney}
        onCardsChange={handleCardsChange}
        onUpiChange={handleUpiChange}
      />
    </SafeAreaView>
  );

  if (asModal) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleRequestClose}
        // Remounting on each open gives the screen a clean start, matching the
        // other native hosts.
        key={visible ? 'payments-open' : 'payments-closed'}
      >
        {content}
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
});
