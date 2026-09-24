import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MenuItem, Restaurant } from '../../types';
import { DietaryBadge, RatingBadge, ComboTag, BestsellerTag, PrepTimeTag, CuisineTag } from '../common/Badge';
import { QuantityButton } from '../common/QuantityButton';
import { useCart } from '../../context/CartContext';
import { CheckCircle2, Flame, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

interface MenuItemCardProps {
  item: MenuItem;
  restaurant: Restaurant;
  searchHighlight?: string;
  onItemClick?: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  restaurant,
  onItemClick,
}) => {
  const { addToCart, updateQuantity, getItemQuantity, toggleFavoriteItem, isFavoriteItem } = useCart();
  const quantity = getItemQuantity(item.id);
  const isFav = isFavoriteItem(item.id);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onItemClick && onItemClick(item)}
      style={styles.cardWrapper}
    >
      <LinearGradient
        colors={isCategoryDark() ? ['#1D1E22', '#24262B'] : ['#FFFFFF', '#F9FAFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Left Item Details */}
        <View style={styles.leftCol}>
          {/* Top Badges */}
          <View style={styles.badgeRow}>
            <DietaryBadge type={item.dietary} size="sm" />
            <CuisineTag cuisine={item.cuisine || restaurant.cuisine[0]} />
            {item.bestseller ? <BestsellerTag /> : null}
            {item.isCombo ? <ComboTag /> : null}
            <PrepTimeTag time={item.prepTime} />
          </View>

          {/* Title */}
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>

          {/* Pricing */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.price}</Text>
            {item.originalPrice ? (
              <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
            ) : null}
            {item.originalPrice ? (
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>Save ₹{item.originalPrice - item.price}</Text>
              </View>
            ) : null}
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <RatingBadge rating={item.rating} countText={`${item.ratingCount}`} size="sm" />
            {item.spicyLevel && item.spicyLevel >= 2 ? (
              <View style={styles.spicyTag}>
                <Flame size={10} color="#FB923C" fill="#FB923C" />
                <Text style={styles.spicyText}>
                  {item.spicyLevel === 3 ? 'Extra Spicy' : 'Spicy'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Included combo items */}
          {item.isCombo && item.comboIncludes ? (
            <View style={styles.comboIncludesBox}>
              <Text style={styles.comboIncludesTitle}>Includes in this Combo:</Text>
              <View style={styles.comboItemsGrid}>
                {item.comboIncludes.map((inc, i) => (
                  <View key={i} style={styles.comboItemRow}>
                    <CheckCircle2 size={10} color="#65A30D" />
                    <Text style={styles.comboItemText} numberOfLines={1}>{inc}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {/* Right Image + Quantity Stepper */}
        <View style={styles.rightCol}>
          <View style={styles.imageBox}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <TouchableOpacity
              style={styles.favBtn}
              onPress={() => toggleFavoriteItem(item.id)}
            >
              <Heart
                size={14}
                color={isFav ? '#F43F5E' : '#FFF'}
                fill={isFav ? '#F43F5E' : 'rgba(0,0,0,0.4)'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.btnWrap}>
            <QuantityButton
              quantity={quantity}
              onAdd={() => addToCart(item, restaurant, 1)}
              onIncrement={() => updateQuantity(item.id, 1)}
              onDecrement={() => updateQuantity(item.id, -1)}
              size="md"
            />
          </View>
          <Text style={styles.customText}>Customisable</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#65A30D',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  cardGradient: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    borderRadius: 24,
  },
  leftCol: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
    lineHeight: 19,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4D7C0F',
  },
  originalPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  saveBadge: {
    backgroundColor: 'rgba(6, 78, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  saveText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#34D399',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  spicyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  spicyText: {
    fontSize: 9,
    color: '#FB923C',
    fontWeight: '600',
  },
  desc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  comboIncludesBox: {
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.25)',
    borderRadius: 12,
    padding: 8,
    marginTop: 4,
    gap: 3,
  },
  comboIncludesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4D7C0F',
  },
  comboItemsGrid: {
    gap: 2,
  },
  comboItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  comboItemText: {
    fontSize: 9,
    color: '#4B5563',
    flex: 1,
  },
  rightCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 105,
  },
  imageBox: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  favBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 6,
    zIndex: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  btnWrap: {
    marginTop: -16,
    zIndex: 10,
  },
  customText: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

