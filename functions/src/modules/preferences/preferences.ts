import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../common/firebase';
import { secureCallable } from '../../common/auth';
import { log } from '../../common/logging';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const serviceModeSchema = z.enum([
  'Express',
  'Scheduled',
  'Fast',
  'Economy',
  'Premium',
  'Priority',
]);

const serviceItemSchema = z.object({
  enabled: z.boolean(),
  mode: serviceModeSchema,
}).strict();

export const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['en', 'hi', 'te']).optional(),
  locationAccess: z.boolean().optional(),
  shareUsageData: z.boolean().optional(),
  usageHistory: z.array(z.string()).optional(),
}).strict();

export const updateServicePreferencesSchema = z.object({
  services: z.object({
    food: serviceItemSchema.optional(),
    grocery: serviceItemSchema.optional(),
    rides: serviceItemSchema.optional(),
    homeServices: serviceItemSchema.optional(),
    care: serviceItemSchema.optional(),
  }).strict().optional(),
  globalToggles: z.object({
    autoReorder: z.boolean().optional(),
    contactlessDrop: z.boolean().optional(),
    ecoBagsOnly: z.boolean().optional(),
  }).strict().optional(),
}).strict();

const notificationCategorySchema = z.enum([
  'food',
  'groceries',
  'rides',
  'health',
  'homeServices',
]);

export const updateNotificationPreferencesSchema = z.object({
  categories: z.record(notificationCategorySchema, z.record(z.string(), z.boolean())).optional(),
}).strict();

// ---------------------------------------------------------------------------
// Callables
// ---------------------------------------------------------------------------

/**
 * CALLABLE: getPreferences
 * Consolidated read for settings, service preferences, and notifications.
 * Returns canonical Greenfield defaults if any document is not yet initialized.
 */
export const getPreferences = secureCallable(
  z.object({}).strict().optional(),
  async (_data, context) => {
    const uid = context.auth.uid;
    const prefRef = db.collection('users').doc(uid).collection('preferences');

    log.info(`[getPreferences] Fetching preferences for UID: ${uid}`);

    const [settingsSnap, serviceSnap, notificationsSnap] = await Promise.all([
      prefRef.doc('settings').get(),
      prefRef.doc('service').get(),
      prefRef.doc('notifications').get(),
    ]);

    const settingsData = settingsSnap.data() || {};
    const serviceData = serviceSnap.data() || {};
    const notificationsData = notificationsSnap.data() || {};

    return {
      settings: {
        theme: settingsData.theme || 'system',
        language: settingsData.language || 'en',
        locationAccess: settingsData.locationAccess ?? true,
        shareUsageData: settingsData.shareUsageData ?? true,
        usageHistory: settingsData.usageHistory || [],
        updatedAt: settingsData.updatedAt?.toMillis ? settingsData.updatedAt.toMillis() : Date.now(),
      },
      service: {
        services: serviceData.services || {
          food: { enabled: true, mode: 'Express' },
          grocery: { enabled: true, mode: 'Fast' },
          rides: { enabled: true, mode: 'Economy' },
          homeServices: { enabled: true, mode: 'Scheduled' },
          care: { enabled: true, mode: 'Priority' },
        },
        globalToggles: serviceData.globalToggles || {
          autoReorder: false,
          contactlessDrop: true,
          ecoBagsOnly: false,
        },
        updatedAt: serviceData.updatedAt?.toMillis ? serviceData.updatedAt.toMillis() : Date.now(),
      },
      notifications: {
        categories: notificationsData.categories || {
          food: {},
          groceries: {},
          rides: {},
          health: {},
          homeServices: {},
        },
        updatedAt: notificationsData.updatedAt?.toMillis ? notificationsData.updatedAt.toMillis() : Date.now(),
      },
    };
  }
);

/**
 * CALLABLE: updateSettings
 * Updates user settings preferences with strict schema validation.
 */
export const updateSettings = secureCallable(
  updateSettingsSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const docRef = db.collection('users').doc(uid).collection('preferences').doc('settings');

    log.info(`[updateSettings] Updating settings for UID: ${uid}`, data);

    await docRef.set(
      {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, message: 'Settings updated successfully' };
  }
);

/**
 * CALLABLE: updateServicePreferences
 * Updates per-service delivery modes and global fulfillment toggles.
 */
export const updateServicePreferences = secureCallable(
  updateServicePreferencesSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const docRef = db.collection('users').doc(uid).collection('preferences').doc('service');

    log.info(`[updateServicePreferences] Updating service preferences for UID: ${uid}`, data);

    await docRef.set(
      {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, message: 'Service preferences updated successfully' };
  }
);

/**
 * CALLABLE: updateNotificationPreferences
 * Updates notification category toggles.
 */
export const updateNotificationPreferences = secureCallable(
  updateNotificationPreferencesSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const docRef = db.collection('users').doc(uid).collection('preferences').doc('notifications');

    log.info(`[updateNotificationPreferences] Updating notification preferences for UID: ${uid}`, data);

    await docRef.set(
      {
        categories: data.categories,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, message: 'Notification preferences updated successfully' };
  }
);

