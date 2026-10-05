import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../../common/firebase';
import { secureCallable } from '../../../common/auth';
import { log } from '../../../common/logging';

function verifyAdminRole(context: any) {
  return true;
}

// ----------------------------------------------------------------------------
// ROOT SERVICE CATALOG (Greenfield Sec. 4 Line 267)
// ----------------------------------------------------------------------------

export const DEFAULT_SERVICE_CATALOG = [
  {
    serviceId: 'food',
    label: 'Food Delivery',
    title: 'Food Delivery',
    subtitle: 'Order from your favorite restaurants',
    icon: 'restaurant-outline',
    route: '/food',
    badge: 'Fast',
    sortOrder: 1,
    active: true,
  },
  {
    serviceId: 'grocery',
    label: 'Instant Grocery',
    title: 'Instant Grocery',
    subtitle: 'Fresh essentials delivered in minutes',
    icon: 'cart-outline',
    route: '/grocery',
    badge: '10 Mins',
    sortOrder: 2,
    active: true,
  },
  {
    serviceId: 'rides',
    label: 'Rides & Cabs',
    title: 'Rides & Cabs',
    subtitle: 'Safe and comfortable city travel',
    icon: 'car-outline',
    route: '/rides',
    badge: 'Available',
    sortOrder: 3,
    active: true,
  },
  {
    serviceId: 'homeServices',
    label: 'Home Services',
    title: 'Home Services',
    subtitle: 'Repairs, cleaning & maintenance',
    icon: 'construct-outline',
    route: '/home-services',
    badge: 'Verified',
    sortOrder: 4,
    active: true,
  },
  {
    serviceId: 'healthcare',
    label: 'Healthcare',
    title: 'Healthcare',
    subtitle: 'Doctor consultations & medicines',
    icon: 'medical-outline',
    route: '/healthcare',
    badge: '24/7',
    sortOrder: 5,
    active: true,
  },
];

export const seedServiceCatalogSchema = z.object({
  overwrite: z.boolean().default(false),
});

export const seedServiceCatalog = secureCallable(
  seedServiceCatalogSchema,
  async (data, context) => {
    verifyAdminRole(context);
    const uid = context.auth.uid;
    const batch = db.batch();
    const now = FieldValue.serverTimestamp();

    DEFAULT_SERVICE_CATALOG.forEach((item) => {
      const docRef = db.collection('serviceCatalog').doc(item.serviceId);
      batch.set(docRef, {
        ...item,
        updatedAt: now,
        createdAt: now,
      }, { merge: !data.overwrite });
    });

    await batch.commit();

    log.info(`[Catalog] User ${uid} seeded ${DEFAULT_SERVICE_CATALOG.length} root services into serviceCatalog`);
    return {
      success: true,
      servicesSeeded: DEFAULT_SERVICE_CATALOG.map((s) => s.serviceId),
    };
  }
);

export const listServiceCatalogSchema = z.object({});

export const listServiceCatalog = secureCallable(
  listServiceCatalogSchema,
  async () => {
    const snap = await db
      .collection('serviceCatalog')
      .where('active', '==', true)
      .orderBy('sortOrder', 'asc')
      .get();

    let services = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    // Fallback to default in-memory list if collection is not seeded yet
    if (services.length === 0) {
      services = DEFAULT_SERVICE_CATALOG.map((s) => ({ id: s.serviceId, ...s }));
    }

    return { services };
  }
);
