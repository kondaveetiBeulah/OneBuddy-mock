import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../../core/firebase';
import { secureCallable } from '../../../core/callable';
import { log } from '../../../core/logger';

function verifyAdminRole(context: any) {
  return true;
}

// ----------------------------------------------------------------------------
// GROCERY PRODUCTS (Greenfield Sec. 4 Line 226)
// ----------------------------------------------------------------------------

export const publishGroceryProductSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  brand: z.string().optional(),
  priceMinor: z.number().int().positive(),
  discountPriceMinor: z.number().int().positive().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  categoryId: z.string().min(1),
  category: z.string().optional(),
  categoryName: z.string().optional(),
  unit: z.string().default('1 unit'),
  description: z.string().optional(),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  stockQuantity: z.number().int().nonnegative().optional().default(100),
  isFeatured: z.boolean().optional().default(false),
  isAvailable: z.boolean().default(true),
});

export const publishGroceryProduct = secureCallable(
  publishGroceryProductSchema,
  async (data, context) => {
    verifyAdminRole(context);
    const uid = context.auth.uid;

    const prodRef = data.productId
      ? db.collection('catalogGroceryProducts').doc(data.productId)
      : db.collection('catalogGroceryProducts').doc();

    const snap = await prodRef.get();
    const isNew = !snap.exists;
    const categoryName = data.categoryName || data.category || data.categoryId;
    const image = data.image || data.imageUrl || '';
    const discountPriceMinor = data.discountPriceMinor || data.priceMinor;
    const discountPercentage = data.discountPercentage ??
      (data.discountPriceMinor && data.discountPriceMinor < data.priceMinor
        ? Math.round(((data.priceMinor - data.discountPriceMinor) / data.priceMinor) * 100)
        : 0);

    const payload: Record<string, any> = {
      id: prodRef.id,
      name: data.name,
      brand: data.brand || '',
      price: data.priceMinor / 100,
      priceMinor: data.priceMinor,
      discountPriceMinor,
      discountPrice: discountPriceMinor / 100,
      discountPercentage,
      categoryId: data.categoryId,
      category: categoryName,
      categoryName,
      unit: data.unit,
      description: data.description || '',
      image,
      imageUrl: image,
      rating: data.rating || null,
      reviewCount: data.reviewCount || 0,
      stockQuantity: data.stockQuantity,
      isFeatured: data.isFeatured,
      isAvailable: data.isAvailable,
      active: data.isAvailable,
      searchableText: `${data.name} ${data.brand || ''} ${categoryName} ${data.unit}`.toLowerCase(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdAt = FieldValue.serverTimestamp();
      payload.createdBy = uid;
    }

    await prodRef.set(payload, { merge: true });

    log.info(`[Catalog] User ${uid} published grocery product ${prodRef.id} (${data.name})`);
    return { success: true, productId: prodRef.id };
  }
);

export const listGroceryProductsSchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const listGroceryProducts = secureCallable(
  listGroceryProductsSchema,
  async (data) => {
    let query: any = db.collection('catalogGroceryProducts').where('isAvailable', '==', true);

    if (data.categoryId) {
      query = query.where('categoryId', '==', data.categoryId);
    }

    query = query.limit(data.limit);

    if (data.cursor) {
      const cursorDoc = await db.collection('catalogGroceryProducts').doc(data.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    let products = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    if (data.search) {
      const q = data.search.toLowerCase();
      products = products.filter((p: any) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.searchableText && p.searchableText.includes(q))
      );
    }

    const nextCursor = snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return { products, nextCursor };
  }
);
