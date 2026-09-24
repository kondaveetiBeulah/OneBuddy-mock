import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: number;
  showText?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  reviewCount,
  size = 14,
  showText = true,
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => {
          if (star <= fullStars) {
            return (
              <Ionicons
                key={star}
                name="star"
                size={size}
                color={colors.rating}
              />
            );
          } else if (star === fullStars + 1 && hasHalfStar) {
            return (
              <Ionicons
                key={star}
                name="star-half"
                size={size}
                color={colors.rating}
              />
            );
          } else {
            return (
              <Ionicons
                key={star}
                name="star-outline"
                size={size}
                color={colors.textMuted}
              />
            );
          }
        })}
      </View>
      {showText && (
        <Text style={styles.ratingText}>
          {rating.toFixed(1)}
          {reviewCount !== undefined ? ` (${reviewCount})` : ''}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
});
