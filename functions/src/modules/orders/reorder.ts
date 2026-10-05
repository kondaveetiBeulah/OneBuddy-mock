import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../../common/firebase';
import { secureCallable } from '../../common/auth';
import { log } from '../../common/logging';
import { throwError } from '../../common/errors';
import { OrdersRepository } from '../../repositories';
import { CANCELLABLE_STATUSES } from './stateMachine';

// ----------------------------------------------------------------------------
// REORDER & RESCHEDULE (Greenfield Sec. 1 Line 91)
// ----------------------------------------------------------------------------

export const reorderSchema = z.object({
  orderId: z.string().min(1),
});

export const reorder = secureCallable(
  reorderSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const orderRef = OrdersRepository.getOrderRef(data.orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throwError('not-found', 'Order not found.');
    }
    const orderData = orderSnap.data();
    if (orderData?.userId !== uid) {
      throwError('permission-denied', 'Permission denied.');
    }

    const itemDocs = await OrdersRepository.getOrderItems(orderRef);
    const items = itemDocs.map((d) => d.data());

    return {
      success: true,
      category: orderData?.category,
      merchantId: orderData?.merchantId,
      items,
    };
  }
);

export const rescheduleOrderSchema = z.object({
  orderId: z.string().min(1),
  scheduledAt: z.string().min(1),
  reason: z.string().optional(),
});

export const rescheduleOrder = secureCallable(
  rescheduleOrderSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const now = Timestamp.now();
    const orderRef = OrdersRepository.getOrderRef(data.orderId);
    const userOrderRef = OrdersRepository.getUserOrderProjectionRef(uid, data.orderId);

    log.info(`[rescheduleOrder] User ${uid} requesting reschedule for order ${data.orderId} to ${data.scheduledAt}`);

    return await db.runTransaction(async (t) => {
      const snap = await t.get(orderRef);
      if (!snap.exists) {
        throwError('not-found', 'Order not found.');
      }
      const orderData = snap.data();
      if (orderData?.userId !== uid) {
        throwError('permission-denied', 'You do not have permission to reschedule this order.');
      }
      if (!CANCELLABLE_STATUSES.includes(orderData?.status)) {
        throwError(
          'failed-precondition',
          `Cannot reschedule order in status "${orderData?.status}". Only [${CANCELLABLE_STATUSES.join(', ')}] can be rescheduled.`
        );
      }

      OrdersRepository.updateOrder(t, orderRef, {
        scheduledAt: data.scheduledAt,
        rescheduledAt: now,
        updatedAt: now,
      });

      OrdersRepository.addOrderEvent(t, orderRef, {
        fromStatus: orderData?.status,
        toStatus: orderData?.status,
        actorType: 'user',
        actorId: uid,
        note: `Order delivery rescheduled to ${data.scheduledAt}${data.reason ? ` (${data.reason})` : ''}`,
        createdAt: now,
      }, now);

      const userOrderSnap = await t.get(userOrderRef);
      if (userOrderSnap.exists) {
        OrdersRepository.updateUserOrderProjection(t, uid, data.orderId, {
          scheduledAt: data.scheduledAt,
          updatedAt: now,
        });
      }

      return {
        success: true,
        orderId: data.orderId,
        scheduledAt: data.scheduledAt,
        message: 'Order rescheduled successfully.',
      };
    });
  }
);
