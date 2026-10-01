import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../core/firebase';
import { secureCallable } from '../../core/callable';
import { log, throwError } from '../../core/logger';

// ----------------------------------------------------------------------------
// TYPES & SCHEMAS
// ----------------------------------------------------------------------------

export type CartServiceType = 'food' | 'grocery';

function normalizeService(raw: string): CartServiceType {
  const norm = raw.toLowerCase().trim();
  return (norm === 'food') ? 'food' : 'grocery';
}

const cartItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

// ----------------------------------------------------------------------------
// 1. GET CART (Reads carts/{uid}_{service} with items subcollection)
// ----------------------------------------------------------------------------

const getCartSchema = z.object({
  service: z.enum(['food', 'grocery', 'groceries']).default('food'),
});

export const getCart = secureCallable(
  getCartSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const service = normalizeService(data.service);
    const cartId = `${uid}_${service}`;
    const cartRef = db.collection('carts').doc(cartId);

    const [cartSnap, itemsSnap] = await Promise.all([
      cartRef.get(),
      cartRef.collection('items').get(),
    ]);

    const cartData = cartSnap.exists ? cartSnap.data() || {} : {};
    let subtotalMinor = 0;
    let itemCount = 0;

    const items = itemsSnap.docs.map((docSnap) => {
      const d = docSnap.data();
      const qty = d.quantity || 1;
      const unitPrice = d.unitPriceMinor || 0;
      const discountPrice = d.discountUnitPriceMinor ?? unitPrice;
      const lineTotal = discountPrice * qty;

      subtotalMinor += lineTotal;
      itemCount += qty;

      return {
        id: docSnap.id,
        productId: d.catalogItemId || docSnap.id,
        name: d.name || 'Item',
        image: d.image || '',
        quantity: qty,
        unitPriceMinor: unitPrice,
        discountUnitPriceMinor: discountPrice,
        price: unitPrice / 100,
        discountPrice: discountPrice / 100,
        lineTotalMinor: lineTotal,
        notes: d.notes || null,
      };
    });

    return {
      cartId,
      service,
      merchantId: cartData.merchantId || null,
      merchantSnapshot: cartData.merchantSnapshot || null,
      items,
      itemCount,
      subtotalMinor,
      subtotal: subtotalMinor / 100,
    };
  }
);

// ----------------------------------------------------------------------------
// 2. SET CART ITEM (Validates catalog availability + writes to cart)
// ----------------------------------------------------------------------------

const setCartItemSchema = z.object({
  service: z.enum(['food', 'grocery', 'groceries']).default('food'),
  merchantId: z.string().optional(), // Required for food (restaurantId)
  merchantName: z.string().optional(),
  merchantImage: z.string().optional(),
  productId: z.string().min(1),
  quantity: z.number().int().min(0), // 0 removes item
  notes: z.string().optional(),
  clearExistingIfConflict: z.boolean().optional().default(false),
});

export const setCartItem = secureCallable(
  setCartItemSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const service = normalizeService(data.service);
    const cartId = `${uid}_${service}`;
    const cartRef = db.collection('carts').doc(cartId);
    const itemRef = cartRef.collection('items').doc(data.productId);

    log.info(`[setCartItem] User ${uid} updating item ${data.productId} (qty: ${data.quantity}) in ${cartId}`);

    // If removing item (quantity == 0)
    if (data.quantity <= 0) {
      await itemRef.delete();
      const remainingSnap = await cartRef.collection('items').get();
      let remainingQty = 0;
      let remainingSubtotalMinor = 0;

      remainingSnap.docs.forEach((d) => {
        const item = d.data();
        const qty = item.quantity || 1;
        const price = item.discountUnitPriceMinor ?? item.unitPriceMinor ?? 0;
        remainingQty += qty;
        remainingSubtotalMinor += price * qty;
      });

      await cartRef.set({
        userId: uid,
        service,
        itemCount: remainingQty,
        subtotalMinor: remainingSubtotalMinor,
        ...(remainingQty === 0 ? { merchantId: null, merchantSnapshot: null } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      return {
        success: true,
        removed: true,
        productId: data.productId,
        itemCount: remainingQty,
        subtotalMinor: remainingSubtotalMinor,
        subtotal: remainingSubtotalMinor / 100,
      };
    }

    // 1. Fetch & Validate Catalog Entity
    let nameSnapshot = 'Item';
    let imageSnapshot = '';
    let unitPriceMinor = 0;
    let discountUnitPriceMinor = 0;
    let targetMerchantId: string | null = null;
    let targetMerchantName = data.merchantName || 'Store';
    let targetMerchantImage = data.merchantImage || '';

    if (service === 'food') {
      if (!data.merchantId) {
        throwError('invalid-argument', 'merchantId (restaurantId) is required for food items.');
      }
      targetMerchantId = data.merchantId;

      const restRef = db.collection('catalogRestaurants').doc(targetMerchantId);
      const [restSnap, menuItemSnap] = await Promise.all([
        restRef.get(),
        restRef.collection('menuItems').doc(data.productId).get(),
      ]);

      if (!restSnap.exists) {
        throwError('not-found', `Restaurant ${targetMerchantId} not found.`);
      }
      const restData = restSnap.data();
      if (restData?.active === false || restData?.isOpen === false) {
        throwError('failed-precondition', 'This restaurant is currently closed.');
      }
      targetMerchantName = restData?.name || targetMerchantName;
      targetMerchantImage = restData?.featuredImage || restData?.bannerImage || targetMerchantImage;

      if (!menuItemSnap.exists) {
        throwError('not-found', `Menu item ${data.productId} not found.`);
      }
      const itemData = menuItemSnap.data();
      if (itemData?.available === false) {
        throwError('failed-precondition', `"${itemData?.name || 'Dish'}" is currently sold out.`);
      }

      nameSnapshot = itemData?.name || 'Dish';
      imageSnapshot = itemData?.image || '';
      unitPriceMinor = typeof itemData?.priceMinor === 'number'
        ? itemData.priceMinor
        : Math.round((itemData?.price || 100) * 100);
      discountUnitPriceMinor = unitPriceMinor;
    } else {
      // Grocery product
      const prodRef = db.collection('catalogGroceryProducts').doc(data.productId);
      const prodSnap = await prodRef.get();
      if (!prodSnap.exists) {
        throwError('not-found', `Grocery product ${data.productId} not found.`);
      }
      const prodData = prodSnap.data();
      if (prodData?.isAvailable === false) {
        throwError('failed-precondition', `Product "${prodData?.name || 'Item'}" is currently unavailable.`);
      }

      nameSnapshot = prodData?.name || 'Product';
      imageSnapshot = prodData?.image || '';
      unitPriceMinor = typeof prodData?.priceMinor === 'number'
        ? prodData.priceMinor
        : Math.round((prodData?.price || 50) * 100);
      discountUnitPriceMinor = typeof prodData?.discountPriceMinor === 'number'
        ? prodData.discountPriceMinor
        : unitPriceMinor;
      targetMerchantName = 'Fresh Mart Groceries';
    }

    // 2. Check Single-Merchant Conflict (Food Only)
    const cartSnap = await cartRef.get();
    if (service === 'food' && cartSnap.exists) {
      const currentCart = cartSnap.data() || {};
      if (currentCart.merchantId && currentCart.merchantId !== targetMerchantId) {
        if (!data.clearExistingIfConflict) {
          throwError(
            'failed-precondition',
            'Your cart contains items from another restaurant. Please clear your cart to add items from this restaurant.'
          );
        }

        // User confirmed clear: wipe old items
        const oldItems = await cartRef.collection('items').get();
        const batch = db.batch();
        oldItems.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    // 3. Write Item Document
    await itemRef.set({
      catalogItemId: data.productId,
      name: nameSnapshot,
      image: imageSnapshot,
      unitPriceMinor,
      discountUnitPriceMinor,
      quantity: data.quantity,
      notes: data.notes || null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 4. Update Parent Document Summary
    const updatedSnap = await cartRef.collection('items').get();
    let totalQty = 0;
    let totalSubtotalMinor = 0;

    updatedSnap.docs.forEach((d) => {
      const it = d.data();
      const q = it.quantity || 1;
      const p = it.discountUnitPriceMinor ?? it.unitPriceMinor ?? 0;
      totalQty += q;
      totalSubtotalMinor += p * q;
    });

    await cartRef.set({
      userId: uid,
      service,
      merchantId: targetMerchantId,
      merchantSnapshot: {
        name: targetMerchantName,
        imagePath: targetMerchantImage,
      },
      itemCount: totalQty,
      subtotalMinor: totalSubtotalMinor,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      success: true,
      productId: data.productId,
      quantity: data.quantity,
      itemCount: totalQty,
      subtotalMinor: totalSubtotalMinor,
      subtotal: totalSubtotalMinor / 100,
    };
  }
);

// ----------------------------------------------------------------------------
// 3. REMOVE CART ITEM
// ----------------------------------------------------------------------------

const removeCartItemSchema = z.object({
  service: z.enum(['food', 'grocery', 'groceries']).default('food'),
  productId: z.string().min(1),
});

export const removeCartItem = secureCallable(
  removeCartItemSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const service = normalizeService(data.service);
    const cartId = `${uid}_${service}`;
    const cartRef = db.collection('carts').doc(cartId);

    await cartRef.collection('items').doc(data.productId).delete();

    // Recalculate parent totals
    const remainingSnap = await cartRef.collection('items').get();
    let remainingQty = 0;
    let remainingSubtotalMinor = 0;

    remainingSnap.docs.forEach((d) => {
      const it = d.data();
      const q = it.quantity || 1;
      const p = it.discountUnitPriceMinor ?? it.unitPriceMinor ?? 0;
      remainingQty += q;
      remainingSubtotalMinor += p * q;
    });

    await cartRef.set({
      userId: uid,
      service,
      itemCount: remainingQty,
      subtotalMinor: remainingSubtotalMinor,
      ...(remainingQty === 0 ? { merchantId: null, merchantSnapshot: null } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      success: true,
      productId: data.productId,
      itemCount: remainingQty,
      subtotalMinor: remainingSubtotalMinor,
      subtotal: remainingSubtotalMinor / 100,
    };
  }
);

// ----------------------------------------------------------------------------
// 4. CLEAR CART
// ----------------------------------------------------------------------------

const clearCartSchema = z.object({
  service: z.enum(['food', 'grocery', 'groceries']).default('food'),
});

export const clearCart = secureCallable(
  clearCartSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const service = normalizeService(data.service);
    const cartId = `${uid}_${service}`;
    const cartRef = db.collection('carts').doc(cartId);

    const itemsSnap = await cartRef.collection('items').get();
    if (!itemsSnap.empty) {
      const batch = db.batch();
      itemsSnap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    await cartRef.set({
      userId: uid,
      service,
      merchantId: null,
      merchantSnapshot: null,
      itemCount: 0,
      subtotalMinor: 0,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    log.info(`[clearCart] User ${uid} cleared cart ${cartId}`);
    return { success: true, cartId };
  }
);

// ----------------------------------------------------------------------------
// 5. QUOTE CHECKOUT (Server-Authoritative Price Calculation Preview)
// ----------------------------------------------------------------------------

const quoteCheckoutSchema = z.object({
  service: z.enum(['food', 'grocery', 'groceries']).default('food'),
  merchantId: z.string().optional(),
  tipMinor: z.number().int().nonnegative().optional().default(0),
  promotionCode: z.string().optional(),
  items: z.array(cartItemInputSchema).optional(),
});

export const quoteCheckout = secureCallable(
  quoteCheckoutSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const service = normalizeService(data.service);
    const cartId = `${uid}_${service}`;

    // 1. Determine items to quote (passed items or from server cart)
    let itemsToVerify: Array<{ productId: string; quantity: number; notes?: string }> = [];
    let merchantId = data.merchantId;

    if (data.items && data.items.length > 0) {
      itemsToVerify = data.items;
    } else {
      const cartRef = db.collection('carts').doc(cartId);
      const [cartSnap, itemsSnap] = await Promise.all([
        cartRef.get(),
        cartRef.collection('items').get(),
      ]);

      if (cartSnap.exists) {
        merchantId = merchantId || cartSnap.data()?.merchantId;
      }
      itemsToVerify = itemsSnap.docs.map((d) => ({
        productId: d.data().catalogItemId || d.id,
        quantity: d.data().quantity || 1,
        notes: d.data().notes,
      }));
    }

    if (itemsToVerify.length === 0) {
      throwError('invalid-argument', 'Cart is empty. Add items to quote checkout.');
    }

    // 2. Fetch Merchant Details (if food)
    let merchantName = 'Fresh Mart Groceries';
    let restaurantRef: FirebaseFirestore.DocumentReference | null = null;

    if (service === 'food') {
      if (!merchantId) {
        throwError('invalid-argument', 'merchantId (restaurantId) is required for food checkout quote.');
      }
      restaurantRef = db.collection('catalogRestaurants').doc(merchantId);
      const restSnap = await restaurantRef.get();
      if (!restSnap.exists) {
        throwError('not-found', `Restaurant ${merchantId} not found.`);
      }
      const restData = restSnap.data();
      if (restData?.active === false || restData?.isOpen === false) {
        throwError('failed-precondition', 'This restaurant is currently closed.');
      }
      merchantName = restData?.name || 'Restaurant';
    }

    // 3. Price Calculation & Verification
    let calculatedSubtotalMinor = 0;
    let calculatedDiscountMinor = 0;
    const verifiedItems: Array<{
      productId: string;
      name: string;
      image: string;
      quantity: number;
      unitPriceMinor: number;
      discountMinor: number;
      lineTotalMinor: number;
    }> = [];

    for (const item of itemsToVerify) {
      let name = 'Item';
      let image = '';
      let unitPriceMinor = 0;
      let discountUnitPriceMinor = 0;

      if (service === 'food' && restaurantRef) {
        const itemSnap = await restaurantRef.collection('menuItems').doc(item.productId).get();
        if (!itemSnap.exists) {
          throwError('not-found', `Menu item ${item.productId} not found.`);
        }
        const itemData = itemSnap.data();
        if (itemData?.available === false) {
          throwError('failed-precondition', `Dish "${itemData?.name || item.productId}" is currently sold out.`);
        }

        name = itemData?.name || 'Dish';
        image = itemData?.image || '';
        unitPriceMinor = typeof itemData?.priceMinor === 'number'
          ? itemData.priceMinor
          : Math.round((itemData?.price || 100) * 100);
        discountUnitPriceMinor = unitPriceMinor;
      } else {
        const prodSnap = await db.collection('catalogGroceryProducts').doc(item.productId).get();
        if (!prodSnap.exists) {
          throwError('not-found', `Grocery product ${item.productId} not found.`);
        }
        const prodData = prodSnap.data();
        if (prodData?.isAvailable === false) {
          throwError('failed-precondition', `Product "${prodData?.name || item.productId}" is unavailable.`);
        }

        name = prodData?.name || 'Product';
        image = prodData?.image || '';
        unitPriceMinor = typeof prodData?.priceMinor === 'number'
          ? prodData.priceMinor
          : Math.round((prodData?.price || 50) * 100);
        discountUnitPriceMinor = typeof prodData?.discountPriceMinor === 'number'
          ? prodData.discountPriceMinor
          : unitPriceMinor;
      }

      const itemSubtotal = unitPriceMinor * item.quantity;
      const itemDiscount = Math.max(0, (unitPriceMinor - discountUnitPriceMinor) * item.quantity);
      const lineTotal = itemSubtotal - itemDiscount;

      calculatedSubtotalMinor += itemSubtotal;
      calculatedDiscountMinor += itemDiscount;

      verifiedItems.push({
        productId: item.productId,
        name,
        image,
        quantity: item.quantity,
        unitPriceMinor,
        discountMinor: itemDiscount,
        lineTotalMinor: lineTotal,
      });
    }

    // 4. Calculate Final Monetary Totals
    const deliveryFeeMinor = 5000; // Flat ₹50 (5000 paise)
    const taxableSubtotal = Math.max(0, calculatedSubtotalMinor - calculatedDiscountMinor);
    const taxMinor = Math.round(taxableSubtotal * 0.05); // 5% GST
    const tipMinor = data.tipMinor || 0;
    const totalMinor = taxableSubtotal + deliveryFeeMinor + taxMinor + tipMinor;

    return {
      service,
      merchantId: merchantId || null,
      merchantName,
      items: verifiedItems,
      itemCount: verifiedItems.reduce((acc, it) => acc + it.quantity, 0),
      subtotalMinor: calculatedSubtotalMinor,
      subtotalRupees: calculatedSubtotalMinor / 100,
      discountMinor: calculatedDiscountMinor,
      discountRupees: calculatedDiscountMinor / 100,
      deliveryFeeMinor,
      deliveryFeeRupees: deliveryFeeMinor / 100,
      taxMinor,
      taxRupees: taxMinor / 100,
      tipMinor,
      tipRupees: tipMinor / 100,
      totalMinor,
      totalRupees: totalMinor / 100,
      currency: 'INR',
    };
  }
);
