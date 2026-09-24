import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem as CartItemType } from '../types/cart.types';
import { useGroceryColors } from '../theme/colors';
import { typography, spacing } from '../theme';
import { formatCurrency } from '../utils/helpers';
import { QuantitySelector } from './QuantitySelector';

interface CartItemProps {
  item: CartItemType;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
}

export const CartItemComponent: React.FC<CartItemProps> = ({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}) => {
  const colors = useGroceryColors();
  const { product, quantity } = item;
  const itemTotal = product.discountPrice * quantity;

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
      <Image source={{ uri: product.image }} style={[styles.image, { backgroundColor: colors.background }]} resizeMode="cover" />

      <View style={styles.details}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {product.name}
          </Text>
          <TouchableOpacity
            onPress={() => onRemove(product.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger as string} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.unit, { color: colors.textMuted }]}>{product.unit}</Text>

        <View style={styles.bottomRow}>
          <View>
            <Text style={[styles.price, { color: colors.primaryDark }]}>{formatCurrency(itemTotal)}</Text>
            {product.price > product.discountPrice && (
              <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
                {formatCurrency(product.price * quantity)}
              </Text>
            )}
          </View>

          <QuantitySelector
            quantity={quantity}
            onIncrease={() => onIncrease(product.id)}
            onDecrease={() => onDecrease(product.id)}
            size="small"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: spacing.borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  image: {
    width: 65,
    height: 65,
    borderRadius: spacing.borderRadius.sm,
  },
  details: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    flex: 1,
    marginRight: spacing.xs,
  },
  unit: {
    fontSize: typography.sizes.xs,
    marginVertical: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  price: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  originalPrice: {
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
});
