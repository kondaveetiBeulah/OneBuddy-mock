import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Sparkles, ArrowRight, Tag } from 'lucide-react-native';
import { OfferBanner } from '../../types';
import { COLORS, RADII, SPACING, SHADOWS } from '../../theme';

interface BannerCarouselProps {
  banners: OfferBanner[];
  onBannerPress: (banner: OfferBanner) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;
const ITEM_SPACING = SPACING.md;
const SNAP_INTERVAL = CARD_WIDTH + ITEM_SPACING;

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
  banners,
  onBannerPress,
}) => {
  const [displayIndex, setDisplayIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const currentIndexRef = useRef(0);
  const isUserInteractingRef = useRef(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Append a clone of the first item at the end for seamless continuous forward loop
  const loopBanners = useMemo(() => {
    if (!banners || banners.length <= 1) return banners || [];
    return [...banners, { ...banners[0], id: `${banners[0].id}_clone` }];
  }, [banners]);

  const numRealBanners = banners.length;

  const scrollToNext = useCallback(() => {
    if (isUserInteractingRef.current || numRealBanners <= 1) return;

    const nextIndex = currentIndexRef.current + 1;
    currentIndexRef.current = nextIndex;

    scrollRef.current?.scrollTo({
      x: nextIndex * SNAP_INTERVAL,
      animated: true,
    });

    setDisplayIndex(nextIndex % numRealBanners);

    // If we just scrolled forward to the cloned first banner at the end,
    // seamlessly jump back to real index 0 without animation once transition finishes.
    if (nextIndex >= numRealBanners) {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: 0,
          animated: false,
        });
        currentIndexRef.current = 0;
        setDisplayIndex(0);
      }, 450);
    }
  }, [numRealBanners]);

  // Continuous auto-scroll loop (moves forward one by one)
  useEffect(() => {
    if (numRealBanners <= 1) return;

    const interval = setInterval(scrollToNext, 3500);

    return () => {
      clearInterval(interval);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, [numRealBanners, scrollToNext]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const rawIndex = Math.round(scrollPosition / SNAP_INTERVAL);
    const normalizedIndex = rawIndex % numRealBanners;

    if (rawIndex >= 0 && rawIndex < loopBanners.length) {
      setDisplayIndex(normalizedIndex);
    }
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const rawIndex = Math.round(scrollPosition / SNAP_INTERVAL);

    if (rawIndex >= numRealBanners) {
      // User swiped to the cloned end item — silently snap to real index 0
      scrollRef.current?.scrollTo({
        x: 0,
        animated: false,
      });
      currentIndexRef.current = 0;
      setDisplayIndex(0);
    } else {
      currentIndexRef.current = rawIndex;
      setDisplayIndex(rawIndex);
    }
  };

  const handleScrollBeginDrag = () => {
    isUserInteractingRef.current = true;
  };

  const handleScrollEndDrag = () => {
    setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={32}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {loopBanners.map((banner, index) => (
          <TouchableOpacity
            key={`${banner.id}_${index}`}
            activeOpacity={0.9}
            onPress={() => onBannerPress(banner)}
            style={[
              styles.card,
              {
                backgroundColor: banner.bgColor,
                marginRight: index === loopBanners.length - 1 ? 0 : ITEM_SPACING,
              },
            ]}
          >
            {/* Top Tag & Discount */}
            <View style={styles.topRow}>
              <View style={[styles.tagBadge, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                <Sparkles size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.tagText}>{banner.tag}</Text>
              </View>

              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{banner.discount}</Text>
              </View>
            </View>

            {/* Banner Main Info */}
            <View style={styles.contentArea}>
              <Text style={styles.title} numberOfLines={1}>
                {banner.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {banner.subtitle}
              </Text>
            </View>

            {/* Bottom Promo Code Row */}
            <View style={styles.bottomRow}>
              <View style={styles.codeContainer}>
                <Tag size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.codeText}>Use Code: {banner.code}</Text>
              </View>

              <View style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Book Now</Text>
                <ArrowRight size={14} color={banner.bgColor} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {banners.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === displayIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: RADII.xl,
    padding: SPACING.lg,
    height: 165,
    justifyContent: 'space-between',
    ...SHADOWS.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  discountBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  discountText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  contentArea: {
    marginVertical: SPACING.xs,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 17,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADII.sm,
  },
  codeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    ...SHADOWS.sm,
  },
  actionBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  dot: {
    height: 6,
    borderRadius: RADII.pill,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 20,
    backgroundColor: COLORS.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: COLORS.borderDark,
  },
});
