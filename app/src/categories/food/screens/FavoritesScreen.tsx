import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useFoodData } from '../context/FoodDataContext';
import { RestaurantCard } from '../components/home/RestaurantCard';
import { Heart } from 'lucide-react-native';

interface FavoritesScreenProps {
  onSelectRestaurant: (restaurantId: string) => void;
  onNavigateHome: () => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  onSelectRestaurant,
  onNavigateHome,
}) => {
  const { favorites } = useCart();
  const { restaurants } = useFoodData();
  const favoriteRestaurants = restaurants.filter((r) => favorites.includes(r.id));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headLeft}>
          <View style={styles.iconCircle}>
            <Heart size={18} color="#F43F5E" fill="#F43F5E" />
          </View>
          <View>
            <Text style={styles.title}>Favorite Restaurants</Text>
            <Text style={styles.subtitle}>Your bookmarked food spots</Text>
          </View>
        </View>

        <Text style={styles.countText}>{favoriteRestaurants.length} saved</Text>
      </View>

      {favoriteRestaurants.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>❤️</Text>
          <Text style={styles.emptyTitle}>No Favorites Saved</Text>
          <Text style={styles.emptyDesc}>
            Tap the heart icon on any restaurant card to save your favorite spots.
          </Text>
          <TouchableOpacity onPress={onNavigateHome} style={styles.exploreBtn}>
            <Text style={styles.exploreText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {favoriteRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onSelect={onSelectRestaurant}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  countText: {
    fontSize: 12,
    color: '#4D7C0F',
    fontWeight: 'bold',
  },
  emptyCard: {
    marginHorizontal: 16,
    marginVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  exploreBtn: {
    backgroundColor: '#65A30D',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  exploreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});

