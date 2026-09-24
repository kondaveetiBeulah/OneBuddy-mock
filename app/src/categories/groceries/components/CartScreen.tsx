import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  StatusBar,
  FlatList,
  TextInput,
  Modal,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, useGroceryColors, darkColors, lightColors } from '../theme';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { storageHelper, STORAGE_KEYS, fetchLiveAddressDetails } from '../utils/helpers';
import { Product } from '../types/product.types';
import { CartItem as CartItemType } from '../types/cart.types';
import { RootStackParamList } from '../types/navigation.types';

export interface CrossSellItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  tag?: string;
  category?: string;
}

export type DeliveryMode = 'standard' | 'express';
export type TipAmount = number;

export interface SavedAddressItem {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  houseNo: string;
  building?: string;
  landmark?: string;
  formattedAddress: string;
  receiverName: string;
  receiverPhone: string;
}

const DEFAULT_SAVED_ADDRESSES: SavedAddressItem[] = [
  {
    id: 'addr_default_1',
    label: 'Home',
    houseNo: 'Flat 402',
    building: 'Sunshine Apts',
    landmark: 'Main Road',
    formattedAddress: 'Flat 402, Sunshine Apts, Main Road, Kurnool',
    receiverName: 'Anjali',
    receiverPhone: '9876543210',
  },
];

// ─── Constants ─────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  get background() { return colors.background; },
  get surface() { return colors.cardBackground; },
  get accent() { return colors.primary; },
  get accentDark() { return colors.primaryDark; },
  get accentLight() { return colors.primaryLight; },
  get accentMedium() { return colors.primaryMedium; },
  get secondary() { return colors.secondary; },
  get secondaryDark() { return colors.secondaryDark; },
  get secondaryLight() { return colors.secondaryLight; },
  get softHighlight() { return colors.primaryLight; },
  get textPrimary() { return colors.textPrimary; },
  get textSecondary() { return colors.textSecondary; },
  get textMuted() { return colors.textMuted; },
  get border() { return colors.border; },
  get borderLight() { return colors.borderLight; },
  get error() { return colors.danger; },
  get errorLight() { return colors.dangerLight; },
  get success() { return colors.success; },
  get successLight() { return colors.successLight; },
  get warning() { return colors.warning; },
  get warningLight() { return colors.warningLight; },
  get white() { return colors.white; },
  cardRadius: spacing.borderRadius.md,
  pillRadius: 20,
};

const DELIVERY_FEE = 29;

// ─── AnimatedPressable ───────────────────────────────────────────────────────
interface AnimatedPressableProps {
  onPress: () => void;
  style?: object | object[];
  children: React.ReactNode;
  scaleDown?: number;
}

const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  onPress,
  style,
  children,
  scaleDown = 0.96,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scaleDown,
      useNativeDriver: Platform.OS !== 'web',
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 30,
      bounciness: 8,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};


// ─── CartItemRow ─────────────────────────────────────────────────────────────
interface CartItemRowProps {
  item: {
    product: Product;
    quantity: number;
  };
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string, name: string) => void;
  onRemove: (productId: string, name: string) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}) => {
  const { product, quantity } = item;
  const unitPrice = product.discountPrice || product.price;
  const itemTotalPrice = unitPrice * quantity;
  const originalTotalPrice = product.price * quantity;

  return (
    <View style={styles.cartItemContainer}>
      <Image source={{ uri: product.image }} style={styles.cartItemImage} />
      <View style={styles.cartItemInfo}>
        <View style={styles.cartItemHeader}>
          <Text style={styles.cartItemCategory}>{product.categoryName || 'Grocery'}</Text>
          <TouchableOpacity
            onPress={() => onRemove(product.id, product.name)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
        <Text style={styles.cartItemName} numberOfLines={1}>{product.name}</Text>
        {product.unit ? (
          <Text style={styles.cartItemCustomization}>{product.unit}</Text>
        ) : null}
        <View style={styles.cartItemFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.cartItemPrice}>₹{itemTotalPrice.toFixed(0)}</Text>
            {product.price > unitPrice && (
              <Text style={styles.cartItemOriginalPrice}>₹{originalTotalPrice.toFixed(0)}</Text>
            )}
          </View>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              onPress={() => onDecrement(product.id, product.name)}
              style={styles.stepperBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperCount}>{quantity}</Text>
            <TouchableOpacity
              onPress={() => onIncrement(product.id)}
              style={styles.stepperBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── CrossSellCard ───────────────────────────────────────────────────────────
interface CrossSellCardProps {
  item: CrossSellItem;
  isAdded: boolean;
  onAdd: (item: CrossSellItem) => void;
  onDismiss?: (item: CrossSellItem) => void;
}

const CrossSellCard: React.FC<CrossSellCardProps> = ({ item, isAdded, onAdd, onDismiss }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleAdd = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: Platform.OS !== 'web', speed: 50 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: Platform.OS !== 'web', speed: 30, bounciness: 10 }),
    ]).start(() => onAdd(item));
  };

  return (
    <Animated.View style={[styles.crossSellCard, { transform: [{ scale: scaleAnim }] }]}>
      <Image source={{ uri: item.imageUrl }} style={styles.crossSellImage} />
      {onDismiss && (
        <TouchableOpacity
          onPress={() => onDismiss(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.crossSellDismissBtn}
        >
          <Ionicons name="close" size={14} color={COLORS.white} />
        </TouchableOpacity>
      )}
      {item.tag && (
        <View style={styles.crossSellTag}>
          <Text style={styles.crossSellTagText}>{item.tag}</Text>
        </View>
      )}
      <View style={styles.crossSellInfo}>
        {item.category && (
          <Text style={styles.crossSellCategoryTag} numberOfLines={1}>
            {item.category}
          </Text>
        )}
        <Text style={styles.crossSellName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.crossSellPriceRow}>
          <Text style={styles.crossSellPrice}>₹{item.price.toFixed(0)}</Text>
          {item.originalPrice && item.originalPrice > item.price && (
            <Text style={styles.crossSellOriginalPrice}>₹{item.originalPrice.toFixed(0)}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleAdd}
          style={[styles.crossSellAddBtn, isAdded && styles.crossSellAddBtnActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.crossSellAddText, isAdded && styles.crossSellAddTextActive]}>
            {isAdded ? '✓ Added' : '+ Add'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── TipChip ─────────────────────────────────────────────────────────────────
interface TipChipProps {
  amount: TipAmount;
  selected: boolean;
  onSelect: (amount: TipAmount) => void;
}

const TipChip: React.FC<TipChipProps> = ({ amount, selected, onSelect }) => {
  const bgAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  const handlePress = () => {
    onSelect(selected ? 0 : amount);
  };

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: selected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selected]);

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.surface, COLORS.accent],
  });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={{ flex: 1 }}>
      <Animated.View style={[styles.tipChip, { backgroundColor }]}>
        <Text
          style={[styles.tipChipText, { color: selected ? COLORS.white : COLORS.textPrimary }]}
        >
          {amount === 0 ? 'No Tip' : `₹${amount}`}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── CartScreen Component ────────────────────────────────────────────────────
export interface CartScreenProps {
  navigation?: NativeStackNavigationProp<RootStackParamList>;
  onProceed?: (total: number, couponDiscount?: number, tip?: number) => void;
  onBack?: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({ navigation: navProp, onProceed, onBack }) => {
  let isDark = false;
  try {
    const gc = useGroceryColors();
    isDark = gc === darkColors || gc.cardBackground === darkColors.cardBackground;
  } catch {
    isDark = isCategoryDark();
  }
  const activeColors = isDark ? darkColors : lightColors;

  const insets = useSafeAreaInsets();
  const hookNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const navigation = navProp || hookNav;

  const {
    cartItems,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    getCartCount,
  } = useCart();

  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('express');
  const [selectedTip, setSelectedTip] = useState<TipAmount>(0);
  const [addedCrossSell, setAddedCrossSell] = useState<Set<string>>(new Set());
  const [dismissedCrossSell, setDismissedCrossSell] = useState<Set<string>>(new Set());
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>(DEFAULT_SAVED_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr_default_1');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Sunshine Apts, Main Road, Kurnool');
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isAddOptionModalVisible, setIsAddOptionModalVisible] = useState(false);
  const [isLocationPermissionModalVisible, setIsLocationPermissionModalVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [houseNo, setHouseNo] = useState('');
  const [building, setBuilding] = useState('');
  const [landmark, setLandmark] = useState('');
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Work');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('✅ New address added successfully');
  const [isLoaded, setIsLoaded] = useState(false);

  // Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Updating...');
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const triggerQuickLoading = (text: string = 'Updating...', duration: number = 300, callback?: () => void) => {
    setLoadingText(text);
    setIsLoading(true);
    progressAnim.setValue(0.01);
    loadingAnim.setValue(0);

    Animated.parallel([
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    setTimeout(() => {
      Animated.timing(loadingAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setIsLoading(false);
        if (callback) callback();
      });
    }, duration);
  };

  // Undo Toast State
  const [undoToast, setUndoToast] = useState<{
    visible: boolean;
    message: string;
    onUndo?: () => void;
  }>({
    visible: false,
    message: '',
  });
  const undoTimeoutRef = useRef<any>(null);

  const triggerUndoToast = (message: string, onUndoAction?: () => void) => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoToast({
      visible: true,
      message,
      onUndo: onUndoAction,
    });
    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(prev => ({ ...prev, visible: false }));
    }, 4500);
  };

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    icon?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Yes remove',
    isDanger: true,
    onConfirm: () => { },
  });

  const requestConfirm = (
    title: string,
    message: string,
    onConfirmAction: () => void,
    options?: { confirmText?: string; isDanger?: boolean; icon?: string }
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: options?.confirmText || 'Yes remove',
      isDanger: options?.isDanger !== undefined ? options.isDanger : true,
      icon: options?.icon,
      onConfirm: () => {
        onConfirmAction();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const { selectedAddress, setSelectedAddress } = useUser();

  useEffect(() => {
    const loadSavedAddresses = async () => {
      try {
        const stored = await storageHelper.getItem<SavedAddressItem[]>(STORAGE_KEYS.SAVED_ADDRESSES);
        if (stored !== null && Array.isArray(stored)) {
          setSavedAddresses(stored);
          if (stored.length > 0) {
            setSelectedAddressId(stored[0].id);
            setDeliveryAddress(stored[0].formattedAddress);
          } else {
            setSelectedAddressId('');
            setDeliveryAddress('Select or Add Delivery Address');
          }
        } else if (selectedAddress) {
          const formatted = `${selectedAddress.houseNumber || ''}, ${selectedAddress.street || ''}, ${selectedAddress.city || ''}`.replace(/^,\s*|,\s*$/g, '');
          if (formatted) {
            const initialItem: SavedAddressItem = {
              id: selectedAddress.id,
              label: (selectedAddress.type === 'work' ? 'Work' : selectedAddress.type === 'other' ? 'Other' : 'Home') as any,
              houseNo: selectedAddress.houseNumber || '',
              building: selectedAddress.street || '',
              landmark: selectedAddress.landmark || selectedAddress.area || '',
              formattedAddress: formatted,
              receiverName: selectedAddress.name || '',
              receiverPhone: selectedAddress.phone || '',
            };
            setSavedAddresses([initialItem]);
            setSelectedAddressId(initialItem.id);
            setDeliveryAddress(formatted);
          }
        }
      } catch (e) {
        console.error('Failed to load saved addresses', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSavedAddresses();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      storageHelper.setItem(STORAGE_KEYS.SAVED_ADDRESSES, savedAddresses).catch(e =>
        console.error('Failed to save addresses data', e)
      );
    }
  }, [savedAddresses, isLoaded]);

  // ── Calculations ────────────────────────────────────────────────────────────
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product.discountPrice || item.product.price) * item.quantity,
    0
  );
  const FREE_DELIVERY_THRESHOLD = 100;
  // Free delivery ONLY when the amount is above 100 (> 100)
  const isFreeDelivery = subtotal > FREE_DELIVERY_THRESHOLD;
  const deliveryFee = isFreeDelivery ? 0 : (cartItems.length > 0 ? DELIVERY_FEE : 0);
  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  const itemDiscounts = cartItems.reduce((sum, item) => {
    const orig = item.product.price;
    const disc = item.product.discountPrice || item.product.price;
    if (orig > disc) {
      return sum + (orig - disc) * item.quantity;
    }
    return sum;
  }, 0);
  const totalDiscount = couponDiscount + itemDiscounts;

  const grandTotal = Math.max(0, subtotal + deliveryFee + selectedTip - totalDiscount);
  const cartCount = getCartCount();

  // ── Category-wise Recommendations Based on Selected Cart Items ─────────────
  const [selectedRecCategory, setSelectedRecCategory] = useState<string>('All');
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    productService.getProducts().then(setAllProducts).catch(() => {});
  }, []);

  const COMPLEMENTARY_CATEGORY_MAP: Record<string, string[]> = useMemo(() => ({
    cat_fruits: ['cat_vegetables', 'cat_dairy', 'cat_snacks'],
    cat_vegetables: ['cat_fruits', 'cat_dairy', 'cat_house_necessities'],
    cat_dairy: ['cat_snacks', 'cat_fruits', 'cat_vegetables'],
    cat_snacks: ['cat_fruits', 'cat_dairy'],
    cat_snacks_munchies: ['cat_drinks_juices', 'cat_sweet_tooth', 'cat_tea_coffee'],
    cat_drinks_juices: ['cat_snacks_munchies', 'cat_sweet_tooth'],
    cat_tea_coffee: ['cat_bakery_biscuits', 'cat_dairy_eggs', 'cat_snacks_munchies'],
    cat_bakery_biscuits: ['cat_tea_coffee', 'cat_dairy_eggs', 'cat_sweet_tooth'],
    cat_sweet_tooth: ['cat_snacks_munchies', 'cat_drinks_juices', 'cat_bakery_biscuits'],
    cat_pooja_items: ['cat_pooja_items', 'cat_cleaning_household'],
    cat_cleaning_household: ['cat_personal_care', 'cat_pooja_items'],
    cat_personal_care: ['cat_baby_toys', 'cat_cleaning_household'],
    cat_baby_toys: ['cat_personal_care', 'cat_snacks_munchies'],
  }), []);

  const cartCategories = useMemo(() => {
    const catSet = new Set<string>();
    cartItems.forEach(item => {
      if (item.product?.categoryName) {
        catSet.add(item.product.categoryName);
      }
    });
    return Array.from(catSet);
  }, [cartItems]);

  const recommendedProducts: CrossSellItem[] = useMemo(() => {
    const cartProductIds = new Set(cartItems.map(item => item.product.id));
    const cartCategoryIds = new Set(cartItems.map(item => item.product.categoryId).filter(Boolean));
    const cartCategoryNames = new Set(cartItems.map(item => item.product.categoryName?.toLowerCase()).filter(Boolean));

    // If a specific category tab is selected
    if (selectedRecCategory !== 'All') {
      return allProducts
        .filter(
          p =>
            p.categoryName?.toLowerCase() === selectedRecCategory.toLowerCase() &&
            !cartProductIds.has(p.id) &&
            !dismissedCrossSell.has(p.id)
        )
        .map(p => ({
          id: p.id,
          name: p.name,
          price: p.discountPrice || p.price,
          originalPrice: p.price > p.discountPrice ? p.price : undefined,
          imageUrl: p.image,
          tag: p.discountPercentage ? `${p.discountPercentage}% OFF` : p.isFeatured ? 'Popular' : undefined,
          category: p.categoryName,
        }));
    }

    // 1. Direct Category Matches from items in cart
    const directMatches = allProducts.filter(
      p =>
        ((p.categoryId && cartCategoryIds.has(p.categoryId)) ||
          (p.categoryName && cartCategoryNames.has(p.categoryName.toLowerCase()))) &&
        !cartProductIds.has(p.id) &&
        !dismissedCrossSell.has(p.id)
    );

    // 2. Complementary Category Matches
    const complementaryCategoryIds = new Set<string>();
    cartCategoryIds.forEach(catId => {
      const comp = COMPLEMENTARY_CATEGORY_MAP[catId];
      if (comp) {
        comp.forEach(c => complementaryCategoryIds.add(c));
      }
    });

    const complementaryMatches = allProducts.filter(
      p =>
        p.categoryId &&
        complementaryCategoryIds.has(p.categoryId) &&
        !cartCategoryIds.has(p.categoryId) &&
        !cartProductIds.has(p.id) &&
        !dismissedCrossSell.has(p.id)
    );

    // Merge: Direct category items first, then complementary items
    let matchedList = [...directMatches, ...complementaryMatches];

    // Fallback if cart is empty or no category match found
    if (matchedList.length === 0) {
      matchedList = allProducts.filter(
        p => !cartProductIds.has(p.id) && !dismissedCrossSell.has(p.id)
      );
    }

    return matchedList.slice(0, 12).map(p => ({
      id: p.id,
      name: p.name,
      price: p.discountPrice || p.price,
      originalPrice: p.price > p.discountPrice ? p.price : undefined,
      imageUrl: p.image,
      tag: p.discountPercentage ? `${p.discountPercentage}% OFF` : p.isFeatured ? 'Matches Cart' : undefined,
      category: p.categoryName,
    }));
  }, [allProducts, cartItems, cartCategories, selectedRecCategory, dismissedCrossSell, COMPLEMENTARY_CATEGORY_MAP]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleIncrement = useCallback((productId: string) => {
    increaseQuantity(productId);
  }, [increaseQuantity]);

  const handleDecrement = useCallback((productId: string, name: string) => {
    const currentItem = cartItems.find(i => i.product.id === productId);
    if (currentItem && currentItem.quantity === 1) {
      requestConfirm(
        'Remove from Cart',
        `Are you sure you want to delete "${name}" from your cart?`,
        () => {
          removeFromCart(productId);
          triggerUndoToast(`"${name}" removed from cart`, () => {
            addToCart(currentItem.product, 1);
          });
        },
        { confirmText: 'Yes remove', isDanger: true }
      );
    } else {
      decreaseQuantity(productId);
    }
  }, [cartItems, decreaseQuantity, removeFromCart, addToCart]);

  const handleRemove = useCallback((productId: string, name: string) => {
    const currentItem = cartItems.find(i => i.product.id === productId);
    requestConfirm(
      'Remove from Cart',
      `Are you sure you want to delete "${name}" from your cart?`,
      () => {
        removeFromCart(productId);
        if (currentItem) {
          triggerUndoToast(`"${name}" removed from cart`, () => {
            addToCart(currentItem.product, currentItem.quantity);
          });
        }
      },
      { confirmText: 'Yes remove', isDanger: true }
    );
  }, [cartItems, removeFromCart, addToCart]);

  const handleClearAll = useCallback(() => {
    if (cartItems.length === 0) return;
    const previousCart = [...cartItems];
    requestConfirm(
      'Clear All Items',
      'Are you sure you want to delete all items from your cart?',
      () => {
        clearCart();
        triggerUndoToast('All items removed from cart', () => {
          previousCart.forEach(i => addToCart(i.product, i.quantity));
        });
      },
      { confirmText: 'Yes remove', isDanger: true }
    );
  }, [cartItems, clearCart, addToCart]);

  const handleDismissCrossSell = useCallback((item: CrossSellItem) => {
    requestConfirm(
      'Remove Recommendation',
      `Are you sure you want to remove "${item.name}" from recommended items?`,
      () => {
        setDismissedCrossSell(prev => new Set(prev).add(item.id));
        triggerUndoToast(`"${item.name}" removed`, () => {
          setDismissedCrossSell(prev => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        });
      }
    );
  }, []);

  const handleCrossSellAdd = useCallback((crossItem: CrossSellItem) => {
    const prod = allProducts.find(p => p.id === crossItem.id);
    if (prod) {
      triggerQuickLoading(`Adding ${prod.name}...`, 260);
      setAddedCrossSell(prev => new Set(prev).add(crossItem.id));
      addToCart(prod, 1);
      triggerUndoToast(`"${prod.name}" added to cart`);
    }
  }, [allProducts, addToCart]);

  const handleApplyCoupon = () => {
    triggerQuickLoading('Applying promo...', 320, () => {
      if (couponCode.toUpperCase() === 'SAVE10') {
        setCouponApplied(true);
        setCouponDiscount(subtotal * 0.1);
      } else if (couponCode.toUpperCase() === 'FLAT50') {
        setCouponApplied(true);
        setCouponDiscount(50);
      } else {
        setCouponApplied(false);
        setCouponDiscount(0);
      }
    });
  };

  const handleStartEditAddress = (addr: SavedAddressItem) => {
    setEditingAddressId(addr.id);
    setHouseNo(addr.houseNo);
    setBuilding(addr.building || '');
    setLandmark(addr.landmark || '');
    setLabel(addr.label);
    setReceiverName(addr.receiverName === 'Guest' ? '' : addr.receiverName);
    setReceiverPhone(addr.receiverPhone || '');
    setIsAddFormOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingAddressId(null);
    setHouseNo('');
    setBuilding('');
    setLandmark('');
    setReceiverName('');
    setReceiverPhone('');
    setIsAddFormOpen(false);
  };

  const handleAddNewAddressClick = () => {
    if (isAddFormOpen && editingAddressId) {
      handleCancelEdit();
    } else if (isAddFormOpen) {
      setIsAddFormOpen(false);
    } else {
      setIsAddOptionModalVisible(true);
    }
  };

  const handleManualAddressEntry = () => {
    setIsAddOptionModalVisible(false);
    setHouseNo('');
    setBuilding('');
    setLandmark('');
    setEditingAddressId(null);
    setIsAddFormOpen(true);
  };

  const handleRequestLiveLocation = () => {
    setIsAddOptionModalVisible(false);
    setIsLocationPermissionModalVisible(true);
  };

  const handleConfirmLocationAccess = async () => {
    setIsLocationPermissionModalVisible(false);
    triggerQuickLoading('Detecting GPS location...', 400);

    // Reset previous values
    setHouseNo('');
    setBuilding('');
    setLandmark('');
    setEditingAddressId(null);

    try {
      const details = await fetchLiveAddressDetails();
      setHouseNo(details.houseNo);
      setBuilding(details.building);
      setLandmark(details.landmark);
      setLabel('Home');
      setIsAddFormOpen(true);
      setIsAddressExpanded(true);
      setToastMessage('📍 Live location detected & auto-filled!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    } catch (e) {
      console.warn('Location detection error', e);
      setHouseNo('Current Location');
      setBuilding('Main Road');
      setLandmark('Kurnool, Andhra Pradesh');
      setLabel('Home');
      setIsAddFormOpen(true);
      setIsAddressExpanded(true);
      setToastMessage('📍 Location detected & auto-filled!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    }
  };

  const handleSaveAddress = () => {
    const cleanHouse = houseNo.trim();
    const cleanName = receiverName.trim();
    const cleanPhone = receiverPhone.trim().replace(/\D/g, '');

    if (!cleanHouse) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('⚠️ Required Field: Please enter House No. / Flat No. / Street address.');
      } else {
        Alert.alert('Required Field', 'Please enter House No. / Flat No. / Street address.');
      }
      setToastMessage('⚠️ Please enter House No. / Flat No.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      return;
    }

    if (!cleanName) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('⚠️ Receiver Name Required: Please enter the receiver\'s name.');
      } else {
        Alert.alert('Receiver Name Required', 'Please enter the receiver\'s name.');
      }
      setToastMessage('⚠️ Please enter receiver\'s name');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      return;
    }

    if (!cleanPhone) {
      const msg = '⚠️ Phone Number Required: Please enter receiver\'s 10-digit mobile number.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Phone Number Required', msg);
      }
      setToastMessage('⚠️ Please enter phone number');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      return;
    }

    if (cleanPhone.length !== 10) {
      const msg = `⚠️ Invalid Phone Number: Mobile number must be exactly 10 digits (you entered ${cleanPhone.length} digits).`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Invalid Phone Number', msg);
      }
      setToastMessage('⚠️ Must be 10 digits');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      const msg = '⚠️ Invalid Mobile Number: Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Invalid Mobile Number', msg);
      }
      setToastMessage('⚠️ Must start with 6, 7, 8, or 9');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      return;
    }

    const formatted = `${cleanHouse}${building.trim() ? ', ' + building.trim() : ''}${landmark.trim() ? ', ' + landmark.trim() : ''}`;
    const isEditing = editingAddressId !== null;

    requestConfirm(
      isEditing ? 'Update Delivery Address' : 'Save & Deliver to Address',
      `Are you sure you want to ${isEditing ? 'update and deliver to' : 'save and deliver to'} this address?\n\n"${formatted}"\nReceiver: ${cleanName} (+91 ${cleanPhone})`,
      () => {
        if (isEditing) {
          triggerQuickLoading('Updating address...', 280);
          setSavedAddresses(prev =>
            prev.map(a =>
              a.id === editingAddressId
                ? {
                  ...a,
                  label,
                  houseNo: cleanHouse,
                  building: building.trim(),
                  landmark: landmark.trim(),
                  formattedAddress: formatted,
                  receiverName: cleanName,
                  receiverPhone: cleanPhone,
                }
                : a
            )
          );
          setSelectedAddressId(editingAddressId);
          setDeliveryAddress(formatted);
          if (setSelectedAddress) {
            setSelectedAddress({
              id: editingAddressId,
              name: cleanName,
              phone: cleanPhone,
              houseNumber: cleanHouse,
              street: building.trim(),
              area: landmark.trim(),
              city: 'Kurnool',
              state: 'Andhra Pradesh',
              pincode: '518001',
              type: label.toLowerCase() as any,
              isDefault: true,
            });
          }
          setEditingAddressId(null);
          setToastMessage('Address updated successfully');
          setShowToast(true);
        } else {
          triggerQuickLoading('Saving address...', 280);
          const newId = 'addr_' + Date.now();
          const newAddr: SavedAddressItem = {
            id: newId,
            label,
            houseNo: cleanHouse,
            building: building.trim(),
            landmark: landmark.trim(),
            formattedAddress: formatted,
            receiverName: cleanName,
            receiverPhone: cleanPhone,
          };
          setSavedAddresses(prev => [newAddr, ...prev]);
          setSelectedAddressId(newId);
          setDeliveryAddress(formatted);
          if (setSelectedAddress) {
            setSelectedAddress({
              id: newId,
              name: cleanName,
              phone: cleanPhone,
              houseNumber: cleanHouse,
              street: building.trim(),
              area: landmark.trim(),
              city: 'Kurnool',
              state: 'Andhra Pradesh',
              pincode: '518001',
              type: label.toLowerCase() as any,
              isDefault: true,
            });
          }
          setToastMessage('New address added successfully');
          setShowToast(true);
        }
        setHouseNo('');
        setBuilding('');
        setLandmark('');
        setReceiverName('');
        setReceiverPhone('');
        setIsAddFormOpen(false);
        setTimeout(() => setShowToast(false), 3000);
      },
      {
        icon: isEditing ? 'create-outline' : 'location-outline',
        confirmText: isEditing ? 'Yes, Update' : 'Yes, Continue',
        isDanger: false,
      }
    );
  };

  const handleSelectAddress = (addr: SavedAddressItem) => {
    if (selectedAddressId !== addr.id) {
      triggerQuickLoading('Switching address...', 220);
    }
    setSelectedAddressId(addr.id);
    setDeliveryAddress(addr.formattedAddress);
    if (setSelectedAddress) {
      setSelectedAddress({
        id: addr.id,
        name: addr.receiverName || 'User',
        phone: addr.receiverPhone || '9876543210',
        houseNumber: addr.houseNo,
        street: addr.building || '',
        area: addr.landmark || '',
        city: 'Kurnool',
        state: 'Andhra Pradesh',
        pincode: '518001',
        type: addr.label.toLowerCase() as any,
        isDefault: true,
      });
    }
  };

  const handleDeleteAddress = (addr: SavedAddressItem) => {
    requestConfirm(
      'Delete Saved Address',
      `Are you sure you want to delete the saved address "${addr.formattedAddress}"?`,
      () => {
        const previousAddrs = [...savedAddresses];
        const wasSelected = selectedAddressId === addr.id;
        const filtered = savedAddresses.filter(a => a.id !== addr.id);
        setSavedAddresses(filtered);
        if (wasSelected) {
          if (filtered.length > 0) {
            setSelectedAddressId(filtered[0].id);
            setDeliveryAddress(filtered[0].formattedAddress);
            if (setSelectedAddress) {
              setSelectedAddress({
                id: filtered[0].id,
                name: filtered[0].receiverName || 'User',
                phone: filtered[0].receiverPhone || '9876543210',
                houseNumber: filtered[0].houseNo,
                street: filtered[0].building || '',
                area: filtered[0].landmark || '',
                city: 'Kurnool',
                state: 'Andhra Pradesh',
                pincode: '518001',
                type: filtered[0].label.toLowerCase() as any,
                isDefault: true,
              });
            }
          } else {
            setSelectedAddressId('');
            setDeliveryAddress('Select or Add Delivery Address');
            if (setSelectedAddress) {
              setSelectedAddress(null as any);
            }
          }
        }
        triggerUndoToast('Address deleted', () => {
          setSavedAddresses(previousAddrs);
          if (wasSelected) {
            setSelectedAddressId(addr.id);
            setDeliveryAddress(addr.formattedAddress);
          }
        });
      }
    );
  };

  // Navigates directly to Payment Screen when Proceed to Checkout is clicked
  const handleProceed = () => {
    // Check if delivery address is selected / filled
    if (
      !selectedAddressId ||
      !deliveryAddress ||
      deliveryAddress === 'Select or Add Delivery Address' ||
      savedAddresses.length === 0
    ) {
      const msg = '⚠️ Delivery Address Required: Please select or add your delivery address to proceed to checkout.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Delivery Address Required', msg);
      }
      setIsAddressExpanded(true);
      setToastMessage('⚠️ Please select delivery address');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
      return;
    }

    triggerQuickLoading('Proceeding to payment...', 300, () => {
      if (onProceed) {
        onProceed(grandTotal, totalDiscount, selectedTip);
      } else if (navigation) {
        navigation.navigate('Payment', {
          grandTotal,
          couponDiscount: totalDiscount,
          tip: selectedTip,
        } as any);
      }
    });
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation) {
      navigation.navigate('Main');
    }
  };

  const tipOptions: TipAmount[] = [0, 20, 30, 50];

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: activeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={activeColors.background} />

      {/* ── Top Animated Progress Bar ── */}
      {isLoading && (
        <Animated.View
          style={[
            styles.topProgressBar,
            {
              opacity: loadingAnim,
              transform: [{ scaleX: progressAnim }],
            }
          ]}
        />
      )}

      {/* ── Floating Smooth Animated Loader ── */}
      {isLoading && (
        <Animated.View
          style={[
            styles.floatingLoader,
            {
              opacity: loadingAnim,
              transform: [
                {
                  translateY: loadingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.floatingLoaderText}>{loadingText}</Text>
        </Animated.View>
      )}

      {/* ── Header ── */}
      <View style={{ zIndex: 10 }}>
        <View style={[styles.header, isDark && { backgroundColor: activeColors.cardBackground, borderBottomColor: activeColors.borderLight }]}>
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.headerBackBtn,
              isDark && {
                backgroundColor: activeColors.inputBg,
                borderColor: activeColors.borderLight,
              },
            ]}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={22} color={activeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && { color: activeColors.textPrimary }]}>
            My Cart{cartCount > 0 ? ` (${cartCount})` : ''}
          </Text>
          {cartItems.length > 0 ? (
            <TouchableOpacity
              onPress={handleClearAll}
              style={[
                styles.headerClearBtn,
                isDark && { backgroundColor: activeColors.dangerLight },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.headerClearText, isDark && { color: activeColors.danger }]}>Clear All</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {/* ── Toast ── */}
        {showToast && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* ── Undo Toast ── */}
        {undoToast.visible && (
          <View style={styles.undoToastContainer}>
            <Text style={styles.undoToastText} numberOfLines={1}>
              {undoToast.message}
            </Text>
            {undoToast.onUndo && (
              <TouchableOpacity
                onPress={() => {
                  undoToast.onUndo?.();
                  setUndoToast(prev => ({ ...prev, visible: false }));
                }}
                style={styles.undoToastBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.undoToastBtnText}>↩ UNDO</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ── Delivery Mode Banner ── */}
      <View style={styles.segmentWrapper}>
        <View style={styles.deliveryBanner}>
          <Ionicons name="flash" size={18} color={COLORS.accentDark} style={{ marginRight: 6 }} />
          <Text style={styles.deliveryBannerText}>Express Delivery (20–25 mins)</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Address Section (Top of Page) ── */}
        <View style={[styles.section, styles.addressManagerCard]}>
          <TouchableOpacity
            onPress={() => setIsAddressExpanded(prev => !prev)}
            activeOpacity={0.8}
            style={[styles.addressSectionHeaderBtn, isAddressExpanded && styles.addressSectionHeaderBtnOpen]}
          >
            <View style={styles.addressHeaderPin}>
              <Ionicons name="location" size={18} color={COLORS.accent} />
            </View>
            <View style={styles.addressHeaderTextWrapper}>
              <View style={styles.addressHeaderTopRow}>
                <Text style={styles.addressSectionHeaderLabel}>DELIVERY ADDRESS</Text>
                <Text style={styles.addressTapToChangeHint}>{isAddressExpanded ? '(Tap to close)' : '(Tap to change / add)'}</Text>
              </View>
              {!!deliveryAddress && (
                <Text
                  style={[
                    styles.addressSectionActiveText,
                    deliveryAddress === 'Select or Add Delivery Address' && styles.addressSectionActiveTextPlaceholder,
                  ]}
                  numberOfLines={isAddressExpanded ? 2 : 1}
                >
                  {deliveryAddress}
                </Text>
              )}
            </View>
            <View style={[styles.addressChevronWrapper, isAddressExpanded && styles.addressChevronWrapperExpanded]}>
              <Ionicons
                name={isAddressExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={isAddressExpanded ? COLORS.white : COLORS.accent}
              />
            </View>
          </TouchableOpacity>

          {isAddressExpanded && (
            <View style={styles.addressSplitLayout}>
              {/* Left Side: Address Form */}
              <View style={styles.addressFormColumn}>
                <TouchableOpacity
                  onPress={handleAddNewAddressClick}
                  activeOpacity={0.8}
                  style={[styles.addNewAddressToggleBtn, (isAddFormOpen || editingAddressId !== null) && styles.addNewAddressToggleBtnActive]}
                >
                  <View style={[styles.addNewAddressPlusCircle, (isAddFormOpen || editingAddressId !== null) && styles.addNewAddressPlusCircleActive]}>
                    <Ionicons
                      name={editingAddressId ? 'create-outline' : isAddFormOpen ? 'remove' : 'add'}
                      size={14}
                      color={(isAddFormOpen || editingAddressId !== null) ? COLORS.white : COLORS.accent}
                    />
                  </View>
                  <Text style={[styles.addNewAddressToggleLabel, (isAddFormOpen || editingAddressId !== null) && styles.addNewAddressToggleLabelActive]}>
                    {editingAddressId ? 'Editing Address' : isAddFormOpen ? 'Close Address Form' : 'Add New Address'}
                  </Text>
                </TouchableOpacity>

                {isAddFormOpen ? (
                  <View style={styles.addressInputsWrapper}>
                    <TextInput
                      style={styles.formInput}
                      placeholder="House No. & Floor *"
                      placeholderTextColor={COLORS.textMuted}
                      value={houseNo}
                      onChangeText={setHouseNo}
                    />
                    <TextInput
                      style={styles.formInput}
                      placeholder="Building & Block No. (Optional)"
                      placeholderTextColor={COLORS.textMuted}
                      value={building}
                      onChangeText={setBuilding}
                    />
                    <TextInput
                      style={styles.formInput}
                      placeholder="Landmark & Area Name (Optional)"
                      placeholderTextColor={COLORS.textMuted}
                      value={landmark}
                      onChangeText={setLandmark}
                    />

                    <Text style={styles.formSectionTitle}>Address Label</Text>
                    <View style={styles.labelRow}>
                      {(['Home', 'Work', 'Other'] as const).map(l => (
                        <TouchableOpacity
                          key={l}
                          onPress={() => setLabel(l)}
                          style={[styles.labelBtn, label === l && styles.labelBtnActive]}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.labelText, label === l && styles.labelTextActive]}>
                            {l}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.formSectionTitle}>Receiver Details</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Receiver's Name</Text>
                      <TextInput
                        style={styles.formInputLite}
                        placeholder="Full Name"
                        placeholderTextColor={COLORS.textMuted}
                        value={receiverName}
                        onChangeText={setReceiverName}
                      />
                    </View>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Receiver's Phone Number</Text>
                      <View style={styles.phoneInputRow}>
                        <Text style={styles.phonePrefix}>+91</Text>
                        <TextInput
                          style={styles.formInputLiteFlex}
                          placeholder="10-digit mobile"
                          placeholderTextColor={COLORS.textMuted}
                          value={receiverPhone}
                          onChangeText={(text) => setReceiverPhone(text.replace(/\D/g, '').slice(0, 10))}
                          keyboardType="phone-pad"
                          maxLength={10}
                        />
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                      {editingAddressId && (
                        <TouchableOpacity
                          onPress={handleCancelEdit}
                          style={styles.addressCancelEditBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.addressCancelEditBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={handleSaveAddress}
                        style={[styles.addressSaveBtn, { flex: 1 }]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addressSaveBtnText}>
                          {editingAddressId ? 'Update & Deliver Here' : 'Save & Deliver Here'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.addFormPlaceholder}>
                    <Text style={styles.addFormPlaceholderText}>
                      Tap "+ Add New Address" above to fill and save a new location.
                    </Text>
                  </View>
                )}
              </View>

              {/* Right Side: Saved Addresses Tabs */}
              <View style={styles.addressSavedColumn}>
                <Text style={styles.columnHeaderTitle}>Saved Addresses ({savedAddresses.length})</Text>
                <Text style={styles.columnHeaderSub}>Tap to select delivery destination:</Text>

                <View style={styles.savedAddressList}>
                  {savedAddresses.length === 0 ? (
                    <View style={styles.addFormPlaceholder}>
                      <Text style={styles.addFormPlaceholderText}>
                        No saved addresses found. Tap "+ Add New Address" to add your delivery location.
                      </Text>
                    </View>
                  ) : (
                    savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      const isBeingEdited = editingAddressId === addr.id;
                      return (
                        <TouchableOpacity
                          key={addr.id}
                          onPress={() => handleSelectAddress(addr)}
                          activeOpacity={0.85}
                          style={[
                            styles.savedAddressCard,
                            isSelected && styles.savedAddressCardActive,
                            isBeingEdited && styles.savedAddressCardBeingEdited,
                          ]}
                        >
                          <View style={styles.savedAddressCardHeader}>
                            <View style={[styles.savedAddressBadge, isSelected && styles.savedAddressBadgeActive]}>
                              <Text style={[styles.savedAddressBadgeText, isSelected && styles.savedAddressBadgeTextActive]}>
                                {addr.label}
                              </Text>
                            </View>

                            <View style={styles.savedAddressActionsRow}>
                              {isSelected && (
                                <View style={styles.activeTag}>
                                  <Text style={styles.activeTagText}>✓ DELIVERING HERE</Text>
                                </View>
                              )}

                              {/* Edit Text Button */}
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation?.();
                                  handleStartEditAddress(addr);
                                }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={styles.addressEditBtn}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.addressEditText}>Edit</Text>
                              </TouchableOpacity>

                              {/* Delete Button */}
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation?.();
                                  handleDeleteAddress(addr);
                                }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={styles.addressDeleteBtn}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="trash-outline" size={13} color={COLORS.error} />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <Text style={styles.savedAddressText} numberOfLines={3}>
                            {addr.formattedAddress}
                          </Text>

                          {addr.receiverName ? (
                            <View style={styles.savedAddressReceiverRow}>
                              <Text style={styles.savedAddressReceiverText}>
                                {addr.receiverName}{addr.receiverPhone ? ` • ${addr.receiverPhone}` : ''}
                              </Text>
                            </View>
                          ) : null}

                          {!isSelected && (
                            <View style={styles.selectAddressAction}>
                              <Text style={styles.selectAddressActionText}>Use this address →</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── Cart Items ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ORDER ITEMS ({cartCount})
          </Text>
          {cartItems.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="cart-outline" size={56} color={COLORS.textMuted} />
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
              <Text style={styles.emptyCartSub}>Add some fresh groceries to get started!</Text>
              <TouchableOpacity
                onPress={handleBack}
                style={[styles.proceedBtn, { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12 }]}
                activeOpacity={0.8}
              >
                <Text style={styles.proceedBtnText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          ) : (
            cartItems.map((item, index) => (
              <CartItemRow
                key={`${item.product.id}-${index}`}
                item={item}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onRemove={handleRemove}
              />
            ))
          )}
        </View>

        {/* ── Category-wise Recommended Products ── */}
        {recommendedProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.recHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Recommended for You</Text>
                <Text style={styles.recSubtitle}>
                  {cartCategories.length > 0
                    ? `Based on ${cartCategories.join(', ')} in your cart`
                    : 'Popular fresh picks'}
                </Text>
              </View>
            </View>

            {/* Category Filter Pills */}
            {cartCategories.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.recCategoryScroll}
                contentContainerStyle={styles.recCategoryPillsContainer}
              >
                {['All', ...cartCategories].map(cat => {
                  const isSelected = selectedRecCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedRecCategory(cat)}
                      style={[
                        styles.recCategoryPill,
                        isSelected && styles.recCategoryPillActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.recCategoryPillText,
                          isSelected && styles.recCategoryPillTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <FlatList
              data={recommendedProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CrossSellCard
                  item={item}
                  isAdded={addedCrossSell.has(item.id)}
                  onAdd={handleCrossSellAdd}
                  onDismiss={handleDismissCrossSell}
                />
              )}
              contentContainerStyle={styles.crossSellList}
            />
          </View>
        )}

        {/* ── Coupon Code ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <View style={styles.couponRow}>
            <View style={styles.couponInputWrapper}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter promo code..."
                placeholderTextColor={COLORS.textMuted}
                value={couponCode}
                onChangeText={text => {
                  setCouponCode(text);
                  setCouponApplied(false);
                  setCouponDiscount(0);
                }}
                autoCapitalize="characters"
              />
              {couponApplied && (
                <Text style={styles.couponCheckmark}>✓</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleApplyCoupon}
              style={[styles.couponApplyBtn, couponApplied && styles.couponAppliedBtn]}
              activeOpacity={0.8}
            >
              <Text style={styles.couponApplyText}>
                {couponApplied ? 'Applied!' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
          {couponApplied && (
            <Text style={styles.couponSaveText}>
              You saved ₹{couponDiscount.toFixed(2)} with code "{couponCode}"
            </Text>
          )}
          <Text style={styles.couponHint}>Try: SAVE10 or FLAT50</Text>
        </View>

        {/* ── Tip Selection ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tip Your Rider</Text>
          <Text style={styles.tipSubText}>100% of the tip goes to your delivery partner</Text>
          <View style={styles.tipRow}>
            {tipOptions.map(amount => (
              <TipChip
                key={amount}
                amount={amount}
                selected={selectedTip === amount}
                onSelect={setSelectedTip}
              />
            ))}
          </View>
        </View>

        {/* ── Bill Breakdown ── */}
        <View style={[styles.section, styles.billCard]}>
          <Text style={styles.sectionTitle}>Bill Breakdown</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <View>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              {!isFreeDelivery && cartItems.length > 0 && (
                <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>
                  Free on orders above ₹100
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.billValue, isFreeDelivery && { color: COLORS.success, fontWeight: '700' }]}>
                {isFreeDelivery ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
              </Text>
              {isFreeDelivery && (
                <Text style={{ fontSize: 10, color: COLORS.success, fontWeight: '600' }}>
                  Orders &gt; ₹100
                </Text>
              )}
            </View>
          </View>
          {selectedTip > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Rider Tip</Text>
              <Text style={styles.billValue}>₹{selectedTip.toFixed(2)}</Text>
            </View>
          )}
          {itemDiscounts > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Discounts</Text>
              <Text style={[styles.billValue, { color: COLORS.success }]}>
                −₹{itemDiscounts.toFixed(2)}
              </Text>
            </View>
          )}
          {couponDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Promo Discount</Text>
              <Text style={[styles.billValue, { color: COLORS.success }]}>
                −₹{couponDiscount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotalLabel}>Grand Total</Text>
            <Text style={styles.billTotalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── Celebratory Discount Message ── */}
        {totalDiscount > 0 && (
          <View style={styles.discountCelebrationBanner}>
            <Text style={styles.discountCelebrationText}>
              Yah! your total discount is ₹{totalDiscount.toFixed(2)}
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Sticky Bottom Checkout Bar ── */}
      <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 20), marginBottom: Platform.OS === 'android' ? 15 : 0 }]}>
        <View style={styles.stickyBarInfo}>
          <Text style={styles.stickyBarLabel}>Total Amount</Text>
          <Text style={styles.stickyBarTotal}>₹{grandTotal.toFixed(2)}</Text>
          <Text style={styles.stickyBarItems}>
            {cartCount} {cartCount === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <AnimatedPressable
          onPress={handleProceed}
          style={styles.proceedBtn}
          scaleDown={0.97}
        >
          <Text style={styles.proceedBtnText}>Proceed to Checkout →</Text>
        </AnimatedPressable>
      </View>

      {/* ── Add Address Method Pop-up Modal ── */}
      <Modal
        visible={isAddOptionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddOptionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addressChoiceModalCard}>
            <View style={styles.addressChoiceHeader}>
              <Text style={styles.addressChoiceTitle}>Add Delivery Address</Text>
              <TouchableOpacity
                onPress={() => setIsAddOptionModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.addressChoiceCloseBtn}
              >
                <Ionicons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.addressChoiceSubtitle}>
              Choose how you would like to set your delivery location:
            </Text>

            {/* Option 1: Add Live Location */}
            <TouchableOpacity
              onPress={handleRequestLiveLocation}
              activeOpacity={0.85}
              style={styles.addressChoiceOptionLive}
            >
              <View style={styles.addressChoiceIconBadgeLive}>
                <Ionicons name="navigate" size={22} color={COLORS.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.addressChoiceOptionTitleLive}>Add Live Location</Text>
                  <View style={styles.livePill}>
                    <Text style={styles.livePillText}>AUTO GPS</Text>
                  </View>
                </View>
                <Text style={styles.addressChoiceOptionSub}>
                  Use current location to automatically fill address details
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={COLORS.accent} />
            </TouchableOpacity>

            {/* Option 2: Enter New Address */}
            <TouchableOpacity
              onPress={handleManualAddressEntry}
              activeOpacity={0.85}
              style={styles.addressChoiceOptionManual}
            >
              <View style={styles.addressChoiceIconBadgeManual}>
                <Ionicons name="create-outline" size={22} color={COLORS.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressChoiceOptionTitleManual}>Enter New Address</Text>
                <Text style={styles.addressChoiceOptionSub}>
                  Type house number, street, area, and receiver details manually
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Location Access Permission Alert Modal ── */}
      <Modal
        visible={isLocationPermissionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLocationPermissionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalCard}>
            <View style={styles.locationPermissionIconCircle}>
              <Ionicons name="location" size={26} color={COLORS.accent} />
            </View>
            <Text style={styles.deleteModalTitle}>Allow Location Access?</Text>
            <Text style={styles.deleteModalMessage}>
              OneBuddy Cart needs your permission to access device GPS to automatically detect and fill your current address.
            </Text>

            <View style={styles.deleteModalBtnRow}>
              <TouchableOpacity
                onPress={() => setIsLocationPermissionModalVisible(false)}
                style={styles.deleteModalCancelBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmLocationAccess}
                style={[styles.deleteModalConfirmBtn, { backgroundColor: COLORS.accent }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.deleteModalConfirmText, { color: COLORS.white }]}>
                  Allow & Auto-Fill
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Confirmation Alert Modal ── */}
      <Modal
        visible={confirmModal.isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalCard}>
            <Text style={styles.deleteModalTitle}>{confirmModal.title}</Text>
            <Text style={styles.deleteModalMessage}>{confirmModal.message}</Text>

            <View style={styles.deleteModalBtnRow}>
              <TouchableOpacity
                onPress={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                style={styles.deleteModalCancelBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmModal.onConfirm}
                style={[styles.deleteModalConfirmBtn, !confirmModal.isDanger && { backgroundColor: COLORS.accent }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.deleteModalConfirmText, !confirmModal.isDanger && { color: COLORS.white }]}>
                  {confirmModal.confirmText || 'Yes remove'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  topProgressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.accent,
    zIndex: 999,
  },
  floatingLoader: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentDark,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accentLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingLoaderText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  headerBackBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold, color: COLORS.textPrimary, letterSpacing: 0.3,
  },
  headerClearBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, backgroundColor: COLORS.errorLight,
  },
  headerClearText: { color: COLORS.error, fontSize: typography.sizes.xs + 1, fontWeight: '700' },

  toastContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: COLORS.accentDark,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  },
  toastText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },

  segmentWrapper: { paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 4 },
  deliveryBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentLight,
    borderRadius: COLORS.pillRadius,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  deliveryBannerText: { color: COLORS.accentDark, fontSize: 13, fontWeight: '700' },

  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  section: {
    marginHorizontal: spacing.md, marginTop: 14,
    backgroundColor: COLORS.surface, borderRadius: COLORS.cardRadius,
    padding: 16, borderWidth: 1, borderColor: COLORS.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: COLORS.textPrimary,
    marginBottom: 14, letterSpacing: 0.2,
  },

  emptyCart: { alignItems: 'center', paddingVertical: 32 },
  emptyCartText: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 12 },
  emptyCartSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },

  cartItemContainer: {
    flexDirection: 'row', marginBottom: 12,
    backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight,
  },
  cartItemImage: { width: 72, height: 72, borderRadius: 10, backgroundColor: COLORS.background },
  cartItemInfo: { flex: 1, marginLeft: 12 },
  cartItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  cartItemCategory: { fontSize: 11, color: COLORS.accentDark, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  cartItemName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
  cartItemCustomization: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8 },
  cartItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartItemPrice: { fontSize: 16, fontWeight: '800', color: COLORS.accentDark },
  cartItemOriginalPrice: { fontSize: 12, color: COLORS.textMuted, textDecorationLine: 'line-through', marginLeft: 6 },

  stepperContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden',
  },
  stepperBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accentLight },
  stepperBtnText: { color: COLORS.accentDark, fontSize: 18, fontWeight: '700', lineHeight: 22 },
  stepperCount: { width: 28, textAlign: 'center', color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },

  recHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  recSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: -8, marginBottom: 8 },
  recCategoryScroll: { marginBottom: 12, marginTop: 4 },
  recCategoryPillsContainer: { flexDirection: 'row', gap: 8 },
  recCategoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  recCategoryPillActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  recCategoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  recCategoryPillTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },

  crossSellList: { paddingVertical: 4 },
  crossSellCard: {
    width: 140, marginRight: 12,
    backgroundColor: COLORS.surface, borderRadius: 14,
    overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  crossSellImage: { width: '100%', height: 100, backgroundColor: COLORS.background },
  crossSellTag: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: COLORS.accent, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  crossSellTagText: { fontSize: 10, fontWeight: '800', color: COLORS.white },
  crossSellInfo: { padding: 10 },
  crossSellCategoryTag: {
    fontSize: 10,
    color: COLORS.accentDark,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  crossSellName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4, minHeight: 34 },
  crossSellPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  crossSellPrice: { fontSize: 14, fontWeight: '800', color: COLORS.accentDark },
  crossSellOriginalPrice: {
    fontSize: 11,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  crossSellAddBtn: {
    backgroundColor: COLORS.accentLight, borderWidth: 1,
    borderColor: COLORS.accent, borderRadius: 8, paddingVertical: 6, alignItems: 'center',
  },
  crossSellAddBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  crossSellAddText: { fontSize: 13, fontWeight: '700', color: COLORS.accentDark },
  crossSellAddTextActive: { color: COLORS.white },

  couponRow: { flexDirection: 'row', gap: 10 },
  couponInputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12,
  },
  couponInput: {
    flex: 1, color: COLORS.textPrimary, fontSize: 14,
    fontWeight: '600', paddingVertical: Platform.OS === 'ios' ? 12 : 8, letterSpacing: 1,
  },
  couponCheckmark: { color: COLORS.success, fontSize: 16, fontWeight: '800' },
  couponApplyBtn: {
    backgroundColor: COLORS.accent, borderRadius: 10,
    paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center',
  },
  couponAppliedBtn: { backgroundColor: COLORS.success },
  couponApplyText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  couponSaveText: { marginTop: 10, color: COLORS.success, fontSize: 13, fontWeight: '600' },
  couponHint: { marginTop: 6, color: COLORS.textMuted, fontSize: 12 },

  tipSubText: { fontSize: 12, color: COLORS.textMuted, marginTop: -8, marginBottom: 12 },
  tipRow: { flexDirection: 'row', gap: 10 },
  tipChip: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: COLORS.pillRadius,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.borderLight,
  },
  tipChipText: { fontSize: 13, fontWeight: '700' },

  billCard: { borderColor: COLORS.borderLight },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  billLabel: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  billValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  billDivider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 10 },
  billTotalLabel: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  billTotalValue: { fontSize: 20, fontWeight: '900', color: COLORS.accentDark, letterSpacing: 0.5 },

  discountCelebrationBanner: {
    marginHorizontal: spacing.md,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.successLight,
    borderRadius: COLORS.cardRadius,
    borderWidth: 1,
    borderColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountCelebrationText: {
    color: COLORS.success,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },

  stickyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.borderLight,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 12,
  },
  stickyBarInfo: { flex: 1 },
  stickyBarLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  stickyBarTotal: { fontSize: 22, fontWeight: '900', color: COLORS.accentDark, lineHeight: 26 },
  stickyBarItems: { fontSize: 11, color: COLORS.textMuted },
  proceedBtn: {
    backgroundColor: COLORS.accent, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.accentDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  proceedBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },

  addressManagerCard: {
    borderColor: COLORS.borderLight,
    marginTop: 10,
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addressSectionHeaderBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 },
  addressSectionHeaderBtnOpen: { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  addressHeaderPin: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.accentLight, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  addressHeaderTextWrapper: {
    flex: 1,
    paddingRight: 8,
    justifyContent: 'center',
  },
  addressHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressSectionHeaderLabel: { fontSize: 11, color: COLORS.accentDark, fontWeight: '800', letterSpacing: 0.6, lineHeight: 14 },
  addressTapToChangeHint: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500', lineHeight: 14 },
  addressSectionActiveText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600', marginTop: 2, lineHeight: 17 },
  addressSectionActiveTextPlaceholder: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '400',
    marginTop: 2,
  },
  addressChevronWrapper: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accentLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.borderLight },
  addressChevronWrapperExpanded: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },

  addressSplitLayout: { flexDirection: SCREEN_WIDTH > 700 ? 'row' : 'column', gap: 12, paddingTop: 10 },
  addressFormColumn: { flex: 1 },
  addressSavedColumn: { flex: 1, borderLeftWidth: SCREEN_WIDTH > 700 ? 1 : 0, borderLeftColor: COLORS.borderLight, paddingLeft: SCREEN_WIDTH > 700 ? 12 : 0, borderTopWidth: SCREEN_WIDTH > 700 ? 0 : 1, borderTopColor: COLORS.borderLight, paddingTop: SCREEN_WIDTH > 700 ? 0 : 12 },

  columnHeaderTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
  columnHeaderSub: { fontSize: 11, color: COLORS.textMuted, marginBottom: 8 },

  addNewAddressToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: COLORS.accentMedium,
    marginBottom: 10,
  },
  addNewAddressToggleBtnActive: {
    backgroundColor: COLORS.accentLight,
    borderColor: COLORS.accent,
  },
  addNewAddressPlusCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addNewAddressPlusCircleActive: {
    backgroundColor: COLORS.accentDark,
  },
  addNewAddressPlusText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  addNewAddressPlusTextActive: {
    color: COLORS.white,
  },
  addNewAddressToggleLabel: {
    color: COLORS.accentDark,
    fontSize: 12,
    fontWeight: '700',
  },
  addNewAddressToggleLabelActive: {
    color: COLORS.accentDark,
    fontWeight: '800',
  },
  addressInputsWrapper: {
    marginTop: 4,
  },

  formInput: { backgroundColor: COLORS.background, color: COLORS.textPrimary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, borderColor: COLORS.border, borderWidth: 1, marginBottom: 8 },
  formSectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, marginTop: 4, marginBottom: 6 },
  labelRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  labelBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  labelBtnActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentLight },
  labelText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  labelTextActive: { color: COLORS.accentDark, fontWeight: '700' },
  inputWrapper: { marginBottom: 8, position: 'relative', marginTop: 2 },
  inputLabel: { position: 'absolute', top: -7, left: 10, backgroundColor: COLORS.surface, paddingHorizontal: 4, fontSize: 11, color: COLORS.textMuted, zIndex: 1 },
  formInputLite: { backgroundColor: COLORS.background, color: COLORS.textPrimary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, borderColor: COLORS.border, borderWidth: 1 },
  phoneInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 8, borderColor: COLORS.border, borderWidth: 1, paddingHorizontal: 10 },
  phonePrefix: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', marginRight: 6, borderRightWidth: 1, borderRightColor: COLORS.border, paddingRight: 6 },
  formInputLiteFlex: { flex: 1, color: COLORS.textPrimary, paddingVertical: 8, fontSize: 13 },

  savedAddressList: { gap: 8 },
  savedAddressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    padding: 10,
  },
  savedAddressCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
  savedAddressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  savedAddressBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  savedAddressBadgeActive: {
    backgroundColor: COLORS.accentMedium,
    borderColor: COLORS.accent,
  },
  savedAddressBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  savedAddressBadgeTextActive: {
    color: COLORS.accentDark,
  },
  activeTag: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  savedAddressCardBeingEdited: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
  savedAddressActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressEditBtn: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  addressEditText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accentDark,
  },
  undoToastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.accentDark,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  undoToastText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 10,
  },
  undoToastBtn: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  undoToastBtnText: {
    color: COLORS.accentDark,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  addressDeleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  addressCancelEditBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCancelEditBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  addressSaveBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressSaveBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  savedAddressText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 18,
    fontWeight: '500',
  },
  addFormPlaceholder: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFormPlaceholderText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  savedAddressReceiverRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  savedAddressReceiverText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  selectAddressAction: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  selectAddressActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentDark,
  },

  crossSellDismissBtn: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Address Choice Modal Styles
  addressChoiceModalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 22,
    width: SCREEN_WIDTH > 500 ? 460 : '90%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  addressChoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressChoiceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  addressChoiceCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  addressChoiceSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 18,
    lineHeight: 18,
  },
  addressChoiceOptionLive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.accentMedium,
    marginBottom: 12,
  },
  addressChoiceIconBadgeLive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.accentMedium,
  },
  addressChoiceOptionTitleLive: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accentDark,
  },
  livePill: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  livePillText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  addressChoiceOptionManual: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  addressChoiceIconBadgeManual: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  addressChoiceOptionTitleManual: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addressChoiceOptionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },
  locationPermissionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accentLight,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  deleteModalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteModalCancelText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteModalConfirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  deleteModalConfirmText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
});

export default CartScreen;
