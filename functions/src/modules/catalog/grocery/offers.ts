import { z } from 'zod';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../../common/firebase';
import { secureCallable } from '../../../common/auth';
import { log } from '../../../common/logging';

function verifyAdminRole(context: any) {
  return true;
}

// ----------------------------------------------------------------------------
// GROCERY OFFERS & COUPONS (Greenfield Sec. 4 Line 228)
// ----------------------------------------------------------------------------

export const publishOfferSchema = z.object({
  offerId: z.string().optional(),
  code: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  discountTag: z.string().optional(),
  discountType: z.enum(['flat', 'percentage']).default('flat'),
  discountValue: z.number().positive(),
  minOrderValueMinor: z.number().int().min(0).default(0),
  maxDiscountMinor: z.number().int().optional(),
  image: z.string().optional(),
  backgroundColor: z.string().optional().default('#FFF3E0'),
  categoryId: z.string().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  endsAt: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

export const publishOffer = secureCallable(
  publishOfferSchema,
  async (data, context) => {
    verifyAdminRole(context);
    const uid = context.auth.uid;
    const cleanCode = data.code.trim().toUpperCase();

    const offerRef = data.offerId
      ? db.collection('catalogGroceryOffers').doc(data.offerId)
      : db.collection('catalogGroceryOffers').doc();

    const snap = await offerRef.get();
    const isNew = !snap.exists;

    const expiryString = data.expiresAt || data.endsAt;
    const discountTag = data.discountTag || (data.discountType === 'percentage' ? `${data.discountValue}% OFF` : `FLAT ₹${data.discountValue} OFF`);

    const payload: Record<string, any> = {
      id: offerRef.id,
      code: cleanCode,
      title: data.title,
      subtitle: data.subtitle || '',
      discountTag,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderValueMinor: data.minOrderValueMinor,
      minOrderValue: data.minOrderValueMinor / 100,
      maxDiscountMinor: data.maxDiscountMinor || null,
      maxDiscount: data.maxDiscountMinor ? data.maxDiscountMinor / 100 : null,
      image: data.image || '',
      backgroundColor: data.backgroundColor,
      categoryId: data.categoryId || null,
      startsAt: data.startsAt ? Timestamp.fromDate(new Date(data.startsAt)) : null,
      expiresAt: expiryString ? Timestamp.fromDate(new Date(expiryString)) : null,
      endsAt: expiryString ? Timestamp.fromDate(new Date(expiryString)) : null,
      active: data.isAvailable,
      isAvailable: data.isAvailable,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdAt = FieldValue.serverTimestamp();
      payload.createdBy = uid;
    }

    await offerRef.set(payload, { merge: true });

    log.info(`[Catalog] User ${uid} published offer ${offerRef.id} (code: ${cleanCode})`);
    return { success: true, offerId: offerRef.id, code: cleanCode };
  }
);

export const listOffersSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const listOffers = secureCallable(
  listOffersSchema,
  async (data) => {
    let query = db
      .collection('catalogGroceryOffers')
      .where('active', '==', true)
      .limit(data.limit);

    if (data.cursor) {
      const cursorDoc = await db.collection('catalogGroceryOffers').doc(data.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const nowMillis = Date.now();

    const offers = snap.docs
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .filter((o: any) => {
        const exp = o.expiresAt || o.endsAt;
        if (!exp) return true;
        const expMillis = typeof exp.toMillis === 'function' ? exp.toMillis() : new Date(exp).getTime();
        return expMillis > nowMillis;
      });

    const nextCursor = snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return { offers, nextCursor };
  }
);
