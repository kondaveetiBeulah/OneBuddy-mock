import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../core/firebase';
import { secureCallable } from '../../core/callable';
import { log, throwError } from '../../core/logger';

// ----------------------------------------------------------------------------
// WALLET TRANSACTIONS & LEDGER (Greenfield Sec. 4 Lines 283-285)
// ----------------------------------------------------------------------------

export async function applyWalletCredit(
  uid: string,
  amountMinor: number,
  source: {
    paymentId: string;
    provider: string;
    idempotencyKey: string;
    type?: 'topup' | 'refund' | 'adjustment';
    description?: string;
  }
): Promise<{ balanceMinor: number; balance: number; replayed: boolean }> {
  const walletRef = db.collection('wallets').doc(uid);
  const entryId = `entry_${source.paymentId}`;
  const entryRef = walletRef.collection('entries').doc(entryId);

  return await db.runTransaction(async (t) => {
    const existingEntry = await t.get(entryRef);
    const walletDoc = await t.get(walletRef);

    let currentBalMinor = 0;
    if (!walletDoc.exists) {
      currentBalMinor = 0;
      t.set(walletRef, {
        userId: uid,
        balanceMinor: 0,
        currency: 'INR',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      const wData = walletDoc.data() || {};
      currentBalMinor =
        typeof wData.balanceMinor === 'number'
          ? wData.balanceMinor
          : Math.round((wData.balance || 0) * 100);
    }

    if (existingEntry.exists) {
      log.warn(
        `[payments] Duplicate wallet credit prevented for user ${uid}, entry: ${entryId}`
      );
      return {
        balanceMinor: currentBalMinor,
        balance: currentBalMinor / 100,
        replayed: true,
      };
    }

    const updatedBalMinor = currentBalMinor + amountMinor;

    t.update(walletRef, {
      balanceMinor: updatedBalMinor,
      updatedAt: FieldValue.serverTimestamp(),
    });

    t.set(entryRef, {
      id: entryId,
      direction: 'credit',
      type: source.type || 'topup',
      amountMinor,
      amount: amountMinor / 100,
      currency: 'INR',
      paymentId: source.paymentId,
      idempotencyKey: source.idempotencyKey,
      description: source.description || `Wallet Top-up via ${source.provider}`,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      balanceMinor: updatedBalMinor,
      balance: updatedBalMinor / 100,
      replayed: false,
    };
  });
}

export async function applyWalletDebit(
  t: FirebaseFirestore.Transaction,
  uid: string,
  amountMinor: number,
  details: {
    orderId?: string | null;
    title?: string;
    description?: string;
    idempotencyKey: string;
    type?: 'order_payment' | 'adjustment';
  }
): Promise<{ newBalMinor: number; newBalance: number }> {
  const walletRef = db.collection('wallets').doc(uid);
  const entryId = `entry_${details.idempotencyKey}`;
  const entryRef = walletRef.collection('entries').doc(entryId);

  const existingEntry = await t.get(entryRef);
  const walletDoc = await t.get(walletRef);

  if (!walletDoc.exists) {
    throwError('not-found', 'Wallet record not found.');
  }

  const wData = walletDoc.data() || {};
  const currentBalMinor =
    typeof wData.balanceMinor === 'number'
      ? wData.balanceMinor
      : Math.round((wData.balance || 0) * 100);

  if (existingEntry.exists) {
    log.warn(
      `[payments] Duplicate wallet debit prevented for user ${uid}, key: ${details.idempotencyKey}`
    );
    return { newBalMinor: currentBalMinor, newBalance: currentBalMinor / 100 };
  }

  if (currentBalMinor < amountMinor) {
    throwError(
      'failed-precondition',
      `Insufficient wallet balance. Required: ₹${(amountMinor / 100).toFixed(2)}, available: ₹${(currentBalMinor / 100).toFixed(2)}.`
    );
  }

  const newBalMinor = currentBalMinor - amountMinor;

  t.update(walletRef, {
    balanceMinor: newBalMinor,
    updatedAt: FieldValue.serverTimestamp(),
  });

  t.set(entryRef, {
    id: entryId,
    direction: 'debit',
    type: details.type || 'order_payment',
    amountMinor,
    amount: amountMinor / 100,
    currency: 'INR',
    orderId: details.orderId || null,
    idempotencyKey: details.idempotencyKey,
    description: details.description || details.title || 'Wallet payment',
    createdAt: FieldValue.serverTimestamp(),
  });

  return { newBalMinor, newBalance: newBalMinor / 100 };
}

export const getWallet = secureCallable(
  z.object({}).strict(),
  async (_data, context) => {
    const uid = context.auth.uid;
    const walletRef = db.collection('wallets').doc(uid);
    const walletSnap = await walletRef.get();

    if (!walletSnap.exists) {
      // Auto-initialize balance projection per Greenfield specification
      const initialWallet = {
        userId: uid,
        balanceMinor: 0,
        currency: 'INR',
        updatedAt: FieldValue.serverTimestamp(),
      };
      await walletRef.set(initialWallet);
      return {
        userId: uid,
        balanceMinor: 0,
        balance: 0,
        currency: 'INR',
      };
    }

    const data = walletSnap.data() || {};
    const balanceMinor = typeof data.balanceMinor === 'number'
      ? data.balanceMinor
      : Math.round((data.balance || 0) * 100);

    return {
      userId: uid,
      balanceMinor,
      balance: balanceMinor / 100,
      currency: data.currency || 'INR',
    };
  }
);
