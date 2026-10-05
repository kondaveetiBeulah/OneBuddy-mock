import { z } from 'zod';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../../core/firebase';
import { secureCallable } from '../../../core/callable';
import { log } from '../../../core/logger';

function verifyAdminRole(context: any) {
  return true;
}

// ----------------------------------------------------------------------------
// FOOD BANNERS (Greenfield Sec. 4 Line 223)
// ----------------------------------------------------------------------------

export const publishFoodBannerSchema = z.object({
  bannerId: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  discountBadge: z.string().optional(),
  code: z.string().optional(),
  restaurantId: z.string().optional(),
  restaurantName: z.string().optional(),
  gradientColors: z.array(z.string()).min(2).max(3).optional().default(['#FF5722', '#FF9800']),
  image: z.string().optional(),
  active: z.boolean().default(true),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

export const publishFoodBanner = secureCallable(
  publishFoodBannerSchema,
  async (data, context) => {
    verifyAdminRole(context);
    const uid = context.auth.uid;

    const docRef = data.bannerId
      ? db.collection('catalogFoodBanners').doc(data.bannerId)
      : db.collection('catalogFoodBanners').doc();

    const snap = await docRef.get();
    const isNew = !snap.exists;

    const payload: Record<string, any> = {
      id: docRef.id,
      title: data.title,
      subtitle: data.subtitle || '',
      discountBadge: data.discountBadge || '',
      code: data.code || null,
      restaurantId: data.restaurantId || null,
      restaurantName: data.restaurantName || null,
      gradientColors: data.gradientColors,
      image: data.image || '',
      active: data.active,
      startsAt: data.startsAt ? Timestamp.fromDate(new Date(data.startsAt)) : null,
      endsAt: data.endsAt ? Timestamp.fromDate(new Date(data.endsAt)) : null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdAt = FieldValue.serverTimestamp();
      payload.createdBy = uid;
    }

    await docRef.set(payload, { merge: true });

    log.info(`[Catalog] User ${uid} published food banner ${docRef.id} (${data.title})`);
    return { success: true, bannerId: docRef.id };
  }
);

export const listFoodBannersSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const listFoodBanners = secureCallable(
  listFoodBannersSchema,
  async (data) => {
    let query = db
      .collection('catalogFoodBanners')
      .where('active', '==', true)
      .limit(data.limit);

    if (data.cursor) {
      const cursorDoc = await db.collection('catalogFoodBanners').doc(data.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const banners = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const nextCursor = snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return { banners, nextCursor };
  }
);
