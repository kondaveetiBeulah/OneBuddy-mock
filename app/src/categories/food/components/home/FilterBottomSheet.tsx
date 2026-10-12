import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useFilter } from '../../context/FilterContext';
import { FilterState } from '../../types';
import {
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Leaf,
  IndianRupee,
  Clock,
  Sparkles,
  Check,
  RotateCcw,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

export const FilterBottomSheet: React.FC = () => {
  const isDark = isCategoryDark();
  const {
    filters,
    setFilters,
    isFilterSheetOpen,
    setIsFilterSheetOpen,
    filteredRestaurants,
    resetFilters,
  } = useFilter();

  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [activeTab, setActiveTab] = useState<'sort' | 'dietary' | 'cost' | 'delivery' | 'specials'>('sort');

  useEffect(() => {
    if (isFilterSheetOpen) {
      setLocalFilters(filters);
    }
  }, [isFilterSheetOpen, filters]);

  if (!isFilterSheetOpen) return null;

  const handleApply = () => {
    setFilters(localFilters);
    setIsFilterSheetOpen(false);
  };

  const handleClear = () => {
    resetFilters();
    setIsFilterSheetOpen(false);
  };

  const sortOptions = [
    { value: 'popularity', label: 'Popularity & Promoted' },
    { value: 'rating', label: 'Rating: High to Low' },
    { value: 'deliveryTime', label: 'Fast Delivery Time' },
    { value: 'costLowToHigh', label: 'Cost: Low to High' },
    { value: 'costHighToLow', label: 'Cost: High to Low' },
  ];

  const dietaryOptions = [
    { value: 'all', label: 'All Items (Veg & Non-Veg)' },
    { value: 'pure-veg', label: 'Pure Veg Only', badge: 'veg' },
    { value: 'non-veg', label: 'Non-Veg Specialties', badge: 'non-veg' },
  ];

  const costOptions = [
    { value: 'all', label: 'Any Budget' },
    { value: 'under300', label: 'Budget Friendly (Under ₹300)' },
    { value: '300to600', label: 'Mid-Range (₹300 - ₹600)' },
    { value: 'above600', label: 'Premium Dining (Above ₹600)' },
  ];

  const deliveryOptions = [
    { value: 25, label: 'Super Fast (Within 25 mins)' },
    { value: 35, label: 'Standard (Within 35 mins)' },
    { value: 60, label: 'Any Delivery Time' },
  ];

  return (
    <Modal
      visible={isFilterSheetOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setIsFilterSheetOpen(false)}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheetContainer, isDark && { backgroundColor: '#000000', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
          {/* Header */}
          <View style={[styles.header, isDark && { borderBottomColor: 'rgba(255, 255, 255, 0.15)' }]}>
            <View style={styles.headLeft}>
              <View style={styles.iconCircle}>
                <SlidersHorizontal size={16} color="#65A30D" />
              </View>
              <Text style={[styles.headTitle, isDark && { color: '#FFFFFF' }]}>Filter & Sort</Text>
            </View>
            <TouchableOpacity onPress={() => setIsFilterSheetOpen(false)}>
              <X size={18} color={isDark ? '#FFFFFF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          {/* Two-Column Area */}
          <View style={styles.bodyRow}>
            {/* Left Category Tabs */}
            <View style={[styles.leftCol, isDark && { backgroundColor: '#000000', borderRightColor: 'rgba(255, 255, 255, 0.15)' }]}>
              <TouchableOpacity
                onPress={() => setActiveTab('sort')}
                style={[styles.tabBtn, activeTab === 'sort' && styles.tabBtnActive]}
              >
                <ArrowUpDown size={14} color={activeTab === 'sort' ? '#ECFCCB' : (isDark ? '#E5E7EB' : '#6B7280')} />
                <Text style={[styles.tabText, isDark && { color: '#E5E7EB' }, activeTab === 'sort' && styles.tabTextActive]}>Sort</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('dietary')}
                style={[styles.tabBtn, activeTab === 'dietary' && styles.tabBtnActive]}
              >
                <Leaf size={14} color={activeTab === 'dietary' ? '#6EE7B7' : (isDark ? '#E5E7EB' : '#6B7280')} />
                <Text style={[styles.tabText, isDark && { color: '#E5E7EB' }, activeTab === 'dietary' && styles.tabTextActive]}>Dietary</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('cost')}
                style={[styles.tabBtn, activeTab === 'cost' && styles.tabBtnActive]}
              >
                <IndianRupee size={14} color={activeTab === 'cost' ? '#7DD3FC' : (isDark ? '#E5E7EB' : '#6B7280')} />
                <Text style={[styles.tabText, isDark && { color: '#E5E7EB' }, activeTab === 'cost' && styles.tabTextActive]}>Cost</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('delivery')}
                style={[styles.tabBtn, activeTab === 'delivery' && styles.tabBtnActive]}
              >
                <Clock size={14} color={activeTab === 'delivery' ? '#E9D5FF' : (isDark ? '#E5E7EB' : '#6B7280')} />
                <Text style={[styles.tabText, isDark && { color: '#E5E7EB' }, activeTab === 'delivery' && styles.tabTextActive]}>Time</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('specials')}
                style={[styles.tabBtn, activeTab === 'specials' && styles.tabBtnActive]}
              >
                <Sparkles size={14} color={activeTab === 'specials' ? '#FDBA74' : (isDark ? '#E5E7EB' : '#6B7280')} />
                <Text style={[styles.tabText, isDark && { color: '#E5E7EB' }, activeTab === 'specials' && styles.tabTextActive]}>Deals</Text>
              </TouchableOpacity>
            </View>

            {/* Right Options List */}
            <ScrollView style={[styles.rightCol, isDark && { backgroundColor: '#000000' }]} contentContainerStyle={styles.rightColContent}>
              {activeTab === 'sort' && (
                <View style={styles.optList}>
                  {sortOptions.map((opt) => {
                    const isSelected = localFilters.sortBy === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setLocalFilters((prev) => ({ ...prev, sortBy: opt.value as any }))}
                        style={[
                          styles.optItem,
                          isDark && { backgroundColor: isSelected ? '#FFFFFF' : '#000000', borderColor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)' },
                          !isDark && isSelected && styles.optItemActive,
                        ]}
                      >
                        <Text style={[
                          styles.optText,
                          isDark && { color: isSelected ? '#000000' : '#FFFFFF', fontWeight: isSelected ? 'bold' : 'normal' },
                          !isDark && isSelected && styles.optTextActive,
                        ]}>
                          {opt.label}
                        </Text>
                        {isSelected && (
                          <View style={[styles.checkCircle, isDark && { backgroundColor: '#000000' }]}>
                            <Check size={12} color={isDark ? '#FFFFFF' : '#111827'} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {activeTab === 'dietary' && (
                <View style={styles.optList}>
                  {dietaryOptions.map((opt) => {
                    const isSelected = localFilters.dietary === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setLocalFilters((prev) => ({ ...prev, dietary: opt.value as any }))}
                        style={[
                          styles.optItem,
                          isDark && { backgroundColor: isSelected ? '#FFFFFF' : '#000000', borderColor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)' },
                          !isDark && isSelected && styles.optItemActive,
                        ]}
                      >
                        <Text style={[
                          styles.optText,
                          isDark && { color: isSelected ? '#000000' : '#FFFFFF', fontWeight: isSelected ? 'bold' : 'normal' },
                          !isDark && isSelected && styles.optTextActive,
                        ]}>
                          {opt.label}
                        </Text>
                        {isSelected && (
                          <View style={[styles.checkCircle, isDark && { backgroundColor: '#000000' }]}>
                            <Check size={12} color={isDark ? '#FFFFFF' : '#111827'} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {activeTab === 'cost' && (
                <View style={styles.optList}>
                  {costOptions.map((opt) => {
                    const isSelected = localFilters.costForTwo === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setLocalFilters((prev) => ({ ...prev, costForTwo: opt.value as any }))}
                        style={[
                          styles.optItem,
                          isDark && { backgroundColor: isSelected ? '#FFFFFF' : '#000000', borderColor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)' },
                          !isDark && isSelected && styles.optItemActive,
                        ]}
                      >
                        <Text style={[
                          styles.optText,
                          isDark && { color: isSelected ? '#000000' : '#FFFFFF', fontWeight: isSelected ? 'bold' : 'normal' },
                          !isDark && isSelected && styles.optTextActive,
                        ]}>
                          {opt.label}
                        </Text>
                        {isSelected && (
                          <View style={[styles.checkCircle, isDark && { backgroundColor: '#000000' }]}>
                            <Check size={12} color={isDark ? '#FFFFFF' : '#111827'} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {activeTab === 'delivery' && (
                <View style={styles.optList}>
                  {deliveryOptions.map((opt) => {
                    const isSelected = localFilters.maxDeliveryTime === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setLocalFilters((prev) => ({ ...prev, maxDeliveryTime: opt.value }))}
                        style={[
                          styles.optItem,
                          isDark && { backgroundColor: isSelected ? '#FFFFFF' : '#000000', borderColor: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)' },
                          !isDark && isSelected && styles.optItemActive,
                        ]}
                      >
                        <Text style={[
                          styles.optText,
                          isDark && { color: isSelected ? '#000000' : '#FFFFFF', fontWeight: isSelected ? 'bold' : 'normal' },
                          !isDark && isSelected && styles.optTextActive,
                        ]}>
                          {opt.label}
                        </Text>
                        {isSelected && (
                          <View style={[styles.checkCircle, isDark && { backgroundColor: '#000000' }]}>
                            <Check size={12} color={isDark ? '#FFFFFF' : '#111827'} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {activeTab === 'specials' && (
                <View style={styles.optList}>
                  <TouchableOpacity
                    onPress={() => setLocalFilters((prev) => ({ ...prev, onlyCombos: !prev.onlyCombos }))}
                    style={[
                      styles.optItem,
                      isDark && { backgroundColor: localFilters.onlyCombos ? '#FFFFFF' : '#000000', borderColor: localFilters.onlyCombos ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)' },
                      !isDark && localFilters.onlyCombos && styles.optItemActive,
                    ]}
                  >
                    <Text style={[
                      styles.optText,
                      isDark && { color: localFilters.onlyCombos ? '#000000' : '#FFFFFF', fontWeight: localFilters.onlyCombos ? 'bold' : 'normal' },
                      !isDark && localFilters.onlyCombos && styles.optTextActive,
                    ]}>
                      Mega Combos Only
                    </Text>
                    {localFilters.onlyCombos && (
                      <View style={[styles.checkCircle, isDark && { backgroundColor: '#000000' }]}>
                        <Check size={12} color={isDark ? '#FFFFFF' : '#111827'} />
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setLocalFilters((prev) => ({ ...prev, rating4Plus: !prev.rating4Plus }))}
                    style={[
                      styles.optItem,
                      isDark && { backgroundColor: localFilters.rating4Plus ? '#FFFFFF' : '#000000', borderColor: localFilters.rating4Plus ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)' },
                      !isDark && localFilters.rating4Plus && styles.optItemActive,
                    ]}
                  >
                    <Text style={[
                      styles.optText,
                      isDark && { color: localFilters.rating4Plus ? '#000000' : '#FFFFFF', fontWeight: localFilters.rating4Plus ? 'bold' : 'normal' },
                      !isDark && localFilters.rating4Plus && styles.optTextActive,
                    ]}>
                      Top Rated 4.5+ Stars
                    </Text>
                    {localFilters.rating4Plus && (
                      <View style={[styles.checkCircle, isDark && { backgroundColor: '#000000' }]}>
                        <Check size={12} color={isDark ? '#FFFFFF' : '#111827'} />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Footer with Apply & Clear */}
          <View style={[styles.footer, isDark && { backgroundColor: '#000000', borderTopColor: 'rgba(255, 255, 255, 0.15)' }]}>
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <RotateCcw size={14} color={isDark ? '#E5E7EB' : '#6B7280'} />
              <Text style={[styles.clearText, isDark && { color: '#E5E7EB' }]}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              style={[
                styles.applyBtn,
                isDark ? { backgroundColor: '#FFFFFF' } : { backgroundColor: '#F43F5E' },
              ]}
            >
              <View style={styles.applyGradient}>
                <Text style={[styles.applyText, isDark ? { color: '#000000' } : { color: '#FFFFFF' }]}>
                  Apply ({filteredRestaurants.length} Results)
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(139, 108, 201, 0.3)',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(201, 162, 39, 0.2)',
  },
  headTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  bodyRow: {
    flexDirection: 'row',
    minHeight: 250,
  },
  leftCol: {
    width: '35%',
    backgroundColor: '#110D1A',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.05)',
    padding: 8,
    gap: 6,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(201, 162, 39, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.4)',
  },
  tabText: {
    fontSize: 11,
    color: '#6B7280',
  },
  tabTextActive: {
    fontWeight: 'bold',
    color: '#4D7C0F',
  },
  rightCol: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  rightColContent: {
    padding: 14,
  },
  optList: {
    gap: 8,
  },
  optItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 14,
    padding: 12,
  },
  optItemActive: {
    backgroundColor: 'rgba(101, 163, 13, 0.1)',
    borderColor: '#65A30D',
  },
  optText: {
    fontSize: 12,
    color: '#111827',
  },
  optTextActive: {
    color: '#4D7C0F',
    fontWeight: 'bold',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#65A30D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#110D1A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  clearText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  applyGradient: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

