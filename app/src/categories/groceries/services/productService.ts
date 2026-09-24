import { Product, ProductFilter, SortOption } from '../types/product.types';
import { Category } from '../types/category.types';
import { Offer } from '../types/offer.types';
import {
  fetchCategories,
  fetchProducts,
  fetchProductById,
  fetchFeaturedProducts,
  fetchOffers,
} from '../../../firebase/grocery-service';

export const productService = {
  async getProducts(filter?: ProductFilter, sort?: SortOption): Promise<Product[]> {
    const all = await fetchProducts();
    let result = [...all];

    if (filter) {
      if (filter.categoryId) {
        result = result.filter((p) => p.categoryId === filter.categoryId);
      }
      if (filter.minPrice !== undefined) {
        result = result.filter((p) => p.discountPrice >= filter.minPrice!);
      }
      if (filter.maxPrice !== undefined) {
        result = result.filter((p) => p.discountPrice <= filter.maxPrice!);
      }
      if (filter.minRating !== undefined) {
        result = result.filter((p) => p.rating >= filter.minRating!);
      }
      if (filter.brand) {
        result = result.filter(
          (p) => p.brand.toLowerCase() === filter.brand!.toLowerCase()
        );
      }
      if (filter.inStockOnly) {
        result = result.filter((p) => p.stock > 0 && p.isAvailable);
      }
    }

    if (sort) {
      switch (sort) {
        case 'price_low_high':
          result.sort((a, b) => a.discountPrice - b.discountPrice);
          break;
        case 'price_high_low':
          result.sort((a, b) => b.discountPrice - a.discountPrice);
          break;
        case 'rating':
          result.sort((a, b) => b.rating - a.rating);
          break;
        case 'popularity':
          result.sort((a, b) => b.reviewCount - a.reviewCount);
          break;
        case 'discount':
          result.sort((a, b) => b.discountPercentage - a.discountPercentage);
          break;
        case 'newest':
          result.reverse();
          break;
      }
    }

    return result;
  },

  async getProductById(id: string): Promise<Product | null> {
    return fetchProductById(id);
  },

  async getFeaturedProducts(): Promise<Product[]> {
    return fetchFeaturedProducts();
  },

  async searchProducts(query: string): Promise<Product[]> {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return [];

    const products = await fetchProducts();

    // Category synonyms mapping for precise voice and text intent matching
    const CATEGORY_MAP: Record<string, string[]> = {
      cat_fruits: ['fruit', 'fruits', 'fresh fruit', 'fresh fruits', 'organic fruits', 'apple', 'banana', 'mango', 'orange', 'grapes'],
      cat_vegetables: ['vegetable', 'vegetables', 'veggie', 'veggies', 'fresh vegetable', 'fresh vegetables', 'sabzi', 'sabji', 'greens', 'leafy vegetables'],
      cat_dairy: ['dairy', 'dairy products', 'milk', 'curd', 'paneer', 'butter', 'cheese', 'ghee', 'cream'],
      cat_snacks: ['snack', 'snacks', 'munchies', 'chips', 'biscuits', 'namkeen', 'cookies', 'bhujia'],
      cat_house_necessities: ['house', 'house necessities', 'household', 'home necessities', 'cleaning', 'detergent', 'cleaner', 'pooja', 'agarbatti', 'incense'],
      cat_cosmetics: ['cosmetic', 'cosmetics', 'beauty', 'makeup', 'skincare', 'face wash', 'cream', 'lotion', 'lipstick'],
      cat_toys: ['toy', 'toys', 'games', 'game', 'puzzle', 'action figure', 'doll', 'kids toy'],
      cat_stationery: ['stationery', 'stationery items', 'office', 'school', 'notebook', 'pen', 'pencil', 'craft'],
      cat_gifts: ['gift', 'gifts', 'gifting', 'hampers', 'gift box', 'gift set', 'presents'],
      cat_jewellery: ['jewellery', 'jewelry', 'ornaments', 'necklace', 'earring', 'bangles', 'bracelet', 'ring'],
      cat_sanitary: ['sanitary', 'sanitary items', 'hygiene', 'pads', 'diapers', 'wipes', 'tissues', 'handwash'],
    };

    // Check if the search query directly targets a specific category
    let matchedCategoryIds: string[] = [];

    for (const [catId, keywords] of Object.entries(CATEGORY_MAP)) {
      if (
        keywords.some(
          (k) =>
            cleanQuery === k ||
            cleanQuery === `${k}s` ||
            (k.length >= 4 && cleanQuery.startsWith(k)) ||
            (cleanQuery.length >= 4 && k.startsWith(cleanQuery))
        )
      ) {
        matchedCategoryIds.push(catId);
      }
    }

    // If query is an exact category match (e.g. "fruits", "vegetables", "dairy", "snacks", etc.),
    // return exclusively the products belonging to that category!
    if (matchedCategoryIds.length > 0) {
      const categoryProducts = products.filter((p) =>
        matchedCategoryIds.includes(p.categoryId)
      );
      if (categoryProducts.length > 0) {
        return categoryProducts;
      }
    }

    // General multi-word and keyword search with relevance scoring
    const queryWords = cleanQuery.split(/\s+/).filter(Boolean);

    const scored = products
      .map((p) => {
        const name = p.name.toLowerCase();
        const brand = p.brand.toLowerCase();
        const cat = p.categoryName.toLowerCase();
        const desc = p.description.toLowerCase();

        let score = 0;

        // Exact name match
        if (name === cleanQuery) score += 100;
        else if (name.startsWith(cleanQuery)) score += 80;
        else if (name.includes(cleanQuery)) score += 60;

        // Brand match
        if (brand.includes(cleanQuery)) score += 40;

        // Category match
        if (cat === cleanQuery) score += 50;
        else if (cat.includes(cleanQuery)) score += 30;

        // Individual word matching
        for (const word of queryWords) {
          const stem = word.endsWith('es')
            ? word.slice(0, -2)
            : word.endsWith('s')
            ? word.slice(0, -1)
            : word;

          if (name.includes(word) || (stem.length >= 3 && name.includes(stem))) {
            score += 25;
          }
          if (brand.includes(word)) {
            score += 15;
          }
          if (cat.includes(word) || (stem.length >= 3 && cat.includes(stem))) {
            score += 15;
          }
          if (desc.includes(word) || (stem.length >= 3 && desc.includes(stem))) {
            score += 5;
          }
        }

        return { product: p, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);

    return scored;
  },

  async getCategories(): Promise<Category[]> {
    return fetchCategories();
  },

  async getOffers(): Promise<Offer[]> {
    return fetchOffers();
  },
};
