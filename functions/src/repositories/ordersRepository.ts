import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../common/firebase';

export interface OrderItemRecord {
  catalogItemId: string;
  nameSnapshot: string;
  imageSnapshot: string;
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
  lineTotalMinor: number;
  notes?: string;
  createdAt?: any;
}

export interface OrderEventRecord {
  eventId?: string;
  fromStatus: string | null;
  toStatus: string;
  actorType: 'user' | 'admin' | 'system';
  actorId: string;
  note?: string;
  createdAt?: any;
}

export interface OrderFulfillmentRecord {
  fulfillmentId: string;
  merchantId?: string | null;
  status: string;
  deliveryAddressSnapshot: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface FulfillmentEventRecord {
  fromStatus?: string | null;
  toStatus: string;
  actorType: 'user' | 'merchant' | 'driver' | 'system' | 'admin';
  actorId?: string | null;
  note?: string | null;
  createdAt?: any;
}

export interface OutboxEventRecord {
  eventId?: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, any>;
  createdAt?: any;
  availableAt?: any;
  attempts?: number;
}

export interface ListOrdersParams {
  userId: string;
  category?: string;
  status?: string;
  cursor?: string;
  limit: number;
}

/**
 * Repository for Orders collection (orders/{orderId}), items, events, fulfillments subcollections,
 * client screen projections (users/{userId}/orders/{orderId}), and transactional outbox.
 */
export class OrdersRepository {
  /**
   * Reference to canonical order document.
   */
  static getOrderRef(orderId?: string): FirebaseFirestore.DocumentReference {
    return orderId ? db.collection('orders').doc(orderId) : db.collection('orders').doc();
  }

  /**
   * Reference to user's order card projection.
   */
  static getUserOrderProjectionRef(userId: string, orderId: string): FirebaseFirestore.DocumentReference {
    return db.collection('users').doc(userId).collection('orders').doc(orderId);
  }

  /**
   * Reference to transactional outbox document.
   */
  static getOutboxRef(eventId?: string): FirebaseFirestore.DocumentReference {
    return eventId ? db.collection('outbox').doc(eventId) : db.collection('outbox').doc();
  }

  /**
   * Fetch canonical order document snapshot.
   */
  static async getOrder(
    orderId: string,
    transaction?: FirebaseFirestore.Transaction
  ): Promise<FirebaseFirestore.DocumentSnapshot> {
    const ref = this.getOrderRef(orderId);
    return transaction ? transaction.get(ref) : ref.get();
  }

  /**
   * Fetch canonical order document with all subcollections (items, events, fulfillments).
   */
  static async getOrderWithSubcollections(orderId: string): Promise<{
    orderSnap: FirebaseFirestore.DocumentSnapshot;
    items: Array<{ id: string; [key: string]: any }>;
    events: Array<{ id: string; [key: string]: any }>;
    fulfillments: Array<{ id: string; [key: string]: any }>;
  }> {
    const orderRef = this.getOrderRef(orderId);
    const [orderSnap, itemsSnap, eventsSnap, fulfillmentsSnap] = await Promise.all([
      orderRef.get(),
      orderRef.collection('items').orderBy('createdAt', 'asc').get(),
      orderRef.collection('events').orderBy('createdAt', 'asc').get(),
      orderRef.collection('fulfillments').get(),
    ]);

    const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const events = eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const fulfillments = fulfillmentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return {
      orderSnap,
      items,
      events,
      fulfillments,
    };
  }

  /**
   * List user orders with filtering (category, status) and cursor pagination.
   */
  static async listUserOrders(params: ListOrdersParams): Promise<{
    docs: FirebaseFirestore.QueryDocumentSnapshot[];
    nextCursor: string | null;
  }> {
    let query: FirebaseFirestore.Query = db
      .collection('orders')
      .where('userId', '==', params.userId)
      .orderBy('createdAt', 'desc');

    if (params.category) {
      const normCat = params.category === 'groceries' ? 'groceries' : params.category;
      query = query.where('category', '==', normCat);
    }

    if (params.status) {
      query = query.where('status', '==', params.status);
    }

    if (params.cursor) {
      const cursorDoc = await this.getOrderRef(params.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    query = query.limit(params.limit);
    const snap = await query.get();

    const nextCursor =
      snap.docs.length === params.limit ? snap.docs[snap.docs.length - 1].id : null;

    return {
      docs: snap.docs,
      nextCursor,
    };
  }

  /**
   * Get subcollection items for an order.
   */
  static async getOrderItems(orderRef: FirebaseFirestore.DocumentReference): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
    const snap = await orderRef.collection('items').get();
    return snap.docs;
  }

  /**
   * Save a new canonical order document within a transaction.
   */
  static createOrder(
    t: FirebaseFirestore.Transaction,
    orderRef: FirebaseFirestore.DocumentReference,
    orderData: Record<string, any>
  ): void {
    t.set(orderRef, orderData);
  }

  /**
   * Update an existing canonical order within a transaction.
   */
  static updateOrder(
    t: FirebaseFirestore.Transaction,
    orderRef: FirebaseFirestore.DocumentReference,
    updates: Record<string, any>
  ): void {
    t.update(orderRef, updates);
  }

  /**
   * Add items to order's items subcollection within a transaction.
   */
  static addOrderItems(
    t: FirebaseFirestore.Transaction,
    orderRef: FirebaseFirestore.DocumentReference,
    items: OrderItemRecord[],
    now: Timestamp = Timestamp.now()
  ): void {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemDocRef = orderRef.collection('items').doc(`item_${i + 1}`);
      t.set(itemDocRef, {
        ...item,
        createdAt: item.createdAt || now,
      });
    }
  }

  /**
   * Record a lifecycle event in the events subcollection.
   */
  static addOrderEvent(
    t: FirebaseFirestore.Transaction,
    orderRef: FirebaseFirestore.DocumentReference,
    eventData: OrderEventRecord,
    now: Timestamp = Timestamp.now()
  ): void {
    const eventRef = eventData.eventId
      ? orderRef.collection('events').doc(eventData.eventId)
      : orderRef.collection('events').doc();
    t.set(eventRef, {
      eventId: eventRef.id,
      fromStatus: eventData.fromStatus,
      toStatus: eventData.toStatus,
      actorType: eventData.actorType,
      actorId: eventData.actorId,
      note: eventData.note || null,
      createdAt: eventData.createdAt || now,
    });
  }

  /**
   * Add a fulfillment subcollection document.
   */
  static addOrderFulfillment(
    t: FirebaseFirestore.Transaction,
    orderRef: FirebaseFirestore.DocumentReference,
    fulfillment: OrderFulfillmentRecord,
    now: Timestamp = Timestamp.now()
  ): void {
    const fulfillmentRef = orderRef.collection('fulfillments').doc(fulfillment.fulfillmentId);
    t.set(fulfillmentRef, {
      ...fulfillment,
      createdAt: fulfillment.createdAt || now,
      updatedAt: fulfillment.updatedAt || now,
    });
  }

  /**
   * Append an event to the nested fulfillment event trail:
   * orders/{orderId}/fulfillments/{fulfillmentId}/events/{eventId}
   */
  static addFulfillmentEvent(
    t: FirebaseFirestore.Transaction,
    orderId: string,
    fulfillmentId: string,
    event: FulfillmentEventRecord,
    now: Timestamp = Timestamp.now()
  ): void {
    const fulfillmentRef = db
      .collection('orders')
      .doc(orderId)
      .collection('fulfillments')
      .doc(fulfillmentId);

    const eventRef = fulfillmentRef.collection('events').doc();
    t.set(eventRef, {
      eventId: eventRef.id,
      fromStatus: event.fromStatus || null,
      toStatus: event.toStatus,
      actorType: event.actorType,
      actorId: event.actorId || null,
      note: event.note || null,
      createdAt: event.createdAt || now,
    });

    t.set(
      fulfillmentRef,
      {
        status: event.toStatus,
        updatedAt: now,
      },
      { merge: true }
    );
  }

  /**
   * Fetch fulfillment event records for an order fulfillment.
   */
  static async getFulfillmentEvents(
    orderId: string,
    fulfillmentId: string
  ): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
    const snap = await db
      .collection('orders')
      .doc(orderId)
      .collection('fulfillments')
      .doc(fulfillmentId)
      .collection('events')
      .orderBy('createdAt', 'asc')
      .get();
    return snap.docs;
  }

  /**
   * Set user screen projection for OrderCard display.
   */
  static setUserOrderProjection(
    t: FirebaseFirestore.Transaction,
    userId: string,
    orderId: string,
    projectionData: Record<string, any>
  ): void {
    const ref = this.getUserOrderProjectionRef(userId, orderId);
    t.set(ref, projectionData);
  }

  /**
   * Update user screen projection for OrderCard display.
   */
  static updateUserOrderProjection(
    t: FirebaseFirestore.Transaction,
    userId: string,
    orderId: string,
    updates: Record<string, any>
  ): void {
    const ref = this.getUserOrderProjectionRef(userId, orderId);
    t.update(ref, updates);
  }

  /**
   * Get user screen projection snapshot.
   */
  static async getUserOrderProjection(
    userId: string,
    orderId: string,
    transaction?: FirebaseFirestore.Transaction
  ): Promise<FirebaseFirestore.DocumentSnapshot> {
    const ref = this.getUserOrderProjectionRef(userId, orderId);
    return transaction ? transaction.get(ref) : ref.get();
  }

  /**
   * Enqueue a reliable outbox event within a transaction.
   */
  static createOutboxEvent(
    t: FirebaseFirestore.Transaction,
    event: OutboxEventRecord,
    now: Timestamp = Timestamp.now()
  ): void {
    const outboxRef = this.getOutboxRef(event.eventId);
    t.set(outboxRef, {
      eventId: outboxRef.id,
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payload: event.payload,
      createdAt: event.createdAt || now,
      availableAt: event.availableAt || now,
      attempts: event.attempts ?? 0,
    });
  }
}
