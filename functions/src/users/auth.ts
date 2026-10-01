import { z } from 'zod';
import { defineSecret } from 'firebase-functions/params';
import { db, auth, admin } from '../core/firebase';
import { publicCallable, secureCallable } from '../core/callable';
import { log, throwError } from '../core/logger';

const fast2smsApiKey = defineSecret('FAST2SMS_API_KEY');

/**
 * In-memory fallback OTP storage to guarantee SMS verification resilience
 */
interface OtpEntry {
  phone: string;
  otp: string;
  attempts: number;
  sentAt: number;
  expiresAt: number;
}
const inMemoryOtpStore = new Map<string, OtpEntry>();

/**
 * Dispatch SMS directly from the backend via Fast2SMS gateway.
 * Kept secure on backend/Cloud Functions only.
 */
async function sendSmsViaFast2Sms(phone: string, message: string): Promise<void> {
  const apiKey = fast2smsApiKey.value() || process.env.FAST2SMS_API_KEY || '';
  if (!apiKey) {
    log.warn('[Fast2SMS] Missing FAST2SMS_API_KEY secret.');
  }

  const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(
    apiKey
  )}&route=q&message=${encodeURIComponent(message)}&language=english&flash=0&numbers=${encodeURIComponent(
    phone
  )}&_t=${Date.now()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'cache-control': 'no-cache',
    },
  });

  const data = (await response.json().catch(() => ({}))) as {
    return?: boolean;
    message?: string | string[];
    status_code?: number;
  };

  log.info(`[Fast2SMS] API response for ${phone}:`, data);

  if (data && data.return === false) {
    const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    log.warn(`[Fast2SMS] Error response: ${msg || 'Rejected'}`);
    throwError('internal', msg || 'SMS gateway could not send the verification code.');
  }
}

/**
 * Clean phone number to 10 digits
 */
function sanitizePhone(raw: string): string {
  let clean = raw.replace(/\D/g, '');
  if (clean.length === 12 && clean.startsWith('91')) {
    clean = clean.slice(2);
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = clean.slice(1);
  }
  return clean.slice(-10);
}

/**
 * CALLABLE: sendMobileOtp
 * Generates an OTP, stores it in Firestore & memory with expiration, and sends SMS via Fast2SMS.
 */
const sendMobileOtpSchema = z.object({
  phone: z.string().min(10).max(20),
  type: z.string().optional().nullable(),
}).strict();

export const sendMobileOtp = publicCallable(
  sendMobileOtpSchema,
  async (data) => {
    const cleanPhone = sanitizePhone(data.phone);

    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      throwError('invalid-argument', 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
    }

    const now = Date.now();
    const otpDocRef = db.collection('otp_verifications').doc(cleanPhone);

    // Check cooldown
    let lastSent = 0;
    try {
      const existingSnap = await otpDocRef.get();
      if (existingSnap.exists) {
        const existing = existingSnap.data();
        if (existing?.sentAt?.toMillis) {
          lastSent = existing.sentAt.toMillis();
        } else if (existing?.sentAt) {
          lastSent = new Date(existing.sentAt).getTime();
        }
      }
    } catch (e) {
      log.warn('[Auth] Firestore get note (using memory store):', e);
      const mem = inMemoryOtpStore.get(cleanPhone);
      if (mem) lastSent = mem.sentAt;
    }

    if (now - lastSent < 25000) {
      throwError('resource-exhausted', 'Please wait 30 seconds before requesting a new OTP.');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    // Save in memory store
    inMemoryOtpStore.set(cleanPhone, {
      phone: cleanPhone,
      otp,
      attempts: 0,
      sentAt: now,
      expiresAt,
    });

    // Save in Firestore with serverTimestamp
    try {
      await otpDocRef.set({
        phone: cleanPhone,
        otp,
        attempts: 0,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromMillis(expiresAt),
      });
    } catch (e) {
      log.warn('[Auth] Firestore otp write warning (memory store active):', e);
    }

    log.info(`[Auth] Dispatched Fast2SMS OTP for ${cleanPhone}`);

    const smsMessage = `Your OneBuddy verification code is ${otp}. Please do not share this OTP with anyone.`;
    try {
      await sendSmsViaFast2Sms(cleanPhone, smsMessage);
    } catch (err: any) {
      log.error(`[Auth] Failed to send SMS via Fast2SMS to ${cleanPhone}`, err);
      throwError('internal', err.message || 'Could not send verification code via SMS.');
    }

    return {
      success: true,
      message: 'Verification code sent successfully.',
      phone: cleanPhone,
    };
  },
  { secrets: [fast2smsApiKey] }
);

/**
 * CALLABLE: verifyMobileOtp
 * Verifies the OTP, manages Firebase Auth identity (phone + email),
 * sets up profile in Firestore with ONLY standard fields, and returns Custom Auth Token.
 */
const verifyMobileOtpSchema = z.object({
  phone: z.string().min(10).max(20),
  otp: z.string().min(4).max(10),
  isSignUp: z.boolean().optional().default(false),
  fullName: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
}).strict();

export const verifyMobileOtp = publicCallable(
  verifyMobileOtpSchema,
  async (data) => {
    const cleanPhone = sanitizePhone(data.phone);

    if (cleanPhone.length !== 10) {
      throwError('invalid-argument', 'Please enter a valid 10-digit mobile number.');
    }

    const now = Date.now();
    const otpDocRef = db.collection('otp_verifications').doc(cleanPhone);
    
    // Look up verification record in Firestore or fallback to memory
    let verification: { otp: string; attempts: number; expiresAt: number } | null = null;

    try {
      const snap = await otpDocRef.get();
      if (snap.exists) {
        const d = snap.data()!;
        verification = {
          otp: d.otp,
          attempts: d.attempts || 0,
          expiresAt: typeof d.expiresAt?.toMillis === 'function'
            ? d.expiresAt.toMillis()
            : typeof d.expiresAt === 'number'
              ? d.expiresAt
              : new Date(d.expiresAt).getTime(),
        };
      }
    } catch (e) {
      log.warn('[Auth] Firestore get verification note (checking memory store):', e);
    }

    if (!verification) {
      const mem = inMemoryOtpStore.get(cleanPhone);
      if (mem) {
        verification = {
          otp: mem.otp,
          attempts: mem.attempts,
          expiresAt: mem.expiresAt,
        };
      }
    }

    if (!verification) {
      throwError('not-found', 'Please request an OTP first.');
    }

    if (now > verification.expiresAt) {
      otpDocRef.delete().catch(() => {});
      inMemoryOtpStore.delete(cleanPhone);
      throwError('failed-precondition', 'OTP has expired. Please request a new one.');
    }

    if (verification.attempts >= 5) {
      otpDocRef.delete().catch(() => {});
      inMemoryOtpStore.delete(cleanPhone);
      throwError('resource-exhausted', 'Too many incorrect attempts. Please request a new OTP.');
    }

    const isMatch = verification.otp === data.otp;
    if (!isMatch) {
      const newAttempts = verification.attempts + 1;
      otpDocRef.update({ attempts: newAttempts }).catch(() => {});
      const mem = inMemoryOtpStore.get(cleanPhone);
      if (mem) mem.attempts = newAttempts;
      throwError('invalid-argument', 'Invalid verification code. Please try again.');
    }

    // OTP verification succeeded -> delete verification record
    otpDocRef.delete().catch(() => {});
    inMemoryOtpStore.delete(cleanPhone);

    const formattedPhone = `+91${cleanPhone}`;
    const cleanEmail = data.email?.trim() ? data.email.trim().toLowerCase() : '';

    if (data.isSignUp) {
      // 1. Validate mandatory fields for signup
      const displayName = data.fullName?.trim();
      if (!displayName) {
        throwError('invalid-argument', 'Full name is required to complete signup.');
      }

      // 2. Check if user already exists in Firestore by phoneNumber or phoneE164
      try {
        const existingByPhone = await db.collection('users')
          .where('phoneNumber', '==', cleanPhone)
          .get();
        let activeDoc = existingByPhone.docs.find(d => d.data().accountStatus === 'active');
        if (!activeDoc) {
          const existingByE164 = await db.collection('users')
            .where('phoneE164', '==', formattedPhone)
            .get();
          activeDoc = existingByE164.docs.find(d => d.data().accountStatus === 'active');
        }
        if (activeDoc) {
          throwError('already-exists', 'An account with this mobile number already exists. Please login instead.');
        }
      } catch (e: any) {
        if (e?.code === 'already-exists') throw e;
        log.warn('[Auth] Firestore user lookup note:', e);
      }

      // 3. Create or update Firebase Auth user with phone number and email
      let authUser: any;
      try {
        authUser = await auth.getUserByPhoneNumber(formattedPhone);
        await auth.updateUser(authUser.uid, {
          displayName,
          phoneNumber: formattedPhone,
          ...(cleanEmail ? { email: cleanEmail } : {}),
          disabled: false,
        });
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          if (cleanEmail) {
            try {
              authUser = await auth.getUserByEmail(cleanEmail);
              await auth.updateUser(authUser.uid, {
                displayName,
                phoneNumber: formattedPhone,
                email: cleanEmail,
                disabled: false,
              });
            } catch (err: any) {
              if (err.code === 'auth/user-not-found') {
                authUser = await auth.createUser({
                  phoneNumber: formattedPhone,
                  displayName,
                  email: cleanEmail,
                });
              } else {
                throw err;
              }
            }
          } else {
            authUser = await auth.createUser({
              phoneNumber: formattedPhone,
              displayName,
            });
          }
        } else {
          throw e;
        }
      }

      const targetUid = authUser.uid;

      // 4. Save EXACT fields matching standard format to Firestore (ONLY 7 fields, Timestamp types)
      try {
        await db.collection('users').doc(targetUid).set({
          accountStatus: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          displayName,
          email: cleanEmail,
          phoneNumber: cleanPhone,
          phoneE164: formattedPhone,
          uid: targetUid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 5. Initialize wallet and security preferences
        await db.collection('wallets').doc(targetUid).set({
          userId: targetUid,
          balanceMinor: 0,
          currency: 'INR',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        await db.collection('users').doc(targetUid).collection('privacy').doc('security').set({
          biometric: true,
          verifiedProfile: true,
          familySharing: false,
          emergencyContact: '',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        log.warn('[Auth] Firestore profile write note:', e);
      }

      // 6. Generate Custom Token
      const customToken = await auth.createCustomToken(targetUid, {
        phoneNumber: cleanPhone,
        ...(cleanEmail ? { email: cleanEmail } : {}),
      });

      log.info(`[Auth] Successful registration for ${targetUid} (${cleanPhone})`);

      return {
        success: true,
        customToken,
        uid: targetUid,
        isSignUp: true,
      };
    } else {
      // Login flow
      let targetUid: string | null = null;
      try {
        const existingByPhone = await db.collection('users')
          .where('phoneNumber', '==', cleanPhone)
          .get();
        let activeDoc = existingByPhone.docs.find(d => d.data().accountStatus === 'active');
        if (!activeDoc) {
          const existingByE164 = await db.collection('users')
            .where('phoneE164', '==', formattedPhone)
            .get();
          activeDoc = existingByE164.docs.find(d => d.data().accountStatus === 'active');
        }
        if (activeDoc) {
          targetUid = activeDoc.id;
          if (!activeDoc.data().phoneE164) {
            activeDoc.ref.set({ phoneE164: formattedPhone }, { merge: true }).catch(() => {});
          }
        }
      } catch (e) {
        log.warn('[Auth] Firestore login check note:', e);
      }

      // Ensure Firebase Auth account exists
      let authUser: any;
      try {
        authUser = await auth.getUserByPhoneNumber(formattedPhone);
        targetUid = authUser.uid;
      } catch (e: any) {
        if (!targetUid) {
          throwError('not-found', 'No registered account found with this number. Please sign up first.');
        }
        authUser = await auth.createUser({
          phoneNumber: formattedPhone,
        });
        targetUid = authUser.uid;
      }

      const finalUid: string = targetUid || authUser.uid;

      // Mint Firebase Custom Token
      const customToken = await auth.createCustomToken(finalUid, {
        phoneNumber: cleanPhone,
      });

      log.info(`[Auth] Successful login for ${finalUid} (${cleanPhone})`);

      return {
        success: true,
        customToken,
        uid: finalUid,
        isSignUp: false,
      };
    }
  }
);

/**
 * CALLABLE: deleteUserAccount
 * Completely deletes the Firebase Authentication account and cleans related user data from Firestore.
 */
export const deleteUserAccount = secureCallable(
  z.object({}).strict().optional(),
  async (_data, context) => {
    const uid = context.auth.uid;
    log.info(`[Auth] Completely deleting user account: ${uid}`);

    // 1. Delete user from Firebase Authentication
    try {
      await auth.deleteUser(uid);
      log.info(`[Auth] Firebase Auth user deleted for ${uid}`);
    } catch (err: any) {
      log.warn(`[Auth] Firebase Auth deleteUser note:`, err);
    }

    // 2. Completely delete user document from Firestore (no leftover fields)
    try {
      await db.collection('users').doc(uid).delete();
      await db.collection('wallets').doc(uid).delete().catch(() => {});
      await db.collection('users').doc(uid).collection('privacy').doc('security').delete().catch(() => {});
      log.info(`[Auth] Firestore document completely deleted for user ${uid}`);
    } catch (err) {
      log.error(`[Auth] Error deleting Firestore user ${uid}`, err);
    }

    return {
      success: true,
      message: 'User account and associated data completely deleted.',
    };
  }
);
