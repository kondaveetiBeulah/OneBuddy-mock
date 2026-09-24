import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, PriceSummaryData } from '../types/cart.types';
import { Product } from '../types/product.types';
import { storageHelper, STORAGE_KEYS } from '../utils/helpers';

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

    if (existingIndex > -1) {
      updated = cartItems.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      updated = [...cartItems, { product, quantity }];
    }

    saveCartToStorage(updated);
  };

  const removeFromCart = (productId: string) => {
    const updated = cartItems.filter((item) => item.product.id !== productId);
    saveCartToStorage(updated);
  };

  const increaseQuantity = (productId: string) => {
    const updated = cartItems.map((item) =>
      item.product.id === productId
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
    saveCartToStorage(updated);
  };

  const decreaseQuantity = (productId: string) => {
    const existingItem = cartItems.find((item) => item.product.id === productId);
    if (!existingItem) return;

    if (existingItem.quantity <= 1) {
      removeFromCart(productId);
    } else {
      const updated = cartItems.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
      saveCartToStorage(updated);
    }
  };

  const clearCart = () => {
    saveCartToStorage([]);
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
