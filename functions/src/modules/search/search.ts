import { z } from 'zod';
import { db } from '../../core/firebase';
import { secureCallable } from '../../core/callable';
import { log } from '../../core/logger';

// ----------------------------------------------------------------------------
// SEARCH CATALOG (Greenfield Sec. 1 Line 50 & Sec. 4 Lines 230-232)
// Unified search driver leveraging catalogSearchProjections read model buffer
// with transparent fallback to canonical collections.
// ----------------------------------------------------------------------------

export interface CatalogSearchHit {
  id: string;
  type: 'restaurant' | 'grocery' | 'menuItem';
  title: string;
  subtitle?: string;
  priceMinor?: number;
  imageUrl?: string;
  entityId: string;
  merchantId?: string;
}

export const searchCatalogSchema = z.object({
  query: z.string().min(1),
  domain: z.enum(['all', 'restaurants', 'grocery', 'menuItems']).default('all'),
  cityKey: z.string().default('hyderabad'),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

/**
 * Driver 1: Query catalogSearchProjections read model buffer
 */
async function searchFromProjections(
  searchTerm: string,
  domain: 'all' | 'restaurants' | 'grocery' | 'menuItems',
  cityKey: string,
  limitCount: number
): Promise<CatalogSearchHit[]> {
  try {
    let qRef: FirebaseFirestore.Query = db
      .collection('catalogSearchProjections')
      .where('isAvailable', '==', true);

    if (domain === 'restaurants') {
      qRef = qRef.where('entityType', '==', 'restaurant');
    } else if (domain === 'grocery') {
      qRef = qRef.where('entityType', '==', 'grocery');
    } else if (domain === 'menuItems') {
      qRef = qRef.where('entityType', '==', 'menuItem');
    }

    const snap = await qRef.limit(100).get();
    if (snap.empty) return [];

    const hits: CatalogSearchHit[] = [];
    const lowerQuery = searchTerm.toLowerCase();

    snap.docs.forEach((doc) => {
      const d = doc.data();
      const searchable = (d.searchableText || `${d.title} ${d.subtitle}`).toLowerCase();
      if (searchable.includes(lowerQuery)) {
        hits.push({
          id: doc.id,
          type: d.entityType as 'restaurant' | 'grocery' | 'menuItem',
          title: d.title || 'Item',
          subtitle: d.subtitle || undefined,
          priceMinor: d.priceMinor,
          imageUrl: d.imageUrl,
          entityId: d.entityId,
          merchantId: d.merchantId,
        });
      }
    });

    return hits.slice(0, limitCount);
  } catch (err) {
    log.warn('[searchCatalog] Projections buffer query note:', err);
    return [];
  }
}

/**
 * Driver 2: Canonical Firestore collections fallback
 */
async function searchFromCanonicalCollections(
  searchTerm: string,
  domain: 'all' | 'restaurants' | 'grocery' | 'menuItems',
  cityKey: string,
  limitCount: number
): Promise<CatalogSearchHit[]> {
  const q = searchTerm.trim().toLowerCase();
  const hits: CatalogSearchHit[] = [];

  // 1. Search Restaurants
  if (domain === 'all' || domain === 'restaurants') {
    const restSnap = await db
      .collection('catalogRestaurants')
      .where('active', '==', true)
      .limit(limitCount)
      .get();

    restSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      const text = `${data.name || ''} ${data.searchableText || ''} ${(data.cuisines || []).join(' ')}`.toLowerCase();
      if (text.includes(q)) {
        hits.push({
          id: `restaurant_${doc.id}`,
          type: 'restaurant',
          title: data.name || 'Restaurant',
          subtitle: (data.cuisines || []).join(', '),
          imageUrl: data.imageUrl || data.featuredImage,
          entityId: doc.id,
          merchantId: doc.id,
        });
      }
    });
  }

  // 2. Search Grocery Products
  if (domain === 'all' || domain === 'grocery') {
    const prodSnap = await db
      .collection('catalogGroceryProducts')
      .where('isAvailable', '==', true)
      .limit(limitCount)
      .get();

    prodSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      const text = `${data.name || ''} ${data.searchableText || ''} ${data.category || ''}`.toLowerCase();
      if (text.includes(q)) {
        hits.push({
          id: `grocery_${doc.id}`,
          type: 'grocery',
          title: data.name || 'Product',
          subtitle: data.unit ? `${data.unit} • ${data.category || ''}` : data.category,
          priceMinor: data.priceMinor || (data.price ? Math.round(data.price * 100) : undefined),
          imageUrl: data.imageUrl || data.image,
          entityId: doc.id,
        });
      }
    });
  }

  // 3. Search Menu Items (Collection Group query)
  if (domain === 'all' || domain === 'menuItems') {
    try {
      const menuSnap = await db
        .collectionGroup('menuItems')
        .where('available', '==', true)
        .limit(limitCount)
        .get();

      menuSnap.docs.forEach((doc: any) => {
        const data = doc.data();
        const text = `${data.name || ''} ${data.category || ''} ${data.description || ''}`.toLowerCase();
        if (text.includes(q)) {
          const parentRestId = doc.ref.parent.parent?.id || data.restaurantId || '';
          hits.push({
            id: `menu_${doc.id}`,
            type: 'menuItem',
            title: data.name || 'Item',
            subtitle: data.category || 'Menu Item',
            priceMinor: data.priceMinor || (data.price ? Math.round(data.price * 100) : undefined),
            imageUrl: data.imageUrl || data.image,
            entityId: doc.id,
            merchantId: parentRestId,
          });
        }
      });
    } catch (cgErr) {
      log.warn('[CatalogSearch] Collection group query note:', cgErr);
    }
  }

  return hits.slice(0, limitCount);
}

export const searchCatalog = secureCallable(
  searchCatalogSchema,
  async (data) => {
    // Attempt fast read from catalogSearchProjections buffer first
    let hits = await searchFromProjections(
      data.query,
      data.domain,
      data.cityKey,
      data.limit
    );

    // Fall back to canonical collections if projection buffer has not synced yet
    if (hits.length === 0) {
      hits = await searchFromCanonicalCollections(
        data.query,
        data.domain,
        data.cityKey,
        data.limit
      );
    }

    return {
      hits,
      totalHits: hits.length,
      nextCursor: null, // Ready for external Algolia/Typesense cursor token
    };
  }
);
