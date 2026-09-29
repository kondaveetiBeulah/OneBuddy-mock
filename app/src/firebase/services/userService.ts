import { User } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
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
  return {
    uid: raw.uid || fallbackUid,
    displayName,
    name: displayName, // helper for UI
    email: raw.email || null,
    phoneNumber: phone,
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

  if (!existing.exists()) {
    const profileData: Record<string, any> = {
      accountStatus: 'active',
      createdAt: serverTimestamp(),
      displayName: resolvedName,
      email: resolvedEmail,
      phoneNumber: resolvedPhone,
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

/** Look up an existing registered user by their 10-digit mobile number. */
export async function findUserByPhone(phone: string): Promise<UserProfile | null> {
  try {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    // Query standard phone fields
    const q1 = query(collection(db, 'users'), where('phone', '==', cleanPhone));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const docData = snap1.docs[0].data();
      if (docData.accountStatus !== 'deleted') {
        return normalizeUserProfile(docData, snap1.docs[0].id);
      }
    }
    const q2 = query(collection(db, 'users'), where('phoneNumber', '==', cleanPhone));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const docData = snap2.docs[0].data();
      if (docData.accountStatus !== 'deleted') {
        return normalizeUserProfile(docData, snap2.docs[0].id);
      }
    }
    const q3 = query(collection(db, 'users'), where('phoneE164', '==', cleanPhone));
    const snap3 = await getDocs(q3);
    if (!snap3.empty) {
      const docData = snap3.docs[0].data();
      if (docData.accountStatus !== 'deleted') {
        return normalizeUserProfile(docData, snap3.docs[0].id);
      }
    }
  } catch (err) {
    console.warn('findUserByPhone query note:', err);
  }
  return null;
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
  fields: Partial<Pick<UserProfile, 'displayName' | 'name' | 'phoneNumber' | 'phone'>>
): Promise<void> {
  const updates: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };
  const name = fields.displayName || fields.name;
  const phone = fields.phoneNumber || fields.phone;

  if (name !== undefined) {
    updates.displayName = name;
  }
  if (phone !== undefined) {
    updates.phoneNumber = phone;
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
