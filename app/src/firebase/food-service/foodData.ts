import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config';
import { MenuItem, OfferBanner, Restaurant } from '../../categories/food/types';

/* ─────────────── Defensive Mappers ─────────────── */

function mapMenuItem(item: any, idx: number): MenuItem {
  return {
    id: item.id || `item-${idx}`,
    name: item.name || '',
    price: typeof item.price === 'number' ? item.price : 0,
    originalPrice: typeof item.originalPrice === 'number' ? item.originalPrice : undefined,
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

export function mapRestaurant(docId: string, data: any): Restaurant {
  const gradientColors: [string, string] =
    Array.isArray(data.gradientColors) && data.gradientColors.length >= 2
      ? [String(data.gradientColors[0]), String(data.gradientColors[1])]
      : ['#173a2b', '#0a1812'];

  return {
    id: data.id || docId,
    name: data.name || '',
    tagline: data.tagline || '',
    cuisine: Array.isArray(data.cuisine) ? data.cuisine : [],
    rating: typeof data.rating === 'number' ? data.rating : 4.5,
    totalRatings: data.totalRatings || '1k+ ratings',
    deliveryTime: data.deliveryTime || '20-25 mins',
    deliveryMins: typeof data.deliveryMins === 'number' ? data.deliveryMins : 25,
    distance: data.distance || '2.0 km',
    costForTwo: typeof data.costForTwo === 'number' ? data.costForTwo : 350,
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
    menu: Array.isArray(data.menu) ? data.menu.map(mapMenuItem) : [],
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
    const snap = await getDocs(collection(db, 'banners'));
    return snap.docs.map((d) => mapBanner(d.id, d.data()));
  } catch (err) {
    console.error('[FoodBackend] Error fetching banners:', err);
    return [];
  }
}

export async function fetchRestaurants(): Promise<Restaurant[]> {
  if (!db) {
    console.warn('[FoodBackend] db is not initialized.');
    return [];
  }
  try {
    const snap = await getDocs(collection(db, 'restaurants'));
    return snap.docs.map((d) => mapRestaurant(d.id, d.data()));
  } catch (err) {
    console.error('[FoodBackend] Error fetching restaurants:', err);
    return [];
  }
}

export async function fetchRestaurantById(restaurantId: string): Promise<Restaurant | null> {
  if (!db) return null;
  try {
    const ref = doc(db, 'restaurants', restaurantId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return mapRestaurant(snap.id, snap.data());
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
  return onSnapshot(
    collection(db, 'banners'),
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
  return onSnapshot(
    collection(db, 'restaurants'),
    (snap) => {
      const restaurants = snap.docs.map((d) => mapRestaurant(d.id, d.data()));
      onData(restaurants);
    },
    (err) => {
      console.error('[FoodBackend] Restaurants subscription error:', err);
      onError?.(err);
    }
  );
}
