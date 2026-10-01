import { httpsCallable } from 'firebase/functions';
import { functions } from '../config';

export interface InAppNotification {
  id: string;
  category: string;
  title: string;
  body: string;
  payload: Record<string, any>;
  readAt: string | null;
  createdAt: string | null;
}

/**
 * Registers an FCM push notification token for this device with the user's account.
 */
export async function registerDeviceToken(params: {
  deviceId: string;
  pushToken: string;
  platform?: 'ios' | 'android' | 'web';
}): Promise<{ success: boolean }> {
  const call = httpsCallable<typeof params, { success: boolean }>(functions, 'registerDevice');
  const res = await call({
    platform: 'android',
    ...params,
  });
  return res.data;
}

/**
 * Revokes / unregisters a device token on sign-out.
 */
export async function unregisterDevice(deviceId: string): Promise<{ success: boolean }> {
  const call = httpsCallable<{ deviceId: string }, { success: boolean }>(functions, 'unregisterDevice');
  const res = await call({ deviceId });
  return res.data;
}

/**
 * Fetches the user's in-app notification inbox from Cloud Functions.
 */
export async function fetchNotifications(params?: {
  limit?: number;
  cursor?: string;
}): Promise<{ notifications: InAppNotification[]; nextCursor: string | null }> {
  const call = httpsCallable<typeof params, { notifications: InAppNotification[]; nextCursor: string | null }>(
    functions,
    'listNotifications'
  );
  const res = await call(params || { limit: 20 });
  return res.data;
}

/**
 * Marks an in-app notification as read.
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
  const call = httpsCallable<{ notificationId: string }, { success: boolean }>(
    functions,
    'markNotificationRead'
  );
  const res = await call({ notificationId });
  return res.data;
}
