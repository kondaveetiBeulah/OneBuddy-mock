import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config';
import { OrderDoc } from '../types';
import type { OrderCard } from '../../native/screens/OrdersAndBookings/types';

function stripOrder({ updatedAt: _u, ...rest }: OrderDoc): OrderCard {
  return rest;
}

/** Reads the signed-in user's orders once. */
export async function listOrders(uid: string): Promise<OrderCard[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'orders'));
  const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id } as OrderDoc));
  docs.sort((a, b) => {
    const tA = (a.updatedAt && typeof (a.updatedAt as any).toMillis === 'function')
      ? (a.updatedAt as any).toMillis()
      : (typeof a.updatedAt === 'number' ? a.updatedAt : 0);
    const tB = (b.updatedAt && typeof (b.updatedAt as any).toMillis === 'function')
      ? (b.updatedAt as any).toMillis()
      : (typeof b.updatedAt === 'number' ? b.updatedAt : 0);
    return tB - tA;
  });
  return docs.map((d) => stripOrder(d));
}

/** Subscribes in real-time to the signed-in user's orders projection. */
export function subscribeUserOrders(
  uid: string,
  onData: (orders: OrderCard[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = collection(db, 'users', uid, 'orders');
  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map((d) => ({ ...d.data(), id: d.id } as OrderDoc));
      docs.sort((a, b) => {
        const tA = (a.updatedAt && typeof (a.updatedAt as any).toMillis === 'function')
          ? (a.updatedAt as any).toMillis()
          : (typeof a.updatedAt === 'number' ? a.updatedAt : 0);
        const tB = (b.updatedAt && typeof (b.updatedAt as any).toMillis === 'function')
          ? (b.updatedAt as any).toMillis()
          : (typeof b.updatedAt === 'number' ? b.updatedAt : 0);
        return tB - tA;
      });
      onData(docs.map((d) => stripOrder(d)));
    },
    (err) => {
      console.warn('[ordersService] Real-time orders subscription error:', err);
      onError?.(err);
    }
  );
}

/**
 * Cancels an order server-side via the `cancelOrder` Cloud Function,
 * verifying ownership, initiating wallet refunds, and updating lifecycle trail.
 */
export async function cancelOrder(
  orderId: string,
  reason?: string
): Promise<{ success: boolean; message?: string }> {
  const call = httpsCallable<{ orderId: string; reason?: string }, { success: boolean; message?: string }>(
    functions,
    'cancelOrder'
  );
  const res = await call({ orderId, reason });
  return res.data;
}

/**
 * Reschedules an order server-side via the `rescheduleOrder` Cloud Function.
 */
export async function rescheduleOrder(
  orderId: string,
  scheduledAt: string,
  reason?: string
): Promise<{ success: boolean; orderId: string; scheduledAt: string }> {
  const call = httpsCallable<{ orderId: string; scheduledAt: string; reason?: string }, any>(
    functions,
    'rescheduleOrder'
  );
  const res = await call({ orderId, scheduledAt, reason });
  return res.data;
}

/**
 * Runs a card action (Track / Reorder / Invoice / Reschedule / Rebook).
 * If the user tapped Cancel, it automatically dispatches to the dedicated `cancelOrder` callable.
 */
export async function runOrderAction(
  orderId: string,
  action: string
): Promise<OrderCard> {
  const norm = action.toLowerCase().trim();
  if (norm === 'cancel' || norm === 'cancel order') {
    await cancelOrder(orderId, 'Cancelled via Orders & Bookings');
    return {
      id: orderId,
      status: 'Cancelled',
      statusKind: 'done',
      group: 'Completed',
      actions: ['Reorder'],
    } as any;
  }

  const call = httpsCallable<{ orderId: string; action: string }, OrderCard>(
    functions,
    'runOrderAction'
  );
  const res = await call({ orderId, action });
  return res.data;
}

