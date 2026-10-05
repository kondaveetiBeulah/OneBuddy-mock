import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../common/firebase';
import { secureCallable } from '../../common/auth';
import { log } from '../../common/logging';
import { throwError } from '../../common/errors';
import {
  createRazorpayOrder,
  createStripePaymentIntent,
  ProviderResult,
} from '../../providers';

// ----------------------------------------------------------------------------
// PAYMENT INTENTS (Razorpay & Stripe server-authoritative creation)
// ----------------------------------------------------------------------------

export const createPaymentIntentSchema = z
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
