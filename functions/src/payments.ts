import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import * as crypto from 'crypto';
import { db } from './core/firebase';
import { secureCallable } from './core/callable';
import { log, throwError } from './core/logger';

// ----------------------------------------------------------------------------
// PAYMENT METHODS (Strict PCI-DSS Compliant Schemas — No PAN, CVV, or PIN)
// ----------------------------------------------------------------------------

const cardPaymentMethodSchema = z
  .object({
    id: z.string().min(1).max(100),
    type: z.literal('card'),
    brand: z.string().min(1).max(50),
    last4: z.string().regex(/^\d{4}$/, 'last4 must be exactly 4 digits'),
    expiry: z.string().min(4).max(7).optional(),
    expiryMonth: z.number().int().min(1).max(12).optional(),
    expiryYear: z.number().int().min(2024).max(2099).optional(),
    displayLabel: z.string().max(100).optional(),
    provider: z.string().max(50).optional(),
    isDefault: z.boolean().optional(),
    providerToken: z.string().optional(),
  })
  .strict();

const upiPaymentMethodSchema = z
  .object({
    id: z.string().min(1).max(100),
    type: z.literal('upi'),
    vpa: z.string().min(3).max(100),
    displayLabel: z.string().max(100).optional(),
    provider: z.string().max(50).optional(),
    isDefault: z.boolean().optional(),
    providerToken: z.string().optional(),
  })
  .strict();

const paymentMethodSchema = z.discriminatedUnion('type', [
  cardPaymentMethodSchema,
  upiPaymentMethodSchema,
]);

export const savePaymentMethod = secureCallable(paymentMethodSchema, async (data, context) => {
  const uid = context.auth.uid;
  const methodRef = db.collection('users').doc(uid).collection('paymentMethods').doc(data.id);
  
  const displayLabel = data.displayLabel || (data.type === 'card' ? `${data.brand} •••• ${data.last4}` : data.vpa);
  const safeData = data.type === 'card'
    ? {
        id: data.id,
        type: 'card' as const,
        brand: data.brand,
        last4: data.last4,
        expiry: data.expiry || (data.expiryMonth && data.expiryYear ? `${data.expiryMonth}/${data.expiryYear}` : ''),
        expiryMonth: data.expiryMonth || null,
        expiryYear: data.expiryYear || null,
        displayLabel,
        provider: data.provider || 'card',
        isDefault: data.isDefault ?? false,
        ...(data.providerToken ? { providerToken: data.providerToken } : {}),
      }
    : {
        id: data.id,
        type: 'upi' as const,
        vpa: data.vpa,
        displayLabel,
        provider: data.provider || 'upi',
        isDefault: data.isDefault ?? false,
        ...(data.providerToken ? { providerToken: data.providerToken } : {}),
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
  z
    .object({
      id: z.string().min(1),
      soft: z.boolean().optional().default(false),
    })
    .strict(),
  async (data, context) => {
    const uid = context.auth.uid;
    const docRef = db.collection('users').doc(uid).collection('paymentMethods').doc(data.id);
    if (data.soft) {
      await docRef.set({ deletedAt: FieldValue.serverTimestamp() }, { merge: true });
    } else {
      await docRef.delete();
    }
    log.info(`User ${uid} removed payment method ${data.id} (soft: ${data.soft})`);
    return { success: true };
  }
);

export const addPaymentMethod = savePaymentMethod;

const listPaymentMethodsSchema = z
  .object({
    type: z.enum(['card', 'upi']).optional(),
    limit: z.number().int().positive().max(50).default(20),
    cursor: z.string().optional(),
    includeDeleted: z.boolean().optional().default(false),
  })
  .strict();

export const listPaymentMethods = secureCallable(
  listPaymentMethodsSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    let q: FirebaseFirestore.Query = db.collection('users').doc(uid).collection('paymentMethods');

    if (data.type) {
      q = q.where('type', '==', data.type);
    }

    if (data.cursor) {
      const cursorDoc = await db
        .collection('users')
        .doc(uid)
        .collection('paymentMethods')
        .doc(data.cursor)
        .get();
      if (cursorDoc.exists) {
        q = q.startAfter(cursorDoc);
      }
    }

    q = q.limit(data.limit);

    const snap = await q.get();

    const paymentMethods = snap.docs
      .filter((doc) => data.includeDeleted || !doc.data().deletedAt)
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          type: d.type,
          displayLabel:
            d.displayLabel || (d.type === 'card' ? `•••• ${d.last4}` : d.vpa),
          brand: d.brand,
          last4: d.last4,
          expiry: d.expiry,
          expiryMonth: d.expiryMonth,
          expiryYear: d.expiryYear,
          vpa: d.vpa,
          isDefault: d.isDefault ?? false,
          createdAt: d.createdAt,
        };
      })
      .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    const nextCursor =
      snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return {
      paymentMethods,
      nextCursor,
    };
  }
);

// ----------------------------------------------------------------------------
// PAYMENT INTENTS (Razorpay & Stripe server-authoritative creation)
// ----------------------------------------------------------------------------

const createPaymentIntentSchema = z
  .object({
    amountMinor: z.number().int().positive().optional(),
    amount: z.number().positive().optional(),
    currency: z.literal('INR').default('INR'),
    provider: z.enum(['razorpay', 'stripe']).default('razorpay'),
    orderId: z.string().min(1).max(128).optional(),
    idempotencyKey: z.string().min(1).max(128),
    description: z.string().max(255).optional(),
    metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  })
  .strict()
  .refine((data) => data.amountMinor !== undefined || data.amount !== undefined, {
    message: 'Either amountMinor or amount must be provided',
  });

interface ProviderResult {
  providerOrderId: string;
  clientSecret: string;
}

async function createRazorpayOrder(
  amountMinor: number,
  receipt: string,
  notes: Record<string, any>
): Promise<ProviderResult> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    log.warn(`[payments] Razorpay credentials not configured in environment. Using dev mock order.`);
    return {
      providerOrderId: `order_mock_${receipt}`,
      clientSecret: 'rzp_test_mock',
    };
  }

  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountMinor,
      currency: 'INR',
      receipt,
      notes,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error(`[payments] Razorpay order creation failed (${response.status}): ${errorText}`);
    throwError('internal', `Failed to create Razorpay payment order: ${response.statusText}`);
  }

  const data = (await response.json()) as { id: string };
  return {
    providerOrderId: data.id,
    clientSecret: keyId,
  };
}

async function createStripePaymentIntent(
  amountMinor: number,
  paymentId: string,
  metadata: Record<string, string>
): Promise<ProviderResult> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    log.warn(`[payments] Stripe secret key not configured in environment. Using dev mock secret.`);
    return {
      providerOrderId: `pi_mock_${paymentId}`,
      clientSecret: `pi_mock_${paymentId}_secret_mock`,
    };
  }

  const params = new URLSearchParams();
  params.append('amount', amountMinor.toString());
  params.append('currency', 'inr');
  for (const [key, val] of Object.entries(metadata)) {
    params.append(`metadata[${key}]`, String(val));
  }

  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error(`[payments] Stripe PaymentIntent creation failed (${response.status}): ${errorText}`);
    throwError('internal', `Failed to create Stripe PaymentIntent: ${response.statusText}`);
  }

  const data = (await response.json()) as { id: string; client_secret: string };
  return {
    providerOrderId: data.id,
    clientSecret: data.client_secret,
  };
}

export const createPaymentIntent = secureCallable(
  createPaymentIntentSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const resolvedAmountMinor = data.amountMinor ?? Math.round((data.amount || 0) * 100);

    if (resolvedAmountMinor <= 0) {
      throwError('invalid-argument', 'Payment amount must be greater than zero.');
    }

    // 1. Idempotency Check: if a payment with this idempotencyKey exists for this user, replay it
    const existingSnap = await db
      .collection('payments')
      .where('userId', '==', uid)
      .where('idempotencyKey', '==', data.idempotencyKey)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      const existingData = existingDoc.data();
      log.warn(
        `[payments] Replaying existing payment intent ${existingDoc.id} for user ${uid}, key: ${data.idempotencyKey}`
      );
      return {
        paymentId: existingDoc.id,
        provider: (existingData.provider || data.provider) as 'razorpay' | 'stripe',
        providerOrderId: existingData.providerPaymentId || null,
        clientSecret: existingData.clientSecret || null,
        amountMinor: existingData.amountMinor,
        amount: existingData.amount || existingData.amountMinor / 100,
        currency: existingData.currency || 'INR',
        status: existingData.status || 'pending',
        replayed: true,
      };
    }

    // 2. Generate canonical payment ID in payments/{paymentId}
    const paymentRef = db.collection('payments').doc();
    const paymentId = paymentRef.id;

    // 3. Provider Order / Intent Creation
    let providerResult: ProviderResult;
    if (data.provider === 'stripe') {
      providerResult = await createStripePaymentIntent(resolvedAmountMinor, paymentId, {
        userId: uid,
        orderId: data.orderId || '',
        paymentId,
        idempotencyKey: data.idempotencyKey,
      });
    } else {
      providerResult = await createRazorpayOrder(resolvedAmountMinor, paymentId, {
        userId: uid,
        orderId: data.orderId || '',
        idempotencyKey: data.idempotencyKey,
      });
    }

    // 4. Save to Firestore matching Greenfield Contract:
    // payments/{paymentId} -- userId, optional orderId, provider, optional providerPaymentId,
    // idempotencyKey, amountMinor, currency, status (pending, authorized, captured, failed, refunded, partially_refunded, voided),
    // createdAt, updatedAt.
    const paymentRecord = {
      userId: uid,
      orderId: data.orderId || null,
      provider: data.provider,
      providerPaymentId: providerResult.providerOrderId,
      clientSecret: providerResult.clientSecret,
      idempotencyKey: data.idempotencyKey,
      amountMinor: resolvedAmountMinor,
      amount: resolvedAmountMinor / 100,
      currency: data.currency,
      status: 'pending' as const,
      description: data.description || null,
      metadata: data.metadata || {},
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await paymentRef.set(paymentRecord);

    log.info(
      `[payments] Created payment intent ${paymentId} for user ${uid} (amount: ₹${resolvedAmountMinor / 100}, provider: ${data.provider})`
    );

    return {
      paymentId,
      provider: data.provider,
      providerOrderId: providerResult.providerOrderId,
      clientSecret: providerResult.clientSecret,
      amountMinor: resolvedAmountMinor,
      amount: resolvedAmountMinor / 100,
      currency: data.currency,
      status: 'pending',
      replayed: false,
    };
  }
);

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

export const addMoney = secureCallable(
  z
    .object({
      amount: z.number().positive().optional(),
      amountMinor: z.number().int().positive().optional(),
      idempotencyKey: z.string().optional(),
    })
    .strict()
    .refine((d) => d.amount !== undefined || d.amountMinor !== undefined, {
      message: 'Either amount or amountMinor must be provided',
    }),
  async (data, context) => {
    const uid = context.auth.uid;
    const amountMinor = data.amountMinor ?? Math.round((data.amount || 0) * 100);
    const idempotencyKey = data.idempotencyKey || `topup_direct_${Date.now()}`;

    // Create a canonical payments/{paymentId} record for backward-compatible top-ups
    const paymentRef = db.collection('payments').doc();
    const paymentId = paymentRef.id;

    await paymentRef.set({
      userId: uid,
      orderId: null,
      provider: 'in_app',
      providerPaymentId: `direct_${paymentId}`,
      idempotencyKey,
      amountMinor,
      amount: amountMinor / 100,
      currency: 'INR',
      status: 'captured',
      metadata: { type: 'wallet_topup', mode: 'direct' },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      capturedAt: FieldValue.serverTimestamp(),
    });

    const credit = await applyWalletCredit(uid, amountMinor, {
      paymentId,
      provider: 'in_app',
      idempotencyKey,
      type: 'topup',
      description: 'Wallet Direct Top-up',
    });

    log.info(`User ${uid} added ₹${amountMinor / 100} to wallet. New balance: ₹${credit.balance}`);
    return { balance: credit.balance, balanceMinor: credit.balanceMinor };
  }
);

const chargeWalletSchema = z
  .object({
    amount: z.number().positive().optional(),
    amountMinor: z.number().int().positive().optional(),
    title: z.string().max(100).optional(),
    description: z.string().max(255).optional(),
    type: z.enum(['order_payment', 'adjustment']).default('adjustment'),
    orderId: z.string().min(1).max(128).optional(),
    userId: z.string().min(1).max(128).optional(), // Admin can target a user
    idempotencyKey: z.string().min(1).max(128).optional(),
  })
  .strict()
  .refine((d) => d.amount !== undefined || d.amountMinor !== undefined, {
    message: 'Either amount or amountMinor must be provided',
  });

/**
 * chargeWallet - Enforces Greenfield Sec. 1 Line 96 & Sec. 5 Line 308 boundaries.
 * Direct arbitrary client debits are forbidden. Wallet debits must occur
 * during server-authoritative order checkout or via verified admin adjustments.
 */
export const chargeWallet = secureCallable(
  chargeWalletSchema,
  async (data, context) => {
    const callerUid = context.auth.uid;
    const isAdmin = context.auth.token?.admin === true;

    // Strict Greenfield Guard: Direct client debits without a verified order are strictly forbidden.
    if (!isAdmin && !data.orderId) {
      log.warn(
        `[payments] Unauthorized direct wallet debit attempted by non-admin user ${callerUid}`
      );
      throwError(
        'permission-denied',
        'Direct wallet debits are not permitted. Wallet payments are debited automatically during order checkout.'
      );
    }

    const targetUid = (isAdmin && data.userId) ? data.userId : callerUid;
    const amountMinor = data.amountMinor ?? Math.round((data.amount || 0) * 100);
    const idempotencyKey =
      data.idempotencyKey ||
      `debit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // If a non-admin passes an orderId, verify ownership and pending status
    if (!isAdmin && data.orderId) {
      const orderRef = db.collection('orders').doc(data.orderId);
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists) {
        throwError('not-found', 'Order not found.');
      }
      const orderData = orderSnap.data()!;
      if (orderData.userId !== callerUid) {
        throwError('permission-denied', 'You do not own this order.');
      }
      if (orderData.paymentStatus === 'paid') {
        throwError('failed-precondition', 'Order is already paid.');
      }
    }

    // Execute atomic debit
    const { newBalMinor, newBalance } = await db.runTransaction(async (t) => {
      return await applyWalletDebit(t, targetUid, amountMinor, {
        orderId: data.orderId || null,
        title:
          data.title ||
          (data.orderId
            ? `Order #${data.orderId.slice(-6)}`
            : 'Admin Adjustment'),
        description:
          data.description ||
          (data.orderId
            ? `Payment for order ${data.orderId}`
            : 'Administrative balance adjustment'),
        idempotencyKey,
        type: data.type || (data.orderId ? 'order_payment' : 'adjustment'),
      });
    });

    // Audit log per Greenfield Sec. 4 Line 292
    await db.collection('auditEvents').add({
      actorType: isAdmin ? 'admin' : 'user',
      actorId: callerUid,
      action: 'wallet.debit',
      entityType: 'wallet',
      entityId: targetUid,
      outcome: 'success',
      requestId:
        (context.rawRequest as any)?.headers?.['x-request-id'] || idempotencyKey,
      createdAt: FieldValue.serverTimestamp(),
      metadata: {
        amountMinor,
        orderId: data.orderId || null,
        type: data.type,
      },
    });

    log.info(
      `[payments] Successfully debited ₹${amountMinor / 100} from wallet of user ${targetUid} by ${callerUid}. New balance: ₹${newBalance}`
    );

    return {
      success: true,
      balance: newBalance,
      balanceMinor: newBalMinor,
    };
  }
);

const createTopUpSchema = z
  .object({
    amountMinor: z.number().int().positive().min(100).max(5000000).optional(),
    amount: z.number().positive().min(1).max(50000).optional(),
    currency: z.literal('INR').default('INR'),
    provider: z.enum(['razorpay', 'stripe']).default('razorpay'),
    idempotencyKey: z.string().min(1).max(128).optional(),
    autoConfirmInDev: z.boolean().optional().default(false),
  })
  .strict()
  .refine((d) => d.amountMinor !== undefined || d.amount !== undefined, {
    message: 'Either amountMinor or amount must be provided',
  });

export const createTopUp = secureCallable(
  createTopUpSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const resolvedAmountMinor = data.amountMinor ?? Math.round((data.amount || 0) * 100);
    const idempotencyKey =
      data.idempotencyKey || `topup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (resolvedAmountMinor <= 0) {
      throwError('invalid-argument', 'Top-up amount must be greater than zero.');
    }

    // 1. Idempotency Check: if a top-up payment with this key exists, replay it
    const existingSnap = await db
      .collection('payments')
      .where('userId', '==', uid)
      .where('idempotencyKey', '==', idempotencyKey)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      const existingData = existingDoc.data();
      log.warn(
        `[payments] Replaying existing top-up payment ${existingDoc.id} for user ${uid}, key: ${idempotencyKey}`
      );
      return {
        paymentId: existingDoc.id,
        provider: (existingData.provider || data.provider) as 'razorpay' | 'stripe',
        providerOrderId: existingData.providerPaymentId || null,
        clientSecret: existingData.clientSecret || null,
        amountMinor: existingData.amountMinor,
        amount: existingData.amount || existingData.amountMinor / 100,
        currency: existingData.currency || 'INR',
        status: existingData.status || 'pending',
        replayed: true,
      };
    }

    // 2. Generate canonical payment record payments/{paymentId} per Greenfield Sec. 4 Line 278
    const paymentRef = db.collection('payments').doc();
    const paymentId = paymentRef.id;

    // 3. Create Gateway Order / PaymentIntent
    let providerResult: ProviderResult;
    if (data.provider === 'stripe') {
      providerResult = await createStripePaymentIntent(resolvedAmountMinor, paymentId, {
        userId: uid,
        paymentId,
        type: 'wallet_topup',
        idempotencyKey,
      });
    } else {
      providerResult = await createRazorpayOrder(resolvedAmountMinor, paymentId, {
        userId: uid,
        paymentId,
        type: 'wallet_topup',
        idempotencyKey,
      });
    }

    // 4. Save canonical payment document
    const paymentRecord = {
      userId: uid,
      orderId: null,
      provider: data.provider,
      providerPaymentId: providerResult.providerOrderId,
      clientSecret: providerResult.clientSecret,
      idempotencyKey,
      amountMinor: resolvedAmountMinor,
      amount: resolvedAmountMinor / 100,
      currency: 'INR',
      status: 'pending' as const,
      metadata: {
        type: 'wallet_topup',
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await paymentRef.set(paymentRecord);

    log.info(
      `[payments] Initiated wallet top-up payment ${paymentId} (₹${resolvedAmountMinor / 100}) for user ${uid} via ${data.provider}`
    );

    // If dev mock mode and autoConfirm requested, automatically fulfill credit
    if (
      data.autoConfirmInDev &&
      (providerResult.providerOrderId.startsWith('order_mock_') ||
        providerResult.providerOrderId.startsWith('pi_mock_'))
    ) {
      await paymentRef.update({
        status: 'captured',
        capturedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      const creditRes = await applyWalletCredit(uid, resolvedAmountMinor, {
        paymentId,
        provider: data.provider,
        idempotencyKey,
        type: 'topup',
      });
      return {
        paymentId,
        provider: data.provider,
        providerOrderId: providerResult.providerOrderId,
        clientSecret: providerResult.clientSecret,
        amountMinor: resolvedAmountMinor,
        amount: resolvedAmountMinor / 100,
        currency: 'INR',
        status: 'captured',
        replayed: false,
        balanceMinor: creditRes.balanceMinor,
        balance: creditRes.balance,
      };
    }

    return {
      paymentId,
      provider: data.provider,
      providerOrderId: providerResult.providerOrderId,
      clientSecret: providerResult.clientSecret,
      amountMinor: resolvedAmountMinor,
      amount: resolvedAmountMinor / 100,
      currency: 'INR',
      status: 'pending',
      replayed: false,
    };
  }
);

const confirmTopUpSchema = z
  .object({
    paymentId: z.string().min(1).max(128),
    providerPaymentId: z.string().min(1).max(128).optional(),
    providerSignature: z.string().optional(),
    razorpayOrderId: z.string().optional(),
  })
  .strict();

export const confirmTopUp = secureCallable(
  confirmTopUpSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const paymentRef = db.collection('payments').doc(data.paymentId);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      throwError('not-found', 'Top-up payment record not found.');
    }

    const pData = paymentSnap.data()!;
    if (pData.userId !== uid) {
      throwError('permission-denied', 'You do not own this payment record.');
    }

    if (pData.metadata?.type !== 'wallet_topup') {
      throwError('invalid-argument', 'This payment is not a wallet top-up.');
    }

    // If already captured, applyWalletCredit returns current balance idempotently
    if (pData.status === 'captured') {
      const credit = await applyWalletCredit(uid, pData.amountMinor, {
        paymentId: data.paymentId,
        provider: pData.provider,
        idempotencyKey: pData.idempotencyKey,
        type: 'topup',
      });
      return {
        success: true,
        paymentId: data.paymentId,
        status: 'captured',
        balanceMinor: credit.balanceMinor,
        balance: credit.balance,
        replayed: true,
      };
    }

    // Verify signature if Razorpay
    if (pData.provider === 'razorpay') {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (secret && data.providerSignature && data.providerPaymentId) {
        const orderId = data.razorpayOrderId || pData.providerPaymentId;
        const payload = `${orderId}|${data.providerPaymentId}`;
        const isValid = verifyRazorpaySignature(payload, data.providerSignature, secret);
        if (!isValid) {
          throwError('invalid-argument', 'Invalid Razorpay payment signature.');
        }
      } else {
        log.warn(`[payments] Permissive Razorpay signature verification in development/emulator.`);
      }
    }

    // Update payment record to captured
    await paymentRef.update({
      status: 'captured',
      providerPaymentId: data.providerPaymentId || pData.providerPaymentId,
      capturedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Credit wallet and write ledger entry atomically
    const credit = await applyWalletCredit(uid, pData.amountMinor, {
      paymentId: data.paymentId,
      provider: pData.provider,
      idempotencyKey: pData.idempotencyKey,
      type: 'topup',
    });

    // Append to auditEvents per Greenfield Sec. 4 Line 292
    await db.collection('auditEvents').add({
      actorType: 'user',
      actorId: uid,
      action: 'wallet.topup',
      entityType: 'wallet',
      entityId: uid,
      outcome: 'success',
      requestId: (context.rawRequest as any)?.headers?.['x-request-id'] || pData.idempotencyKey,
      createdAt: FieldValue.serverTimestamp(),
      metadata: {
        paymentId: data.paymentId,
        amountMinor: pData.amountMinor,
        provider: pData.provider,
      },
    });

    log.info(
      `[payments] Confirmed top-up ${data.paymentId} (₹${pData.amountMinor / 100}) for user ${uid}. New balance: ₹${credit.balance}`
    );

    return {
      success: true,
      paymentId: data.paymentId,
      status: 'captured',
      balanceMinor: credit.balanceMinor,
      balance: credit.balance,
      replayed: false,
    };
  }
);

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

const listWalletTransactionsSchema = z
  .object({
    limit: z.number().int().positive().max(50).default(20),
    cursor: z.string().optional(),
    type: z.enum(['topup', 'order_payment', 'refund', 'adjustment']).optional(),
    direction: z.enum(['credit', 'debit']).optional(),
  })
  .strict();

export const listWalletTransactions = secureCallable(
  listWalletTransactionsSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const walletRef = db.collection('wallets').doc(uid);

    let q: FirebaseFirestore.Query = walletRef
      .collection('entries')
      .orderBy('createdAt', 'desc');

    if (data.type) {
      q = q.where('type', '==', data.type);
    }
    if (data.direction) {
      q = q.where('direction', '==', data.direction);
    }

    if (data.cursor) {
      const cursorDoc = await walletRef.collection('entries').doc(data.cursor).get();
      if (cursorDoc.exists) {
        q = q.startAfter(cursorDoc);
      }
    }

    q = q.limit(data.limit);

    const snap = await q.get();
    const entries = snap.docs.map((doc) => {
      const d = doc.data();
      const amountMinor =
        typeof d.amountMinor === 'number'
          ? d.amountMinor
          : Math.round((d.amount || 0) * 100);
      const amount =
        typeof d.amount === 'number' ? d.amount : amountMinor / 100;

      return {
        id: doc.id,
        amountMinor,
        amount,
        currency: d.currency || 'INR',
        direction: (d.direction || (d.type === 'topup' || d.type === 'refund' ? 'credit' : 'debit')) as 'credit' | 'debit',
        type: (d.type || 'topup') as 'topup' | 'order_payment' | 'refund' | 'adjustment',
        orderId: d.orderId || null,
        paymentId: d.paymentId || null,
        idempotencyKey: d.idempotencyKey || null,
        description: d.description || d.title || 'Wallet Transaction',
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : null,
      };
    });

    const nextCursor =
      snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return {
      entries,
      nextCursor,
    };
  }
);

// ----------------------------------------------------------------------------
// PAYMENT WEBHOOK (Authoritative Gateway Event Processing & Deduplication)
// ----------------------------------------------------------------------------

function verifyRazorpaySignature(
  rawBody: Buffer | string,
  signature: string,
  secret: string
): boolean {
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (err) {
    log.error('[paymentWebhook] Error verifying Razorpay signature', err);
    return false;
  }
}

function verifyStripeSignature(
  rawBody: Buffer | string,
  header: string,
  secret: string
): boolean {
  try {
    const parts = header.split(',').reduce((acc, part) => {
      const [key, val] = part.split('=');
      if (key && val) acc[key.trim()] = val.trim();
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts['t'];
    const signature = parts['v1'];
    if (!timestamp || !signature) return false;

    // Tolerance window: 5 minutes (300 seconds) to prevent replay attacks
    const nowSec = Math.floor(Date.now() / 1000);
    const eventSec = parseInt(timestamp, 10);
    if (isNaN(eventSec) || Math.abs(nowSec - eventSec) > 300) {
      return false;
    }

    const payload = `${timestamp}.${typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (err) {
    log.error('[paymentWebhook] Error verifying Stripe signature', err);
    return false;
  }
}

export const paymentWebhook = onRequest(
  {
    region: 'asia-south1',
    cors: false,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
      return;
    }

    try {
      const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      const razorpaySig = req.headers['x-razorpay-signature'] as string | undefined;
      const stripeSig = req.headers['stripe-signature'] as string | undefined;

      let provider: 'razorpay' | 'stripe' = 'razorpay';

      // 1. Authenticate Provider & Verify Gateway Signature
      if (razorpaySig) {
        provider = 'razorpay';
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (secret) {
          const isValid = verifyRazorpaySignature(rawBody, razorpaySig, secret);
          if (!isValid) {
            log.warn('[paymentWebhook] Invalid Razorpay webhook signature');
            res.status(400).json({ error: 'Invalid webhook signature' });
            return;
          }
        } else {
          log.warn('[paymentWebhook] RAZORPAY_WEBHOOK_SECRET unset; permissive dev validation');
        }
      } else if (stripeSig) {
        provider = 'stripe';
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (secret) {
          const isValid = verifyStripeSignature(rawBody, stripeSig, secret);
          if (!isValid) {
            log.warn('[paymentWebhook] Invalid Stripe webhook signature');
            res.status(400).json({ error: 'Invalid webhook signature' });
            return;
          }
        } else {
          log.warn('[paymentWebhook] STRIPE_WEBHOOK_SECRET unset; permissive dev validation');
        }
      } else {
        // Fallback detection from body for testing or non-signature environments
        const bodyObj = typeof req.body === 'object' ? req.body : {};
        if (bodyObj.provider === 'stripe' || bodyObj.type?.startsWith('payment_intent')) {
          provider = 'stripe';
        }
      }

      const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');

      // 2. Extract Event Details
      let eventType = 'unknown';
      let providerEventId: string;
      let gatewayPaymentId: string | undefined;
      let gatewayOrderId: string | undefined;
      let amountMinor: number | undefined;
      let isSuccess = false;
      let isFailure = false;
      let appOrderId: string | undefined;
      let appPaymentId: string | undefined;
      let appUserId: string | undefined;

      if (provider === 'razorpay') {
        eventType = body.event || 'unknown';
        const paymentEntity = body.payload?.payment?.entity || {};
        const orderEntity = body.payload?.order?.entity || {};
        const refundEntity = body.payload?.refund?.entity || {};

        gatewayPaymentId = paymentEntity.id || refundEntity.payment_id;
        gatewayOrderId = paymentEntity.order_id || orderEntity.id;
        amountMinor = refundEntity.amount || paymentEntity.amount || orderEntity.amount;
        providerEventId = body.event_id || body.id || refundEntity.id || (gatewayPaymentId ? `${gatewayPaymentId}_${eventType}` : `rzp_evt_${Date.now()}`);

        const isRefund = eventType.includes('refund');
        isSuccess = !isRefund && (eventType === 'payment.captured' || eventType === 'order.paid');
        isFailure = !isRefund && (eventType === 'payment.failed');

        appOrderId = refundEntity.notes?.orderId || paymentEntity.notes?.orderId || orderEntity.notes?.orderId;
        appPaymentId = refundEntity.notes?.paymentId || paymentEntity.notes?.paymentId || orderEntity.notes?.paymentId;
        appUserId = refundEntity.notes?.userId || paymentEntity.notes?.userId || orderEntity.notes?.userId;
      } else {
        eventType = body.type || 'unknown';
        const dataObj = body.data?.object || {};

        const isRefund = eventType.includes('refund');
        if (isRefund && dataObj.object === 'refund') {
          gatewayPaymentId = dataObj.payment_intent || dataObj.charge;
          amountMinor = dataObj.amount;
          providerEventId = dataObj.id || body.id || `str_evt_${Date.now()}`;
        } else {
          gatewayPaymentId = dataObj.id;
          amountMinor = isRefund ? dataObj.amount_refunded : dataObj.amount;
          providerEventId = body.id || `str_evt_${Date.now()}`;
        }

        isSuccess = !isRefund && (eventType === 'payment_intent.succeeded' || eventType === 'charge.succeeded');
        isFailure = !isRefund && (eventType === 'payment_intent.payment_failed' || eventType === 'charge.failed');

        appOrderId = dataObj.metadata?.orderId;
        appPaymentId = dataObj.metadata?.paymentId;
        appUserId = dataObj.metadata?.userId;
      }

      const isRefund = eventType.includes('refund');
      log.info(`[paymentWebhook] Processing ${provider} event: ${eventType} (Event ID: ${providerEventId})`);

      // 3. Exactly-Once Deduplication Check (paymentProviderEvents/{provider_eventId})
      const dedupKey = `${provider}_${providerEventId}`;
      const dedupRef = db.collection('paymentProviderEvents').doc(dedupKey);
      const dedupSnap = await dedupRef.get();

      if (dedupSnap.exists) {
        log.info(`[paymentWebhook] Event ${dedupKey} already claimed/processed. Acknowledging 200 OK.`);
        res.status(200).json({ received: true, deduplicated: true });
        return;
      }

      // 4. Locate & Reconcile Target payments/{paymentId}
      let targetPaymentRef: FirebaseFirestore.DocumentReference | null = null;
      let targetPaymentData: FirebaseFirestore.DocumentData | null = null;

      if (appPaymentId) {
        const pRef = db.collection('payments').doc(appPaymentId);
        const pSnap = await pRef.get();
        if (pSnap.exists) {
          targetPaymentRef = pRef;
          targetPaymentData = pSnap.data() || null;
        }
      }

      if (!targetPaymentRef && gatewayOrderId) {
        const qSnap = await db
          .collection('payments')
          .where('providerPaymentId', '==', gatewayOrderId)
          .limit(1)
          .get();
        if (!qSnap.empty) {
          targetPaymentRef = qSnap.docs[0].ref;
          targetPaymentData = qSnap.docs[0].data();
        }
      }

      if (!targetPaymentRef && gatewayPaymentId) {
        const qSnap = await db
          .collection('payments')
          .where('providerPaymentId', '==', gatewayPaymentId)
          .limit(1)
          .get();
        if (!qSnap.empty) {
          targetPaymentRef = qSnap.docs[0].ref;
          targetPaymentData = qSnap.docs[0].data();
        }
      }

      let resolvedPaymentId: string;

      if (targetPaymentRef && targetPaymentData) {
        resolvedPaymentId = targetPaymentRef.id;

        if (isRefund) {
          const isRefundFailed = eventType.includes('failed');
          const refundStatus: 'succeeded' | 'failed' = isRefundFailed ? 'failed' : 'succeeded';

          // Greenfield Sec. 4 Line 279: payments/{paymentId}/refunds/{refundId}
          const refundRef = targetPaymentRef.collection('refunds').doc(providerEventId);
          await refundRef.set({
            orderId: appOrderId || targetPaymentData.orderId || null,
            amountMinor: amountMinor || 0,
            currency: 'INR',
            reasonCode: 'gateway_refund',
            status: refundStatus,
            providerRefundId: providerEventId,
            idempotencyKey: dedupKey,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            ...(refundStatus === 'succeeded' ? { completedAt: FieldValue.serverTimestamp() } : {}),
          });

          if (refundStatus === 'succeeded') {
            const allRefundsSnap = await targetPaymentRef.collection('refunds').get();
            const totalRefundedMinor = allRefundsSnap.docs.reduce((acc, doc) => {
              const r = doc.data();
              return r.status === 'succeeded' ? acc + (r.amountMinor || 0) : acc;
            }, 0);

            const isFullRefund = totalRefundedMinor >= (targetPaymentData.amountMinor || 0);
            const parentStatus = isFullRefund ? 'refunded' : 'partially_refunded';

            await targetPaymentRef.update({
              status: parentStatus,
              refundedAmountMinor: totalRefundedMinor,
              updatedAt: FieldValue.serverTimestamp(),
              ...(isFullRefund ? { refundedAt: FieldValue.serverTimestamp() } : {}),
            });
          }
        } else {
          const newStatus = isSuccess ? 'captured' : isFailure ? 'failed' : targetPaymentData.status;
          await targetPaymentRef.update({
            status: newStatus,
            ...(gatewayPaymentId ? { providerPaymentId: gatewayPaymentId } : {}),
            updatedAt: FieldValue.serverTimestamp(),
            ...(isSuccess ? { capturedAt: FieldValue.serverTimestamp() } : {}),
            ...(isFailure ? { failedAt: FieldValue.serverTimestamp() } : {}),
          });
        }
      } else {
        // Upsert canonical record if direct payment without prior intent
        const newPaymentRef = db.collection('payments').doc();
        resolvedPaymentId = newPaymentRef.id;
        await newPaymentRef.set({
          userId: appUserId || 'system',
          orderId: appOrderId || null,
          provider,
          providerPaymentId: gatewayPaymentId || gatewayOrderId || providerEventId,
          idempotencyKey: dedupKey,
          amountMinor: amountMinor || 0,
          amount: (amountMinor || 0) / 100,
          currency: 'INR',
          status: isRefund ? 'refunded' : isSuccess ? 'captured' : isFailure ? 'failed' : 'pending',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      // 5. Update Associated Order (orders/{orderId})
      const resolvedOrderId = appOrderId || targetPaymentData?.orderId;
      if (resolvedOrderId) {
        const orderRef = db.collection('orders').doc(resolvedOrderId);
        const orderSnap = await orderRef.get();
        if (orderSnap.exists) {
          const orderData = orderSnap.data() || {};
          if (isSuccess && orderData.paymentStatus !== 'paid') {
            await db.runTransaction(async (t) => {
              t.update(orderRef, {
                paymentStatus: 'paid',
                status: orderData.status === 'placed' ? 'confirmed' : orderData.status,
                updatedAt: FieldValue.serverTimestamp(),
              });

              const evRef = orderRef.collection('events').doc();
              t.set(evRef, {
                eventId: evRef.id,
                fromStatus: orderData.status || 'placed',
                toStatus: orderData.status === 'placed' ? 'confirmed' : orderData.status,
                actorType: 'system',
                note: `Payment captured via ${provider} webhook (${gatewayPaymentId || providerEventId})`,
                createdAt: FieldValue.serverTimestamp(),
              });
            });

            // Write transactional outbox job
            const outboxRef = db.collection('outbox').doc();
            await outboxRef.set({
              eventId: outboxRef.id,
              eventType: 'order.payment_confirmed',
              aggregateType: 'order',
              aggregateId: resolvedOrderId,
              payload: {
                orderId: resolvedOrderId,
                userId: orderData.userId,
                paymentId: resolvedPaymentId,
                provider,
                amountMinor: orderData.totalMinor || amountMinor,
              },
              status: 'pending',
              attempts: 0,
              createdAt: FieldValue.serverTimestamp(),
              availableAt: FieldValue.serverTimestamp(),
            });
          } else if (isRefund && orderData.paymentStatus !== 'refunded') {
            await orderRef.update({
              paymentStatus: 'refunded',
              updatedAt: FieldValue.serverTimestamp(),
            });
            const evRef = orderRef.collection('events').doc();
            await evRef.set({
              eventId: evRef.id,
              fromStatus: orderData.status,
              toStatus: orderData.status,
              actorType: 'system',
              note: `Payment refunded via ${provider} webhook (${providerEventId})`,
              createdAt: FieldValue.serverTimestamp(),
            });
          } else if (isFailure && orderData.paymentStatus !== 'paid') {
            await orderRef.update({
              paymentStatus: 'failed',
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
      }

      // 5b. Reconcile Wallet Top-up (wallets/{uid} and wallets/{uid}/entries) per Greenfield Sec. 4 Line 285
      if (isSuccess && targetPaymentData?.metadata?.type === 'wallet_topup') {
        const topupUserId = appUserId || targetPaymentData.userId;
        const topupAmountMinor = amountMinor || targetPaymentData.amountMinor;
        if (topupUserId && topupAmountMinor) {
          await applyWalletCredit(topupUserId, topupAmountMinor, {
            paymentId: resolvedPaymentId,
            provider,
            idempotencyKey: dedupKey,
            type: 'topup',
            description: `Wallet Top-up via ${provider} webhook`,
          });
          log.info(
            `[paymentWebhook] Reconciled wallet top-up of ₹${topupAmountMinor / 100} for user ${topupUserId} via webhook`
          );
        }
      }

      // 6. Record Deduplication Proof in paymentProviderEvents
      await dedupRef.set({
        provider,
        providerEventId,
        eventType,
        paymentId: resolvedPaymentId,
        orderId: resolvedOrderId || null,
        receivedAt: FieldValue.serverTimestamp(),
        processedAt: FieldValue.serverTimestamp(),
        result: isRefund ? 'refunded' : isSuccess ? 'captured' : isFailure ? 'failed' : 'acknowledged',
      });

      log.info(`[paymentWebhook] Successfully processed ${dedupKey} for payment ${resolvedPaymentId}`);
      res.status(200).json({ status: 'success', received: true });
    } catch (err: any) {
      log.error('[paymentWebhook] Error processing payment webhook', err);
      // Return 500 so provider retries transient failures
      res.status(500).json({ error: 'Internal webhook processing failure' });
    }
  }
);

// ----------------------------------------------------------------------------
// REFUNDS FLOW (payments/{paymentId}/refunds/{refundId} — Greenfield Sec. 4 Line 279)
// ----------------------------------------------------------------------------

async function executeRazorpayRefund(
  gatewayPaymentId: string,
  amountMinor: number,
  notes: Record<string, any>
): Promise<string> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    log.warn(`[payments] Razorpay credentials not configured. Generating dev mock refund ID.`);
    return `rfnd_mock_${Date.now()}`;
  }

  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
  const response = await fetch(`https://api.razorpay.com/v1/payments/${gatewayPaymentId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountMinor,
      notes,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error(`[payments] Razorpay refund API failed (${response.status}): ${errorText}`);
    throwError('internal', `Failed to execute Razorpay refund: ${response.statusText}`);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}

async function executeStripeRefund(
  gatewayPaymentId: string,
  amountMinor: number,
  metadata: Record<string, string>
): Promise<string> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    log.warn(`[payments] Stripe secret key not configured. Generating dev mock refund ID.`);
    return `re_mock_${Date.now()}`;
  }

  const params = new URLSearchParams();
  params.append('payment_intent', gatewayPaymentId);
  params.append('amount', amountMinor.toString());
  for (const [key, val] of Object.entries(metadata)) {
    params.append(`metadata[${key}]`, String(val));
  }

  const response = await fetch('https://api.stripe.com/v1/refunds', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error(`[payments] Stripe refund API failed (${response.status}): ${errorText}`);
    throwError('internal', `Failed to execute Stripe refund: ${response.statusText}`);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}

const refundPaymentSchema = z
  .object({
    paymentId: z.string().min(1).max(128),
    amountMinor: z.number().int().positive().optional(),
    amount: z.number().positive().optional(),
    reasonCode: z.enum([
      'customer_cancellation',
      'item_unavailable',
      'merchant_rejected',
      'duplicate',
      'fraud',
      'other',
    ]),
    note: z.string().max(255).optional(),
    idempotencyKey: z.string().min(1).max(128),
  })
  .strict();

export const refundPayment = secureCallable(
  refundPaymentSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const paymentRef = db.collection('payments').doc(data.paymentId);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      throwError('not-found', 'Payment record not found.');
    }

    const pData = paymentSnap.data()!;
    if (pData.userId !== uid) {
      throwError('permission-denied', 'You do not have permission to refund this payment.');
    }

    if (pData.status !== 'captured' && pData.status !== 'partially_refunded') {
      throwError(
        'failed-precondition',
        `Cannot refund payment with status '${pData.status}'. Payment must be captured.`
      );
    }

    // 1. Idempotency Check on subcollection
    const existingRefundSnap = await paymentRef
      .collection('refunds')
      .where('idempotencyKey', '==', data.idempotencyKey)
      .limit(1)
      .get();

    if (!existingRefundSnap.empty) {
      const existingDoc = existingRefundSnap.docs[0];
      const existingRefund = existingDoc.data();
      log.warn(`[payments] Idempotent replay for refund ${existingDoc.id}`);
      return {
        success: true,
        refundId: existingDoc.id,
        providerRefundId: existingRefund.providerRefundId,
        status: pData.status,
        amountMinor: existingRefund.amountMinor,
        amount: existingRefund.amountMinor / 100,
        currency: 'INR',
        replayed: true,
      };
    }

    // 2. Sum existing successful refunds
    const allRefundsSnap = await paymentRef.collection('refunds').get();
    const alreadyRefundedMinor = allRefundsSnap.docs.reduce((acc, doc) => {
      const r = doc.data();
      return r.status === 'succeeded' || r.status === 'pending'
        ? acc + (r.amountMinor || 0)
        : acc;
    }, 0);

    const targetRefundMinor =
      data.amountMinor ??
      (data.amount
        ? Math.round(data.amount * 100)
        : pData.amountMinor - alreadyRefundedMinor);

    if (targetRefundMinor <= 0) {
      throwError('invalid-argument', 'Refund amount must be greater than zero.');
    }

    if (alreadyRefundedMinor + targetRefundMinor > pData.amountMinor) {
      throwError(
        'invalid-argument',
        `Refund amount ₹${targetRefundMinor / 100} exceeds remaining refundable balance ₹${
          (pData.amountMinor - alreadyRefundedMinor) / 100
        }.`
      );
    }

    // 3. Execute with Gateway
    let providerRefundId: string;
    const gatewayTargetId = pData.providerPaymentId || pData.clientSecret;
    if (pData.provider === 'stripe') {
      providerRefundId = await executeStripeRefund(gatewayTargetId, targetRefundMinor, {
        paymentId: data.paymentId,
        orderId: pData.orderId || '',
        reasonCode: data.reasonCode,
      });
    } else {
      providerRefundId = await executeRazorpayRefund(gatewayTargetId, targetRefundMinor, {
        paymentId: data.paymentId,
        orderId: pData.orderId || '',
        reasonCode: data.reasonCode,
        idempotencyKey: data.idempotencyKey,
      });
    }

    // 4. Atomically commit refund subcollection document and update aggregate payment status
    const refundRef = paymentRef.collection('refunds').doc(data.idempotencyKey);
    const isFullRefund = alreadyRefundedMinor + targetRefundMinor >= pData.amountMinor;
    const newStatus = isFullRefund ? 'refunded' : 'partially_refunded';

    await db.runTransaction(async (t) => {
      // Subcollection: payments/{paymentId}/refunds/{refundId} per Greenfield Sec. 4 Line 279
      t.set(refundRef, {
        orderId: pData.orderId || null,
        amountMinor: targetRefundMinor,
        amount: targetRefundMinor / 100,
        currency: 'INR',
        reasonCode: data.reasonCode,
        status: 'succeeded' as const,
        providerRefundId,
        idempotencyKey: data.idempotencyKey,
        note: data.note || null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        completedAt: FieldValue.serverTimestamp(),
      });

      t.update(paymentRef, {
        status: newStatus,
        refundedAmountMinor: alreadyRefundedMinor + targetRefundMinor,
        updatedAt: FieldValue.serverTimestamp(),
        ...(isFullRefund ? { refundedAt: FieldValue.serverTimestamp() } : {}),
      });

      if (pData.orderId) {
        const orderRef = db.collection('orders').doc(pData.orderId);
        t.update(orderRef, {
          paymentStatus: newStatus,
          updatedAt: FieldValue.serverTimestamp(),
        });

        const evRef = orderRef.collection('events').doc();
        t.set(evRef, {
          eventId: evRef.id,
          fromStatus: pData.status,
          toStatus: newStatus,
          actorType: 'system',
          actorId: uid,
          note: `Refund of ₹${targetRefundMinor / 100} issued (${data.reasonCode})`,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    });

    // 5. Audit Trail per Greenfield Sec. 4 Line 292
    await db.collection('auditEvents').add({
      actorType: 'user',
      actorId: uid,
      action: 'payment.refund',
      entityType: 'payment',
      entityId: data.paymentId,
      outcome: 'success',
      requestId: (context.rawRequest as any)?.headers?.['x-request-id'] || data.idempotencyKey,
      createdAt: FieldValue.serverTimestamp(),
      metadata: {
        amountMinor: targetRefundMinor,
        providerRefundId,
        reasonCode: data.reasonCode,
        orderId: pData.orderId || null,
      },
    });

    log.info(
      `[payments] Successfully refunded ₹${targetRefundMinor / 100} on payment ${data.paymentId} (${newStatus})`
    );

    return {
      success: true,
      refundId: refundRef.id,
      providerRefundId,
      status: newStatus,
      amountMinor: targetRefundMinor,
      amount: targetRefundMinor / 100,
      currency: 'INR',
      replayed: false,
    };
  }
);

const listPaymentRefundsSchema = z
  .object({
    paymentId: z.string().min(1).max(128),
    limit: z.number().int().positive().max(50).default(20),
    cursor: z.string().optional(),
  })
  .strict();

export const listPaymentRefunds = secureCallable(
  listPaymentRefundsSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const paymentRef = db.collection('payments').doc(data.paymentId);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      throwError('not-found', 'Payment not found.');
    }

    const pData = paymentSnap.data()!;
    if (pData.userId !== uid) {
      throwError('permission-denied', 'You do not have access to this payment.');
    }

    let q = paymentRef
      .collection('refunds')
      .orderBy('createdAt', 'desc')
      .limit(data.limit);

    if (data.cursor) {
      const cursorDoc = await paymentRef.collection('refunds').doc(data.cursor).get();
      if (cursorDoc.exists) {
        q = q.startAfter(cursorDoc);
      }
    }

    const snap = await q.get();
    const refunds = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const nextCursor =
      snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return {
      refunds,
      nextCursor,
    };
  }
);

