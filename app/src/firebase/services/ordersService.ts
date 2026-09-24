import { collection, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config';
import { OrderDoc } from '../types';
import type { OrderCard } from '../../native/screens/OrdersAndBookings/types';

function stripOrder({ updatedAt: _u, ...rest }: OrderDoc): OrderCard {
  return rest;
}

/** Reads the signed-in user's orders. Falls back to an empty list (the
 *  screen's own `ORDERS` mock is used by the host when this comes back
 *  empty, e.g. a brand-new account) rather than throwing. */
export async function listOrders(uid: string): Promise<OrderCard[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'orders'));
  return snap.docs.map((d) => stripOrder(d.data() as OrderDoc));
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
