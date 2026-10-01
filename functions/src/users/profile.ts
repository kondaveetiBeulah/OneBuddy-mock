import { onUserCreated as onUserCreatedV2 } from 'firebase-functions/v2/identity';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db, admin } from '../core/firebase';
import { secureCallable } from '../core/callable';
import { log, throwError } from '../core/logger';

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
    familySharingEnabled: false,
    emergencyContact: '',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Create default wallet
  await db.collection('wallets').doc(user.uid).set({
    userId: user.uid,
    balanceMinor: 0,
    currency: 'INR',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  log.info(`Successfully created profile and defaults for ${user.uid}`);
});

/**
 * CALLABLE: Server-side authoritative version of ensureProfile.
 * Idempotently initializes the canonical user profile, default wallet (with balanceMinor: 0),
 * and default security preferences when a user logs in or signs up.
 * Returns the resolved UserProfile synchronously to the client.
 */
const ensureProfileSchema = z.object({
  displayName: z.string().min(1).max(100).nullish(),
  name: z.string().min(1).max(100).nullish(),
  email: z.string().nullish(),
  phoneNumber: z.string().nullish(),
  phone: z.string().nullish(),
  phoneE164: z.string().nullish(),
  photoURL: z.string().nullish(),
  dateOfBirth: z.string().nullish(),
  dob: z.string().nullish(),
}).strict();

export const ensureProfile = secureCallable(
  ensureProfileSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const profileRef = db.collection('users').doc(uid);
    const walletRef = db.collection('wallets').doc(uid);
    const securityRef = profileRef.collection('privacy').doc('security');

    log.info(`[ensureProfile] Ensuring profile for UID: ${uid}`);

    // Resolve identity inputs with verified auth claims
    const token = context.auth.token;
    const rawEmail = (data.email || token.email || '').trim().toLowerCase();
    const rawPhone = (data.phoneNumber || data.phone || data.phoneE164 || token.phone_number || '').trim();
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    const phoneE164 = cleanPhone ? `+91${cleanPhone}` : (token.phone_number || null);
    const rawDob = data.dateOfBirth || data.dob || null;

    let displayName = data.displayName || data.name || token.name || null;
    if (!displayName && rawEmail && rawEmail.includes('@')) {
      const handle = rawEmail.split('@')[0];
      displayName = handle.charAt(0).toUpperCase() + handle.slice(1);
    }
    if (!displayName) displayName = 'OneBuddy User';

    const resolvedPhotoURL = data.photoURL || token.picture || null;
    const now = FieldValue.serverTimestamp();

    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) {
      // 1. Initial Creation (Standard 7-field structure + dateOfBirth)
      const newProfile = {
        uid,
        displayName,
        email: rawEmail || null,
        phoneNumber: cleanPhone || null,
        phoneE164,
        photoURL: resolvedPhotoURL,
        dateOfBirth: rawDob,
        accountStatus: 'active',
        createdAt: now,
        updatedAt: now,
      };

      const batch = db.batch();
      batch.set(profileRef, newProfile, { merge: true });

      // Initialize default wallet with balanceMinor: 0
      batch.set(walletRef, {
        userId: uid,
        balanceMinor: 0,
        currency: 'INR',
        updatedAt: now,
      }, { merge: true });

      // Initialize default security preferences
      batch.set(securityRef, {
        biometric: true,
        verifiedProfile: true,
        familySharing: false,
        familySharingEnabled: false,
        emergencyContact: '',
        updatedAt: now,
      }, { merge: true });

      await batch.commit();

      log.info(`[ensureProfile] Created brand new profile & defaults for user ${uid}`);
      return {
        ...newProfile,
        dob: rawDob,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    // 2. Existing User: Update any missing fields idempotently
    const existing = profileSnap.data() || {};
    const updates: Record<string, any> = {};

    if (!existing.displayName && displayName) updates.displayName = displayName;
    if (!existing.email && rawEmail) updates.email = rawEmail;
    if (!existing.phoneNumber && cleanPhone) updates.phoneNumber = cleanPhone;
    if (!existing.phoneE164 && phoneE164) updates.phoneE164 = phoneE164;
    if (!existing.photoURL && resolvedPhotoURL) updates.photoURL = resolvedPhotoURL;
    if (!existing.dateOfBirth && rawDob) updates.dateOfBirth = rawDob;
    if (!existing.accountStatus) updates.accountStatus = 'active';

    // Check if wallet exists, create if missing
    const walletSnap = await walletRef.get();
    if (!walletSnap.exists) {
      await walletRef.set({
        userId: uid,
        balanceMinor: 0,
        currency: 'INR',
        updatedAt: now,
      }, { merge: true });
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = now;
      await profileRef.set(updates, { merge: true });
    }

    return {
      uid,
      displayName: updates.displayName || existing.displayName || displayName,
      email: updates.email || existing.email || rawEmail || null,
      phoneNumber: updates.phoneNumber || existing.phoneNumber || cleanPhone || null,
      phoneE164: updates.phoneE164 || existing.phoneE164 || phoneE164 || null,
      photoURL: updates.photoURL || existing.photoURL || resolvedPhotoURL || null,
      dateOfBirth: updates.dateOfBirth || existing.dateOfBirth || rawDob || null,
      dob: updates.dateOfBirth || existing.dateOfBirth || rawDob || null,
      accountStatus: updates.accountStatus || existing.accountStatus || 'active',
      createdAt: existing.createdAt?.toMillis ? existing.createdAt.toMillis() : Date.now(),
      updatedAt: Date.now(),
    };
  }
);

/**
 * CALLABLE: Allows a user to securely update their own profile from the app.
 * Only customer-editable attributes (displayName, phoneNumber, photoURL, dateOfBirth) can be updated.
 * Privileged lifecycle fields (accountStatus, uid, createdAt) cannot be modified here.
 */
const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  name: z.string().min(2).max(100).optional(),
  phoneNumber: z.string().optional(),
  phone: z.string().optional(),
  phoneE164: z.string().optional(),
  photoURL: z.string().url().optional(),
  dateOfBirth: z.string().optional(),
  dob: z.string().optional(),
}).strict();

export const updateProfile = secureCallable(
  updateProfileSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const profileRef = db.collection('users').doc(uid);

    log.info(`User ${uid} is updating their profile`, data);

    const displayName = data.displayName || data.name;
    const phone = data.phoneNumber || data.phone || data.phoneE164;
    const dob = data.dateOfBirth || data.dob;

    const updates: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (displayName !== undefined) updates.displayName = displayName;
    if (phone !== undefined) {
      const clean = phone.replace(/\D/g, '').slice(-10);
      updates.phoneNumber = clean;
      updates.phoneE164 = `+91${clean}`;
    }
    if (data.photoURL !== undefined) updates.photoURL = data.photoURL;
    if (dob !== undefined) updates.dateOfBirth = dob;

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
  }).strict(),
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

/**
 * CALLABLE: getMe
 * Returns the current authenticated user's profile, merged subcollection preferences
 * (settings, service modes, notification toggles, privacy & security),
 * wallet summary (balanceMinor in paise and derived balance in rupees), and address count.
 */
export const getMe = secureCallable(
  z.object({}).strict().optional(),
  async (_data, context) => {
    const uid = context.auth.uid;
    const userRef = db.collection('users').doc(uid);
    const walletRef = db.collection('wallets').doc(uid);

    log.info(`[getMe] Fetching consolidated account state for UID: ${uid}`);

    // Fetch profile, preferences, security, wallet, and address count in parallel
    const [
      profileSnap,
      settingsSnap,
      serviceSnap,
      notificationsSnap,
      securitySnap,
      walletSnap,
      addressCountSnap,
    ] = await Promise.all([
      userRef.get(),
      userRef.collection('preferences').doc('settings').get(),
      userRef.collection('preferences').doc('service').get(),
      userRef.collection('preferences').doc('notifications').get(),
      userRef.collection('privacy').doc('security').get(),
      walletRef.get(),
      userRef.collection('addresses').count().get(),
    ]);

    if (!profileSnap.exists) {
      throwError('not-found', 'User profile not found. Please initialize your account first.');
    }

    const profileData = profileSnap.data() || {};

    // Account Lifecycle Guard
    if (profileData.accountStatus === 'suspended' || profileData.accountStatus === 'deleted') {
      throwError('permission-denied', `Your account is currently ${profileData.accountStatus}.`);
    }

    // 1. Settings Preferences with Greenfield Spec Defaults
    const settingsData = settingsSnap.data() || {};
    const settings = {
      theme: settingsData.theme || 'system',
      language: settingsData.language || 'en',
      locationAccess: settingsData.locationAccess ?? true,
      shareUsageData: settingsData.shareUsageData ?? true,
      usageHistory: settingsData.usageHistory || [],
    };

    // 2. Service Preferences with Greenfield Spec Defaults
    const serviceData = serviceSnap.data() || {};
    const servicePreferences = {
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
    };

    // 3. Notification Preferences with Greenfield Spec Defaults
    const notificationsData = notificationsSnap.data() || {};
    const notifications = notificationsData.categories || {
      food: true,
      groceries: true,
      rides: true,
      health: true,
      homeServices: true,
    };

    // 4. Privacy & Security with Greenfield Spec Defaults
    const securityData = securitySnap.data() || {};
    const security = {
      biometric: securityData.biometric ?? true,
      verifiedProfile: securityData.verifiedProfile ?? true,
      familySharing: securityData.familySharing ?? false,
      familySharingEnabled: securityData.familySharingEnabled ?? false,
      emergencyContact: securityData.emergencyContact || '',
    };

    // 5. Wallet Balance (Integer paise & derived float rupees)
    const walletData = walletSnap.data() || {};
    const balanceMinor = typeof walletData.balanceMinor === 'number'
      ? walletData.balanceMinor
      : Math.round((walletData.balance || 0) * 100);

    const wallet = {
      balanceMinor,
      balance: balanceMinor / 100,
      currency: walletData.currency || 'INR',
    };

    // 6. Address Aggregation Count
    const addressCount = addressCountSnap.data().count;

    return {
      profile: {
        uid,
        displayName: profileData.displayName || 'OneBuddy User',
        name: profileData.displayName || 'OneBuddy User',
        email: profileData.email || null,
        phoneNumber: profileData.phoneNumber || null,
        phoneE164: profileData.phoneE164 || null,
        phone: profileData.phoneNumber || null,
        photoURL: profileData.photoURL || null,
        dateOfBirth: profileData.dateOfBirth || profileData.dob || null,
        accountStatus: profileData.accountStatus || 'active',
        createdAt: profileData.createdAt?.toMillis ? profileData.createdAt.toMillis() : Date.now(),
        updatedAt: profileData.updatedAt?.toMillis ? profileData.updatedAt.toMillis() : Date.now(),
      },
      preferences: {
        settings,
        service: servicePreferences,
        notifications,
      },
      security,
      wallet,
      addressCount,
    };
  }
);

/**
 * CALLABLE: requestDataExport
 * Complies with DPDP Act 2023 & GDPR Data Portability rights.
 * Aggregates all user-owned profile, preferences, security, addresses, places,
 * orders, and wallet ledger records, saves an archive to Cloud Storage,
 * generates a 7-day signed download URL, records an audit event, and delivers an in-app notification.
 */
const requestDataExportSchema = z.object({
  reason: z.string().max(200).nullish(),
}).strict();

export const requestDataExport = secureCallable(
  requestDataExportSchema,
  async (data, context) => {
    const uid = context.auth.uid;
    const now = FieldValue.serverTimestamp();
    const nowMs = Date.now();
    const userRef = db.collection('users').doc(uid);

    log.info(`[requestDataExport] User ${uid} requested full data export`);

    // 1. Fetch user profile and check 24-hour cooldown
    const profileSnap = await userRef.get();
    if (!profileSnap.exists) {
      throwError('not-found', 'User profile not found.');
    }

    const profileData = profileSnap.data() || {};
    const lastExportAt = profileData.lastDataExportRequestedAt?.toMillis
      ? profileData.lastDataExportRequestedAt.toMillis()
      : 0;

    const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
    if (nowMs - lastExportAt < COOLDOWN_MS) {
      const remainingHours = Math.ceil((COOLDOWN_MS - (nowMs - lastExportAt)) / (60 * 60 * 1000));
      throwError(
        'resource-exhausted',
        `You have already requested a data export recently. Please wait ${remainingHours} hour(s) before requesting again.`
      );
    }

    // 2. Aggregate all user-owned data in parallel
    const [
      settingsSnap,
      serviceSnap,
      notificationsSnap,
      securitySnap,
      addressesSnap,
      placesSnap,
      ordersSnap,
      walletSnap,
      entriesSnap,
    ] = await Promise.all([
      userRef.collection('preferences').doc('settings').get(),
      userRef.collection('preferences').doc('service').get(),
      userRef.collection('preferences').doc('notifications').get(),
      userRef.collection('privacy').doc('security').get(),
      userRef.collection('addresses').get(),
      userRef.collection('savedPlaces').get(),
      userRef.collection('orders').get(),
      db.collection('wallets').doc(uid).get(),
      db.collection('wallets').doc(uid).collection('entries').get(),
    ]);

    // 3. Assemble sanitized export dossier
    const exportDossier = {
      metadata: {
        exportVersion: '1.0',
        exportedAt: new Date().toISOString(),
        userId: uid,
      },
      profile: {
        displayName: profileData.displayName || null,
        email: profileData.email || null,
        phoneNumber: profileData.phoneNumber || null,
        phoneE164: profileData.phoneE164 || null,
        accountStatus: profileData.accountStatus || 'active',
        createdAt: profileData.createdAt?.toDate ? profileData.createdAt.toDate().toISOString() : null,
      },
      preferences: {
        settings: settingsSnap.data() || {},
        service: serviceSnap.data() || {},
        notifications: notificationsSnap.data() || {},
      },
      security: {
        biometricEnabled: securitySnap.data()?.biometric ?? false,
        verifiedProfile: securitySnap.data()?.verifiedProfile ?? false,
        familySharing: securitySnap.data()?.familySharing ?? false,
        emergencyContact: securitySnap.data()?.emergencyContact || null,
      },
      addresses: addressesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      savedPlaces: placesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      orders: ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      wallet: {
        balanceMinor: walletSnap.data()?.balanceMinor ?? 0,
        currency: walletSnap.data()?.currency || 'INR',
        transactions: entriesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      },
    };

    const exportId = `export_${nowMs}_${uid.slice(0, 6)}`;
    const storagePath = `users/${uid}/exports/${exportId}.json`;
    const bucketName = process.env.STORAGE_BUCKET || 'one-buddy-4e0d7.firebasestorage.app';
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(storagePath);

    // 4. Write export archive to Cloud Storage
    await file.save(JSON.stringify(exportDossier, null, 2), {
      contentType: 'application/json',
      metadata: {
        userId: uid,
        exportId,
      },
    });

    // Generate secure 7-day signed download URL
    let downloadUrl = '';
    try {
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: nowMs + 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      downloadUrl = url;
    } catch (signErr) {
      log.warn('[requestDataExport] Could not generate signed URL:', signErr);
      downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    }

    const batch = db.batch();

    // 5. Update user profile with cooldown timestamp
    batch.update(userRef, {
      lastDataExportRequestedAt: now,
      lastDataExportId: exportId,
      updatedAt: now,
    });

    // 6. Deliver in-app notification per Section 4
    const notifRef = db.collection('notifications').doc();
    batch.set(notifRef, {
      id: notifRef.id,
      userId: uid,
      category: 'health', // Account & Security alert
      title: 'Your Account Data Export Is Ready',
      body: 'Your personal data archive has been generated and is ready for download.',
      payload: {
        exportId,
        downloadUrl,
      },
      createdAt: now,
    });

    // 7. Write durable audit trail per Section 4
    const auditRef = db.collection('auditEvents').doc();
    batch.set(auditRef, {
      eventId: auditRef.id,
      actorType: 'user',
      actorId: uid,
      action: 'user.data_export_requested',
      entityType: 'user',
      entityId: uid,
      outcome: 'success',
      metadata: {
        exportId,
        storagePath,
        reason: data.reason || 'User self-service request',
      },
      createdAt: now,
    });

    await batch.commit();

    log.info(`[requestDataExport] Export generated successfully for user ${uid}, ID: ${exportId}`);

    return {
      success: true,
      exportId,
      downloadUrl,
      expiresInDays: 7,
      message: 'Your personal data export has been compiled successfully.',
    };
  }
);

