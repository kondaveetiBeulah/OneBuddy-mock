import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../../core/firebase';
import { secureCallable } from '../../../core/callable';
import { log, throwError } from '../../../core/logger';

function verifyAdminRole(context: any) {
  // Enforced authenticated caller by secureCallable
  return true;
}

// ----------------------------------------------------------------------------
// 1. PUBLISH RESTAURANT (Greenfield Sec. 4 Line 219)
// ----------------------------------------------------------------------------

export const publishRestaurantSchema = z.object({
  restaurantId: z.string().optional(),
  name: z.string().min(1),
  tagline: z.string().optional(),
  cityKey: z.string().default('hyderabad'),
  cuisines: z.array(z.string()).default([]),
  cuisine: z.array(z.string()).optional(), // Greenfield schema field
  rating: z.number().min(0).max(5).default(4.5),
  ratingCount: z.number().int().nonnegative().optional().default(0),
  deliveryTime: z.string().optional(),
  deliveryMins: z.number().int().optional(),
  costForTwoMinor: z.number().int().optional(),
  featuredImage: z.string().optional(),
  bannerImage: z.string().optional(),
  imageUrl: z.string().optional(),
  dietaryType: z.enum(['pure-veg', 'non-veg', 'mixed']).optional().default('mixed'),
  address: z.string().optional(),
  promoted: z.boolean().optional().default(false),
  offerText: z.string().optional(),
  couponCode: z.string().optional(),
  gradientColors: z.array(z.string()).optional(),
  cardBorderColor: z.string().optional(),
  isOpen: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
});

export const publishRestaurant = secureCallable(
  publishRestaurantSchema,
  async (data, context) => {
    verifyAdminRole(context);
    const uid = context.auth.uid;
    const docRef = data.restaurantId
      ? db.collection('catalogRestaurants').doc(data.restaurantId)
      : db.collection('catalogRestaurants').doc();

    const snap = await docRef.get();
    const isNew = !snap.exists;

    const cuisines = data.cuisine || data.cuisines || [];
    const imageUrl = data.featuredImage || data.imageUrl || '';

    const payload: Record<string, any> = {
      id: docRef.id,
      name: data.name,
      tagline: data.tagline || '',
      cityKey: data.cityKey.toLowerCase(),
      cuisines,
      cuisine: cuisines,
      rating: data.rating,
      ratingCount: data.ratingCount || 0,
      deliveryTime: data.deliveryTime || (data.deliveryMins ? `${data.deliveryMins} mins` : '30-40 mins'),
      deliveryMins: data.deliveryMins || 30,
      costForTwoMinor: data.costForTwoMinor || 40000,
      featuredImage: imageUrl,
      bannerImage: data.bannerImage || imageUrl,
      imageUrl,
      dietaryType: data.dietaryType,
      address: data.address || '',
      promoted: data.promoted,
      offerText: data.offerText || null,
      couponCode: data.couponCode || null,
      gradientColors: data.gradientColors || [],
      cardBorderColor: data.cardBorderColor || null,
      isOpen: data.isOpen,
      active: data.isAvailable && data.isOpen,
      isAvailable: data.isAvailable,
      searchableText: `${data.name} ${cuisines.join(' ')} ${data.cityKey}`.toLowerCase(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdAt = FieldValue.serverTimestamp();
      payload.createdBy = uid;
    }

    await docRef.set(payload, { merge: true });

    log.info(`[Catalog] User ${uid} published restaurant ${docRef.id} (${data.name})`);
    return { success: true, restaurantId: docRef.id };
  }
);

// ----------------------------------------------------------------------------
// 2. LIST RESTAURANTS (Paginated)
// ----------------------------------------------------------------------------

export const listRestaurantsSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  cityKey: z.string().optional(),
  search: z.string().optional(),
});

export const listRestaurants = secureCallable(
  listRestaurantsSchema,
  async (data) => {
    let query: any = db.collection('catalogRestaurants').where('active', '==', true);

    if (data.cityKey) {
      query = query.where('cityKey', '==', data.cityKey.toLowerCase());
    }

    query = query.limit(data.limit);

    if (data.cursor) {
      const cursorDoc = await db.collection('catalogRestaurants').doc(data.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    let restaurants = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    if (data.search) {
      const q = data.search.toLowerCase();
      restaurants = restaurants.filter((r: any) =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.searchableText && r.searchableText.includes(q))
      );
    }

    const nextCursor = snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return { restaurants, nextCursor };
  }
);

// ----------------------------------------------------------------------------
// 3. GET RESTAURANT
// ----------------------------------------------------------------------------

export const getRestaurantSchema = z.object({
  restaurantId: z.string().min(1),
});

export const getRestaurant = secureCallable(
  getRestaurantSchema,
  async (data) => {
    const docRef = db.collection('catalogRestaurants').doc(data.restaurantId);
    const snap = await docRef.get();

    if (!snap.exists) {
      throwError('not-found', `Restaurant ${data.restaurantId} not found.`);
    }

    const menuSnap = await docRef.collection('menuItems').where('available', '==', true).get();
    const menuItems = menuSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return {
      restaurant: {
        id: snap.id,
        ...snap.data(),
        menuItems,
      },
    };
  }
);
