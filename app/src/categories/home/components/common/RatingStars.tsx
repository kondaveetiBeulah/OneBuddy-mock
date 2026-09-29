import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Star } from 'lucide-react-native';
import { COLORS, SPACING } from '../../theme';

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showText?: boolean;
  textColor?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  size = 18,
  interactive = false,
  onRatingChange,
  showText = false,
  textColor = COLORS.textSecondary,
}) => {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {stars.map((starNumber) => {
          const isFilled = starNumber <= rating;
          const isHalf = !isFilled && starNumber - 0.5 <= rating;

          const StarIcon = (
            <Star
              key={starNumber}
              size={size}
              color={isFilled ? COLORS.starFilled : COLORS.starEmpty}
              fill={isFilled ? COLORS.starFilled : 'transparent'}
              style={styles.star}
            />
          );

          if (interactive && onRatingChange) {
            return (
              <TouchableOpacity
                key={starNumber}
                activeOpacity={0.7}
                onPress={() => onRatingChange(starNumber)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                {StarIcon}
              </TouchableOpacity>
            );
          }

          return <View key={starNumber}>{StarIcon}</View>;
        })}
      </View>

      {showText && (
        <Text style={[styles.ratingText, { color: textColor, fontSize: size * 0.75 }]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 3,
  },
  ratingText: {
    marginLeft: SPACING.xs,
    fontWeight: '700',
  },
});
