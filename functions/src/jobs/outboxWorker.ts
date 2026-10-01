import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../core/firebase';
import { log } from '../core/logger';
import { sendNotificationToUser } from './notificationDispatcher';

export interface OutboxRecord {
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, any>;
  status?: 'queued' | 'processing' | 'completed' | 'retryable_failed' | 'failed';
  attempts?: number;
  availableAt?: any;
  createdAt: any;
  processedAt?: any;
  completedAt?: any;
  lastAttemptAt?: any;
  lastError?: string;
}

/**
 * Core event processing engine with idempotency, exponential backoff, and dead-letter handling.
 */
export async function processOutboxEvent(eventId: string): Promise<boolean> {
  const eventRef = db.collection('outbox').doc(eventId);
  const now = Timestamp.now();

  // 1. Atomically claim the event to prevent concurrent double-execution
  let eventData: OutboxRecord | null = null;
  let currentAttempts = 0;
  const shouldProcess = await db.runTransaction(async (t) => {
    const snap = await t.get(eventRef);
    if (!snap.exists) return false;

    const data = snap.data() as OutboxRecord;
    if (data.processedAt || data.status === 'completed' || data.status === 'failed') {
      return false; // Already processed or permanently failed
    }

    // Exponential backoff check: if availableAt is in future, skip processing
    if (data.availableAt) {
      const availMillis = typeof data.availableAt.toMillis === 'function'
        ? data.availableAt.toMillis()
        : new Date(data.availableAt).getTime();
      if (now.toMillis() < availMillis) {
        return false;
      }
    }

    // If another worker claimed it less than 60s ago, avoid race
    if (data.status === 'processing' && data.lastAttemptAt) {
      const elapsedMs = now.toMillis() - data.lastAttemptAt.toMillis();
      if (elapsedMs < 60000) {
        return false;
      }
    }

    currentAttempts = (data.attempts || 0) + 1;
    eventData = data;
    t.update(eventRef, {
      status: 'processing',
      attempts: currentAttempts,
      lastAttemptAt: now,
    });
    return true;
  });

  if (!shouldProcess || !eventData) {
    return false;
  }

  const record = eventData as OutboxRecord;
  log.info(`[OutboxWorker] Processing event ${eventId} (${record.eventType}) for aggregate ${record.aggregateId}`);

  try {
    // 2. Route event by eventType
    switch (record.eventType) {
      case 'order.placed': {
        const userId = record.payload?.userId;
        const category = record.payload?.category || 'order';
        const totalRupees = record.payload?.totalMinor ? (record.payload.totalMinor / 100).toFixed(2) : null;

        if (userId) {
          // Push notification + in-app notification
          await sendNotificationToUser(userId, {
            title: 'Order Confirmed! 🛍️',
            body: `Your ${category} order #${record.aggregateId.slice(-6)} has been placed successfully.${totalRupees ? ` Total: ₹${totalRupees}` : ''}`,
            category,
            data: {
              orderId: record.aggregateId,
              eventType: 'order.placed',
            },
          });

          // Resolve user email for transactional email
          let recipientEmail: string | null = null;
          try {
            const userSnap = await db.collection('users').doc(userId).get();
            recipientEmail = userSnap.data()?.email || userSnap.data()?.emailAddress || null;
          } catch (emailLookupErr) {
            log.warn(`[OutboxWorker] Could not resolve email for user ${userId}:`, emailLookupErr);
          }

          // Queue transactional email job into emailOutbox (no silent swallow)
          await db.collection('emailOutbox').add({
            recipientUid: userId,
            recipientEmail: recipientEmail,
            templateKey: 'order_receipt',
            templateData: {
              orderId: record.aggregateId,
              category,
              totalMinor: record.payload?.totalMinor || null,
            },
            relatedEntityType: 'order',
            relatedEntityId: record.aggregateId,
            status: 'queued',
            attemptCount: 0,
            sentAt: null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          log.info(`[OutboxWorker] Email receipt queued for order ${record.aggregateId}`);
        }
        break;
      }

      case 'order.cancelled': {
        const userId = record.payload?.userId;
        const reason = record.payload?.reason;
        const refunded = record.payload?.refunded;
        const refundAmountMinor = record.payload?.refundAmountMinor;

        if (userId) {
          const refundText = refunded && refundAmountMinor ? ` Refund of ₹${(refundAmountMinor / 100).toFixed(2)} processed to wallet.` : '';

          // Push notification + in-app notification
          await sendNotificationToUser(userId, {
            title: 'Order Cancelled ❌',
            body: `Your order #${record.aggregateId.slice(-6)} was cancelled.${reason ? ` Reason: ${reason}` : ''}${refundText}`,
            category: 'orders',
            data: {
              orderId: record.aggregateId,
              eventType: 'order.cancelled',
            },
          });

          // Queue cancellation email in emailOutbox
          const emailOutboxRef = db.collection('emailOutbox').doc();
          await emailOutboxRef.set({
            recipientUid: userId,
            templateKey: 'order_cancelled',
            templateData: {
              orderId: record.aggregateId,
              reason,
              refunded,
              refundAmountMinor,
            },
            relatedEntityType: 'order',
            relatedEntityId: record.aggregateId,
            status: 'queued',
            attemptCount: 0,
            sentAt: null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          log.info(`[OutboxWorker] Cancellation notifications & email queued for order ${record.aggregateId}`);
        }
        break;
      }

      default:
        log.warn(`[OutboxWorker] Unhandled outbox eventType: ${record.eventType}`);
        break;
    }

    // 3. Mark event as completed
    await eventRef.update({
      status: 'completed',
      processedAt: FieldValue.serverTimestamp(),
      completedAt: FieldValue.serverTimestamp(),
      lastError: null,
    });

    log.info(`[OutboxWorker] Successfully completed event ${eventId}`);
    return true;
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    log.error(`[OutboxWorker] Error processing event ${eventId}:`, err);

    const isFatal = currentAttempts >= 3;
    const nowMs = Date.now();
    // Exponential backoff: 2^attempts minutes
    const backoffMs = Math.pow(2, currentAttempts) * 60 * 1000;
    const nextAvailableAt = Timestamp.fromMillis(nowMs + backoffMs);

    if (isFatal) {
      await eventRef.update({
        status: 'failed',
        processedAt: FieldValue.serverTimestamp(),
        lastError: errorMsg,
      });
    } else {
      await eventRef.update({
        status: 'retryable_failed',
        availableAt: nextAvailableAt,
        lastError: errorMsg,
      });
    }

    return false;
  }
}

/**
 * TRIGGER 1: Real-time trigger on new outbox document (< 1s execution)
 */
export const onOutboxEventCreated = onDocumentCreated(
  {
    document: 'outbox/{eventId}',
    region: 'asia-south1',
  },
  async (event) => {
    const eventId = event.params.eventId;
    await processOutboxEvent(eventId);
  }
);

/**
 * TRIGGER 2: Scheduled retry and TTL maintenance worker (runs every 5 minutes)
 */
export const outboxScheduledWorker = onSchedule(
  {
    schedule: 'every 5 minutes',
    region: 'asia-south1',
  },
  async () => {
    log.info('[OutboxWorker] Running scheduled outbox sweep and cleanup');

    // 1. Process pending / retryable events
    try {
      const pendingSnap = await db
        .collection('outbox')
        .where('processedAt', '==', null)
        .limit(20)
        .get();

      if (!pendingSnap.empty) {
        log.info(`[OutboxWorker] Found ${pendingSnap.size} pending event(s) to process`);
        const nowMs = Date.now();
        for (const doc of pendingSnap.docs) {
          const data = doc.data() as OutboxRecord;
          if (data.status === 'failed') continue;
          if (data.availableAt) {
            const availMillis = typeof data.availableAt.toMillis === 'function'
              ? data.availableAt.toMillis()
              : new Date(data.availableAt).getTime();
            if (nowMs < availMillis) continue;
          }
          await processOutboxEvent(doc.id);
        }
      }
    } catch (queryErr) {
      log.warn('[OutboxWorker] Scheduled sweep query note:', queryErr);
    }

    // 2. TTL Cleanup: Remove completed or failed events older than 7 days
    try {
      const sevenDaysAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      const oldCompletedSnap = await db
        .collection('outbox')
        .where('status', 'in', ['completed', 'failed'])
        .where('completedAt', '<', sevenDaysAgo)
        .limit(100)
        .get();

      if (!oldCompletedSnap.empty) {
        const batch = db.batch();
        oldCompletedSnap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        log.info(`[OutboxWorker] TTL cleanup purged ${oldCompletedSnap.size} completed/failed outbox record(s)`);
      }
    } catch (cleanupErr) {
      log.warn('[OutboxWorker] TTL cleanup note:', cleanupErr);
    }
  }
);
