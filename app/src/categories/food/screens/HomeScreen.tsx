import React, { useRef, useEffect, useState } from 'react';
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
import { useFoodData } from '../context/FoodDataContext';
import { VoiceSearchModal, parseFoodVoiceQuery } from '../components/VoiceSearchModal';
import { Sparkles, Award, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

import { HorizontalPillsSkeleton } from '@/components/common/skeletons';

interface HomeScreenProps {
  onSelectRestaurant: (restaurantId: string, initialSearchQuery?: string) => void;
  onNavigate: (screen: 'home' | 'restaurant-menu' | 'orders' | 'favorites') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectRestaurant }) => {
  const isDark = isCategoryDark();
  const { filters, updateFilter, filteredRestaurants } = useFilter();
  const { restaurants } = useFoodData();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  useEffect(() => {
    if (filters.searchQuery.trim() && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [filters.searchQuery]);

  const handleVoiceResult = (spokenText: string) => {
    setIsVoiceModalOpen(false);
    const parsed = parseFoodVoiceQuery(spokenText, restaurants);

    if (parsed.isSpecificItemInRestaurant && parsed.matchedRestaurant) {
      // 1. Specific item in specific restaurant (e.g. "Biryani from Paradise")
      onSelectRestaurant(parsed.matchedRestaurant.id, parsed.matchedItemQuery);
    } else if (parsed.matchedRestaurant && !parsed.matchedItemQuery) {
      // 2. Restaurant only (e.g. "Paradise", "Bawarchi", "Blue Sea")
      onSelectRestaurant(parsed.matchedRestaurant.id);
    } else {
      // 3. Food item / cuisine (e.g. "Biryani", "Pizza", "Burgers")
      const query = parsed.matchedItemQuery || parsed.cleanedText;
      updateFilter('searchQuery', query);
    }
  };

  const dynamicCuisines = React.useMemo(() => {
    if (!restaurants || restaurants.length === 0) return [];
    const cuisineSet = new Set<string>();
    restaurants.forEach((r) => {
      if (Array.isArray(r.cuisine)) {
        r.cuisine.forEach((c) => {
          if (c && c.trim()) cuisineSet.add(c.trim());
        });
      }
    });
    const list = Array.from(cuisineSet);
    return list.length > 0 ? ['All', ...list] : ['All'];
  }, [restaurants]);

  return (
    <ScrollView ref={scrollViewRef} style={[styles.container, isDark && { backgroundColor: '#000000' }]} showsVerticalScrollIndicator={false}>
      {/* 1. Top Discount Carousel (Auto-slides every 3s, click navigates to menu) */}
      <DiscountCarousel onSelectRestaurant={onSelectRestaurant} />

      {/* 2. Search Bar */}
      <View style={styles.searchSection}>
        <SearchBar
          value={filters.searchQuery}
          onChangeText={(q) => updateFilter('searchQuery', q)}
          onVoicePress={() => setIsVoiceModalOpen(true)}
        />

        {/* Popular Quick Pills: animated grey shimmer skeletons when unavailable, genuine cuisines when loaded */}
        {dynamicCuisines.length === 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cuisinePillsScroll}
          >
            <HorizontalPillsSkeleton isDark={isDark} count={4} />
          </ScrollView>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cuisinePillsScroll}
          >
            {dynamicCuisines.map((cuisineName) => {
              const isSelected = cuisineName === 'All' 
                ? filters.searchQuery === '' 
                : filters.searchQuery.toLowerCase() === cuisineName.toLowerCase();
                
              return (
                <TouchableOpacity
                  key={cuisineName}
                  onPress={() => {
                    if (cuisineName === 'All') {
                      updateFilter('searchQuery', '');
                    } else {
                      updateFilter('searchQuery', isSelected ? '' : cuisineName);
                    }
                  }}
                  style={[
                    styles.cuisineChip,
                    isDark && { backgroundColor: '#000000', borderColor: 'rgba(255, 255, 255, 0.15)' },
                    isSelected && (isDark ? { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' } : styles.cuisineChipActive),
                  ]}
                >
                  <Text
                    style={[
                      styles.cuisineChipText,
                      isDark && { color: '#FFFFFF' },
                      isSelected && { color: isDark ? '#000000' : '#111827', fontWeight: 'bold' },
                    ]}
                  >
                    {cuisineName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* 3. Section Title & Horizontal Filters */}
      <View style={styles.sectionHeadRow}>
        <View style={styles.titleWithIcon}>
          <View style={styles.sparkleIcon}>
            <Sparkles size={12} color="#65A30D" />
          </View>
          <Text style={[styles.sectionTitle, isDark && { color: '#FFFFFF' }]}>Curated Partner Restaurants</Text>
        </View>

        {restaurants.length > 0 && (
          <Text style={[styles.restaurantCountText, isDark && { color: '#A3E635' }]}>
            {filteredRestaurants.length} spots
          </Text>
        )}
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
          colors={isDark ? ['#000000', '#000000'] : ['#FFFFFF', '#F9FAFB', '#F3F4F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.trustBanner, isDark && { borderColor: 'rgba(255, 255, 255, 0.15)' }]}
        >
          <View style={styles.trustLeft}>
            <View style={styles.awardCircle}>
              <Award size={22} color="#65A30D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.trustTitle, isDark && { color: '#FFFFFF' }]}>OneBuddy Freshness Guarantee</Text>
              <Text style={[styles.trustSub, isDark && { color: '#E5E7EB' }]}>
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

      {/* Voice Search Modal */}
      <VoiceSearchModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onResult={handleVoiceResult}
        restaurants={restaurants}
      />
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

