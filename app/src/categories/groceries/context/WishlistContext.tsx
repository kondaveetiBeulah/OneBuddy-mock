import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { Product } from '../types/product.types';
import { storageHelper, STORAGE_KEYS } from '../utils/helpers';

interface WishlistContextType {
  wishlistItems: Product[];
  wishlistCount: number;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);

  useEffect(() => {
    loadWishlistFromStorage();
  }, []);

  const loadWishlistFromStorage = async () => {
    try {
      const stored = await storageHelper.getItem<Product[]>(STORAGE_KEYS.WISHLIST_ITEMS);
      if (stored && Array.isArray(stored)) {
        setWishlistItems(stored);
      }
    } catch (e) {
      console.warn('Failed to load wishlist:', e);
    }
  };

  const persistWishlist = (items: Product[]) => {
    // Non-blocking background persistence
    storageHelper.setItem(STORAGE_KEYS.WISHLIST_ITEMS, items).catch((e) => {
      console.warn('Failed to save wishlist:', e);
    });
  };

  // Instant O(1) lookup set for high performance across lists
  const wishlistIdSet = useMemo(() => {
    return new Set(wishlistItems.map((item) => item.id));
  }, [wishlistItems]);

  const isInWishlist = useCallback(
    (productId: string): boolean => {
      return wishlistIdSet.has(productId);
    },
    [wishlistIdSet]
  );

  const addToWishlist = useCallback((product: Product) => {
    setWishlistItems((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;
      const updated = [product, ...prev];
      persistWishlist(updated);
      return updated;
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlistItems((prev) => {
      const updated = prev.filter((item) => item.id !== productId);
      persistWishlist(updated);
      return updated;
    });
  }, []);

  const toggleWishlist = useCallback((product: Product) => {
    setWishlistItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      const updated = exists
        ? prev.filter((item) => item.id !== product.id)
        : [product, ...prev];
      persistWishlist(updated);
      return updated;
    });
  }, []);

  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
    persistWishlist([]);
  }, []);

  const contextValue = useMemo(
    () => ({
      wishlistItems,
      wishlistCount: wishlistItems.length,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      clearWishlist,
    }),
    [
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      clearWishlist,
    ]
  );

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
