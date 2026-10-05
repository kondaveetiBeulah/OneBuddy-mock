import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../common/firebase';
import { log } from '../common/logging';

// ---------------------------------------------------------------------------
// Configuration – set these via Firebase environment config or .env
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// ---------------------------------------------------------------------------

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'OneBuddy <noreply@onebuddy.in>';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailOutboxRecord {
  recipientUid: string;
  recipientEmail?: string;
  templateKey: string;
  templateData?: Record<string, any>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  status: 'queued' | 'processing' | 'sent' | 'retryable_failed' | 'failed';
  attemptCount: number;
  availableAt?: any;
  lastAttemptAt?: any;
  lastError?: string;
  sentAt?: any;
  createdAt: any;
  updatedAt: any;
}

// ---------------------------------------------------------------------------
// Email Template Renderer
// ---------------------------------------------------------------------------

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function renderEmailTemplate(
  templateKey: string,
  data: Record<string, any>
): RenderedEmail {
  switch (templateKey) {
    case 'order_receipt': {
      const orderId = data.orderId || 'N/A';
      const shortId = typeof orderId === 'string' ? orderId.slice(-6) : orderId;
      const total = data.totalMinor ? `₹${(data.totalMinor / 100).toFixed(2)}` : '';
      const category = data.category || 'order';

      return {
        subject: `Order Confirmed – #${shortId}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a73e8;">Order Confirmed! 🛍️</h2>
            <p>Your <strong>${category}</strong> order <strong>#${shortId}</strong> has been placed successfully.</p>
            ${total ? `<p style="font-size: 18px; font-weight: bold;">Total: ${total}</p>` : ''}
            <hr style="border: none; border-top: 1px solid #e0e0e0;" />
            <p style="color: #666; font-size: 12px;">This is an automated email from OneBuddy. Please do not reply.</p>
          </div>
        `.trim(),
        text: `Order Confirmed! Your ${category} order #${shortId} has been placed successfully.${total ? ` Total: ${total}` : ''}`,
      };
    }

    case 'order_cancelled': {
      const orderId = data.orderId || 'N/A';
      const shortId = typeof orderId === 'string' ? orderId.slice(-6) : orderId;
      const reason = data.reason || '';
      const refunded = data.refunded;
      const refundTotal = data.refundAmountMinor ? `₹${(data.refundAmountMinor / 100).toFixed(2)}` : null;

      return {
        subject: `Order Cancelled – #${shortId}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d93025;">Order Cancelled ❌</h2>
            <p>Your order <strong>#${shortId}</strong> has been cancelled.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            ${refunded && refundTotal ? `<p style="color: #2e7d32; font-weight: bold;">Refund of ${refundTotal} has been processed to your wallet.</p>` : ''}
            <hr style="border: none; border-top: 1px solid #e0e0e0;" />
            <p style="color: #666; font-size: 12px;">This is an automated email from OneBuddy. Please do not reply.</p>
          </div>
        `.trim(),
        text: `Order Cancelled. Your order #${shortId} has been cancelled.${reason ? ` Reason: ${reason}` : ''}${refunded && refundTotal ? ` Refund of ${refundTotal} processed to your wallet.` : ''}`,
      };
    }

    default:
      return {
        subject: 'OneBuddy Notification',
        html: `<p>${data.message || 'You have a new notification from OneBuddy.'}</p>`,
        text: data.message || 'You have a new notification from OneBuddy.',
      };
  }
}

// ---------------------------------------------------------------------------
// Resolve recipient email from users/{uid}
// ---------------------------------------------------------------------------

async function resolveRecipientEmail(uid: string): Promise<string | null> {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return null;
    const data = userDoc.data();
    return data?.email || data?.emailAddress || null;
  } catch (err) {
    log.warn(`[EmailDispatcher] Failed to resolve email for user ${uid}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Send email via SMTP (Nodemailer)
// ---------------------------------------------------------------------------

async function sendEmail(
  to: string,
  rendered: RenderedEmail
): Promise<void> {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    log.warn(
      '[EmailDispatcher] SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). ' +
      'Skipping actual send — email logged instead.'
    );
    log.info(`[EmailDispatcher] [DRY-RUN] To: ${to} | Subject: ${rendered.subject}`);
    return;
  }

  // Dynamic require to avoid crash if nodemailer is not installed yet
  let nodemailer: any;
  try {
    nodemailer = require('nodemailer');
  } catch {
    log.warn(
      '[EmailDispatcher] nodemailer not installed. Run: npm install nodemailer. ' +
      'Email logged as dry-run instead.'
    );
    log.info(`[EmailDispatcher] [DRY-RUN] To: ${to} | Subject: ${rendered.subject}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
}

// ---------------------------------------------------------------------------
// Core email processing engine (mirrors outbox pattern)
// ---------------------------------------------------------------------------

export async function processEmailOutboxEvent(docId: string): Promise<boolean> {
  const docRef = db.collection('emailOutbox').doc(docId);
  const now = Timestamp.now();

  // 1. Atomically claim
  let record: EmailOutboxRecord | null = null;
  let currentAttempts = 0;
  const shouldProcess = await db.runTransaction(async (t) => {
    const snap = await t.get(docRef);
    if (!snap.exists) return false;

    const data = snap.data() as EmailOutboxRecord;
    if (data.status === 'sent' || data.status === 'failed') return false;

    // Exponential backoff check
    if (data.availableAt) {
      const availMillis = typeof data.availableAt.toMillis === 'function'
        ? data.availableAt.toMillis()
        : new Date(data.availableAt).getTime();
      if (now.toMillis() < availMillis) return false;
    }

    // Stale-lock: skip if another worker claimed < 60s ago
    if (data.status === 'processing' && data.lastAttemptAt) {
      const elapsed = now.toMillis() - data.lastAttemptAt.toMillis();
      if (elapsed < 60000) return false;
    }

    currentAttempts = (data.attemptCount || 0) + 1;
    record = data;
    t.update(docRef, {
      status: 'processing',
      attemptCount: currentAttempts,
      lastAttemptAt: now,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });

  if (!shouldProcess || !record) return false;

  const rec = record as EmailOutboxRecord;
  log.info(`[EmailDispatcher] Processing email ${docId} (template: ${rec.templateKey}) for user ${rec.recipientUid}`);

  try {
    // 2. Resolve recipient email
    const email = rec.recipientEmail || (await resolveRecipientEmail(rec.recipientUid));
    if (!email) {
      log.warn(`[EmailDispatcher] No email address found for user ${rec.recipientUid}. Marking failed.`);
      await docRef.update({
        status: 'failed',
        lastError: 'No email address on user profile',
        updatedAt: FieldValue.serverTimestamp(),
      });
      return false;
    }

    // 3. Render template
    const rendered = renderEmailTemplate(rec.templateKey, rec.templateData || {});

    // 4. Send
    await sendEmail(email, rendered);

    // 5. Mark sent
    await docRef.update({
      status: 'sent',
      sentAt: FieldValue.serverTimestamp(),
      lastError: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    log.info(`[EmailDispatcher] Successfully sent email ${docId} to ${email}`);
    return true;
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    log.error(`[EmailDispatcher] Error sending email ${docId}:`, err);

    const isFatal = currentAttempts >= 3;
    const nowMs = Date.now();
    const backoffMs = Math.pow(2, currentAttempts) * 60 * 1000;
    const nextAvailableAt = Timestamp.fromMillis(nowMs + backoffMs);

    if (isFatal) {
      await docRef.update({
        status: 'failed',
        lastError: errorMsg,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await docRef.update({
        status: 'retryable_failed',
        availableAt: nextAvailableAt,
        lastError: errorMsg,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return false;
  }
}

// ---------------------------------------------------------------------------
// TRIGGER 1: Real-time trigger on new emailOutbox document
// ---------------------------------------------------------------------------

export const onEmailOutboxCreated = onDocumentCreated(
  {
    document: 'emailOutbox/{docId}',
    region: 'asia-south1',
  },
  async (event) => {
    const docId = event.params.docId;
    await processEmailOutboxEvent(docId);
  }
);

// ---------------------------------------------------------------------------
// TRIGGER 2: Scheduled retry sweep (every 5 minutes)
// ---------------------------------------------------------------------------

export const emailOutboxScheduledWorker = onSchedule(
  {
    schedule: 'every 5 minutes',
    region: 'asia-south1',
  },
  async () => {
    log.info('[EmailDispatcher] Running scheduled email outbox sweep');

    // 1. Process pending / retryable emails
    try {
      const pendingSnap = await db
        .collection('emailOutbox')
        .where('sentAt', '==', null)
        .where('status', '!=', 'failed')
        .limit(20)
        .get();

      if (!pendingSnap.empty) {
        log.info(`[EmailDispatcher] Found ${pendingSnap.size} pending email(s) to process`);
        const nowMs = Date.now();
        for (const doc of pendingSnap.docs) {
          const data = doc.data() as EmailOutboxRecord;
          if (data.availableAt) {
            const availMillis = typeof data.availableAt.toMillis === 'function'
              ? data.availableAt.toMillis()
              : new Date(data.availableAt).getTime();
            if (nowMs < availMillis) continue;
          }
          await processEmailOutboxEvent(doc.id);
        }
      }
    } catch (queryErr) {
      log.warn('[EmailDispatcher] Scheduled sweep query note:', queryErr);
    }

    // 2. TTL Cleanup: Remove sent or failed emails older than 30 days
    try {
      const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const oldSentSnap = await db
        .collection('emailOutbox')
        .where('status', 'in', ['sent', 'failed'])
        .where('updatedAt', '<', thirtyDaysAgo)
        .limit(100)
        .get();

      if (!oldSentSnap.empty) {
        const batch = db.batch();
        oldSentSnap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        log.info(`[EmailDispatcher] TTL cleanup purged ${oldSentSnap.size} sent/failed email record(s)`);
      }
    } catch (cleanupErr) {
      log.warn('[EmailDispatcher] TTL cleanup note:', cleanupErr);
    }
  }
);
