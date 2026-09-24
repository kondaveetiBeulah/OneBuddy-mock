import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGroceryColors } from '../theme/colors';
import { typography, spacing } from '../theme';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  minQuantity?: number;
  maxQuantity?: number;
  size?: 'small' | 'medium' | 'large';
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  minQuantity = 1,
  maxQuantity = 99,
  size = 'medium',
}) => {
  const colors = useGroceryColors();
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const iconSize = isSmall ? 14 : isLarge ? 20 : 16;
  const buttonStyle = isSmall
    ? styles.btnSmall
    : isLarge
    ? styles.btnLarge
    : styles.btnMedium;

  return (
    <View style={[styles.container, { backgroundColor: colors.primaryLight, borderColor: colors.primaryMedium }]}>
      <TouchableOpacity
        style={[buttonStyle, quantity <= minQuantity && styles.disabledBtn]}
        onPress={onDecrease}
        disabled={quantity <= minQuantity}
      >
        <Ionicons
          name="remove"
          size={iconSize}
          color={(quantity <= minQuantity ? colors.textMuted : colors.primary) as string}
        />
      </TouchableOpacity>

      <Text
        style={[
          styles.quantityText, { color: colors.primaryDark },
          isSmall ? styles.textSmall : isLarge ? styles.textLarge : styles.textMedium,
        ]}
      >
        {quantity}
      </Text>

      <TouchableOpacity
        style={[buttonStyle, quantity >= maxQuantity && styles.disabledBtn]}
        onPress={onIncrease}
        disabled={quantity >= maxQuantity}
      >
        <Ionicons
          name="add"
          size={iconSize}
          color={(quantity >= maxQuantity ? colors.textMuted : colors.primary) as string}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.borderRadius.md,
    padding: 2,
    borderWidth: 1,
  },
  btnSmall: {
    padding: 4,
    borderRadius: spacing.borderRadius.sm,
  },
  btnMedium: {
    padding: 6,
    borderRadius: spacing.borderRadius.sm,
  },
  btnLarge: {
    padding: 8,
    borderRadius: spacing.borderRadius.sm,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  quantityText: {
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  textSmall: {
    fontSize: typography.sizes.xs,
    paddingHorizontal: 8,
  },
  textMedium: {
    fontSize: typography.sizes.sm,
    paddingHorizontal: 12,
  },
  textLarge: {
    fontSize: typography.sizes.md,
    paddingHorizontal: 16,
  },
});
