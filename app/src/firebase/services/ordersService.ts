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
 * Runs a card action (Track / Reorder / Cancel / Reschedule / Invoice)
 * server-side via the `runOrderAction` Cloud Function, which applies the
 * matching status transition and returns the updated order so the screen
 * can patch its list without a full refetch.
 */
export async function runOrderAction(
  orderId: string,
  action: string
): Promise<OrderCard> {
  const call = httpsCallable<{ orderId: string; action: string }, OrderCard>(
    functions,
    'runOrderAction'
  );
  const res = await call({ orderId, action });
  return res.data;
}
