import { z } from 'zod';
import { db } from '../../core/firebase';
import { secureCallable } from '../../core/callable';
import { throwError } from '../../core/logger';

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
    let query: FirebaseFirestore.Query = db
      .collection('orders')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc');

    if (data.category) {
      const normCat = data.category === 'groceries' ? 'groceries' : data.category;
      query = query.where('category', '==', normCat);
    }

    if (data.status) {
      query = query.where('status', '==', data.status);
    }

    if (data.cursor) {
      const cursorDoc = await db.collection('orders').doc(data.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    query = query.limit(data.limit);

    const snap = await query.get();
    const orders = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    const nextCursor = snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

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
    const orderRef = db.collection('orders').doc(data.orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throwError('not-found', 'Order not found.');
    }

    const orderData = orderSnap.data()!;
    if (orderData.userId !== uid) {
      throwError('permission-denied', 'You do not have access to this order.');
    }

    const [itemsSnap, eventsSnap, fulfillmentsSnap] = await Promise.all([
      orderRef.collection('items').orderBy('createdAt', 'asc').get(),
      orderRef.collection('events').orderBy('createdAt', 'asc').get(),
      orderRef.collection('fulfillments').get(),
    ]);

    const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const events = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const fulfillments = fulfillmentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

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
