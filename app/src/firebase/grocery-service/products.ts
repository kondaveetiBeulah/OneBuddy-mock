import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config';
import { Product } from '../../categories/groceries/types/product.types';

/* ─────────────── Defensive Mapper ─────────────── */

export function mapProduct(docId: string, data: any): Product {
  // Convert minor units (paise) back to rupees if present, else fallback
  const price = typeof data.priceMinor === 'number'
    ? data.priceMinor / 100
    : (typeof data.price === 'number' ? data.price : 0);

  const discountPrice = typeof data.discountPriceMinor === 'number'
    ? data.discountPriceMinor / 100
    : (typeof data.discountPrice === 'number' ? data.discountPrice : price);

  const stock = typeof data.stockQuantity === 'number'
    ? data.stockQuantity
    : (typeof data.stock === 'number' ? data.stock : 10);

  return {
    id: data.id || docId,
    name: data.name || '',
    brand: data.brand || '',
    categoryId: data.categoryId || '',
    categoryName: data.categoryName || '',
    description: data.description || '',
    image: data.image || '',
    price,
    discountPrice,
    discountPercentage:
      typeof data.discountPercentage === 'number'
        ? data.discountPercentage
        : price > discountPrice && price > 0
        ? Math.round(((price - discountPrice) / price) * 100)
        : 0,
    unit: data.unit || '1 unit',
    rating: typeof data.rating === 'number' ? data.rating : 4.5,
    reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
    stock,
    isFeatured: Boolean(data.isFeatured),
    isAvailable: data.isAvailable !== false,
  };
}

/* ─────────────── One-Time Fetchers (Read-Only) ─────────────── */

export async function fetchProducts(): Promise<Product[]> {
  if (!db) {
    console.warn('[GroceryBackend] db is not initialized.');
    return [];
  }
  try {
    const q = query(
      collection(db, 'catalogGroceryProducts'),
      where('isAvailable', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapProduct(d.id, d.data()));
  } catch (err) {
    console.error('[GroceryBackend] Error fetching products:', err);
    return [];
  }
}

export async function fetchProductById(productId: string): Promise<Product | null> {
  if (!db) return null;
  try {
    const ref = doc(db, 'catalogGroceryProducts', productId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return mapProduct(snap.id, snap.data());
    }
  } catch (err) {
    console.error(`[GroceryBackend] Error fetching product ${productId}:`, err);
  }
  return null;
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'catalogGroceryProducts'),
      where('isAvailable', '==', true),
      where('isFeatured', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapProduct(d.id, d.data()));
  } catch (err) {
    console.error('[GroceryBackend] Error fetching featured products:', err);
    return [];
  }
}

/* ─────────────── Real-Time Subscriptions (Read-Only) ─────────────── */

export function subscribeProducts(
  onData: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, 'catalogGroceryProducts'),
    where('isAvailable', '==', true)
  );
  return onSnapshot(
    q,
    (snap) => {
      const products = snap.docs.map((d) => mapProduct(d.id, d.data()));
      onData(products);
    },
    (err) => {
      console.error('[GroceryBackend] Products subscription error:', err);
      onError?.(err);
    }
  );
}
