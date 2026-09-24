import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MenuItem, Restaurant } from '../../types';
import { QuantityButton } from '../common/QuantityButton';
import { useCart } from '../../context/CartContext';
import { Sparkles, CheckCircle } from 'lucide-react-native';
import { DietaryBadge } from '../common/Badge';
import { LinearGradient } from 'expo-linear-gradient';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

interface ComboHighlightProps {
  comboItem: MenuItem;
  restaurant: Restaurant;
}

export const ComboHighlight: React.FC<ComboHighlightProps> = ({ comboItem, restaurant }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const quantity = getItemQuantity(comboItem.id);
  const isDark = isCategoryDark();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1D1E22', '#24262B', '#121214'] : ['#FFFFFF', '#F9FAFB', '#F3F4F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Top Tag */}
          <View style={styles.tagRow}>
            <View style={styles.comboHeaderTag}>
              <Sparkles size={11} color={isDark ? '#F1F1EC' : '#111827'} />
              <Text style={styles.comboHeaderText}>SIGNATURE MEGA COMBO</Text>
            </View>
            <DietaryBadge type={comboItem.dietary} size="sm" />
          </View>

          <Text style={styles.title}>{comboItem.name}</Text>
          <Text style={styles.desc} numberOfLines={2}>{comboItem.description}</Text>

          {/* Included Dishes */}
          {comboItem.comboIncludes ? (
            <View style={styles.includesGrid}>
              {comboItem.comboIncludes.slice(0, 4).map((inc, idx) => (
                <View key={idx} style={styles.includeRow}>
                  <CheckCircle size={10} color="#65A30D" />
                  <Text style={styles.includeText} numberOfLines={1}>{inc}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Pricing & Stepper */}
          <View style={styles.bottomRow}>
            <View style={styles.priceCol}>
              <Text style={styles.price}>₹{comboItem.price}</Text>
              {comboItem.originalPrice ? (
                <Text style={styles.origPrice}>₹{comboItem.originalPrice}</Text>
              ) : null}
            </View>

            <QuantityButton
              quantity={quantity}
              onAdd={() => addToCart(comboItem, restaurant, 1)}
              onIncrement={() => updateQuantity(comboItem.id, 1)}
              onDecrement={() => updateQuantity(comboItem.id, -1)}
              size="md"
            />
          </View>
        </View>

        <View style={styles.imageWrap}>
          <Image source={{ uri: comboItem.image }} style={styles.image} />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#65A30D',
    overflow: 'hidden',
    shadowColor: '#65A30D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  gradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comboHeaderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#65A30D',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  comboHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  desc: {
    fontSize: 11,
    color: '#6B7280',
    opacity: 0.8,
  },
  includesGrid: {
    gap: 2,
    marginVertical: 4,
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  includeText: {
    fontSize: 10,
    color: '#4D7C0F',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4D7C0F',
  },
  origPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  imageWrap: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

