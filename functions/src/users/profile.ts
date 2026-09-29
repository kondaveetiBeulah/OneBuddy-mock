import { z } from 'zod';
import { db, admin } from '../core/firebase';
import { secureCallable } from '../core/callable';
import { log } from '../core/logger';

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
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (displayName !== undefined) updates.displayName = displayName;
    if (phone !== undefined) updates.phoneNumber = phone;
    if (data.accountStatus !== undefined) updates.accountStatus = data.accountStatus;

    await profileRef.set(updates, { merge: true });

    return { success: true, message: 'Profile updated successfully' };
  }
);
