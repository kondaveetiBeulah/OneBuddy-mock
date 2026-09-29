import { onUserCreated as onUserCreatedV2 } from 'firebase-functions/v2/identity';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from '../core/firebase';
import { secureCallable } from '../core/callable';
import { log } from '../core/logger';

/**
 * TRIGGER: Automatically creates a profile document when a user signs up.
 * This runs in the background (2nd Gen) instantly after Firebase Auth creates the account.
 */
export const onUserCreated = onUserCreatedV2(async (event) => {
  const user = event.data;
  if (!user || !user.uid) return;
  log.info(`Creating profile for new user: ${user.uid}`);

  const profileRef = db.collection('users').doc(user.uid);
  
  const initialData: Record<string, any> = {
    uid: user.uid,
    displayName: user.displayName || null,
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    accountStatus: 'active',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await profileRef.set(initialData, { merge: true });

  // Create default security preferences
  await profileRef.collection('privacy').doc('security').set({
    biometric: true,
    verifiedProfile: true,
    familySharing: false,
    emergencyContact: '',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Create default wallet
  await db.collection('wallets').doc(user.uid).set({
    balance: 0,
    balanceMinor: 0,
    currency: 'INR',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  log.info(`Successfully created profile and defaults for ${user.uid}`);
});

/**
 * CALLABLE: Allows a user to securely update their own profile from the app.
 * Note: Privileged accountStatus values ('active', 'suspended', 'deleted') cannot be changed by clients.
 * Users are only permitted to set 'deletion_requested'.
 */
const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  name: z.string().min(2).max(100).optional(),
  phoneNumber: z.string().optional(),
  phone: z.string().optional(),
  phoneE164: z.string().optional(),
  accountStatus: z.enum(['deletion_requested']).optional(),
});

export const updateProfile = secureCallable(
  updateProfileSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const profileRef = db.collection('users').doc(uid);

    log.info(`User ${uid} is updating their profile`, data);

    const displayName = data.displayName || data.name;
    const phone = data.phoneNumber || data.phone || data.phoneE164;

    const updates: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (displayName !== undefined) updates.displayName = displayName;
    if (phone !== undefined) updates.phoneNumber = phone;
    if (data.accountStatus === 'deletion_requested') {
      updates.accountStatus = 'deletion_requested';
    }

    await profileRef.set(updates, { merge: true });

    return { success: true, message: 'Profile updated successfully' };
  }
);
