import * as functionsV1 from 'firebase-functions/v1';
import { z } from 'zod';
import { db } from '../core/firebase';
import { secureCallable } from '../core/callable';
import { log } from '../core/logger';

/**
 * TRIGGER: Automatically creates a profile document when a user signs up.
 * This runs in the background instantly after Firebase Auth creates the account.
 */
export const onUserCreated = functionsV1.auth.user().onCreate(async (user) => {
  log.info(`Creating profile for new user: ${user.uid}`);

  const profileRef = db.collection('users').doc(user.uid);
  const now = new Date().toISOString();
  
  const initialData: Record<string, any> = {
    uid: user.uid,
    displayName: user.displayName || null,
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    accountStatus: 'active',
    createdAt: now,
    updatedAt: now,
  };

  await profileRef.set(initialData, { merge: true });

  // Create default security preferences
  await profileRef.collection('privacy').doc('security').set({
    biometric: true,
    verifiedProfile: true,
    familySharing: false,
    emergencyContact: '',
    updatedAt: now,
  }, { merge: true });

  // Create default wallet
  await db.collection('wallets').doc(user.uid).set({
    balance: 0,
    currency: 'INR',
    updatedAt: now,
  }, { merge: true });

  log.info(`Successfully created profile and defaults for ${user.uid}`);
});

/**
 * CALLABLE: Allows a user to securely update their own profile from the app.
 */
const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  name: z.string().min(2).max(100).optional(),
  phoneNumber: z.string().optional(),
  phone: z.string().optional(),
  phoneE164: z.string().optional(),
  accountStatus: z.enum(['active', 'suspended', 'deletion_requested', 'deleted']).optional(),
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
      updatedAt: new Date().toISOString(),
    };

    if (displayName !== undefined) updates.displayName = displayName;
    if (phone !== undefined) updates.phoneNumber = phone;
    if (data.accountStatus !== undefined) updates.accountStatus = data.accountStatus;

    await profileRef.set(updates, { merge: true });

    return { success: true, message: 'Profile updated successfully' };
  }
);
