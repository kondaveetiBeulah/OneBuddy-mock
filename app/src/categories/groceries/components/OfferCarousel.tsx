import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Offer } from '../types/offer.types';
import { OfferBanner } from './OfferBanner';
import { colors, spacing } from '../theme';

interface OfferCarouselProps {
  data: Offer[];
  onPress?: (offer: Offer) => void;
  autoPlayInterval?: number;
}

interface ExtendedOffer extends Offer {
  _uniqueCarouselKey: string;
}

const CARD_MARGIN = 12;

export const OfferCarousel: React.FC<OfferCarouselProps> = ({
  data,
  onPress,
  autoPlayInterval = 3500,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<ExtendedOffer>>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInteractingRef = useRef(false);
  const isAnimatingRef = useRef(false);

  // Responsive card width calculation
  const cardWidth = Math.min(windowWidth - spacing.md * 2, 420);
  const snapInterval = cardWidth + CARD_MARGIN;

  // Build extended data with cloned first and last items for seamless infinite looping
  const extendedData = useMemo<ExtendedOffer[]>(() => {
    if (!data || data.length === 0) return [];
    if (data.length === 1) {
      return [{ ...data[0], _uniqueCarouselKey: `single-${data[0].id || '0'}` }];
    }
    const lastClone: ExtendedOffer = {
      ...data[data.length - 1],
      _uniqueCarouselKey: `clone-start-${data[data.length - 1].id || 'last'}`,
    };
    const firstClone: ExtendedOffer = {
      ...data[0],
      _uniqueCarouselKey: `clone-end-${data[0].id || '0'}`,
    };
    const originalItems: ExtendedOffer[] = data.map((item, idx) => ({
      ...item,
      _uniqueCarouselKey: `item-${item.id || idx}`,
    }));

    return [lastClone, ...originalItems, firstClone];
  }, [data]);

  // Current index in extendedData (starts at 1 when data > 1)
  const currentIndexRef = useRef(data && data.length > 1 ? 1 : 0);

  // Helper to map extended index to original data index
  const getRealIndex = useCallback(
    (extIndex: number) => {
      if (!data || data.length <= 1) return 0;
      if (extIndex <= 0) return data.length - 1;
      if (extIndex >= data.length + 1) return 0;
      return extIndex - 1;
    },
    [data]
  );

  // Silent reset when reaching clone boundaries
  const checkAndResetBoundary = useCallback(
    (extIndex: number) => {
      if (!data || data.length <= 1) return;

      if (extIndex >= data.length + 1) {
        // We reached the cloned first banner at the end -> silently jump to real first banner (index 1)
        currentIndexRef.current = 1;
        setActiveIndex(0);
        flatListRef.current?.scrollToOffset({
          offset: 1 * snapInterval,
          animated: false,
        });
      } else if (extIndex <= 0) {
        // We reached the cloned last banner at the beginning -> silently jump to real last banner
        currentIndexRef.current = data.length;
        setActiveIndex(data.length - 1);
        flatListRef.current?.scrollToOffset({
          offset: data.length * snapInterval,
          animated: false,
        });
      }
    },
    [data, snapInterval]
  );

  // Scroll to a specific extended index
  const scrollToExtendedIndex = useCallback(
    (targetExtIndex: number, animated = true) => {
      if (!extendedData || extendedData.length === 0) return;

      currentIndexRef.current = targetExtIndex;
      setActiveIndex(getRealIndex(targetExtIndex));

      flatListRef.current?.scrollToOffset({
        offset: targetExtIndex * snapInterval,
        animated,
      });

      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }

      if (animated && data.length > 1) {
        isAnimatingRef.current = true;
        // Wait for smooth scroll animation to finish before silently resetting boundary
        resetTimerRef.current = setTimeout(() => {
          isAnimatingRef.current = false;
          checkAndResetBoundary(currentIndexRef.current);
        }, 600);
      }
    },
    [extendedData, snapInterval, getRealIndex, data.length, checkAndResetBoundary]
  );

  const startAutoPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!data || data.length <= 1) return;

    timerRef.current = setInterval(() => {
      if (isInteractingRef.current || isAnimatingRef.current) return;
      const nextExtIndex = currentIndexRef.current + 1;
      scrollToExtendedIndex(nextExtIndex, true);
    }, autoPlayInterval);
  }, [data, autoPlayInterval, scrollToExtendedIndex]);

  const stopAutoPlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Initial scroll position setup
  useEffect(() => {
    if (data && data.length > 1) {
      currentIndexRef.current = 1;
      setActiveIndex(0);
      const initTimer = setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: 1 * snapInterval,
          animated: false,
        });
      }, 50);
      return () => clearTimeout(initTimer);
    }
  }, [snapInterval, data]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      stopAutoPlay();
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [startAutoPlay, stopAutoPlay]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const computedIndex = Math.round(offsetX / snapInterval);
    if (computedIndex >= 0 && computedIndex < extendedData.length) {
      const realIdx = getRealIndex(computedIndex);
      if (realIdx !== activeIndex) {
        setActiveIndex(realIdx);
      }
    }
  };

  const handleScrollBeginDrag = () => {
    isInteractingRef.current = true;
    stopAutoPlay();
  };

  const handleScrollEndDrag = () => {
    isInteractingRef.current = false;
    startAutoPlay();
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const computedExtIndex = Math.round(offsetX / snapInterval);
    currentIndexRef.current = computedExtIndex;
    setActiveIndex(getRealIndex(computedExtIndex));
    checkAndResetBoundary(computedExtIndex);
    isInteractingRef.current = false;
    isAnimatingRef.current = false;
    startAutoPlay();
  };

  const handleDotPress = (dotIndex: number) => {
    stopAutoPlay();
    // In extended list, real index i corresponds to extended index i + 1
    const targetExtIndex = dotIndex + 1;
    scrollToExtendedIndex(targetExtIndex, true);
    startAutoPlay();
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.carouselWrapper}>
        <FlatList
          ref={flatListRef}
          data={extendedData}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={snapInterval}
          decelerationRate="fast"
          snapToAlignment="start"
          style={styles.flatList}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => item._uniqueCarouselKey}
          initialScrollIndex={data.length > 1 ? 1 : 0}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          getItemLayout={(_, index) => ({
            length: snapInterval,
            offset: snapInterval * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset({
              offset: info.index * snapInterval,
              animated: false,
            });
          }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.itemWrapper,
                {
                  width: cardWidth,
                  marginRight: CARD_MARGIN,
                },
              ]}
            >
              <OfferBanner
                offer={item}
                bannerWidth={cardWidth}
                onPress={onPress}
              />
            </View>
          )}
        />
      </View>

      {/* Pagination Dots Indicator */}
      {data.length > 1 && (
        <View style={styles.paginationContainer}>
          {data.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <TouchableOpacity
                key={item.id || index.toString()}
                onPress={() => handleDotPress(index)}
                activeOpacity={0.7}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  carouselWrapper: {
    position: 'relative',
  },
  flatList: {
    scrollBehavior: 'smooth',
  } as any,
  listContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  itemWrapper: {
    justifyContent: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    transitionProperty: 'all',
    transitionDuration: '350ms',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  } as any,
  dotActive: {
    width: 22,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.borderLight,
  },
});

