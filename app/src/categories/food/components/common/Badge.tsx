import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DietaryType } from '../../types';
import { Star, Sparkles, Flame, Clock, Utensils } from 'lucide-react-native';

export const DietaryBadge: React.FC<{ type: DietaryType; size?: 'sm' | 'md' }> = ({ type, size = 'sm' }) => {
  const isVeg = type === 'veg';
  const isNonVeg = type === 'non-veg';
  const isEgg = type === 'egg';

  const boxDim = size === 'sm' ? 16 : 20;
  const dotDim = size === 'sm' ? 8 : 10;

  const borderColor = isVeg ? '#10B981' : isNonVeg ? '#EF4444' : '#F59E0B';
  const dotColor = isVeg ? '#34D399' : isNonVeg ? '#F87171' : '#65A30D';

  return (
    <View style={[styles.dietaryBox, { width: boxDim, height: boxDim, borderColor }]}>
      <View style={[styles.dietaryDot, { width: dotDim, height: dotDim, backgroundColor: dotColor }]} />
    </View>
  );
};

export const RatingBadge: React.FC<{ rating: number; countText?: string; size?: 'sm' | 'md' }> = ({
  rating,
  countText,
  size = 'sm',
}) => {
  const isTop = rating >= 4.5;
  const isGood = rating >= 4.0;

  const bg = isTop ? 'rgba(6, 78, 59, 0.85)' : isGood ? 'rgba(120, 53, 15, 0.85)' : '#292524';
  const border = isTop ? '#059669' : isGood ? '#D97706' : '#57534E';
  const textClr = isTop ? '#6EE7B7' : isGood ? '#ECFCCB' : '#E7E5E4';

  return (
    <View style={[styles.ratingBadge, { backgroundColor: bg, borderColor: border, paddingVertical: size === 'sm' ? 2 : 4, paddingHorizontal: size === 'sm' ? 6 : 8 }]}>
      <Star size={size === 'sm' ? 12 : 14} color="#65A30D" fill="#65A30D" />
      <Text style={[styles.ratingText, { color: textClr, fontSize: size === 'sm' ? 11 : 13 }]}>
        {rating.toFixed(1)}
      </Text>
      {countText ? (
        <Text style={[styles.ratingCount, { fontSize: size === 'sm' ? 9 : 11 }]}>
          ({countText})
        </Text>
      ) : null}
    </View>
  );
};

export const ComboTag: React.FC<{ text?: string }> = ({ text = 'COMBO DEAL' }) => {
  return (
    <View style={styles.comboTag}>
      <Sparkles size={11} color="#65A30D" />
      <Text style={styles.comboText}>{text}</Text>
    </View>
  );
};

export const CuisineTag: React.FC<{ cuisine: string }> = ({ cuisine }) => {
  return (
    <View style={styles.cuisineTag}>
      <Utensils size={11} color="#C084FC" />
      <Text style={styles.cuisineText}>{cuisine}</Text>
    </View>
  );
};

export const BestsellerTag: React.FC = () => {
  return (
    <View style={styles.bestsellerTag}>
      <Flame size={11} color="#FB923C" fill="#FB923C" />
      <Text style={styles.bestsellerText}>BESTSELLER</Text>
    </View>
  );
};

export const PrepTimeTag: React.FC<{ time: string }> = ({ time }) => {
  return (
    <View style={styles.prepTag}>
      <Clock size={11} color="#6B7280" />
      <Text style={styles.prepText}>{time}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  dietaryBox: {
    borderWidth: 1.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dietaryDot: {
    borderRadius: 50,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  ratingText: {
    fontWeight: 'bold',
  },
  ratingCount: {
    color: '#E5E7EB',
    opacity: 0.8,
  },
  comboTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: 'rgba(201, 162, 39, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.45)',
    gap: 4,
  },
  comboText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4D7C0F',
    letterSpacing: 0.5,
  },
  cuisineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 108, 201, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 108, 201, 0.45)',
    gap: 4,
  },
  cuisineText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B21A8',
    letterSpacing: 0.5,
  },
  bestsellerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: 'rgba(234, 88, 12, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.45)',
    gap: 4,
  },
  bestsellerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FDBA74',
    letterSpacing: 0.5,
  },
  prepTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prepText: {
    fontSize: 11,
    color: '#6B7280',
  },
});

