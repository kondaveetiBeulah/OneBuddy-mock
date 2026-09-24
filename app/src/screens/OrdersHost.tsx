import React, { useEffect, useState } from 'react';
import { Modal, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import OrdersAndBookings from '../native/screens/OrdersAndBookings';
import type { OrderCard } from '../native/screens/OrdersAndBookings/types';
import { useAuth } from '../firebase/context/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';
import { listOrders, runOrderAction } from '../firebase/services/ordersService';

interface OrdersHostProps {
  visible?: boolean;
  onClose: () => void;
  onAction: (actionLabel: string, order: OrderCard) => void;
  asModal?: boolean;
}

/**
 * Opens the Orders & Bookings project's screen full-screen over the WebView.
 *
 * When signed in, orders are loaded from `users/{uid}/orders` on open
 * (falling back to the screen's own mock `ORDERS` for a brand-new account
 * with nothing yet). Card actions (Track, Reorder, Cancel, Reschedule,
 * Invoice) run through the `runOrderAction` Cloud Function so status
 * changes are applied server-side, then the returned order patches local
 * state before the action is relayed up to the document for its toast.
 */
export default function OrdersHost({
  visible = true,
  onClose,
  onAction,
  asModal = false,
}: OrdersHostProps): React.JSX.Element {
  const { user, enabled } = useAuth();
  const { colors: themeColors, scheme } = useAppTheme();
  const [orders, setOrders] = useState<OrderCard[] | undefined>(undefined);

  useEffect(() => {
    if (!visible || !enabled || !user) {
      setOrders(undefined);
      return;
    }
    let cancelled = false;
    listOrders(user.uid).then((fetched) => {
      if (!cancelled) setOrders(fetched);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, enabled, user]);

  const handleAction = (actionLabel: string, order: OrderCard) => {
    if (enabled && user && orders) {
      void runOrderAction(order.id, actionLabel)
        .then((updated) => {
          setOrders((prev) => {
            if (!prev) return prev;
            const withoutOld = prev.filter((o) => o.id !== order.id);
            // Reorder returns a *new* order id; everything else updates in place.
            return updated.id === order.id
              ? prev.map((o) => (o.id === order.id ? updated : o))
              : [updated, ...withoutOld];
          });
        })
        .catch(() => {
          // Leave local state as-is; the document's own toast still fires
          // below so the person isn't left wondering whether it worked.
        });
    }
    onAction(actionLabel, order);
  };

  const content = (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.sheetBg }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <OrdersAndBookings orders={orders} onClose={onClose} onAction={handleAction} />
    </SafeAreaView>
  );

  if (asModal) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
        // Remounting on each open gives the screen a clean start (tab back to
        // "All"), matching the other native hosts.
        key={visible ? 'orders-open' : 'orders-closed'}
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
