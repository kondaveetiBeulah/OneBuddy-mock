import { httpsCallable } from 'firebase/functions';
import { functions } from '../config';

export interface ServerCartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  quantity: number;
  unitPriceMinor: number;
  discountUnitPriceMinor: number;
  price: number;
  discountPrice: number;
  lineTotalMinor: number;
  notes?: string | null;
}

export interface ServerCart {
  cartId: string;
  service: 'food' | 'grocery';
  merchantId: string | null;
  merchantSnapshot: { name: string; imagePath?: string } | null;
  items: ServerCartItem[];
  itemCount: number;
  subtotalMinor: number;
  subtotal: number;
}

export interface CheckoutQuote {
  service: string;
  merchantId: string | null;
  merchantName: string;
  items: Array<{
    productId: string;
    name: string;
    image: string;
    quantity: number;
    unitPriceMinor: number;
    discountMinor: number;
    lineTotalMinor: number;
  }>;
  itemCount: number;
  subtotalMinor: number;
  subtotalRupees: number;
  discountMinor: number;
  discountRupees: number;
  deliveryFeeMinor: number;
  deliveryFeeRupees: number;
  taxMinor: number;
  taxRupees: number;
  tipMinor: number;
  tipRupees: number;
  totalMinor: number;
  totalRupees: number;
  currency: string;
}

/**
 * Reads the user's active cart from Cloud Firestore via Cloud Functions.
 */
export async function fetchServerCart(service: 'food' | 'grocery' = 'food'): Promise<ServerCart> {
  const call = httpsCallable<{ service: string }, ServerCart>(functions, 'getCart');
  const res = await call({ service });
  return res.data;
}

/**
 * Sets an item's quantity in the server cart (or removes it if quantity <= 0).
 */
export async function syncServerCartItem(params: {
  service?: 'food' | 'grocery';
  merchantId?: string;
  merchantName?: string;
  merchantImage?: string;
  productId: string;
  quantity: number;
  notes?: string;
  clearExistingIfConflict?: boolean;
}): Promise<{
  success: boolean;
  productId: string;
  itemCount: number;
  subtotalMinor: number;
  subtotal: number;
}> {
  const call = httpsCallable<typeof params, any>(functions, 'setCartItem');
  const res = await call({
    service: 'food',
    ...params,
  });
  return res.data;
}

/**
 * Removes a specific item from the server cart.
 */
export async function removeServerCartItem(
  productId: string,
  service: 'food' | 'grocery' = 'food'
): Promise<{ success: boolean; productId: string; itemCount: number; subtotal: number }> {
  const call = httpsCallable<{ service: string; productId: string }, any>(functions, 'removeCartItem');
  const res = await call({ service, productId });
  return res.data;
}

/**
 * Empties all items from the server cart.
 */
export async function clearServerCart(
  service: 'food' | 'grocery' = 'food'
): Promise<{ success: boolean }> {
  const call = httpsCallable<{ service: string }, any>(functions, 'clearCart');
  const res = await call({ service });
  return res.data;
}

/**
 * Gets a server-authoritative checkout quote with all taxes, fees, and discounts.
 */
export async function getCheckoutQuote(params: {
  service?: 'food' | 'grocery';
  merchantId?: string;
  tipMinor?: number;
  promotionCode?: string;
  items?: Array<{ productId: string; quantity: number; notes?: string }>;
}): Promise<CheckoutQuote> {
  const call = httpsCallable<typeof params, CheckoutQuote>(functions, 'quoteCheckout');
  const res = await call({
    service: 'food',
    ...params,
  });
  return res.data;
}
