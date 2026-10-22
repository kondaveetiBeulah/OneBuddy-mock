import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Shimmer, ShimmerBox, ShimmerCircle, ShimmerText } from '../Shimmer';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

/**
 * Skeleton placeholder for RestaurantCard in Food Delivery home & search lists.
 * Exact dimensions: height 260, borderRadius 24, padding 12, matching RestaurantCard.tsx.
 */
/**
 * Skeleton placeholder for RestaurantCard matching reference image:
 * 1. Large rectangular media box (height 190, borderRadius 14)
 * 2. Bottom row with circular avatar (size 38) + 2 text lines (top line 88%, bottom line 46%)
 */
export const RestaurantCardSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();

  return (
    <View style={styles.referenceCardWrap}>
      {/* 1. Large Media / Card Thumbnail */}
      <ShimmerBox
        width="100%"
        height={190}
        borderRadius={14}
        isDark={isDark}
      />

      {/* 2. Metadata row: Avatar + 2 Text lines */}
      <View style={styles.referenceMetaRow}>
        <ShimmerCircle size={38} isDark={isDark} />
        <View style={styles.referenceTextCol}>
          <ShimmerText width="88%" height={14} borderRadius={7} isDark={isDark} />
          <ShimmerText width="46%" height={12} borderRadius={6} style={{ marginTop: 6 }} isDark={isDark} />
        </View>
      </View>
    </View>
  );
};

/**
 * 4 rounded horizontal pill chips at the top matching reference image.
 */
export const HorizontalPillsSkeleton: React.FC<{ isDark?: boolean; count?: number }> = ({
  isDark: propIsDark,
  count = 4,
}) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  return (
    <View style={styles.pillsSkeletonRow}>
      {Array.from({ length: count }).map((_, index) => (
        <ShimmerBox
          key={index}
          width={84}
          height={32}
          borderRadius={16}
          isDark={isDark}
          style={{ marginRight: 8 }}
        />
      ))}
    </View>
  );
};

/**
 * Skeleton placeholder for Food banner carousel.
 * Exact dimensions matching DiscountCarousel banner card: height 170, borderRadius 24, paddingHorizontal 16.
 */
export const FoodBannerSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  return (
    <View style={{ width: '100%', paddingHorizontal: 16, marginVertical: 6 }}>
      <ShimmerBox width="100%" height={170} borderRadius={24} isDark={isDark} />
    </View>
  );
};

/**
 * Skeleton placeholder for MenuItemCard in RestaurantMenuScreen.
 * Exact dimensions matching MenuItemCard: padding 14, 100x100 image box on right.
 */
export const MenuItemCardSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const cardBg = isDark ? '#18181B' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(101, 163, 13, 0.25)';

  return (
    <View style={[styles.menuItemCardWrap, { backgroundColor: cardBg, borderColor }]}>
      {/* Left Details Column */}
      <View style={styles.menuLeftCol}>
        {/* Badges row */}
        <View style={styles.pillsRow}>
          <ShimmerBox width={16} height={16} borderRadius={4} isDark={isDark} />
          <ShimmerBox width={54} height={16} borderRadius={6} isDark={isDark} />
          <ShimmerBox width={62} height={16} borderRadius={6} isDark={isDark} />
        </View>

        {/* Title */}
        <ShimmerText width="90%" height={16} borderRadius={4} style={{ marginTop: 8 }} isDark={isDark} />

        {/* Price row */}
        <View style={[styles.pillsRow, { marginTop: 6 }]}>
          <ShimmerBox width={50} height={16} borderRadius={4} isDark={isDark} />
          <ShimmerBox width={40} height={14} borderRadius={4} isDark={isDark} />
        </View>

        {/* Rating row */}
        <View style={[styles.pillsRow, { marginTop: 6 }]}>
          <ShimmerBox width={42} height={16} borderRadius={6} isDark={isDark} />
        </View>

        {/* Description */}
        <ShimmerText width="95%" height={11} borderRadius={4} style={{ marginTop: 6 }} isDark={isDark} />
        <ShimmerText width="70%" height={11} borderRadius={4} style={{ marginTop: 4 }} isDark={isDark} />
      </View>

      {/* Right Image Column */}
      <View style={styles.menuRightCol}>
        <ShimmerBox width={100} height={100} borderRadius={16} isDark={isDark} />
        <ShimmerBox width={72} height={28} borderRadius={14} style={{ marginTop: -14 }} isDark={isDark} />
      </View>
    </View>
  );
};

/**
 * Full Menu Screen Skeleton with Header, Filter Bar, and 4 Menu Items.
 */
export const RestaurantMenuSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F9FAFB' }]}>
      {/* Header Banner Skeleton */}
      <View style={styles.menuHeaderBanner}>
        <ShimmerBox width="100%" height={180} borderRadius={0} isDark={isDark} />
        <View style={[styles.menuHeaderCard, { backgroundColor: isDark ? '#18181B' : '#FFFFFF' }]}>
          <ShimmerText width="60%" height={20} borderRadius={6} isDark={isDark} />
          <ShimmerText width="80%" height={13} borderRadius={4} style={{ marginTop: 6 }} isDark={isDark} />
          <View style={[styles.pillsRow, { marginTop: 10 }]}>
            <ShimmerBox width={70} height={20} borderRadius={8} isDark={isDark} />
            <ShimmerBox width={60} height={20} borderRadius={8} isDark={isDark} />
            <ShimmerBox width={80} height={20} borderRadius={8} isDark={isDark} />
          </View>
        </View>
      </View>

      {/* Search & Filter Bar Skeletons */}
      <View style={styles.menuFiltersWrap}>
        <ShimmerBox width="100%" height={42} borderRadius={14} isDark={isDark} />
        <View style={[styles.pillsRow, { marginTop: 10 }]}>
          <ShimmerBox width={50} height={30} borderRadius={15} isDark={isDark} />
          <ShimmerBox width={70} height={30} borderRadius={15} isDark={isDark} />
          <ShimmerBox width={65} height={30} borderRadius={15} isDark={isDark} />
          <ShimmerBox width={80} height={30} borderRadius={15} isDark={isDark} />
        </View>
      </View>

      {/* Menu items list */}
      <View style={styles.menuItemsList}>
        <MenuItemCardSkeleton isDark={isDark} />
        <MenuItemCardSkeleton isDark={isDark} />
        <MenuItemCardSkeleton isDark={isDark} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  referenceCardWrap: {
    width: '100%',
    marginBottom: 20,
  },
  referenceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 2,
  },
  referenceTextCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  pillsSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  restaurantCardWrap: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    height: 260,
    justifyContent: 'space-between',
  },
  restaurantTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  restaurantContentOverlay: {
    padding: 12,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  restaurantFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  metricsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuItemCardWrap: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
  },
  menuLeftCol: {
    flex: 1,
  },
  menuRightCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 105,
  },
  menuHeaderBanner: {
    position: 'relative',
    marginBottom: 40,
  },
  menuHeaderCard: {
    marginHorizontal: 16,
    marginTop: -30,
    borderRadius: 20,
    padding: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  menuFiltersWrap: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  menuItemsList: {
    paddingHorizontal: 16,
  },
});
