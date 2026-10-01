import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { BackHandler, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrderHistoryItem, OrderItemRecord, PayMethod, Product, Screen, Summary } from '../types';
import { PRODUCTS, CATEGORY_PRODUCT_MAP } from '../data/products';
import { useMedColors } from '../theme/colors';
import { careService } from '@/firebase';

interface AppContextValue {
  // ---- state ----
  navStack: Screen[];
  screen: Screen;
  isDark: boolean;
  medColors: ReturnType<typeof useMedColors>;
  cart: Record<string, number>;
  rxUploaded: boolean;
  rxUri: string | null;
  rxFileName: string | null;
  rxFileType: 'image' | 'pdf' | null;
  currentCategory: string;
  currentGroup: string;
  currentSubcat: string;
  currentProduct: string | null;
  lastOrder: Record<string, number>;
  lastOrderId: string;
  payMethod: PayMethod;
  toast: string | null;
  orders: OrderHistoryItem[];
  products: Record<string, Product>;

  // ---- safe area insets ----
  bottomInset: number;
  topInset: number;

  // ---- derived ----
  cartCount: number;
  cartTotal: number;
  cartHasRx: boolean;

  // ---- navigation ----
  goTo: (s: Screen) => void;
  goBack: () => void;
  goHome: () => void;
  openCategory: (catId: string) => void;
  openGroup: (groupId: string, subId: string) => void;
  openProduct: (id: string) => void;
  openCart: () => void;
  openOrders: () => void;
  openAccount: () => void;
  setCurrentSubcat: (s: string) => void;

  // ---- cart / checkout actions ----
  addToCart: (id: string, delta: number) => void;
  reorder: (items: [string, number][]) => void;
  setRxUploaded: (v: boolean) => void;
  setRxDetails: (details: { uri: string | null; name: string | null; type: 'image' | 'pdf' | null } | null) => void;
  setPayMethod: (m: PayMethod) => void;
  placeOrder: () => void;
  computeSummary: (total?: number) => Summary;
  couponApplied: boolean;
  toggleCoupon: () => void;
  clearOrders: () => void;
  resetSampleOrders: () => void;

  // ---- lookups ----
  productsInCategory: (catId: string) => string[];
  productsInGroupSubcat: (groupId: string, subId: string) => string[];

  deliveryLocation: string;
  setDeliveryLocation: (loc: string) => void;
  deliveryAddress: string | null;
  setDeliveryAddress: (addr: string | null) => void;

  // ---- misc ----
  showToast: (msg: string) => void;
  onClose?: () => void;
  onOrderPlaced?: (order: OrderHistoryItem) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const INITIAL_ORDERS: OrderHistoryItem[] = [
  {
    id: '#OB4471',
    date: '14 Sep 2026, 11:30 AM',
    status: 'Delivered',
    total: 218,
    deliveryAddress: 'Flat 402, Jubilee Residency, Hyderabad',
    items: [
      { id: 'vitd3', name: 'Vitamin D3 60K', qty: 2, price: 142, icon: 'capsule' },
      { id: 'ors', name: 'ORS Sachets', qty: 3, price: 65, icon: 'drop' },
    ],
  },
  {
    id: '#OB4102',
    date: '10 Sep 2026, 04:15 PM',
    status: 'Delivered',
    total: 330,
    deliveryAddress: 'Flat 402, Jubilee Residency, Hyderabad',
    items: [
      { id: 'ndl-insulin', name: 'Insulin pen needles', qty: 1, price: 220, icon: 'needle' },
      { id: 'san-sanitizer', name: 'Hand sanitizer', qty: 1, price: 110, icon: 'drop' },
    ],
  },
];

export interface NavEntry {
  screen: Screen;
  product?: string | null;
  category?: string;
  group?: string;
  subcat?: string;
}

export function AppProvider({
  children,
  onClose,
  onOrderPlaced,
}: {
  children: ReactNode;
  onClose?: () => void;
  onOrderPlaced?: (order: OrderHistoryItem) => void;
}) {
  const [navHistory, setNavHistory] = useState<NavEntry[]>([{ screen: 'browse' }]);
  const currentNav = navHistory[navHistory.length - 1] || { screen: 'browse' };
  const screen = currentNav.screen;
  const currentCategory = currentNav.category ?? 'all';
  const currentGroup = currentNav.group ?? 'vitamins';
  const currentSubcat = currentNav.subcat ?? 'all';
  const currentProduct = currentNav.product ?? null;
  const navStack = useMemo(() => navHistory.map((n) => n.screen), [navHistory]);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [rxUploaded, setRxUploaded] = useState(false);
  const [rxUri, setRxUri] = useState<string | null>(null);
  const [rxFileName, setRxFileName] = useState<string | null>(null);
  const [rxFileType, setRxFileType] = useState<'image' | 'pdf' | null>(null);

  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'ios'
    ? Math.max(insets.bottom, 16)
    : (insets.bottom > 0 ? insets.bottom + 8 : 24);
  const topInset = Platform.OS === 'ios'
    ? insets.top
    : (StatusBar.currentHeight ? StatusBar.currentHeight : 24);

  const setRxDetails = useCallback((details: { uri: string | null; name: string | null; type: 'image' | 'pdf' | null } | null) => {
    if (details && (details.uri || details.name)) {
      setRxUri(details.uri);
      setRxFileName(details.name);
      setRxFileType(details.type);
      setRxUploaded(true);
    } else {
      setRxUri(null);
      setRxFileName(null);
      setRxFileType(null);
      setRxUploaded(false);
    }
  }, []);

  const [lastOrder, setLastOrder] = useState<Record<string, number>>({});
  const [lastOrderId, setLastOrderId] = useState('#OB0000');
  const [payMethod, setPayMethod] = useState<PayMethod>('upi');
  const [toast, setToast] = useState<string | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<string>('Hyderabad, Telangana');
  const [deliveryAddress, setDeliveryAddress] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderHistoryItem[]>(INITIAL_ORDERS);
  const [couponApplied, setCouponApplied] = useState(false);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>(PRODUCTS);

  useEffect(() => {
    let isMounted = true;
    careService.fetchMedicines().then((backendMeds) => {
      if (!isMounted || !backendMeds || backendMeds.length === 0) return;
      const updated = { ...PRODUCTS };
      backendMeds.forEach((med) => {
        if (!med.id) return;
        const productObj: Product = {
          name: med.name,
          generic: med.genericName || 'Verified Medicine',
          price: med.price,
          mrp: med.originalPrice || Math.round(med.price * 1.15),
          rx: Boolean(med.rx),
          icon: (med.icon as any) || 'pill',
          category: med.category || 'medicines',
          group: med.group,
          subcat: med.subcat,
          popular: med.popular ?? true,
          diabetes: med.diabetes,
          brandGroup: med.brandGroup,
          manufacturer: med.manufacturer || 'Certified Pharmacy',
          pack: med.packSize || med.dosageForm || 'Standard Pack',
          desc: med.desc || `${med.name} - ${med.category || 'Pharmaceutical Care'}. Fast doorstep delivery.`,
          image: med.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        };
        updated[med.id] = productObj;
        PRODUCTS[med.id] = productObj;
      });
      setProductsMap(updated);
    }).catch((err) => {
      console.warn('[AppContext] Failed to sync catalogMedicines from backend:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const toggleCoupon = useCallback(() => {
    setCouponApplied((prev) => {
      const next = !prev;
      showToast(next ? 'Coupon BUDDY50 applied! ₹50 saved' : 'Coupon removed');
      return next;
    });
  }, [showToast]);

  const goTo = useCallback((s: Screen) => {
    setNavHistory((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          screen: s,
          product: last?.product,
          category: last?.category,
          group: last?.group,
          subcat: last?.subcat,
        },
      ];
    });
  }, []);

  const goBack = useCallback(
    () => setNavHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev)),
    []
  );

  const goHome = useCallback(() => setNavHistory([{ screen: 'browse' }]), []);

  const openCategory = useCallback((catId: string) => {
    setNavHistory((prev) => [
      ...prev,
      { screen: 'category', category: catId },
    ]);
  }, []);

  const openGroup = useCallback((groupId: string, subId: string) => {
    setNavHistory((prev) => [
      ...prev,
      { screen: 'groupcategory', group: groupId, subcat: subId },
    ]);
  }, []);

  const openProduct = useCallback((id: string) => {
    setNavHistory((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          screen: 'product',
          product: id,
          group: last?.group,
          subcat: last?.subcat,
          category: last?.category,
        },
      ];
    });
  }, []);

  const setCurrentSubcat = useCallback((subId: string) => {
    setNavHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const next = [...prev];
      next[next.length - 1] = { ...last, subcat: subId };
      return next;
    });
  }, []);

  // Hardware/System back gesture and button support for Android
  useEffect(() => {
    const onBackPress = () => {
      if (navHistory.length > 1) {
        goBack();
        return true;
      }
      if (onClose) {
        onClose();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navHistory.length, goBack, onClose]);

  const openCart = useCallback(() => goTo('cart'), [goTo]);
  const openOrders = useCallback(() => goTo('orders'), [goTo]);
  const openAccount = useCallback(() => goTo('account'), [goTo]);

  const clearOrders = useCallback(() => {
    setOrders([]);
    showToast('Orders cleared (empty state)');
  }, [showToast]);

  const resetSampleOrders = useCallback(() => {
    setOrders(INITIAL_ORDERS);
    showToast('Sample orders restored');
  }, [showToast]);

  const addToCart = useCallback((id: string, delta: number) => {
    setCart((prev) => {
      const next = (prev[id] || 0) + delta;
      const copy = { ...prev };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  }, []);

  const reorder = useCallback(
    (items: [string, number][]) => {
      setCart((prev) => {
        const copy = { ...prev };
        items.forEach(([id, qty]) => {
          copy[id] = (copy[id] || 0) + qty;
        });
        return copy;
      });
      showToast('Added to cart');
    },
    [showToast]
  );

  const cartCount = useMemo(
    () => Object.values(cart).reduce((a, b) => a + b, 0),
    [cart]
  );
  const cartTotal = useMemo(
    () => Object.entries(cart).reduce((sum, [id, qty]) => {
      const pPrice = productsMap[id]?.price ?? PRODUCTS[id]?.price ?? 0;
      return sum + pPrice * qty;
    }, 0),
    [cart, productsMap]
  );
  const cartHasRx = useMemo(() => Object.keys(cart).some((id) => (productsMap[id] || PRODUCTS[id])?.rx), [cart, productsMap]);

  const computeSummary = useCallback(
    (customTotal?: number): Summary => {
      let mrpTotal = 0;
      let itemTotal = 0;

      for (const [id, qty] of Object.entries(cart)) {
        const p = productsMap[id] || PRODUCTS[id];
        if (p && qty > 0) {
          const mrp = p.mrp ?? p.price;
          mrpTotal += mrp * qty;
          itemTotal += p.price * qty;
        }
      }

      if (customTotal !== undefined && itemTotal === 0 && customTotal > 0) {
        itemTotal = customTotal;
        mrpTotal = Math.round(customTotal * 1.15);
      }

      // Packaging & Delivery is FREE (₹0.00)
      const delivery = 0;

      // Coupon BUDDY50: Saves ₹50 on eligible orders (or up to itemTotal)
      const discount = couponApplied && itemTotal > 0 ? Math.min(50, itemTotal) : 0;

      const productSavings = Math.max(0, mrpTotal - itemTotal);
      const totalSavings = productSavings + discount;
      const payable = Math.max(0, itemTotal + delivery - discount);

      return {
        mrpTotal: Math.round(mrpTotal * 100) / 100,
        item: Math.round(itemTotal * 100) / 100,
        savings: Math.round(totalSavings * 100) / 100,
        delivery: 0,
        discount: Math.round(discount * 100) / 100,
        payable: Math.round(payable * 100) / 100,
      };
    },
    [cart, couponApplied, productsMap]
  );

  const placeOrder = useCallback(() => {
    if (cartCount === 0) return;
    const newId = '#OB' + (5000 + Math.floor(Math.random() * 900));
    setLastOrder(cart);
    setLastOrderId(newId);

    const itemsList: OrderItemRecord[] = Object.entries(cart).map(([id, qty]) => {
      const p = productsMap[id] || PRODUCTS[id];
      return {
        id,
        name: p?.name || 'Medicine Item',
        qty,
        price: p?.price || 0,
        icon: p?.icon || 'pill',
      };
    });

    const s = computeSummary(cartTotal);
    const newOrder: OrderHistoryItem = {
      id: newId,
      date: 'Today, Just now',
      status: 'Order Placed',
      total: s.payable,
      deliveryAddress: deliveryAddress || deliveryLocation || 'Hyderabad, Telangana',
      items: itemsList,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Asynchronously create canonical medicine order in Firestore via Cloud Function
    careService.placeMedicineOrder({
      id: newId,
      pharmacyId: 'pharmacy-central-hyd',
      items: itemsList.map((it) => ({
        medicineId: it.id,
        name: it.name,
        quantity: it.qty,
        unitPriceMinor: Math.round(it.price * 100),
      })),
      deliveryAddress: {
        receiverName: 'Customer',
        phone: '',
        line1: deliveryAddress || deliveryLocation || 'Plot 42, Madhapur, Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
      },
      paymentMethod: payMethod === 'card' ? 'card' : 'upi',
      prescriptionUri: rxUri || undefined,
    }).catch((err) => {
      console.warn('[AppContext] Server placeMedicineOrder warning:', err);
    });

    if (onOrderPlaced) {
      onOrderPlaced(newOrder);
    }
    setCart({});
    setRxDetails(null);
    setNavHistory([{ screen: 'browse' }, { screen: 'confirm' }]);
  }, [cart, cartCount, cartTotal, computeSummary, deliveryAddress, deliveryLocation, onOrderPlaced, payMethod, productsMap, rxUri, setRxDetails]);

  const productsInCategory = useCallback((catId: string) => {
    // 1. If any of the 10 specific medicine categories, return exactly its 5 verified products
    if (CATEGORY_PRODUCT_MAP[catId]) {
      return CATEGORY_PRODUCT_MAP[catId];
    }
    // 2. All medicines category: returns all 50 products across the 10 categories + backend medicines
    if (catId === 'medicines') {
      const topIds = Object.values(CATEGORY_PRODUCT_MAP).flat();
      const extraIds = Object.keys(productsMap).filter((id) => productsMap[id]?.category === 'medicines' && !topIds.includes(id));
      return [...topIds, ...extraIds];
    }
    // 3. All products view: prioritized 50 medicine items first, followed by others
    if (catId === 'all') {
      const topIds = Object.values(CATEGORY_PRODUCT_MAP).flat();
      const otherIds = Object.keys(productsMap).filter((id) => !topIds.includes(id));
      return [...topIds, ...otherIds];
    }
    // 4. Other specialized categories
    if (catId === 'diabetes') {
      return Object.keys(productsMap).filter(
        (id) => productsMap[id]?.diabetes || productsMap[id]?.category === 'diabetes'
      );
    }
    if (catId === 'devices') {
      return Object.keys(productsMap).filter(
        (id) =>
          productsMap[id]?.category === 'devices' ||
          productsMap[id]?.category === 'needles' ||
          productsMap[id]?.category === 'pens'
      );
    }
    if (catId === 'homeopathy') {
      return Object.keys(productsMap).filter(
        (id) => productsMap[id]?.category === 'homeopathy' || productsMap[id]?.subcat === 'homeopathy'
      );
    }
    return Object.keys(productsMap).filter((id) => productsMap[id]?.category === catId);
  }, [productsMap]);

  const productsInGroupSubcat = useCallback((groupId: string, subId: string) => {
    if (subId === 'all') return Object.keys(productsMap).filter((id) => productsMap[id]?.group === groupId);
    return Object.keys(productsMap).filter(
      (id) => productsMap[id]?.group === groupId && productsMap[id]?.subcat === subId
    );
  }, [productsMap]);

  const medColors = useMedColors();
  const isDark = medColors.isDark;

  const value: AppContextValue = {
    navStack,
    screen,
    isDark,
    medColors,
    cart,
    rxUploaded,
    rxUri,
    rxFileName,
    rxFileType,
    currentCategory,
    currentGroup,
    currentSubcat,
    currentProduct,
    lastOrder,
    lastOrderId,
    payMethod,
    toast,
    orders,
    products: productsMap,

    bottomInset,
    topInset,

    cartCount,
    cartTotal,
    cartHasRx,

    goTo,
    goBack,
    goHome,
    openCategory,
    openGroup,
    openProduct,
    openCart,
    openOrders,
    openAccount,
    setCurrentSubcat,

    addToCart,
    reorder,
    setRxUploaded,
    setRxDetails,
    setPayMethod,
    placeOrder,
    computeSummary,
    couponApplied,
    toggleCoupon,
    clearOrders,
    resetSampleOrders,

    productsInCategory,
    productsInGroupSubcat,

    deliveryLocation,
    setDeliveryLocation,
    deliveryAddress,
    setDeliveryAddress,

    showToast,
    onClose,
    onOrderPlaced,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp() must be called within an <AppProvider>');
  }
  return ctx;
}
