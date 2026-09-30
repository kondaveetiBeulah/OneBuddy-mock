import { User } from 'firebase/auth';
import { deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config';
import { SecurityDoc, UserProfile } from '../types';
import { SecurityPrivacyValues } from '../../native/types';

const DEFAULT_SECURITY: Omit<SecurityDoc, 'updatedAt'> = {
  biometric: true,
  verifiedProfile: true,
  familySharing: false,
  emergencyContact: '',
};

function normalizeUserProfile(raw: any, fallbackUid: string): UserProfile {
  const displayName = raw.displayName || raw.name || 'OneBuddy user';
  const rawPhone = raw.phoneNumber || raw.phoneE164 || raw.phone || null;
  const phone = rawPhone ? rawPhone.replace(/\D/g, '').slice(-10) : null;
  const phoneE164 = raw.phoneE164 || (phone ? `+91${phone}` : null);
  return {
    uid: raw.uid || fallbackUid,
    displayName,
    name: displayName, // helper for UI
    email: raw.email || null,
    phoneNumber: phone,
    phoneE164,
    phone: phone, // helper for UI
    photoURL: raw.photoURL || null,
    accountStatus: raw.accountStatus || 'active',
    createdAt: raw.createdAt || Date.now(),
    updatedAt: raw.updatedAt || Date.now(),
  };
}

function deriveDisplayName(user: User, explicitName?: string, email?: string): string {
  if (explicitName && explicitName.trim()) return explicitName.trim();
  if (user.displayName && user.displayName.trim()) return user.displayName.trim();
  const rawEmail = email || user.email || '';
  if (rawEmail && rawEmail.includes('@')) {
    const handle = rawEmail.split('@')[0];
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  }
  return 'OneBuddy User';
}

/** Called once right after sign-up or login. Idempotent: safe to call again. */
export async function ensureUserDocument(
  user: User,
  name?: string,
  extra?: { phone?: string; email?: string }
): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  console.log(`[Firestore] Fetching/ensuring user profile for UID: ${user.uid}`);
  const existing = await getDoc(userRef);
  const resolvedEmail = extra?.email || user.email || null;
  const resolvedName = deriveDisplayName(user, name, resolvedEmail || undefined);
  const rawPhone = extra?.phone || user.phoneNumber || null;
  const resolvedPhone = rawPhone ? rawPhone.replace(/\D/g, '').slice(-10) : null;
  const resolvedPhoneE164 = resolvedPhone ? `+91${resolvedPhone}` : null;

  if (!existing.exists()) {
    const profileData: Record<string, any> = {
      accountStatus: 'active',
      createdAt: serverTimestamp(),
      displayName: resolvedName,
      email: resolvedEmail,
      phoneNumber: resolvedPhone,
      phoneE164: resolvedPhoneE164,
      uid: user.uid,
      updatedAt: serverTimestamp(),
    };
    try {
      console.log(`[Firestore] Writing user profile to Firestore for UID: ${user.uid}`, profileData);
      await setDoc(userRef, profileData, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error writing initial user document:', err);
    }
    return normalizeUserProfile({ ...profileData, createdAt: Date.now(), updatedAt: Date.now() }, user.uid);
  } else {
    const existingData = existing.data() || {};
    const updates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (!existingData.displayName || existingData.displayName === 'null' || name) {
      updates.displayName = resolvedName;
    }
    if (resolvedPhone) {
      updates.phoneNumber = resolvedPhone;
      updates.phoneE164 = resolvedPhoneE164;
    }
    if (resolvedEmail && (!existingData.email || existingData.email === '')) {
      updates.email = resolvedEmail;
    }
    if (!existingData.accountStatus) {
      updates.accountStatus = 'active';
    }

    try {
      console.log(`[Firestore] Updating user profile in Firestore for UID: ${user.uid}`, updates);
      await setDoc(userRef, updates, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Error updating user document:', err);
    }
    return normalizeUserProfile({ ...existingData, ...updates }, user.uid);
  }
}

/** Deletes all user documents and subcollections from Firestore. */
export async function deleteUserAccountFromFirestore(uid: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const secRef = doc(db, 'users', uid, 'privacy', 'security');
    const walletRef = doc(db, 'wallets', uid);

    // Delete subdocuments and main profile document completely (no deletedAt / leftover fields)
    await Promise.allSettled([
      deleteDoc(secRef),
      deleteDoc(walletRef),
      deleteDoc(userRef),
    ]);
  } catch (err) {
    console.warn('[Firestore] Error deleting user document:', err);
  }
}


/** Look up a user profile by UID directly. */
export async function getUserProfileByUid(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data();
      if (data.accountStatus === 'deleted') return null;
      return normalizeUserProfile(data, uid);
    }
  } catch (err) {
    console.warn('getUserProfileByUid note:', err);
  }
  return null;
}

export function subscribeToProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void
): () => void {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    onData(snap.exists() ? normalizeUserProfile(snap.data(), uid) : null);
  });
}

export async function updateProfileFields(
  uid: string,
  fields: Partial<Pick<UserProfile, 'displayName' | 'name' | 'phoneNumber' | 'phone' | 'phoneE164' | 'photoURL'>>
): Promise<void> {
  const updates: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };
  const name = fields.displayName || fields.name;
  const phone = fields.phoneNumber || fields.phone || fields.phoneE164;

  if (name !== undefined) {
    updates.displayName = name;
  }
  if (phone !== undefined) {
    if (phone === null) {
      updates.phoneNumber = null;
      updates.phoneE164 = null;
    } else {
      const clean = phone.replace(/\D/g, '').slice(-10);
      updates.phoneNumber = clean;
      updates.phoneE164 = clean ? `+91${clean}` : null;
    }
  }
  if (fields.photoURL !== undefined) {
    updates.photoURL = fields.photoURL;
  }

  await setDoc(doc(db, 'users', uid), updates, { merge: true });
}

export async function getSecurity(uid: string): Promise<SecurityPrivacyValues> {
  const snap = await getDoc(doc(db, 'users', uid, 'privacy', 'security'));
  if (!snap.exists()) return { ...DEFAULT_SECURITY };
  const data = snap.data() as SecurityDoc;
  return {
    biometric: data.biometric,
    verifiedProfile: data.verifiedProfile,
    familySharing: data.familySharing,
    emergencyContact: data.emergencyContact,
  };
}

export async function saveSecurity(
  uid: string,
  values: SecurityPrivacyValues
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'privacy', 'security'),
    { ...values, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
