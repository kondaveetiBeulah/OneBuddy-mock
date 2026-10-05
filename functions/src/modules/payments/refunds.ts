import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../common/firebase';
import { secureCallable } from '../../common/auth';
import { log } from '../../common/logging';
import { throwError } from '../../common/errors';
import {
  executeRazorpayRefund,
  executeStripeRefund,
} from '../../providers';

// ----------------------------------------------------------------------------
// REFUNDS FLOW (payments/{paymentId}/refunds/{refundId} — Greenfield Sec. 4 Line 279)
// ----------------------------------------------------------------------------

export const refundPaymentSchema = z
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

export const listPaymentRefundsSchema = z
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
