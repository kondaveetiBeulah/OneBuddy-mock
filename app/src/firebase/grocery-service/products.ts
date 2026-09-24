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
  const price = typeof data.price === 'number' ? data.price : 0;
  const discountPrice =
    typeof data.discountPrice === 'number' ? data.discountPrice : price;

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
    unit: data.unit || '',
    rating: typeof data.rating === 'number' ? data.rating : 4.5,
    reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
    stock: typeof data.stock === 'number' ? data.stock : 10,
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
    const snap = await getDocs(collection(db, 'products'));
    return snap.docs.map((d) => mapProduct(d.id, d.data()));
  } catch (err) {
    console.error('[GroceryBackend] Error fetching products:', err);
    return [];
  }
}

export async function fetchProductById(productId: string): Promise<Product | null> {
  if (!db) return null;
  try {
    const ref = doc(db, 'products', productId);
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
    const q = query(collection(db, 'products'), where('isFeatured', '==', true));
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
  return onSnapshot(
    collection(db, 'products'),
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
