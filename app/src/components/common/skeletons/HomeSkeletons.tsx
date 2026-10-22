import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerBox, ShimmerCircle, ShimmerText } from '../Shimmer';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

/**
 * Skeleton for Offer Banner Carousel in Home Services.
 */
export const HomeBannerSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();

  return (
    <View style={styles.bannerContainer}>
      <ShimmerBox width="100%" height={150} borderRadius={16} isDark={isDark} />
    </View>
  );
};

/**
 * Skeleton for Category item in Home Services.
 */
export const HomeCategoryCardSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const cardBg = isDark ? '#1C1917' : '#FFFFFF';
  const borderColor = isDark ? '#292524' : '#E7E5E4';

  return (
    <View style={[styles.categoryCard, { backgroundColor: cardBg, borderColor }]}>
      <ShimmerCircle size={44} isDark={isDark} />
      <ShimmerText width={55} height={11} borderRadius={3} style={{ marginTop: 8 }} isDark={isDark} />
    </View>
  );
};

/**
 * Skeleton for 4-item or 8-item Category Grid in Home Services.
 */
export const HomeCategoryGridSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();

  return (
    <View style={styles.categoryGridContainer}>
      <View style={styles.categoryRow}>
        {[1, 2, 3, 4].map((i) => (
          <HomeCategoryCardSkeleton key={`cat-skel-${i}`} isDark={isDark} />
        ))}
      </View>
      <View style={[styles.categoryRow, { marginTop: 10 }]}>
        {[5, 6, 7, 8].map((i) => (
          <HomeCategoryCardSkeleton key={`cat-skel-${i}`} isDark={isDark} />
        ))}
      </View>
    </View>
  );
};

/**
 * Skeleton for a SubService card in SubServiceScreen.
 * Matches exact dimensions from SubServiceScreen.tsx Card.
 */
export const HomeSubServiceCardSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const cardBg = isDark ? '#1C1917' : '#FFFFFF';
  const borderColor = isDark ? '#292524' : '#E7E5E4';

  return (
    <View style={[styles.subServiceCard, { backgroundColor: cardBg, borderColor }]}>
      {/* Top Badges row */}
      <View style={styles.cardTopRow}>
        <ShimmerBox width={60} height={16} borderRadius={6} isDark={isDark} />
        <ShimmerBox width={50} height={16} borderRadius={6} isDark={isDark} />
      </View>

      {/* Title */}
      <ShimmerText width="75%" height={16} borderRadius={4} style={{ marginTop: 8 }} isDark={isDark} />

      {/* Duration and rating */}
      <View style={[styles.rowAlign, { marginTop: 6, gap: 8 }]}>
        <ShimmerBox width={64} height={16} borderRadius={6} isDark={isDark} />
        <ShimmerBox width={48} height={16} borderRadius={6} isDark={isDark} />
      </View>

      {/* Description lines */}
      <ShimmerText width="92%" height={12} borderRadius={3} style={{ marginTop: 8 }} isDark={isDark} />
      <ShimmerText width="65%" height={12} borderRadius={3} style={{ marginTop: 4 }} isDark={isDark} />

      {/* Footer: Price and Add button */}
      <View style={styles.subServiceFooter}>
        <View>
          <ShimmerText width={30} height={10} borderRadius={2} isDark={isDark} />
          <ShimmerBox width={55} height={18} borderRadius={4} style={{ marginTop: 3 }} isDark={isDark} />
        </View>
        <ShimmerBox width={72} height={32} borderRadius={16} isDark={isDark} />
      </View>
    </View>
  );
};

/**
 * List of SubService card skeletons.
 */
export const HomeSubServiceListSkeleton: React.FC<{ count?: number; isDark?: boolean }> = ({
  count = 3,
  isDark: propIsDark,
}) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.subServiceList}>
      {items.map((i) => (
        <HomeSubServiceCardSkeleton key={`sub-skel-${i}`} isDark={isDark} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  categoryGridContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '23%',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  subServiceList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  subServiceCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subServiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
});
