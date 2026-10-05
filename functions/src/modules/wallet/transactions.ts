import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../core/firebase';
import { secureCallable } from '../../core/callable';
import { log, throwError } from '../../core/logger';
import { applyWalletDebit } from './ledger';

export const chargeWalletSchema = z
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

export const listWalletTransactionsSchema = z
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
