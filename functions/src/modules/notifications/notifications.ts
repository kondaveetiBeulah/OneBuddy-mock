import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../common/firebase';
import { secureCallable } from '../../common/auth';
import { log } from '../../common/logging';

// ----------------------------------------------------------------------------
// 1. REGISTER DEVICE
// ----------------------------------------------------------------------------

const registerDeviceSchema = z.object({
  deviceId: z.string().min(1),
  pushToken: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']).default('android'),
});

export const registerDevice = secureCallable(
  registerDeviceSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const deviceRef = db.collection('users').doc(uid).collection('devices').doc(data.deviceId);

    // 1. Disassociate pushToken if active on another user's device record
    try {
      const staleDocsSnap = await db
        .collectionGroup('devices')
        .where('pushToken', '==', data.pushToken)
        .where('revokedAt', '==', null)
        .get();

      if (!staleDocsSnap.empty) {
        const batch = db.batch();
        let count = 0;
        staleDocsSnap.docs.forEach((d) => {
          if (!d.ref.path.includes(`/users/${uid}/`)) {
            batch.update(d.ref, {
              revokedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
            count++;
          }
        });
        if (count > 0) {
          await batch.commit();
          log.info(`[RegisterDevice] Revoked ${count} stale token binding(s) from other user accounts`);
        }
      }
    } catch (disassociateErr) {
      log.warn(`[RegisterDevice] Token disassociation note for user ${uid}:`, disassociateErr);
    }

    // 2. Write device registration payload (preserving/setting createdAt)
    const snap = await deviceRef.get();
    const isNew = !snap.exists;

    const payload: Record<string, any> = {
      deviceId: data.deviceId,
      pushToken: data.pushToken,
      platform: data.platform,
      lastSeenAt: FieldValue.serverTimestamp(),
      revokedAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdAt = FieldValue.serverTimestamp();
    }

    await deviceRef.set(payload, { merge: true });

    log.info(`User ${uid} registered device ${data.deviceId} (${data.platform})`);
    return { success: true, deviceId: data.deviceId };
  }
);

// ----------------------------------------------------------------------------
// 2. UNREGISTER DEVICE
// ----------------------------------------------------------------------------

const unregisterDeviceSchema = z.object({
  deviceId: z.string().optional(),
  pushToken: z.string().optional(),
}).refine((data) => data.deviceId || data.pushToken, {
  message: 'Either deviceId or pushToken must be provided.',
});

export const unregisterDevice = secureCallable(
  unregisterDeviceSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const userDevicesRef = db.collection('users').doc(uid).collection('devices');
    let revokedCount = 0;

    // 1. Revoke by deviceId if provided
    if (data.deviceId) {
      const deviceRef = userDevicesRef.doc(data.deviceId);
      await deviceRef.set({
        revokedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      revokedCount++;
    }

    // 2. Revoke by pushToken if provided
    if (data.pushToken) {
      const snap = await userDevicesRef.where('pushToken', '==', data.pushToken).get();
      if (!snap.empty) {
        const batch = db.batch();
        snap.docs.forEach((d) => {
          batch.update(d.ref, {
            revokedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          revokedCount++;
        });
        await batch.commit();
      }
    }

    log.info(`User ${uid} unregistered device (deviceId: ${data.deviceId || 'N/A'}, pushToken: ${data.pushToken ? 'provided' : 'N/A'})`);
    return { success: true, count: revokedCount };
  }
);

// ----------------------------------------------------------------------------
// 3. LIST NOTIFICATIONS (Paginated user inbox)
// ----------------------------------------------------------------------------

const listNotificationsSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  unreadOnly: z.boolean().default(false),
});

export const listNotifications = secureCallable(
  listNotificationsSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    let query = db
      .collection('notifications')
      .where('userId', '==', uid);

    if (data.unreadOnly) {
      query = query.where('readAt', '==', null);
    }

    query = query.orderBy('createdAt', 'desc').limit(data.limit);

    if (data.cursor) {
      const cursorDoc = await db.collection('notifications').doc(data.cursor).get();
      if (cursorDoc.exists && cursorDoc.data()?.userId === uid) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const notifications = snap.docs.map((d) => {
      const item = d.data();
      return {
        id: d.id,
        category: item.category || 'general',
        title: item.title,
        body: item.body,
        payload: item.payload || {},
        isRead: !!item.readAt,
        readAt: item.readAt ? (item.readAt.toDate ? item.readAt.toDate().toISOString() : item.readAt) : null,
        createdAt: item.createdAt ? (item.createdAt.toDate ? item.createdAt.toDate().toISOString() : item.createdAt) : null,
      };
    });

    const unreadSnap = await db
      .collection('notifications')
      .where('userId', '==', uid)
      .where('readAt', '==', null)
      .get();

    const nextCursor = snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return {
      notifications,
      unreadCount: unreadSnap.size,
      nextCursor,
    };
  }
);

// ----------------------------------------------------------------------------
// 4. MARK NOTIFICATION READ
// ----------------------------------------------------------------------------

const markNotificationReadSchema = z.object({
  notificationId: z.string().optional(),
  notificationIds: z.array(z.string()).optional(),
  markAllRead: z.boolean().default(false),
}).refine((data) => data.notificationId || (data.notificationIds && data.notificationIds.length > 0) || data.markAllRead, {
  message: 'Must provide notificationId, notificationIds array, or markAllRead: true.',
});

export const markNotificationRead = secureCallable(
  markNotificationReadSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const now = FieldValue.serverTimestamp();

    if (data.markAllRead) {
      const unreadSnap = await db
        .collection('notifications')
        .where('userId', '==', uid)
        .where('readAt', '==', null)
        .get();

      if (!unreadSnap.empty) {
        const batch = db.batch();
        unreadSnap.docs.forEach((doc) => {
          batch.update(doc.ref, { readAt: now });
        });
        await batch.commit();
      }

      log.info(`User ${uid} marked all (${unreadSnap.size}) notifications as read`);
      return { success: true, updatedCount: unreadSnap.size, unreadCount: 0 };
    }

    const idsToUpdate = new Set<string>();
    if (data.notificationId) idsToUpdate.add(data.notificationId);
    if (data.notificationIds) data.notificationIds.forEach((id) => idsToUpdate.add(id));

    const batch = db.batch();
    let updatedCount = 0;

    for (const notifId of idsToUpdate) {
      const notifRef = db.collection('notifications').doc(notifId);
      const snap = await notifRef.get();
      if (snap.exists && snap.data()?.userId === uid) {
        if (!snap.data()?.readAt) {
          batch.update(notifRef, { readAt: now });
          updatedCount++;
        }
      }
    }

    if (updatedCount > 0) {
      await batch.commit();
    }

    const remainingUnreadSnap = await db
      .collection('notifications')
      .where('userId', '==', uid)
      .where('readAt', '==', null)
      .get();

    log.info(`User ${uid} marked ${updatedCount} notification(s) as read`);
    return {
      success: true,
      updatedCount,
      unreadCount: remainingUnreadSnap.size,
    };
  }
);
