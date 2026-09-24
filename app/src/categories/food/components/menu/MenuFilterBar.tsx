import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SearchBar } from '../common/SearchBar';
import { Sparkles, ArrowUpDown } from 'lucide-react-native';

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
}) => {
  return (
    <View style={styles.container}>
      {/* Real-time search in menu */}
      <SearchBar
        value={searchQuery}
        onChangeText={onSearchChange}
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
          style={[styles.chip, selectedCategory === 'All' && styles.chipActive]}
        >
          <Text style={[styles.chipText, selectedCategory === 'All' && styles.chipTextActive]}>
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
                isSelected && styles.chipActive,
              ]}
            >
              {isCombo ? (
                <Sparkles size={12} color={isSelected ? '#111827' : '#65A30D'} />
              ) : null}
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextActive,
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
          style={[styles.chip, selectedDietary === 'veg' && styles.chipActive]}
        >
          <View style={styles.vegDotBox}>
            <View style={styles.vegDot} />
          </View>
          <Text style={[styles.chipText, selectedDietary === 'veg' && styles.chipTextActive]}>
            Veg
          </Text>
        </TouchableOpacity>

        {/* Non-Veg Toggle */}
        <TouchableOpacity
          onPress={() => onSelectDietary(selectedDietary === 'non-veg' ? 'all' : 'non-veg')}
          style={[styles.chip, selectedDietary === 'non-veg' && styles.chipActive]}
        >
          <View style={styles.nonVegDotBox}>
            <View style={styles.nonVegDot} />
          </View>
          <Text style={[styles.chipText, selectedDietary === 'non-veg' && styles.chipTextActive]}>
            Non-Veg
          </Text>
        </TouchableOpacity>

        {/* Price Sort */}
        <TouchableOpacity
          onPress={onTogglePriceSort}
          style={[styles.chip, priceSort !== 'none' && styles.chipActive]}
        >
          <ArrowUpDown size={12} color={priceSort !== 'none' ? '#111827' : '#6B7280'} />
          <Text style={[styles.chipText, priceSort !== 'none' && styles.chipTextActive]}>
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

