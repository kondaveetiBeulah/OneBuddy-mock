import { z } from 'zod';
import { db } from './core/firebase';
import { secureCallable } from './core/callable';
import { log, throwError } from './core/logger';

// ----------------------------------------------------------------------------
// PAYMENT METHODS
// ----------------------------------------------------------------------------

const paymentMethodSchema = z.object({
  id: z.string(),
  type: z.enum(['card', 'upi']),
}).passthrough();

export const savePaymentMethod = secureCallable(paymentMethodSchema, async (data, context) => {
  const uid = context.auth.uid;
  const methodRef = db.collection('users').doc(uid).collection('paymentMethods').doc(data.id);
  
  await methodRef.set({
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  log.info(`User ${uid} saved payment method ${data.id}`);
  return { success: true };
});

export const removePaymentMethod = secureCallable(z.object({ id: z.string() }), async (data, context) => {
  const uid = context.auth.uid;
  await db.collection('users').doc(uid).collection('paymentMethods').doc(data.id).delete();
  log.info(`User ${uid} removed payment method ${data.id}`);
  return { success: true };
});

// ----------------------------------------------------------------------------
// WALLET TRANSACTIONS (Using Firestore Transactions for safety)
// ----------------------------------------------------------------------------

export const addMoney = secureCallable(
  z.object({ amount: z.number().positive() }),
  async (data, context) => {
    const uid = context.auth.uid;
    const walletRef = db.collection('wallets').doc(uid);
    const entryRef = walletRef.collection('entries').doc();

    const newBalance = await db.runTransaction(async (t) => {
      const walletDoc = await t.get(walletRef);
      if (!walletDoc.exists) {
        throwError('not-found', 'Wallet not found.');
      }
      const currentBalance = walletDoc.data()?.balance || 0;
      const updatedBalance = currentBalance + data.amount;

      t.update(walletRef, { balance: updatedBalance, updatedAt: new Date().toISOString() });
      t.set(entryRef, {
        id: entryRef.id,
        type: 'credit',
        amount: data.amount,
        title: 'Added Money',
        createdAt: new Date().toISOString(),
      });

      return updatedBalance;
    });

    log.info(`User ${uid} added ${data.amount} to wallet. New balance: ${newBalance}`);
    return { balance: newBalance };
  }
);

export const chargeWallet = secureCallable(
  z.object({ amount: z.number().positive(), title: z.string() }),
  async (data, context) => {
    const uid = context.auth.uid;
    const walletRef = db.collection('wallets').doc(uid);
    const entryRef = walletRef.collection('entries').doc();

    const newBalance = await db.runTransaction(async (t) => {
      const walletDoc = await t.get(walletRef);
      if (!walletDoc.exists) {
        throwError('not-found', 'Wallet not found.');
      }
      const currentBalance = walletDoc.data()?.balance || 0;
      
      if (currentBalance < data.amount) {
        throwError('invalid-argument', 'Insufficient wallet balance.');
      }
      
      const updatedBalance = currentBalance - data.amount;

      t.update(walletRef, { balance: updatedBalance, updatedAt: new Date().toISOString() });
      t.set(entryRef, {
        id: entryRef.id,
        type: 'debit',
        amount: data.amount,
        title: data.title,
        createdAt: new Date().toISOString(),
      });

      return updatedBalance;
    });

    log.info(`User ${uid} charged ${data.amount} from wallet. New balance: ${newBalance}`);
    return { balance: newBalance };
  }
);
