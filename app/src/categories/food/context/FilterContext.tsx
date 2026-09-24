import React, { createContext, useContext, useState, useMemo } from 'react';
import { FilterState, Restaurant } from '../types';
import { useFoodData } from './FoodDataContext';

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  filteredRestaurants: Restaurant[];
  isFilterSheetOpen: boolean;
  setIsFilterSheetOpen: (open: boolean) => void;
  activeFilterCount: number;
  searchFocusTrigger: number;
  triggerSearchFocus: () => void;
}

const defaultFilters: FilterState = {
  sortBy: 'popularity',
  dietary: 'all',
  costForTwo: 'all',
  maxDeliveryTime: 60,
  onlyCombos: false,
  rating4Plus: false,
  searchQuery: '',
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { restaurants } = useFoodData();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [searchFocusTrigger, setSearchFocusTrigger] = useState(0);

  const triggerSearchFocus = () => setSearchFocusTrigger(prev => prev + 1);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters((prev) => ({
      ...defaultFilters,
      searchQuery: prev.searchQuery,
    }));
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.sortBy !== 'popularity') count++;
    if (filters.dietary !== 'all') count++;
    if (filters.costForTwo !== 'all') count++;
    if (filters.maxDeliveryTime < 60) count++;
    if (filters.onlyCombos) count++;
    if (filters.rating4Plus) count++;
    return count;
  }, [filters]);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const normalizedQ = q.endsWith('s') ? q.slice(0, -1) : q;
        
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesTagline = r.tagline.toLowerCase().includes(q);
        const matchesCuisine = r.cuisine.some((c) => c.toLowerCase().includes(q) || c.toLowerCase().includes(normalizedQ));
        const matchesMenuItem = r.menu.some(
          (m) => m.name.toLowerCase().includes(q) || 
                 m.description.toLowerCase().includes(q) ||
                 m.category.toLowerCase().includes(q) ||
                 m.name.toLowerCase().includes(normalizedQ) ||
                 m.category.toLowerCase().includes(normalizedQ)
        );

        const matchesSpecial = 
          (q === 'pure veg' && r.dietaryType === 'pure-veg') ||
          (q === 'seafood' && r.id === 'blue-sea-restaurant') ||
          (q === 'pan-asian' && r.cuisine.some(c => c.toLowerCase().includes('chinese') || c.toLowerCase().includes('asian')));

        if (!matchesName && !matchesTagline && !matchesCuisine && !matchesMenuItem && !matchesSpecial) {
          return false;
        }
      }

      if (filters.dietary === 'pure-veg' && r.dietaryType !== 'pure-veg') {
        return false;
      }
      if (filters.dietary === 'non-veg' && r.dietaryType === 'pure-veg') {
        return false;
      }

      if (filters.costForTwo === 'under300' && r.costForTwo > 300) {
        return false;
      }
      if (filters.costForTwo === '300to600' && (r.costForTwo < 300 || r.costForTwo > 600)) {
        return false;
      }
      if (filters.costForTwo === 'above600' && r.costForTwo < 600) {
        return false;
      }

      if (r.deliveryMins > filters.maxDeliveryTime) {
        return false;
      }

      if (filters.rating4Plus && r.rating < 4.6) {
        return false;
      }

      if (filters.onlyCombos && !r.menu.some((m) => m.isCombo)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const aNameMatch = a.name.toLowerCase().includes(q) ? 1 : 0;
        const bNameMatch = b.name.toLowerCase().includes(q) ? 1 : 0;
        if (aNameMatch !== bNameMatch) {
          return bNameMatch - aNameMatch;
        }
      }

      switch (filters.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'deliveryTime':
          return a.deliveryMins - b.deliveryMins;
        case 'costLowToHigh':
          return a.costForTwo - b.costForTwo;
        case 'costHighToLow':
          return b.costForTwo - a.costForTwo;
        case 'popularity':
        default:
          return (b.promoted ? 1 : 0) - (a.promoted ? 1 : 0);
      }
    });
  }, [filters, restaurants]);

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        filteredRestaurants,
        isFilterSheetOpen,
        setIsFilterSheetOpen,
        activeFilterCount,
        searchFocusTrigger,
        triggerSearchFocus,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
