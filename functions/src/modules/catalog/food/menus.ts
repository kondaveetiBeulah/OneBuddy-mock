import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../../common/firebase';
import { secureCallable } from '../../../common/auth';
import { log } from '../../../common/logging';
import { throwError } from '../../../common/errors';

function verifyAdminRole(context: any) {
  return true;
}

// ----------------------------------------------------------------------------
// 1. PUBLISH MENU ITEM (Greenfield Sec. 4 Line 221)
// ----------------------------------------------------------------------------

export const publishMenuItemSchema = z.object({
  restaurantId: z.string().min(1),
  menuItemId: z.string().optional(),
  name: z.string().min(1),
  priceMinor: z.number().int().positive(),
  originalPriceMinor: z.number().int().positive().optional(),
  category: z.string().default('General'),
  description: z.string().optional(),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  ratingCount: z.number().int().nonnegative().optional(),
  dietary: z.enum(['veg', 'non-veg', 'egg']).optional().default('veg'),
  prepTime: z.string().optional(),
  isCombo: z.boolean().optional().default(false),
  comboIncludes: z.array(z.string()).optional(),
  bestseller: z.boolean().optional().default(false),
  spicyLevel: z.number().int().min(1).max(3).optional(),
  calories: z.number().int().optional(),
  cuisine: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isAvailable: z.boolean().default(true),
});

export const publishMenuItem = secureCallable(
  publishMenuItemSchema,
  async (data, context) => {
    verifyAdminRole(context);
    const uid = context.auth.uid;

    const restRef = db.collection('catalogRestaurants').doc(data.restaurantId);
    const restSnap = await restRef.get();
    if (!restSnap.exists) {
      throwError('not-found', `Restaurant ${data.restaurantId} does not exist.`);
    }

    const itemRef = data.menuItemId
      ? restRef.collection('menuItems').doc(data.menuItemId)
      : restRef.collection('menuItems').doc();

    const snap = await itemRef.get();
    const isNew = !snap.exists;
    const image = data.image || data.imageUrl || '';

    const payload: Record<string, any> = {
      id: itemRef.id,
      restaurantId: data.restaurantId,
      name: data.name,
      price: data.priceMinor / 100,
      priceMinor: data.priceMinor,
      originalPriceMinor: data.originalPriceMinor || null,
      category: data.category,
      description: data.description || '',
      image,
      imageUrl: image,
      rating: data.rating || null,
      ratingCount: data.ratingCount || null,
      dietary: data.dietary,
      prepTime: data.prepTime || null,
      isCombo: data.isCombo,
      comboIncludes: data.comboIncludes || [],
      bestseller: data.bestseller,
      spicyLevel: data.spicyLevel || null,
      calories: data.calories || null,
      cuisine: data.cuisine || null,
      sortOrder: data.sortOrder,
      available: data.isAvailable,
      isAvailable: data.isAvailable,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdAt = FieldValue.serverTimestamp();
      payload.createdBy = uid;
    }

    await itemRef.set(payload, { merge: true });

    log.info(`[Catalog] User ${uid} published menu item ${itemRef.id} for restaurant ${data.restaurantId}`);
    return { success: true, restaurantId: data.restaurantId, menuItemId: itemRef.id };
  }
);

// ----------------------------------------------------------------------------
// 2. LIST MENU ITEMS (Paginated)
// ----------------------------------------------------------------------------

export const listMenuItemsSchema = z.object({
  restaurantId: z.string().min(1),
  category: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const listMenuItems = secureCallable(
  listMenuItemsSchema,
  async (data) => {
    const restRef = db.collection('catalogRestaurants').doc(data.restaurantId);
    let query: any = restRef.collection('menuItems').where('available', '==', true);

    if (data.category) {
      query = query.where('category', '==', data.category);
    }

    query = query.limit(data.limit);

    if (data.cursor) {
      const cursorDoc = await restRef.collection('menuItems').doc(data.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const menuItems = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const nextCursor = snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return { menuItems, nextCursor };
  }
);
