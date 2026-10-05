import {
  collection,
  getDocs,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config';
import { AddressDoc } from '../types';

// The native Address screen's own shape — kept local to avoid a circular
// import back into the screen file. Structurally identical to AddressDoc
// minus the bookkeeping fields.
export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  receiverName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

function toAddress(d: AddressDoc): Address {
  const { updatedAt: _updatedAt, ...rest } = d;
  return rest;
}

export async function listAddresses(uid: string): Promise<Address[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'addresses'));
  return snap.docs
    .map((d) => toAddress(d.data() as AddressDoc))
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

/**
 * Overwrites the whole address book for the user. The Address screen keeps
 * its own list client-side (including default selection), so the simplest
 * consistent sync is "replace everything" in one batch — same approach the
 * screen already uses for its in-memory `addresses` state.
 */
export async function replaceAddresses(uid: string, addresses: Address[]): Promise<void> {
  const call = httpsCallable<{ addresses: Address[] }, { success: boolean }>(functions, 'replaceAddresses');
  await call({ addresses });
}

export async function deleteAddress(uid: string, addressId: string): Promise<void> {
  const call = httpsCallable<{ addressId: string }, { success: boolean }>(functions, 'deleteAddress');
  await call({ addressId });
}

/** Atomically makes one address the default and clears the flag on the rest. */
export async function setDefaultAddress(uid: string, addressId: string): Promise<void> {
  const call = httpsCallable<{ addressId: string }, { success: boolean }>(functions, 'setDefaultAddress');
  await call({ addressId });
}

/** Creates a single address record under users/{uid}/addresses/{addressId} */
export async function createAddress(
  uid: string,
  address: Omit<Address, 'id'> & { id?: string }
): Promise<string> {
  const call = httpsCallable<typeof address, { success: boolean; addressId: string }>(
    functions,
    'createAddress'
  );
  const res = await call(address);
  return res.data.addressId;
}

/** Updates a single address record under users/{uid}/addresses/{addressId} */
export async function updateAddress(
  uid: string,
  addressId: string,
  updates: Partial<Omit<Address, 'id'>>
): Promise<void> {
  const call = httpsCallable<
    { addressId: string; updates: Partial<Omit<Address, 'id'>> },
    { success: boolean }
  >(functions, 'updateAddress');
  await call({ addressId, updates });
}

