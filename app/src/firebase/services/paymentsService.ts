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

/**
 * Greenfield Architecture Note: Customer wallet debits are executed atomically
 * inside the server-authoritative `placeOrder` command transaction.
 * Standalone `chargeWallet` calls are restricted to administrative adjustments
 * or verified order checkout execution.
 */
export interface ChargeWalletParams {
  amount?: number;
  amountMinor?: number;
  title?: string;
  description?: string;
  orderId?: string;
  userId?: string;
  idempotencyKey?: string;
}

export async function chargeWallet(
  amountOrParams: number | ChargeWalletParams,
  title?: string
): Promise<{ balance: number; balanceMinor?: number }> {
  const payload: ChargeWalletParams =
    typeof amountOrParams === 'number'
      ? { amount: amountOrParams, title: title || 'Wallet Debit' }
      : amountOrParams;

  const call = httpsCallable<ChargeWalletParams, { balance: number; balanceMinor?: number }>(
    functions,
    'chargeWallet'
  );
  const res = await call(payload);
  return res.data;
}

export interface CreatePaymentIntentParams {
  amountMinor?: number;
  amount?: number;
  currency?: 'INR';
  provider?: 'razorpay' | 'stripe';
  orderId?: string;
  idempotencyKey: string;
  description?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface PaymentIntentResult {
  paymentId: string;
  provider: 'razorpay' | 'stripe';
  providerOrderId: string | null;
  clientSecret: string | null;
  amountMinor: number;
  amount: number;
  currency: string;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded' | 'voided';
  replayed: boolean;
}

/**
 * Creates a server-authoritative payment intent with Razorpay or Stripe
 * per Greenfield Specification. Captured status is never set from the client.
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResult> {
  const call = httpsCallable<CreatePaymentIntentParams, PaymentIntentResult>(
    functions,
    'createPaymentIntent'
  );
  const res = await call(params);
  return res.data;
}

export interface ListPaymentMethodsOptions {
  type?: 'card' | 'upi';
  limit?: number;
  cursor?: string;
  includeDeleted?: boolean;
}

export interface ListPaymentMethodsResult {
  paymentMethods: Array<SavedCard | UpiHandle>;
  nextCursor: string | null;
}

export async function listUserPaymentMethods(
  options?: ListPaymentMethodsOptions
): Promise<ListPaymentMethodsResult> {
  const call = httpsCallable<ListPaymentMethodsOptions, ListPaymentMethodsResult>(
    functions,
    'listPaymentMethods'
  );
  const res = await call(options || {});
  return res.data;
}

export interface WalletData {
  userId: string;
  balanceMinor: number;
  balance: number;
  currency: string;
}

export async function fetchWallet(): Promise<WalletData> {
  const call = httpsCallable<Record<string, never>, WalletData>(functions, 'getWallet');
  const res = await call({});
  return res.data;
}

export interface CreateTopUpParams {
  amountMinor?: number;
  amount?: number;
  currency?: 'INR';
  provider?: 'razorpay' | 'stripe';
  idempotencyKey?: string;
  autoConfirmInDev?: boolean;
}

export interface CreateTopUpResult {
  paymentId: string;
  provider: 'razorpay' | 'stripe';
  providerOrderId: string | null;
  clientSecret: string | null;
  amountMinor: number;
  amount: number;
  currency: string;
  status: string;
  replayed: boolean;
  balanceMinor?: number;
  balance?: number;
}

export interface ConfirmTopUpParams {
  paymentId: string;
  providerPaymentId?: string;
  providerSignature?: string;
  razorpayOrderId?: string;
}

export interface ConfirmTopUpResult {
  success: boolean;
  paymentId: string;
  status: string;
  balanceMinor: number;
  balance: number;
  replayed: boolean;
}

export async function createTopUp(
  paramsOrAmount: number | CreateTopUpParams,
  idempotencyKey?: string
): Promise<CreateTopUpResult> {
  const payload: CreateTopUpParams =
    typeof paramsOrAmount === 'number'
      ? { amount: paramsOrAmount, idempotencyKey, autoConfirmInDev: true }
      : paramsOrAmount;

  const call = httpsCallable<CreateTopUpParams, CreateTopUpResult>(
    functions,
    'createTopUp'
  );
  const res = await call(payload);
  return res.data;
}

export async function confirmTopUp(
  params: ConfirmTopUpParams
): Promise<ConfirmTopUpResult> {
  const call = httpsCallable<ConfirmTopUpParams, ConfirmTopUpResult>(
    functions,
    'confirmTopUp'
  );
  const res = await call(params);
  return res.data;
}

export interface WalletTransactionEntry {
  id: string;
  amountMinor: number;
  amount: number;
  currency: string;
  direction: 'credit' | 'debit';
  type: 'topup' | 'order_payment' | 'refund' | 'adjustment';
  orderId?: string | null;
  paymentId?: string | null;
  idempotencyKey?: string | null;
  description: string;
  createdAt: string | null;
}

export interface FetchWalletTransactionsOptions {
  limit?: number;
  cursor?: string;
  type?: 'topup' | 'order_payment' | 'refund' | 'adjustment';
  direction?: 'credit' | 'debit';
}

export async function fetchWalletTransactions(
  options?: FetchWalletTransactionsOptions
): Promise<{ entries: WalletTransactionEntry[]; nextCursor: string | null }> {
  const call = httpsCallable<
    FetchWalletTransactionsOptions,
    { entries: WalletTransactionEntry[]; nextCursor: string | null }
  >(functions, 'listWalletTransactions');
  const res = await call(options || {});
  return res.data;
}

export interface RefundPaymentParams {
  paymentId: string;
  amountMinor?: number;
  amount?: number;
  reasonCode:
    | 'customer_cancellation'
    | 'item_unavailable'
    | 'merchant_rejected'
    | 'duplicate'
    | 'fraud'
    | 'other';
  note?: string;
  idempotencyKey: string;
}

export interface RefundPaymentResult {
  success: boolean;
  refundId: string;
  providerRefundId: string;
  status: 'refunded' | 'partially_refunded';
  amountMinor: number;
  amount: number;
  currency: string;
  replayed: boolean;
}

export async function refundPayment(
  params: RefundPaymentParams
): Promise<RefundPaymentResult> {
  const call = httpsCallable<RefundPaymentParams, RefundPaymentResult>(
    functions,
    'refundPayment'
  );
  const res = await call(params);
  return res.data;
}

export async function fetchPaymentRefunds(
  paymentId: string,
  options?: { limit?: number; cursor?: string }
): Promise<{ refunds: any[]; nextCursor: string | null }> {
  const call = httpsCallable<
    { paymentId: string; limit?: number; cursor?: string },
    { refunds: any[]; nextCursor: string | null }
  >(functions, 'listPaymentRefunds');
  const res = await call({ paymentId, ...(options || {}) });
  return res.data;
}



