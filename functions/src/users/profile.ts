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
  
  await profileRef.set({
    uid: user.uid,
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    displayName: user.displayName || null,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Create default security preferences
  await profileRef.collection('privacy').doc('security').set({
    biometric: true,
    verifiedProfile: true,
    familySharing: false,
    emergencyContact: '',
    updatedAt: new Date().toISOString(),
  });

  // Create default wallet
  await db.collection('wallets').doc(user.uid).set({
    balance: 0,
    updatedAt: new Date().toISOString(),
  });

  log.info(`Successfully created profile and defaults for ${user.uid}`);
});

/**
 * CALLABLE: Allows a user to securely update their own profile from the app.
 */
const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  phoneNumber: z.string().min(10).max(15).optional(),
});

export const updateProfile = secureCallable(
  updateProfileSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const profileRef = db.collection('users').doc(uid);

    log.info(`User ${uid} is updating their profile`, data);

    await profileRef.update({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, message: 'Profile updated successfully' };
  }
);
