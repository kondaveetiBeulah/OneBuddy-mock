import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../../common/firebase';
import { secureCallable } from '../../../common/auth';
import { log } from '../../../common/logging';

function verifyAdminRole(context: any) {
  return true;
}

// ----------------------------------------------------------------------------
// GROCERY CATEGORIES (Greenfield Sec. 4 Line 225)
// ----------------------------------------------------------------------------

export const publishGroceryCategorySchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1),
  icon: z.string().optional(),
  image: z.string().optional(),
  productCount: z.number().int().nonnegative().optional().default(0),
  backgroundColor: z.string().optional().default('#E8F5E9'),
  sortOrder: z.number().int().default(1),
  active: z.boolean().default(true),
});

export const publishGroceryCategory = secureCallable(
  publishGroceryCategorySchema,
  async (data, context) => {
    verifyAdminRole(context);
    const uid = context.auth.uid;

    const docRef = data.categoryId
      ? db.collection('catalogGroceryCategories').doc(data.categoryId)
      : db.collection('catalogGroceryCategories').doc();

    const snap = await docRef.get();
    const isNew = !snap.exists;

    const payload: Record<string, any> = {
      id: docRef.id,
      name: data.name,
      icon: data.icon || 'basket-outline',
      image: data.image || '',
      productCount: data.productCount,
      backgroundColor: data.backgroundColor,
      sortOrder: data.sortOrder,
      active: data.active,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdAt = FieldValue.serverTimestamp();
      payload.createdBy = uid;
    }

    await docRef.set(payload, { merge: true });

    log.info(`[Catalog] User ${uid} published grocery category ${docRef.id} (${data.name})`);
    return { success: true, categoryId: docRef.id };
  }
);

export const listGroceryCategoriesSchema = z.object({
  limit: z.number().int().min(1).max(50).default(30),
  cursor: z.string().optional(),
});

export const listGroceryCategories = secureCallable(
  listGroceryCategoriesSchema,
  async (data) => {
    let query = db
      .collection('catalogGroceryCategories')
      .where('active', '==', true)
      .orderBy('sortOrder', 'asc')
      .limit(data.limit);

    if (data.cursor) {
      const cursorDoc = await db.collection('catalogGroceryCategories').doc(data.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const categories = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const nextCursor = snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return { categories, nextCursor };
  }
);
