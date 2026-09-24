import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';
import { Header } from '../components/Header';
import { RatingStars } from '../components/RatingStars';
import { QuantitySelector } from '../components/QuantitySelector';
import { LoadingState } from '../components/LoadingState';
import { productService } from '../services/productService';
import { Product } from '../types/product.types';
import { formatCurrency } from '../utils/helpers';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation.types';
type ProductDetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProductDetails'>;
  route: RouteProp<RootStackParamList, 'ProductDetails'>;
};

export const ProductDetailsScreen: React.FC<ProductDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const { addToCart, getItemQuantity, getCartCount, increaseQuantity, decreaseQuantity } = useCart();
  const { isInWishlist, toggleWishlist, wishlistCount } = useWishlist();
  const cartCount = getCartCount();
  const cartQty = product ? getItemQuantity(product.id) : 0;
  const currentQuantity = cartQty > 0 ? cartQty : quantity;

  // Animation values
  const buttonScale = useRef(new Animated.Value(1)).current;
  const cartBadgeScale = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleToggleFavorite = () => {
    if (!product) return;
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

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const data = await productService.getProductById(productId);
      if (data) {
        setProduct(data);
        const existingQty = getItemQuantity(data.id);
        if (existingQty > 0) setQuantity(existingQty);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return <LoadingState message={loading ? "Loading product..." : "Product not found"} />;
  }

  const isFavorite = isInWishlist(product.id);

  const pulseCartBadge = () => {
    Animated.sequence([
      Animated.timing(cartBadgeScale, {
        toValue: 1.35,
        duration: 120,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(cartBadgeScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  const handleQuantityIncrease = () => {
    if (!product) return;
    if (cartQty > 0) {
      increaseQuantity(product.id);
    } else {
      addToCart(product, 1);
    }
    setQuantity((prev) => prev + 1);
    pulseCartBadge();
  };

  const handleQuantityDecrease = () => {
    if (!product) return;
    if (cartQty > 0) {
      decreaseQuantity(product.id);
      setQuantity((prev) => Math.max(1, prev - 1));
      pulseCartBadge();
    } else {
      setQuantity((prev) => Math.max(1, prev - 1));
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (cartQty > 0) {
      increaseQuantity(product.id);
    } else {
      addToCart(product, quantity > 0 ? quantity : 1);
    }

    // Smooth button scale/bounce action effect
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.92,
        duration: 90,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(buttonScale, {
        toValue: 1.06,
        friction: 3,
        tension: 45,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    pulseCartBadge();

    // Visual state feedback on the button itself (no toast/notification)
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (cartQty === 0) {
      addToCart(product, quantity);
    }
    navigation.navigate('Cart');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={product.brand}
        showBack
        onBack={() => navigation.goBack()}
        rightIcon={
          <View style={styles.headerRightActions}>
            {/* Wishlist Heart Toggle */}
            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={26}
                  color={isFavorite ? colors.danger : colors.textPrimary}
                />
              </Animated.View>
            </TouchableOpacity>

            {/* Cart Button with Animated Live Badge */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Cart')}
              style={styles.headerCartWrapper}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="cart-outline" size={28} color={colors.textPrimary} />
              {cartCount > 0 && (
                <Animated.View
                  style={[
                    styles.cartBadge,
                    { transform: [{ scale: cartBadgeScale }] },
                  ]}
                >
                  <Text style={styles.cartBadgeText}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </Animated.View>
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            resizeMode="contain"
          />
          {product.discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {product.discountPercentage}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* Product Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.brandText}>{product.brand}</Text>
          <Text style={styles.nameText}>{product.name}</Text>
          <Text style={styles.unitText}>{product.unit}</Text>

          <View style={styles.ratingRow}>
            <RatingStars
              rating={product.rating}
              reviewCount={product.reviewCount}
              size={18}
            />
            <View style={styles.stockBadge}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.success}
              />
              <Text style={styles.stockText}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>

          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.discountPriceText}>
                {formatCurrency(product.discountPrice)}
              </Text>
              {product.price > product.discountPrice && (
                <Text style={styles.originalPriceText}>
                  MRP {formatCurrency(product.price)} (Inclusive of all taxes)
                </Text>
              )}
            </View>

            <QuantitySelector
              quantity={currentQuantity}
              onIncrease={handleQuantityIncrease}
              onDecrease={handleQuantityDecrease}
              minQuantity={cartQty > 0 ? 0 : 1}
              size="medium"
            />
          </View>

          <View style={styles.divider} />

          {/* Delivery Information Box */}
          <View style={styles.deliveryBox}>
            <View style={styles.deliveryRow}>
              <Ionicons name="flash-outline" size={20} color={colors.primary} />
              <View style={styles.deliveryTextCol}>
                <Text style={styles.deliveryTitle}>Superfast Delivery</Text>
                <Text style={styles.deliverySubtitle}>
                  Get it delivered in 15-30 mins at your doorstep
                </Text>
              </View>
            </View>
            <View style={styles.deliveryRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <View style={styles.deliveryTextCol}>
                <Text style={styles.deliveryTitle}>1Buddy Quality Guarantee</Text>
                <Text style={styles.deliverySubtitle}>
                  Handpicked fresh items with easy 100% replacement
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionHeaderTitle}>Product Description</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </View>
      </ScrollView>

      {/* Bottom Action Footer with Animated Smooth Hovering Button */}
      <View style={styles.bottomFooter}>
        <Animated.View style={[styles.actionBtnWrapper, { transform: [{ scale: buttonScale }] }]}>
          <TouchableOpacity
            style={[
              styles.addCartBtn,
              isAdded && styles.addCartBtnSuccess,
            ]}
            onPress={handleAddToCart}
            activeOpacity={0.85}
          >
            <Ionicons
              name={cartQty > 0 ? 'cart' : 'cart-outline'}
              size={20}
              color={isAdded ? colors.white : colors.primary}
            />
            <Text style={[styles.addCartBtnText, isAdded && styles.addCartBtnTextSuccess]}>
              {cartQty > 0 ? `Cart (${cartQty})` : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.actionBtnWrapper}>
          <TouchableOpacity
            style={styles.buyNowBtn}
            onPress={handleBuyNow}
            activeOpacity={0.88}
          >
            <Ionicons name="flash" size={18} color={colors.white} />
            <Text style={styles.buyNowBtnText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    position: 'relative',
    padding: 4,
  },
  wishlistBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 19,
    height: 19,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  wishlistBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  headerCartWrapper: {
    position: 'relative',
    padding: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 19,
    height: 19,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productImage: {
    width: '90%',
    height: '90%',
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.danger,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: spacing.borderRadius.sm,
  },
  discountText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  detailsSection: {
    padding: spacing.md,
  },
  brandText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  nameText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginVertical: spacing.xs,
  },
  unitText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: spacing.borderRadius.sm,
    gap: 4,
  },
  stockText: {
    fontSize: typography.sizes.xs,
    color: colors.success,
    fontWeight: typography.weights.bold,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  discountPriceText: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  originalPriceText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  deliveryBox: {
    backgroundColor: colors.background,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deliveryTextCol: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  deliverySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  sectionHeaderTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  bottomFooter: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnWrapper: {
    flex: 1,
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 13,
    borderRadius: spacing.borderRadius.md,
    gap: 8,
    transitionProperty: 'all',
    transitionDuration: '250ms',
  } as any,
  addCartBtnSuccess: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  addCartBtnText: {
    color: colors.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  addCartBtnTextSuccess: {
    color: colors.white,
  },
  buyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: spacing.borderRadius.md,
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    transitionProperty: 'all',
    transitionDuration: '250ms',
  } as any,
  buyNowBtnText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});

