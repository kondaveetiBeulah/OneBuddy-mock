import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  InteractionManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  ChevronDown,
  Bell,
  ArrowRight,
  ArrowLeft,
  Search,
  CheckCircle,
  Clock,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useHomeExit } from '../context/HomeExitContext';
import { useBooking } from '../context/BookingContext';
import { SERVICE_CATEGORIES, OFFER_BANNERS, SUB_SERVICES, isBookingSlotPast } from '../data/mockData';
import { ServiceCategory, SubService, OfferBanner } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { BannerCarousel } from '../components/home/BannerCarousel';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { LocationModal } from '../components/home/LocationModal';
import { AddAddressAlert } from '../components/home/AddAddressAlert';
import { AppLogo } from '../components/common/AppLogo';
import { Badge } from '../components/common/Badge';
import { useHomeTheme, COLORS, RADII, SPACING, SHADOWS } from '../theme';
import { db } from '../../../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useHomeTheme();
  const { onClose } = useHomeExit();
  const {
    currentAddress,
    setLiveGpsLocation,
    setSelectedCategory,
    activeBooking,
    toggleSubService,
    feedbackList,
    isAddressAlertDismissed,
    dismissAddressAlert,
  } = useBooking();

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic Home Services Catalog state (with fallback to default)
  const [categories, setCategories] = useState<ServiceCategory[]>(SERVICE_CATEGORIES);
  const [banners, setBanners] = useState<OfferBanner[]>(OFFER_BANNERS);
  const [subServices, setSubServices] = useState<SubService[]>(SUB_SERVICES);

  // Fetch live home services data from Firestore after initial screen interactions
  React.useEffect(() => {
    let isMounted = true;
    async function loadFirestoreHomeData() {
      try {
        if (!db) return;
        const [catSnap, banSnap, subSnap] = await Promise.all([
          getDocs(query(collection(db, 'catalogHomeCategories'), where('active', '==', true))),
          getDocs(query(collection(db, 'catalogHomeBanners'), where('active', '==', true))),
          getDocs(query(collection(db, 'catalogHomeServices'), where('active', '==', true))),
        ]);

        if (isMounted) {
          if (!catSnap.empty) {
            const list = catSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceCategory));
            setCategories(list);
          }
          if (!banSnap.empty) {
            const list = banSnap.docs.map((d) => ({ id: d.id, ...d.data() } as OfferBanner));
            setBanners(list);
          }
          if (!subSnap.empty) {
            const list = subSnap.docs.map((d) => ({ id: d.id, ...d.data() } as SubService));
            setSubServices(list);
          }
        }
      } catch {
        // Fallback silently to defaults
      }
    }

    const task = InteractionManager.runAfterInteractions(() => {
      loadFirestoreHomeData();
    });

    return () => {
      isMounted = false;
      task.cancel();
    };
  }, []);

  // Initial open alert: appears every time the Home Services category is focused.
  // useFocusEffect ensures it re-shows even when React Navigation keeps the screen mounted.
  const [isAddressAlertOpen, setIsAddressAlertOpen] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsAddressAlertOpen(true);
    }, [])
  );


  // Filter services and subservices based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const queryStr = searchQuery.toLowerCase();
    return subServices.filter(
      (sub) =>
        sub.title.toLowerCase().includes(queryStr) ||
        sub.description.toLowerCase().includes(queryStr) ||
        sub.features.some((f) => f.toLowerCase().includes(queryStr))
    );
  }, [searchQuery, subServices]);

  const handleSelectCategory = (category: ServiceCategory) => {
    setSelectedCategory(category);
    navigation.navigate('SubServices', { categoryId: category.id, categoryTitle: category.title });
  };

  const handleSelectBanner = (banner: OfferBanner) => {
    if (banner.categoryId) {
      const cat = categories.find((c) => c.id === banner.categoryId);
      if (cat) {
        setSelectedCategory(cat);
        navigation.navigate('SubServices', { categoryId: cat.id, categoryTitle: cat.title });
      }
    }
  };

  const handleSelectSubServiceFromSearch = (sub: SubService) => {
    const parentCat = categories.find((c) => c.id === sub.categoryId);
    if (parentCat) {
      setSelectedCategory(parentCat);
      toggleSubService(sub);
      setSearchQuery('');
      navigation.navigate('SubServices', { categoryId: parentCat.id, categoryTitle: parentCat.title });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* 1. Top Brand Header: Logo at top left + "OneBuddy Home Services" text */}
      <View style={[styles.brandHeader, { backgroundColor: colors.surface }]}>
        <View style={styles.brandLeft}>
          {!!onClose && (
            <TouchableOpacity
              style={[styles.exitBtn, { backgroundColor: colors.surfaceSubtle }]}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityLabel="Back to OneBuddy"
            >
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <AppLogo size={36} style={{ marginRight: SPACING.sm }} />
          <View>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>OneBuddy</Text>
            <Text style={[styles.brandSubtitle, { color: colors.primary }]}>Home Services</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.bellButton, { backgroundColor: colors.surfaceSubtle }]}
          activeOpacity={0.7}
          onPress={() => {}}
        >
          <Bell size={20} color={colors.textPrimary} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* 2. Location Bar below Brand Header */}
      <View style={styles.locationBarContainer}>
        <TouchableOpacity
          style={styles.locationButton}
          activeOpacity={0.75}
          onPress={() => setIsLocationModalOpen(true)}
        >
          <View style={styles.pinCircle}>
            <MapPin size={16} color={COLORS.primary} />
          </View>
          <View style={styles.locationTextWrapper}>
            <View style={styles.locationLabelRow}>
              <Text style={styles.locationLabel}>
                {currentAddress?.label || 'Select Location'}
              </Text>
              <ChevronDown size={13} color={COLORS.textPrimary} style={{ marginLeft: 3 }} />
            </View>
            <Text style={styles.locationStreet} numberOfLines={1}>
              {currentAddress?.houseNo ? `${currentAddress.houseNo}, ${currentAddress.street}` : currentAddress?.street || 'Tap to choose address'}
            </Text>
          </View>
          <View style={styles.changePill}>
            <Text style={styles.changePillText}>Change</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 3. Search Bar below Location */}
      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 110 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Active Ongoing Booking Bar (Jump to Live Tracking) */}
        {activeBooking &&
          !isBookingSlotPast(activeBooking) &&
          !activeBooking.hasReviewed &&
          !feedbackList.some((f) => f.bookingId === activeBooking.bookingId) && (
          <TouchableOpacity
            style={styles.activeBookingBanner}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('LiveTracking')}
          >
            <View style={styles.activeBookingLeft}>
              <View style={styles.pulseLiveDot} />
              <View>
                <Text style={styles.activeBookingTitle}>
                  Service Ongoing ({activeBooking.category.title})
                </Text>
                <Text style={styles.activeBookingSubtitle}>
                  Stage: {activeBooking.stage} • Tap to view live map
                </Text>
              </View>
            </View>
            <View style={styles.trackPill}>
              <Text style={styles.trackPillText}>Track</Text>
              <ArrowRight size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* Live Search Results Dropdown (if searching) */}
        {searchQuery.trim().length > 0 && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsHeader}>
              Found {searchResults.length} service options for "{searchQuery}":
            </Text>
            {searchResults.length === 0 ? (
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>No matching services found.</Text>
                <Text style={styles.emptySearchSub}>Try searching for "AC", "Kitchen", "Leak", "Tank"</Text>
              </View>
            ) : (
              searchResults.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectSubServiceFromSearch(sub)}
                  activeOpacity={0.7}
                >
                  <View style={styles.searchItemLeft}>
                    <Text style={styles.searchItemTitle}>{sub.title}</Text>
                    <Text style={styles.searchItemDesc} numberOfLines={1}>
                      {sub.description}
                    </Text>
                  </View>
                  <View style={styles.searchItemRight}>
                    <Text style={styles.searchItemPrice}>₹{sub.price}</Text>
                    <ChevronDown size={14} color={COLORS.primary} style={{ transform: [{ rotate: '-90deg' }] }} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Offer Banners Carousel */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Exclusive Deals & Offers</Text>
            <Text style={styles.sectionSubtitle}>Save big on top-rated home care packages</Text>
          </View>
          <Badge label="Limited" variant="warning" size="sm" />
        </View>
        <BannerCarousel
          banners={banners}
          onBannerPress={handleSelectBanner}
        />

        {/* 4 Service Categories Section */}
        <View style={[styles.sectionHeaderRow, { marginTop: SPACING.md }]}>
          <View>
            <Text style={styles.sectionTitle}>Explore All Services</Text>
            <Text style={styles.sectionSubtitle}>Select a category to view specialized options</Text>
          </View>
        </View>
        <CategoryGrid
          categories={categories}
          onSelectCategory={handleSelectCategory}
        />
      </ScrollView>

      {/* Initial Add Address Alert Dialog (Alert format with Add Address and Skip options) */}
      <AddAddressAlert
        visible={isAddressAlertOpen}
        onAddAddress={() => {
          setIsAddressAlertOpen(false);
          dismissAddressAlert();
          navigation.navigate('Address');
        }}
        onSkip={() => {
          setIsAddressAlertOpen(false);
          dismissAddressAlert();
        }}
      />

      {/* Manual Location Selector Modal (Only opened when user taps the header location bar) */}
      <LocationModal
        visible={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7EC400',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: -1,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  locationBarContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pinCircle: {
    width: 28,
    height: 28,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  locationTextWrapper: {
    flex: 1,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  locationStreet: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  changePill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    marginLeft: SPACING.xs,
  },
  changePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  scrollContent: {
    paddingTop: SPACING.xs,
  },
  activeBookingBanner: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.md,
  },
  activeBookingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  pulseLiveDot: {
    width: 10,
    height: 10,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.success,
    marginRight: SPACING.sm,
  },
  activeBookingTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  activeBookingSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  trackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.pill,
  },
  trackPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  searchResultsContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  searchResultsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  emptySearch: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySearchSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  searchItemLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  searchItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  searchItemDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchItemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  initialPromptBody: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  initialPromptIconCircle: {
    width: 60,
    height: 60,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  initialPromptTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  initialPromptDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
    paddingHorizontal: SPACING.sm,
  },
});
