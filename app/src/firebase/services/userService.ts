import { User } from 'firebase/auth';
import { deleteDoc, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config';
import { SecurityDoc, UserProfile } from '../types';
import { SecurityPrivacyValues } from '../../native/types';
import { SettingsState } from '../../types';

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
  const dob = raw.dateOfBirth || raw.dob || null;
  return {
    uid: raw.uid || fallbackUid,
    displayName,
    name: displayName, // helper for UI
    email: raw.email || null,
    phoneNumber: phone,
    phoneE164,
    phone: phone, // helper for UI
    photoURL: raw.photoURL || null,
    dob,
    dateOfBirth: dob,
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
  extra?: { phone?: string; email?: string; dob?: string; dateOfBirth?: string }
): Promise<UserProfile> {
  // 1. Invoke server-authoritative ensureProfile Cloud Function
  if (functions) {
    try {
      const call = httpsCallable<
        {
          displayName?: string;
          name?: string;
          email?: string;
          phoneNumber?: string;
          phone?: string;
          photoURL?: string;
          dateOfBirth?: string;
          dob?: string;
        },
        any
      >(functions, 'ensureProfile');

      const res = await call({
        displayName: name,
        email: extra?.email || user.email || undefined,
        phoneNumber: extra?.phone || user.phoneNumber || undefined,
        photoURL: user.photoURL || undefined,
        dateOfBirth: extra?.dateOfBirth || extra?.dob || undefined,
      });

      if (res?.data) {
        return normalizeUserProfile(res.data, user.uid);
      }
    } catch (err) {
      console.warn('[userService] Server ensureProfile note (falling back to client read):', err);
    }
  }

  // 2. Read-only client fallback (e.g. offline cache hit)
  const userRef = doc(db, 'users', user.uid);
  try {
    const existing = await getDoc(userRef);
    if (existing.exists()) {
      return normalizeUserProfile(existing.data(), user.uid);
    }
  } catch (err) {
    console.warn('[userService] Offline read fallback failed:', err);
  }

  // 3. In-memory fallback if profile does not yet exist offline (preserves wallet and status invariants)
  const resolvedEmail = extra?.email || user.email || null;
  const resolvedName = deriveDisplayName(user, name, resolvedEmail || undefined);
  const rawPhone = extra?.phone || user.phoneNumber || null;
  const resolvedPhone = rawPhone ? rawPhone.replace(/\D/g, '').slice(-10) : null;
  const resolvedPhoneE164 = resolvedPhone ? `+91${resolvedPhone}` : null;
  const resolvedDob = extra?.dateOfBirth || extra?.dob || null;

  return normalizeUserProfile({
    uid: user.uid,
    displayName: resolvedName,
    email: resolvedEmail,
    phoneNumber: resolvedPhone,
    phoneE164: resolvedPhoneE164,
    photoURL: user.photoURL || null,
    dateOfBirth: resolvedDob,
    dob: resolvedDob,
    accountStatus: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }, user.uid);
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
  fields: Partial<Pick<UserProfile, 'displayName' | 'name' | 'phoneNumber' | 'phone' | 'phoneE164' | 'photoURL' | 'dateOfBirth' | 'dob'>>
): Promise<void> {
  const updates: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };
  const name = fields.displayName || fields.name;
  const phone = fields.phoneNumber || fields.phone || fields.phoneE164;
  const dob = fields.dateOfBirth || fields.dob;

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
  if (dob !== undefined) {
    updates.dateOfBirth = dob;
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

export interface MeResponse {
  profile: UserProfile;
  preferences: {
    settings: SettingsState;
    service: any;
    notifications: any;
  };
  security: SecurityPrivacyValues & { familySharingEnabled?: boolean };
  wallet: {
    balanceMinor: number;
    balance: number;
    currency: string;
  };
  addressCount: number;
}

/**
 * CALLABLE CLIENT WRAPPER: getMe
 * Fetches consolidated profile, merged subcollection preferences,
 * security, wallet summary, and aggregated address count in one round-trip.
 */
export async function fetchMe(): Promise<MeResponse | null> {
  if (!functions) return null;
  try {
    const call = httpsCallable<void, MeResponse>(functions, 'getMe');
    const res = await call();
    return res.data;
  } catch (err) {
    console.warn('[userService] fetchMe call failed:', err);
    return null;
  }
}

export interface DataExportResponse {
  success: boolean;
  exportId: string;
  downloadUrl: string;
  expiresInDays: number;
  message: string;
}

/**
 * CALLABLE CLIENT WRAPPER: requestDataExport
 * Requests a GDPR/DPDP-compliant data export archive compiled on the server.
 */
export async function requestDataExport(reason?: string): Promise<DataExportResponse> {
  if (!functions) throw new Error('Cloud Functions service not available');
  const call = httpsCallable<{ reason?: string }, DataExportResponse>(functions, 'requestDataExport');
  const res = await call({ reason });
  return res.data;
}


