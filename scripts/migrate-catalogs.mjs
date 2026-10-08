import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locate Service Account Credentials
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  'C:\\Users\\HP\\Downloads\\onebuddyuser-firebase-adminsdk-fbsvc-be3fe09bff.json';

if (!fs.existsSync(credPath)) {
  console.error(`Service account key not found at ${credPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id || 'onebuddyuser',
});

// Databases: getFirestore(app) connects to (default) database automatically
const defaultDb = getFirestore(app);
const foodDb = getFirestore(app, 'onebuddyfood');
const groceryDb = getFirestore(app, 'onebuddygrocery');

async function migrate() {
  console.log('=== Starting Fast Catalog Migration to (default) Database ===');
  console.log('Target Project:', serviceAccount.project_id);
  console.log('SAFETY GUARANTEE: Source databases (onebuddyfood & onebuddygrocery) are READ-ONLY.');

  const now = Timestamp.now();
  let totalWritten = 0;

  // -------------------------------------------------------------
  // Step 1: Seed Reference System & Healthcare Collections
  // -------------------------------------------------------------
  console.log('\n--- Step 1: Seeding Service Catalog & Specialties ---');
  const seedPath = path.resolve(__dirname, '../seed-data.json');
  if (fs.existsSync(seedPath)) {
    const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    const batch = defaultDb.batch();

    if (seed.collections?.systemMetadata) {
      for (const item of seed.collections.systemMetadata) {
        batch.set(defaultDb.collection('systemMetadata').doc(item.id), {
          ...item.data,
          updatedAt: now,
        }, { merge: true });
        totalWritten++;
      }
    }

    if (seed.collections?.serviceCatalog) {
      for (const item of seed.collections.serviceCatalog) {
        batch.set(defaultDb.collection('serviceCatalog').doc(item.id), {
          ...item.data,
          active: true,
          updatedAt: now,
        }, { merge: true });
        totalWritten++;
      }
    }

    if (seed.collections?.healthcareSpecialties) {
      for (const item of seed.collections.healthcareSpecialties) {
        batch.set(defaultDb.collection('healthcareSpecialties').doc(item.id), {
          ...item.data,
          active: true,
          updatedAt: now,
        }, { merge: true });
        totalWritten++;
      }
    }

    await batch.commit();
    console.log(`+ Seeded systemMetadata, serviceCatalog, and healthcareSpecialties.`);
  }

  // -------------------------------------------------------------
  // Step 2: Migrate Food Banners
  // -------------------------------------------------------------
  console.log('\n--- Step 2: Migrating Food Banners ---');
  const foodBannersSnap = await foodDb.collection('banners').get();
  console.log(`Found ${foodBannersSnap.size} food banners in onebuddyfood.`);

  if (!foodBannersSnap.empty) {
    const bannerBatch = defaultDb.batch();
    for (const doc of foodBannersSnap.docs) {
      const data = doc.data();
      bannerBatch.set(defaultDb.collection('catalogFoodBanners').doc(doc.id), {
        id: doc.id,
        title: data.title || '',
        subtitle: data.subtitle || '',
        discountBadge: data.discountBadge || '',
        code: data.code || '',
        restaurantId: data.restaurantId || '',
        restaurantName: data.restaurantName || '',
        gradientColors: Array.isArray(data.gradientColors) ? data.gradientColors : ['#4e1f6e', '#2d1241', '#12061b'],
        image: data.image || '',
        active: true,
        updatedAt: now,
      }, { merge: true });
      totalWritten++;
    }
    await bannerBatch.commit();
    console.log(`+ Migrated ${foodBannersSnap.size} food banners.`);
  }

  // -------------------------------------------------------------
  // Step 3: Migrate Food Restaurants & Extract Menu Items
  // -------------------------------------------------------------
  console.log('\n--- Step 3: Migrating Restaurants & Menu Items Subcollections ---');
  const restaurantsSnap = await foodDb.collection('restaurants').get();
  console.log(`Found ${restaurantsSnap.size} restaurants in onebuddyfood.`);

  let totalMenuItemsCount = 0;

  for (const doc of restaurantsSnap.docs) {
    const data = doc.data();
    const menuArray = Array.isArray(data.menu) ? data.menu : [];

    const costForTwo = typeof data.costForTwo === 'number' ? data.costForTwo : 350;
    const costForTwoMinor = Math.round(costForTwo * 100);

    let ratingCount = 100;
    if (typeof data.ratingCount === 'number') {
      ratingCount = data.ratingCount;
    } else if (typeof data.totalRatings === 'string') {
      const parsed = parseInt(data.totalRatings.replace(/\D/g, ''), 10);
      if (!isNaN(parsed)) ratingCount = parsed;
    }

    const restBatch = defaultDb.batch();

    // 1. Restaurant document
    const restaurantRef = defaultDb.collection('catalogRestaurants').doc(doc.id);
    let restaurantName = data.name || '';
    if (restaurantName.toLowerCase() === 'mefil' || doc.id.includes('mefil')) {
      restaurantName = restaurantName.replace(/mefil/gi, 'Mehfil');
      if (!restaurantName || restaurantName.toLowerCase() === 'mehfil') restaurantName = 'Mehfil';
    }
    restBatch.set(restaurantRef, {
      id: doc.id,
      name: restaurantName,
      tagline: data.tagline || '',
      cuisine: Array.isArray(data.cuisine) ? data.cuisine : [],
      rating: typeof data.rating === 'number' ? data.rating : 4.5,
      ratingCount,
      deliveryTime: data.deliveryTime || '20-25 mins',
      deliveryMins: typeof data.deliveryMins === 'number' ? data.deliveryMins : 25,
      costForTwoMinor,
      featuredImage: data.featuredImage || '',
      bannerImage: data.bannerImage || data.featuredImage || '',
      dietaryType: (data.dietaryType === 'pure-veg' || data.dietaryType === 'non-veg' || data.dietaryType === 'mixed')
        ? data.dietaryType
        : 'mixed',
      address: data.address || '',
      promoted: Boolean(data.promoted),
      offerText: data.offerText || '',
      couponCode: data.couponCode || null,
      gradientColors: Array.isArray(data.gradientColors) && data.gradientColors.length >= 2
        ? data.gradientColors
        : ['#173a2b', '#0a1812'],
      cardBorderColor: data.cardBorderColor || 'rgba(76, 154, 106, 0.4)',
      isOpen: true,
      active: true,
      updatedAt: now,
    }, { merge: true });
    totalWritten++;

    // 2. Menu subcollection items
    for (let i = 0; i < menuArray.length; i++) {
      const item = menuArray[i];
      const itemId = item.id || `item_${i + 1}`;
      const itemRef = restaurantRef.collection('menuItems').doc(itemId);

      const price = typeof item.price === 'number' ? item.price : 0;
      const originalPrice = typeof item.originalPrice === 'number' ? item.originalPrice : null;

      restBatch.set(itemRef, {
        id: itemId,
        name: item.name || '',
        priceMinor: Math.round(price * 100),
        originalPriceMinor: originalPrice ? Math.round(originalPrice * 100) : null,
        description: item.description || '',
        image: item.image || '',
        rating: typeof item.rating === 'number' ? item.rating : 4.5,
        ratingCount: typeof item.ratingCount === 'number' ? item.ratingCount : 100,
        dietary: (item.dietary === 'veg' || item.dietary === 'non-veg' || item.dietary === 'egg') ? item.dietary : 'veg',
        prepTime: item.prepTime || '20 mins',
        category: item.category || 'Main Course',
        isCombo: Boolean(item.isCombo),
        comboIncludes: Array.isArray(item.comboIncludes) ? item.comboIncludes : null,
        bestseller: Boolean(item.bestseller),
        spicyLevel: (item.spicyLevel === 1 || item.spicyLevel === 2 || item.spicyLevel === 3) ? item.spicyLevel : null,
        calories: typeof item.calories === 'number' ? item.calories : null,
        cuisine: item.cuisine || null,
        available: true,
        sortOrder: i + 1,
        updatedAt: now,
      }, { merge: true });

      totalMenuItemsCount++;
      totalWritten++;
    }

    await restBatch.commit();
    console.log(`  + [${doc.id}] "${data.name}": Saved restaurant and ${menuArray.length} menu items.`);
  }

  console.log(`+ Migrated ${restaurantsSnap.size} restaurants and ${totalMenuItemsCount} total menu items.`);

  // -------------------------------------------------------------
  // Step 4: Migrate Grocery Categories
  // -------------------------------------------------------------
  console.log('\n--- Step 4: Migrating Grocery Categories ---');
  const groceryCategoriesSnap = await groceryDb.collection('categories').get();
  console.log(`Found ${groceryCategoriesSnap.size} categories in onebuddygrocery.`);

  if (!groceryCategoriesSnap.empty) {
    const catBatch = defaultDb.batch();
    let catSort = 1;
    for (const doc of groceryCategoriesSnap.docs) {
      const data = doc.data();
      catBatch.set(defaultDb.collection('catalogGroceryCategories').doc(doc.id), {
        id: doc.id,
        name: data.name || '',
        icon: data.icon || 'basket',
        image: data.image || '',
        productCount: typeof data.productCount === 'number' ? data.productCount : 0,
        backgroundColor: data.backgroundColor || '#E8F5E9',
        sortOrder: catSort++,
        active: true,
        updatedAt: now,
      }, { merge: true });
      totalWritten++;
    }
    await catBatch.commit();
    console.log(`+ Migrated ${groceryCategoriesSnap.size} grocery categories.`);
  }

  // -------------------------------------------------------------
  // Step 5: Migrate Grocery Offers
  // -------------------------------------------------------------
  console.log('\n--- Step 5: Migrating Grocery Offers ---');
  const groceryOffersSnap = await groceryDb.collection('offers').get();
  console.log(`Found ${groceryOffersSnap.size} offers in onebuddygrocery.`);

  if (!groceryOffersSnap.empty) {
    const offerBatch = defaultDb.batch();
    for (const doc of groceryOffersSnap.docs) {
      const data = doc.data();
      offerBatch.set(defaultDb.collection('catalogGroceryOffers').doc(doc.id), {
        id: doc.id,
        title: data.title || '',
        subtitle: data.subtitle || '',
        discountTag: data.discountTag || '',
        code: data.code || null,
        image: data.image || '',
        backgroundColor: data.backgroundColor || '#FEF3C7',
        categoryId: data.categoryId || null,
        active: true,
        updatedAt: now,
      }, { merge: true });
      totalWritten++;
    }
    await offerBatch.commit();
    console.log(`+ Migrated ${groceryOffersSnap.size} grocery offers.`);
  }

  // -------------------------------------------------------------
  // Step 6: Migrate Grocery Products (Batched)
  // -------------------------------------------------------------
  console.log('\n--- Step 6: Migrating Grocery Products (Minor Units / Paise) ---');
  const groceryProductsSnap = await groceryDb.collection('products').get();
  console.log(`Found ${groceryProductsSnap.size} products in onebuddygrocery.`);

  let productBatch = defaultDb.batch();
  let count = 0;

  for (let i = 0; i < groceryProductsSnap.docs.length; i++) {
    const doc = groceryProductsSnap.docs[i];
    const data = doc.data();

    const price = typeof data.price === 'number' ? data.price : 0;
    const discountPrice = typeof data.discountPrice === 'number' ? data.discountPrice : price;
    const priceMinor = Math.round(price * 100);
    const discountPriceMinor = Math.round(discountPrice * 100);

    const productRef = defaultDb.collection('catalogGroceryProducts').doc(doc.id);
    productBatch.set(productRef, {
      id: doc.id,
      name: data.name || '',
      brand: data.brand || '',
      categoryId: data.categoryId || '',
      categoryName: data.categoryName || '',
      description: data.description || '',
      image: data.image || '',
      priceMinor,
      discountPriceMinor,
      discountPercentage: typeof data.discountPercentage === 'number'
        ? data.discountPercentage
        : (price > discountPrice && price > 0 ? Math.round(((price - discountPrice) / price) * 100) : 0),
      unit: data.unit || '1 unit',
      rating: typeof data.rating === 'number' ? data.rating : 4.5,
      reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
      stockQuantity: typeof data.stock === 'number' ? data.stock : 50,
      isFeatured: Boolean(data.isFeatured),
      isAvailable: data.isAvailable !== false,
      sortOrder: i + 1,
      updatedAt: now,
    }, { merge: true });

    count++;
    totalWritten++;

    if (count % 300 === 0) {
      await productBatch.commit();
      productBatch = defaultDb.batch();
    }
  }

  if (count % 300 !== 0) {
    await productBatch.commit();
  }

  console.log(`+ Migrated ${groceryProductsSnap.size} grocery products.`);

  console.log('\n=============================================================');
  console.log(`SUCCESS: Migration complete! Total ${totalWritten} documents written to (default) database.`);
  console.log('Original databases (onebuddyfood, onebuddygrocery) were completely untouched.');
  console.log('=============================================================');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
