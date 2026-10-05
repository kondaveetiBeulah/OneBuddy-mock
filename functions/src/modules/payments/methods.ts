import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../core/firebase';
import { secureCallable } from '../../core/callable';
import { log } from '../../core/logger';

// ----------------------------------------------------------------------------
// PAYMENT METHODS (Strict PCI-DSS Compliant Schemas — No PAN, CVV, or PIN)
// ----------------------------------------------------------------------------

export const cardPaymentMethodSchema = z
  .object({
    id: z.string().min(1).max(100),
    type: z.literal('card'),
    brand: z.string().min(1).max(50),
    last4: z.string().regex(/^\d{4}$/, 'last4 must be exactly 4 digits'),
    expiry: z.string().min(4).max(7).optional(),
    expiryMonth: z.number().int().min(1).max(12).optional(),
    expiryYear: z.number().int().min(2024).max(2099).optional(),
    displayLabel: z.string().max(100).optional(),
    provider: z.string().max(50).optional(),
    isDefault: z.boolean().optional(),
    providerToken: z.string().optional(),
  })
  .strict();

export const upiPaymentMethodSchema = z
  .object({
    id: z.string().min(1).max(100),
    type: z.literal('upi'),
    vpa: z.string().min(3).max(100),
    displayLabel: z.string().max(100).optional(),
    provider: z.string().max(50).optional(),
    isDefault: z.boolean().optional(),
    providerToken: z.string().optional(),
  })
  .strict();

export const paymentMethodSchema = z.discriminatedUnion('type', [
  cardPaymentMethodSchema,
  upiPaymentMethodSchema,
]);

export const savePaymentMethod = secureCallable(paymentMethodSchema, async (data, context) => {
  const uid = context.auth.uid;
  const methodRef = db.collection('users').doc(uid).collection('paymentMethods').doc(data.id);
  
  const displayLabel = data.displayLabel || (data.type === 'card' ? `${data.brand} •••• ${data.last4}` : data.vpa);
  const safeData = data.type === 'card'
    ? {
        id: data.id,
        type: 'card' as const,
        brand: data.brand,
        last4: data.last4,
        expiry: data.expiry || (data.expiryMonth && data.expiryYear ? `${data.expiryMonth}/${data.expiryYear}` : ''),
        expiryMonth: data.expiryMonth || null,
        expiryYear: data.expiryYear || null,
        displayLabel,
        provider: data.provider || 'card',
        isDefault: data.isDefault ?? false,
        ...(data.providerToken ? { providerToken: data.providerToken } : {}),
      }
    : {
        id: data.id,
        type: 'upi' as const,
        vpa: data.vpa,
        displayLabel,
        provider: data.provider || 'upi',
        isDefault: data.isDefault ?? false,
        ...(data.providerToken ? { providerToken: data.providerToken } : {}),
      };

  await methodRef.set({
    ...safeData,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  
  log.info(`User ${uid} saved payment method ${data.id} (${data.type})`);
  return { success: true };
});

export const removePaymentMethod = secureCallable(
  z
    .object({
      id: z.string().min(1),
      soft: z.boolean().optional().default(false),
    })
    .strict(),
  async (data, context) => {
    const uid = context.auth.uid;
    const docRef = db.collection('users').doc(uid).collection('paymentMethods').doc(data.id);
    if (data.soft) {
      await docRef.set({ deletedAt: FieldValue.serverTimestamp() }, { merge: true });
    } else {
      await docRef.delete();
    }
    log.info(`User ${uid} removed payment method ${data.id} (soft: ${data.soft})`);
    return { success: true };
  }
);

export const addPaymentMethod = savePaymentMethod;

export const listPaymentMethodsSchema = z
  .object({
    type: z.enum(['card', 'upi']).optional(),
    limit: z.number().int().positive().max(50).default(20),
    cursor: z.string().optional(),
    includeDeleted: z.boolean().optional().default(false),
  })
  .strict();

export const listPaymentMethods = secureCallable(
  listPaymentMethodsSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    let q: FirebaseFirestore.Query = db.collection('users').doc(uid).collection('paymentMethods');

    if (data.type) {
      q = q.where('type', '==', data.type);
    }

    if (data.cursor) {
      const cursorDoc = await db
        .collection('users')
        .doc(uid)
        .collection('paymentMethods')
        .doc(data.cursor)
        .get();
      if (cursorDoc.exists) {
        q = q.startAfter(cursorDoc);
      }
    }

    q = q.limit(data.limit);

    const snap = await q.get();

    const paymentMethods = snap.docs
      .filter((doc) => data.includeDeleted || !doc.data().deletedAt)
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          type: d.type,
          displayLabel:
            d.displayLabel || (d.type === 'card' ? `•••• ${d.last4}` : d.vpa),
          brand: d.brand,
          last4: d.last4,
          expiry: d.expiry,
          expiryMonth: d.expiryMonth,
          expiryYear: d.expiryYear,
          vpa: d.vpa,
          isDefault: d.isDefault ?? false,
          createdAt: d.createdAt,
        };
      })
      .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    const nextCursor =
      snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return {
      paymentMethods,
      nextCursor,
    };
  }
);
