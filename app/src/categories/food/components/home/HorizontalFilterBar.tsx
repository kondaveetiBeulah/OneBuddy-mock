import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { SlidersHorizontal, Star, Zap, IndianRupee, Sparkles, RotateCcw, Utensils, X } from 'lucide-react-native';
import { useFilter } from '../../context/FilterContext';

const CUISINES = ['Biryani', 'Pizzas', 'Chinese', 'North Indian', 'South Indian', 'Italian', 'Seafood', 'Thai', 'Kebabs', 'Pan-Asian'];

export const HorizontalFilterBar: React.FC = () => {
  const { filters, updateFilter, resetFilters, setIsFilterSheetOpen, activeFilterCount } = useFilter();
  const [showCuisineModal, setShowCuisineModal] = useState(false);

  const isCuisineActive = CUISINES.some(c => c.toLowerCase() === filters.searchQuery.toLowerCase());

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Main Filter Button */}
        <TouchableOpacity
          onPress={() => setIsFilterSheetOpen(true)}
          style={[styles.chip, styles.mainFilterChip, activeFilterCount > 0 && styles.activeChip]}
        >
          <SlidersHorizontal size={13} color="#65A30D" />
          <Text style={[styles.chipText, { color: '#4D7C0F', fontWeight: 'bold' }]}>
            Filters
          </Text>
          {activeFilterCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Cuisine Button */}
        <TouchableOpacity
          onPress={() => setShowCuisineModal(true)}
          style={[styles.chip, isCuisineActive && styles.cuisineActive]}
        >
          <Utensils size={13} color={isCuisineActive ? '#C084FC' : '#6B7280'} />
          <Text style={[styles.chipText, isCuisineActive && { color: '#6B21A8' }]}>
            Cuisines
          </Text>
        </TouchableOpacity>

        {/* Pure Veg */}
        <TouchableOpacity
          onPress={() => updateFilter('dietary', filters.dietary === 'pure-veg' ? 'all' : 'pure-veg')}
          style={[styles.chip, filters.dietary === 'pure-veg' && styles.vegActive]}
        >
          <View style={styles.vegDotBox}>
            <View style={styles.vegDot} />
          </View>
          <Text style={[styles.chipText, filters.dietary === 'pure-veg' && { color: '#6EE7B7' }]}>
            Pure Veg
          </Text>
        </TouchableOpacity>

        {/* Non-Veg */}
        <TouchableOpacity
          onPress={() => updateFilter('dietary', filters.dietary === 'non-veg' ? 'all' : 'non-veg')}
          style={[styles.chip, filters.dietary === 'non-veg' && styles.nonVegActive]}
        >
          <View style={styles.nonVegDotBox}>
            <View style={styles.nonVegDot} />
          </View>
          <Text style={[styles.chipText, filters.dietary === 'non-veg' && { color: '#FCA5A5' }]}>
            Non-Veg
          </Text>
        </TouchableOpacity>

        {/* Rating 4.5+ */}
        <TouchableOpacity
          onPress={() => updateFilter('rating4Plus', !filters.rating4Plus)}
          style={[styles.chip, filters.rating4Plus && styles.ratingActive]}
        >
          <Star size={13} color="#65A30D" fill={filters.rating4Plus ? '#65A30D' : 'transparent'} />
          <Text style={[styles.chipText, filters.rating4Plus && { color: '#4D7C0F' }]}>
            Ratings 4.5+
          </Text>
        </TouchableOpacity>

        {/* Fast Delivery (<25 min) */}
        <TouchableOpacity
          onPress={() => updateFilter('maxDeliveryTime', filters.maxDeliveryTime === 25 ? 60 : 25)}
          style={[styles.chip, filters.maxDeliveryTime <= 25 && styles.fastActive]}
        >
          <Zap size={13} color="#38BDF8" />
          <Text style={[styles.chipText, filters.maxDeliveryTime <= 25 && { color: '#7DD3FC' }]}>
            Fast (&lt;25 min)
          </Text>
        </TouchableOpacity>

        {/* Combos Only */}
        <TouchableOpacity
          onPress={() => updateFilter('onlyCombos', !filters.onlyCombos)}
          style={[styles.chip, filters.onlyCombos && styles.comboActive]}
        >
          <Sparkles size={13} color="#C084FC" />
          <Text style={[styles.chipText, filters.onlyCombos && { color: '#6B21A8' }]}>
            Combos & Feasts
          </Text>
        </TouchableOpacity>

        {/* Under ₹300 */}
        <TouchableOpacity
          onPress={() => updateFilter('costForTwo', filters.costForTwo === 'under300' ? 'all' : 'under300')}
          style={[styles.chip, filters.costForTwo === 'under300' && styles.costActive]}
        >
          <IndianRupee size={12} color="#34D399" />
          <Text style={[styles.chipText, filters.costForTwo === 'under300' && { color: '#6EE7B7' }]}>
            Under ₹300
          </Text>
        </TouchableOpacity>

        {/* Reset */}
        {activeFilterCount > 0 && (
          <TouchableOpacity onPress={resetFilters} style={[styles.chip, styles.resetChip]}>
            <RotateCcw size={12} color="#FDA4AF" />
            <Text style={[styles.chipText, { color: '#FDA4AF' }]}>Reset</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Cuisine Modal */}
      <Modal visible={showCuisineModal} transparent animationType="fade" onRequestClose={() => setShowCuisineModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowCuisineModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Cuisine</Text>
                  <TouchableOpacity onPress={() => setShowCuisineModal(false)}>
                    <X size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.cuisineList}>
                  {CUISINES.map((cuisine) => {
                    const isActive = filters.searchQuery.toLowerCase() === cuisine.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={cuisine}
                        style={[styles.cuisineItem, isActive && styles.cuisineItemActive]}
                        onPress={() => {
                          updateFilter('searchQuery', isActive ? '' : cuisine);
                          setShowCuisineModal(false);
                        }}
                      >
                        <Text style={[styles.cuisineItemText, isActive && styles.cuisineItemTextActive]}>
                          {cuisine}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
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
    gap: 6,
  },
  mainFilterChip: {
    backgroundColor: 'rgba(101, 163, 13, 0.1)',
    borderColor: '#65A30D',
  },
  activeChip: {
    backgroundColor: 'rgba(201, 162, 39, 0.25)',
  },
  countBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#65A30D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: '#111827',
    fontSize: 9,
    fontWeight: 'bold',
  },
  chipText: {
    fontSize: 12,
    color: '#6B7280',
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
  ratingActive: {
    backgroundColor: 'rgba(120, 53, 15, 0.7)',
    borderColor: '#F59E0B',
  },
  fastActive: {
    backgroundColor: 'rgba(12, 74, 110, 0.7)',
    borderColor: '#0284C7',
  },
  comboActive: {
    backgroundColor: 'rgba(88, 28, 135, 0.7)',
    borderColor: '#9333EA',
  },
  costActive: {
    backgroundColor: 'rgba(6, 78, 59, 0.7)',
    borderColor: '#059669',
  },
  resetChip: {
    backgroundColor: 'rgba(159, 18, 57, 0.2)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  cuisineActive: {
    backgroundColor: 'rgba(88, 28, 135, 0.7)',
    borderColor: '#9333EA',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cuisineList: {
    gap: 8,
  },
  cuisineItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  cuisineItemActive: {
    backgroundColor: 'rgba(139, 108, 201, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 108, 201, 0.45)',
  },
  cuisineItemText: {
    color: '#6B7280',
    fontSize: 14,
  },
  cuisineItemTextActive: {
    color: '#6B21A8',
    fontWeight: 'bold',
  },
});

