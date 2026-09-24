import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
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

/* ─────────────── One-Time Fetchers (Read-Only) ─────────────── */

export async function fetchCategories(): Promise<Category[]> {
  if (!db) {
    console.warn('[GroceryBackend] db is not initialized.');
    return [];
  }
  try {
    const snap = await getDocs(collection(db, 'categories'));
    return snap.docs.map((d) => mapCategory(d.id, d.data()));
  } catch (err) {
    console.error('[GroceryBackend] Error fetching categories:', err);
    return [];
  }
}

export async function fetchCategoryById(categoryId: string): Promise<Category | null> {
  if (!db) return null;
  try {
    const ref = doc(db, 'categories', categoryId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
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
  return onSnapshot(
    collection(db, 'categories'),
    (snap) => {
      const categories = snap.docs.map((d) => mapCategory(d.id, d.data()));
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
