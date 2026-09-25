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
import { Offer } from '../../categories/groceries/types/offer.types';

/* ─────────────── Defensive Mapper ─────────────── */

export function mapOffer(docId: string, data: any): Offer {
  return {
    id: data.id || docId,
    title: data.title || '',
    subtitle: data.subtitle || '',
    discountTag: data.discountTag || '',
    code: data.code,
    image: data.image || '',
    backgroundColor: data.backgroundColor || '#1B5E20',
    categoryId: data.categoryId,
  };
}

/* ─────────────── One-Time Fetchers (Read-Only) ─────────────── */

export async function fetchOffers(): Promise<Offer[]> {
  if (!db) {
    console.warn('[GroceryBackend] db is not initialized.');
    return [];
  }
  try {
    const q = query(
      collection(db, 'catalogGroceryOffers'),
      where('active', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapOffer(d.id, d.data()));
  } catch (err) {
    console.error('[GroceryBackend] Error fetching offers:', err);
    return [];
  }
}

export async function fetchOfferById(offerId: string): Promise<Offer | null> {
  if (!db) return null;
  try {
    const ref = doc(db, 'catalogGroceryOffers', offerId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return mapOffer(snap.id, snap.data());
    }
  } catch (err) {
    console.error(`[GroceryBackend] Error fetching offer ${offerId}:`, err);
  }
  return null;
}

/* ─────────────── Real-Time Subscriptions (Read-Only) ─────────────── */

export function subscribeOffers(
  onData: (offers: Offer[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, 'catalogGroceryOffers'),
    where('active', '==', true)
  );
  return onSnapshot(
    q,
    (snap) => {
      const offers = snap.docs.map((d) => mapOffer(d.id, d.data()));
      onData(offers);
    },
    (err) => {
      console.error('[GroceryBackend] Offers subscription error:', err);
      onError?.(err);
    }
  );
}
