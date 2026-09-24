import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types/product.types';
import { useGroceryColors } from '../theme/colors';
import { typography, spacing } from '../theme';
import { formatCurrency } from '../utils/helpers';
import { RatingStars } from './RatingStars';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  variant?: 'grid' | 'horizontal';
}

const { width } = Dimensions.get('window');
const GRID_CARD_WIDTH = (width - spacing.md * 3) / 2;

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
  variant = 'grid',
}) => {
  const colors = useGroceryColors();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { getItemQuantity, increaseQuantity, decreaseQuantity } = useCart();

  const isFavorite = isInWishlist(product.id);
  const cartQty = getItemQuantity(product.id);
  const [imageError, setImageError] = React.useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleToggleFavorite = (e?: any) => {
    e?.stopPropagation?.();
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.35,
        duration: 90,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
    toggleWishlist(product);
  };

  const cardColorStyle = {
    backgroundColor: colors.cardBackground,
    borderColor: colors.borderLight,
    shadowColor: colors.black,
  };

  const cardStyle =
    variant === 'horizontal'
      ? [styles.horizontalCard, cardColorStyle]
      : [styles.gridCard, cardColorStyle];

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={() => onPress(product)}
      activeOpacity={0.9}
    >
      {/* Discount Badge */}
      {product.discountPercentage > 0 && (
        <View style={[styles.discountBadge, { backgroundColor: colors.danger }]}>
          <Text style={[styles.discountText, { color: colors.white }]}>{product.discountPercentage}% OFF</Text>
        </View>
      )}

      {/* Favorite Button */}
      <TouchableOpacity
        style={styles.wishlistButton}
        onPress={handleToggleFavorite}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite ? colors.danger : colors.textMuted}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Image */}
      {imageError || !product.image ? (
        <View style={[variant === 'horizontal' ? styles.horizontalImage : styles.gridImage, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="basket-outline" size={32} color={colors.textMuted} />
        </View>
      ) : (
        <Image
          source={{ uri: product.image }}
          style={variant === 'horizontal' ? styles.horizontalImage : styles.gridImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      )}

      {/* Content */}
      <View style={styles.detailsContainer}>
        <Text style={[styles.brandText, { color: colors.textMuted }]} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={[styles.nameText, { color: colors.textPrimary }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[styles.unitText, { color: colors.textSecondary }]}>{product.unit}</Text>

        <RatingStars rating={product.rating} reviewCount={product.reviewCount} />

        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={[styles.discountPriceText, { color: colors.primaryDark }]}>
              {formatCurrency(product.discountPrice)}
            </Text>
            {product.price > product.discountPrice && (
              <Text style={[styles.originalPriceText, { color: colors.textMuted }]}>
                {formatCurrency(product.price)}
              </Text>
            )}
          </View>

          {cartQty > 0 ? (
            <View style={[styles.quantityStepper, { backgroundColor: colors.primary }]}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => decreaseQuantity(product.id)}
              >
                <Ionicons name="remove" size={14} color={colors.white} />
              </TouchableOpacity>
              <Text style={[styles.stepperCount, { color: colors.white }]}>{cartQty}</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => increaseQuantity(product.id)}
              >
                <Ionicons name="add" size={14} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              onPress={() => onAddToCart(product)}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={[styles.addButtonText, { color: colors.primary }]}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    width: '48.5%',
    borderRadius: 14,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    position: 'relative',
  },
  horizontalCard: {
    width: 170,
    borderRadius: 14,
    padding: spacing.sm + 2,
    marginRight: spacing.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  horizontalImage: {
    width: '100%',
    height: 110,
    borderRadius: 10,
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    zIndex: 2,
  },
  discountText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  wishlistButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    padding: 6,
    borderRadius: spacing.borderRadius.round,
    zIndex: 2,
  },
  detailsContainer: {
    marginTop: spacing.xs + 2,
    flex: 1,
    justifyContent: 'space-between',
  },
  brandText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  nameText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginVertical: 2,
    height: 34,
  },
  unitText: {
    fontSize: typography.sizes.xs,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  priceContainer: {
    flex: 1,
  },
  discountPriceText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  originalPriceText: {
    fontSize: typography.sizes.xs,
    textDecorationLine: 'line-through',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginLeft: 2,
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperButton: {
    padding: 3,
  },
  stepperCount: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    paddingHorizontal: 6,
  },
});

export const ProductCard = React.memo(ProductCardComponent);
