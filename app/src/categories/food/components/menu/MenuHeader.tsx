import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Restaurant } from '../../types';
import { RatingBadge, DietaryBadge } from '../common/Badge';
import { ArrowLeft, Clock, MapPin, Heart, Tag, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
import * as Clipboard from 'expo-clipboard';
import { useCart } from '../../context/CartContext';

interface MenuHeaderProps {
  restaurant: Restaurant;
  onBack: () => void;
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({ restaurant, onBack }) => {
  const { toggleFavorite, isFavorite } = useCart();
  const [isCopied, setIsCopied] = React.useState(false);
  const fav = isFavorite(restaurant.id);

  const handleCopy = async () => {
    if (restaurant.couponCode) {
      await Clipboard.setStringAsync(restaurant.couponCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Banner Cover */}
      <View style={styles.bannerWrap}>
        <Image
          source={{ uri: restaurant.bannerImage || restaurant.featuredImage }}
          style={styles.bannerImage}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent', isCategoryDark() ? '#121214' : '#F3F4F6']}
          style={styles.bannerOverlay}
        />

        {/* Top Floating Controls */}
        <View style={styles.topControlRow}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={18} color="#FFFFFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleFavorite(restaurant.id)}
            style={styles.favBtn}
          >
            <Heart
              size={16}
              color={fav ? '#F43F5E' : '#FFF'}
              fill={fav ? '#F43F5E' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Meta Card (Dual-Shade Gradient) */}
      <View style={styles.cardOffsetWrap}>
        <View
          style={[styles.metaCard, { borderColor: isCategoryDark() ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)', backgroundColor: isCategoryDark() ? '#1D1E22' : '#FFFFFF', overflow: 'hidden' }]}
        >
          <LinearGradient
            colors={restaurant.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}
          />
          <View style={styles.titleRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={styles.nameBadges}>
                <DietaryBadge
                  type={restaurant.dietaryType === 'pure-veg' ? 'veg' : 'non-veg'}
                  size="sm"
                />
                <Text style={styles.restaurantTitle} numberOfLines={1}>
                  {restaurant.name}
                </Text>
              </View>
              <Text style={styles.tagline}>{restaurant.tagline}</Text>
            </View>

            <RatingBadge rating={restaurant.rating} countText={restaurant.totalRatings} size="md" />
          </View>

          {/* Cuisines */}
          <View style={styles.cuisineRow}>
            {restaurant.cuisine.map((c, i) => (
              <View key={i} style={styles.cuisinePill}>
                <Text style={styles.cuisineText}>{c}</Text>
              </View>
            ))}
          </View>

          {/* Quick Info Bar */}
          <View style={styles.metricsBar}>
            <View style={styles.metricsGroup}>
              <View style={styles.metricItem}>
                <Clock size={13} color="#34D399" />
                <Text style={styles.metricTime}>{restaurant.deliveryTime}</Text>
              </View>
              <View style={styles.dot} />
              <View style={styles.metricItem}>
                <MapPin size={13} color="#65A30D" />
                <Text style={styles.metricDistance}>{restaurant.distance}</Text>
              </View>
            </View>

            <Text style={styles.costText}>₹{restaurant.costForTwo} for two</Text>
          </View>
        </View>

        {/* Promo Coupon Bar with 1-Tap Apply */}
        <View style={styles.couponBar}>
          <View style={styles.couponLeft}>
            <Tag size={14} color="#65A30D" />
            <View style={{ flex: 1 }}>
              <Text style={styles.couponOffer} numberOfLines={1}>
                {restaurant.offerText}
              </Text>
              <Text style={styles.couponCodeText}>
                Use code: <Text style={{ color: '#4D7C0F', fontWeight: 'bold' }}>{restaurant.couponCode}</Text>
              </Text>
            </View>
          </View>

          {restaurant.couponCode ? (
            <TouchableOpacity
              onPress={handleCopy}
              style={[styles.applyBtn, isCopied && styles.appliedBtn]}
            >
              {isCopied ? (
                <View style={styles.appliedRow}>
                  <Check size={11} color="#6EE7B7" />
                  <Text style={styles.appliedText}>COPIED</Text>
                </View>
              ) : (
                <Text style={styles.applyText}>COPY</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  bannerWrap: {
    width: '100%',
    height: 190,
    position: 'relative',
    backgroundColor: '#000',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  topControlRow: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 9, 18, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  backText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  favBtn: {
    backgroundColor: 'rgba(13, 9, 18, 0.8)',
    borderRadius: 14,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardOffsetWrap: {
    paddingHorizontal: 16,
    marginTop: -40,
    zIndex: 5,
    gap: 8,
  },
  metaCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restaurantTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flexShrink: 1,
  },
  tagline: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  cuisineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  cuisinePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cuisineText: {
    fontSize: 10,
    color: '#6B7280',
  },
  metricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 8,
    marginTop: 4,
  },
  metricsGroup: {
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  metricDistance: {
    fontSize: 12,
    color: '#6B7280',
  },
  costText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  couponBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  couponOffer: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
  },
  couponCodeText: {
    fontSize: 10,
    color: '#6B7280',
  },
  applyBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  appliedBtn: {
    backgroundColor: 'rgba(6, 78, 59, 0.6)',
    borderColor: '#10B981',
  },
  applyText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  appliedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6EE7B7',
  },
});
