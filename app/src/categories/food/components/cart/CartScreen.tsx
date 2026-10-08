import React, { useState, useRef, useCallback, useMemo } from 'react';
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
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '@/theme/ThemeContext';
import { isCategoryDark } from '@/theme/categoryThemeBridge';


const safeStorage = {
    getItem: async (key: string) => {
        if (Platform.OS === 'web') {
            try { return window.localStorage.getItem(key); } catch (e) { return null; }
        }
        return AsyncStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
        if (Platform.OS === 'web') {
            try { window.localStorage.setItem(key, value); } catch (e) { }
            return Promise.resolve();
        }
        return AsyncStorage.setItem(key, value);
    }
};
import { useCart } from '../../context/CartContext';
import type {
    CartItem,
    CrossSellItem,
    DeliveryMode,
    TipAmount,
    Address,
} from '../types';

import { savedAddresses as globalSavedAddresses, Address as GlobalAddress } from '../../data/address';

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

const mapGlobalAddressToSaved = (addr: GlobalAddress): SavedAddressItem => ({
    id: addr.id,
    label: (addr.label as 'Home' | 'Work' | 'Other') || 'Other',
    houseNo: addr.houseNo,
    building: addr.building,
    landmark: addr.landmark,
    formattedAddress: [addr.houseNo, addr.building, addr.landmark].filter(Boolean).join(', '),
    receiverName: addr.receiverName,
    receiverPhone: addr.receiverPhone,
});

// ─── Constants ─────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const LIGHT_COLORS = {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    accent: '#65A30D',
    softHighlight: '#F9FAFB',
    inputBg: '#FFFFFF',
    textPrimary: '#111827',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    error: '#FF5252',
    success: '#4CAF50',
    cardRadius: 16,
    pillRadius: 20,
};

export const DARK_COLORS = {
    background: '#121214',
    surface: '#1D1E22',
    accent: '#65A30D',
    softHighlight: '#24262B',
    inputBg: '#24262B',
    textPrimary: '#F1F1EC',
    textMuted: '#9BA08F',
    border: 'rgba(255, 255, 255, 0.08)',
    error: '#FF5252',
    success: '#4CAF50',
    cardRadius: 16,
    pillRadius: 20,
};

export const COLORS = LIGHT_COLORS;

function useCartTheme() {
    let isDark = false;
    try {
        const { scheme } = useAppTheme();
        isDark = scheme === 'dark';
    } catch {
        isDark = isCategoryDark();
    }
    const currentColors = isDark ? DARK_COLORS : LIGHT_COLORS;
    const currentStyles = isDark ? darkStyles : lightStyles;
    return { isDark, COLORS: currentColors, styles: currentStyles };
}

// ─── Mock Data ──────────────────────────────────────────────────────────────
const DELIVERY_FEE = 39;



// ─── AnimatedPressable ───────────────────────────────────────────────────────
interface AnimatedPressableProps {
    onPress: () => void;
    style?: object | object[];
    children: React.ReactNode;
    scaleDown?: number;
    disabled?: boolean;
}

const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
    onPress,
    style,
    children,
    scaleDown = 0.95,
    disabled = false,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: scaleDown,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
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
            disabled={disabled}
        >
            <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
};

// ─── CartItemRow ─────────────────────────────────────────────────────────────
interface CartItemRowProps {
    item: CartItem;
    onIncrement: (id: string) => void;
    onDecrement: (item: CartItem) => void;
    onRemove: (item: CartItem) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
    item,
    onIncrement,
    onDecrement,
    onRemove,
}) => {
    const { styles } = useCartTheme();
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    const handleRemove = () => {
        onRemove(item);
    };

    return (
        <Animated.View
            style={[
                styles.cartItemContainer,
                { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
            ]}
        >
            <Image source={{ uri: item.imageUrl }} style={styles.cartItemImage} />
            <View style={styles.cartItemInfo}>
                <View style={styles.cartItemHeader}>
                    <Text style={styles.cartItemCategory}>{item.category}</Text>
                    <TouchableOpacity onPress={handleRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.removeIcon}>✕</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                {item.customization && (
                    <Text style={styles.cartItemCustomization}>{item.customization}</Text>
                )}
                <View style={styles.cartItemFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.cartItemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                        {item.originalPrice && item.originalPrice > item.price && (
                            <Text style={styles.cartItemOriginalPrice}>₹{(item.originalPrice * item.quantity).toFixed(2)}</Text>
                        )}
                    </View>
                    <View style={styles.stepperContainer}>
                        <TouchableOpacity
                            onPress={() => onDecrement(item)}
                            style={styles.stepperBtn}
                        >
                            <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperCount}>{item.quantity}</Text>
                        <TouchableOpacity
                            onPress={() => onIncrement(item.id)}
                            style={styles.stepperBtn}
                        >
                            <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Animated.View>
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
    const { styles } = useCartTheme();
    const [imgErr, setImgErr] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    if (!item.imageUrl || !item.imageUrl.trim() || item.imageUrl === 'null' || item.imageUrl === 'undefined' || imgErr) {
        return null;
    }

    const handleAdd = () => {
        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, speed: 50 }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 10 }),
        ]).start(() => onAdd(item));
    };

    return (
        <Animated.View style={[styles.crossSellCard, { transform: [{ scale: scaleAnim }] }]}>
            <Image
                source={{ uri: item.imageUrl }}
                style={styles.crossSellImage}
                onError={() => setImgErr(true)}
            />
            {onDismiss && (
                <TouchableOpacity
                    onPress={() => onDismiss(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.crossSellDismissBtn}
                >
                    <Text style={styles.crossSellDismissText}>✕</Text>
                </TouchableOpacity>
            )}
            {item.tag && (
                <View style={styles.crossSellTag}>
                    <Text style={styles.crossSellTagText}>{item.tag}</Text>
                </View>
            )}
            <View style={styles.crossSellInfo}>
                <Text style={styles.crossSellName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.crossSellPrice}>₹{item.price.toFixed(2)}</Text>
                <TouchableOpacity
                    onPress={handleAdd}
                    style={[styles.crossSellAddBtn, isAdded && styles.crossSellAddBtnActive]}
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
    const { COLORS, styles } = useCartTheme();
    const bgAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

    const handlePress = () => {
        onSelect(selected ? 0 : amount);
    };

    React.useEffect(() => {
        Animated.timing(bgAnim, {
            toValue: selected ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [selected]);

    const backgroundColor = bgAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.softHighlight, COLORS.accent],
    });

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={{ flex: 1 }}>
            <Animated.View style={[styles.tipChip, { backgroundColor }]}>
                <Text
                    style={[styles.tipChipText, { color: selected ? COLORS.background : COLORS.textPrimary }]}
                >
                    {amount === 0 ? 'No Tip' : `₹${amount}`}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

// ─── CartScreen ───────────────────────────────────────────────────────────────
interface CartScreenProps {
    onProceed?: (total: number, items: CartItem[], restaurantName: string, deliveryAddress?: string) => void;
    onBack?: () => void;
}

const CartScreen: React.FC<CartScreenProps> = ({ onProceed, onBack }) => {
    const { isDark, COLORS, styles } = useCartTheme();
    const insets = useSafeAreaInsets();
    const topInset = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0);
    const {
        cart: contextCart,
        updateQuantity: ctxUpdateQuantity,
        removeFromCart: ctxRemoveFromCart,
        clearCart: ctxClearCart,
        currentRestaurant,
        addToCart: ctxAddToCart,
    } = useCart();

    // Map CartContext items (nested shape) to CartScreen's flat CartItem shape
    const cartItems: CartItem[] = useMemo(
        () =>
            contextCart.map((ci) => ({
                id: ci.item.id,
                name: ci.item.name,
                description: ci.item.description,
                price: ci.item.price,
                originalPrice: ci.item.originalPrice,
                quantity: ci.quantity,
                imageUrl: ci.item.image,
                category: ci.item.category,
            })),
        [contextCart]
    );

    // ── Restaurant-scoped recommendations (up to 4 items, excluding cart items) ──
    const restaurantRecommendations = useMemo((): CrossSellItem[] => {
        if (!currentRestaurant) return [];
        const cartItemIds = new Set(contextCart.map((ci) => ci.item.id));
        const candidates = currentRestaurant.menu
            .filter(
                (menuItem) =>
                    !cartItemIds.has(menuItem.id) &&
                    Boolean(
                        menuItem.image &&
                        typeof menuItem.image === 'string' &&
                        menuItem.image.trim().length > 0 &&
                        menuItem.image !== 'null' &&
                        menuItem.image !== 'undefined'
                    )
            )
            // Prefer bestsellers first, then sort by rating descending
            .sort((a, b) => {
                if (a.bestseller && !b.bestseller) return -1;
                if (!a.bestseller && b.bestseller) return 1;
                return b.rating - a.rating;
            })
            .slice(0, 4);
        return candidates.map((menuItem) => ({
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            imageUrl: menuItem.image,
            tag: menuItem.bestseller ? 'Bestseller' : menuItem.isCombo ? 'Combo Deal' : undefined,
        }));
    }, [currentRestaurant, contextCart]);
    const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('express');
    const [selectedTip, setSelectedTip] = useState<TipAmount>(0);
    const [addedCrossSell, setAddedCrossSell] = useState<Set<string>>(new Set());
    const [dismissedCrossSell, setDismissedCrossSell] = useState<Set<string>>(new Set());
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [notes, setNotes] = useState('');

    const initialSavedAddresses = globalSavedAddresses.map(mapGlobalAddressToSaved);
    const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>(initialSavedAddresses);
    const [selectedAddressId, setSelectedAddressId] = useState<string>(initialSavedAddresses[0]?.id || '');
    const [deliveryAddress, setDeliveryAddress] = useState(initialSavedAddresses[0]?.formattedAddress || '');
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
    const [addressErrors, setAddressErrors] = useState<{ houseNo?: string, receiverName?: string, receiverPhone?: string }>({});
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('✅ new address added successfully');
    const toastSlideAnim = useRef(new Animated.Value(-150)).current;

    React.useEffect(() => {
        if (showToast) {
            Animated.spring(toastSlideAnim, {
                toValue: 60,
                useNativeDriver: true,
                speed: 12,
                bounciness: 8,
            }).start();
        } else {
            Animated.timing(toastSlideAnim, {
                toValue: -150,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [showToast]);

    const [isLoaded, setIsLoaded] = useState(false);

    // Loading State
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Updating...');
    const loadingAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    const triggerQuickLoading = (text: string = 'Updating...', duration: number = 320, callback?: () => void) => {
        setLoadingText(text);
        setIsLoading(true);
        progressAnim.setValue(0.01);
        loadingAnim.setValue(0);

        Animated.parallel([
            Animated.timing(loadingAnim, {
                toValue: 1,
                duration: 120,
                useNativeDriver: true,
            }),
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: duration,
                useNativeDriver: true,
            }),
        ]).start();

        setTimeout(() => {
            Animated.timing(loadingAnim, {
                toValue: 0,
                duration: 120,
                useNativeDriver: true,
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

    const triggerUndoToast = (message: string, onUndo?: () => void) => {
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        setUndoToast({
            visible: true,
            message,
            onUndo,
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
        confirmText: 'Yes, Delete',
        isDanger: true,
        icon: '',
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
            confirmText: options?.confirmText || 'Yes, Delete',
            isDanger: options?.isDanger !== undefined ? options.isDanger : true,
            icon: options?.icon || '',
            onConfirm: () => {
                onConfirmAction();
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            },
        });
    };

    // Lifecycle - Sync local storage logic
    React.useEffect(() => {
        let mounted = true;
        safeStorage.getItem('OB_SAVED_ADDRESSES').then(data => {
            if (!mounted) return;
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && parsed.length > 0) {
                        setSavedAddresses(parsed);
                        // If we haven't manually selected one yet, default to the first saved
                        if (!selectedAddressId || selectedAddressId === initialSavedAddresses[0]?.id) {
                            setSelectedAddressId(parsed[0].id);
                            setDeliveryAddress(parsed[0].formattedAddress);
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse addresses', e);
                }
            }
            setIsLoaded(true);
        });
        return () => { mounted = false; };
    }, []);

    React.useEffect(() => {
        if (isLoaded) {
            safeStorage.setItem('OB_SAVED_ADDRESSES', JSON.stringify(savedAddresses));
        }
    }, [savedAddresses, isLoaded]);

    // Animations
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;
    const segmentSlide = useRef(new Animated.Value(0)).current;

    // ── Calculations ────────────────────────────────────────────────────────────
    const itemDiscounts = cartItems.reduce((sum, item) => {
        if (item.originalPrice && item.originalPrice > item.price) {
            return sum + (item.originalPrice - item.price) * item.quantity;
        }
        return sum;
    }, 0);

    const subtotal = cartItems.reduce(
        (sum, item) => sum + (item.originalPrice && item.originalPrice > item.price ? item.originalPrice : item.price) * item.quantity,
        0
    );
    const FREE_DELIVERY_THRESHOLD = 499;
    const effectiveSubtotal = subtotal - itemDiscounts;
    const isFreeDelivery = effectiveSubtotal >= FREE_DELIVERY_THRESHOLD;
    const deliveryFee = isFreeDelivery ? 0 : (cartItems.length > 0 ? DELIVERY_FEE : 0);
    const amountToFreeDelivery = FREE_DELIVERY_THRESHOLD - effectiveSubtotal;

    const tax = 0;
    const grandTotal = Math.max(0, subtotal + deliveryFee + selectedTip - itemDiscounts - couponDiscount);
    const totalDiscount = couponDiscount + itemDiscounts;

    const handleIncrement = useCallback((id: string) => {
        ctxUpdateQuantity(id, 1);
    }, [ctxUpdateQuantity]);

    const handleDecrement = useCallback((item: CartItem) => {
        if (item.quantity === 1) {
            requestConfirm(
                'Remove from Cart',
                `Are you sure you want to delete "${item.name}" from your cart?`,
                () => {
                    ctxRemoveFromCart(item.id);
                    triggerUndoToast(`"${item.name}" removed from cart`);
                }
            );
        } else {
            ctxUpdateQuantity(item.id, -1);
        }
    }, [ctxUpdateQuantity, ctxRemoveFromCart]);

    const handleRemove = useCallback((item: CartItem) => {
        requestConfirm(
            'Remove from Cart',
            `Are you sure you want to delete "${item.name}" from your cart?`,
            () => {
                ctxRemoveFromCart(item.id);
                triggerUndoToast(`"${item.name}" removed from cart`);
            }
        );
    }, [ctxRemoveFromCart]);

    const handleClearAll = useCallback(() => {
        if (cartItems.length === 0) return;
        requestConfirm(
            'Clear All Items',
            'Are you sure you want to delete all items from your cart?',
            () => {
                ctxClearCart();
                triggerUndoToast('All items removed from cart');
            }
        );
    }, [cartItems.length, ctxClearCart]);

    const handleDismissCrossSell = useCallback((item: CrossSellItem) => {
        requestConfirm(
            'Remove Recommendation',
            `Are you sure you want to delete "${item.name}" from recommended products?`,
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
        if (addedCrossSell.has(crossItem.id) || !currentRestaurant) return;
        // Find the real MenuItem from the restaurant menu to add via context
        const menuItem = currentRestaurant.menu.find((m) => m.id === crossItem.id);
        triggerQuickLoading('Adding to cart...', 260);
        setAddedCrossSell(prev => new Set(prev).add(crossItem.id));
        if (menuItem) {
            ctxAddToCart(menuItem, currentRestaurant, 1);
        }
        triggerUndoToast(`"${crossItem.name}" added to cart`);
    }, [addedCrossSell, currentRestaurant, ctxAddToCart]);

    const handleApplyCoupon = () => {
        triggerQuickLoading('Applying promo...', 320, () => {
            const code = couponCode.trim().toUpperCase();
            if (code === 'SAVE10') {
                const discount = Math.round(subtotal * 0.1);
                setCouponApplied(true);
                setCouponDiscount(discount);
                setToastMessage(`🎉 Applied SAVE10! Saved ₹${discount}`);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } else if (code === 'FLAT50') {
                const discount = Math.min(50, subtotal);
                setCouponApplied(true);
                setCouponDiscount(discount);
                setToastMessage(`🎉 Applied FLAT50! Saved ₹${discount}`);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } else if (code === 'BUDDY50') {
                const discount = Math.min(Math.round(subtotal * 0.5), 100) || 50;
                setCouponApplied(true);
                setCouponDiscount(discount);
                setToastMessage(`🎉 Applied BUDDY50! Saved ₹${discount}`);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } else {
                setCouponApplied(false);
                setCouponDiscount(0);
                setToastMessage('❌ Invalid coupon code. Try SAVE10, FLAT50 or BUDDY50');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
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
        setAddressErrors({});
        setIsAddFormOpen(false);
    };

    const handleAddNewAddressClick = () => {
        if (isAddFormOpen && editingAddressId) {
            handleCancelEdit();
        } else if (isAddFormOpen) {
            setAddressErrors({});
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
        setReceiverName('');
        setReceiverPhone('');
        setAddressErrors({});
        setEditingAddressId(null);
        setIsAddFormOpen(true);
    };

    const handleRequestLiveLocation = () => {
        setIsAddOptionModalVisible(false);
        setIsLocationPermissionModalVisible(true);
    };

    const handleConfirmLocationAccess = () => {
        setIsLocationPermissionModalVisible(false);
        triggerQuickLoading('Detecting GPS location...', 400);

        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await res.json();
                        if (data && data.address) {
                            const road = data.address.road || data.address.suburb || data.address.neighbourhood || 'Main Avenue';
                            const house = data.address.house_number ? `Door No. ${data.address.house_number}` : (data.address.building || 'Flat 102, 1st Floor');
                            const landmarkArea = [data.address.suburb, data.address.city || data.address.town, data.address.postcode].filter(Boolean).join(', ');

                            setHouseNo(`${house}, ${road}`);
                            setBuilding(data.address.neighbourhood || data.address.suburb || 'Residential Block');
                            setLandmark(landmarkArea || data.display_name?.slice(0, 40) || 'Near City Center');
                        } else {
                            setHouseNo(`Flat 204, GPS Pin (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`);
                            setBuilding('Live Location Detected');
                            setLandmark('Near Current Area');
                        }
                    } catch (err) {
                        setHouseNo('Flat 204, Live GPS Pin');
                        setBuilding('Live Location Detected');
                        setLandmark('Current GPS Detected Area');
                    }
                    setLabel('Home');
                    setEditingAddressId(null);
                    setIsAddFormOpen(true);
                    setToastMessage('📍 Live location detected & auto-filled!');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3500);
                },
                (error) => {
                    setHouseNo('Flat 302, 5th Main');
                    setBuilding('Cyber Pearl Towers');
                    setLandmark('Hitec City, Madhapur 500081');
                    setLabel('Home');
                    setEditingAddressId(null);
                    setIsAddFormOpen(true);
                    setToastMessage('📍 Live location auto-filled into form!');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3500);
                },
                { enableHighAccuracy: true, timeout: 6000 }
            );
        } else {
            setHouseNo('Flat 302, 5th Main');
            setBuilding('Cyber Pearl Towers');
            setLandmark('Hitec City, Madhapur 500081');
            setLabel('Home');
            setEditingAddressId(null);
            setIsAddFormOpen(true);
            setToastMessage('📍 Live location auto-filled into form!');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3500);
        }
    };

    const handleSaveAddress = () => {
        const newErrors: { houseNo?: string; receiverName?: string; receiverPhone?: string } = {};
        if (!houseNo.trim()) {
            newErrors.houseNo = 'House No. & Floor is required';
        }
        if (!receiverName.trim()) {
            newErrors.receiverName = 'Receiver name is required';
        }
        if (!receiverPhone.trim()) {
            newErrors.receiverPhone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(receiverPhone.trim())) {
            newErrors.receiverPhone = 'Phone number must be exactly 10 digits';
        }

        if (Object.keys(newErrors).length > 0) {
            setAddressErrors(newErrors);
            setToastMessage('⚠️ Please fix the errors in the form');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }
        setAddressErrors({});

        const formatted = `${houseNo}${building ? ', ' + building : ''}${landmark ? ', ' + landmark : ''}`;
        const isEditing = editingAddressId !== null;

        requestConfirm(
            isEditing ? 'Update Delivery Address' : 'Save & Deliver to Address',
            `Are you sure you want to ${isEditing ? 'update and deliver to' : 'save and deliver to'} this address?\n\n"${formatted}"`,
            () => {
                if (isEditing) {
                    triggerQuickLoading('Updating address...', 280);
                    setSavedAddresses(prev =>
                        prev.map(a =>
                            a.id === editingAddressId
                                ? {
                                    ...a,
                                    label,
                                    houseNo,
                                    building,
                                    landmark,
                                    formattedAddress: formatted,
                                    receiverName: receiverName.trim() || 'Guest',
                                    receiverPhone: receiverPhone.trim() || '',
                                }
                                : a
                        )
                    );
                    setSelectedAddressId(editingAddressId);
                    setDeliveryAddress(formatted);
                    setEditingAddressId(null);
                    setToastMessage('✅ address updated successfully');
                    setShowToast(true);
                } else {
                    triggerQuickLoading('Saving address...', 280);
                    const newId = 'addr_' + Date.now();
                    const newAddr: SavedAddressItem = {
                        id: newId,
                        label,
                        houseNo,
                        building,
                        landmark,
                        formattedAddress: formatted,
                        receiverName: receiverName.trim() || 'Guest',
                        receiverPhone: receiverPhone.trim() || '',
                    };
                    setSavedAddresses(prev => [newAddr, ...prev]);
                    setSelectedAddressId(newId);
                    setDeliveryAddress(formatted);
                    setToastMessage('✅ new address added successfully');
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
                icon: isEditing ? '✏️' : '📍',
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
    };

    const handleDeleteAddress = (addr: SavedAddressItem) => {
        requestConfirm(
            'Delete Saved Address',
            `Are you sure you want to delete the saved address "${addr.formattedAddress}"?`,
            () => {
                const previousAddrs = [...savedAddresses];
                const wasSelected = selectedAddressId === addr.id;
                setSavedAddresses(prev => {
                    const filtered = prev.filter(a => a.id !== addr.id);
                    if (wasSelected && filtered.length > 0) {
                        setSelectedAddressId(filtered[0].id);
                        setDeliveryAddress(filtered[0].formattedAddress);
                    }
                    return filtered;
                });
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

    const handleProceed = () => {
        if (!selectedAddressId || savedAddresses.length === 0 || !deliveryAddress || deliveryAddress.trim() === '' || deliveryAddress === 'Select or Add Delivery Address') {
            setToastMessage('⚠️ Please add delivery address to proceed');
            setShowToast(true);
            setIsAddressExpanded(true);
            setIsAddFormOpen(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        if (onProceed) {
            onProceed(grandTotal, cartItems, currentRestaurant?.name || 'Restaurant', deliveryAddress);
        }
    };

    const tipOptions: TipAmount[] = [0, 20, 30, 50];

    return (
        <View style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

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
                    <ActivityIndicator size="small" color={COLORS.accent} style={{ marginRight: 8 }} />
                    <Text style={styles.floatingLoaderText}>{loadingText}</Text>
                </Animated.View>
            )}

            {/* ── Header ── */}
            <View style={{ zIndex: 10 }}>
                <View style={[styles.header, { paddingTop: topInset + 12 }]}>
                    <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
                        <Text style={styles.headerBackIcon}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Your Cart</Text>
                    <TouchableOpacity
                        onPress={handleClearAll}
                        style={styles.headerClearBtn}
                    >
                        <Text style={styles.headerClearText}>Clear All</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Animated Notification Toast ── */}
                <Animated.View style={[
                    styles.toastContainer,
                    toastMessage.includes('⚠️') && { backgroundColor: COLORS.error },
                    { transform: [{ translateY: toastSlideAnim }] }
                ]}>
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </Animated.View>

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
                    <Text style={styles.deliveryBannerText}>⚡ Express Delivery (20–25 min)</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Address Section (Top of Page) ── */}
                <View style={[styles.section, styles.addressManagerCard, { padding: 0, backgroundColor: 'transparent', borderWidth: 0 }]}>
                    <TouchableOpacity
                        onPress={() => setIsAddressExpanded(prev => !prev)}
                        activeOpacity={0.7}
                        style={styles.locationBarHorizontal}
                    >
                        <MapPin size={16} color="#65A30D" />
                        <Text style={styles.locationTextHorizontal} numberOfLines={1}>
                            {deliveryAddress || 'Add Current Address'}
                        </Text>
                        {isAddressExpanded ? (
                            <ChevronUp size={16} color={COLORS.textMuted} />
                        ) : (
                            <ChevronDown size={16} color={COLORS.textMuted} />
                        )}
                    </TouchableOpacity>

                    {isAddressExpanded && (
                        <View style={[styles.addressSplitLayout, { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginTop: 8, borderWidth: 1, borderColor: COLORS.border }]}>
                            {/* Left Side: Address Form */}
                            <View style={styles.addressFormColumn}>
                                <TouchableOpacity
                                    onPress={handleAddNewAddressClick}
                                    activeOpacity={0.8}
                                    style={[styles.addNewAddressToggleBtn, (isAddFormOpen || editingAddressId !== null) && styles.addNewAddressToggleBtnActive]}
                                >
                                    <View style={[styles.addNewAddressPlusCircle, (isAddFormOpen || editingAddressId !== null) && styles.addNewAddressPlusCircleActive]}>
                                        <Text style={[styles.addNewAddressPlusText, (isAddFormOpen || editingAddressId !== null) && styles.addNewAddressPlusTextActive]}>
                                            {editingAddressId ? '✏️' : isAddFormOpen ? '−' : '+'}
                                        </Text>
                                    </View>
                                    <Text style={[styles.addNewAddressToggleLabel, (isAddFormOpen || editingAddressId !== null) && styles.addNewAddressToggleLabelActive]}>
                                        {editingAddressId ? 'Editing Address' : isAddFormOpen ? 'Close Address Form' : 'Add New Address'}
                                    </Text>
                                </TouchableOpacity>

                                {isAddFormOpen ? (
                                    <View style={styles.addressInputsWrapper}>
                                        <TextInput
                                            style={[styles.formInput, addressErrors.houseNo ? { borderColor: COLORS.error, borderWidth: 1 } : null]}
                                            placeholder="House No. & Floor *"
                                            placeholderTextColor={COLORS.textMuted}
                                            value={houseNo}
                                            onChangeText={(t) => { setHouseNo(t); setAddressErrors(prev => ({ ...prev, houseNo: undefined })); }}
                                        />
                                        {addressErrors.houseNo && <Text style={{ color: COLORS.error, fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 }}>{addressErrors.houseNo}</Text>}
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
                                                >
                                                    <Text style={[styles.labelText, label === l && styles.labelTextActive]}>
                                                        {l === 'Home' ? '🏠 Home' : l === 'Work' ? '🏢 Work' : '📍 Other'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        <Text style={styles.formSectionTitle}>Receiver Details</Text>
                                        <View style={styles.inputWrapper}>
                                            <Text style={styles.inputLabel}>Receiver's Name *</Text>
                                            <TextInput
                                                style={[styles.formInputLite, addressErrors.receiverName ? { color: COLORS.error, borderColor: COLORS.error, borderWidth: 1 } : null]}
                                                placeholder="Full Name *"
                                                placeholderTextColor={COLORS.textMuted}
                                                value={receiverName}
                                                onChangeText={(t) => { setReceiverName(t); setAddressErrors(prev => ({ ...prev, receiverName: undefined })); }}
                                            />
                                            {addressErrors.receiverName && <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4, marginLeft: 4 }}>{addressErrors.receiverName}</Text>}
                                        </View>
                                        <View style={styles.inputWrapper}>
                                            <Text style={styles.inputLabel}>Receiver's Phone Number *</Text>
                                            <View style={styles.phoneInputRow}>
                                                <Text style={styles.phonePrefix}>+91</Text>
                                                <TextInput
                                                    style={[styles.formInputLiteFlex, addressErrors.receiverPhone ? { color: COLORS.error } : null]}
                                                    placeholder="10-digit mobile *"
                                                    placeholderTextColor={COLORS.textMuted}
                                                    value={receiverPhone}
                                                    onChangeText={(t) => {
                                                        const numericVal = t.replace(/\D/g, '');
                                                        setReceiverPhone(numericVal);
                                                        setAddressErrors(prev => ({ ...prev, receiverPhone: undefined }));
                                                    }}
                                                    keyboardType="phone-pad"
                                                    maxLength={10}
                                                />
                                            </View>
                                            {addressErrors.receiverPhone && <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4, marginLeft: 4 }}>{addressErrors.receiverPhone}</Text>}
                                        </View>

                                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                                            {editingAddressId && (
                                                <TouchableOpacity
                                                    onPress={handleCancelEdit}
                                                    style={styles.addressCancelEditBtn}
                                                >
                                                    <Text style={styles.addressCancelEditBtnText}>Cancel</Text>
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity
                                                onPress={handleSaveAddress}
                                                style={[styles.addressSaveBtn, { flex: 1 }, !houseNo.trim() && { opacity: 0.5 }]}
                                                disabled={!houseNo.trim()}
                                            >
                                                <Text style={styles.addressSaveBtnText}>
                                                    {editingAddressId ? '💾 Update & Deliver Here' : '💾 Save & Deliver Here'}
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
                                <Text style={styles.columnHeaderTitle}>📑 Saved Addresses ({savedAddresses.length})</Text>
                                <Text style={styles.columnHeaderSub}>Tap a tab to select delivery destination:</Text>

                                <View style={styles.savedAddressList}>
                                    {savedAddresses.map((addr) => {
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
                                                            {addr.label === 'Home' ? '🏠 Home' : addr.label === 'Work' ? '🏢 Work' : '📍 Other'}
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
                                                        >
                                                            <Text style={styles.addressEditText}>✏️ Edit</Text>
                                                        </TouchableOpacity>

                                                        {/* Delete 'X' Button */}
                                                        <TouchableOpacity
                                                            onPress={(e) => {
                                                                e.stopPropagation?.();
                                                                handleDeleteAddress(addr);
                                                            }}
                                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                            style={styles.addressDeleteBtn}
                                                        >
                                                            <Text style={styles.addressDeleteIcon}>✕</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                                <Text style={styles.savedAddressText} numberOfLines={3}>
                                                    {addr.formattedAddress}
                                                </Text>

                                                {addr.receiverName ? (
                                                    <View style={styles.savedAddressReceiverRow}>
                                                        <Text style={styles.savedAddressReceiverText}>
                                                            👤 {addr.receiverName} {addr.receiverPhone ? `• 📞 ${addr.receiverPhone}` : ''}
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
                                    })}
                                </View>
                            </View>
                        </View>
                    )}
                </View>
                {/* ── Cart Items ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        ORDER ITEMS ({cartItems.reduce((s, i) => s + i.quantity, 0)})
                    </Text>
                    {cartItems.length === 0 ? (
                        <View style={styles.emptyCart}>
                            <Text style={styles.emptyCartEmoji}>🛒</Text>
                            <Text style={styles.emptyCartText}>Your cart is empty</Text>
                            <Text style={styles.emptyCartSub}>Add some delicious items!</Text>
                        </View>
                    ) : (
                        cartItems.map((item, index) => (
                            <CartItemRow
                                key={`${item.id}-${index}`}
                                item={item}
                                onIncrement={handleIncrement}
                                onDecrement={handleDecrement}
                                onRemove={handleRemove}
                            />
                        ))
                    )}
                </View>

                {/* ── Recommendations (from active restaurant's menu) ── */}
                {currentRestaurant && restaurantRecommendations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            More from {currentRestaurant.name}
                        </Text>
                        <FlatList
                            data={restaurantRecommendations.filter(item => !dismissedCrossSell.has(item.id))}
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
                        >
                            <Text style={styles.couponApplyText}>
                                {couponApplied ? 'Applied!' : 'Apply'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {couponApplied && (
                        <Text style={styles.couponSaveText}>
                            🎉 You saved ₹{couponDiscount.toFixed(2)} with code "{couponCode}"
                        </Text>
                    )}
                    <Text style={styles.couponHint}>Try: SAVE10, FLAT50 or BUDDY50</Text>
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
                        <Text style={styles.billLabel}>Delivery Fee</Text>
                        <Text style={styles.billValue}>
                            {isFreeDelivery ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                        </Text>
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

                {/* ── Celebratory Discount Message Below Bill Breakdown ── */}
                {totalDiscount > 0 && (
                    <View style={styles.discountCelebrationBanner}>
                        <Text style={styles.discountCelebrationText}>
                            Yah! your total discount is ₹{totalDiscount.toFixed(2)}
                        </Text>
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* ── Sticky Bottom Bar ── */}
            <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 20), marginBottom: Platform.OS === 'android' ? 15 : 0 }]}>
                <View style={styles.stickyBarInfo}>
                    <Text style={styles.stickyBarLabel}>Total</Text>
                    <Text style={styles.stickyBarTotal}>₹{grandTotal.toFixed(2)}</Text>
                    <Text style={styles.stickyBarItems}>
                        {cartItems.reduce((s, i) => s + i.quantity, 0)} items
                    </Text>
                </View>
                <AnimatedPressable
                    onPress={handleProceed}
                    style={[styles.proceedBtn, cartItems.length === 0 && { opacity: 0.5 }]}
                    scaleDown={0.97}
                    disabled={cartItems.length === 0}
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
                            <Text style={styles.addressChoiceTitle}>📍 Add Delivery Address</Text>
                            <TouchableOpacity
                                onPress={() => setIsAddOptionModalVisible(false)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={styles.addressChoiceCloseBtn}
                            >
                                <Text style={styles.addressChoiceCloseText}>✕</Text>
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
                                <Text style={{ fontSize: 20 }}>📍</Text>
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
                            <Text style={styles.addressChoiceArrow}>→</Text>
                        </TouchableOpacity>

                        {/* Option 2: Enter New Address */}
                        <TouchableOpacity
                            onPress={handleManualAddressEntry}
                            activeOpacity={0.85}
                            style={styles.addressChoiceOptionManual}
                        >
                            <View style={styles.addressChoiceIconBadgeManual}>
                                <Text style={{ fontSize: 20 }}>✍️</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.addressChoiceOptionTitleManual}>Enter New Address</Text>
                                <Text style={styles.addressChoiceOptionSub}>
                                    Type house number, street, area, and receiver details manually
                                </Text>
                            </View>
                            <Text style={styles.addressChoiceArrow}>→</Text>
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
                            <Text style={{ fontSize: 24 }}>📍</Text>
                        </View>
                        <Text style={styles.deleteModalTitle}>Allow Location Access?</Text>
                        <Text style={styles.deleteModalMessage}>
                            Antigravity Cart needs your permission to access device GPS to automatically detect and fill your current address.
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
                                style={[styles.deleteModalConfirmBtn, { backgroundColor: COLORS.accent, shadowColor: COLORS.accent }]}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.deleteModalConfirmText, { color: COLORS.background }]}>
                                    Allow & Auto-Fill
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── Confirmation Alert Modal (No Icon) ── */}
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
                                style={[styles.deleteModalConfirmBtn, !confirmModal.isDanger && { backgroundColor: COLORS.accent, shadowColor: COLORS.accent }]}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.deleteModalConfirmText, !confirmModal.isDanger && { color: COLORS.background }]}>
                                    {confirmModal.confirmText || 'Yes, Delete'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (COLORS: typeof LIGHT_COLORS, isDark: boolean) => StyleSheet.create({
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
        backgroundColor: 'rgba(29, 30, 40, 0.94)',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.accent + '80',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    floatingLoaderText: {
        color: '#F1F1EC',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    headerBackBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    },
    headerBackIcon: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '600' },
    headerTitle: {
        flex: 1, textAlign: 'center', fontSize: 20,
        fontWeight: '700', color: COLORS.textPrimary, letterSpacing: 0.3,
    },
    headerClearBtn: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 8, backgroundColor: COLORS.softHighlight,
    },
    headerClearText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },

    // Address Selector Lite
    addressSectionLite: {
        backgroundColor: COLORS.surface,
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    addressHeaderLite: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    goldPinLite: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    addressHeaderLabelLite: {
        fontSize: 11,
        color: COLORS.accent,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    addressHeaderStreetLite: {
        fontSize: 13,
        color: COLORS.textPrimary,
        marginTop: 2,
        fontWeight: '500',
        lineHeight: 18,
    },
    addressEditIcon: {
        fontSize: 18,
        color: COLORS.accent,
        paddingLeft: 10,
    },
    addressEditContainer: {
        padding: 12,
    },
    addressInput: {
        backgroundColor: isDark ? COLORS.softHighlight : COLORS.background,
        color: COLORS.textPrimary,
        borderRadius: 8,
        padding: 10,
        fontSize: 13,
        minHeight: 60,
        textAlignVertical: 'top',
        borderColor: COLORS.border,
        borderWidth: 1,
    },
    addressEditActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    addressCancelBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    addressCancelBtnText: {
        color: COLORS.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    addressSaveBtn: {
        backgroundColor: COLORS.accent,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    addressSaveBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    toastContainer: {
        position: 'absolute',
        top: 24,
        alignSelf: 'center',
        backgroundColor: COLORS.surface,
        borderColor: COLORS.accent,
        borderWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 24,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    toastText: {
        color: COLORS.textPrimary,
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 0.3,
    },

    segmentWrapper: { paddingHorizontal: 20, paddingVertical: 14 },
    deliveryBanner: {
        backgroundColor: COLORS.surface,
        borderRadius: COLORS.pillRadius, borderWidth: 1.5,
        borderColor: COLORS.accent, height: 46,
        alignItems: 'center', justifyContent: 'center',
    },
    deliveryBannerText: { color: COLORS.accent, fontSize: 14, fontWeight: '700' },

    freeDeliveryBanner: {
        backgroundColor: COLORS.success + '15',
        padding: 12,
        borderRadius: 12,
        marginTop: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.success + '40',
    },
    freeDeliveryText: {
        color: COLORS.success,
        fontWeight: '700',
        fontSize: 13,
    },

    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 20 },

    section: {
        marginHorizontal: 16, marginTop: 18,
        backgroundColor: COLORS.surface, borderRadius: COLORS.cardRadius,
        padding: 16, borderWidth: 1, borderColor: COLORS.border,
    },
    sectionTitle: {
        fontSize: 15, fontWeight: '700', color: COLORS.textPrimary,
        marginBottom: 14, letterSpacing: 0.2,
    },

    emptyCart: { alignItems: 'center', paddingVertical: 32 },
    emptyCartEmoji: { fontSize: 48 },
    emptyCartText: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 12 },
    emptyCartSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },

    cartItemContainer: {
        flexDirection: 'row', marginBottom: 14,
        backgroundColor: COLORS.softHighlight, borderRadius: 12,
        padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
    },
    cartItemImage: { width: 72, height: 72, borderRadius: 10, backgroundColor: COLORS.border },
    cartItemInfo: { flex: 1, marginLeft: 12 },
    cartItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    cartItemCategory: { fontSize: 11, color: COLORS.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    removeIcon: { fontSize: 13, color: COLORS.textMuted, fontWeight: '700', padding: 4 },
    cartItemName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
    cartItemCustomization: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8 },
    cartItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cartItemPrice: { fontSize: 16, fontWeight: '800', color: COLORS.accent },
    cartItemOriginalPrice: { fontSize: 12, color: COLORS.textMuted, textDecorationLine: 'line-through', marginLeft: 6 },

    stepperContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: isDark ? COLORS.softHighlight : COLORS.background, borderRadius: 10,
        borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
    },
    stepperBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? COLORS.surface : COLORS.softHighlight },
    stepperBtnDisabled: { opacity: 0.4 },
    stepperBtnText: { color: COLORS.accent, fontSize: 18, fontWeight: '700', lineHeight: 22 },
    stepperCount: { width: 28, textAlign: 'center', color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },

    crossSellList: { paddingVertical: 4 },
    crossSellCard: {
        width: 140, marginRight: 12,
        backgroundColor: COLORS.softHighlight, borderRadius: 14,
        overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border,
    },
    crossSellImage: { width: '100%', height: 100, backgroundColor: COLORS.border },
    crossSellTag: {
        position: 'absolute', top: 8, right: 8,
        backgroundColor: COLORS.accent, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
    },
    crossSellTagText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
    crossSellInfo: { padding: 10 },
    crossSellName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4, minHeight: 34 },
    crossSellPrice: { fontSize: 14, fontWeight: '800', color: COLORS.accent, marginBottom: 8 },
    crossSellAddBtn: {
        backgroundColor: isDark ? COLORS.surface : COLORS.background, borderWidth: 1.5,
        borderColor: COLORS.accent, borderRadius: 8, paddingVertical: 6, alignItems: 'center',
    },
    crossSellAddBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    crossSellAddText: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
    crossSellAddTextActive: { color: '#FFFFFF' },

    couponRow: { flexDirection: 'row', gap: 10 },
    couponInputWrapper: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.softHighlight, borderRadius: 10,
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
    couponApplyText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
    couponSaveText: { marginTop: 10, color: COLORS.success, fontSize: 13, fontWeight: '600' },
    couponHint: { marginTop: 6, color: COLORS.textMuted, fontSize: 12 },

    tipSubText: { fontSize: 12, color: COLORS.textMuted, marginTop: -8, marginBottom: 12 },
    tipRow: { flexDirection: 'row', gap: 10 },
    tipChip: {
        flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: COLORS.pillRadius,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: COLORS.border,
    },
    tipChipText: { fontSize: 13, fontWeight: '700' },

    notesInput: {
        backgroundColor: COLORS.softHighlight, borderRadius: 10,
        borderWidth: 1, borderColor: COLORS.border,
        padding: 12, color: COLORS.textPrimary, fontSize: 14,
        minHeight: 72, textAlignVertical: 'top',
    },

    billCard: { borderColor: COLORS.accent + '40', backgroundColor: COLORS.surface },
    billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
    billLabel: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
    billValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
    billDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
    billTotalLabel: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
    billTotalValue: { fontSize: 20, fontWeight: '900', color: COLORS.accent, letterSpacing: 0.5 },

    discountCelebrationBanner: {
        marginHorizontal: 16,
        marginTop: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: COLORS.success + '20',
        borderRadius: COLORS.cardRadius,
        borderWidth: 1.5,
        borderColor: COLORS.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    discountCelebrationText: {
        color: COLORS.success,
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 0.3,
    },

    stickyBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
        paddingBottom: Platform.OS === 'ios' ? 28 : 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.4, shadowRadius: 12, elevation: 16,
    },
    stickyBarInfo: { flex: 1 },
    stickyBarLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
    stickyBarTotal: { fontSize: 22, fontWeight: '900', color: COLORS.accent, lineHeight: 26 },
    stickyBarItems: { fontSize: 11, color: COLORS.textMuted },
    proceedBtn: {
        backgroundColor: COLORS.accent, borderRadius: 14,
        paddingVertical: 14, paddingHorizontal: 22,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    },
    proceedBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },

    addressFormTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    addressEditTopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    closeAddressBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: COLORS.softHighlight },
    closeAddressBtnText: { color: COLORS.accent, fontSize: 13, fontWeight: '700' },

    addressManagerCard: { borderColor: COLORS.accent + '40', marginBottom: 6 },
    locationBarHorizontal: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? COLORS.surface : 'rgba(0, 0, 0, 0.03)',
        borderWidth: 1,
        borderColor: isDark ? COLORS.border : 'rgba(0, 0, 0, 0.08)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        width: '100%',
    },
    locationTextHorizontal: {
        fontSize: 14,
        color: COLORS.textPrimary,
        flex: 1,
    },
    addressSectionHeaderBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
    addressSectionHeaderBtnOpen: { paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    addressHeaderPin: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.softHighlight, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    addressSectionHeaderLabel: { fontSize: 11, color: COLORS.accent, fontWeight: '800', letterSpacing: 0.8 },
    addressTapToChangeHint: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
    addressSectionActiveText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600', marginTop: 2 },
    addressChevronWrapper: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.softHighlight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
    addressChevronWrapperExpanded: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    addressChevronIcon: { fontSize: 11, fontWeight: '800', color: COLORS.accent },
    addressChevronIconExpanded: { color: '#FFFFFF' },

    addressSplitLayout: { flexDirection: SCREEN_WIDTH > 700 ? 'row' : 'column', gap: 16 },
    addressFormColumn: { flex: 1 },
    addressSavedColumn: { flex: 1, borderLeftWidth: SCREEN_WIDTH > 700 ? 1 : 0, borderLeftColor: COLORS.border, paddingLeft: SCREEN_WIDTH > 700 ? 16 : 0, borderTopWidth: SCREEN_WIDTH > 700 ? 0 : 1, borderTopColor: COLORS.border, paddingTop: SCREEN_WIDTH > 700 ? 0 : 16 },

    columnHeaderTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
    columnHeaderSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },

    formInput: { backgroundColor: isDark ? COLORS.softHighlight : COLORS.background, color: COLORS.textPrimary, borderRadius: 8, padding: 10, fontSize: 13, borderColor: COLORS.border, borderWidth: 1, marginBottom: 8 },
    formSectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8, marginBottom: 6 },
    labelRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    labelBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: isDark ? COLORS.softHighlight : COLORS.background, alignItems: 'center' },
    labelBtnActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accent + '20' },
    labelText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
    labelTextActive: { color: COLORS.accent, fontWeight: '700' },
    inputWrapper: { marginBottom: 10, position: 'relative', marginTop: 8 },
    inputLabel: { position: 'absolute', top: -7, left: 10, backgroundColor: COLORS.surface, paddingHorizontal: 4, fontSize: 11, color: COLORS.textMuted, zIndex: 1 },
    formInputLite: { backgroundColor: isDark ? COLORS.softHighlight : COLORS.background, color: COLORS.textPrimary, borderRadius: 8, padding: 10, fontSize: 13, borderColor: COLORS.border, borderWidth: 1 },
    phoneInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? COLORS.softHighlight : COLORS.background, borderRadius: 8, borderColor: COLORS.border, borderWidth: 1, paddingHorizontal: 10 },
    phonePrefix: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '500', marginRight: 6, borderRightWidth: 1, borderRightColor: COLORS.border, paddingRight: 6 },
    formInputLiteFlex: { flex: 1, color: COLORS.textPrimary, paddingVertical: 10, fontSize: 13 },

    savedAddressList: { gap: 10 },
    savedAddressCard: {
        backgroundColor: isDark ? COLORS.softHighlight : COLORS.background,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        padding: 12,
        marginBottom: 8,
    },
    savedAddressCardActive: {
        borderColor: COLORS.accent,
        backgroundColor: isDark ? 'rgba(101, 163, 13, 0.15)' : COLORS.softHighlight,
    },
    savedAddressCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    savedAddressBadge: {
        backgroundColor: isDark ? COLORS.surface : COLORS.softHighlight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    savedAddressBadgeActive: {
        backgroundColor: COLORS.accent + '25',
        borderColor: COLORS.accent,
    },
    savedAddressBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textMuted,
    },
    savedAddressBadgeTextActive: {
        color: COLORS.accent,
    },
    activeTag: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    activeTagText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    savedAddressCardBeingEdited: {
        borderColor: COLORS.accent,
        backgroundColor: COLORS.accent + '15',
    },
    savedAddressActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addressEditBtn: {
        backgroundColor: isDark ? COLORS.surface : COLORS.softHighlight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    addressEditText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.accent,
    },
    undoToastContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1E293B',
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.accent,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    undoToastText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        marginRight: 10,
    },
    undoToastBtn: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 6,
    },
    undoToastBtnText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    addressDeleteBtn: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? COLORS.surface : COLORS.softHighlight,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    addressDeleteIcon: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.error,
    },
    addressCancelEditBtn: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 6,
        backgroundColor: isDark ? COLORS.surface : COLORS.softHighlight,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addressCancelEditBtnText: {
        color: COLORS.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    savedAddressText: {
        fontSize: 13,
        color: COLORS.textPrimary,
        lineHeight: 18,
        fontWeight: '500',
    },
    addNewAddressToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? COLORS.surface : COLORS.softHighlight,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        borderColor: COLORS.accent + '50',
        marginBottom: 10,
    },
    addNewAddressToggleBtnActive: {
        backgroundColor: COLORS.accent + '18',
        borderColor: COLORS.accent,
    },
    addNewAddressPlusCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    addNewAddressPlusCircleActive: {
        backgroundColor: COLORS.accent,
    },
    addNewAddressPlusText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
        lineHeight: 18,
    },
    addNewAddressPlusTextActive: {
        color: '#FFFFFF',
    },
    addNewAddressToggleLabel: {
        color: COLORS.accent,
        fontSize: 14,
        fontWeight: '700',
    },
    addNewAddressToggleLabelActive: {
        color: COLORS.accent,
        fontWeight: '800',
    },
    addressInputsWrapper: {
        marginTop: 4,
    },
    addFormPlaceholder: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: isDark ? COLORS.softHighlight : COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    addFormPlaceholderText: {
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 18,
    },
    savedAddressReceiverRow: {
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    savedAddressReceiverText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    selectAddressAction: {
        marginTop: 8,
        alignItems: 'flex-end',
    },
    selectAddressActionText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.accent,
    },

    crossSellDismissBtn: {
        position: 'absolute',
        top: 6,
        left: 6,
        zIndex: 10,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    crossSellDismissText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
    },
    // Address Choice Modal Styles
    addressChoiceModalCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 22,
        width: SCREEN_WIDTH > 500 ? 460 : '90%',
        borderWidth: 1.5,
        borderColor: COLORS.accent + '40',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
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
        backgroundColor: isDark ? COLORS.surface : COLORS.softHighlight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addressChoiceCloseText: {
        color: COLORS.textMuted,
        fontSize: 14,
        fontWeight: '700',
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
        backgroundColor: isDark ? COLORS.softHighlight : COLORS.background,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1.5,
        borderColor: COLORS.accent,
        marginBottom: 12,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    addressChoiceIconBadgeLive: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.accent + '25',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: COLORS.accent + '60',
    },
    addressChoiceOptionTitleLive: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.accent,
    },
    livePill: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    livePillText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    addressChoiceOptionManual: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? COLORS.softHighlight : COLORS.background,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    addressChoiceIconBadgeManual: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: isDark ? COLORS.surface : COLORS.softHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
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
    addressChoiceArrow: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.accent,
        marginLeft: 8,
    },
    locationPermissionIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.accent + '20',
        borderWidth: 1.5,
        borderColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
        borderWidth: 1.5,
        borderColor: COLORS.border,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 24,
    },
    deleteModalIconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.error + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: COLORS.error + '40',
    },
    deleteModalIcon: {
        fontSize: 28,
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
        backgroundColor: COLORS.softHighlight,
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
        shadowColor: COLORS.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    deleteModalConfirmText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
});

const lightStyles = createStyles(LIGHT_COLORS, false);
const darkStyles = createStyles(DARK_COLORS, true);
const styles = lightStyles;

export default CartScreen;








