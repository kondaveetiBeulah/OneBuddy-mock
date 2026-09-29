import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './core/firebase';
import { secureCallable } from './core/callable';
import { log, throwError } from './core/logger';

// ----------------------------------------------------------------------------
// PAYMENT METHODS (Strict PCI-DSS Compliant Schemas — No PAN, CVV, or PIN)
// ----------------------------------------------------------------------------

const cardPaymentMethodSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.literal('card'),
  brand: z.string().min(1).max(50),
  last4: z.string().regex(/^\d{4}$/, 'last4 must be exactly 4 digits'),
  expiry: z.string().min(4).max(7),
  isDefault: z.boolean().optional(),
  providerToken: z.string().optional(),
}).strict();

const upiPaymentMethodSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.literal('upi'),
  vpa: z.string().min(3).max(100),
  isDefault: z.boolean().optional(),
}).strict();

const paymentMethodSchema = z.discriminatedUnion('type', [
  cardPaymentMethodSchema,
  upiPaymentMethodSchema,
]);

export const savePaymentMethod = secureCallable(paymentMethodSchema, async (data, context) => {
  const uid = context.auth.uid;
  const methodRef = db.collection('users').doc(uid).collection('paymentMethods').doc(data.id);
  
  const safeData = data.type === 'card'
    ? {
        id: data.id,
        type: 'card' as const,
        brand: data.brand,
        last4: data.last4,
        expiry: data.expiry,
        isDefault: data.isDefault ?? false,
        ...(data.providerToken ? { providerToken: data.providerToken } : {}),
      }
    : {
        id: data.id,
        type: 'upi' as const,
        vpa: data.vpa,
        isDefault: data.isDefault ?? false,
      };

  await methodRef.set({
    ...safeData,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  
  log.info(`User ${uid} saved payment method ${data.id} (${data.type})`);
  return { success: true };
});

export const removePaymentMethod = secureCallable(
  z.object({ id: z.string().min(1) }).strict(),
  async (data, context) => {
    const uid = context.auth.uid;
    await db.collection('users').doc(uid).collection('paymentMethods').doc(data.id).delete();
    log.info(`User ${uid} removed payment method ${data.id}`);
    return { success: true };
  }
);

// ----------------------------------------------------------------------------
// WALLET TRANSACTIONS (Using Firestore Transactions for safety & Idempotency)
// ----------------------------------------------------------------------------

export const addMoney = secureCallable(
  z.object({
    amount: z.number().positive(),
    idempotencyKey: z.string().optional(),
  }),
  async (data, context) => {
    const uid = context.auth.uid;
    const walletRef = db.collection('wallets').doc(uid);
    const entryId = data.idempotencyKey ? `entry_${data.idempotencyKey}` : walletRef.collection('entries').doc().id;
    const entryRef = walletRef.collection('entries').doc(entryId);

    const amountMinor = Math.round(data.amount * 100);

    const { updatedBalance, updatedBalMinor } = await db.runTransaction(async (t) => {
      // 1. Idempotency Check
      const existingEntry = await t.get(entryRef);
      const walletDoc = await t.get(walletRef);

      if (!walletDoc.exists) {
        throwError('not-found', 'Wallet not found.');
      }

      const wData = walletDoc.data() || {};
      const currentBalMinor = typeof wData.balanceMinor === 'number'
        ? wData.balanceMinor
        : Math.round((wData.balance || 0) * 100);

      // If entry was already processed, return current balance without re-applying credit
      if (existingEntry.exists) {
        log.warn(`Duplicate top-up attempt prevented for user ${uid}, key: ${data.idempotencyKey}`);
        return { updatedBalance: currentBalMinor / 100, updatedBalMinor: currentBalMinor };
      }

      const updatedBalMinor = currentBalMinor + amountMinor;
      const updatedBalance = updatedBalMinor / 100;

      t.update(walletRef, { 
        balance: updatedBalance,
        balanceMinor: updatedBalMinor,
        updatedAt: FieldValue.serverTimestamp() 
      });

      t.set(entryRef, {
        id: entryRef.id,
        direction: 'credit',
        type: 'topup',
        amount: data.amount,
        amountMinor,
        title: 'Added Money',
        idempotencyKey: data.idempotencyKey || entryRef.id,
        createdAt: FieldValue.serverTimestamp(),
      });

      return { updatedBalance, updatedBalMinor };
    });

    log.info(`User ${uid} added ₹${data.amount} to wallet. New balance: ₹${updatedBalance}`);
    return { balance: updatedBalance, balanceMinor: updatedBalMinor };
  }
);

export const chargeWallet = secureCallable(
  z.object({
    amount: z.number().positive(),
    title: z.string(),
    type: z.enum(['topup', 'order_payment', 'refund', 'adjustment']).optional(),
    idempotencyKey: z.string().optional(),
  }),
  async (data, context) => {
    const uid = context.auth.uid;
    const walletRef = db.collection('wallets').doc(uid);
    const entryId = data.idempotencyKey ? `entry_${data.idempotencyKey}` : walletRef.collection('entries').doc().id;
    const entryRef = walletRef.collection('entries').doc(entryId);

    const amountMinor = Math.round(data.amount * 100);

    const { updatedBalance, updatedBalMinor } = await db.runTransaction(async (t) => {
      const existingEntry = await t.get(entryRef);
      const walletDoc = await t.get(walletRef);

      if (!walletDoc.exists) {
        throwError('not-found', 'Wallet not found.');
      }

      const wData = walletDoc.data() || {};
      const currentBalMinor = typeof wData.balanceMinor === 'number'
        ? wData.balanceMinor
        : Math.round((wData.balance || 0) * 100);

      if (existingEntry.exists) {
        log.warn(`Duplicate charge attempt prevented for user ${uid}, key: ${data.idempotencyKey}`);
        return { updatedBalance: currentBalMinor / 100, updatedBalMinor: currentBalMinor };
      }

      if (currentBalMinor < amountMinor) {
        throwError('invalid-argument', 'Insufficient wallet balance.');
      }

      const updatedBalMinor = currentBalMinor - amountMinor;
      const updatedBalance = updatedBalMinor / 100;

      t.update(walletRef, { 
        balance: updatedBalance,
        balanceMinor: updatedBalMinor,
        updatedAt: FieldValue.serverTimestamp() 
      });

      t.set(entryRef, {
        id: entryRef.id,
        direction: 'debit',
        type: data.type || 'order_payment',
        amount: data.amount,
        amountMinor,
        title: data.title,
        idempotencyKey: data.idempotencyKey || entryRef.id,
        createdAt: FieldValue.serverTimestamp(),
      });

      return { updatedBalance, updatedBalMinor };
    });

    log.info(`User ${uid} charged ₹${data.amount} from wallet. New balance: ₹${updatedBalance}`);
    return { balance: updatedBalance, balanceMinor: updatedBalMinor };
  }
);
