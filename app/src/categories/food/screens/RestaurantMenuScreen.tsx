import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFoodData } from '../context/FoodDataContext';
import { MenuHeader } from '../components/menu/MenuHeader';
import { MenuFilterBar } from '../components/menu/MenuFilterBar';
import { MenuItemCard } from '../components/menu/MenuItemCard';
import { ComboHighlight } from '../components/menu/ComboHighlight';
import { ItemDetailModal } from '../components/menu/ItemDetailModal';
import { VoiceSearchModal, cleanFoodVoiceQuery } from '../components/VoiceSearchModal';
import { ArrowLeft, Utensils } from 'lucide-react-native';
import { MenuItem } from '../types';
import { useNetwork } from '@/context/NetworkContext';
import { NetworkErrorState } from '@/components/NetworkErrorState';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
import { RestaurantMenuSkeleton } from '@/components/common/skeletons';

interface RestaurantMenuScreenProps {
  restaurantId: string;
  onBack: () => void;
  initialSearchQuery?: string;
}

export const RestaurantMenuScreen: React.FC<RestaurantMenuScreenProps> = ({
  restaurantId,
  onBack,
  initialSearchQuery,
}) => {
  const insets = useSafeAreaInsets();
  const { restaurants, isLoading, error, refresh } = useFoodData();
  const { isConnected } = useNetwork();
  const isDark = isCategoryDark();
  const restaurant = useMemo(() => {
    return restaurants.find((r) => r.id === restaurantId) || null;
  }, [restaurants, restaurantId]);

  const scrollViewRef = useRef<ScrollView>(null);

  const [menuSearchQuery, setMenuSearchQuery] = useState(initialSearchQuery || '');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDietary, setSelectedDietary] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [priceSort, setPriceSort] = useState<'none' | 'lowToHigh' | 'highToLow'>('none');
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (initialSearchQuery) {
      setMenuSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);



  const categories = useMemo(() => {
    if (!restaurant?.menu) return [];
    return Array.from(new Set(restaurant.menu.map((m) => m.category)));
  }, [restaurant]);

  const signatureCombo = useMemo(() => {
    if (!restaurant?.menu) return null;
    return restaurant.menu.find((m) => m.isCombo) || null;
  }, [restaurant]);

  const filteredMenuItems = useMemo(() => {
    if (!restaurant?.menu) return [];
    return restaurant.menu
      .filter((item) => {
        if (menuSearchQuery.trim()) {
          const q = menuSearchQuery.toLowerCase().trim();
          const matchesName = item.name.toLowerCase().includes(q);
          const matchesDesc = item.description.toLowerCase().includes(q);
          const matchesCombo = item.comboIncludes?.some((inc) => inc.toLowerCase().includes(q));
          if (!matchesName && !matchesDesc && !matchesCombo) {
            return false;
          }
        }

        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }

        if (selectedDietary === 'veg' && item.dietary !== 'veg') {
          return false;
        }
        if (selectedDietary === 'non-veg' && item.dietary === 'veg') {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (priceSort === 'lowToHigh') return a.price - b.price;
        if (priceSort === 'highToLow') return b.price - a.price;

        // If searching, show name matches above description matches
        if (menuSearchQuery.trim()) {
          const q = menuSearchQuery.toLowerCase().trim();
          const aNameMatch = a.name.toLowerCase().includes(q) ? 1 : 0;
          const bNameMatch = b.name.toLowerCase().includes(q) ? 1 : 0;
          if (aNameMatch !== bNameMatch) {
            return bNameMatch - aNameMatch;
          }
        }
        return 0;
      });
  }, [restaurant, menuSearchQuery, selectedCategory, selectedDietary, priceSort]);

  const handleTogglePriceSort = () => {
    setPriceSort((prev) => {
      if (prev === 'none') return 'lowToHigh';
      if (prev === 'lowToHigh') return 'highToLow';
      return 'none';
    });
  };

  if (!restaurant || isLoading) {
    if (isLoading) {
      return <RestaurantMenuSkeleton isDark={isDark} />;
    }
    if (!isConnected || error) {
      return (
        <View style={[styles.container, isDark && { backgroundColor: '#000000' }, { paddingTop: insets.top + 8 }]}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <TouchableOpacity
              onPress={onBack}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeft size={20} color={isDark ? '#FFFFFF' : '#1F2937'} />
            </TouchableOpacity>
          </View>
          <NetworkErrorState
            title="Menu Unavailable"
            message="Could not load the restaurant menu due to a connection issue. Please check your internet."
            onRetry={refresh}
          />
        </View>
      );
    }
    return (
      <View style={[styles.container, isDark && { backgroundColor: '#000000' }, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={[{ fontSize: 16, color: '#6B7280', marginBottom: 12 }, isDark && { color: '#FFFFFF' }]}>Restaurant not found</Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollViewRef} style={[styles.container, isDark && { backgroundColor: '#000000' }]} showsVerticalScrollIndicator={false}>
      {/* 1. Header with Sticky Back Button & Hero Details */}
      <MenuHeader restaurant={restaurant} onBack={onBack} />

      {/* 2. Signature Combo Highlight Card */}
      {signatureCombo && (selectedCategory === 'All' || selectedCategory === 'Combos') && !menuSearchQuery ? (
        <ComboHighlight comboItem={signatureCombo} restaurant={restaurant} />
      ) : null}

      {/* 3. Real-time Search & Filter Bar */}
      <MenuFilterBar
        searchQuery={menuSearchQuery}
        onSearchChange={setMenuSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedDietary={selectedDietary}
        onSelectDietary={setSelectedDietary}
        priceSort={priceSort}
        onTogglePriceSort={handleTogglePriceSort}
        categories={categories}
        onVoicePress={() => setIsVoiceModalOpen(true)}
      />

      {/* 4. Section Title */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.titleWithIcon}>
          <View style={styles.utensilIcon}>
            <Utensils size={13} color="#C084FC" />
          </View>
          <Text style={[styles.sectionTitle, isDark && { color: '#FFFFFF' }]}>
            {selectedCategory === 'All' ? 'Full Gourmet Menu' : selectedCategory} ({filteredMenuItems.length})
          </Text>
        </View>

        {menuSearchQuery ? (
          <Text style={[styles.filteredLabel, isDark && { color: '#A3E635' }]}>Filtered by "{menuSearchQuery}"</Text>
        ) : null}
      </View>

      {/* 5. Menu Items List */}
      <View style={[styles.itemsList, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}>
        {filteredMenuItems.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            restaurant={restaurant}
            searchHighlight={menuSearchQuery}
            onItemClick={(selected) => setSelectedItemForDetail(selected)}
          />
        ))}
      </View>

      {/* Item Detail / Customization Modal */}
      <ItemDetailModal
        isOpen={Boolean(selectedItemForDetail)}
        onClose={() => setSelectedItemForDetail(null)}
        item={selectedItemForDetail}
        restaurant={restaurant}
      />

      <VoiceSearchModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onResult={(spoken) => {
          setIsVoiceModalOpen(false);
          setMenuSearchQuery(cleanFoodVoiceQuery(spoken));
        }}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  utensilIcon: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 108, 201, 0.15)',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  filteredLabel: {
    fontSize: 11,
    color: '#4D7C0F',
  },
  itemsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});

