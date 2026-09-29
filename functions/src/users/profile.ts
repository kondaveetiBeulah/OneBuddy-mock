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
 * Only customer-editable attributes (displayName, phoneNumber, photoURL) can be updated.
 * Privileged lifecycle fields (accountStatus, uid, createdAt) cannot be modified here.
 */
const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  name: z.string().min(2).max(100).optional(),
  phoneNumber: z.string().optional(),
  phone: z.string().optional(),
  phoneE164: z.string().optional(),
  photoURL: z.string().url().optional(),
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
    if (data.photoURL !== undefined) updates.photoURL = data.photoURL;

    await profileRef.set(updates, { merge: true });

    return { success: true, message: 'Profile updated successfully' };
  }
);

/**
 * CALLABLE: Dedicated privileged endpoint for requesting account deletion.
 * Sets accountStatus to 'deletion_requested' under controlled server flow.
 */
export const requestAccountDeletion = secureCallable(
  z.object({
    reason: z.string().max(500).optional(),
  }),
  async (data, context) => {
    const uid = context.auth.uid;
    log.info(`User ${uid} requested account deletion: ${data.reason || 'No reason provided'}`);

    await db.collection('users').doc(uid).set(
      {
        accountStatus: 'deletion_requested',
        deletionRequestedAt: FieldValue.serverTimestamp(),
        deletionReason: data.reason || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      success: true,
      message: 'Account deletion request submitted successfully.',
    };
  }
);

