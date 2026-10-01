import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../core/firebase';
import { secureCallable } from '../core/callable';
import { log } from '../core/logger';

const addressSchema = z.object({
  id: z.string(),
  label: z.string(),
  receiverName: z.string(),
  phone: z.string(),
  line1: z.string(),
  line2: z.string().nullish(),
  landmark: z.string().nullish(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  isDefault: z.boolean(),
}).strict();

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
  z.object({ addressId: z.string() }).strict(),
  async (data, context) => {
    const uid = context.auth.uid;
    await db.collection('users').doc(uid).collection('addresses').doc(data.addressId).delete();
    return { success: true };
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
