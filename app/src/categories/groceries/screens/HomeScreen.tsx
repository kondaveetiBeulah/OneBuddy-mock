import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Platform,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, useGroceryColors } from '../theme/colors';
import { typography, spacing } from '../theme';
import { SearchBar } from '../components/SearchBar';
import { OfferCarousel } from '../components/OfferCarousel';
import { CategoryCard } from '../components/CategoryCard';
import { ProductCard } from '../components/ProductCard';
import { LoadingState } from '../components/LoadingState';
import { GroceryDeliveryLogo } from '../components/GroceryDeliveryLogo';
import { productService } from '../services/productService';
import { Product } from '../types/product.types';
import { Category } from '../types/category.types';
import { Offer } from '../types/offer.types';
import { useUser } from '../context/UserContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useGroceriesExit } from '../context/GroceriesExitContext';
import { storageHelper, STORAGE_KEYS, fetchLiveAddressDetails } from '../utils/helpers';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';


interface SavedAddressItem {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  houseNo: string;
  building?: string;
  landmark?: string;
  formattedAddress: string;
  receiverName?: string;
  receiverPhone?: string;
  isDefault?: boolean;
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
    isDefault: true,
  },
  {
    id: 'addr_default_2',
    label: 'Work',
    houseNo: '3rd Floor, Tech Park',
    building: 'Cyber Towers',
    landmark: 'Hitec City, Madhapur',
    formattedAddress: '3rd Floor, Tech Park, Cyber Towers, Hitec City, Madhapur',
    receiverName: 'Anjali',
    receiverPhone: '9876543210',
    isDefault: false,
  }
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const colors = useGroceryColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { onClose } = useGroceriesExit();
  const { selectedAddress, setSelectedAddress } = useUser();
  const { addToCart, getCartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const cartCount = getCartCount();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [freshPicks, setFreshPicks] = useState<Product[]>([]);

  // ── Address Section State (Exact features as CartScreen) ──
  const [isAddressExpanded, setIsAddressExpanded] = useState<boolean>(false);
  const [isAddOptionModalVisible, setIsAddOptionModalVisible] = useState<boolean>(false);
  const [isLocationPermissionModalVisible, setIsLocationPermissionModalVisible] = useState<boolean>(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState<boolean>(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>(DEFAULT_SAVED_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr_default_1');

  // Form Fields
  const [houseNo, setHouseNo] = useState<string>('');
  const [building, setBuilding] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [receiverName, setReceiverName] = useState<string>('');
  const [receiverPhone, setReceiverPhone] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadHomeData();
    loadStoredAddresses();
  }, []);

  const loadStoredAddresses = async () => {
    try {
      const stored = await storageHelper.getItem<SavedAddressItem[]>(STORAGE_KEYS.SAVED_ADDRESSES);
      if (stored !== null && Array.isArray(stored)) {
        setSavedAddresses(stored);
        if (stored.length > 0) {
          setSelectedAddressId(stored[0].id);
        } else {
          setSelectedAddressId('');
        }
      }
    } catch (e) {
      console.warn('Failed to load saved addresses', e);
    }
  };

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [cats, offs, prods] = await Promise.all([
        productService.getCategories(),
        productService.getOffers(),
        productService.getProducts(),
      ]);

      setCategories(cats);
      setOffers(offs);
      setPopularProducts(prods.filter((p) => p.isFeatured));
      setFreshPicks(prods.filter((p) => !p.isFeatured));
    } catch (e) {
      console.error('Failed to load home data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const currentActiveAddressItem = savedAddresses.find((a) => a.id === selectedAddressId);
  const activeAddressText = currentActiveAddressItem
    ? currentActiveAddressItem.formattedAddress
    : savedAddresses.length > 0
    ? savedAddresses[0].formattedAddress
    : 'Select or Add Delivery Address';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleSelectAddress = (addr: SavedAddressItem) => {
    setSelectedAddressId(addr.id);
    if (setSelectedAddress) {
      setSelectedAddress({
        id: addr.id,
        name: addr.receiverName || 'User',
        phone: addr.receiverPhone || '9876543210',
        houseNumber: addr.houseNo,
        street: addr.building || '',
        area: addr.landmark || 'Suryaraopeta',
        city: 'Kurnool',
        state: 'Andhra Pradesh',
        pincode: '518001',
        type: addr.label.toLowerCase() as any,
        isDefault: true,
      });
    }
    showToast(`✓ Switched to ${addr.label} address`);
  };

  // Triggered when "+ Add New Address" button is pressed -> opens Choice modal
  const handleAddNewAddressClick = () => {
    if (isAddFormOpen || editingAddressId !== null) {
      setIsAddFormOpen(false);
      setEditingAddressId(null);
      resetForm();
    } else {
      setIsAddOptionModalVisible(true);
    }
  };

  // Step 1: User selects Option 1 (Live Location) -> Open Permission Modal
  const handleRequestLiveLocation = () => {
    setIsAddOptionModalVisible(false);
    setIsLocationPermissionModalVisible(true);
  };

  // Step 2: User grants permission -> Fetch actual GPS location & reverse geocode
  const handleConfirmLocationAccess = async () => {
    setIsLocationPermissionModalVisible(false);
    showToast('📍 Detecting GPS location...');

    // Clear previous input values so it's not pre-filled with edited values
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
      showToast('📍 Live location detected & auto-filled!');
    } catch (e) {
      console.warn('Location detection error', e);
      setHouseNo('Current Location');
      setBuilding('Main Road');
      setLandmark('Kurnool, Andhra Pradesh');
      setLabel('Home');
      setIsAddFormOpen(true);
      setIsAddressExpanded(true);
      showToast('📍 Location detected & auto-filled!');
    }
  };

  // Option 2: Enter Address Manually
  const handleManualAddressEntry = () => {
    setIsAddOptionModalVisible(false);
    resetForm();
    setEditingAddressId(null);
    setIsAddFormOpen(true);
  };

  const handleStartEditAddress = (addr: SavedAddressItem) => {
    setEditingAddressId(addr.id);
    setIsAddFormOpen(true);
    setHouseNo(addr.houseNo);
    setBuilding(addr.building || '');
    setLandmark(addr.landmark || '');
    setLabel(addr.label);
    setReceiverName(addr.receiverName || '');
    setReceiverPhone(addr.receiverPhone || '');
  };

  const handleCancelEdit = () => {
    setEditingAddressId(null);
    setIsAddFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setHouseNo('');
    setBuilding('');
    setLandmark('');
    setLabel('Home');
    setReceiverName('');
    setReceiverPhone('');
  };

  const handleSaveAddress = async () => {
    const cleanHouse = houseNo.trim();
    const cleanName = receiverName.trim();
    const cleanPhone = receiverPhone.trim().replace(/\D/g, '');

    if (!cleanHouse) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('⚠️ Required Field: Please enter House No. / Flat No. / Street address.');
      } else {
        Alert.alert('Required Field', 'Please enter House No. / Flat No. / Street address.');
      }
      showToast('⚠️ Please enter House No. / Flat No.');
      return;
    }

    if (!cleanName) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('⚠️ Receiver Name Required: Please enter the receiver\'s name.');
      } else {
        Alert.alert('Receiver Name Required', 'Please enter the receiver\'s name.');
      }
      showToast('⚠️ Please enter receiver\'s name');
      return;
    }

    if (!cleanPhone) {
      const msg = '⚠️ Phone Number Required: Please enter receiver\'s 10-digit mobile number.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Phone Number Required', msg);
      }
      showToast('⚠️ Please enter receiver\'s phone number');
      return;
    }

    if (cleanPhone.length !== 10) {
      const msg = `⚠️ Invalid Phone Number: Mobile number must be exactly 10 digits (you entered ${cleanPhone.length} digits).`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Invalid Phone Number', msg);
      }
      showToast('⚠️ Phone must be exactly 10 digits');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      const msg = '⚠️ Invalid Mobile Number: Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Invalid Mobile Number', msg);
      }
      showToast('⚠️ Must start with 6, 7, 8, or 9');
      return;
    }

    const formatted = [
      cleanHouse,
      building.trim(),
      landmark.trim(),
      'Kurnool, Andhra Pradesh',
    ]
      .filter(Boolean)
      .join(', ');

    if (editingAddressId) {
      const updatedList = savedAddresses.map((a) =>
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
      );
      setSavedAddresses(updatedList);
      if (setSelectedAddress) {
        setSelectedAddress({
          id: editingAddressId,
          name: cleanName,
          phone: cleanPhone,
          houseNumber: cleanHouse,
          street: building.trim(),
          area: landmark.trim() || 'Suryaraopeta',
          city: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518001',
          type: label.toLowerCase() as any,
          isDefault: true,
        });
      }
      await storageHelper.setItem(STORAGE_KEYS.SAVED_ADDRESSES, updatedList);
      showToast('✓ Address updated successfully');
    } else {
      const newId = `addr_${Date.now()}`;
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
      const updatedList = [newAddr, ...savedAddresses];
      setSavedAddresses(updatedList);
      setSelectedAddressId(newId);
      if (setSelectedAddress) {
        setSelectedAddress({
          id: newId,
          name: cleanName,
          phone: cleanPhone,
          houseNumber: cleanHouse,
          street: building.trim(),
          area: landmark.trim() || 'Suryaraopeta',
          city: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518001',
          type: label.toLowerCase() as any,
          isDefault: true,
        });
      }
      await storageHelper.setItem(STORAGE_KEYS.SAVED_ADDRESSES, updatedList);
      showToast('✓ New address saved and selected');
    }

    handleCancelEdit();
  };

  const handleDeleteAddress = (addr: SavedAddressItem) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete ${addr.label} address?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = savedAddresses.filter((a) => a.id !== addr.id);
            setSavedAddresses(updated);
            if (selectedAddressId === addr.id) {
              if (updated.length > 0) {
                setSelectedAddressId(updated[0].id);
                if (setSelectedAddress) {
                  setSelectedAddress({
                    id: updated[0].id,
                    name: updated[0].receiverName || 'User',
                    phone: updated[0].receiverPhone || '9876543210',
                    houseNumber: updated[0].houseNo,
                    street: updated[0].building || '',
                    area: updated[0].landmark || 'Suryaraopeta',
                    city: 'Kurnool',
                    state: 'Andhra Pradesh',
                    pincode: '518001',
                    type: updated[0].label.toLowerCase() as any,
                    isDefault: true,
                  });
                }
              } else {
                setSelectedAddressId('');
                if (setSelectedAddress) {
                  setSelectedAddress(null as any);
                }
              }
            }
            await storageHelper.setItem(STORAGE_KEYS.SAVED_ADDRESSES, updated);
            showToast('Address deleted');
          },
        },
      ]
    );
  };

  const categoryRow1 = categories.filter((_, idx) => idx % 2 === 0);
  const categoryRow2 = categories.filter((_, idx) => idx % 2 === 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* ── 1. Top Header (Branding & Upper-Right Cart) ── */}
      <View style={[styles.topHeader, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.brandRow}>
          {!!onClose && (
            <TouchableOpacity
              style={styles.exitBtn}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityLabel="Back to OneBuddy"
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary as string} />
            </TouchableOpacity>
          )}
          <View style={[styles.brandLogoBadge, { backgroundColor: '#FFFFFF' }]}>
            <GroceryDeliveryLogo size={36} />
          </View>
          <View style={styles.brandTextColumn}>
            <View style={styles.brandTitleRow}>
              <Text style={[styles.brandNamePrefix, { color: colors.textPrimary }]}>One</Text>
              <Text style={styles.brandNameSuffix}>Buddy</Text>
            </View>
            <Text style={styles.brandSub}>Grocery</Text>
          </View>
        </View>

        <View style={styles.headerRightRow}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.background, borderColor: colors.borderLight }]}
            onPress={() => navigation.navigate('Wishlist')}
            activeOpacity={0.8}
            accessibilityLabel="Wishlist"
          >
            <Ionicons
              name="heart-outline"
              size={26}
              color={colors.textPrimary as string}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cartBtn, { backgroundColor: colors.background, borderColor: colors.borderLight }]}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.8}
            accessibilityLabel="Cart"
          >
            <Ionicons name="cart-outline" size={28} color={colors.textPrimary as string} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading && categories.length === 0 && offers.length === 0 && popularProducts.length === 0 ? (
        <LoadingState
          message="Loading Fresh Groceries..."
          subtitle="Fetching daily offers, categories, and fresh products for you"
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary as string]} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── 2. Interactive Delivery Address Section (Matching CartScreen) ── */}
        <View style={[styles.addressWrapper, { backgroundColor: colors.background }]}>
          <View style={[styles.addressManagerCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight, shadowColor: colors.shadow }]}>

            <TouchableOpacity
              onPress={() => setIsAddressExpanded((prev) => !prev)}
              activeOpacity={0.85}
              style={[
                styles.addressSectionHeaderBtn,
                isAddressExpanded && styles.addressSectionHeaderBtnOpen,
              ]}
            >
            <View style={styles.addressHeaderPin}>
              <Ionicons name="location" size={18} color={colors.primary} />
            </View>
            <View style={styles.addressHeaderTextWrapper}>
              <View style={styles.addressHeaderTopRow}>
                <Text style={styles.addressSectionHeaderLabel}>DELIVERY ADDRESS</Text>
                <Text style={styles.addressTapToChangeHint}>
                  {isAddressExpanded ? '(Tap to close)' : '(Tap to change / add)'}
                </Text>
              </View>
              {!!activeAddressText && (
                <Text
                  style={[
                    styles.addressSectionActiveText,
                    activeAddressText === 'Select or Add Delivery Address' && styles.addressSectionActiveTextPlaceholder,
                  ]}
                  numberOfLines={isAddressExpanded ? 2 : 1}
                >
                  {activeAddressText}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.addressChevronWrapper,
                isAddressExpanded && styles.addressChevronWrapperExpanded,
              ]}
            >
              <Ionicons
                name={isAddressExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={isAddressExpanded ? colors.white : colors.primary}
              />
            </View>
          </TouchableOpacity>

          {/* Expanded Address Panel */}
          {isAddressExpanded && (
            <View style={styles.addressSplitLayout}>
              {/* Left Side: Address Form */}
              <View style={styles.addressFormColumn}>
                <TouchableOpacity
                  onPress={handleAddNewAddressClick}
                  activeOpacity={0.8}
                  style={[
                    styles.addNewAddressToggleBtn,
                    (isAddFormOpen || editingAddressId !== null) && styles.addNewAddressToggleBtnActive,
                  ]}
                >
                  <View
                    style={[
                      styles.addNewAddressPlusCircle,
                      (isAddFormOpen || editingAddressId !== null) && styles.addNewAddressPlusCircleActive,
                    ]}
                  >
                    <Ionicons
                      name={editingAddressId ? 'create-outline' : isAddFormOpen ? 'remove' : 'add'}
                      size={14}
                      color={(isAddFormOpen || editingAddressId !== null) ? colors.white : colors.primaryDark}
                    />
                  </View>
                  <Text
                    style={[
                      styles.addNewAddressToggleLabel,
                      (isAddFormOpen || editingAddressId !== null) && styles.addNewAddressToggleLabelActive,
                    ]}
                  >
                    {editingAddressId ? 'Editing Address' : isAddFormOpen ? 'Close Address Form' : 'Add New Address'}
                  </Text>
                </TouchableOpacity>

                {isAddFormOpen ? (
                  <View style={styles.addressInputsWrapper}>
                    <TextInput
                      style={styles.formInput}
                      placeholder="House No. & Floor *"
                      placeholderTextColor={colors.textMuted}
                      value={houseNo}
                      onChangeText={setHouseNo}
                    />
                    <TextInput
                      style={styles.formInput}
                      placeholder="Building & Block No. (Optional)"
                      placeholderTextColor={colors.textMuted}
                      value={building}
                      onChangeText={setBuilding}
                    />
                    <TextInput
                      style={styles.formInput}
                      placeholder="Landmark & Area Name (Optional)"
                      placeholderTextColor={colors.textMuted}
                      value={landmark}
                      onChangeText={setLandmark}
                    />

                    <Text style={styles.formSectionTitle}>Address Label</Text>
                    <View style={styles.labelRow}>
                      {(['Home', 'Work', 'Other'] as const).map((l) => (
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
                        placeholderTextColor={colors.textMuted}
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
                          placeholderTextColor={colors.textMuted}
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
                      Tap "+ Add New Address" above to choose Live GPS or enter address manually.
                    </Text>
                  </View>
                )}
              </View>

              {/* Right Side: Saved Addresses List */}
              <View style={styles.addressSavedColumn}>
                <Text style={styles.columnHeaderTitle}>Saved Addresses ({savedAddresses.length})</Text>
                <Text style={styles.columnHeaderSub}>Tap to select delivery destination:</Text>

                <View style={styles.savedAddressList}>
                  {savedAddresses.length === 0 ? (
                    <View style={styles.addFormPlaceholder}>
                      <Text style={styles.addFormPlaceholderText}>
                        No saved addresses found. Tap "+ Add New Address" above to set your delivery location.
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
                          <View
                            style={[
                              styles.savedAddressBadge,
                              isSelected && styles.savedAddressBadgeActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.savedAddressBadgeText,
                                isSelected && styles.savedAddressBadgeTextActive,
                              ]}
                            >
                              {addr.label}
                            </Text>
                          </View>

                          <View style={styles.savedAddressActionsRow}>
                            {isSelected && (
                              <View style={styles.activeTag}>
                                <Text style={styles.activeTagText}>✓ DELIVERING HERE</Text>
                              </View>
                            )}

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

                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation?.();
                                handleDeleteAddress(addr);
                              }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={styles.addressDeleteBtn}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash-outline" size={13} color={colors.danger} />
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
        </View>

        {/* ── 3. Search Bar & Free Delivery Banner ── */}
        <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
          <SearchBar
            editable={false}
            onPress={() => navigation.navigate('Search')}
            onVoicePress={() => navigation.navigate('Search', { initialVoiceSearch: true })}
          />
          <View style={styles.freeDeliveryPill}>
            <Ionicons name="flash" size={13} color={colors.primary} />
            <Text style={styles.freeDeliveryText}>
              <Text style={{ fontWeight: typography.weights.bold }}>FREE DELIVERY</Text> on all orders above <Text style={{ fontWeight: typography.weights.bold }}>₹100</Text>!
            </Text>
          </View>
        </View>

        {/* ── 4. Discount / Offer Banners ("Today's Offers") ── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.sectionTitle}>Today's Offers</Text>
              <View style={styles.fireBadge}>
                <Text style={styles.fireBadgeText}>SPECIAL</Text>
              </View>
            </View>
          </View>

          <OfferCarousel
            data={offers}
            onPress={(off) => {
              if (off.categoryId) {
                navigation.navigate('ProductList', {
                  categoryId: off.categoryId,
                  categoryName: off.title,
                });
              }
            }}
          />
        </View>

        {/* ── 5. Categories Section ("Shop by Category") ── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Explore' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTwoRowContainer}
          >
            <View style={styles.categoryColumn}>
              <View style={styles.categoryRow}>
                {categoryRow1.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    onPress={(c) =>
                      navigation.navigate('ProductList', {
                        categoryId: c.id,
                        categoryName: c.name,
                      })
                    }
                  />
                ))}
              </View>
              <View style={[styles.categoryRow, { marginTop: 4 }]}>
                {categoryRow2.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    onPress={(c) =>
                      navigation.navigate('ProductList', {
                        categoryId: c.id,
                        categoryName: c.name,
                      })
                    }
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* ── 6. Popular Products Section ── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Popular Products</Text>
            <Text style={styles.sectionSubBadge}>TOP PICKS</Text>
          </View>

          <View style={styles.productsGrid}>
            {popularProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="grid"
                onPress={(p) => navigation.navigate('ProductDetails', { productId: p.id })}
                onAddToCart={(p) => addToCart(p)}
              />
            ))}
          </View>
        </View>

        {/* ── 7. Fresh Picks Section ── */}
        {freshPicks.length > 0 && (
          <View style={[styles.sectionContainer, { marginBottom: spacing.xl }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Fresh Picks</Text>
            </View>

            <View style={styles.productsGrid}>
              {freshPicks.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="grid"
                  onPress={(p) => navigation.navigate('ProductDetails', { productId: p.id })}
                  onAddToCart={(p) => addToCart(p)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      )}

      {/* ── Address Choice Modal (Exact from Cart: Live Location vs Enter New Address) ── */}
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
                <Ionicons name="close" size={18} color={colors.textMuted} />
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
                <Ionicons name="navigate" size={22} color={colors.primary} />
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
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
            </TouchableOpacity>

            {/* Option 2: Enter New Address Manually */}
            <TouchableOpacity
              onPress={handleManualAddressEntry}
              activeOpacity={0.85}
              style={styles.addressChoiceOptionManual}
            >
              <View style={styles.addressChoiceIconBadgeManual}>
                <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressChoiceOptionTitleManual}>Enter New Address</Text>
                <Text style={styles.addressChoiceOptionSub}>
                  Type house number, street, area, and receiver details manually
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
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
          <View style={styles.addressChoiceModalCard}>
            <View style={styles.locationPermissionIconCircle}>
              <Ionicons name="location" size={26} color={colors.primary} />
            </View>
            <Text style={styles.locationPermissionTitle}>Allow Location Access?</Text>
            <Text style={styles.locationPermissionMessage}>
              OneBuddy needs your permission to access device GPS to automatically detect and fill your delivery address.
            </Text>

            <View style={styles.permissionBtnRow}>
              <TouchableOpacity
                onPress={() => setIsLocationPermissionModalVisible(false)}
                style={styles.permissionCancelBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.permissionCancelText}>Don't Allow</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmLocationAccess}
                style={styles.permissionAllowBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.permissionAllowText}>
                  Allow & Auto-Fill
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toastContainer: {
    position: 'absolute',
    top: 55,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primaryDark,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: spacing.borderRadius.md,
    zIndex: 999,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  },
  toastText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'android' ? 10 : 8,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exitBtn: {
    padding: 4,
    marginRight: 6,
    borderRadius: 20,
  },
  brandLogoBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  brandTextColumn: {
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandNamePrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandNameSuffix: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: -1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: 'relative',
  },
  wishlistBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 19,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  wishlistBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  cartBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  addressWrapper: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: 2,
  },
  addressManagerCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  addressSectionHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
  },
  addressSectionHeaderBtnOpen: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  addressHeaderPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
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
  addressSectionHeaderLabel: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '800',
    letterSpacing: 0.6,
    lineHeight: 14,
  },
  addressTapToChangeHint: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    lineHeight: 14,
  },
  addressSectionActiveText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 17,
  },
  addressSectionActiveTextPlaceholder: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '400',
    marginTop: 2,
  },
  addressChevronWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  addressChevronWrapperExpanded: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  addressSplitLayout: {
    flexDirection: SCREEN_WIDTH > 700 ? 'row' : 'column',
    gap: 12,
    paddingTop: 10,
  },
  addressFormColumn: {
    flex: 1,
  },
  addressSavedColumn: {
    flex: 1,
    borderLeftWidth: SCREEN_WIDTH > 700 ? 1 : 0,
    borderLeftColor: colors.borderLight,
    paddingLeft: SCREEN_WIDTH > 700 ? 12 : 0,
    borderTopWidth: SCREEN_WIDTH > 700 ? 0 : 1,
    borderTopColor: colors.borderLight,
    paddingTop: SCREEN_WIDTH > 700 ? 0 : 12,
  },
  addNewAddressToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
    marginBottom: 10,
  },
  addNewAddressToggleBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  addNewAddressPlusCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addNewAddressPlusCircleActive: {
    backgroundColor: colors.primaryDark,
  },
  addNewAddressPlusText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: 'bold',
  },
  addNewAddressPlusTextActive: {
    color: colors.white,
  },
  addNewAddressToggleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  addNewAddressToggleLabelActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  addressInputsWrapper: {
    marginTop: 4,
  },
  formInput: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    borderColor: colors.border,
    borderWidth: 1,
    marginBottom: 8,
  },
  formSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  labelBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  labelText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  labelTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  inputWrapper: {
    marginBottom: 8,
    position: 'relative',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 3,
    fontWeight: '500',
  },
  formInputLite: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    borderColor: colors.border,
    borderWidth: 1,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  phonePrefix: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 6,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: 6,
  },
  formInputLiteFlex: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: 8,
    fontSize: 13,
  },
  addressCancelEditBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  addressCancelEditBtnText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  addressSaveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressSaveBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  addFormPlaceholder: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFormPlaceholderText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  columnHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  columnHeaderSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 8,
  },
  savedAddressList: {
    gap: 8,
  },
  savedAddressCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  savedAddressCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '35',
  },
  savedAddressCardBeingEdited: {
    borderColor: colors.secondary,
    backgroundColor: colors.primaryLight + '20',
  },
  savedAddressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  savedAddressBadge: {
    backgroundColor: colors.background,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  savedAddressBadgeActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  savedAddressBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  savedAddressBadgeTextActive: {
    color: colors.primaryDark,
  },
  savedAddressActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeTag: {
    backgroundColor: colors.primary,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activeTagText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  addressEditBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  addressEditText: {
    fontSize: 10,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  addressDeleteBtn: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: '#FFEAEA',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedAddressText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  savedAddressReceiverRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  savedAddressReceiverText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  selectAddressAction: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  selectAddressActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.cardBackground,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  freeDeliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.borderRadius.sm,
    marginTop: 6,
    gap: 4,
  },
  freeDeliveryText: {
    fontSize: 11,
    color: colors.primaryDark,
  },
  sectionContainer: {
    marginTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg - 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  fireBadge: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.secondaryDark + '30',
  },
  fireBadgeText: {
    color: colors.secondaryDark,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  viewAllText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  sectionSubBadge: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  horizontalListPadding: {
    paddingHorizontal: spacing.md,
  },
  categoryTwoRowContainer: {
    paddingHorizontal: spacing.md,
  },
  categoryColumn: {
    flexDirection: 'column',
  },
  categoryRow: {
    flexDirection: 'row',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },

  // ── Address Choice Modal Styles (Exact as Cart) ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  addressChoiceModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  addressChoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  addressChoiceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  addressChoiceCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  addressChoiceSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 17,
  },
  addressChoiceOptionLive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.primaryMedium,
    marginBottom: 12,
  },
  addressChoiceIconBadgeLive: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.primaryMedium,
  },
  addressChoiceOptionTitleLive: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  livePill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  livePillText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  addressChoiceOptionManual: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  addressChoiceIconBadgeManual: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  addressChoiceOptionTitleManual: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addressChoiceOptionSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  locationPermissionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  locationPermissionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  locationPermissionMessage: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  permissionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  permissionCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  permissionAllowBtn: {
    flex: 1.2,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionAllowText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});

export default HomeScreen;
