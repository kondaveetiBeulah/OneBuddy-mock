export interface Product {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  description: string;
  image: string;
  price: number;
  discountPrice: number;
  discountPercentage: number;
  unit: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isFeatured: boolean;
  isAvailable: boolean;
}

export type SortOption =
  | 'price_low_high'
  | 'price_high_low'
  | 'rating'
  | 'popularity'
  | 'discount'
  | 'newest';

export interface ProductFilter {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  brand?: string;
  inStockOnly?: boolean;
}
