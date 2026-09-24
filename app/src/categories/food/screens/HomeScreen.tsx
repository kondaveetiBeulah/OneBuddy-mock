import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { DiscountCarousel } from '../components/home/DiscountCarousel';
import { HorizontalFilterBar } from '../components/home/HorizontalFilterBar';
import { FilterBottomSheet } from '../components/home/FilterBottomSheet';
import { RestaurantList } from '../components/home/RestaurantList';
import { SearchBar } from '../components/common/SearchBar';
import { useFilter } from '../context/FilterContext';
import { Sparkles, Award, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

interface HomeScreenProps {
  onSelectRestaurant: (restaurantId: string) => void;
  onNavigate: (screen: 'home' | 'restaurant-menu' | 'orders' | 'favorites') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectRestaurant }) => {
  const { filters, updateFilter, filteredRestaurants } = useFilter();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (filters.searchQuery.trim() && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [filters.searchQuery]);

  const cuisineHighlights = [
    { name: 'All', image: 'https://cdn-icons-png.flaticon.com/512/3565/3565401.png' },
    { name: 'Biryani', image: 'https://png.pngtree.com/png-clipart/20250607/original/pngtree-spicy-chicken-biryani-flavorful-rice-png-image_21135573.png' },
    { name: 'Pure Veg', image: 'https://cdn-icons-png.flaticon.com/512/2808/2808284.png' },
    { name: 'Pizzas', image: 'https://cdn-icons-png.flaticon.com/512/3595/3595458.png' },
    { name: 'Seafood', image: 'https://cdn-icons-png.flaticon.com/512/6254/6254256.png' },
    { name: 'Kebabs', image: 'https://cdn-icons-png.flaticon.com/512/3143/3143643.png' },
    { name: 'Pan-Asian', image: 'https://cdn-icons-png.flaticon.com/512/3448/3448011.png' },
    { name: 'Burgers', image: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png' },
    { name: 'Desserts', image: 'https://cdn-icons-png.flaticon.com/512/4241/4241664.png' },
  ];

  return (
    <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Top Discount Carousel (Auto-slides every 3s, click navigates to menu) */}
      <DiscountCarousel onSelectRestaurant={onSelectRestaurant} />

      {/* 2. Search Bar */}
      <View style={styles.searchSection}>
        <SearchBar
          value={filters.searchQuery}
          onChangeText={(q) => updateFilter('searchQuery', q)}
          placeholder="Search restaurants, dishes or cuisines..."
        />

        {/* Popular Quick Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cuisinePillsScroll}
        >
          {cuisineHighlights.map((item) => {
            const isSelected = item.name === 'All' 
              ? filters.searchQuery === '' 
              : filters.searchQuery.toLowerCase() === item.name.toLowerCase();
              
            return (
              <TouchableOpacity
                key={item.name}
                onPress={() => {
                  if (item.name === 'All') {
                    updateFilter('searchQuery', '');
                  } else {
                    updateFilter('searchQuery', isSelected ? '' : item.name);
                  }
                }}
                style={[styles.cuisineChip, isSelected && styles.cuisineChipActive]}
              >
                <Text
                  style={[
                    styles.cuisineChipText,
                    isSelected && { color: '#111827', fontWeight: 'bold' },
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Section Title & Horizontal Filters */}
      <View style={styles.sectionHeadRow}>
        <View style={styles.titleWithIcon}>
          <View style={styles.sparkleIcon}>
            <Sparkles size={12} color="#65A30D" />
          </View>
          <Text style={styles.sectionTitle}>Curated Partner Restaurants</Text>
        </View>

        <Text style={styles.restaurantCountText}>
          {filteredRestaurants.length} spots
        </Text>
      </View>

      {/* Horizontal Swipe Filter Chips */}
      <HorizontalFilterBar />

      {/* 4. Restaurant Cards List (Dual-Shade Gradient Cards) */}
      <RestaurantList
        restaurants={filteredRestaurants}
        onSelectRestaurant={onSelectRestaurant}
      />

      {/* 5. Quality & Trust Banner */}
      <View style={styles.trustBannerWrap}>
        <LinearGradient
          colors={isCategoryDark() ? ['#1D1E22', '#24262B', '#121214'] : ['#FFFFFF', '#F9FAFB', '#F3F4F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.trustBanner}
        >
          <View style={styles.trustLeft}>
            <View style={styles.awardCircle}>
              <Award size={22} color="#65A30D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trustTitle}>OneBuddy Freshness Guarantee</Text>
              <Text style={styles.trustSub}>
                Prepared fresh in hygienic kitchens and delivered under 25 mins.
              </Text>
            </View>
          </View>

          <View style={styles.fssaiPill}>
            <ShieldCheck size={13} color="#34D399" />
            <Text style={styles.fssaiText}>FSSAI Verified</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Bottom Filter Sheet Modal */}
      <FilterBottomSheet />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  searchSection: {
    paddingHorizontal: 16,
    gap: 8,
    marginVertical: 4,
  },
  cuisinePillsScroll: {
    gap: 6,
    alignItems: 'center',
    paddingVertical: 2,
  },
  popularLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cuisineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  cuisineChipActive: {
    backgroundColor: '#65A30D',
    borderColor: '#4D7C0F',
  },
  cuisineChipText: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
  },
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sparkleIcon: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(101, 163, 13, 0.1)',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  restaurantCountText: {
    fontSize: 11,
    color: '#4D7C0F',
    fontWeight: '600',
  },
  trustBannerWrap: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  trustBanner: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 108, 201, 0.25)',
    padding: 16,
    gap: 12,
  },
  trustLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  awardCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(101, 163, 13, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
  },
  trustSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  fssaiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(6, 78, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  fssaiText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6EE7B7',
  },
});

