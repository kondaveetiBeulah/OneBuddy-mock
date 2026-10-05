import { z } from 'zod';
import { secureCallable } from '../../common/auth';
import { throwError } from '../../common/errors';
import { OrdersRepository } from '../../repositories';

// ----------------------------------------------------------------------------
// ORDER QUERIES (Greenfield Sec. 1 Line 91 & Sec. 4 Lines 241-253)
// ----------------------------------------------------------------------------

export const listMyOrdersSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  category: z.enum(['food', 'grocery', 'groceries', 'pharmacy']).optional(),
  status: z.string().optional(),
});

export const listMyOrders = secureCallable(
  listMyOrdersSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const { docs, nextCursor } = await OrdersRepository.listUserOrders({
      userId: uid,
      category: data.category,
      status: data.status,
      cursor: data.cursor,
      limit: data.limit,
    });

    const orders = docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return {
      orders,
      nextCursor,
    };
  }
);

export const getMyOrderSchema = z.object({
  orderId: z.string().min(1),
});

export const getMyOrder = secureCallable(
  getMyOrderSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const { orderSnap, items, events, fulfillments } = await OrdersRepository.getOrderWithSubcollections(data.orderId);

    if (!orderSnap.exists) {
      throwError('not-found', 'Order not found.');
    }

    const orderData = orderSnap.data()!;
    if (orderData.userId !== uid) {
      throwError('permission-denied', 'You do not have access to this order.');
    }

    return {
      order: {
        id: orderSnap.id,
        ...orderData,
        items,
        events,
        fulfillments,
      },
    };
  }
);
