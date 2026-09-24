import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { Restaurant } from '../../types';
import { RatingBadge, DietaryBadge } from '../common/Badge';
import { Clock, MapPin, Tag, Heart, Sparkles, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../../context/CartContext';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onSelect: (restaurantId: string) => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onSelect }) => {
  const { toggleFavorite, isFavorite } = useCart();
  const fav = isFavorite(restaurant.id);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onSelect(restaurant.id)}
      style={[styles.cardBorderWrap, { borderColor: restaurant.cardBorderColor }]}
    >
      <ImageBackground
        source={{ uri: restaurant.featuredImage }}
        style={styles.cardBackground}
        imageStyle={{ borderRadius: 24 }}
      >
        {/* Top items: Offer tag and Favorite button */}
        <View style={styles.topRow}>
          {restaurant.offerText ? (
            <View style={styles.offerBadge}>
              <Tag size={10} color="#65A30D" />
              <Text style={styles.offerText} numberOfLines={1}>
                {restaurant.offerText}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <TouchableOpacity
            onPress={() => toggleFavorite(restaurant.id)}
            style={styles.favBtn}
          >
            <Heart
              size={15}
              color={fav ? '#F43F5E' : '#FFF'}
              fill={fav ? '#F43F5E' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }} />

        {/* Text Content overlay with gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,1)']}
          style={styles.contentOverlay}
        >


          <View style={styles.titleRow}>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {restaurant.name}
            </Text>
            <DietaryBadge
              type={restaurant.dietaryType === 'pure-veg' ? 'veg' : 'non-veg'}
              size="sm"
            />
          </View>

          <Text style={styles.tagline} numberOfLines={2}>
            {restaurant.tagline}
          </Text>

          {/* Cuisines & Rating */}
          <View style={styles.cuisineAndRatingRow}>
            <View style={styles.cuisineList}>
              {restaurant.cuisine.map((c, i) => (
                <View key={i} style={styles.cuisinePill}>
                  <Text style={styles.cuisineText}>{c}</Text>
                </View>
              ))}
            </View>
            <RatingBadge rating={restaurant.rating} countText={restaurant.totalRatings} size="sm" />
          </View>

          <View style={styles.footerRow}>
            <View style={styles.metricsLeft}>
              <View style={styles.metricItem}>
                <Clock size={11} color="#34D399" />
                <Text style={styles.metricTime}>{restaurant.deliveryTime}</Text>
              </View>
              <View style={styles.dotSeparator} />
              <View style={styles.metricItem}>
                <MapPin size={11} color="#65A30D" />
                <Text style={styles.metricDistance}>{restaurant.distance}</Text>
              </View>
            </View>

            <View style={styles.costRight}>
              <Text style={styles.costText}>₹{restaurant.costForTwo} for two</Text>
              <ArrowRight size={12} color="#ECFCCB" />
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardBorderWrap: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 14,
    height: 260, // Increased height to fit extra content
    backgroundColor: '#000',
  },
  cardBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  offerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ECFCCB',
  },
  favBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contentOverlay: {
    padding: 12,
    paddingTop: 40, // Fade gracefully into text
  },


  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    flex: 1,
  },
  tagline: {
    fontSize: 11,
    color: '#E5E7EB',
    marginTop: 2,
  },
  cuisineAndRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cuisineList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
    paddingRight: 8,
  },
  cuisinePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  cuisineText: {
    fontSize: 9,
    color: '#D8B4FE',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 8,
    marginTop: 8,
  },
  metricsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricTime: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#34D399',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  metricDistance: {
    fontSize: 11,
    color: 'rgba(237, 234, 246, 0.7)',
  },
  costRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  costText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ECFCCB',
  },
});
