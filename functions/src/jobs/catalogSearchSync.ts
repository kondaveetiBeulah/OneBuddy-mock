import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../common/firebase';
import { log } from '../common/logging';

// ----------------------------------------------------------------------------
// 1. TRIGGER: RESTAURANT SYNC
// ----------------------------------------------------------------------------

export const onRestaurantWritten = onDocumentWritten(
  {
    document: 'catalogRestaurants/{restaurantId}',
    region: 'asia-south1',
  },
  async (event) => {
    const restaurantId = event.params.restaurantId;
    const projRef = db.collection('catalogSearchProjections').doc(`restaurant_${restaurantId}`);

    if (!event.data?.after.exists) {
      await projRef.delete().catch(() => {});
      log.info(`[CatalogSearchSync] Purged search projection for deleted restaurant ${restaurantId}`);
      return;
    }

    const data = event.data.after.data();
    const cuisines = Array.isArray(data?.cuisines) ? data.cuisines.join(' ') : '';
    const searchableText = `${data?.name || ''} ${cuisines} ${data?.cityKey || ''}`.toLowerCase();

    await projRef.set({
      projectionId: projRef.id,
      entityType: 'restaurant',
      entityId: restaurantId,
      merchantId: restaurantId,
      title: data?.name || 'Restaurant',
      subtitle: Array.isArray(data?.cuisines) ? data.cuisines.join(', ') : '',
      cityKey: data?.cityKey?.toLowerCase() || 'hyderabad',
      imageUrl: data?.imageUrl || '',
      searchableText,
      isAvailable: data?.active ?? data?.isAvailable ?? true,
      syncStatus: 'synced',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    log.info(`[CatalogSearchSync] Synced search projection for restaurant ${restaurantId}`);
  }
);

// ----------------------------------------------------------------------------
// 2. TRIGGER: GROCERY PRODUCT SYNC
// ----------------------------------------------------------------------------

export const onGroceryProductWritten = onDocumentWritten(
  {
    document: 'catalogGroceryProducts/{productId}',
    region: 'asia-south1',
  },
  async (event) => {
    const productId = event.params.productId;
    const projRef = db.collection('catalogSearchProjections').doc(`grocery_${productId}`);

    if (!event.data?.after.exists) {
      await projRef.delete().catch(() => {});
      log.info(`[CatalogSearchSync] Purged search projection for deleted grocery product ${productId}`);
      return;
    }

    const data = event.data.after.data();
    const searchableText = `${data?.name || ''} ${data?.category || ''} ${data?.unit || ''}`.toLowerCase();
    const priceMinor = data?.priceMinor || (data?.price ? Math.round(data.price * 100) : 0);

    await projRef.set({
      projectionId: projRef.id,
      entityType: 'grocery',
      entityId: productId,
      title: data?.name || 'Product',
      subtitle: data?.unit ? `${data.unit} • ${data?.category || ''}` : data?.category || '',
      priceMinor,
      imageUrl: data?.imageUrl || '',
      searchableText,
      isAvailable: data?.isAvailable ?? true,
      syncStatus: 'synced',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    log.info(`[CatalogSearchSync] Synced search projection for grocery product ${productId}`);
  }
);

// ----------------------------------------------------------------------------
// 3. TRIGGER: MENU ITEM SYNC
// ----------------------------------------------------------------------------

export const onMenuItemWritten = onDocumentWritten(
  {
    document: 'catalogRestaurants/{restaurantId}/menuItems/{menuItemId}',
    region: 'asia-south1',
  },
  async (event) => {
    const { restaurantId, menuItemId } = event.params;
    const projRef = db.collection('catalogSearchProjections').doc(`menu_${menuItemId}`);

    if (!event.data?.after.exists) {
      await projRef.delete().catch(() => {});
      log.info(`[CatalogSearchSync] Purged search projection for deleted menu item ${menuItemId}`);
      return;
    }

    const data = event.data.after.data();
    const searchableText = `${data?.name || ''} ${data?.category || ''} ${data?.description || ''}`.toLowerCase();
    const priceMinor = data?.priceMinor || (data?.price ? Math.round(data.price * 100) : 0);

    await projRef.set({
      projectionId: projRef.id,
      entityType: 'menuItem',
      entityId: menuItemId,
      merchantId: restaurantId,
      title: data?.name || 'Menu Item',
      subtitle: data?.category || 'Menu Item',
      priceMinor,
      imageUrl: data?.imageUrl || '',
      searchableText,
      isAvailable: data?.available ?? data?.isAvailable ?? true,
      syncStatus: 'synced',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    log.info(`[CatalogSearchSync] Synced search projection for menu item ${menuItemId} (Restaurant: ${restaurantId})`);
  }
);

// ----------------------------------------------------------------------------
// 4. SCHEDULED MAINTENANCE WORKER (Audit & Re-sync every 15 minutes)
// ----------------------------------------------------------------------------

export const catalogSearchSyncWorker = onSchedule(
  {
    schedule: 'every 15 minutes',
    region: 'asia-south1',
  },
  async () => {
    log.info('[CatalogSearchSync] Running scheduled search projections audit');

    try {
      const restSnap = await db.collection('catalogRestaurants').limit(50).get();
      if (!restSnap.empty) {
        const batch = db.batch();
        restSnap.docs.forEach((doc) => {
          const data = doc.data();
          const projRef = db.collection('catalogSearchProjections').doc(`restaurant_${doc.id}`);
          const cuisines = Array.isArray(data?.cuisines) ? data.cuisines.join(' ') : '';
          batch.set(projRef, {
            projectionId: projRef.id,
            entityType: 'restaurant',
            entityId: doc.id,
            merchantId: doc.id,
            title: data?.name || 'Restaurant',
            subtitle: Array.isArray(data?.cuisines) ? data.cuisines.join(', ') : '',
            cityKey: data?.cityKey?.toLowerCase() || 'hyderabad',
            imageUrl: data?.imageUrl || '',
            searchableText: `${data?.name || ''} ${cuisines} ${data?.cityKey || ''}`.toLowerCase(),
            isAvailable: data?.active ?? data?.isAvailable ?? true,
            syncStatus: 'synced',
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
        });
        await batch.commit();
        log.info(`[CatalogSearchSync] Audit synced ${restSnap.size} restaurant search projection(s)`);
      }
    } catch (auditErr) {
      log.warn('[CatalogSearchSync] Audit sweep note:', auditErr);
    }
  }
);
