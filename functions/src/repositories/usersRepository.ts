import { FieldValue, GeoPoint } from 'firebase-admin/firestore';
import { db } from '../common/firebase';

export interface AuditEventRecord {
  eventId?: string;
  actorType: 'user' | 'admin' | 'system';
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  outcome: 'success' | 'failure';
  requestId?: string;
  metadata?: Record<string, any>;
  createdAt?: any;
}

export interface NotificationRecord {
  id?: string;
  userId: string;
  category: 'food' | 'groceries' | 'rides' | 'health' | 'homeServices' | 'payment';
  title: string;
  body: string;
  payload?: Record<string, any>;
  createdAt?: any;
}

/**
 * Repository for Users collection (users/{uid}), its subcollections (preferences, privacy,
 * addresses, savedPlaces, orders), and user-centric system tables (notifications, auditEvents).
 */
export class UsersRepository {
  static getUserRef(uid: string): FirebaseFirestore.DocumentReference {
    return db.collection('users').doc(uid);
  }

  static getSecurityRef(uid: string): FirebaseFirestore.DocumentReference {
    return db.collection('users').doc(uid).collection('privacy').doc('security');
  }

  static getSettingsRef(uid: string): FirebaseFirestore.DocumentReference {
    return db.collection('users').doc(uid).collection('preferences').doc('settings');
  }

  static getServicePrefsRef(uid: string): FirebaseFirestore.DocumentReference {
    return db.collection('users').doc(uid).collection('preferences').doc('service');
  }

  static getNotificationsPrefsRef(uid: string): FirebaseFirestore.DocumentReference {
    return db.collection('users').doc(uid).collection('preferences').doc('notifications');
  }

  /**
   * Fetch primary user profile snapshot.
   */
  static async getUserProfile(
    uid: string,
    transaction?: FirebaseFirestore.Transaction
  ): Promise<FirebaseFirestore.DocumentSnapshot> {
    const ref = this.getUserRef(uid);
    return transaction ? transaction.get(ref) : ref.get();
  }

  /**
   * Save user profile with optional batch or transaction support.
   */
  static saveUserProfile(
    uid: string,
    data: Record<string, any>,
    writer?: FirebaseFirestore.WriteBatch | FirebaseFirestore.Transaction,
    merge = true
  ): void | Promise<FirebaseFirestore.WriteResult> {
    const ref = this.getUserRef(uid);
    if (writer) {
      (writer as any).set(ref, data, { merge });
      return;
    }
    return ref.set(data, { merge });
  }

  /**
   * Update specific profile fields.
   */
  static updateUserProfile(
    uid: string,
    updates: Record<string, any>,
    writer?: FirebaseFirestore.WriteBatch | FirebaseFirestore.Transaction
  ): void | Promise<FirebaseFirestore.WriteResult> {
    const ref = this.getUserRef(uid);
    if (writer) {
      (writer as any).update(ref, updates);
      return;
    }
    return ref.update(updates);
  }

  /**
   * Save or update privacy & security subcollection preferences.
   */
  static saveSecurityPreferences(
    uid: string,
    data: Record<string, any>,
    writer?: FirebaseFirestore.WriteBatch | FirebaseFirestore.Transaction
  ): void | Promise<FirebaseFirestore.WriteResult> {
    const ref = this.getSecurityRef(uid);
    if (writer) {
      (writer as any).set(ref, data, { merge: true });
      return;
    }
    return ref.set(data, { merge: true });
  }

  /**
   * Fetch consolidated account snapshot for getMe query.
   */
  static async getConsolidatedAccount(uid: string): Promise<{
    profileSnap: FirebaseFirestore.DocumentSnapshot;
    settingsSnap: FirebaseFirestore.DocumentSnapshot;
    serviceSnap: FirebaseFirestore.DocumentSnapshot;
    notificationsSnap: FirebaseFirestore.DocumentSnapshot;
    securitySnap: FirebaseFirestore.DocumentSnapshot;
    walletSnap: FirebaseFirestore.DocumentSnapshot;
    addressCount: number;
  }> {
    const userRef = this.getUserRef(uid);
    const walletRef = db.collection('wallets').doc(uid);

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
      this.getSettingsRef(uid).get(),
      this.getServicePrefsRef(uid).get(),
      this.getNotificationsPrefsRef(uid).get(),
      this.getSecurityRef(uid).get(),
      walletRef.get(),
      userRef.collection('addresses').count().get(),
    ]);

    return {
      profileSnap,
      settingsSnap,
      serviceSnap,
      notificationsSnap,
      securitySnap,
      walletSnap,
      addressCount: addressCountSnap.data().count,
    };
  }

  /**
   * Fetch complete user dataset across all subcollections for GDPR / DPDP Act data portability export.
   */
  static async getFullUserDataForExport(uid: string): Promise<{
    profileSnap: FirebaseFirestore.DocumentSnapshot;
    settingsSnap: FirebaseFirestore.DocumentSnapshot;
    serviceSnap: FirebaseFirestore.DocumentSnapshot;
    notificationsSnap: FirebaseFirestore.DocumentSnapshot;
    securitySnap: FirebaseFirestore.DocumentSnapshot;
    addressesSnap: FirebaseFirestore.QuerySnapshot;
    placesSnap: FirebaseFirestore.QuerySnapshot;
    ordersSnap: FirebaseFirestore.QuerySnapshot;
    walletSnap: FirebaseFirestore.DocumentSnapshot;
    entriesSnap: FirebaseFirestore.QuerySnapshot;
  }> {
    const userRef = this.getUserRef(uid);
    const walletRef = db.collection('wallets').doc(uid);

    const [
      profileSnap,
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
      userRef.get(),
      this.getSettingsRef(uid).get(),
      this.getServicePrefsRef(uid).get(),
      this.getNotificationsPrefsRef(uid).get(),
      this.getSecurityRef(uid).get(),
      userRef.collection('addresses').get(),
      userRef.collection('savedPlaces').get(),
      userRef.collection('orders').get(),
      walletRef.get(),
      walletRef.collection('entries').get(),
    ]);

    return {
      profileSnap,
      settingsSnap,
      serviceSnap,
      notificationsSnap,
      securitySnap,
      addressesSnap,
      placesSnap,
      ordersSnap,
      walletSnap,
      entriesSnap,
    };
  }

  /**
   * Record a durable audit event in auditEvents collection.
   */
  static recordAuditEvent(
    event: AuditEventRecord,
    writer?: FirebaseFirestore.WriteBatch | FirebaseFirestore.Transaction
  ): void | Promise<FirebaseFirestore.DocumentReference> {
    const ref = event.eventId ? db.collection('auditEvents').doc(event.eventId) : db.collection('auditEvents').doc();
    const payload = {
      eventId: ref.id,
      actorType: event.actorType,
      actorId: event.actorId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      outcome: event.outcome,
      requestId: event.requestId || null,
      metadata: event.metadata || {},
      createdAt: event.createdAt || FieldValue.serverTimestamp(),
    };

    if (writer) {
      (writer as any).set(ref, payload);
      return;
    }
    return db.collection('auditEvents').add(payload);
  }

  /**
   * Create an in-app notification document in notifications collection.
   */
  static sendNotification(
    notification: NotificationRecord,
    writer?: FirebaseFirestore.WriteBatch | FirebaseFirestore.Transaction
  ): void | Promise<FirebaseFirestore.DocumentReference> {
    const ref = notification.id ? db.collection('notifications').doc(notification.id) : db.collection('notifications').doc();
    const payload = {
      id: ref.id,
      userId: notification.userId,
      category: notification.category,
      title: notification.title,
      body: notification.body,
      payload: notification.payload || {},
      createdAt: notification.createdAt || FieldValue.serverTimestamp(),
    };

    if (writer) {
      (writer as any).set(ref, payload);
      return;
    }
    return db.collection('notifications').add(payload);
  }

  /**
   * Record a user privacy consent mutation (DPDP Act 2023 & GDPR).
   * Written to users/{uid}/privacy/consents/records/{consentId}.
   */
  static async recordUserConsent(
    uid: string,
    data: {
      purpose: string;
      granted: boolean;
      policyVersion?: string;
      source?: string;
    }
  ): Promise<string> {
    const colRef = db.collection('users').doc(uid).collection('privacy').doc('consents').collection('records');
    const docRef = colRef.doc();
    const now = FieldValue.serverTimestamp();

    const record = {
      consentId: docRef.id,
      userId: uid,
      purpose: data.purpose,
      granted: data.granted,
      policyVersion: data.policyVersion || 'v1.0',
      source: data.source || 'mobile_app',
      grantedAt: data.granted ? now : null,
      withdrawnAt: !data.granted ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(record);
    return docRef.id;
  }

  /**
   * Retrieve active consent records for a user.
   */
  static async listUserConsents(uid: string): Promise<Record<string, any>[]> {
    const snap = await db
      .collection('users')
      .doc(uid)
      .collection('privacy')
      .doc('consents')
      .collection('records')
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  static getFavoritesRef(uid: string): FirebaseFirestore.CollectionReference {
    return db.collection('users').doc(uid).collection('favorites');
  }

  static getSavedPlacesRef(uid: string): FirebaseFirestore.CollectionReference {
    return db.collection('users').doc(uid).collection('savedPlaces');
  }

  /**
   * Toggle a saved favorite with a deterministic ID: ${service}_${targetId}
   */
  static async toggleFavorite(
    uid: string,
    service: string,
    targetId: string
  ): Promise<{ isFavorite: boolean; favoriteId: string }> {
    const favoriteId = `${service}_${targetId}`;
    const docRef = this.getFavoritesRef(uid).doc(favoriteId);
    const snap = await docRef.get();

    if (snap.exists) {
      await docRef.delete();
      return { isFavorite: false, favoriteId };
    } else {
      await docRef.set({
        id: favoriteId,
        service,
        targetId,
        createdAt: FieldValue.serverTimestamp(),
      });
      return { isFavorite: true, favoriteId };
    }
  }

  /**
   * List saved favorites for a user.
   */
  static async listFavorites(uid: string, service?: string): Promise<Record<string, any>[]> {
    let query: FirebaseFirestore.Query = this.getFavoritesRef(uid);
    if (service) {
      query = query.where('service', '==', service);
    }
    const snap = await query.orderBy('createdAt', 'desc').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  /**
   * Upsert a saved place (Home, Work, Custom) with GeoPoint normalization.
   */
  static async savePlace(
    uid: string,
    data: {
      id?: string;
      label: string;
      address: string;
      icon: 'home' | 'briefcase' | 'pin';
      latitude?: number | null;
      longitude?: number | null;
    }
  ): Promise<string> {
    const colRef = this.getSavedPlacesRef(uid);
    const docRef = data.id ? colRef.doc(data.id) : colRef.doc();
    const now = FieldValue.serverTimestamp();

    const location = (data.latitude !== undefined && data.longitude !== undefined && data.latitude !== null && data.longitude !== null)
      ? new GeoPoint(data.latitude, data.longitude)
      : null;

    await docRef.set(
      {
        id: docRef.id,
        label: data.label,
        address: data.address,
        icon: data.icon,
        location,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        updatedAt: now,
        createdAt: now,
      },
      { merge: true }
    );

    return docRef.id;
  }

  /**
   * List saved places for a user.
   */
  static async listSavedPlaces(uid: string): Promise<Record<string, any>[]> {
    const snap = await this.getSavedPlacesRef(uid).orderBy('createdAt', 'desc').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  /**
   * Delete a saved place.
   */
  static async deleteSavedPlace(uid: string, placeId: string): Promise<void> {
    await this.getSavedPlacesRef(uid).doc(placeId).delete();
  }
}


