import { z } from 'zod';
import { db } from '../../common/firebase';
import { secureCallable } from '../../common/auth';
import { log } from '../../common/logging';
import { throwError } from '../../common/errors';
import { CartsRepository } from '../../repositories';

// ----------------------------------------------------------------------------
// TYPES & SCHEMAS (Greenfield Sec. 4 Lines 238-240)
// ----------------------------------------------------------------------------

export type CartServiceType = 'food' | 'grocery';

export function normalizeService(raw: string): CartServiceType {
  const norm = raw.toLowerCase().trim();
  return (norm === 'food') ? 'food' : 'grocery';
}

export const cartItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

// ----------------------------------------------------------------------------
// 1. GET CART (Reads carts/{uid}_{service} with items subcollection)
// ----------------------------------------------------------------------------

export const getCartSchema = z.object({
  service: z.enum(['food', 'grocery', 'groceries']).default('food'),
});

export const getCart = secureCallable(
  getCartSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const service = normalizeService(data.service);
    const cartId = `${uid}_${service}`;

    const { cartDoc, itemDocs } = await CartsRepository.getCartWithItems(cartId);

    const cartData = cartDoc.exists ? cartDoc.data() || {} : {};
    let subtotalMinor = 0;
    let itemCount = 0;

    const items = itemDocs.map((docSnap) => {
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

export const setCartItemSchema = z.object({
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

    log.info(`[setCartItem] User ${uid} updating item ${data.productId} (qty: ${data.quantity}) in ${cartId}`);

    // If removing item (quantity == 0)
    if (data.quantity <= 0) {
      await CartsRepository.deleteCartItem(cartId, data.productId);
      const { itemDocs: remainingDocs } = await CartsRepository.getCartWithItems(cartId);
      let remainingQty = 0;
      let remainingSubtotalMinor = 0;

      remainingDocs.forEach((d) => {
        const item = d.data();
        const qty = item.quantity || 1;
        const price = item.discountUnitPriceMinor ?? item.unitPriceMinor ?? 0;
        remainingQty += qty;
        remainingSubtotalMinor += price * qty;
      });

      await CartsRepository.saveCartMeta(cartId, {
        userId: uid,
        service,
        itemCount: remainingQty,
        ...(remainingQty === 0 ? { merchantId: null, merchantSnapshot: null } : {}),
      });

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
    const { cartDoc: currentCartSnap } = await CartsRepository.getCartWithItems(cartId);
    if (service === 'food' && currentCartSnap.exists) {
      const currentCart = currentCartSnap.data() || {};
      if (currentCart.merchantId && currentCart.merchantId !== targetMerchantId) {
        if (!data.clearExistingIfConflict) {
          throwError(
            'failed-precondition',
            'Your cart contains items from another restaurant. Please clear your cart to add items from this restaurant.'
          );
        }

        // User confirmed clear: wipe old items
        await CartsRepository.clearCart(cartId, uid, service);
      }
    }

    // 3. Write Item Document via CartsRepository
    await CartsRepository.saveCartItem(cartId, data.productId, {
      catalogItemId: data.productId,
      name: nameSnapshot,
      image: imageSnapshot,
      unitPriceMinor,
      discountUnitPriceMinor,
      quantity: data.quantity,
      notes: data.notes || null,
    });

    // 4. Update Parent Document Summary
    const { itemDocs: updatedDocs } = await CartsRepository.getCartWithItems(cartId);
    let totalQty = 0;
    let totalSubtotalMinor = 0;

    updatedDocs.forEach((d) => {
      const it = d.data();
      const q = it.quantity || 1;
      const p = it.discountUnitPriceMinor ?? it.unitPriceMinor ?? 0;
      totalQty += q;
      totalSubtotalMinor += p * q;
    });

    await CartsRepository.saveCartMeta(cartId, {
      userId: uid,
      service,
      merchantId: targetMerchantId,
      merchantSnapshot: {
        name: targetMerchantName,
        image: targetMerchantImage,
      },
      itemCount: totalQty,
    });

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

export const removeCartItemSchema = z.object({
  service: z.enum(['food', 'grocery', 'groceries']).default('food'),
  productId: z.string().min(1),
});

export const removeCartItem = secureCallable(
  removeCartItemSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const service = normalizeService(data.service);
    const cartId = `${uid}_${service}`;

    await CartsRepository.deleteCartItem(cartId, data.productId);

    // Recalculate parent totals
    const { itemDocs: remainingDocs } = await CartsRepository.getCartWithItems(cartId);
    let remainingQty = 0;
    let remainingSubtotalMinor = 0;

    remainingDocs.forEach((d) => {
      const it = d.data();
      const q = it.quantity || 1;
      const p = it.discountUnitPriceMinor ?? it.unitPriceMinor ?? 0;
      remainingQty += q;
      remainingSubtotalMinor += p * q;
    });

    await CartsRepository.saveCartMeta(cartId, {
      userId: uid,
      service,
      itemCount: remainingQty,
      ...(remainingQty === 0 ? { merchantId: null, merchantSnapshot: null } : {}),
    });

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

export const clearCartSchema = z.object({
  service: z.enum(['food', 'grocery', 'groceries']).default('food'),
});

export const clearCart = secureCallable(
  clearCartSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const service = normalizeService(data.service);
    const cartId = `${uid}_${service}`;

    await CartsRepository.clearCart(cartId, uid, service);

    log.info(`[clearCart] User ${uid} cleared cart ${cartId}`);
    return { success: true, cartId };
  }
);
