import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, PriceSummaryData } from '../types/cart.types';
import { Product } from '../types/product.types';
import { storageHelper, STORAGE_KEYS } from '../utils/helpers';
import {
  syncServerCartItem,
  removeServerCartItem,
  clearServerCart,
  fetchServerCart,
} from '../../../firebase/services/cartService';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  getItemQuantity: (productId: string) => number;
  getPriceSummary: () => PriceSummaryData;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    loadCartFromStorage();
    // Reconcile with server cart
    fetchServerCart('grocery')
      .then((serverCart) => {
        if (serverCart && serverCart.items && serverCart.items.length > 0) {
          const restored: CartItem[] = serverCart.items.map((it) => ({
            product: {
              id: it.productId,
              name: it.name,
              brand: 'OneBuddy Fresh',
              price: it.price,
              discountPrice: it.discountPrice,
              discountPercentage: it.price > it.discountPrice ? Math.round(((it.price - it.discountPrice) / it.price) * 100) : 0,
              image: it.image,
              unit: '1 unit',
              rating: 4.5,
              reviewCount: 50,
              stock: 100,
              isAvailable: true,
              isFeatured: false,
              categoryId: 'general',
              categoryName: 'Groceries',
              description: '',
            },
            quantity: it.quantity,
          }));
          setCartItems(restored);
          storageHelper.setItem(STORAGE_KEYS.CART_ITEMS, restored).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const loadCartFromStorage = async () => {
    const storedCart = await storageHelper.getItem<CartItem[]>(STORAGE_KEYS.CART_ITEMS);
    if (storedCart) {
      setCartItems(storedCart);
    }
  };

  const saveCartToStorage = async (items: CartItem[]) => {
    setCartItems(items);
    await storageHelper.setItem(STORAGE_KEYS.CART_ITEMS, items);
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    const existingIndex = cartItems.findIndex((item) => item.product.id === product.id);
    let updated: CartItem[];
    let nextQty = quantity;

    if (existingIndex > -1) {
      nextQty = cartItems[existingIndex].quantity + quantity;
      updated = cartItems.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: nextQty }
          : item
      );
    } else {
      updated = [...cartItems, { product, quantity }];
    }

    saveCartToStorage(updated);

    // Optimistic background sync with Cloud Functions
    syncServerCartItem({
      service: 'grocery',
      productId: product.id,
      quantity: nextQty,
    }).catch((err: any) => {
      if (err?.code === 'not-found' || err?.code === 'unauthenticated' || err?.message?.includes('not-found')) {
        return; // Silent fallback when cloud functions are offline or guest mode
      }
      console.warn('[Grocery CartContext] Background sync note:', err);
    });
  };

  const removeFromCart = (productId: string) => {
    const updated = cartItems.filter((item) => item.product.id !== productId);
    saveCartToStorage(updated);
    removeServerCartItem(productId, 'grocery').catch(() => {});
  };

  const increaseQuantity = (productId: string) => {
    const item = cartItems.find((i) => i.product.id === productId);
    const nextQty = (item ? item.quantity : 0) + 1;
    const updated = cartItems.map((i) =>
      i.product.id === productId
        ? { ...i, quantity: nextQty }
        : i
    );
    saveCartToStorage(updated);
    syncServerCartItem({
      service: 'grocery',
      productId,
      quantity: nextQty,
    }).catch(() => {});
  };

  const decreaseQuantity = (productId: string) => {
    const existingItem = cartItems.find((item) => item.product.id === productId);
    if (!existingItem) return;

    if (existingItem.quantity <= 1) {
      removeFromCart(productId);
    } else {
      const nextQty = existingItem.quantity - 1;
      const updated = cartItems.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: nextQty }
          : item
      );
      saveCartToStorage(updated);
      syncServerCartItem({
        service: 'grocery',
        productId,
        quantity: nextQty,
      }).catch(() => {});
    }
  };

  const clearCart = () => {
    saveCartToStorage([]);
    clearServerCart('grocery').catch(() => {});
  };

  const getCartCount = (): number => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getItemQuantity = (productId: string): number => {
    const found = cartItems.find((item) => item.product.id === productId);
    return found ? found.quantity : 0;
  };

  const getCartTotal = (): number => {
    return cartItems.reduce(
      (sum, item) => sum + item.product.discountPrice * item.quantity,
      0
    );
  };

  const getPriceSummary = (): PriceSummaryData => {
    const originalSubtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const subtotal = getCartTotal();
    const discount = Math.max(0, originalSubtotal - subtotal);
    const deliveryFee = subtotal > 100 || cartItems.length === 0 ? 0 : 29;
    const tax = 0; // Prices are inclusive of all taxes
    const total = Math.max(0, subtotal + deliveryFee - discount);
    const itemCount = getCartCount();

    return {
      subtotal,
      discount,
      deliveryFee,
      tax,
      total,
      itemCount,
    };
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        getItemQuantity,
        getPriceSummary,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
