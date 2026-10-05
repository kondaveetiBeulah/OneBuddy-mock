import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../core/firebase';
import { secureCallable } from '../../core/callable';
import { log, throwError } from '../../core/logger';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  createStripePaymentIntent,
  ProviderResult,
} from '../../providers';
import { applyWalletCredit } from './ledger';

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

export const createTopUpSchema = z
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

export const confirmTopUpSchema = z
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
