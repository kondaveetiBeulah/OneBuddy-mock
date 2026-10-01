import { FieldValue } from 'firebase-admin/firestore';
import { db, admin } from '../core/firebase';
import { log } from '../core/logger';

export interface PushNotificationPayload {
  title: string;
  body: string;
  category?: string;
  data?: Record<string, any>;
}

/**
 * Sends FCM push notification to target device tokens with APNs/Android configs, data sanitization,
 * 500-token batching, and invalid token cleanup.
 */
export async function sendFcmPushNotification(
  tokens: string[],
  payload: PushNotificationPayload,
  notificationId?: string,
  tokenDocMap?: Map<string, FirebaseFirestore.DocumentReference>
): Promise<{ successCount: number; failureCount: number }> {
  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  // 1. Sanitize all entries in data object to strings ONLY (required by FCM)
  const stringifiedData: Record<string, string> = {};
  if (payload.data) {
    for (const [key, value] of Object.entries(payload.data)) {
      if (value !== undefined && value !== null) {
        stringifiedData[key] = typeof value === 'string' ? value : JSON.stringify(value);
      }
    }
  }
  if (notificationId) {
    stringifiedData.notificationId = notificationId;
  }
  stringifiedData.category = payload.category || 'general';

  // 2. Chunk tokens into batches of 500 (FCM multicast cap)
  const BATCH_SIZE = 500;
  let totalSuccess = 0;
  let totalFailure = 0;
  const now = FieldValue.serverTimestamp();

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const tokenBatch = tokens.slice(i, i + BATCH_SIZE);

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: tokenBatch,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: stringifiedData,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'high_importance_channel',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
        },
      });

      totalSuccess += response.successCount;
      totalFailure += response.failureCount;

      // Handle stale / invalid tokens cleanup
      if (response.failureCount > 0 && tokenDocMap) {
        const cleanupBatch = db.batch();
        let cleanupCount = 0;

        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const errCode = resp.error.code;
            if (
              errCode === 'messaging/invalid-registration-token' ||
              errCode === 'messaging/registration-token-not-registered'
            ) {
              const badToken = tokenBatch[idx];
              const docRef = tokenDocMap.get(badToken);
              if (docRef) {
                cleanupBatch.update(docRef, { revokedAt: now, updatedAt: now });
                cleanupCount++;
              }
            }
          }
        });

        if (cleanupCount > 0) {
          await cleanupBatch.commit().catch((err) => {
            log.warn('[NotificationDispatcher] Stale device token cleanup note:', err);
          });
        }
      }
    } catch (batchErr: any) {
      log.warn('[NotificationDispatcher] Error sending multicast push batch:', batchErr?.message || batchErr);
    }
  }

  return { successCount: totalSuccess, failureCount: totalFailure };
}

/**
 * Dispatches an in-app notification (persisted to Firestore `notifications/{notificationId}`)
 * AND sends an FCM push notification to all active devices registered under `users/{uid}/devices`.
 */
export async function sendNotificationToUser(
  uid: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; inAppId: string; fcmCount: number }> {
  const notifRef = db.collection('notifications').doc();
  const now = FieldValue.serverTimestamp();

  // 1. Create durable in-app notification record
  await notifRef.set({
    id: notifRef.id,
    userId: uid,
    category: payload.category || 'general',
    title: payload.title,
    body: payload.body,
    payload: payload.data || {},
    readAt: null,
    createdAt: now,
  });

  log.info(`[NotificationDispatcher] Created in-app notification ${notifRef.id} for user ${uid}`);

  // 2. Fetch user's registered devices
  let fcmCount = 0;
  try {
    const devicesSnap = await db.collection('users').doc(uid).collection('devices').get();
    const tokens: string[] = [];
    const tokenDocMap = new Map<string, FirebaseFirestore.DocumentReference>();

    devicesSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (data?.pushToken && !data?.revokedAt) {
        tokens.push(data.pushToken);
        tokenDocMap.set(data.pushToken, docSnap.ref);
      }
    });

    if (tokens.length > 0) {
      log.info(`[NotificationDispatcher] Dispatching FCM push to ${tokens.length} device(s) for user ${uid}`);
      const fcmRes = await sendFcmPushNotification(tokens, payload, notifRef.id, tokenDocMap);
      fcmCount = fcmRes.successCount;
    }
  } catch (err: any) {
    log.warn(`[NotificationDispatcher] FCM dispatch warning for user ${uid}:`, err?.message || err);
  }

  return {
    success: true,
    inAppId: notifRef.id,
    fcmCount,
  };
}
