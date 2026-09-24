import { User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../config';
import { SecurityDoc, UserProfile } from '../types';
import { SecurityPrivacyValues } from '../../native/types';

const DEFAULT_SECURITY: Omit<SecurityDoc, 'updatedAt'> = {
  biometric: true,
  verifiedProfile: true,
  familySharing: false,
  emergencyContact: '',
};

/** Called once right after sign-up or login. Idempotent: safe to call again. */
export async function ensureUserDocument(
  user: User,
  name?: string,
  extra?: { phone?: string; email?: string; dob?: string }
): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  console.log(`[Firestore] Writing user profile to database "users" for UID: ${user.uid}`);
  const existing = await getDoc(userRef);
  if (!existing.exists()) {
    const profile: any = {
      uid: user.uid,
      name: name || user.displayName || 'OneBuddy user',
      email: extra?.email || user.email || '',
      phone: extra?.phone || user.phoneNumber || '',
      dob: extra?.dob || '',
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
    };
    // Note: The backend handles the actual creation of this document securely.
    // We return the optimisitic profile immediately so the app can load.
    console.log(`[Firestore] Backend is provisioning profile for UID: ${user.uid}`);
    return profile as UserProfile;
  } else {
    if (extra && (extra.phone || extra.dob || extra.email || name)) {
      const updates: Record<string, unknown> = {};
      if (name) updates.name = name;
      if (extra.phone) updates.phone = extra.phone;
      if (extra.email) updates.email = extra.email;
      if (extra.dob) updates.dob = extra.dob;
      await setDoc(userRef, updates, { merge: true });
    }
    console.log(`[Firestore] User profile updated in "users" database for UID: ${user.uid}`);
    return existing.data() as UserProfile;
  }
}

/** Look up an existing registered user by their 10-digit mobile number. */
export async function findUserByPhone(phone: string): Promise<UserProfile | null> {
  try {
    const q = query(collection(db, 'users'), where('phone', '==', phone));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as UserProfile;
    }
  } catch (err) {
    console.warn('findUserByPhone query note:', err);
  }
  return null;
}

export function subscribeToProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void
): () => void {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    onData(snap.exists() ? (snap.data() as UserProfile) : null);
  });
}

export async function updateProfileFields(
  uid: string,
  fields: Partial<Pick<UserProfile, 'name' | 'phone' | 'photoURL'>>
): Promise<void> {
  await setDoc(doc(db, 'users', uid), fields, { merge: true });
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
