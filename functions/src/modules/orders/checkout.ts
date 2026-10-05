import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../../core/firebase';
import { secureCallable } from '../../core/callable';
import { log, throwError } from '../../core/logger';

// ----------------------------------------------------------------------------
// REQUEST SCHEMAS (Greenfield Sec. 4 Lines 242-248)
// ----------------------------------------------------------------------------

export const orderItemInputSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export const addressSnapshotSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  receiverName: z.string().default('Customer'),
  phone: z.string().default(''),
  line1: z.string().default(''),
  line2: z.string().nullish(),
  landmark: z.string().nullish(),
  city: z.string().default(''),
  state: z.string().default(''),
  postalCode: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  isDefault: z.boolean().optional(),
}).strict();

export const placeOrderSchema = z.object({
  id: z.string().optional(), // Idempotency key / custom order ID
  category: z.enum(['food', 'grocery', 'groceries', 'pharmacy']).optional(),
  type: z.enum(['food', 'grocery', 'groceries', 'pharmacy']).optional(), // Backwards compatibility
  merchantId: z.string().optional(), // Required for food (restaurantId)
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item'),
  deliveryAddress: addressSnapshotSchema.optional().default({
    receiverName: 'Customer',
    phone: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
  }),
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
        const wData = walletSnap.exists ? walletSnap.data() || {} : {};

        const currentBalMinor = typeof wData.balanceMinor === 'number'
          ? wData.balanceMinor
          : Math.round((wData.balance || 0) * 100);

        if (currentBalMinor < totalMinor) {
          throwError(
            'invalid-argument',
            `Insufficient wallet balance. Total is ₹${(totalMinor / 100).toFixed(2)}, but wallet has ₹${(currentBalMinor / 100).toFixed(2)}.`
          );
        }

        const newBalMinor = currentBalMinor - totalMinor;

        // Update Wallet Balance
        t.update(walletRef, {
          balanceMinor: newBalMinor,
          updatedAt: now,
        });

        // Write Immutable Ledger Entry per Greenfield Sec. 4 Line 284
        const entryRef = walletRef.collection('entries').doc(`entry_order_${orderId}`);
        t.set(entryRef, {
          id: entryRef.id,
          direction: 'debit',
          type: 'order_payment',
          amount: totalMinor / 100,
          amountMinor: totalMinor,
          currency: 'INR',
          orderId: orderId,
          title: `${category === 'food' ? 'Food' : 'Grocery'} Order #${orderId.slice(-6)}`,
          description: `Payment for order at ${merchantName}`,
          idempotencyKey: `order_${orderId}`,
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

      // 8b. Write Subcollection: orders/{orderId}/fulfillments/{fulfillmentId} (Greenfield Sec. 4 Line 251)
      const fulfillmentRef = orderRef.collection('fulfillments').doc('fulfillment_1');
      t.set(fulfillmentRef, {
        fulfillmentId: 'fulfillment_1',
        merchantId: data.merchantId || null,
        status: 'accepted',
        deliveryAddressSnapshot: data.deliveryAddress,
        createdAt: now,
        updatedAt: now,
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

    // Clean up server cart for this category after successful order placement
    try {
      const cartId = `${uid}_${category === 'food' ? 'food' : 'grocery'}`;
      const cartRef = db.collection('carts').doc(cartId);
      const itemsSnap = await cartRef.collection('items').get();
      if (!itemsSnap.empty) {
        const cleanupBatch = db.batch();
        itemsSnap.docs.forEach((d) => cleanupBatch.delete(d.ref));
        cleanupBatch.set(cartRef, {
          userId: uid,
          service: category === 'food' ? 'food' : 'grocery',
          merchantId: null,
          merchantSnapshot: null,
          itemCount: 0,
          updatedAt: now,
        }, { merge: true });
        await cleanupBatch.commit();
      }
    } catch (cleanupErr) {
      log.warn(`[placeOrder] Post-order cart cleanup note:`, cleanupErr);
    }

    return result;
  }
);
