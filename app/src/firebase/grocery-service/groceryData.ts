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
import { Category } from '../../categories/groceries/types/category.types';

/* ─────────────── Defensive Mappers ─────────────── */

export function mapCategory(docId: string, data: any): Category {
  return {
    id: data.id || docId,
    name: data.name || '',
    icon: data.icon || 'basket-outline',
    image: data.image || '',
    productCount: typeof data.productCount === 'number' ? data.productCount : 0,
    backgroundColor: data.backgroundColor || '#FEF6E4',
  };
}

export function isDummyCategory(docId: string, data: any): boolean {
  if (data?.isDummy === true || data?.isMock === true) return true;
  const lowerId = docId.toLowerCase();
  if (lowerId.startsWith('cat_') || lowerId.startsWith('sample_') || lowerId.startsWith('mock_')) return true;
  return false;
}

/* ─────────────── One-Time Fetchers (Read-Only) ─────────────── */

export async function fetchCategories(): Promise<Category[]> {
  if (!db) {
    console.warn('[GroceryBackend] db is not initialized.');
    return [];
  }
  try {
    const q = query(
      collection(db, 'catalogGroceryCategories'),
      where('active', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs
      .filter((d) => !isDummyCategory(d.id, d.data()))
      .map((d) => mapCategory(d.id, d.data()));
  } catch (err) {
    console.error('[GroceryBackend] Error fetching categories:', err);
    return [];
  }
}

export async function fetchCategoryById(categoryId: string): Promise<Category | null> {
  if (!db) return null;
  try {
    const ref = doc(db, 'catalogGroceryCategories', categoryId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      if (isDummyCategory(snap.id, snap.data())) {
        return null;
      }
      return mapCategory(snap.id, snap.data());
    }
  } catch (err) {
    console.error(`[GroceryBackend] Error fetching category ${categoryId}:`, err);
  }
  return null;
}

/* ─────────────── Real-Time Subscriptions (Read-Only) ─────────────── */

export function subscribeCategories(
  onData: (categories: Category[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, 'catalogGroceryCategories'),
    where('active', '==', true)
  );
  return onSnapshot(
    q,
    (snap) => {
      const categories = snap.docs
        .filter((d) => !isDummyCategory(d.id, d.data()))
        .map((d) => mapCategory(d.id, d.data()));
      onData(categories);
    },
    (err) => {
      console.error('[GroceryBackend] Categories subscription error:', err);
      onError?.(err);
    }
  );
}

/* ─────────────── Re-export Products, Offers, Orders ─────────────── */
export * from './products';
export * from './offers';
export * from './orders';
