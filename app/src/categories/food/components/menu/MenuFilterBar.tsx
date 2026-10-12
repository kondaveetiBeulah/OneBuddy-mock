import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SearchBar } from '../common/SearchBar';
import { Sparkles, ArrowUpDown } from 'lucide-react-native';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

interface MenuFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedDietary: 'all' | 'veg' | 'non-veg';
  onSelectDietary: (d: 'all' | 'veg' | 'non-veg') => void;
  priceSort: 'none' | 'lowToHigh' | 'highToLow';
  onTogglePriceSort: () => void;
  categories: string[];
  onVoicePress?: () => void;
}

export const MenuFilterBar: React.FC<MenuFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedDietary,
  onSelectDietary,
  priceSort,
  onTogglePriceSort,
  categories,
  onVoicePress,
}) => {
  const isDark = isCategoryDark();

  return (
    <View style={styles.container}>
      {/* Real-time search in menu */}
      <SearchBar
        value={searchQuery}
        onChangeText={onSearchChange}
        onVoicePress={onVoicePress}
        placeholder="Search dishes, combos, or desserts in menu..."
      />

      {/* Categories & Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
      >
        {/* All Items */}
        <TouchableOpacity
          onPress={() => onSelectCategory('All')}
          style={[
            styles.chip,
            isDark && { backgroundColor: '#000000', borderColor: 'rgba(255, 255, 255, 0.2)' },
            selectedCategory === 'All' && (isDark ? { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' } : styles.chipActive),
          ]}
        >
          <Text
            style={[
              styles.chipText,
              isDark && { color: '#FFFFFF' },
              selectedCategory === 'All' && (isDark ? { color: '#000000', fontWeight: 'bold' } : styles.chipTextActive),
            ]}
          >
            All Items
          </Text>
        </TouchableOpacity>

        {/* Dynamic Categories */}
        {categories.map((cat) => {
          const isCombo = cat === 'Combos';
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => onSelectCategory(cat)}
              style={[
                styles.chip,
                isDark && { backgroundColor: '#000000', borderColor: 'rgba(255, 255, 255, 0.2)' },
                isSelected && (isDark ? { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' } : styles.chipActive),
              ]}
            >
              {isCombo ? (
                <Sparkles size={12} color={isSelected ? (isDark ? '#000000' : '#111827') : (isDark ? '#FFFFFF' : '#65A30D')} />
              ) : null}
              <Text
                style={[
                  styles.chipText,
                  isDark && { color: '#FFFFFF' },
                  isSelected && (isDark ? { color: '#000000', fontWeight: 'bold' } : styles.chipTextActive),
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Veg Toggle */}
        <TouchableOpacity
          onPress={() => onSelectDietary(selectedDietary === 'veg' ? 'all' : 'veg')}
          style={[
            styles.chip,
            isDark && { backgroundColor: '#000000', borderColor: 'rgba(255, 255, 255, 0.2)' },
            selectedDietary === 'veg' && (isDark ? { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' } : styles.chipActive),
          ]}
        >
          <View style={styles.vegDotBox}>
            <View style={styles.vegDot} />
          </View>
          <Text
            style={[
              styles.chipText,
              isDark && { color: '#FFFFFF' },
              selectedDietary === 'veg' && (isDark ? { color: '#000000', fontWeight: 'bold' } : styles.chipTextActive),
            ]}
          >
            Veg
          </Text>
        </TouchableOpacity>

        {/* Non-Veg Toggle */}
        <TouchableOpacity
          onPress={() => onSelectDietary(selectedDietary === 'non-veg' ? 'all' : 'non-veg')}
          style={[
            styles.chip,
            isDark && { backgroundColor: '#000000', borderColor: 'rgba(255, 255, 255, 0.2)' },
            selectedDietary === 'non-veg' && (isDark ? { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' } : styles.chipActive),
          ]}
        >
          <View style={styles.nonVegDotBox}>
            <View style={styles.nonVegDot} />
          </View>
          <Text
            style={[
              styles.chipText,
              isDark && { color: '#FFFFFF' },
              selectedDietary === 'non-veg' && (isDark ? { color: '#000000', fontWeight: 'bold' } : styles.chipTextActive),
            ]}
          >
            Non-Veg
          </Text>
        </TouchableOpacity>

        {/* Price Sort */}
        <TouchableOpacity
          onPress={onTogglePriceSort}
          style={[
            styles.chip,
            isDark && { backgroundColor: '#000000', borderColor: 'rgba(255, 255, 255, 0.2)' },
            priceSort !== 'none' && (isDark ? { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' } : styles.chipActive),
          ]}
        >
          <ArrowUpDown size={12} color={priceSort !== 'none' ? (isDark ? '#000000' : '#111827') : (isDark ? '#FFFFFF' : '#6B7280')} />
          <Text
            style={[
              styles.chipText,
              isDark && { color: '#FFFFFF' },
              priceSort !== 'none' && (isDark ? { color: '#000000', fontWeight: 'bold' } : styles.chipTextActive),
            ]}
          >
            {priceSort === 'lowToHigh' ? 'Price: Low' : priceSort === 'highToLow' ? 'Price: High' : 'Price'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  chipScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
  },
  chipActive: {
    backgroundColor: '#65A30D',
    borderColor: '#4D7C0F',
  },
  chipText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#111827',
    fontWeight: 'bold',
  },
  vegDotBox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#34D399',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  vegActive: {
    backgroundColor: 'rgba(6, 78, 59, 0.7)',
    borderColor: '#10B981',
  },
  nonVegDotBox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nonVegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F87171',
  },
  nonVegActive: {
    backgroundColor: 'rgba(127, 29, 29, 0.7)',
    borderColor: '#EF4444',
  },
  priceActive: {
    backgroundColor: 'rgba(12, 74, 110, 0.7)',
    borderColor: '#0284C7',
  },
});

