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
import { Restaurant } from '../types';
import { RatingBadge, DietaryBadge } from '../components/common/Badge';
import {
  Heart,
  UtensilsCrossed,
  Clock,
  MapPin,
  Tag,
  ArrowRight,
  Store,
} from 'lucide-react-native';

interface FavoritesScreenProps {
  onSelectRestaurant: (restaurantId: string) => void;
  onNavigateHome: () => void;
}

interface FavoriteRestaurantCardProps {
  restaurant: Restaurant;
  onSelect: (restaurantId: string) => void;
  onToggleFavorite: (restaurantId: string) => void;
}

const FavoriteRestaurantCard: React.FC<FavoriteRestaurantCardProps> = ({
  restaurant,
  onSelect,
  onToggleFavorite,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onSelect(restaurant.id)}
      style={styles.card}
    >
      {/* Top Header Row with Icon and Heart */}
      <View style={styles.cardTopRow}>
        <View style={styles.iconAvatar}>
          <UtensilsCrossed size={20} color="#65A30D" />
        </View>

        <View style={styles.restaurantInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {restaurant.name}
            </Text>
            <DietaryBadge
              type={restaurant.dietaryType === 'pure-veg' ? 'veg' : 'non-veg'}
              size="sm"
            />
          </View>
          <Text style={styles.tagline} numberOfLines={1}>
            {restaurant.tagline}
          </Text>
        </View>

        <TouchableOpacity
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite(restaurant.id);
          }}
          style={styles.favIconBtn}
          accessibilityLabel="Remove from favorites"
        >
          <Heart size={18} color="#F43F5E" fill="#F43F5E" />
        </TouchableOpacity>
      </View>

      {/* Offer Banner if available */}
      {restaurant.offerText ? (
        <View style={styles.offerBadge}>
          <Tag size={11} color="#65A30D" />
          <Text style={styles.offerText} numberOfLines={1}>
            {restaurant.offerText}
          </Text>
        </View>
      ) : null}

      {/* Cuisine Pills & Rating */}
      <View style={styles.cuisineAndRatingRow}>
        <View style={styles.cuisineList}>
          {restaurant.cuisine.slice(0, 3).map((c, i) => (
            <View key={i} style={styles.cuisinePill}>
              <Text style={styles.cuisineText}>{c}</Text>
            </View>
          ))}
        </View>
        <RatingBadge rating={restaurant.rating} countText={restaurant.totalRatings} size="sm" />
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Footer Metrics with Icons */}
      <View style={styles.cardFooter}>
        <View style={styles.metricsLeft}>
          <View style={styles.metricItem}>
            <Clock size={12} color="#10B981" />
            <Text style={styles.metricText}>{restaurant.deliveryTime}</Text>
          </View>
          <View style={styles.dotSeparator} />
          <View style={styles.metricItem}>
            <MapPin size={12} color="#65A30D" />
            <Text style={styles.metricText}>{restaurant.distance}</Text>
          </View>
          <View style={styles.dotSeparator} />
          <Text style={styles.costText}>₹{restaurant.costForTwo} for two</Text>
        </View>

        <View style={styles.menuAction}>
          <Text style={styles.menuActionText}>Menu</Text>
          <ArrowRight size={13} color="#65A30D" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  onSelectRestaurant,
  onNavigateHome,
}) => {
  const { favorites, toggleFavorite } = useCart();
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
            <Text style={styles.title}>Favorite Spots</Text>
            <Text style={styles.subtitle}>Your bookmarked food places</Text>
          </View>
        </View>

        <Text style={styles.countText}>{favoriteRestaurants.length} saved</Text>
      </View>

      {favoriteRestaurants.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Heart size={36} color="#F43F5E" fill="#F43F5E" />
          </View>
          <Text style={styles.emptyTitle}>No Favorites Saved</Text>
          <Text style={styles.emptyDesc}>
            Tap the heart icon on any restaurant to save your favorite spots.
          </Text>
          <TouchableOpacity onPress={onNavigateHome} style={styles.exploreBtn}>
            <Store size={14} color="#FFFFFF" />
            <Text style={styles.exploreText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {favoriteRestaurants.map((restaurant) => (
            <FavoriteRestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onSelect={onSelectRestaurant}
              onToggleFavorite={toggleFavorite}
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(101, 163, 13, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
    maxWidth: '80%',
  },
  tagline: {
    fontSize: 11,
    color: '#6B7280',
  },
  favIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(101, 163, 13, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  offerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4D7C0F',
  },
  cuisineAndRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cuisineList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  cuisinePill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  cuisineText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
  },
  costText: {
    fontSize: 11,
    color: '#6B7280',
  },
  menuAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(101, 163, 13, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  menuActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#65A30D',
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
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#65A30D',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  exploreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

