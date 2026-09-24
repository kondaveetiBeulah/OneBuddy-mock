export type DietaryType = 'veg' | 'non-veg' | 'egg';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  rating: number;
  ratingCount: number;
  dietary: DietaryType;
  prepTime: string;
  category: 'Combos' | 'Starters' | 'Main Course' | 'Breads & Rice' | 'Desserts & Drinks' | 'Chef Special';
  isCombo?: boolean;
  comboIncludes?: string[];
  bestseller?: boolean;
  spicyLevel?: 1 | 2 | 3;
  calories?: number;
  cuisine?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  cuisine: string[];
  rating: number;
  totalRatings: string;
  deliveryTime: string;
  deliveryMins: number;
  distance: string;
  costForTwo: number;
  featuredImage: string;
  bannerImage: string;
  dietaryType: 'pure-veg' | 'non-veg' | 'mixed';
  address: string;
  promoted?: boolean;
  offerText: string;
  couponCode?: string;
  gradientColors: [string, string];
  cardBorderColor: string;
  menu: MenuItem[];
}

export interface OfferBanner {
  id: string;
  title: string;
  subtitle: string;
  discountBadge: string;
  code: string;
  restaurantId: string;
  restaurantName: string;
  gradientColors: [string, string, string];
  image: string;
}

export interface FilterState {
  sortBy: 'popularity' | 'rating' | 'deliveryTime' | 'costLowToHigh' | 'costHighToLow';
  dietary: 'all' | 'pure-veg' | 'non-veg';
  costForTwo: 'all' | 'under300' | '300to600' | 'above600';
  maxDeliveryTime: number;
  onlyCombos: boolean;
  rating4Plus: boolean;
  searchQuery: string;
}

export interface CartItem {
  restaurantId: string;
  restaurantName: string;
  item: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Order {
  orderId: string;
  restaurant: Restaurant;
  items: CartItem[];
  itemTotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  couponApplied?: string;
  finalTotal: number;
  deliveryAddress: string;
  placedAt: string;
  status: 'Order Placed' | 'Preparing in Kitchen' | 'Rider on the Way' | 'Delivered';
  estimatedDelivery: string;
}
