import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../core/firebase';
import { secureCallable } from '../core/callable';
import { log, throwError } from '../core/logger';

// ----------------------------------------------------------------------------
// REQUEST SCHEMAS
// ----------------------------------------------------------------------------

const orderItemInputSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

const addressSnapshotSchema = z.object({
  receiverName: z.string().default('Customer'),
  phone: z.string().default(''),
  line1: z.string().default(''),
  line2: z.string().nullish(),
  city: z.string().default(''),
  state: z.string().default(''),
  postalCode: z.string().default(''),
  label: z.string().optional(),
}).passthrough();

const placeOrderSchema = z.object({
  id: z.string().optional(), // Idempotency key / custom order ID
  category: z.enum(['food', 'grocery', 'groceries', 'pharmacy']).optional(),
  type: z.enum(['food', 'grocery', 'groceries', 'pharmacy']).optional(), // Backwards compatibility
  merchantId: z.string().optional(), // Required for food (restaurantId)
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item'),
  deliveryAddress: z.union([addressSnapshotSchema, z.record(z.string(), z.any())]).default({}),
  paymentMethod: z.enum(['wallet', 'cash_on_delivery', 'upi', 'card']).default('cash_on_delivery'),
  promotionCode: z.string().optional(),
  tipMinor: z.number().int().nonnegative().optional().default(0),
});

// ----------------------------------------------------------------------------
// PLACE ORDER (Server-Authoritative, Atomic Transaction)
// ----------------------------------------------------------------------------

export const placeOrder = secureCallable(
  placeOrderSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const now = Timestamp.now();
    const orderId = data.id || db.collection('orders').doc().id;
    const orderRef = db.collection('orders').doc(orderId);

    // Normalize category
    const rawCategory = data.category || data.type || 'groceries';
    const category: 'food' | 'groceries' = (rawCategory === 'food') ? 'food' : 'groceries';

    log.info(`[placeOrder] Starting checkout transaction for user ${uid}, orderId: ${orderId}, category: ${category}`);

    const result = await db.runTransaction(async (t) => {
      // 1. Idempotency Check: Don't process twice
      const existingOrder = await t.get(orderRef);
      if (existingOrder.exists) {
        log.warn(`[placeOrder] Idempotent replay for existing order ${orderId}`);
        return { success: true, orderId, replayed: true };
      }

      // 2. Fetch Merchant Details (if food)
      let merchantName = 'Fresh Mart Groceries';
      let merchantImage = '';
      let restaurantRef: FirebaseFirestore.DocumentReference | null = null;

      if (category === 'food') {
        if (!data.merchantId) {
          throwError('invalid-argument', 'merchantId (restaurantId) is required for food orders.');
        }
        restaurantRef = db.collection('catalogRestaurants').doc(data.merchantId);
        const restSnap = await t.get(restaurantRef);
        if (!restSnap.exists) {
          throwError('not-found', `Restaurant ${data.merchantId} not found.`);
        }
        const restData = restSnap.data();
        if (restData?.isOpen === false || restData?.active === false) {
          throwError('failed-precondition', 'This restaurant is currently closed.');
        }
        merchantName = restData?.name || 'Restaurant';
        merchantImage = restData?.featuredImage || restData?.bannerImage || '';
      }

      // 3. Server-Authoritative Price Calculation & Catalog Verification
      let calculatedSubtotalMinor = 0;
      let calculatedDiscountMinor = 0;
      const verifiedItems: Array<{
        catalogItemId: string;
        nameSnapshot: string;
        imageSnapshot: string;
        quantity: number;
        unitPriceMinor: number;
        discountMinor: number;
        lineTotalMinor: number;
        notes?: string;
      }> = [];

      for (const item of data.items) {
        let nameSnapshot = 'Item';
        let imageSnapshot = '';
        let unitPriceMinor = 0;
        let discountUnitPriceMinor = 0;

        if (category === 'food' && restaurantRef) {
          const itemRef = restaurantRef.collection('menuItems').doc(item.productId);
          const itemSnap = await t.get(itemRef);
          if (!itemSnap.exists) {
            throwError('not-found', `Menu item ${item.productId} not found.`);
          }
          const itemData = itemSnap.data();
          if (itemData?.available === false) {
            throwError('failed-precondition', `Dish "${itemData?.name || item.productId}" is currently sold out.`);
          }

          nameSnapshot = itemData?.name || 'Dish';
          imageSnapshot = itemData?.image || '';
          unitPriceMinor = typeof itemData?.priceMinor === 'number'
            ? itemData.priceMinor
            : Math.round((itemData?.price || 100) * 100);
          discountUnitPriceMinor = unitPriceMinor;
        } else {
          // Grocery Product
          const prodRef = db.collection('catalogGroceryProducts').doc(item.productId);
          const prodSnap = await t.get(prodRef);
          if (!prodSnap.exists) {
            throwError('not-found', `Grocery product ${item.productId} not found.`);
          }
          const prodData = prodSnap.data();
          if (prodData?.isAvailable === false) {
            throwError('failed-precondition', `Product "${prodData?.name || item.productId}" is currently unavailable.`);
          }

          nameSnapshot = prodData?.name || 'Product';
          imageSnapshot = prodData?.image || '';
          unitPriceMinor = typeof prodData?.priceMinor === 'number'
            ? prodData.priceMinor
            : Math.round((prodData?.price || 50) * 100);

          discountUnitPriceMinor = typeof prodData?.discountPriceMinor === 'number'
            ? prodData.discountPriceMinor
            : unitPriceMinor;
        }

        const itemSubtotalMinor = unitPriceMinor * item.quantity;
        const itemDiscountMinor = Math.max(0, (unitPriceMinor - discountUnitPriceMinor) * item.quantity);
        const lineTotalMinor = itemSubtotalMinor - itemDiscountMinor;

        calculatedSubtotalMinor += itemSubtotalMinor;
        calculatedDiscountMinor += itemDiscountMinor;

        verifiedItems.push({
          catalogItemId: item.productId,
          nameSnapshot,
          imageSnapshot,
          quantity: item.quantity,
          unitPriceMinor,
          discountMinor: itemDiscountMinor,
          lineTotalMinor,
          notes: item.notes,
        });
      }

      // 4. Calculate Final Monetary Totals (Integer minor units / Paise)
      const deliveryFeeMinor = 5000; // Flat ₹50 delivery fee (5000 paise)
      const taxMinor = Math.round((calculatedSubtotalMinor - calculatedDiscountMinor) * 0.05); // 5% GST
      const tipMinor = data.tipMinor || 0;
      const totalMinor = calculatedSubtotalMinor - calculatedDiscountMinor + deliveryFeeMinor + taxMinor + tipMinor;

      // 5. Handle Atomic Wallet Deduction (if selected)
      let paymentStatus = (data.paymentMethod === 'cash_on_delivery') ? 'pending' : 'paid';

      if (data.paymentMethod === 'wallet') {
        const walletRef = db.collection('wallets').doc(uid);
        const walletSnap = await t.get(walletRef);
        if (!walletSnap.exists) {
          throwError('not-found', 'Wallet record not found. Please initialize wallet.');
        }

        const walletData = walletSnap.data();
        const currentBalanceMinor = typeof walletData?.balanceMinor === 'number'
          ? walletData.balanceMinor
          : Math.round((walletData?.balance || 0) * 100);

        if (currentBalanceMinor < totalMinor) {
          throwError(
            'invalid-argument',
            `Insufficient wallet balance. Total is ₹${(totalMinor / 100).toFixed(2)}, but wallet has ₹${(currentBalanceMinor / 100).toFixed(2)}.`
          );
        }

        const newBalanceMinor = currentBalanceMinor - totalMinor;
        const newBalanceRupees = newBalanceMinor / 100;

        // Update Wallet Balance
        t.update(walletRef, {
          balance: newBalanceRupees,
          balanceMinor: newBalanceMinor,
          updatedAt: now,
        });

        // Write Immutable Ledger Entry
        const entryRef = walletRef.collection('entries').doc();
        t.set(entryRef, {
          id: entryRef.id,
          amount: totalMinor / 100,
          amountMinor: totalMinor,
          direction: 'debit',
          type: 'order_payment',
          orderId,
          title: `${category === 'food' ? 'Food' : 'Grocery'} Order #${orderId.slice(-6)}`,
          description: `Payment for order at ${merchantName}`,
          createdAt: now,
        });

        paymentStatus = 'paid';
      }

      // 6. Write Canonical Order Document (orders/{orderId})
      t.set(orderRef, {
        id: orderId,
        userId: uid,
        category,
        merchantId: data.merchantId || null,
        merchantSnapshot: {
          name: merchantName,
          imagePath: merchantImage,
        },
        status: 'placed',
        subtotalMinor: calculatedSubtotalMinor,
        discountMinor: calculatedDiscountMinor,
        deliveryFeeMinor,
        taxMinor,
        tipMinor,
        totalMinor,
        total: totalMinor / 100, // Helper for frontend display
        currency: 'INR',
        promotionCode: data.promotionCode || null,
        deliveryAddressSnapshot: data.deliveryAddress,
        paymentMethod: data.paymentMethod,
        paymentStatus,
        createdAt: now,
        updatedAt: now,
      });

      // 7. Write Subcollection: orders/{orderId}/items/{itemId} (Immutable Snapshots)
      for (let i = 0; i < verifiedItems.length; i++) {
        const item = verifiedItems[i];
        const itemDocRef = orderRef.collection('items').doc(`item_${i + 1}`);
        t.set(itemDocRef, {
          ...item,
          createdAt: now,
        });
      }

      // 8. Write Subcollection: orders/{orderId}/events/{eventId} (Lifecycle Trail)
      const initialEventRef = orderRef.collection('events').doc();
      t.set(initialEventRef, {
        eventId: initialEventRef.id,
        fromStatus: null,
        toStatus: 'placed',
        actorType: 'user',
        actorId: uid,
        note: 'Order successfully placed by customer',
        createdAt: now,
      });

      // 9. Write User Screen Projection: users/{uid}/orders/{orderId}
      // Matches the exact OrderCard interface expected by OrdersAndBookings screen!
      const userOrderProjectionRef = db.collection('users').doc(uid).collection('orders').doc(orderId);
      const totalDisplay = (totalMinor / 100).toFixed(2);
      const itemsCount = verifiedItems.reduce((acc, it) => acc + it.quantity, 0);

      t.set(userOrderProjectionRef, {
        id: orderId,
        category: (category === 'groceries') ? 'groceries' : 'food',
        icon: (category === 'groceries') ? '🛒' : '🍔',
        title: merchantName,
        status: 'Order Placed',
        statusKind: 'ongoing',
        subtitle: `${itemsCount} item${itemsCount > 1 ? 's' : ''} · ₹${totalDisplay} · Today`,
        actions: ['Track', 'Cancel'],
        group: 'Ongoing',
        totalMinor,
        updatedAt: now,
      });

      // 10. Write Transactional Outbox Job: outbox/{eventId}
      const outboxRef = db.collection('outbox').doc();
      t.set(outboxRef, {
        eventId: outboxRef.id,
        eventType: 'order.placed',
        aggregateType: 'order',
        aggregateId: orderId,
        payload: {
          userId: uid,
          category,
          merchantId: data.merchantId || null,
          totalMinor,
          itemCount: verifiedItems.length,
        },
        createdAt: now,
        availableAt: now,
        attempts: 0,
      });

      return {
        success: true,
        orderId,
        totalMinor,
        totalRupees: totalMinor / 100,
        merchantName,
        paymentStatus,
      };
    });

    log.info(`[placeOrder] Successfully placed order ${orderId} for user ${uid}`);
    return result;
  }
);

// ----------------------------------------------------------------------------
// CANCEL ORDER (Customer Cancellation with Wallet Refund)
// ----------------------------------------------------------------------------

const cancelOrderSchema = z.object({
  orderId: z.string(),
  reason: z.string().optional(),
});

export const cancelOrder = secureCallable(
  cancelOrderSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const now = Timestamp.now();
    const orderRef = db.collection('orders').doc(data.orderId);

    log.info(`[cancelOrder] User ${uid} requesting cancellation for order ${data.orderId}`);

    const result = await db.runTransaction(async (t) => {
      const orderSnap = await t.get(orderRef);
      if (!orderSnap.exists) {
        throwError('not-found', 'Order not found.');
      }

      const orderData = orderSnap.data();
      if (orderData?.userId !== uid) {
        throwError('permission-denied', 'You do not have permission to cancel this order.');
      }

      const currentStatus = orderData?.status;
      // Allowed cancellation states: only before delivery dispatch
      const cancellableStatuses = ['placed', 'confirmed', 'preparing'];
      if (!cancellableStatuses.includes(currentStatus)) {
        throwError(
          'failed-precondition',
          `Order cannot be cancelled because it is already "${currentStatus}".`
        );
      }

      // 1. Update Canonical Order Status
      t.update(orderRef, {
        status: 'cancelled',
        cancelledAt: now,
        cancellationReason: data.reason || 'Cancelled by customer',
        updatedAt: now,
      });

      // 2. Append Order Lifecycle Event
      const eventRef = orderRef.collection('events').doc();
      t.set(eventRef, {
        eventId: eventRef.id,
        fromStatus: currentStatus,
        toStatus: 'cancelled',
        actorType: 'user',
        actorId: uid,
        note: data.reason || 'Cancelled by customer',
        createdAt: now,
      });

      // 3. Refund to Wallet if paid via wallet
      if (orderData?.paymentMethod === 'wallet' && orderData?.paymentStatus === 'paid') {
        const refundAmountMinor = orderData.totalMinor || Math.round((orderData.total || 0) * 100);
        const walletRef = db.collection('wallets').doc(uid);
        const walletSnap = await t.get(walletRef);

        if (walletSnap.exists) {
          const walletData = walletSnap.data();
          const currentBalMinor = typeof walletData?.balanceMinor === 'number'
            ? walletData.balanceMinor
            : Math.round((walletData?.balance || 0) * 100);

          const newBalMinor = currentBalMinor + refundAmountMinor;
          t.update(walletRef, {
            balance: newBalMinor / 100,
            balanceMinor: newBalMinor,
            updatedAt: now,
          });

          const refundEntryRef = walletRef.collection('entries').doc();
          t.set(refundEntryRef, {
            id: refundEntryRef.id,
            amount: refundAmountMinor / 100,
            amountMinor: refundAmountMinor,
            direction: 'credit',
            type: 'refund',
            orderId: data.orderId,
            title: `Refund for Order #${data.orderId.slice(-6)}`,
            description: `Order cancelled. Refunded to wallet.`,
            createdAt: now,
          });
        }
      }

      // 4. Update User Screen Projection
      const userOrderRef = db.collection('users').doc(uid).collection('orders').doc(data.orderId);
      t.update(userOrderRef, {
        status: 'Cancelled',
        statusKind: 'done',
        group: 'Completed',
        actions: ['Reorder'],
        updatedAt: now,
      });

      // 5. Append Outbox Job
      const outboxRef = db.collection('outbox').doc();
      t.set(outboxRef, {
        eventId: outboxRef.id,
        eventType: 'order.cancelled',
        aggregateType: 'order',
        aggregateId: data.orderId,
        payload: { userId: uid, reason: data.reason },
        createdAt: now,
        availableAt: now,
        attempts: 0,
      });

      return { success: true, message: 'Order cancelled successfully' };
    });

    log.info(`[cancelOrder] Order ${data.orderId} successfully cancelled for user ${uid}`);
    return result;
  }
);

// ----------------------------------------------------------------------------
// REORDER (Fetches Item Snapshots to Refill Client Cart)
// ----------------------------------------------------------------------------

export const reorder = secureCallable(
  z.object({ orderId: z.string() }),
  async (data, context) => {
    const uid = context.auth.uid;
    const orderRef = db.collection('orders').doc(data.orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throwError('not-found', 'Order not found.');
    }
    const orderData = orderSnap.data();
    if (orderData?.userId !== uid) {
      throwError('permission-denied', 'Permission denied.');
    }

    const itemsSnap = await orderRef.collection('items').get();
    const items = itemsSnap.docs.map((d) => d.data());

    return {
      success: true,
      category: orderData?.category,
      merchantId: orderData?.merchantId,
      items,
    };
  }
);

// ----------------------------------------------------------------------------
// RUN ORDER ACTION (Used by Orders & Bookings screen)
// ----------------------------------------------------------------------------

export const runOrderAction = secureCallable(
  z.object({
    orderId: z.string(),
    action: z.string(),
  }),
  async (data, context) => {
    const uid = context.auth.uid;
    const now = Timestamp.now();
    const action = data.action.toLowerCase().trim();
    const userOrderRef = db.collection('users').doc(uid).collection('orders').doc(data.orderId);
    const userOrderSnap = await userOrderRef.get();

    if (!userOrderSnap.exists) {
      throwError('not-found', 'Order not found in user profile.');
    }

    const currentCard = userOrderSnap.data() as any;

    if (action === 'cancel') {
      const orderRef = db.collection('orders').doc(data.orderId);
      await db.runTransaction(async (t) => {
        const orderSnap = await t.get(orderRef);
        if (orderSnap.exists) {
          const oData = orderSnap.data();
          const currentStatus = oData?.status;
          if (['delivered', 'cancelled'].includes(currentStatus)) {
            throwError('failed-precondition', `Order cannot be cancelled in '${currentStatus}' status.`);
          }
          t.update(orderRef, {
            status: 'cancelled',
            updatedAt: now,
          });

          if (oData?.paymentMethod === 'wallet' && oData?.paymentStatus === 'paid') {
            const refundMinor = oData.totalMinor || Math.round((oData.total || 0) * 100);
            const walletRef = db.collection('wallets').doc(uid);
            const walletSnap = await t.get(walletRef);
            if (walletSnap.exists) {
              const wData = walletSnap.data();
              const curBalMinor = typeof wData?.balanceMinor === 'number'
                ? wData.balanceMinor
                : Math.round((wData?.balance || 0) * 100);
              const newBalMinor = curBalMinor + refundMinor;
              t.update(walletRef, {
                balance: newBalMinor / 100,
                balanceMinor: newBalMinor,
                updatedAt: now,
              });
              const refundEntryRef = walletRef.collection('entries').doc();
              t.set(refundEntryRef, {
                id: refundEntryRef.id,
                amount: refundMinor / 100,
                amountMinor: refundMinor,
                direction: 'credit',
                type: 'refund',
                orderId: data.orderId,
                title: `Refund for Order #${data.orderId.slice(-6)}`,
                description: 'Order cancelled via Orders & Bookings.',
                createdAt: now,
              });
            }
          }
        }

        t.update(userOrderRef, {
          status: 'Cancelled',
          statusKind: 'done',
          group: 'Completed',
          actions: ['Reorder'],
          updatedAt: now,
        });
      });

      return {
        id: currentCard.id,
        category: currentCard.category,
        icon: currentCard.icon,
        title: currentCard.title,
        subtitle: currentCard.subtitle,
        status: 'Cancelled',
        statusKind: 'done',
        group: 'Completed',
        actions: ['Reorder'],
      };
    }

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

