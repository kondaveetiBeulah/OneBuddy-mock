import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOCColors } from '../constants/colors';

interface RatingStarsProps {
  rating: number;
  size?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  size = 13,
}) => {
  const oc = useOCColors();

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: oc.isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
        <Ionicons name="star" size={size} color="#F59E0B" />
        <Text style={[styles.ratingText, { fontSize: size + 0.5, color: oc.isDark ? '#FDE68A' : '#92400E' }]}>
          {rating.toFixed(1)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    fontWeight: '700',
    color: '#92400E',
  },
});

