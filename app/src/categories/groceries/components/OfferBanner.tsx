import React, { useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Offer } from '../types/offer.types';
import { colors, typography, spacing } from '../theme';

export interface OfferBannerProps {
  offer: Offer;
  onPress?: (offer: Offer) => void;
  bannerWidth?: number;
  style?: StyleProp<ViewStyle>;
}

const { width: defaultWidth } = Dimensions.get('window');
const DEFAULT_BANNER_WIDTH = Math.min(defaultWidth - spacing.md * 2, 360);

export const OfferBanner: React.FC<OfferBannerProps> = ({
  offer,
  onPress,
  bannerWidth,
  style,
}) => {
  const [imageError, setImageError] = useState(false);
  const cardWidth = bannerWidth || DEFAULT_BANNER_WIDTH;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: offer.backgroundColor, width: cardWidth },
        style,
      ]}
      onPress={() => onPress && onPress(offer)}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={imageError || !offer.image ? undefined : { uri: offer.image }}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
        onError={() => setImageError(true)}
      >
        <View style={styles.overlay}>
          <View style={styles.textContainer}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{offer.discountTag}</Text>
            </View>
            <Text style={styles.titleText} numberOfLines={2}>
              {offer.title}
            </Text>
            <Text style={styles.subtitleText} numberOfLines={2}>
              {offer.subtitle}
            </Text>

            <View style={styles.bottomRow}>
              {offer.code ? (
                <View style={styles.codeContainer}>
                  <Text style={styles.codeLabel}>Code: </Text>
                  <Text style={styles.codeText}>{offer.code}</Text>
                </View>
              ) : (
                <View />
              )}

              <View style={styles.shopNowBtn}>
                <Text style={styles.shopNowText}>Shop Now</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.primaryDark} />
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 155,
    borderRadius: spacing.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    borderRadius: spacing.borderRadius.lg,
    opacity: 0.65,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    padding: spacing.md,
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  tagBadge: {
    backgroundColor: colors.secondary,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: spacing.borderRadius.sm,
    marginBottom: 4,
  },
  tagText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  titleText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
    lineHeight: 22,
  },
  subtitleText: {
    color: '#E0E0E0',
    fontSize: typography.sizes.xs,
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: spacing.borderRadius.sm,
  },
  codeLabel: {
    color: colors.white,
    fontSize: 10,
  },
  codeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  shopNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: spacing.borderRadius.round,
    gap: 3,
  },
  shopNowText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
});
