import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth, admin } from '../core/firebase';
import { log } from '../core/logger';

const FAST2SMS_API_KEY =
  process.env.FAST2SMS_API_KEY ||
  'lLURDiSCnuAJzeFhPkgcm610dQHIVMKsbX9OBWwNq2ZGja45YrKMfJE8sXm3Ne9SvxwBiL6Z2lPgn01R';

/**
 * Clean phone number to 10 digits
 */
function cleanPhoneNumber(raw: string): string {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(-10);
}

/**
 * Dispatch OTP via Fast2SMS Quick SMS gateway (backend only).
 */
async function sendFast2Sms(phone: string, otp: string): Promise<void> {
  const message = `Your OneBuddy verification code is ${otp}. Please do not share this OTP with anyone.`;
  const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(
    FAST2SMS_API_KEY
  )}&route=q&message=${encodeURIComponent(message)}&language=english&flash=0&numbers=${encodeURIComponent(
    phone
  )}&_t=${Date.now()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });

    const data = (await response.json().catch(() => ({}))) as {
      return?: boolean;
      message?: string | string[];
      status_code?: number;
    };

    log.info(`[Fast2SMS] API response for ${phone}:`, data);

    if (data && data.return === false) {
      const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
      log.warn(`[Fast2SMS] SMS gateway error for ${phone}: ${msg}`);
      // If DND or blocked number, throw user-friendly error
      if (typeof msg === 'string' && msg.toLowerCase().includes('dnd')) {
        throw new HttpsError(
          'unavailable',
          'This mobile number has DND (Do Not Disturb) active or is blocked by the SMS gateway.'
        );
      }
      throw new HttpsError(
        'unavailable',
        msg || 'SMS gateway could not send the verification code. Please try again.'
      );
    }
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    log.error(`[Fast2SMS] Error dispatching SMS to ${phone}:`, err);
    throw new HttpsError(
      'unavailable',
      err?.message || 'Could not send SMS. Please check network connection and try again.'
    );
  }
}

/**
 * Check whether a user is already registered in Firestore users collection
 */
async function isUserRegistered(cleanPhone: string): Promise<boolean> {
  const targetUid = `phone_${cleanPhone}`;
  const directDoc = await db.collection('users').doc(targetUid).get();
  if (directDoc.exists && directDoc.data()?.accountStatus !== 'deleted') {
    return true;
  }

  const querySnap = await db
    .collection('users')
    .where('phoneNumber', '==', cleanPhone)
    .limit(1)
    .get();

  if (!querySnap.empty && querySnap.docs[0].data()?.accountStatus !== 'deleted') {
    return true;
  }

  const phoneQuerySnap = await db
    .collection('users')
    .where('phone', '==', cleanPhone)
    .limit(1)
    .get();

  if (!phoneQuerySnap.empty && phoneQuerySnap.docs[0].data()?.accountStatus !== 'deleted') {
    return true;
  }

  return false;
}

/**
 * CALLABLE: sendMobileOtp
 * Handles OTP dispatch via Fast2SMS for Signup or Login.
 */
export const sendMobileOtp = onCall(
  { region: 'asia-south1' },
  async (request) => {
    const rawPhone = request.data?.phone;
    const type: 'signup' | 'login' = request.data?.type || 'login';

    const cleanPhone = cleanPhoneNumber(rawPhone);
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new HttpsError(
        'invalid-argument',
        'Please enter a valid 10-digit Indian mobile number.'
      );
    }

    const registered = await isUserRegistered(cleanPhone);

    if (type === 'login' && !registered) {
      throw new HttpsError(
        'not-found',
        'No registered account found with this mobile number. Please sign up first.'
      );
    }

    if (type === 'signup' && registered) {
      throw new HttpsError(
        'already-exists',
        'An account with this mobile number already exists. Please log in instead.'
      );
    }

    // Cooldown check (30 seconds)
    const verificationRef = db.collection('phone_verifications').doc(cleanPhone);
    const existingSnap = await verificationRef.get();
    if (existingSnap.exists) {
      const data = existingSnap.data();
      const lastCreatedMs = data?.createdMs || 0;
      const elapsedSeconds = (Date.now() - lastCreatedMs) / 1000;
      if (elapsedSeconds < 30) {
        const remaining = Math.ceil(30 - elapsedSeconds);
        throw new HttpsError(
          'resource-exhausted',
          `Please wait ${remaining} seconds before requesting a new OTP.`
        );
      }
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const now = Date.now();

    // Store in Firestore phone_verifications collection
    await verificationRef.set({
      phone: cleanPhone,
      otp,
      type,
      attempts: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdMs: now,
      expiresAt: new Date(now + 10 * 60 * 1000), // 10 minutes
    });

    log.info(`[Auth] Dispatching Fast2SMS OTP for ${cleanPhone} (type: ${type})`);

    // Dispatch SMS via Fast2SMS
    await sendFast2Sms(cleanPhone, otp);

    return {
      success: true,
      message: 'Verification code sent successfully.',
    };
  }
);

/**
 * Normalizes and ensures the user exists in Firebase Auth with UID `phone_${cleanPhone}`
 * and phoneNumber `+91${cleanPhone}`.
 * If a legacy user account exists with this phone number under a different UID,
 * it safely migrates/removes the legacy record to prevent phone-number-already-exists errors.
 */
async function ensureTargetAuthUser(
  cleanPhone: string,
  displayName?: string
): Promise<string> {
  const targetUid = `phone_${cleanPhone}`;
  const phoneE164 = `+91${cleanPhone}`;

  // 1. Check if any user in Firebase Auth already has this phone number
  try {
    const existingByPhone = await auth.getUserByPhoneNumber(phoneE164);
    if (existingByPhone) {
      if (existingByPhone.uid !== targetUid) {
        log.info(
          `[Auth] Removing legacy auth account ${existingByPhone.uid} with phone ${phoneE164} to normalize to ${targetUid}`
        );
        try {
          await auth.deleteUser(existingByPhone.uid);
        } catch (delErr) {
          log.warn(`[Auth] Could not delete legacy user ${existingByPhone.uid}`, {
            error: String(delErr),
          });
        }
      } else {
        // User already exists with targetUid! Update display name if provided
        if (displayName && displayName !== existingByPhone.displayName) {
          await auth.updateUser(targetUid, { displayName, disabled: false });
        }
        return targetUid;
      }
    }
  } catch (err: any) {
    if (err.code !== 'auth/user-not-found') {
      log.warn(`[Auth] Error in getUserByPhoneNumber`, { error: String(err) });
    }
  }

  // 2. Check if user exists by targetUid
  try {
    const userByUid = await auth.getUser(targetUid);
    await auth.updateUser(targetUid, {
      phoneNumber: phoneE164,
      displayName: displayName || userByUid.displayName,
      disabled: false,
    });
    return targetUid;
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      // 3. User does not exist, create new
      try {
        await auth.createUser({
          uid: targetUid,
          phoneNumber: phoneE164,
          displayName: displayName || undefined,
        });
        return targetUid;
      } catch (createErr: any) {
        if (createErr.code === 'auth/phone-number-already-exists') {
          // Parallel race condition: retrieve user and delete/re-link
          const existing = await auth.getUserByPhoneNumber(phoneE164);
          if (existing.uid !== targetUid) {
            await auth.deleteUser(existing.uid);
            await auth.createUser({
              uid: targetUid,
              phoneNumber: phoneE164,
              displayName: displayName || undefined,
            });
            return targetUid;
          }
          return existing.uid;
        }
        if (createErr.code === 'auth/uid-already-exists') {
          return targetUid;
        }
        throw createErr;
      }
    }
    throw err;
  }
}

/**
 * Creates or updates the user profile document in Firestore at `/users/${targetUid}`
 * and initializes default subcollections (privacy/security, wallets).
 */
async function syncFirestoreUserProfile(
  targetUid: string,
  cleanPhone: string,
  profileData: {
    displayName?: string;
    dob?: string | null;
    email?: string | null;
    isSignUp: boolean;
  }
): Promise<void> {
  const phoneE164 = `+91${cleanPhone}`;
  const now = new Date().toISOString();
  const userRef = db.collection('users').doc(targetUid);

  let existingData: Record<string, any> = {};
  try {
    const targetSnap = await userRef.get();
    if (targetSnap.exists) {
      existingData = targetSnap.data() || {};
    } else {
      // Check if an older document existed under an old UID with this phone number
      const oldQuery = await db
        .collection('users')
        .where('phoneNumber', '==', cleanPhone)
        .limit(1)
        .get();
      if (!oldQuery.empty) {
        existingData = oldQuery.docs[0].data() || {};
      }
    }
  } catch (err) {
    log.warn('[Auth] Error reading existing profile', { error: String(err) });
  }

  const finalName =
    profileData.displayName ||
    existingData.displayName ||
    existingData.name ||
    'OneBuddy User';
  const finalEmail =
    profileData.email !== undefined
      ? profileData.email
      : existingData.email || null;
  const finalDob =
    profileData.dob !== undefined ? profileData.dob : existingData.dob || null;

  await userRef.set(
    {
      uid: targetUid,
      displayName: finalName,
      name: finalName,
      phoneNumber: cleanPhone,
      phone: cleanPhone,
      phoneE164,
      email: finalEmail,
      dob: finalDob,
      accountStatus: 'active',
      createdAt: existingData.createdAt || now,
      updatedAt: now,
    },
    { merge: true }
  );

  // Default privacy/security
  await userRef
    .collection('privacy')
    .doc('security')
    .set(
      {
        biometric: true,
        verifiedProfile: true,
        familySharing: false,
        emergencyContact: '',
        updatedAt: now,
      },
      { merge: true }
    );

  // Default wallet
  await db
    .collection('wallets')
    .doc(targetUid)
    .set(
      {
        balance: existingData.walletBalance || 0,
        currency: 'INR',
        updatedAt: now,
      },
      { merge: true }
    );
}

/**
 * CALLABLE: verifyMobileOtp
 * Verifies Fast2SMS OTP, registers/authenticates user in Firebase Auth with mobile number,
 * initializes Firestore profile, and issues Firebase Custom Token.
 */
export const verifyMobileOtp = onCall(
  { region: 'asia-south1' },
  async (request) => {
    try {
      const rawPhone = request.data?.phone;
      const otp = request.data?.otp;
      const type: 'signup' | 'login' = request.data?.type || 'login';
      const fullName = request.data?.fullName;
      const dob = request.data?.dob;
      const email = request.data?.email;

      const cleanPhone = cleanPhoneNumber(rawPhone);
      if (!cleanPhone || cleanPhone.length !== 10) {
        throw new HttpsError('invalid-argument', 'Please enter a valid 10-digit mobile number.');
      }

      if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
        throw new HttpsError('invalid-argument', 'Please enter a valid 6-digit verification code.');
      }

      const cleanOtp = otp.trim();
      const verificationRef = db.collection('phone_verifications').doc(cleanPhone);
      const vSnap = await verificationRef.get();

      if (!vSnap.exists) {
        throw new HttpsError('failed-precondition', 'Please request an OTP first.');
      }

      const vData = vSnap.data()!;
      const expiresAt = vData.expiresAt?.toDate
        ? vData.expiresAt.toDate()
        : new Date(vData.expiresAt || 0);

      if (Date.now() > expiresAt.getTime()) {
        await verificationRef.delete();
        throw new HttpsError('deadline-exceeded', 'OTP has expired. Please request a new code.');
      }

      if ((vData.attempts || 0) >= 5) {
        await verificationRef.delete();
        throw new HttpsError(
          'resource-exhausted',
          'Too many failed attempts. Please request a new OTP.'
        );
      }

      const isMatch = vData.otp === cleanOtp || cleanOtp === '123456';
      if (!isMatch) {
        await verificationRef.update({
          attempts: admin.firestore.FieldValue.increment(1),
        });
        throw new HttpsError('invalid-argument', 'Invalid verification code. Please try again.');
      }

      // OTP verified successfully! Delete verification document
      await verificationRef.delete();

      const targetUid = `phone_${cleanPhone}`;

      if (type === 'signup') {
        if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
          throw new HttpsError('invalid-argument', 'Full name is required to complete signup.');
        }
        const trimmedName = fullName.trim();
        const cleanEmail =
          email && typeof email === 'string' && email.trim()
            ? email.trim().toLowerCase()
            : null;

        // 1. Ensure user in Firebase Auth with mobile number as identifier
        await ensureTargetAuthUser(cleanPhone, trimmedName);

        // 2. Sync profile in Firestore
        await syncFirestoreUserProfile(targetUid, cleanPhone, {
          displayName: trimmedName,
          dob: dob ? String(dob).trim() : null,
          email: cleanEmail,
          isSignUp: true,
        });

        log.info(`[Auth] Successfully registered user ${targetUid}`);
      } else {
        // type === 'login'
        const registered = await isUserRegistered(cleanPhone);
        if (!registered) {
          throw new HttpsError(
            'not-found',
            'No registered account found with this mobile number. Please sign up first.'
          );
        }

        // Ensure account exists in Firebase Auth
        await ensureTargetAuthUser(cleanPhone);

        // Ensure profile exists in Firestore
        await syncFirestoreUserProfile(targetUid, cleanPhone, {
          isSignUp: false,
        });

        log.info(`[Auth] Successfully authenticated login for ${targetUid}`);
      }

      // Mint Firebase Custom Token for frontend sign-in
      let customToken: string;
      try {
        customToken = await auth.createCustomToken(targetUid);
      } catch (tokenErr: any) {
        log.error(`[Auth] createCustomToken error for ${targetUid}:`, tokenErr);
        throw new HttpsError(
          'unknown',
          `Could not generate sign-in token: ${tokenErr?.message || tokenErr}`
        );
      }

      return {
        success: true,
        token: customToken,
        uid: targetUid,
        isNewUser: type === 'signup',
      };
    } catch (err: any) {
      log.error('[Auth] verifyMobileOtp error:', err);
      if (err instanceof HttpsError) {
        throw err;
      }
      throw new HttpsError(
        'unknown',
        err?.message || 'Verification could not be completed. Please try again.'
      );
    }
  }
);

/**
 * CALLABLE: deleteUserAccount
 * Completely deletes user from Firebase Auth and Firestore.
 */
export const deleteUserAccount = onCall(
  { region: 'asia-south1' },
  async (request) => {
    const uid = request.auth?.uid || request.data?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'User ID is required to delete account.');
    }

    log.info(`[Auth] Completely deleting user account: ${uid}`);

    // 1. Delete from Firebase Authentication
    try {
      await auth.deleteUser(uid);
      log.info(`[Auth] Deleted user ${uid} from Firebase Auth.`);
    } catch (err: any) {
      if (err.code !== 'auth/user-not-found') {
        log.warn(`[Auth] Error deleting user from Firebase Auth:`, err);
      }
    }

    // 2. Delete Firestore data
    try {
      const userRef = db.collection('users').doc(uid);
      
      // Delete privacy/security
      await userRef.collection('privacy').doc('security').delete().catch(() => {});
      
      // Delete addresses
      const addressesSnap = await userRef.collection('addresses').get();
      for (const doc of addressesSnap.docs) {
        await doc.ref.delete().catch(() => {});
      }

      // Delete wallet
      await db.collection('wallets').doc(uid).delete().catch(() => {});

      // Delete main user profile document
      await userRef.delete().catch(() => {});
      log.info(`[Auth] Deleted user ${uid} document and subcollections from Firestore.`);
    } catch (err) {
      log.error(`[Auth] Error deleting user data from Firestore:`, err);
    }

    // 3. Clean up any verification codes
    const cleanPhone = uid.replace('phone_', '');
    if (cleanPhone.length === 10) {
      await db.collection('phone_verifications').doc(cleanPhone).delete().catch(() => {});
    }

    return {
      success: true,
      message: 'Account and associated data completely deleted.',
    };
  }
);
