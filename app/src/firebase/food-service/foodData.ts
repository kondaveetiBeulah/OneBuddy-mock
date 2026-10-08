import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config';
import { MenuItem, OfferBanner, Restaurant } from '../../categories/food/types';

/* ─────────────── Defensive Mappers ─────────────── */

export function mapMenuItem(item: any, idx: number): MenuItem {
  // Convert minor units (paise) back to rupees if present, else fallback
  const price = typeof item.priceMinor === 'number'
    ? item.priceMinor / 100
    : (typeof item.price === 'number' ? item.price : 0);

  const originalPrice = typeof item.originalPriceMinor === 'number'
    ? item.originalPriceMinor / 100
    : (typeof item.originalPrice === 'number' ? item.originalPrice : undefined);

  return {
    id: item.id || `item-${idx}`,
    name: item.name || '',
    price,
    originalPrice,
    description: item.description || '',
    image: item.image || '',
    rating: typeof item.rating === 'number' ? item.rating : 4.5,
    ratingCount: typeof item.ratingCount === 'number' ? item.ratingCount : 100,
    dietary: (item.dietary === 'veg' || item.dietary === 'non-veg' || item.dietary === 'egg') ? item.dietary : 'veg',
    prepTime: item.prepTime || '20 mins',
    category: item.category || 'Main Course',
    isCombo: Boolean(item.isCombo),
    comboIncludes: Array.isArray(item.comboIncludes) ? item.comboIncludes : undefined,
    bestseller: Boolean(item.bestseller),
    spicyLevel: item.spicyLevel === 1 || item.spicyLevel === 2 || item.spicyLevel === 3 ? item.spicyLevel : undefined,
    calories: typeof item.calories === 'number' ? item.calories : undefined,
    cuisine: item.cuisine || undefined,
  };
}

export function mapRestaurant(docId: string, data: any, menuItems: MenuItem[] = []): Restaurant {
  const gradientColors: [string, string] =
    Array.isArray(data.gradientColors) && data.gradientColors.length >= 2
      ? [String(data.gradientColors[0]), String(data.gradientColors[1])]
      : ['#173a2b', '#0a1812'];

  const costForTwo = typeof data.costForTwoMinor === 'number'
    ? data.costForTwoMinor / 100
    : (typeof data.costForTwo === 'number' ? data.costForTwo : 350);

  const totalRatings = typeof data.ratingCount === 'number'
    ? `${data.ratingCount}+ ratings`
    : (data.totalRatings || '100+ ratings');

  // Use subcollection menu items if provided; else fall back to legacy embedded menu array
  const rawMenu = menuItems.length > 0
    ? menuItems
    : (Array.isArray(data.menu) ? data.menu.map((item: any, idx: number) => mapMenuItem(item, idx)) : []);

  const menu = rawMenu.filter((m: MenuItem) =>
    Boolean(m.image && m.image.trim().length > 0 && m.image !== 'null' && m.image !== 'undefined')
  );

  return {
    id: data.id || docId,
    name: data.name || '',
    tagline: data.tagline || '',
    cuisine: Array.isArray(data.cuisine) ? data.cuisine : [],
    rating: typeof data.rating === 'number' ? data.rating : 4.5,
    totalRatings,
    deliveryTime: data.deliveryTime || '20-25 mins',
    deliveryMins: typeof data.deliveryMins === 'number' ? data.deliveryMins : 25,
    distance: data.distance || '2.0 km',
    costForTwo,
    featuredImage: data.featuredImage || '',
    bannerImage: data.bannerImage || data.featuredImage || '',
    dietaryType: (data.dietaryType === 'pure-veg' || data.dietaryType === 'non-veg' || data.dietaryType === 'mixed')
      ? data.dietaryType
      : 'mixed',
    address: data.address || '',
    promoted: Boolean(data.promoted),
    offerText: data.offerText || '',
    couponCode: data.couponCode || undefined,
    gradientColors,
    cardBorderColor: data.cardBorderColor || 'rgba(76, 154, 106, 0.4)',
    menu,
  };
}

export function mapBanner(docId: string, data: any): OfferBanner {
  const gradientColors: [string, string, string] =
    Array.isArray(data.gradientColors) && data.gradientColors.length >= 3
      ? [String(data.gradientColors[0]), String(data.gradientColors[1]), String(data.gradientColors[2])]
      : ['#4e1f6e', '#2d1241', '#12061b'];

  return {
    id: data.id || docId,
    title: data.title || '',
    subtitle: data.subtitle || '',
    discountBadge: data.discountBadge || '',
    code: data.code || '',
    restaurantId: data.restaurantId || '',
    restaurantName: data.restaurantName || '',
    gradientColors,
    image: data.image || '',
  };
}

/* ─────────────── One-Time Fetchers ─────────────── */

export async function fetchBanners(): Promise<OfferBanner[]> {
  if (!db) {
    console.warn('[FoodBackend] db is not initialized.');
    return [];
  }
  try {
    const q = query(collection(db, 'catalogFoodBanners'), where('active', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapBanner(d.id, d.data()));
  } catch (err) {
    console.error('[FoodBackend] Error fetching banners:', err);
    return [];
  }
}

export async function fetchMenuItems(restaurantId: string): Promise<MenuItem[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'catalogRestaurants', restaurantId, 'menuItems'),
      where('available', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d: any, idx: number) => mapMenuItem({ id: d.id, ...d.data() }, idx))
      .filter((m: MenuItem) => Boolean(m.image && m.image.trim().length > 0 && m.image !== 'null' && m.image !== 'undefined'));
  } catch (err) {
    console.error(`[FoodBackend] Error fetching menu items for ${restaurantId}:`, err);
    return [];
  }
}

export async function fetchRestaurants(): Promise<Restaurant[]> {
  if (!db) {
    console.warn('[FoodBackend] db is not initialized.');
    return [];
  }
  try {
    const q = query(collection(db, 'catalogRestaurants'), where('active', '==', true));
    const snap = await getDocs(q);
    
    // Fetch menu items for each restaurant in parallel
    const restaurants = await Promise.all(
      snap.docs.map(async (d) => {
        const menuItems = await fetchMenuItems(d.id);
        return mapRestaurant(d.id, d.data(), menuItems);
      })
    );
    return restaurants;
  } catch (err) {
    console.error('[FoodBackend] Error fetching restaurants:', err);
    return [];
  }
}

export async function fetchRestaurantById(restaurantId: string): Promise<Restaurant | null> {
  if (!db) return null;
  try {
    const ref = doc(db, 'catalogRestaurants', restaurantId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const menuItems = await fetchMenuItems(restaurantId);
      return mapRestaurant(snap.id, snap.data(), menuItems);
    }
  } catch (err) {
    console.error(`[FoodBackend] Error fetching restaurant ${restaurantId}:`, err);
  }
  return null;
}

/* ─────────────── Real-Time Subscriptions ─────────────── */

export function subscribeBanners(
  onData: (banners: OfferBanner[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, 'catalogFoodBanners'), where('active', '==', true));
  return onSnapshot(
    q,
    (snap) => {
      const banners = snap.docs.map((d) => mapBanner(d.id, d.data()));
      onData(banners);
    },
    (err) => {
      console.error('[FoodBackend] Banners subscription error:', err);
      onError?.(err);
    }
  );
}

export function subscribeRestaurants(
  onData: (restaurants: Restaurant[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, 'catalogRestaurants'), where('active', '==', true));
  return onSnapshot(
    q,
    async (snap) => {
      const restaurants = await Promise.all(
        snap.docs.map(async (d) => {
          const menuItems = await fetchMenuItems(d.id);
          return mapRestaurant(d.id, d.data(), menuItems);
        })
      );
      onData(restaurants);
    },
    (err) => {
      console.error('[FoodBackend] Restaurants subscription error:', err);
      onError?.(err);
    }
  );
}
