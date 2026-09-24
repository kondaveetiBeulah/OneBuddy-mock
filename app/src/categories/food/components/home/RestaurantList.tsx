import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Restaurant } from '../../types';
import { RestaurantCard } from './RestaurantCard';
import { UtensilsCrossed, RotateCcw } from 'lucide-react-native';
import { useFilter } from '../../context/FilterContext';

interface RestaurantListProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (restaurantId: string) => void;
}

export const RestaurantList: React.FC<RestaurantListProps> = ({
  restaurants,
  onSelectRestaurant,
}) => {
  const { resetFilters } = useFilter();

  if (restaurants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <UtensilsCrossed size={28} color="#65A30D" />
        </View>
        <Text style={styles.emptyTitle}>No Restaurants Found</Text>
        <Text style={styles.emptySub}>
          We couldn't find any restaurant matching your selected filters or search keyword.
        </Text>
        <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
          <RotateCcw size={13} color="#111827" />
          <Text style={styles.resetBtnText}>Reset All Filters</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {restaurants.map((restaurant) => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          onSelect={onSelectRestaurant}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  emptyContainer: {
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 30,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(101, 163, 13, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#65A30D',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
});
