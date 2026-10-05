import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../../common/firebase';
import { secureCallable } from '../../common/auth';
import { log } from '../../common/logging';
import { throwError } from '../../common/errors';
import { OrdersRepository, WalletsRepository } from '../../repositories';

// ----------------------------------------------------------------------------
// ORDER LIFECYCLE STATE MACHINE (Greenfield Sec. 4 Lines 244-253)
// ----------------------------------------------------------------------------

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'preparing',
  'packed',
  'assigned',
  'out_for_delivery',
  'in_progress',
  'delivered',
  'completed',
  'cancelled',
  'failed',
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export const CANCELLABLE_STATUSES: OrderStatus[] = ['placed', 'confirmed', 'preparing'];

export const ALLOWED_ORDER_ACTIONS = [
  'track',
  'reorder',
  'invoice',
  'reschedule',
  'rebook',
  'book again',
] as const;

// Transition Graph defining legal state transitions
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled', 'failed'],
  confirmed: ['preparing', 'cancelled', 'failed'],
  preparing: ['packed', 'cancelled', 'failed'],
  packed: ['assigned', 'out_for_delivery', 'failed'],
  assigned: ['out_for_delivery', 'failed'],
  out_for_delivery: ['in_progress', 'delivered', 'failed'],
  in_progress: ['delivered', 'failed'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
  failed: [],
};

// ----------------------------------------------------------------------------
// 1. CANCEL ORDER (Customer Cancellation with Wallet Refund)
// ----------------------------------------------------------------------------

export const cancelOrderSchema = z.object({
  orderId: z.string(),
  reason: z.string().optional(),
});

export interface CancellationParams {
  orderRef: FirebaseFirestore.DocumentReference;
  userOrderRef: FirebaseFirestore.DocumentReference;
  uid: string;
  orderId: string;
  reason?: string;
  now: Timestamp;
}

export async function performOrderCancellation(
  t: FirebaseFirestore.Transaction,
  params: CancellationParams
) {
  const { orderRef, userOrderRef, uid, orderId, reason, now } = params;
  const orderSnap = await t.get(orderRef);
  if (!orderSnap.exists) {
    throwError('not-found', 'Order not found.');
  }

  const orderData = orderSnap.data();
  if (orderData?.userId !== uid) {
    throwError('permission-denied', 'You do not have permission to cancel this order.');
  }

  const currentStatus = orderData?.status as OrderStatus;
  if (!CANCELLABLE_STATUSES.includes(currentStatus)) {
    throwError(
      'failed-precondition',
      `Order cannot be cancelled because it is already "${currentStatus}". Only orders in [${CANCELLABLE_STATUSES.join(', ')}] can be cancelled.`
    );
  }

  // 1. Update Canonical Order Status
  OrdersRepository.updateOrder(t, orderRef, {
    status: 'cancelled',
    cancelledAt: now,
    cancellationReason: reason || 'Cancelled by customer',
    updatedAt: now,
  });

  // 2. Append Order Lifecycle Event
  OrdersRepository.addOrderEvent(
    t,
    orderRef,
    {
      fromStatus: currentStatus,
      toStatus: 'cancelled',
      actorType: 'user',
      actorId: uid,
      note: reason || 'Cancelled by customer',
      createdAt: now,
    },
    now
  );

  // 2b. Append Fulfillment Lifecycle Event
  OrdersRepository.addFulfillmentEvent(
    t,
    orderId,
    'fulfillment_1',
    {
      fromStatus: currentStatus,
      toStatus: 'cancelled',
      actorType: 'user',
      actorId: uid,
      note: reason || 'Cancelled by customer',
      createdAt: now,
    },
    now
  );

  // 3. Refund to Wallet if paid via wallet
  if (orderData?.paymentMethod === 'wallet' && orderData?.paymentStatus === 'paid') {
    const refundAmountMinor = orderData.totalMinor || Math.round((orderData.total || 0) * 100);
    const walletSnap = await WalletsRepository.getWallet(uid, t);

    if (walletSnap.exists) {
      const walletData = walletSnap.data();
      const currentBalMinor = typeof walletData?.balanceMinor === 'number'
        ? walletData.balanceMinor
        : Math.round((walletData?.balance || 0) * 100);

      const newBalMinor = currentBalMinor + refundAmountMinor;
      WalletsRepository.updateBalance(uid, newBalMinor, t);

      const refundEntryRef = WalletsRepository.getEntryRef(uid);
      WalletsRepository.saveEntry(
        uid,
        {
          id: refundEntryRef.id,
          amount: refundAmountMinor / 100,
          amountMinor: refundAmountMinor,
          direction: 'credit',
          type: 'refund',
          orderId,
          currency: 'INR',
          title: `Refund for Order #${orderId.slice(-6)}`,
          description: 'Order cancelled. Refunded to wallet.',
          createdAt: now,
        },
        t
      );
    }
  }

  // 4. Update User Screen Projection
  const userOrderSnap = await t.get(userOrderRef);
  if (userOrderSnap.exists) {
    OrdersRepository.updateUserOrderProjection(t, uid, orderId, {
      status: 'Cancelled',
      statusKind: 'done',
      group: 'Completed',
      actions: ['Reorder'],
      updatedAt: now,
    });
  }

  // 5. Append Outbox Job
  const wasRefunded = orderData?.paymentMethod === 'wallet' && orderData?.paymentStatus === 'paid';
  const refundAmountMinor = wasRefunded ? (orderData.totalMinor || Math.round((orderData.total || 0) * 100)) : null;

  OrdersRepository.createOutboxEvent(
    t,
    {
      eventType: 'order.cancelled',
      aggregateType: 'order',
      aggregateId: orderId,
      payload: {
        userId: uid,
        reason: reason || 'Cancelled by customer',
        refunded: wasRefunded,
        refundAmountMinor: refundAmountMinor,
      },
      createdAt: now,
      availableAt: now,
      attempts: 0,
    },
    now
  );
}

export const cancelOrder = secureCallable(
  cancelOrderSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const now = Timestamp.now();
    const orderRef = OrdersRepository.getOrderRef(data.orderId);
    const userOrderRef = OrdersRepository.getUserOrderProjectionRef(uid, data.orderId);

    log.info(`[cancelOrder] User ${uid} requesting cancellation for order ${data.orderId}`);

    await db.runTransaction(async (t) => {
      await performOrderCancellation(t, {
        orderRef,
        userOrderRef,
        uid,
        orderId: data.orderId,
        reason: data.reason,
        now,
      });
    });

    log.info(`[cancelOrder] Order ${data.orderId} successfully cancelled for user ${uid}`);
    return { success: true, message: 'Order cancelled successfully' };
  }
);

// ----------------------------------------------------------------------------
// 2. UPDATE ORDER STATUS (State Machine Transition)
// ----------------------------------------------------------------------------

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(ORDER_STATUSES),
  note: z.string().optional(),
});

export const updateOrderStatus = secureCallable(
  updateOrderStatusSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const isAdmin = context.auth.token?.admin === true;
    const now = Timestamp.now();
    const orderRef = OrdersRepository.getOrderRef(data.orderId);

    return await db.runTransaction(async (t) => {
      const snap = await t.get(orderRef);
      if (!snap.exists) {
        throwError('not-found', 'Order not found.');
      }

      const orderData = snap.data()!;
      const currentStatus = orderData.status as OrderStatus;
      const targetStatus = data.status;

      // Validate allowed state transitions
      const legalTargets = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!isAdmin && !legalTargets.includes(targetStatus)) {
        throwError(
          'failed-precondition',
          `Cannot transition order from "${currentStatus}" to "${targetStatus}". Allowed next states: [${legalTargets.join(', ')}]`
        );
      }

      // Update Canonical Order
      OrdersRepository.updateOrder(t, orderRef, {
        status: targetStatus,
        updatedAt: now,
        ...(targetStatus === 'completed' || targetStatus === 'delivered' ? { completedAt: now } : {}),
      });

      // Append Order Event
      OrdersRepository.addOrderEvent(
        t,
        orderRef,
        {
          fromStatus: currentStatus,
          toStatus: targetStatus,
          actorType: isAdmin ? 'admin' : 'system',
          actorId: uid,
          note: data.note || `Order status updated to ${targetStatus}`,
          createdAt: now,
        },
        now
      );

      // Append Fulfillment Lifecycle Event
      OrdersRepository.addFulfillmentEvent(
        t,
        data.orderId,
        'fulfillment_1',
        {
          fromStatus: currentStatus,
          toStatus: targetStatus,
          actorType: isAdmin ? 'admin' : 'system',
          actorId: uid,
          note: data.note || `Fulfillment status transitioned to ${targetStatus}`,
          createdAt: now,
        },
        now
      );

      // Update User Projection
      const customerUid = orderData.userId;
      if (customerUid) {
        const userSnap = await OrdersRepository.getUserOrderProjection(customerUid, data.orderId, t);
        if (userSnap.exists) {
          const isDone = ['delivered', 'completed', 'cancelled', 'failed'].includes(targetStatus);
          OrdersRepository.updateUserOrderProjection(t, customerUid, data.orderId, {
            status: targetStatus.replace('_', ' ').toUpperCase(),
            statusKind: isDone ? 'done' : 'ongoing',
            group: isDone ? 'Completed' : 'Ongoing',
            updatedAt: now,
          });
        }
      }

      // Enqueue Outbox Event
      OrdersRepository.createOutboxEvent(
        t,
        {
          eventType: 'order.status_updated',
          aggregateType: 'order',
          aggregateId: data.orderId,
          payload: {
            orderId: data.orderId,
            userId: customerUid,
            fromStatus: currentStatus,
            toStatus: targetStatus,
          },
          createdAt: now,
          availableAt: now,
          attempts: 0,
        },
        now
      );

      return {
        success: true,
        orderId: data.orderId,
        fromStatus: currentStatus,
        toStatus: targetStatus,
      };
    });
  }
);

// ----------------------------------------------------------------------------
// 3. RUN ORDER ACTION (Used by Orders & Bookings screen)
// ----------------------------------------------------------------------------

export const runOrderAction = secureCallable(
  z.object({
    orderId: z.string().min(1),
    action: z.string().min(1),
  }),
  async (data, context) => {
    const uid = context.auth.uid;
    const normalizedAction = data.action.toLowerCase().trim();

    if (!ALLOWED_ORDER_ACTIONS.includes(normalizedAction as any)) {
      throwError(
        'invalid-argument',
        `Action "${data.action}" is not supported. Allowed actions: ${ALLOWED_ORDER_ACTIONS.join(', ')}`
      );
    }

    const userOrderSnap = await OrdersRepository.getUserOrderProjection(uid, data.orderId);

    if (!userOrderSnap.exists) {
      throwError('not-found', 'Order not found in user profile.');
    }

    const currentCard = userOrderSnap.data() as any;

    return {
      id: currentCard.id,
      category: currentCard.category,
      icon: currentCard.icon,
      title: currentCard.title,
      subtitle: currentCard.subtitle,
      status: currentCard.status,
      statusKind: currentCard.statusKind,
      group: currentCard.group,
      actions: currentCard.actions || ['Track'],
    };
  }
);
