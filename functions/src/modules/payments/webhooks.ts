import { onRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../common/firebase';
import { log } from '../../common/logging';
import {
  verifyRazorpaySignature,
  verifyStripeSignature,
  razorpayWebhookSecret,
  stripeWebhookSecret,
} from '../../providers';
import { applyWalletCredit } from '../wallet/ledger';

// ----------------------------------------------------------------------------
// PAYMENT WEBHOOK (Authoritative Gateway Event Processing & Deduplication)
// ----------------------------------------------------------------------------

export const paymentWebhook = onRequest(
  {
    region: 'asia-south1',
    cors: false,
    secrets: [razorpayWebhookSecret, stripeWebhookSecret],
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
        const secret = razorpayWebhookSecret.value() || process.env.RAZORPAY_WEBHOOK_SECRET;
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
        const secret = stripeWebhookSecret.value() || process.env.STRIPE_WEBHOOK_SECRET;
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
