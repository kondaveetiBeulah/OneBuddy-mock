import { z } from 'zod';
import { db } from '../../common/firebase';
import { secureCallable } from '../../common/auth';
import { log } from '../../common/logging';
import { throwError } from '../../common/errors';
import { WalletsRepository } from '../../repositories';

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
  const entryId = `entry_${source.paymentId}`;

  return await db.runTransaction(async (t) => {
    const existingEntry = await WalletsRepository.getEntry(uid, entryId, t);
    const walletDoc = await WalletsRepository.getWallet(uid, t);

    let currentBalMinor = 0;
    if (!walletDoc.exists) {
      currentBalMinor = 0;
      await WalletsRepository.ensureWallet(uid, t);
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

    WalletsRepository.updateBalance(uid, updatedBalMinor, t);

    WalletsRepository.saveEntry(
      uid,
      {
        id: entryId,
        direction: 'credit',
        type: source.type || 'topup',
        amountMinor,
        amount: amountMinor / 100,
        currency: 'INR',
        paymentId: source.paymentId,
        idempotencyKey: source.idempotencyKey,
        description: source.description || `Wallet Top-up via ${source.provider}`,
      },
      t
    );

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
  const entryId = `entry_${details.idempotencyKey}`;

  const existingEntry = await WalletsRepository.getEntry(uid, entryId, t);
  const walletDoc = await WalletsRepository.getWallet(uid, t);

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

  WalletsRepository.updateBalance(uid, newBalMinor, t);

  WalletsRepository.saveEntry(
    uid,
    {
      id: entryId,
      direction: 'debit',
      type: details.type || 'order_payment',
      amountMinor,
      amount: amountMinor / 100,
      currency: 'INR',
      orderId: details.orderId || null,
      idempotencyKey: details.idempotencyKey,
      description: details.description || details.title || 'Wallet payment',
    },
    t
  );

  return { newBalMinor, newBalance: newBalMinor / 100 };
}

export const getWallet = secureCallable(
  z.object({}).strict(),
  async (_data, context) => {
    const uid = context.auth.uid;
    const { balanceMinor, currency } = await WalletsRepository.ensureWallet(uid);

    return {
      userId: uid,
      balanceMinor,
      balance: balanceMinor / 100,
      currency,
    };
  }
);
