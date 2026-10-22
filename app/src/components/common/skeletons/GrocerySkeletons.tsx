import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ShimmerBox, ShimmerCircle, ShimmerText } from '../Shimmer';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

/**
 * Skeleton for Today's Offers Banner carousel in Groceries.
 * Matches OfferCarousel height and margins.
 */
export const GroceryBannerSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();

  return (
    <View style={styles.bannerContainer}>
      <ShimmerBox
        width="100%"
        height={140}
        borderRadius={16}
        isDark={isDark}
      />
    </View>
  );
};

/**
 * Skeleton for a single circular Category item in Groceries.
 */
export const GroceryCategoryItemSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();

  return (
    <View style={styles.categoryItemWrap}>
      <ShimmerCircle size={60} isDark={isDark} />
      <ShimmerText width={48} height={10} borderRadius={3} style={{ marginTop: 6 }} isDark={isDark} />
    </View>
  );
};

/**
 * Skeleton for 2-row "Shop by Category" scroll section in Groceries.
 */
export const GroceryCategoryGridSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();

  return (
    <View style={styles.categorySectionWrap}>
      <View style={styles.sectionHeaderRow}>
        <ShimmerText width={120} height={16} borderRadius={4} isDark={isDark} />
        <ShimmerText width={60} height={14} borderRadius={4} isDark={isDark} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        <View style={styles.categoryColumn}>
          <View style={styles.categoryRow}>
            {[1, 2, 3, 4].map((i) => (
              <GroceryCategoryItemSkeleton key={`row1-${i}`} isDark={isDark} />
            ))}
          </View>
          <View style={[styles.categoryRow, { marginTop: 8 }]}>
            {[1, 2, 3, 4].map((i) => (
              <GroceryCategoryItemSkeleton key={`row2-${i}`} isDark={isDark} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * Skeleton for single Grocery ProductCard.
 * Matches exact dimensions from ProductCard.tsx:
 * width: '48.5%', borderRadius: 14, padding: 10, image height 120.
 */
export const GroceryProductCardSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const cardBg = isDark ? '#18181B' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB';

  return (
    <View style={[styles.gridCard, { backgroundColor: cardBg, borderColor }]}>
      {/* Top Discount Tag Shimmer */}
      <View style={styles.cardDiscountWrap}>
        <ShimmerBox width={46} height={16} borderRadius={6} isDark={isDark} />
      </View>

      {/* Product Image */}
      <ShimmerBox width="100%" height={120} borderRadius={10} isDark={isDark} />

      {/* Details */}
      <View style={styles.detailsContainer}>
        {/* Brand */}
        <ShimmerText width="40%" height={10} borderRadius={3} style={{ marginTop: 8 }} isDark={isDark} />
        {/* Name */}
        <ShimmerText width="85%" height={13} borderRadius={4} style={{ marginTop: 4 }} isDark={isDark} />
        {/* Weight / Pack size */}
        <ShimmerText width="30%" height={10} borderRadius={3} style={{ marginTop: 4 }} isDark={isDark} />

        {/* Rating row */}
        <View style={[styles.rowAlign, { marginTop: 6 }]}>
          <ShimmerBox width={50} height={12} borderRadius={3} isDark={isDark} />
        </View>

        {/* Footer: Price and Add button */}
        <View style={styles.cardFooter}>
          <View>
            <ShimmerBox width={48} height={15} borderRadius={4} isDark={isDark} />
            <ShimmerBox width={32} height={10} borderRadius={3} style={{ marginTop: 3 }} isDark={isDark} />
          </View>
          <ShimmerBox width={56} height={26} borderRadius={8} isDark={isDark} />
        </View>
      </View>
    </View>
  );
};

/**
 * Skeleton for 2x2 or 2-column Grocery Products Grid.
 */
export const GroceryProductGridSkeleton: React.FC<{ count?: number; isDark?: boolean }> = ({
  count = 4,
  isDark: propIsDark,
}) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.productsGrid}>
      {items.map((i) => (
        <GroceryProductCardSkeleton key={`prod-${i}`} isDark={isDark} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categorySectionWrap: {
    marginBottom: 20,
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryColumn: {
    flexDirection: 'column',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  categoryItemWrap: {
    alignItems: 'center',
    width: 68,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  gridCard: {
    width: '48.5%',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    position: 'relative',
  },
  cardDiscountWrap: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
  },
  detailsContainer: {
    flex: 1,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
});
