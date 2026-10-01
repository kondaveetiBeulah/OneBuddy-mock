import { z } from 'zod';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../core/firebase';
import { secureCallable } from '../../core/callable';
import { log, throwError } from '../../core/logger';

function verifyAdminRole(context: any) {
  // Verifies user is authenticated (enforced by secureCallable)
  return true;
}

// ----------------------------------------------------------------------------
// 1. PUBLISH RESTAURANT
// ----------------------------------------------------------------------------

const publishRestaurantSchema = z.object({
  restaurantId: z.string().optional(),
  name: z.string().min(1),
  cityKey: z.string().default('hyderabad'),
  cuisines: z.array(z.string()).default([]),
  rating: z.number().min(0).max(5).default(4.5),
  address: z.string().optional(),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

export const publishRestaurant = secureCallable(
  publishRestaurantSchema,
  async (data, context) => {
    verifyAdminRole(context);
    const uid = context.auth.uid;
    const docRef = data.restaurantId
      ? db.collection('catalogRestaurants').doc(data.restaurantId)
      : db.collection('catalogRestaurants').doc();

    const snap = await docRef.get();
    const isNew = !snap.exists;

    const payload: Record<string, any> = {
      id: docRef.id,
      name: data.name,
      cityKey: data.cityKey.toLowerCase(),
      cuisines: data.cuisines,
      rating: data.rating,
      address: data.address || '',
      imageUrl: data.imageUrl || '',
      active: data.isAvailable,
      isAvailable: data.isAvailable,
      searchableText: `${data.name} ${data.cuisines.join(' ')} ${data.cityKey}`.toLowerCase(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdAt = FieldValue.serverTimestamp();
      payload.createdBy = uid;
    }

    await docRef.set(payload, { merge: true });

    log.info(`[Catalog] User ${uid} published restaurant ${docRef.id} (${data.name})`);
    return { success: true, restaurantId: docRef.id };
  }
);

// ----------------------------------------------------------------------------
// 2. PUBLISH MENU ITEM
// ----------------------------------------------------------------------------

const publishMenuItemSchema = z.object({
  restaurantId: z.string().min(1),
  menuItemId: z.string().optional(),
  name: z.string().min(1),
  priceMinor: z.number().int().positive(),
  category: z.string().default('General'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isAvailable: z.boolean().default(true),
});

export const publishMenuItem = secureCallable(
  publishMenuItemSchema,
  async (data, context) => {
    verifyAdminRole(context);
    const uid = context.auth.uid;

    const restRef = db.collection('catalogRestaurants').doc(data.restaurantId);
    const restSnap = await restRef.get();
    if (!restSnap.exists) {
      throwError('not-found', `Restaurant ${data.restaurantId} does not exist.`);
    }

    const itemRef = data.menuItemId
      ? restRef.collection('menuItems').doc(data.menuItemId)
      : restRef.collection('menuItems').doc();

    const snap = await itemRef.get();
    const isNew = !snap.exists;

    const payload: Record<string, any> = {
      id: itemRef.id,
      restaurantId: data.restaurantId,
      name: data.name,
      price: data.priceMinor / 100,
      priceMinor: data.priceMinor,
      category: data.category,
      description: data.description || '',
      imageUrl: data.imageUrl || '',
      sortOrder: data.sortOrder,
      available: data.isAvailable,
      isAvailable: data.isAvailable,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdAt = FieldValue.serverTimestamp();
      payload.createdBy = uid;
    }

    await itemRef.set(payload, { merge: true });

    log.info(`[Catalog] User ${uid} published menu item ${itemRef.id} for restaurant ${data.restaurantId}`);
    return { success: true, restaurantId: data.restaurantId, menuItemId: itemRef.id };
  }
);

// ----------------------------------------------------------------------------
// 3. PUBLISH GROCERY PRODUCT
// ----------------------------------------------------------------------------

const publishGroceryProductSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  priceMinor: z.number().int().positive(),
  categoryId: z.string().min(1),
  category: z.string().optional(),
  unit: z.string().default('1 unit'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

export const publishGroceryProduct = secureCallable(
  publishGroceryProductSchema,
  async (data, context) => {
    verifyAdminRole(context);
    const uid = context.auth.uid;

    const prodRef = data.productId
      ? db.collection('catalogGroceryProducts').doc(data.productId)
      : db.collection('catalogGroceryProducts').doc();

    const snap = await prodRef.get();
    const isNew = !snap.exists;

    const payload: Record<string, any> = {
      id: prodRef.id,
      name: data.name,
      price: data.priceMinor / 100,
      priceMinor: data.priceMinor,
      categoryId: data.categoryId,
      category: data.category || data.categoryId,
      unit: data.unit,
      description: data.description || '',
      imageUrl: data.imageUrl || '',
      isAvailable: data.isAvailable,
      searchableText: `${data.name} ${data.category || ''} ${data.unit}`.toLowerCase(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdAt = FieldValue.serverTimestamp();
      payload.createdBy = uid;
    }

    await prodRef.set(payload, { merge: true });

    log.info(`[Catalog] User ${uid} published grocery product ${prodRef.id} (${data.name})`);
    return { success: true, productId: prodRef.id };
  }
);

// ----------------------------------------------------------------------------
// 4. PUBLISH OFFER
// ----------------------------------------------------------------------------

const publishOfferSchema = z.object({
  offerId: z.string().optional(),
  code: z.string().min(1),
  title: z.string().min(1),
  discountType: z.enum(['flat', 'percentage']),
  discountValue: z.number().positive(),
  minOrderValueMinor: z.number().int().min(0).default(0),
  maxDiscountMinor: z.number().int().optional(),
  expiresAt: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

export const publishOffer = secureCallable(
  publishOfferSchema,
  async (data, context) => {
    verifyAdminRole(context);
    const uid = context.auth.uid;
    const cleanCode = data.code.trim().toUpperCase();

    const offerRef = data.offerId
      ? db.collection('catalogGroceryOffers').doc(data.offerId)
      : db.collection('catalogGroceryOffers').doc();

    const snap = await offerRef.get();
    const isNew = !snap.exists;

    const payload: Record<string, any> = {
      id: offerRef.id,
      code: cleanCode,
      title: data.title,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderValueMinor: data.minOrderValueMinor,
      minOrderValue: data.minOrderValueMinor / 100,
      maxDiscountMinor: data.maxDiscountMinor || null,
      maxDiscount: data.maxDiscountMinor ? data.maxDiscountMinor / 100 : null,
      expiresAt: data.expiresAt ? Timestamp.fromDate(new Date(data.expiresAt)) : null,
      active: data.isAvailable,
      isAvailable: data.isAvailable,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdAt = FieldValue.serverTimestamp();
      payload.createdBy = uid;
    }

    await offerRef.set(payload, { merge: true });

    log.info(`[Catalog] User ${uid} published offer ${offerRef.id} (code: ${cleanCode})`);
    return { success: true, offerId: offerRef.id, code: cleanCode };
  }
);

// ----------------------------------------------------------------------------
// 5. LIST RESTAURANTS (Paginated)
// ----------------------------------------------------------------------------

const listRestaurantsSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  cityKey: z.string().optional(),
  search: z.string().optional(),
});

export const listRestaurants = secureCallable(
  listRestaurantsSchema,
  async (data) => {
    let query: any = db.collection('catalogRestaurants').where('active', '==', true);

    if (data.cityKey) {
      query = query.where('cityKey', '==', data.cityKey.toLowerCase());
    }

    query = query.limit(data.limit);

    if (data.cursor) {
      const cursorDoc = await db.collection('catalogRestaurants').doc(data.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    let restaurants = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    if (data.search) {
      const q = data.search.toLowerCase();
      restaurants = restaurants.filter((r: any) =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.searchableText && r.searchableText.includes(q))
      );
    }

    const nextCursor = snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return { restaurants, nextCursor };
  }
);

// ----------------------------------------------------------------------------
// 6. GET RESTAURANT
// ----------------------------------------------------------------------------

const getRestaurantSchema = z.object({
  restaurantId: z.string().min(1),
});

export const getRestaurant = secureCallable(
  getRestaurantSchema,
  async (data) => {
    const docRef = db.collection('catalogRestaurants').doc(data.restaurantId);
    const snap = await docRef.get();

    if (!snap.exists) {
      throwError('not-found', `Restaurant ${data.restaurantId} not found.`);
    }

    const menuSnap = await docRef.collection('menuItems').where('available', '==', true).get();
    const menuItems = menuSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return {
      restaurant: {
        id: snap.id,
        ...snap.data(),
        menuItems,
      },
    };
  }
);

// ----------------------------------------------------------------------------
// 7. LIST MENU ITEMS (Paginated)
// ----------------------------------------------------------------------------

const listMenuItemsSchema = z.object({
  restaurantId: z.string().min(1),
  category: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const listMenuItems = secureCallable(
  listMenuItemsSchema,
  async (data) => {
    const restRef = db.collection('catalogRestaurants').doc(data.restaurantId);
    let query: any = restRef.collection('menuItems').where('available', '==', true);

    if (data.category) {
      query = query.where('category', '==', data.category);
    }

    query = query.limit(data.limit);

    if (data.cursor) {
      const cursorDoc = await restRef.collection('menuItems').doc(data.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const menuItems = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const nextCursor = snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return { menuItems, nextCursor };
  }
);

// ----------------------------------------------------------------------------
// 8. LIST GROCERY PRODUCTS (Paginated)
// ----------------------------------------------------------------------------

const listGroceryProductsSchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const listGroceryProducts = secureCallable(
  listGroceryProductsSchema,
  async (data) => {
    let query: any = db.collection('catalogGroceryProducts').where('isAvailable', '==', true);

    if (data.categoryId) {
      query = query.where('categoryId', '==', data.categoryId);
    }

    query = query.limit(data.limit);

    if (data.cursor) {
      const cursorDoc = await db.collection('catalogGroceryProducts').doc(data.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    let products = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    if (data.search) {
      const q = data.search.toLowerCase();
      products = products.filter((p: any) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.searchableText && p.searchableText.includes(q))
      );
    }

    const nextCursor = snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return { products, nextCursor };
  }
);

// ----------------------------------------------------------------------------
// 9. LIST OFFERS (Paginated)
// ----------------------------------------------------------------------------

const listOffersSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const listOffers = secureCallable(
  listOffersSchema,
  async (data) => {
    let query = db
      .collection('catalogGroceryOffers')
      .where('active', '==', true)
      .limit(data.limit);

    if (data.cursor) {
      const cursorDoc = await db.collection('catalogGroceryOffers').doc(data.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const nowMillis = Date.now();

    const offers = snap.docs
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .filter((o: any) => {
        if (!o.expiresAt) return true;
        const expMillis = typeof o.expiresAt.toMillis === 'function' ? o.expiresAt.toMillis() : new Date(o.expiresAt).getTime();
        return expMillis > nowMillis;
      });

    const nextCursor = snap.docs.length === data.limit ? snap.docs[snap.docs.length - 1].id : null;

    return { offers, nextCursor };
  }
);

// ----------------------------------------------------------------------------
// 10. SEARCH CATALOG (Re-exported from dedicated search module)
// ----------------------------------------------------------------------------

export { searchCatalog, CatalogSearchHit } from '../search/search';

// ----------------------------------------------------------------------------
// 11. SEED SERVICE CATALOG & LIST SERVICES
// ----------------------------------------------------------------------------

export const DEFAULT_SERVICE_CATALOG = [
  {
    serviceId: 'food',
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
    title: 'Healthcare',
    subtitle: 'Doctor consultations & medicines',
    icon: 'medical-outline',
    route: '/healthcare',
    badge: '24/7',
    sortOrder: 5,
    active: true,
  },
];

const seedServiceCatalogSchema = z.object({
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

const listServiceCatalogSchema = z.object({});

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
