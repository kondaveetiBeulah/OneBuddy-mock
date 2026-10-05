import { z } from 'zod';
import { db } from '../../core/firebase';
import { secureCallable } from '../../core/callable';
import { throwError } from '../../core/logger';
import { normalizeService, cartItemInputSchema } from './items';

// ----------------------------------------------------------------------------
// QUOTE CHECKOUT (Greenfield Sec. 1 Line 90 & Sec. 4 Lines 245-248)
// Server-Authoritative Price Calculation Preview
// ----------------------------------------------------------------------------

export const quoteCheckoutSchema = z.object({
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
