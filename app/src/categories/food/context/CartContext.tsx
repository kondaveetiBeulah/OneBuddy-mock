import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, MenuItem, Order, Restaurant } from '../types';
import { useFoodData } from './FoodDataContext';

const safeStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      try { window.localStorage.setItem(key, value); } catch (e) {}
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      try { window.localStorage.removeItem(key); } catch (e) {}
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  }
};

interface CartContextType {
  cart: CartItem[];
  currentRestaurant: Restaurant | null;
  addToCart: (item: MenuItem, restaurant: Restaurant, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  getItemQuantity: (itemId: string) => number;
  totalItemCount: number;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  finalTotal: number;
  couponCode: string;
  applyCoupon: (code: string) => { success: boolean; message: string; discountAmt?: number };
  removeCoupon: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  placeOrder: (deliveryAddress: string) => Order;
  orders: Order[];
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  conflictModalState: {
    isOpen: boolean;
    pendingItem?: MenuItem;
    pendingRestaurant?: Restaurant;
  };
  resolveConflict: (confirmSwitch: boolean) => void;
  favorites: string[];
  toggleFavorite: (restaurantId: string) => void;
  isFavorite: (restaurantId: string) => boolean;
  favoriteItems: string[];
  toggleFavoriteItem: (itemId: string) => void;
  isFavoriteItem: (itemId: string) => boolean;
  activeAddress: import('../data/address').Address | null;
  setActiveAddress: (address: import('../data/address').Address | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { restaurants } = useFoodData();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<string[]>([]);
  const [activeAddress, setActiveAddressState] = useState<import('../data/address').Address | null>(null);

  useEffect(() => {
    safeStorage.getItem('OB_ORDERS').then(data => {
      if (data) {
        try {
          setOrders(JSON.parse(data));
        } catch (e) {}
      }
    });
    safeStorage.getItem('OB_ACTIVE_ADDRESS').then(data => {
      if (data) {
        try {
          setActiveAddressState(JSON.parse(data));
        } catch (e) {}
      }
    });
    safeStorage.getItem('OB_CART').then(data => {
      if (data) {
        try {
          setCart(JSON.parse(data));
        } catch (e) {}
      }
    });
    safeStorage.getItem('OB_CURRENT_RESTAURANT').then(data => {
      if (data) {
        setCurrentRestaurantId(data);
      }
    });
  }, []);

  useEffect(() => {
    safeStorage.setItem('OB_ORDERS', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    safeStorage.setItem('OB_CART', JSON.stringify(cart));
    if (currentRestaurantId) {
      safeStorage.setItem('OB_CURRENT_RESTAURANT', currentRestaurantId);
    } else {
      safeStorage.removeItem('OB_CURRENT_RESTAURANT');
    }
  }, [cart, currentRestaurantId]);

  const setActiveAddress = (address: import('../data/address').Address | null) => {
    setActiveAddressState(address);
    if (address) {
      safeStorage.setItem('OB_ACTIVE_ADDRESS', JSON.stringify(address));
    } else {
      safeStorage.removeItem('OB_ACTIVE_ADDRESS');
    }
  };

  const [conflictModalState, setConflictModalState] = useState<{
    isOpen: boolean;
    pendingItem?: MenuItem;
    pendingRestaurant?: Restaurant;
  }>({ isOpen: false });

  const currentRestaurant = currentRestaurantId
    ? restaurants.find((r) => r.id === currentRestaurantId) || null
    : null;

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
  const itemDiscounts = cart.reduce((sum, item) => {
    if (item.item.originalPrice && item.item.originalPrice > item.item.price) {
      return sum + (item.item.originalPrice - item.item.price) * item.quantity;
    }
    return sum;
  }, 0);
  const deliveryFee = subtotal > 0 ? (subtotal >= 400 ? 0 : 35) : 0;
  const tax = 0;
  const discount = Math.min(discountAmount, subtotal);
  const finalTotal = Math.max(0, subtotal + deliveryFee - itemDiscounts - discount);

  const evaluateCoupon = (code: string, currentSubtotal: number) => {
    const cleanCode = code.toUpperCase().trim();
    if (cleanCode === 'ONEBUDDY50' || cleanCode === 'KRISHNNA50') {
      return Math.min(Math.round(currentSubtotal * 0.5), 100);
    }
    if (cleanCode === 'ROYALBIRYANI') {
      return Math.min(Math.round(currentSubtotal * 0.6), 150);
    }
    if (cleanCode === 'SEAFOOD125' && currentSubtotal >= 400) {
      return 125;
    }
    if (cleanCode === 'BAWARCHI100' && currentSubtotal >= 350) {
      return 100;
    }
    if (cleanCode === 'ASIANSPICE') {
      return Math.min(Math.round(currentSubtotal * 0.4), 120);
    }
    if (cleanCode === 'BOGOPIZZA') {
      return Math.min(Math.round(currentSubtotal * 0.4), 180);
    }
    if (cleanCode === 'FREEDEL') {
      return 35;
    }
    return 0;
  };

  const applyCoupon = (code: string) => {
    const cleanCode = code.toUpperCase().trim();
    if (!cleanCode) {
      return { success: false, message: 'Please enter a coupon code' };
    }
    const amt = evaluateCoupon(cleanCode, subtotal);
    if (amt > 0) {
      setCouponCode(cleanCode);
      setDiscountAmount(amt);
      return { success: true, message: `Coupon applied! You saved ₹${amt}`, discountAmt: amt };
    } else {
      if (cleanCode === 'SEAFOOD125') {
        return { success: false, message: 'Code SEAFOOD125 valid on orders above ₹400' };
      }
      if (cleanCode === 'BAWARCHI100') {
        return { success: false, message: 'Code BAWARCHI100 valid on orders above ₹350' };
      }
      return { success: false, message: 'Invalid or expired coupon code' };
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscountAmount(0);
  };

  const addToCart = (item: MenuItem, restaurant: Restaurant, quantity = 1) => {
    if (currentRestaurantId && currentRestaurantId !== restaurant.id && cart.length > 0) {
      setConflictModalState({
        isOpen: true,
        pendingItem: item,
        pendingRestaurant: restaurant,
      });
      return;
    }

    setCurrentRestaurantId(restaurant.id);
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + quantity } : ci
        );
      }
      return [
        ...prev,
        {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          item,
          quantity,
        },
      ];
    });
  };

  const resolveConflict = (confirmSwitch: boolean) => {
    if (confirmSwitch && conflictModalState.pendingItem && conflictModalState.pendingRestaurant) {
      const { pendingItem, pendingRestaurant } = conflictModalState;
      setCart([
        {
          restaurantId: pendingRestaurant.id,
          restaurantName: pendingRestaurant.name,
          item: pendingItem,
          quantity: 1,
        },
      ]);
      setCurrentRestaurantId(pendingRestaurant.id);
    }
    setConflictModalState({ isOpen: false });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((ci) => {
          if (ci.item.id === itemId) {
            const nextQty = ci.quantity + delta;
            return nextQty > 0 ? { ...ci, quantity: nextQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];

      if (updated.length === 0) {
        setCurrentRestaurantId(null);
        removeCoupon();
      }
      return updated;
    });
  };

  const removeFromCart = (itemId: string) => {
    updateQuantity(itemId, -999);
  };

  const clearCart = () => {
    setCart([]);
    setCurrentRestaurantId(null);
    removeCoupon();
  };

  const getItemQuantity = (itemId: string) => {
    const found = cart.find((ci) => ci.item.id === itemId);
    return found ? found.quantity : 0;
  };

  const toggleFavorite = (restaurantId: string) => {
    setFavorites((prev) =>
      prev.includes(restaurantId) ? prev.filter((id) => id !== restaurantId) : [...prev, restaurantId]
    );
  };

  const isFavorite = (restaurantId: string) => favorites.includes(restaurantId);

  const toggleFavoriteItem = (itemId: string) => {
    setFavoriteItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const isFavoriteItem = (itemId: string) => favoriteItems.includes(itemId);

  const placeOrder = (deliveryAddress: string): Order => {
    if (!currentRestaurant || cart.length === 0) {
      throw new Error('Cart is empty');
    }

    const newOrder: Order = {
      orderId: `OB-${Math.floor(100000 + Math.random() * 900000)}`,
      restaurant: currentRestaurant,
      items: [...cart],
      itemTotal: subtotal,
      deliveryFee,
      tax,
      discount,
      couponApplied: couponCode || undefined,
      finalTotal,
      deliveryAddress,
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Preparing in Kitchen',
      estimatedDelivery: `${currentRestaurant.deliveryMins} mins`,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    clearCart();
    setIsCartDrawerOpen(false);

    return newOrder;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        currentRestaurant,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemQuantity,
        totalItemCount,
        subtotal,
        deliveryFee,
        tax,
        discount,
        finalTotal,
        couponCode,
        applyCoupon,
        removeCoupon,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        placeOrder,
        orders,
        activeOrder,
        setActiveOrder,
        conflictModalState,
        resolveConflict,
        favorites,
        toggleFavorite,
        isFavorite,
        favoriteItems,
        toggleFavoriteItem,
        isFavoriteItem,
        activeAddress,
        setActiveAddress,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const useOptionalCart = () => {
  return useContext(CartContext);
};









