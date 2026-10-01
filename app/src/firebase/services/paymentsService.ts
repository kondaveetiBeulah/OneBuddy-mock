import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config';
import { CardDoc, TransactionDoc, UpiDoc } from '../types';
import { SavedCard, Transaction, UpiHandle } from '../../native/screens/Payments/types';

export interface PaymentsSnapshot {
  walletBalance: number;
  cards: SavedCard[];
  upiHandles: UpiHandle[];
  transactions: Transaction[];
}

function stripCard({ updatedAt: _u, ...rest }: CardDoc): SavedCard {
  return rest;
}
function stripUpi({ updatedAt: _u, ...rest }: UpiDoc): UpiHandle {
  return rest;
}
function stripTx({ createdAt: _c, ...rest }: TransactionDoc): Transaction {
  return rest;
}

export async function fetchPaymentsSnapshot(uid: string): Promise<PaymentsSnapshot> {
  const [walletSnap, methodsSnap, txSnap] = await Promise.all([
    getDoc(doc(db, 'wallets', uid)),
    getDocs(collection(db, 'users', uid, 'paymentMethods')),
    getDocs(query(collection(db, 'wallets', uid, 'entries'), orderBy('createdAt', 'desc'))),
  ]);

  return {
    walletBalance: walletSnap.exists()
      ? typeof walletSnap.data().balanceMinor === 'number'
        ? (walletSnap.data().balanceMinor as number) / 100
        : (walletSnap.data().balance as number) || 0
      : 0,
    cards: methodsSnap.docs.filter((d) => d.data().type === 'card').map((d) => stripCard(d.data() as CardDoc)),
    upiHandles: methodsSnap.docs.filter((d) => d.data().type === 'upi').map((d) => stripUpi(d.data() as UpiDoc)),
    transactions: txSnap.docs.map((d) => stripTx(d.data() as TransactionDoc)),
  };
}

export async function saveCard(uid: string, card: SavedCard): Promise<void> {
  const call = httpsCallable<{ id: string; type: string } & SavedCard, { success: boolean }>(functions, 'savePaymentMethod');
  await call({ ...card, type: 'card' });
}

export async function removeCard(uid: string, cardId: string): Promise<void> {
  const call = httpsCallable<{ id: string }, { success: boolean }>(functions, 'removePaymentMethod');
  await call({ id: cardId });
}

export async function saveUpiHandle(uid: string, upi: UpiHandle): Promise<void> {
  const call = httpsCallable<{ id: string; type: string } & UpiHandle, { success: boolean }>(functions, 'savePaymentMethod');
  await call({ ...upi, type: 'upi' });
}

export async function removeUpiHandle(uid: string, upiId: string): Promise<void> {
  const call = httpsCallable<{ id: string }, { success: boolean }>(functions, 'removePaymentMethod');
  await call({ id: upiId });
}

/**
 * Wallet balance is server-authoritative: the client never writes
 * `meta/wallet` directly. This calls the `addMoney` Cloud Function, which
 * validates the amount, increments the balance and appends the matching
 * transaction in one atomic write (see functions/src/payments.ts).
 */
export async function addMoney(amount: number): Promise<{ balance: number }> {
  const call = httpsCallable<{ amount: number }, { balance: number }>(functions, 'addMoney');
  const res = await call({ amount });
  return res.data;
}

/** Same reasoning as addMoney: a card/UPI "charge" is simulated server-side
 *  so the balance and the transaction log can never drift apart. */
export async function chargeWallet(
  amount: number,
  title: string
): Promise<{ balance: number }> {
  const call = httpsCallable<{ amount: number; title: string }, { balance: number }>(
    functions,
    'chargeWallet'
  );
  const res = await call({ amount, title });
  return res.data;
}
