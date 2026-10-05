import { z } from 'zod';
import { FieldValue, GeoPoint } from 'firebase-admin/firestore';
import { db } from '../../common/firebase';
import { secureCallable } from '../../common/auth';
import { log } from '../../common/logging';
import { throwError } from '../../common/errors';
import { UsersRepository } from '../../repositories';

const addressSchema = z.object({
  id: z.string(),
  label: z.string(),
  receiverName: z.string(),
  phone: z.string(),
  phoneE164: z.string().optional().nullable(),
  line1: z.string(),
  line2: z.string().nullish(),
  landmark: z.string().nullish(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  postalCode: z.string().optional().nullable(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  isDefault: z.boolean(),
}).strict();

export const createAddressSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1).max(50),
  receiverName: z.string().min(1).max(100),
  phone: z.string().min(5).max(20),
  phoneE164: z.string().optional().nullable(),
  line1: z.string().min(1).max(200),
  line2: z.string().nullish(),
  landmark: z.string().nullish(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().min(3).max(20).optional().nullable(),
  postalCode: z.string().min(3).max(20).optional().nullable(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  isDefault: z.boolean().default(false),
}).strict().refine((d) => d.pincode || d.postalCode, {
  message: 'Either pincode or postalCode must be provided',
});

export const updateAddressSchema = z.object({
  addressId: z.string().min(1).max(128),
  updates: z.object({
    label: z.string().min(1).max(50).optional(),
    receiverName: z.string().min(1).max(100).optional(),
    phone: z.string().min(5).max(20).optional(),
    phoneE164: z.string().optional().nullable(),
    line1: z.string().min(1).max(200).optional(),
    line2: z.string().nullish(),
    landmark: z.string().nullish(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(100).optional(),
    pincode: z.string().min(3).max(20).optional().nullable(),
    postalCode: z.string().min(3).max(20).optional().nullable(),
    latitude: z.number().nullish(),
    longitude: z.number().nullish(),
    isDefault: z.boolean().optional(),
  }).strict(),
}).strict();

/**
 * CALLABLE: createAddress
 * Creates a single address record under users/{uid}/addresses/{addressId}.
 * If isDefault is true or this is the user's first address, clears prior defaults atomically.
 */
export const createAddress = secureCallable(
  createAddressSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const colRef = db.collection('users').doc(uid).collection('addresses');
    const docRef = data.id ? colRef.doc(data.id) : colRef.doc();
    const addressId = docRef.id;

    const rawPhone = data.phone || data.phoneE164 || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    const phoneE164 = data.phoneE164 || (cleanPhone ? `+91${cleanPhone}` : rawPhone);
    const postalCode = data.postalCode || data.pincode || '';
    const pincode = data.pincode || data.postalCode || '';

    await db.runTransaction(async (t) => {
      const snap = await t.get(colRef);
      const isFirst = snap.empty;
      const shouldBeDefault = Boolean(data.isDefault || isFirst);

      if (shouldBeDefault) {
        snap.docs.forEach((d) => {
          if (d.data().isDefault) {
            t.update(d.ref, {
              isDefault: false,
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        });
      }

      const location = (data.latitude !== undefined && data.longitude !== undefined && data.latitude !== null && data.longitude !== null)
        ? new GeoPoint(data.latitude, data.longitude)
        : null;

      t.set(docRef, {
        id: addressId,
        label: data.label,
        receiverName: data.receiverName,
        phone: data.phone,
        phoneE164,
        line1: data.line1,
        line2: data.line2 || null,
        landmark: data.landmark || null,
        city: data.city,
        state: data.state,
        pincode,
        postalCode,
        location,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        isDefault: shouldBeDefault,
        deletedAt: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    log.info(`[addresses] User ${uid} created address ${addressId} (isDefault: ${data.isDefault})`);
    return { success: true, addressId };
  }
);

/**
 * CALLABLE: updateAddress
 * Updates a single address record under users/{uid}/addresses/{addressId}.
 * If updates.isDefault is true, clears prior defaults atomically via transaction.
 */
export const updateAddress = secureCallable(
  updateAddressSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const colRef = db.collection('users').doc(uid).collection('addresses');
    const docRef = colRef.doc(data.addressId);

    await db.runTransaction(async (t) => {
      const docSnap = await t.get(docRef);
      if (!docSnap.exists) {
        throwError('not-found', `Address with ID '${data.addressId}' was not found.`);
      }

      if (data.updates.isDefault === true) {
        const snap = await t.get(colRef);
        snap.docs.forEach((d) => {
          if (d.id !== data.addressId && d.data().isDefault) {
            t.update(d.ref, {
              isDefault: false,
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        });
      }

      const updates: Record<string, any> = {
        ...data.updates,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (data.updates.phone && !data.updates.phoneE164) {
        const clean = data.updates.phone.replace(/\D/g, '').slice(-10);
        if (clean) updates.phoneE164 = `+91${clean}`;
      }
      if (data.updates.pincode && !data.updates.postalCode) {
        updates.postalCode = data.updates.pincode;
      } else if (data.updates.postalCode && !data.updates.pincode) {
        updates.pincode = data.updates.postalCode;
      }

      if (data.updates.latitude !== undefined && data.updates.longitude !== undefined) {
        if (data.updates.latitude !== null && data.updates.longitude !== null) {
          updates.location = new GeoPoint(data.updates.latitude, data.updates.longitude);
        } else {
          updates.location = null;
        }
      }

      t.update(docRef, updates);
    });

    log.info(`[addresses] User ${uid} updated address ${data.addressId}`);
    return { success: true, addressId: data.addressId };
  }
);

export const replaceAddresses = secureCallable(
  z.object({ addresses: z.array(addressSchema) }).strict(),
  async (data, context) => {
    const uid = context.auth.uid;
    const colRef = db.collection('users').doc(uid).collection('addresses');
    
    // Using batch to replace all addresses safely
    const existing = await colRef.get();
    const batch = db.batch();
    
    existing.docs.forEach((d) => batch.delete(d.ref));
    
    data.addresses.forEach((a) => {
      const docRef = colRef.doc(a.id);
      batch.set(docRef, { ...a, updatedAt: FieldValue.serverTimestamp() });
    });
    
    await batch.commit();
    log.info(`User ${uid} replaced address book`);
    return { success: true };
  }
);

export const deleteAddress = secureCallable(
  z.object({
    addressId: z.string().min(1),
    soft: z.boolean().default(true),
  }).strict(),
  async (data, context) => {
    const uid = context.auth.uid;
    const docRef = db.collection('users').doc(uid).collection('addresses').doc(data.addressId);

    if (data.soft) {
      await docRef.update({
        deletedAt: FieldValue.serverTimestamp(),
        isDefault: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await docRef.delete();
    }

    log.info(`[addresses] User ${uid} deleted address ${data.addressId} (soft: ${data.soft})`);
    return { success: true, addressId: data.addressId };
  }
);

export const setDefaultAddress = secureCallable(
  z.object({ addressId: z.string() }).strict(),
  async (data, context) => {
    const uid = context.auth.uid;
    await db.runTransaction(async (t) => {
      const colRef = db.collection('users').doc(uid).collection('addresses');
      const snap = await t.get(colRef);
      snap.docs.forEach((d) => {
        t.update(d.ref, { 
          isDefault: d.id === data.addressId, 
          updatedAt: FieldValue.serverTimestamp() 
        });
      });
    });
    return { success: true };
  }
);

// ============================================================================
// CALLABLE: savePlace
// Saves a named place (Home, Work, Custom) with GeoPoint normalization.
// ============================================================================
const savePlaceSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1).max(50),
  address: z.string().min(1).max(200),
  icon: z.enum(['home', 'briefcase', 'pin']).default('pin'),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
}).strict();

export const savePlace = secureCallable(
  savePlaceSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const placeId = await UsersRepository.savePlace(uid, data);
    return { success: true, placeId };
  }
);

// ============================================================================
// CALLABLE: listSavedPlaces
// Lists saved places for the authenticated user.
// ============================================================================
export const listSavedPlaces = secureCallable(
  z.object({}).strict().optional(),
  async (_data, context) => {
    const uid = context.auth.uid;
    const places = await UsersRepository.listSavedPlaces(uid);
    return { success: true, places };
  }
);

// ============================================================================
// CALLABLE: deleteSavedPlace
// Deletes a saved place.
// ============================================================================
export const deleteSavedPlace = secureCallable(
  z.object({ placeId: z.string().min(1) }).strict(),
  async (data, context) => {
    const uid = context.auth.uid;
    await UsersRepository.deleteSavedPlace(uid, data.placeId);
    return { success: true, placeId: data.placeId };
  }
);


