import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { AppProvider, useApp } from './context/AppContext';
import PaymentCheckoutScreen from '../../../food/components/cart/PaymentCheckoutScreen';
import { COLORS } from './theme/colors';
import { styles } from './theme/styles';
import { OrderHistoryItem, PayMethod } from './types';
import { CATEGORY_META, CHIP_ORDER } from './data/categories';
import { GROUPS, SUBCAT_ICON, SUBCAT_IMAGE } from './data/groups';
import { MEDICINE_CATEGORIES } from './data/medicineCategories';
import { PRODUCTS } from './data/products';
import { MEDICINE_IMAGES } from './data/medicineImages';

import ToastOverlay from './components/ToastOverlay';
import HeaderBar from './components/HeaderBar';
import Field from './components/Field';
import SummaryLine from './components/SummaryLine';
import Icon from './components/Icon';
import OneBuddyLogo from './components/OneBuddyLogo';
import MedicineCategoryCard from './components/MedicineCategoryCard';
import FooterIcon from './components/FooterIcon';
import ProductCard from './components/ProductCard';
import LocationPickerModal from './components/LocationPickerModal';
import {
  BackIcon,
  CardPayIcon,
  CartIcon,
  ChevronDownIcon,
  CloseIcon,
  CouponPercentIcon,
  EditAddressIcon,
  GpsIcon,
  NetBankingIcon,
  PinIcon,
  PrescriptionDocIcon,
  SearchIcon,
  UpiPayIcon,
} from './components/UiIcons';
import {
  AxisBankLogo,
  HdfcBankLogo,
  IciciBankLogo,
  KotakBankLogo,
  MastercardLogo,
  RuPayLogo,
  SbiBankLogo,
  VisaLogo,
} from './components/PaymentLogos';

// =============================================================================
// ASSETS & CONSTANTS
// =============================================================================

const UPI_LOGOS = {
  gpay: require('../../assets/upi/gpay.png'),
  phonepe: require('../../assets/upi/phonepe.png'),
  paytm: require('../../assets/upi/paytm.png'),
  bhim: require('../../assets/upi/bhim.png'),
};

const FAQS = [
  { q: "Where's my order?", a: 'Track it from the order screen' },
  { q: 'Why is a prescription needed?', a: 'Required by law for Rx medicines' },
  { q: 'Can I reschedule delivery?', a: 'Up to 30 mins before arrival' },
];

interface ChatMessage {
  id: string;
  sender: 'pharmacist' | 'user';
  text: string;
  time: string;
}

const PHARMACY_QUICK_CHIPS = [
  'Prescription verification status',
  'How fast is express delivery?',
  'Dosage & before/after food instructions',
  'Generic or substitute brand options',
  'Speak with on-duty pharmacist',
];

// =============================================================================
// 1. BROWSE SCREEN
// =============================================================================

export function BrowseScreen() {
  const {
    cartCount,
    cartTotal,
    currentCategory,
    openCategory,
    openGroup,
    openCart,
    openOrders,
    openAccount,
    reorder,
    goHome,
    showToast,
    deliveryLocation,
    setDeliveryLocation,
    bottomInset,
    onClose,
    medColors,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return Object.entries(PRODUCTS).filter(([, p]) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.generic && p.generic.toLowerCase().includes(q)) ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.desc && p.desc.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <View style={[styles.screen, { backgroundColor: medColors.bg }]}>
      {/* Top Brand Bar */}
      <View style={[styles.brandTopBar, { backgroundColor: medColors.card, borderBottomColor: medColors.line }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {onClose && (
            <TouchableOpacity
              style={[
                styles.iconBtn,
                {
                  backgroundColor: medColors.isDark ? '#334155' : '#FFFFFF',
                  borderColor: medColors.isDark ? '#64748B' : medColors.line,
                },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Back to Home"
            >
              <BackIcon size={20} color={medColors.isDark ? '#FFFFFF' : COLORS.ink} />
            </TouchableOpacity>
          )}
          <OneBuddyLogo size="md" />
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor: medColors.isDark ? '#334155' : '#FFFFFF',
                borderColor: medColors.isDark ? '#64748B' : medColors.line,
              },
            ]}
            onPress={openCart}
            activeOpacity={0.7}
          >
            <CartIcon size={19} color={medColors.isDark ? '#86EFAC' : COLORS.greenDark} />
            {!!cartCount && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 16, paddingTop: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: medColors.bg, borderColor: medColors.line }]}>
          <SearchIcon size={18} color={medColors.inkSoft} />
          <TextInput
            placeholder="Search medicines, syrups, injections, care…"
            placeholderTextColor={medColors.inkSoft}
            style={[styles.searchInput, { color: medColors.ink }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {isSearching && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10} activeOpacity={0.7}>
              <CloseIcon size={16} color={medColors.inkSoft} />
            </TouchableOpacity>
          )}
        </View>

        {/* Location Selector */}
        <TouchableOpacity
          style={styles.locationPill}
          onPress={() => setShowLocationModal(true)}
          activeOpacity={0.7}
        >
          <PinIcon size={16} color={COLORS.greenDark} />
          <Text style={[styles.locationText, { color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }]} numberOfLines={1}>
            {deliveryLocation}
          </Text>
          <ChevronDownIcon size={14} color={COLORS.greenDark} />
        </TouchableOpacity>

        {/* Search Results */}
        {isSearching ? (
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.sectionTitle,
                { fontSize: 13, color: medColors.inkSoft, marginBottom: 10 },
              ]}
            >
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "
              {searchQuery.trim()}"
            </Text>

            {searchResults.length === 0 ? (
              <View
                style={{
                  paddingVertical: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SearchIcon size={44} color={medColors.inkSoft} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: medColors.ink,
                    marginTop: 12,
                    marginBottom: 4,
                  }}
                >
                  No medicines found
                </Text>
                <Text style={{ fontSize: 12, color: medColors.inkSoft, textAlign: 'center' }}>
                  Try a different name, generic salt or category
                </Text>
              </View>
            ) : (
              <View style={styles.grid2}>
                {searchResults.map(([id]) => (
                  <View key={id} style={{ width: '48%' }}>
                    <ProductCard id={id} />
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* First Order Promotional Banner */}
            <View style={[styles.offerCard, { backgroundColor: medColors.isDark ? '#143818' : COLORS.greenLight, borderColor: medColors.isDark ? '#2D580B' : COLORS.greenBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.offerCardTag}>FIRST ORDER OFFER</Text>
                <Text style={[styles.offerCardTitle, { color: medColors.ink }]}>50% off, up to ₹100</Text>
                <Text style={[styles.offerCardSub, { color: medColors.inkSoft }]}>Valid on Medicines, Healthcare & Care</Text>
              </View>
              <TouchableOpacity
                style={styles.offerCardBtn}
                onPress={() => showToast('Coupon BUDDY50 applied at checkout!')}
                activeOpacity={0.85}
              >
                <Text style={styles.offerCardBtnText}>BUDDY50</Text>
              </TouchableOpacity>
            </View>

            {/* All Categories (Chip Filter) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipRow}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {CHIP_ORDER.map((cid) => (
                <TouchableOpacity
                  key={cid}
                  style={[
                    styles.chip,
                    { backgroundColor: medColors.isDark ? '#1E293B' : COLORS.greenPale, borderColor: medColors.line },
                    currentCategory === cid && styles.chipActive,
                  ]}
                  onPress={() => {
                    if (cid === 'vitamins') openGroup('vitamins', 'all');
                    else if (cid === 'diabetes') openGroup('diabetes', 'all');
                    else openCategory(cid);
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: medColors.ink },
                      currentCategory === cid && styles.chipTextActive,
                    ]}
                  >
                    {CATEGORY_META[cid].chip}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Medicine Categories Carousel */}
            <View style={{ marginBottom: 4 }}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 8, color: medColors.ink }]}>
                  Medicine Categories
                </Text>
                <TouchableOpacity onPress={() => openCategory('medicines')}>
                  <Text style={styles.linkText}>View all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                {MEDICINE_CATEGORIES.map((cat) => (
                  <MedicineCategoryCard
                    key={cat.id}
                    category={cat}
                    onPress={() =>
                      cat.id === 'vitamins'
                        ? openGroup('vitamins', 'all')
                        : openCategory(cat.id)
                    }
                    width={120}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Order Again Section */}
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: medColors.ink }]}>Order again</Text>
              <TouchableOpacity onPress={openOrders}>
                <Text style={styles.linkText}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <TouchableOpacity
                style={[styles.reorderCard, { backgroundColor: medColors.card, borderColor: medColors.line }]}
                onPress={() => reorder([['vitd3', 2], ['ors', 3]])}
                activeOpacity={0.8}
              >
                <Text style={[styles.reorderTitle, { color: medColors.ink }]}>Order #OB4471</Text>
                <Text style={[styles.reorderSub, { color: medColors.inkSoft }]} numberOfLines={2}>
                  Vitamin D3 60K · 2 packs, ORS Sachets
                </Text>
                <View style={styles.againBtn}>
                  <Text style={styles.againBtnText}>Order again</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reorderCard, { backgroundColor: medColors.card, borderColor: medColors.line }]}
                onPress={() => reorder([['ndl-insulin', 1], ['san-sanitizer', 1]])}
                activeOpacity={0.8}
              >
                <Text style={[styles.reorderTitle, { color: medColors.ink }]}>Order #OB4102</Text>
                <Text style={[styles.reorderSub, { color: medColors.inkSoft }]} numberOfLines={2}>
                  Insulin pen needles, Sanitizer 500ml
                </Text>
                <View style={styles.againBtn}>
                  <Text style={styles.againBtnText}>Order again</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Subcategory Showcase */}
            {Object.entries(GROUPS).map(([gid, g]) => (
              <View key={gid} style={[styles.groupCard, { backgroundColor: medColors.card, borderColor: medColors.line, borderWidth: 1 }]}>
                <Text style={[styles.groupCardTitle, { color: medColors.ink }]}>{g.title}</Text>
                <View style={styles.groupGrid}>
                  {g.subcats.map((sc) => (
                    <TouchableOpacity
                      key={sc.id}
                      style={[styles.groupTile, { backgroundColor: medColors.bg, borderColor: medColors.line }]}
                      onPress={() => openGroup(gid, sc.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.groupTileImg, { backgroundColor: '#FFFFFF' }]}>
                        {SUBCAT_IMAGE[sc.id] ? (
                          <Image
                            source={
                              typeof SUBCAT_IMAGE[sc.id] === 'string'
                                ? { uri: SUBCAT_IMAGE[sc.id] }
                                : SUBCAT_IMAGE[sc.id]
                            }
                            style={styles.groupTilePhoto}
                            resizeMode="contain"
                          />
                        ) : (
                          <Icon type={SUBCAT_ICON[sc.id]} size={22} />
                        )}
                      </View>
                      <Text style={[styles.groupTileName, { color: medColors.ink }]} numberOfLines={2}>
                        {sc.name}
                      </Text>
                      <Text style={styles.groupTileDiscount}>{sc.discount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}
                  onPress={() => openGroup(gid, 'all')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewAllText}>View all {g.title} products</Text>
                  <Text style={{ color: COLORS.greenDark, fontWeight: '800', fontSize: 13 }}>→</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {cartCount > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={openCart} activeOpacity={0.9}>
          <View>
            <Text style={styles.cartBarLine}>
              {cartCount} {cartCount === 1 ? 'item' : 'items'} · ₹{cartTotal.toFixed(2)}
            </Text>
            <Text style={styles.cartBarSub}>Same-salt alternatives available</Text>
          </View>
          <View style={styles.cartBarBtn}>
            <Text style={styles.cartBarBtnText}>View cart →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={showLocationModal}
        currentLocation={deliveryLocation}
        onSelectLocation={(loc) => {
          setDeliveryLocation(loc);
          showToast(`Delivery location set to ${loc}`);
        }}
        onClose={() => setShowLocationModal(false)}
      />

      {/* Clean 4-Tab Bottom Footer with SVG Vector Icons */}
      <View style={[styles.bottomNav, { backgroundColor: medColors.card, borderTopColor: medColors.line, paddingBottom: bottomInset }]}>
        {[
          { key: 'home' as const, label: 'Home', onPress: goHome, active: true },
          { key: 'categories' as const, label: 'Categories', onPress: () => openCategory('medicines') },
          { key: 'orders' as const, label: 'My Orders', onPress: openOrders },
          { key: 'account' as const, label: 'Account', onPress: openAccount },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.bnItem} onPress={item.onPress}>
            <FooterIcon name={item.key} active={item.active} size={22} />
            <Text style={[styles.bnLabel, { color: medColors.inkSoft }, item.active && styles.bnLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// =============================================================================
// 2. CATEGORY SCREEN
// =============================================================================

export function CategoryScreen() {
  const {
    currentCategory,
    openCategory,
    openGroup,
    productsInCategory,
    cartCount,
    cartTotal,
    goBack,
    goTo,
    openCart,
    bottomInset,
    medColors,
  } = useApp();

  const [query, setQuery] = useState('');

  const meta = CATEGORY_META[currentCategory] || CATEGORY_META.all;
  const ids = productsInCategory(currentCategory);
  const isMedicineView =
    currentCategory === 'medicines' ||
    MEDICINE_CATEGORIES.some((c) => c.id === currentCategory);

  const filteredIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ids;
    return ids.filter((id) => {
      const p = PRODUCTS[id];
      if (!p) return false;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.generic && p.generic.toLowerCase().includes(q)) ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
        (p.desc && p.desc.toLowerCase().includes(q))
      );
    });
  }, [ids, query]);

  return (
    <View style={[styles.screen, { backgroundColor: medColors.bg }]}>
      <HeaderBar
        title={meta.title}
        onBack={goBack}
        onHelp={() => goTo('help')}
        onCart={openCart}
        cartCount={cartCount}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: (cartCount > 0 ? 80 : 20) + bottomInset }}>
        <View style={[styles.searchBar, { backgroundColor: medColors.bg, borderColor: medColors.line }]}>
          <SearchIcon size={18} color={medColors.inkSoft} />
          <TextInput
            placeholder={`Search within ${meta.title}…`}
            placeholderTextColor={medColors.inkSoft}
            style={[styles.searchInput, { color: medColors.ink }]}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <CloseIcon size={16} color={medColors.inkSoft} />
            </TouchableOpacity>
          )}
        </View>

        {/* Medicine Categories Carousel */}
        {isMedicineView && (
          <View style={{ marginBottom: 14 }}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { fontSize: 13.5, marginBottom: 8 }]}>
                Medicine Categories
              </Text>
              {currentCategory !== 'medicines' && (
                <TouchableOpacity onPress={() => openCategory('medicines')}>
                  <Text style={styles.linkText}>All medicines</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {MEDICINE_CATEGORIES.map((cat) => (
                <MedicineCategoryCard
                  key={cat.id}
                  category={cat}
                  onPress={() => cat.id === 'vitamins' ? openGroup('vitamins', 'all') : openCategory(cat.id)}
                  width={124}
                  active={currentCategory === cat.id}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={[styles.sectionTitle, { fontSize: 13, color: medColors.inkSoft, marginBottom: 0 }]}>
            {filteredIds.length} {filteredIds.length === 1 ? 'Product' : 'Products'}
          </Text>
        </View>

        {filteredIds.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
            <SearchIcon size={40} color={medColors.inkSoft} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: medColors.ink, marginBottom: 4, marginTop: 8 }}>
              No products found
            </Text>
            <Text style={{ fontSize: 12, color: medColors.inkSoft }}>
              Try searching with another name or browse all medicines
            </Text>
          </View>
        ) : (
          <View style={styles.grid2}>
            {filteredIds.map((id) => (
              <View key={id} style={{ width: '48%' }}>
                <ProductCard id={id} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {cartCount > 0 && (
        <TouchableOpacity
          style={[styles.cartBar, { marginBottom: Math.max(bottomInset, 16) }]}
          onPress={openCart}
          activeOpacity={0.9}
        >
          <View>
            <Text style={styles.cartBarLine}>
              {cartCount} {cartCount === 1 ? 'item' : 'items'} · ₹{cartTotal.toFixed(2)}
            </Text>
            <Text style={styles.cartBarSub}>Tap to review & checkout</Text>
          </View>
          <View style={styles.cartBarBtn}>
            <Text style={styles.cartBarBtnText}>View cart →</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// =============================================================================
// 3. GROUP CATEGORY SCREEN
// =============================================================================

export function GroupCategoryScreen() {
  const {
    currentGroup,
    currentSubcat,
    setCurrentSubcat,
    productsInGroupSubcat,
    cartCount,
    cartTotal,
    goBack,
    goTo,
    openCart,
    bottomInset,
    medColors,
  } = useApp();

  const g = GROUPS[currentGroup] || GROUPS.vitamins;
  const tabs = [{ id: 'all', name: 'All' }, ...(g?.subcats || [])];
  const ids = productsInGroupSubcat(currentGroup || 'vitamins', currentSubcat);

  return (
    <View style={[styles.screen, { backgroundColor: medColors.bg }]}>
      <HeaderBar title={g.title} onBack={goBack} onHelp={() => goTo('help')} onCart={openCart} cartCount={cartCount} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subtabStrip}>
        {tabs.map((t) => {
          const active = t.id === currentSubcat;
          const icon = t.id === 'all' ? 'box' : SUBCAT_ICON[t.id];
          return (
            <TouchableOpacity key={t.id} style={styles.subtab} onPress={() => setCurrentSubcat(t.id)}>
              <View style={[styles.subtabAvatar, active && styles.subtabAvatarActive, { overflow: 'hidden', backgroundColor: '#FFFFFF' }]}>
                {SUBCAT_IMAGE[t.id] ? (
                  <Image
                    source={typeof SUBCAT_IMAGE[t.id] === 'string' ? { uri: SUBCAT_IMAGE[t.id] } : SUBCAT_IMAGE[t.id]}
                    style={{ width: '88%', height: '88%' }}
                    resizeMode="contain"
                  />
                ) : (
                  <Icon type={icon} size={20} />
                )}
              </View>
              <Text style={[styles.subtabLabel, active && styles.subtabLabelActive]} numberOfLines={2}>
                {t.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: (cartCount > 0 ? 80 : 20) + bottomInset, paddingTop: 12 }}>
        <View style={styles.grid2}>
          {ids.map((id) => (
            <View key={id} style={{ width: '48%' }}>
              <ProductCard id={id} accent={COLORS.green} />
            </View>
          ))}
        </View>
      </ScrollView>

      {cartCount > 0 && (
        <TouchableOpacity
          style={[styles.cartBar, { marginBottom: Math.max(bottomInset, 16) }]}
          onPress={openCart}
          activeOpacity={0.9}
        >
          <View>
            <Text style={styles.cartBarLine}>
              {cartCount} {cartCount === 1 ? 'item' : 'items'} · ₹{cartTotal.toFixed(2)}
            </Text>
            <Text style={styles.cartBarSub}>Tap to review & checkout</Text>
          </View>
          <View style={styles.cartBarBtn}>
            <Text style={styles.cartBarBtnText}>View cart →</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// =============================================================================
// 4. PRODUCT SCREEN
// =============================================================================

export function ProductScreen() {
  const { currentProduct, cart, addToCart, openProduct, cartCount, cartTotal, goBack, goTo, openCart, bottomInset, medColors } = useApp();
  const [heroImgError, setHeroImgError] = useState(false);

  if (!currentProduct) return null;
  const id = currentProduct;
  const p = PRODUCTS[id];
  const mrp = p.mrp ?? p.price;
  const localImage = MEDICINE_IMAGES[id];

  const brandAlts = p.brandGroup
    ? Object.keys(PRODUCTS).filter((pid) => pid !== id && PRODUCTS[pid].brandGroup === p.brandGroup)
    : [];
  const similarIds = brandAlts.length
    ? brandAlts
    : Object.keys(PRODUCTS)
        .filter((pid) => pid !== id && p.category && PRODUCTS[pid].category === p.category)
        .slice(0, 3);
  const similarTitle = brandAlts.length ? 'Same formula, other brands' : 'Similar products';
  const qty = cart[id] || 0;

  return (
    <View style={[styles.screen, { backgroundColor: medColors.bg }]}>
      <HeaderBar title="Product details" onBack={goBack} onHelp={() => goTo('help')} onCart={openCart} cartCount={cartCount} />

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 20 + bottomInset }}>
        <View style={[styles.pdHero, { backgroundColor: '#FFFFFF' }]}>
          {localImage ? (
            <Image
              source={localImage}
              style={styles.pdHeroPhoto}
              resizeMode="contain"
            />
          ) : p.image && !heroImgError ? (
            <Image
              source={{ uri: p.image }}
              style={styles.pdHeroPhoto}
              resizeMode="cover"
              onError={() => setHeroImgError(true)}
            />
          ) : (
            <Icon type={p.icon} size={60} />
          )}
        </View>
        {p.rx && <Text style={styles.pdRxTag}>Prescription required</Text>}
        <Text style={[styles.pdName, { color: medColors.ink }]}>{p.name}</Text>
        <Text style={[styles.pdGeneric, { color: medColors.inkSoft }]}>{p.manufacturer || p.generic}</Text>
        <View style={styles.pdPriceRow}>
          <Text style={[styles.pdPrice, { color: medColors.ink }]}>₹{p.price}</Text>
          {mrp > p.price && <Text style={styles.pcardStrike}>₹{mrp}</Text>}
        </View>
        <Text style={[styles.pdDesc, { color: medColors.inkSoft }]}>{p.desc}</Text>

        {similarIds.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: medColors.ink }]}>{similarTitle}</Text>
            {similarIds.map((sid) => {
              const sp = PRODUCTS[sid];
              return (
                <TouchableOpacity
                  key={sid}
                  style={[styles.similarRow, { backgroundColor: medColors.card, borderColor: medColors.line }]}
                  onPress={() => openProduct(sid)}
                >
                  <View style={[styles.similarImg, { overflow: 'hidden', backgroundColor: '#FFFFFF' }]}>
                    {MEDICINE_IMAGES[sid] ? (
                      <Image
                        source={MEDICINE_IMAGES[sid]}
                        style={{ width: '100%', height: '100%', borderRadius: 10 }}
                        resizeMode="contain"
                      />
                    ) : sp.image ? (
                      <Image
                        source={{ uri: sp.image }}
                        style={{ width: '100%', height: '100%', borderRadius: 10 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Icon type={sp.icon} size={18} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.similarName, { color: medColors.ink }]}>{sp.name}</Text>
                    <Text style={[styles.similarMeta, { color: medColors.inkSoft }]}>{sp.generic || sp.manufacturer}</Text>
                  </View>
                  <Text style={[styles.pdPrice, { color: medColors.ink }]}>₹{sp.price}</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      <View style={[styles.bottomDock, { backgroundColor: medColors.card, borderTopColor: medColors.line, paddingBottom: bottomInset }]}>
        {qty === 0 ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => addToCart(id, 1)} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Add to cart · ₹{p.price.toFixed(2)}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.dockSplit}>
            <View style={[styles.qtyStepperLg, { backgroundColor: medColors.surface2, borderColor: medColors.line }]}>
              <TouchableOpacity
                onPress={() => addToCart(id, -1)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Text style={[styles.qtyStepperLgBtn, { color: medColors.ink }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.qtyStepperLgVal, { color: medColors.ink }]}>{qty}</Text>
              <TouchableOpacity
                onPress={() => addToCart(id, 1)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Text style={[styles.qtyStepperLgBtn, { color: medColors.ink }]}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={openCart} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Go to cart · ₹{cartTotal.toFixed(2)}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// =============================================================================
// 5. CART SCREEN
// =============================================================================

export function CartScreen() {
  const {
    cart,
    cartCount,
    cartTotal,
    cartHasRx,
    rxUploaded,
    rxUri,
    rxFileName,
    rxFileType,
    setRxDetails,
    addToCart,
    computeSummary,
    couponApplied,
    toggleCoupon,
    goBack,
    goTo,
    goHome,
    showToast,
    bottomInset,
    medColors,
    deliveryLocation,
    setDeliveryLocation,
    deliveryAddress,
    setDeliveryAddress,
  } = useApp();

  const ids = Object.keys(cart).filter((id) => cart[id] > 0);
  const s = computeSummary();

  const [showBillModal, setShowBillModal] = useState(false);
  const [qtyModalItem, setQtyModalItem] = useState<string | null>(null);
  const [showRxModal, setShowRxModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Address Form States
  const [addrFlat, setAddrFlat] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrCity, setAddrCity] = useState('Hyderabad, Telangana');
  const [addrPincode, setAddrPincode] = useState('500081');

  const handleUseLiveLocation = () => {
    const liveLoc = 'Detected Live GPS: Plot 88, Road No. 36, Jubilee Hills, Hyderabad - 500033';
    setDeliveryAddress(liveLoc);
    setDeliveryLocation('Jubilee Hills, Hyderabad');
    showToast('📍 Live GPS location added as delivery address!');
  };

  const handleSaveManualAddress = () => {
    if (!addrFlat.trim() && !addrStreet.trim()) {
      Alert.alert('Address Incomplete', 'Please enter your flat/house number and street/area.');
      return;
    }
    const full = [
      addrFlat.trim(),
      addrStreet.trim(),
      addrLandmark.trim() ? `Near ${addrLandmark.trim()}` : '',
      addrCity.trim(),
      addrPincode.trim() ? `- ${addrPincode.trim()}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    setDeliveryAddress(full);
    setShowAddressModal(false);
    showToast('✅ Delivery address saved!');
  };

  const handleProceedToPayment = () => {
    if (!deliveryAddress || deliveryAddress.trim().length === 0) {
      Alert.alert(
        'Delivery Address Required',
        'Please add your delivery address using "Add Live Location" or "Enter Your Address" before proceeding to payment.',
        [
          { text: 'Add Live Location', onPress: handleUseLiveLocation },
          { text: 'Enter Address', onPress: () => setShowAddressModal(true) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      showToast('⚠️ Please provide delivery address first');
      return;
    }
    goTo('details');
  };

  const pickFromCamera = async () => {
    try {
      setShowRxModal(false);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Camera permission is required to photograph your doctor prescription.'
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const name = asset.fileName || `Rx_Camera_${Date.now().toString().slice(-4)}.jpg`;
        setRxDetails({
          uri: asset.uri,
          name,
          type: 'image',
        });
        showToast('Prescription photo captured & attached!');
      }
    } catch (err) {
      console.warn('Camera error:', err);
      showToast('Could not open camera');
    }
  };

  const pickFromGallery = async () => {
    try {
      setShowRxModal(false);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Gallery access is required to choose your saved prescription image.'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const name = asset.fileName || `Rx_Gallery_${Date.now().toString().slice(-4)}.jpg`;
        setRxDetails({
          uri: asset.uri,
          name,
          type: 'image',
        });
        showToast('Prescription selected from gallery!');
      }
    } catch (err) {
      console.warn('Gallery error:', err);
      showToast('Could not open gallery');
    }
  };

  const pickDocument = async () => {
    try {
      setShowRxModal(false);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const doc = result.assets[0];
        const isPdf = (doc.mimeType && doc.mimeType.includes('pdf')) || doc.name.toLowerCase().endsWith('.pdf');
        setRxDetails({
          uri: doc.uri,
          name: doc.name || 'Doctor_Prescription.pdf',
          type: isPdf ? 'pdf' : 'image',
        });
        showToast('Prescription document attached!');
      }
    } catch (err) {
      console.warn('Document picker error:', err);
      showToast('Could not pick document');
    }
  };

  const handleRemoveRx = () => {
    setRxDetails(null);
    showToast('Prescription removed');
  };

  if (ids.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: medColors.bg }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 10,
            backgroundColor: medColors.card,
            borderBottomWidth: 1,
            borderBottomColor: medColors.line,
          }}
        >
          <TouchableOpacity
            onPress={goBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: medColors.isDark ? '#334155' : '#FFFFFF',
              borderWidth: 1,
              borderColor: medColors.isDark ? '#64748B' : medColors.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel="Back"
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19l-7-7 7-7"
                stroke={medColors.isDark ? '#FFFFFF' : COLORS.ink}
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '800', color: medColors.ink, textAlign: 'center', flex: 1 }}>Cart</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingBottom: 24 + bottomInset }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: COLORS.greenLight,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Svg width={38} height={38} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM20 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                fill={COLORS.greenDark}
              />
              <Path
                d="M1 1.5h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6.5H6"
                stroke={COLORS.greenDark}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: medColors.ink, marginBottom: 6 }}>
            Your cart is empty
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: medColors.inkSoft,
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 18,
            }}
          >
            Explore verified medicines, healthcare products and get doorstep delivery.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.greenDark,
              paddingVertical: 14,
              paddingHorizontal: 32,
              borderRadius: 999,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
            }}
            onPress={goHome}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Browse Medicines</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: medColors.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: medColors.card,
          borderBottomWidth: 1,
          borderBottomColor: medColors.line,
        }}
      >
        <TouchableOpacity
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: medColors.isDark ? '#334155' : '#FFFFFF',
            borderWidth: 1,
            borderColor: medColors.isDark ? '#64748B' : medColors.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="Back"
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19l-7-7 7-7"
              stroke={medColors.isDark ? '#FFFFFF' : COLORS.ink}
              strokeWidth={2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: '800', color: medColors.ink, textAlign: 'center', flex: 1 }}>Cart</Text>

        <TouchableOpacity
          onPress={goHome}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: COLORS.greenLight,
            borderWidth: 1,
            borderColor: COLORS.greenBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          <SearchIcon size={18} color={COLORS.greenDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 120 + bottomInset }}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================================= */}
        {/* Delivery Address Card at the Top of Cart */}
        {/* ========================================================================= */}
        <View
          style={{
            backgroundColor: medColors.card,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: deliveryAddress ? (medColors.isDark ? '#2D580B' : '#86EFAC') : (medColors.isDark ? '#4B5563' : '#CBD5E1'),
            padding: 14,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: deliveryAddress ? 8 : 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: deliveryAddress ? medColors.greenLight : medColors.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PinIcon size={18} color={deliveryAddress ? (medColors.isDark ? '#86EFAC' : COLORS.greenDark) : medColors.inkSoft} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: medColors.ink }}>
                    Delivery Address
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#EF4444' }}>*</Text>
                </View>
                <Text style={{ fontSize: 11, color: medColors.inkSoft, marginTop: 1 }}>
                  ⚡ Express 15–20 min doorstep dispensing
                </Text>
              </View>
            </View>

            {deliveryAddress ? (
              <TouchableOpacity
                onPress={() => setShowAddressModal(true)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: medColors.surface2,
                  borderWidth: 1,
                  borderColor: medColors.line,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }}>
                  Change
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {deliveryAddress ? (
            <View
              style={{
                backgroundColor: medColors.surface2,
                borderRadius: 10,
                padding: 10,
                borderWidth: 1,
                borderColor: medColors.line,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }}>
                  ✓ CONFIRMED ADDRESS
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: medColors.ink, lineHeight: 18 }}>
                {deliveryAddress}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Option 1: Add Live Location */}
                <TouchableOpacity
                  onPress={handleUseLiveLocation}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: medColors.greenLight,
                    borderWidth: 1.2,
                    borderColor: COLORS.green,
                    borderRadius: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                  }}
                  activeOpacity={0.8}
                >
                  <GpsIcon size={16} color={medColors.isDark ? '#86EFAC' : COLORS.greenDark} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }} numberOfLines={1}>
                    Add Live Location
                  </Text>
                </TouchableOpacity>

                {/* Option 2: Enter Your Address */}
                <TouchableOpacity
                  onPress={() => setShowAddressModal(true)}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: medColors.surface2,
                    borderWidth: 1.2,
                    borderColor: medColors.line,
                    borderRadius: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                  }}
                  activeOpacity={0.8}
                >
                  <EditAddressIcon size={16} color={medColors.ink} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: medColors.ink }} numberOfLines={1}>
                    Enter Your Address
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 11, color: '#EF4444', fontStyle: 'italic', marginTop: 1 }}>
                ⚠️ Address selection required before proceeding to payment
              </Text>
            </View>
          )}
        </View>

        <Text
          style={{
            fontSize: 15,
            fontWeight: '800',
            color: medColors.ink,
            marginBottom: 12,
          }}
        >
          {cartCount} {cartCount === 1 ? 'item' : 'items'}
        </Text>

        {ids.map((id, index) => {
          const p = PRODUCTS[id];
          if (!p) return null;
          const qty = cart[id];
          const mrp = p.mrp ?? p.price;
          const lineTotal = p.price * qty;
          const lineMrp = mrp * qty;
          const pct = mrp > p.price ? Math.round((1 - p.price / mrp) * 100) : 15;
          const localImage = MEDICINE_IMAGES[id];
          const hasSubstitute = index === 1 || !!p.brandGroup;

          return (
            <View
              key={id}
              style={{
                marginBottom: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: hasSubstitute ? '#C084FC' : medColors.line,
                backgroundColor: medColors.card,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              {hasSubstitute && (
                <View
                  style={{
                    backgroundColor: '#9333EA',
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>
                    You saved {pct > 0 ? pct : 47}.0% by choosing Substitute
                  </Text>
                </View>
              )}

              <View style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: medColors.line,
                      backgroundColor: medColors.isDark ? '#2A2E37' : '#FFFFFF',
                      padding: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {localImage ? (
                      <Image
                        source={localImage}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                      />
                    ) : p.image ? (
                      <Image
                        source={{ uri: p.image }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                      />
                    ) : (
                      <Icon type={p.icon} size={26} />
                    )}
                  </View>

                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text
                      style={{
                        fontSize: 14.5,
                        fontWeight: '700',
                        color: medColors.ink,
                        lineHeight: 19,
                      }}
                      numberOfLines={2}
                    >
                      {p.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: medColors.inkSoft,
                        marginTop: 3,
                      }}
                      numberOfLines={1}
                    >
                      {p.manufacturer || p.generic || 'USV Pvt Ltd'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => addToCart(id, -qty)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: medColors.surface2,
                      borderWidth: 1,
                      borderColor: medColors.line,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 13, color: medColors.inkSoft, fontWeight: '800' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginTop: 12,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          color: medColors.inkSoft,
                          textDecorationLine: 'line-through',
                          marginRight: 6,
                        }}
                      >
                        MRP ₹{lineMrp.toFixed(2)}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }}>
                        {pct}% OFF
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '800',
                          color: medColors.ink,
                          marginRight: 6,
                        }}
                      >
                        ₹{lineTotal.toFixed(2)}
                      </Text>
                      {qty > 1 && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: medColors.inkSoft,
                            fontWeight: '600',
                            marginRight: 6,
                          }}
                        >
                          (₹{p.price.toFixed(2)} × {qty})
                        </Text>
                      )}
                      <View
                        style={{
                          backgroundColor: medColors.greenPale,
                          borderWidth: 1,
                          borderColor: medColors.greenBorder,
                          paddingVertical: 2.5,
                          paddingHorizontal: 7,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: medColors.isDark ? '#86EFAC' : COLORS.greenForest, fontWeight: '600' }}>
                          {p.pack || 'Strip of 10 Units'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setQtyModalItem(id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: COLORS.greenDark,
                      overflow: 'hidden',
                      backgroundColor: medColors.card,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.08,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={{
                        paddingLeft: 12,
                        paddingRight: 8,
                        paddingVertical: 6,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }}>
                        Qty: {qty}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: COLORS.greenDark,
                        paddingHorizontal: 8,
                        paddingVertical: 9,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ChevronDownIcon size={11} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                </View>

                {hasSubstitute && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: medColors.surface2,
                      padding: 10,
                      borderRadius: 10,
                      marginTop: 12,
                      borderWidth: 1,
                      borderColor: medColors.line,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          backgroundColor: medColors.isDark ? '#2A2E37' : '#FFFFFF',
                          borderWidth: 1,
                          borderColor: medColors.line,
                          padding: 2,
                          marginRight: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Image
                          source={
                            MEDICINE_IMAGES['vs-neurobion'] ||
                            require('../../assets/medicines/vs-neurobion.png')
                          }
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10.5, color: medColors.inkSoft, fontWeight: '500' }}>
                          Replaced
                        </Text>
                        <Text
                          style={{ fontSize: 12, fontWeight: '700', color: medColors.ink }}
                          numberOfLines={1}
                        >
                          Neurobion Forte Tablet 30
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => showToast('Switched back to original brand')}
                      activeOpacity={0.7}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Text
                        style={{
                          fontSize: 12.5,
                          fontWeight: '800',
                          color: medColors.isDark ? '#86EFAC' : COLORS.greenDark,
                          marginRight: 2,
                        }}
                      >
                        Switch Back
                      </Text>
                      <Text style={{ fontSize: 14, color: medColors.isDark ? '#86EFAC' : COLORS.greenDark, fontWeight: '800' }}>
                        ↻
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          onPress={goHome}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 14,
            marginTop: 4,
            marginBottom: 10,
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 16, fontWeight: '800', color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }}>
            Add more medicines
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }}>+</Text>
        </TouchableOpacity>

        {/* Prescription Upload Card */}
        <TouchableOpacity
          onPress={() => setShowRxModal(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: medColors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: rxUploaded ? COLORS.green : medColors.line,
            padding: 14,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}
          activeOpacity={0.8}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              backgroundColor: rxUploaded ? medColors.greenLight : (medColors.isDark ? '#422006' : '#FFF7ED'),
              borderWidth: 1,
              borderColor: rxUploaded ? medColors.greenBorder : '#FED7AA',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {rxUploaded && rxUri && rxFileType === 'image' ? (
              <Image source={{ uri: rxUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : rxUploaded && rxFileType === 'pdf' ? (
              <Text style={{ fontSize: 22 }}>📄</Text>
            ) : rxUploaded ? (
              <Text style={{ fontSize: 22 }}>✅</Text>
            ) : (
              <PrescriptionDocIcon size={24} color="#EA580C" />
            )}
          </View>

          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: medColors.ink }}>
                {rxUploaded ? 'Prescription Attached' : 'Upload a Prescription'}
              </Text>
              {rxUploaded && (
                <View
                  style={{
                    backgroundColor: medColors.greenLight,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    marginLeft: 6,
                  }}
                >
                  <Text style={{ fontSize: 10.5, fontWeight: '700', color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }}>
                    {rxFileType === 'pdf' ? 'PDF' : 'Attached'}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={{ fontSize: 12, color: medColors.inkSoft, marginTop: 3, lineHeight: 16 }}
              numberOfLines={1}
            >
              {rxUploaded
                ? `${rxFileName || 'Doctor_Prescription.jpg'} (Tap to view/replace)`
                : 'Please upload a valid prescription given by your doctor. This is optional'}
            </Text>
          </View>

          <Text style={{ fontSize: 20, color: medColors.inkSoft, fontWeight: '600' }}>›</Text>
        </TouchableOpacity>

        {/* Apply Coupon Card */}
        <TouchableOpacity
          onPress={toggleCoupon}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: medColors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: couponApplied ? COLORS.green : medColors.line,
            padding: 14,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}
          activeOpacity={0.8}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: couponApplied ? medColors.greenLight : medColors.surface2,
              borderWidth: 1,
              borderColor: couponApplied ? medColors.greenBorder : medColors.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CouponPercentIcon size={22} color={couponApplied ? (medColors.isDark ? '#86EFAC' : COLORS.greenDark) : medColors.inkSoft} />
          </View>

          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: couponApplied ? (medColors.isDark ? '#86EFAC' : COLORS.greenDark) : medColors.ink,
                }}
              >
                {couponApplied ? 'Coupon BUDDY50 Applied' : 'Apply coupon'}
              </Text>
              {couponApplied && (
                <View
                  style={{
                    backgroundColor: medColors.greenLight,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    marginLeft: 6,
                  }}
                >
                  <Text style={{ fontSize: 10.5, fontWeight: '700', color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }}>
                    −₹{s.discount.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={{
                fontSize: 12,
                color: couponApplied ? (medColors.isDark ? '#86EFAC' : COLORS.greenDark) : medColors.inkSoft,
                marginTop: 2,
              }}
            >
              {couponApplied
                ? `You saved ₹${s.discount.toFixed(2)} on this order (Tap to remove)`
                : 'Save ₹50 with BUDDY50 on medicines'}
            </Text>
          </View>

          <Text style={{ fontSize: 20, color: medColors.inkSoft, fontWeight: '600' }}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: medColors.card,
          borderTopWidth: 1,
          borderTopColor: medColors.line,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: bottomInset,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 8,
        }}
      >
        <View style={{ flex: 1, marginRight: 10, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 19, fontWeight: '800', color: medColors.ink }}>
              ₹{s.payable.toFixed(2)}
            </Text>
            {s.savings > 0 && (
              <View
                style={{
                  backgroundColor: medColors.greenLight,
                  paddingHorizontal: 5,
                  paddingVertical: 1.5,
                  borderRadius: 4,
                  marginLeft: 6,
                }}
              >
                <Text style={{ fontSize: 10.5, fontWeight: '700', color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }}>
                  Saved ₹{s.savings.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setShowBillModal(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: medColors.isDark ? '#86EFAC' : COLORS.greenDark, marginTop: 2 }}>
              View bill ›
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleProceedToPayment}
          style={{
            backgroundColor: COLORS.greenDark,
            borderRadius: 999,
            paddingVertical: 13,
            paddingHorizontal: 20,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}
          activeOpacity={0.85}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: 14,
              textAlign: 'center',
            }}
            numberOfLines={1}
          >
            Proceed to Payment ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Prescription Upload Action Sheet Modal */}
      <Modal visible={showRxModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowRxModal(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'flex-end',
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: medColors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 22,
                  paddingBottom: 24 + bottomInset,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '800', color: medColors.ink }}>
                    Upload Prescription
                  </Text>
                  <TouchableOpacity onPress={() => setShowRxModal(false)}>
                    <CloseIcon size={20} color={medColors.inkSoft} />
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 13, color: medColors.inkSoft, marginBottom: 20, lineHeight: 18 }}>
                  Attach a clear picture or document of your prescription written by a registered doctor.
                </Text>

                <TouchableOpacity
                  onPress={pickFromCamera}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: medColors.surface2,
                    borderWidth: 1,
                    borderColor: medColors.line,
                    marginBottom: 12,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 26, marginRight: 14 }}>📷</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: medColors.ink }}>
                      Camera
                    </Text>
                    <Text style={{ fontSize: 12, color: medColors.inkSoft, marginTop: 2 }}>
                      Click a fresh picture of the doctor's prescription
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={pickFromGallery}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: medColors.surface2,
                    borderWidth: 1,
                    borderColor: medColors.line,
                    marginBottom: 12,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 26, marginRight: 14 }}>🖼️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: medColors.ink }}>
                      Photo Gallery
                    </Text>
                    <Text style={{ fontSize: 12, color: medColors.inkSoft, marginTop: 2 }}>
                      Select photo or screenshot saved in your gallery
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={pickDocument}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: medColors.surface2,
                    borderWidth: 1,
                    borderColor: medColors.line,
                    marginBottom: 16,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 26, marginRight: 14 }}>📁</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: medColors.ink }}>
                      Files & PDFs
                    </Text>
                    <Text style={{ fontSize: 12, color: medColors.inkSoft, marginTop: 2 }}>
                      Upload electronic prescription PDF or scan
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }}>›</Text>
                </TouchableOpacity>

                {rxUploaded && (
                  <TouchableOpacity
                    onPress={handleRemoveRx}
                    style={{
                      paddingVertical: 13,
                      borderRadius: 999,
                      backgroundColor: '#FEE2E2',
                      alignItems: 'center',
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 14 }}>
                      Remove Attached Prescription
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* View Bill Breakdown Modal */}
      <Modal visible={showBillModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowBillModal(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'flex-end',
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: medColors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 20,
                  paddingBottom: 24 + bottomInset,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '800', color: medColors.ink }}>
                    Bill Details
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowBillModal(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <CloseIcon size={20} color={medColors.inkSoft} />
                  </TouchableOpacity>
                </View>

                <SummaryLine
                  label="Item total (MRP)"
                  value={`₹${s.mrpTotal.toFixed(2)}`}
                />

                <SummaryLine
                  label="Special price discount"
                  value={s.mrpTotal > s.item ? `−₹${(s.mrpTotal - s.item).toFixed(2)}` : '₹0.00'}
                  isGreen={s.mrpTotal > s.item}
                  valueColor={s.mrpTotal > s.item ? (medColors.isDark ? '#86EFAC' : COLORS.greenDark) : medColors.inkSoft}
                />

                <SummaryLine
                  label="Packaging & Delivery"
                  value={s.delivery === 0 ? 'FREE (₹0.00)' : `₹${s.delivery.toFixed(2)}`}
                  isGreen={s.delivery === 0}
                  valueColor={s.delivery === 0 ? (medColors.isDark ? '#86EFAC' : COLORS.greenDark) : medColors.ink}
                />

                <SummaryLine
                  label={couponApplied ? "Coupon discount (BUDDY50)" : "Coupon discount"}
                  value={s.discount > 0 ? `−₹${s.discount.toFixed(2)}` : '₹0.00'}
                  isGreen={s.discount > 0}
                  valueColor={s.discount > 0 ? (medColors.isDark ? '#86EFAC' : COLORS.greenDark) : medColors.inkSoft}
                />

                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: medColors.line,
                    marginVertical: 10,
                  }}
                />

                <SummaryLine
                  label="To pay"
                  value={`₹${s.payable.toFixed(2)}`}
                  total
                />

                {s.savings > 0 && (
                  <View
                    style={{
                      backgroundColor: medColors.greenLight,
                      borderRadius: 12,
                      padding: 12,
                      marginTop: 14,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: medColors.greenBorder,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: medColors.isDark ? '#86EFAC' : COLORS.greenForest }}>
                      🎉 You saved ₹${s.savings.toFixed(2)} on this order!
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.greenDark,
                    borderRadius: 999,
                    paddingVertical: 14,
                    alignItems: 'center',
                    marginTop: 16,
                  }}
                  onPress={() => setShowBillModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Quantity Selector Modal */}
      <Modal visible={!!qtyModalItem} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setQtyModalItem(null)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  width: '90%',
                  backgroundColor: medColors.card,
                  borderRadius: 24,
                  padding: 22,
                  borderWidth: 1,
                  borderColor: medColors.line,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                  elevation: 6,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <Text style={{ fontSize: 17, fontWeight: '800', color: medColors.ink }}>
                    Select Quantity
                  </Text>
                  <TouchableOpacity onPress={() => setQtyModalItem(null)}>
                    <CloseIcon size={18} color={medColors.inkSoft} />
                  </TouchableOpacity>
                </View>

                <Text
                  style={{ fontSize: 13, color: medColors.inkSoft, marginBottom: 18 }}
                  numberOfLines={1}
                >
                  {qtyModalItem && PRODUCTS[qtyModalItem]?.name}
                </Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const isSelected = qtyModalItem ? cart[qtyModalItem] === num : false;
                    return (
                      <TouchableOpacity
                        key={num}
                        onPress={() => {
                          if (qtyModalItem) {
                            const delta = num - (cart[qtyModalItem] || 0);
                            addToCart(qtyModalItem, delta);
                          }
                          setQtyModalItem(null);
                        }}
                        style={{
                          width: '16.5%',
                          aspectRatio: 1,
                          borderRadius: 999,
                          backgroundColor: isSelected ? COLORS.greenDark : medColors.surface2,
                          borderWidth: 1.5,
                          borderColor: isSelected ? COLORS.greenDark : medColors.line,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: isSelected ? 0.2 : 0.04,
                          shadowRadius: 2,
                          elevation: isSelected ? 3 : 1,
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '800',
                            color: isSelected ? '#FFFFFF' : medColors.ink,
                          }}
                        >
                          {num}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    if (qtyModalItem) {
                      addToCart(qtyModalItem, -cart[qtyModalItem]);
                    }
                    setQtyModalItem(null);
                  }}
                  style={{
                    marginTop: 18,
                    paddingVertical: 13,
                    borderRadius: 999,
                    backgroundColor: '#FEE2E2',
                    alignItems: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#DC2626' }}>
                    Remove from Cart
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Enter Delivery Address Modal */}
      <Modal visible={showAddressModal} transparent animationType="slide" onRequestClose={() => setShowAddressModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowAddressModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={{
                  backgroundColor: medColors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 20,
                  paddingBottom: 24 + bottomInset,
                  maxHeight: '85%',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: medColors.ink }}>
                      Enter Delivery Address
                    </Text>
                    <Text style={{ fontSize: 12, color: medColors.inkSoft, marginTop: 2 }}>
                      Medicines will be dispatched to this location
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowAddressModal(false)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: medColors.surface2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                  >
                    <CloseIcon size={14} color={medColors.inkSoft} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {/* Quick Preset Buttons */}
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: medColors.inkSoft, textTransform: 'uppercase', marginBottom: 8 }}>
                    Quick Locality Suggestions:
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {[
                      { label: 'Jubilee Hills', area: 'Road No. 36, Jubilee Hills', pin: '500033' },
                      { label: 'Banjara Hills', area: 'Road No. 12, Banjara Hills', pin: '500034' },
                      { label: 'Madhapur', area: 'Ayyappa Society, Madhapur', pin: '500081' },
                      { label: 'Hitec City', area: 'Cyber Towers, Hitec City', pin: '500081' },
                      { label: 'Gachibowli', area: 'Financial District, Gachibowli', pin: '500032' },
                      { label: 'Kondapur', area: 'Raghavendra Colony, Kondapur', pin: '500084' },
                    ].map((loc) => (
                      <TouchableOpacity
                        key={loc.label}
                        onPress={() => {
                          setAddrStreet(loc.area);
                          setAddrPincode(loc.pin);
                        }}
                        style={{
                          backgroundColor: medColors.surface2,
                          borderWidth: 1,
                          borderColor: medColors.line,
                          borderRadius: 16,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 11.5, fontWeight: '600', color: medColors.ink }}>{loc.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Flat / House No */}
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: medColors.ink, marginBottom: 4 }}>
                    House / Flat / Block No. <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    value={addrFlat}
                    onChangeText={setAddrFlat}
                    placeholder="e.g. Flat 402, Jubilee Residency"
                    placeholderTextColor={medColors.inkSoft}
                    style={{
                      backgroundColor: medColors.bg,
                      borderWidth: 1,
                      borderColor: medColors.line,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      fontSize: 13,
                      color: medColors.ink,
                      marginBottom: 12,
                    }}
                  />

                  {/* Street / Colony / Area */}
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: medColors.ink, marginBottom: 4 }}>
                    Street / Area / Colony <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    value={addrStreet}
                    onChangeText={setAddrStreet}
                    placeholder="e.g. Road No. 36, Near Apollo Pharmacy"
                    placeholderTextColor={medColors.inkSoft}
                    style={{
                      backgroundColor: medColors.bg,
                      borderWidth: 1,
                      borderColor: medColors.line,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      fontSize: 13,
                      color: medColors.ink,
                      marginBottom: 12,
                    }}
                  />

                  {/* Landmark */}
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: medColors.ink, marginBottom: 4 }}>
                    Landmark (Optional)
                  </Text>
                  <TextInput
                    value={addrLandmark}
                    onChangeText={setAddrLandmark}
                    placeholder="e.g. Opposite City Centre Mall"
                    placeholderTextColor={medColors.inkSoft}
                    style={{
                      backgroundColor: medColors.bg,
                      borderWidth: 1,
                      borderColor: medColors.line,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      fontSize: 13,
                      color: medColors.ink,
                      marginBottom: 12,
                    }}
                  />

                  {/* City & Pincode Row */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                    <View style={{ flex: 1.5 }}>
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: medColors.ink, marginBottom: 4 }}>
                        City & State
                      </Text>
                      <TextInput
                        value={addrCity}
                        onChangeText={setAddrCity}
                        placeholder="Hyderabad, Telangana"
                        placeholderTextColor={medColors.inkSoft}
                        style={{
                          backgroundColor: medColors.bg,
                          borderWidth: 1,
                          borderColor: medColors.line,
                          borderRadius: 12,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          fontSize: 13,
                          color: medColors.ink,
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: medColors.ink, marginBottom: 4 }}>
                        Pincode
                      </Text>
                      <TextInput
                        value={addrPincode}
                        onChangeText={setAddrPincode}
                        placeholder="500081"
                        placeholderTextColor={medColors.inkSoft}
                        keyboardType="numeric"
                        style={{
                          backgroundColor: medColors.bg,
                          borderWidth: 1,
                          borderColor: medColors.line,
                          borderRadius: 12,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          fontSize: 13,
                          color: medColors.ink,
                        }}
                      />
                    </View>
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    onPress={handleSaveManualAddress}
                    style={{
                      backgroundColor: COLORS.greenDark,
                      borderRadius: 999,
                      paddingVertical: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14.5 }}>
                      Save & Set Address
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// =============================================================================
// 6. DETAILS SCREEN
// =============================================================================

export function DetailsScreen() {
  const {
    computeSummary,
    placeOrder,
    goBack,
    medColors,
  } = useApp();

  const s = computeSummary();

  return (
    <View style={[styles.screen, { backgroundColor: medColors.bg }]}>
      <PaymentCheckoutScreen
        grandTotal={s.payable}
        hideCOD={true}
        hideReceiptModal={true}
        title="Pharmacy Order Payment"
        subtitle="256-bit Encrypted • Verified Pharmacy Hub"
        onBack={goBack}
        isDark={medColors.isDark}
        onOrderSuccess={(details) => {
          placeOrder();
        }}
      />
    </View>
  );
}

// =============================================================================
// 7. CONFIRM SCREEN
// =============================================================================

export function ConfirmScreen() {
  const { lastOrder, lastOrderId, orders, goHome, goTo, bottomInset, medColors } = useApp();
  const ids = Object.keys(lastOrder);
  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <View style={[styles.screen, { backgroundColor: medColors.bg }]}>
      <HeaderBar title="Order confirmed" onBack={goHome} onHelp={() => goTo('help')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 + bottomInset, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.confirmHero}>
          <View style={[styles.confirmCheck, { backgroundColor: medColors.greenLight }]}>
            <Text style={{ fontSize: 28 }}>✅</Text>
          </View>
          <Text style={[styles.confirmTitle, { color: medColors.ink }]}>Order placed!</Text>
          <Text style={[styles.confirmSub, { color: medColors.inkSoft }]}>Your pharmacy has confirmed the order</Text>
        </View>

        {/* ETA Card */}
        <View style={styles.etaCard}>
          <View>
            <Text style={styles.etaTitle}>Arriving today</Text>
            <Text style={styles.etaSub}>{dateLabel} · Hyderabad</Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaBadgeNum}>28</Text>
            <Text style={styles.etaBadgeLabel}>MINS</Text>
          </View>
        </View>

        {/* Your Orders Section */}
        <View style={{ marginTop: 18, marginBottom: 8, paddingHorizontal: 2 }}>
          <Text style={[styles.sectionTitle, { fontSize: 17, marginBottom: 8, color: medColors.ink }]}>
            Your orders
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: medColors.card,
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: medColors.line,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 13.5, color: medColors.inkSoft, fontWeight: '600' }}>Order ID</Text>
          <Text style={{ fontSize: 14, color: medColors.ink, fontWeight: '800' }}>{lastOrderId}</Text>
        </View>

        {ids.map((id) => {
          const p = PRODUCTS[id];
          if (!p) return null;
          return (
            <View
              key={id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: medColors.card,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: medColors.line,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: medColors.line,
                  padding: 3,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                {MEDICINE_IMAGES[id] ? (
                  <Image
                    source={MEDICINE_IMAGES[id]}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                ) : p.image ? (
                  <Image
                    source={{ uri: p.image }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                ) : (
                  <Icon type={p.icon} size={24} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: medColors.ink }}>
                  {p.name} × {lastOrder[id]}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: medColors.isDark ? '#86EFAC' : COLORS.greenDark,
                    marginTop: 3,
                  }}
                >
                  ₹{(p.price * lastOrder[id]).toFixed(2)}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Total Amount Paid */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: medColors.card,
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: medColors.line,
            marginTop: 4,
            marginBottom: 14,
          }}
        >
          <Text style={{ fontSize: 14, color: medColors.ink, fontWeight: '700' }}>
            Total Amount Paid
          </Text>
          <Text style={{ fontSize: 16, color: medColors.isDark ? '#86EFAC' : COLORS.greenDark, fontWeight: '800' }}>
            ₹{(orders[0]?.total ?? 0).toFixed(2)}
          </Text>
        </View>

        <View style={styles.helpRow}>
          <TouchableOpacity style={[styles.helpBtn, { backgroundColor: medColors.surface2, borderColor: medColors.line }]} onPress={() => goTo('help')}>
            <Text style={[styles.helpBtnText, { color: medColors.ink }]}>❓ Help & FAQs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.helpBtn, { backgroundColor: medColors.surface2, borderColor: medColors.line }]}
            onPress={() => goTo('chat')}
          >
            <Text style={[styles.helpBtnText, { color: medColors.ink }]}>💬 Chat support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.bottomDock, { backgroundColor: medColors.card, borderTopColor: medColors.line, paddingBottom: bottomInset }]}>
        <TouchableOpacity style={styles.primaryBtn} onPress={goHome}>
          <Text style={styles.primaryBtnText}>Return to home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            {
              backgroundColor: medColors.surface2,
              borderWidth: 1,
              borderColor: medColors.line,
              marginTop: 8,
            },
          ]}
          onPress={() => goTo('orders')}
        >
          <Text style={[styles.primaryBtnText, { color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }]}>
            View in My Orders
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =============================================================================
// 8. HELP SCREEN
// =============================================================================

export function HelpScreen() {
  const { goBack, goTo, bottomInset, medColors } = useApp();

  return (
    <View style={[styles.screen, { backgroundColor: medColors.bg }]}>
      <HeaderBar title="Help & FAQs" onBack={goBack} />
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 + bottomInset }}>
        {FAQS.map((f) => (
          <View key={f.q} style={[styles.payOption, { backgroundColor: medColors.card, borderColor: medColors.line }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.payLabel, { color: medColors.ink }]}>{f.q}</Text>
              <Text style={[styles.paySub, { color: medColors.inkSoft }]}>{f.a}</Text>
            </View>
          </View>
        ))}
        <TouchableOpacity style={[styles.primaryBtn, { marginTop: 8 }]} onPress={() => goTo('chat')}>
          <Text style={styles.primaryBtnText}>Chat with support</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// =============================================================================
// 9. ORDERS SCREEN
// =============================================================================

export function OrdersScreen() {
  const { orders, goHome, goBack, goTo, reorder, showToast, clearOrders, resetSampleOrders, bottomInset, medColors } = useApp();

  return (
    <View style={[styles.screen, { backgroundColor: medColors.bg }]}>
      <HeaderBar
        title="My Orders"
        sub={orders.length > 0 ? `${orders.length} orders placed` : undefined}
        onBack={goBack}
        onHelp={() => goTo('help')}
      />

      {orders.length === 0 ? (
        <View style={[styles.emptyOrdersContainer, { paddingBottom: 24 + bottomInset }]}>
          <View style={[styles.emptyOrdersIconCircle, { backgroundColor: medColors.greenLight }]}>
            <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 8l-9-5-9 5 9 5 9-5z"
                stroke={medColors.isDark ? '#86EFAC' : COLORS.greenDark}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={medColors.greenPale}
              />
              <Path
                d="M3 8v8l9 5 9-5V8"
                stroke={medColors.isDark ? '#86EFAC' : COLORS.greenDark}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M12 13v8"
                stroke={medColors.isDark ? '#86EFAC' : COLORS.greenDark}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M12 5.5v3M10.5 7h3"
                stroke={COLORS.green}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </Svg>
          </View>

          <Text style={[styles.emptyOrdersTitle, { color: medColors.ink }]}>No Orders</Text>
          <Text style={[styles.emptyOrdersSub, { color: medColors.inkSoft }]}>
            You haven't placed any medicine orders yet. Explore our wide range of medicines and health products!
          </Text>

          <TouchableOpacity style={styles.emptyOrdersBtn} onPress={goHome} activeOpacity={0.85}>
            <Text style={styles.emptyOrdersBtnText}>Browse Medicines</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.emptyOrdersDemoBtn} onPress={resetSampleOrders}>
            <Text style={[styles.emptyOrdersDemoText, { color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }]}>↺ Load sample orders for preview</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 + bottomInset, paddingTop: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: medColors.inkSoft }}>Past orders</Text>
            <TouchableOpacity onPress={clearOrders}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#EF4444' }}>Test empty state</Text>
            </TouchableOpacity>
          </View>

          {orders.map((o) => {
            const isDelivered = o.status === 'Delivered';
            return (
              <View key={o.id} style={[styles.orderCard, { backgroundColor: medColors.card, borderColor: medColors.line }]}>
                <View style={[styles.orderCardHeader, { borderBottomColor: medColors.line }]}>
                  <View>
                    <Text style={[styles.orderIdText, { color: medColors.ink }]}>{o.id}</Text>
                    <Text style={[styles.orderDateText, { color: medColors.inkSoft }]}>{o.date}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      isDelivered ? styles.statusBadgeDelivered : styles.statusBadgeTransit,
                    ]}
                  >
                    <Text
                      style={[
                        isDelivered
                          ? styles.statusBadgeDeliveredText
                          : styles.statusBadgeTransitText,
                      ]}
                    >
                      {isDelivered ? '● Delivered' : '⏳ ' + o.status}
                    </Text>
                  </View>
                </View>

                {o.items.map((item, idx) => (
                  <View key={idx} style={styles.orderItemSummary}>
                    {MEDICINE_IMAGES[item.id] ? (
                      <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 2, marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                        <Image source={MEDICINE_IMAGES[item.id]} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                      </View>
                    ) : (
                      <Icon type={item.icon} size={18} />
                    )}
                    <Text style={[styles.orderItemName, { color: medColors.ink }]} numberOfLines={1}>
                      {item.name} × {item.qty}
                    </Text>
                    <Text style={[styles.orderItemPrice, { color: medColors.inkSoft }]}>₹{(item.price * item.qty).toFixed(2)}</Text>
                  </View>
                ))}

                <View style={[styles.orderTotalLine, { borderTopColor: medColors.line }]}>
                  <Text style={[styles.orderTotalLabel, { color: medColors.inkSoft }]}>Total Paid</Text>
                  <Text style={[styles.orderTotalAmount, { color: medColors.ink }]}>₹{o.total.toFixed(2)}</Text>
                </View>

                <View style={styles.orderCardBtns}>
                  <TouchableOpacity
                    style={styles.orderBtnReorder}
                    onPress={() => reorder(o.items.map((it) => [it.id, it.qty]))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.orderBtnReorderText}>Order again</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.orderBtnTrack, { backgroundColor: medColors.surface2, borderColor: medColors.line }]}
                    onPress={() => showToast(`Tracking order ${o.id}`)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.orderBtnTrackText, { color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }]}>
                      {isDelivered ? 'View invoice' : 'Track delivery'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

// =============================================================================
// 10. ACCOUNT SCREEN
// =============================================================================

export function AccountScreen() {
  const { goBack, goTo, openOrders, orders, showToast, bottomInset, medColors } = useApp();

  const [userName, setUserName] = useState('Aarav Sharma');
  const [userPhone, setUserPhone] = useState('+91 98765 43210');
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('Aarav Sharma');
  const [tempPhone, setTempPhone] = useState('+91 98765 43210');

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AS';

  const menuSections = [
    {
      title: 'Healthcare & Orders',
      items: [
        {
          icon: '📦',
          label: 'My Orders',
          sub: `${orders.length} placed`,
          onPress: openOrders,
        },
        {
          icon: '📋',
          label: 'My Prescriptions',
          sub: '1 active',
          onPress: () => showToast('1 verified prescription on file'),
        },
        {
          icon: '📍',
          label: 'Saved Addresses',
          sub: 'Home, Office',
          onPress: () => showToast('Managing delivery addresses'),
        },
      ],
    },
    {
      title: 'Payments & Settings',
      items: [
        {
          icon: '💳',
          label: 'Payment Methods',
          sub: 'UPI, Cards',
          onPress: () => showToast('Managing payment options'),
        },
        {
          icon: '🔔',
          label: 'Notifications',
          sub: 'Order updates & offers',
          onPress: () => showToast('Notification settings'),
        },
        {
          icon: '❓',
          label: 'Help & FAQs',
          sub: 'Customer support',
          onPress: () => goTo('help'),
        },
        {
          icon: '💬',
          label: 'Pharmacy Live Chat',
          sub: '24/7 Hyderabad pharmacist',
          onPress: () => goTo('chat'),
        },
      ],
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: medColors.bg }]}>
      <HeaderBar title="My Account" onBack={goBack} onHelp={() => goTo('help')} />

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 36 + bottomInset, paddingTop: 10 }}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: medColors.card, borderColor: medColors.line, borderWidth: 1 }]}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{initials}</Text>
          </View>

          <View style={{ flex: 1 }}>
            {!isEditing ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <Text style={[styles.profileName, { color: medColors.ink }]} numberOfLines={1}>
                    {userName}
                  </Text>
                  <TouchableOpacity
                    style={[styles.profileEditBtn, { backgroundColor: medColors.surface2, borderColor: medColors.line }]}
                    onPress={() => {
                      setTempName(userName);
                      setTempPhone(userPhone);
                      setIsEditing(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.profileEditBtnText}>✏️ Edit</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.profilePhone, { color: medColors.inkSoft }]}>{userPhone}</Text>
                <View style={[styles.profileBadge, { backgroundColor: medColors.surface2, borderColor: medColors.line }]}>
                  <Text style={styles.profileBadgeText}>✓ VERIFIED PATIENT</Text>
                </View>
              </>
            ) : (
              <View style={{ gap: 6 }}>
                <TextInput
                  style={[styles.profileEditInput, { color: medColors.ink, backgroundColor: medColors.bg, borderColor: medColors.line }]}
                  value={tempName}
                  onChangeText={setTempName}
                  placeholder="Full name"
                  placeholderTextColor={medColors.inkSoft}
                />
                <TextInput
                  style={[styles.profileEditInput, { color: medColors.ink, backgroundColor: medColors.bg, borderColor: medColors.line }]}
                  value={tempPhone}
                  onChangeText={setTempPhone}
                  placeholder="Phone number"
                  placeholderTextColor={medColors.inkSoft}
                  keyboardType="phone-pad"
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <TouchableOpacity
                    style={styles.profileSaveBtn}
                    onPress={() => {
                      if (tempName.trim()) setUserName(tempName.trim());
                      if (tempPhone.trim()) setUserPhone(tempPhone.trim());
                      setIsEditing(false);
                      showToast('Profile updated');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.profileSaveBtnText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.profileCancelBtn}
                    onPress={() => setIsEditing(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.profileCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.accountStats}>
          <TouchableOpacity style={[styles.accountStatBox, { backgroundColor: medColors.card, borderColor: medColors.line }]} onPress={openOrders} activeOpacity={0.8}>
            <Text style={[styles.accountStatNum, { color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }]}>{orders.length}</Text>
            <Text style={[styles.accountStatLabel, { color: medColors.inkSoft }]}>Total Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.accountStatBox, { backgroundColor: medColors.card, borderColor: medColors.line }]} onPress={() => showToast('1 Active prescription')} activeOpacity={0.8}>
            <Text style={[styles.accountStatNum, { color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }]}>1</Text>
            <Text style={[styles.accountStatLabel, { color: medColors.inkSoft }]}>Prescriptions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.accountStatBox, { backgroundColor: medColors.card, borderColor: medColors.line }]} onPress={() => showToast('2 Saved addresses')} activeOpacity={0.8}>
            <Text style={[styles.accountStatNum, { color: medColors.isDark ? '#86EFAC' : COLORS.greenDark }]}>2</Text>
            <Text style={[styles.accountStatLabel, { color: medColors.inkSoft }]}>Addresses</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Groups */}
        {menuSections.map((sec, sIdx) => (
          <View key={sIdx} style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: medColors.inkSoft, marginBottom: 8, paddingHorizontal: 4 }}>
              {sec.title}
            </Text>
            <View style={[styles.accountMenuGroup, { backgroundColor: medColors.card, borderColor: medColors.line }]}>
              {sec.items.map((item, iIdx) => (
                <TouchableOpacity
                  key={iIdx}
                  style={[
                    styles.accountMenuItem,
                    { borderBottomColor: medColors.line },
                    iIdx === sec.items.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.accountMenuIcon}>{item.icon}</Text>
                  <Text style={[styles.accountMenuLabel, { color: medColors.ink }]}>{item.label}</Text>
                  {item.sub && <Text style={[styles.accountMenuSub, { color: medColors.inkSoft }]}>{item.sub}</Text>}
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M9 18l6-6-6-6"
                      stroke={medColors.inkSoft}
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Log Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => showToast('Logged out of OneBuddy')}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutBtnText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// =============================================================================
// 11. CHAT SCREEN
// =============================================================================

export function ChatScreen() {
  const { goBack, bottomInset, medColors } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'pharmacist',
      text: 'Hello! 👋 I am Dr. Srinivas, your certified OneBuddy Pharmacist at our Hyderabad hub.',
      time: 'Just now',
    },
    {
      id: 'm-2',
      sender: 'pharmacist',
      text: 'How can I assist you with your prescription, dosage instructions, or medicine delivery today?',
      time: 'Just now',
    },
  ]);

  const handleSend = (textToSend?: string) => {
    const txt = (textToSend || input).trim();
    if (!txt) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: txt,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setTimeout(() => {
      const lower = txt.toLowerCase();
      let reply =
        'Thank you for your message. Your query is noted and logged with our OneBuddy Hyderabad central dispensing hub. A pharmacist is reviewing your account.';

      if (lower.includes('prescription') || lower.includes('rx') || lower.includes('verify')) {
        reply =
          'Prescription Verification: Our licensed pharmacists verify all uploaded prescriptions within 10–15 minutes. Once checked, medicines are dispatched immediately from our nearest Hyderabad hub.';
      } else if (lower.includes('delivery') || lower.includes('fast') || lower.includes('arrive') || lower.includes('time') || lower.includes('track')) {
        reply =
          'Express Delivery: Standard express deliveries in Hyderabad (Madhapur, Gachibowli, Jubilee Hills, Banjara Hills, Kondapur) arrive in 60 to 120 minutes with temperature-controlled packaging.';
      } else if (lower.includes('dosage') || lower.includes('food') || lower.includes('how to take') || lower.includes('instruction')) {
        reply =
          'Dosage Guidelines: Most antibiotics and pain relievers (like Augmentin & Dolo) should be taken after meals to prevent gastric irritation. Antacids like Pantocid should be taken 30 minutes before breakfast.';
      } else if (lower.includes('generic') || lower.includes('substitute') || lower.includes('alternative') || lower.includes('brand')) {
        reply =
          'Generic Substitutes: All generic equivalents available on OneBuddy contain identical active pharmaceutical ingredients (APIs) approved by CDSCO and offer up to 40% cost savings.';
      } else if (lower.includes('speak') || lower.includes('call') || lower.includes('doctor') || lower.includes('pharmacist')) {
        reply =
          'Connecting Pharmacist: A OneBuddy senior clinical pharmacist will call your registered contact within 5 minutes for direct consultation. You can also reach our 24/7 hotline at 1800-419-BUDDY.';
      }

      const botMsg: ChatMessage = {
        id: `pharma-${Date.now()}`,
        sender: 'pharmacist',
        text: reply,
        time: 'Just now',
      };

      setMessages((prev) => [...prev, botMsg]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 600);
  };

  return (
    <View style={[chatStyles.screen, { backgroundColor: medColors.bg }]}>
      <HeaderBar
        title="Pharmacy Live Support"
        sub="Hyderabad Central Dispensing Hub"
        onBack={goBack}
      />

      {/* Pharmacist Agent Status Banner */}
      <View style={[chatStyles.pharmacistCard, { backgroundColor: medColors.surface, borderBottomColor: medColors.border }]}>
        <View style={chatStyles.pharmacistAvatar}>
          <Text style={chatStyles.pharmacistAvatarText}>Rx</Text>
          <View style={chatStyles.onlineDot} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[chatStyles.pharmacistName, { color: medColors.ink }]}>Dr. K. Srinivas, B.Pharm</Text>
            <View style={chatStyles.verifiedBadge}>
              <Text style={chatStyles.verifiedBadgeText}>VERIFIED</Text>
            </View>
          </View>
          <Text style={[chatStyles.pharmacistSub, { color: medColors.inkMuted }]}>Lic #TS-84920 • Reg. Clinical Pharmacist</Text>
          <Text style={chatStyles.pharmacistTiming}>🟢 Online • Hyderabad Desk (Avg reply &lt; 2 mins)</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={chatStyles.chatScroll}
          contentContainerStyle={[chatStyles.chatContent, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[chatStyles.securityNotice, { backgroundColor: medColors.surface2 }]}>
            <Text style={[chatStyles.securityNoticeText, { color: medColors.inkMuted }]}>
              🔒 End-to-end encrypted medical consultation complying with Indian Pharmacy Regulations (D&amp;C Act).
            </Text>
          </View>

          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <View
                key={m.id}
                style={[
                  chatStyles.msgRow,
                  isUser ? chatStyles.msgRowUser : chatStyles.msgRowPharmacist,
                ]}
              >
                {!isUser && (
                  <View style={chatStyles.botAvatarMini}>
                    <Text style={chatStyles.botAvatarMiniText}>Rx</Text>
                  </View>
                )}
                <View
                  style={[
                    chatStyles.bubble,
                    isUser ? chatStyles.bubbleUser : [chatStyles.bubblePharmacist, { backgroundColor: medColors.surface, borderColor: medColors.border }],
                  ]}
                >
                  <Text style={[chatStyles.bubbleText, isUser ? chatStyles.bubbleTextUser : [chatStyles.bubbleTextPharmacist, { color: medColors.ink }]]}>
                    {m.text}
                  </Text>
                  <Text style={[chatStyles.timeText, isUser ? chatStyles.timeTextUser : [chatStyles.timeTextPharmacist, { color: medColors.inkMuted }]]}>
                    {m.time}
                  </Text>
                </View>
              </View>
            );
          })}

          <View style={chatStyles.chipsSection}>
            <Text style={[chatStyles.chipsHeading, { color: medColors.inkMuted }]}>Frequently Asked Pharmacy Inquiries:</Text>
            <View style={chatStyles.chipsWrap}>
              {PHARMACY_QUICK_CHIPS.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[chatStyles.chipBtn, { backgroundColor: medColors.surface, borderColor: medColors.border }]}
                  onPress={() => handleSend(chip)}
                  activeOpacity={0.7}
                >
                  <Text style={[chatStyles.chipText, { color: medColors.ink }]}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={[chatStyles.inputBoxContainer, { backgroundColor: medColors.surface, borderTopColor: medColors.border, paddingBottom: Math.max(bottomInset, 12) }]}>
          <TextInput
            style={[chatStyles.textInput, { backgroundColor: medColors.surface2, borderColor: medColors.border, color: medColors.ink }]}
            value={input}
            onChangeText={setInput}
            placeholder="Type your medicine or prescription question..."
            placeholderTextColor={medColors.inkMuted}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[chatStyles.sendBtn, !input.trim() && chatStyles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim()}
            activeOpacity={0.8}
            accessibilityLabel="Send message"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const chatStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  pharmacistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  pharmacistAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#65A30D',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pharmacistAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pharmacistName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  pharmacistSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  pharmacistTiming: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
    marginTop: 2,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  securityNotice: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 14,
    alignSelf: 'center',
  },
  securityNoticeText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 15,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowPharmacist: {
    justifyContent: 'flex-start',
  },
  botAvatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFCCB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BEF264',
  },
  botAvatarMiniText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4D7C0F',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubblePharmacist: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bubbleUser: {
    backgroundColor: '#65A30D',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  bubbleTextPharmacist: {
    color: '#0F172A',
  },
  bubbleTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeTextPharmacist: {
    color: '#94A3B8',
  },
  timeTextUser: {
    color: '#ECFCCB',
  },
  chipsSection: {
    marginTop: 10,
    marginBottom: 16,
  },
  chipsHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  inputBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#65A30D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});

// =============================================================================
// 12. ROOT NAVIGATOR
// =============================================================================

export function RootNavigator() {
  const { screen } = useApp();

  switch (screen) {
    case 'category':
      return <CategoryScreen />;
    case 'groupcategory':
      return <GroupCategoryScreen />;
    case 'product':
      return <ProductScreen />;
    case 'cart':
      return <CartScreen />;
    case 'details':
      return <DetailsScreen />;
    case 'confirm':
      return <ConfirmScreen />;
    case 'help':
      return <HelpScreen />;
    case 'orders':
      return <OrdersScreen />;
    case 'account':
      return <AccountScreen />;
    case 'chat':
      return <ChatScreen />;
    default:
      return <BrowseScreen />;
  }
}

// =============================================================================
// 13. MAIN MEDICINE DELIVERY FLOW (MODAL ENTRY)
// =============================================================================

export interface MedicineDeliveryFlowProps {
  visible: boolean;
  onClose: () => void;
  onOrderPlaced?: (order: OrderHistoryItem) => void;
}

function MedicineDeliveryFlowInner() {
  const { isDark, medColors } = useApp();
  return (
    <SafeAreaView style={[medicineFlowStyles.safe, { backgroundColor: medColors.card }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={medColors.card} translucent={true} />
      <RootNavigator />
      <ToastOverlay />
    </SafeAreaView>
  );
}

export const MedicineDeliveryFlow: React.FC<MedicineDeliveryFlowProps> = ({
  visible,
  onClose,
  onOrderPlaced,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <AppProvider onClose={onClose} onOrderPlaced={onOrderPlaced}>
        <MedicineDeliveryFlowInner />
      </AppProvider>
    </Modal>
  );
};

const medicineFlowStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
});

export default MedicineDeliveryFlow;

