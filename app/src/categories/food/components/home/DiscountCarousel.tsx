import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { OfferBanner } from '../../types';
import { useFoodData } from '../../context/FoodDataContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Tag, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width;
const SLIDE_WIDTH = width - 32;

interface DiscountCarouselProps {
  onSelectRestaurant: (restaurantId: string) => void;
}

export const DiscountCarousel: React.FC<DiscountCarouselProps> = ({ onSelectRestaurant }) => {
  const { banners, isLoading } = useFoodData();
  const originalLength = banners.length;
  // Create 3 sets of data for infinite scrolling illusion
  const loopedData = useMemo(() => {
    if (banners.length === 0) return [];
    return [...banners, ...banners, ...banners];
  }, [banners]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { applyCoupon } = useCart();
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (originalLength > 0) {
      setCurrentIndex(originalLength);
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: originalLength * ITEM_WIDTH,
          animated: false,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [originalLength]);

  // Auto-slide
  useEffect(() => {
    if (!isAutoPlay || originalLength === 0) return;
    
    const timer = setInterval(() => {
      let nextIndex = currentIndex + 1;
      
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * ITEM_WIDTH,
        animated: true,
      });

      // If we reach the end of the second set, wait for animation then silently snap back
      if (nextIndex >= originalLength * 2) {
          setTimeout(() => {
            const resetIndex = nextIndex - originalLength;
            setCurrentIndex(resetIndex);
            flatListRef.current?.scrollToOffset({
              offset: resetIndex * ITEM_WIDTH,
              animated: false
            });
          }, 500);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [currentIndex, isAutoPlay, originalLength]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    let index = Math.round(contentOffset / ITEM_WIDTH);
    
    // Jump back to middle set if scrolling too far left or right
    if (index < originalLength) {
      index += originalLength;
      flatListRef.current?.scrollToOffset({
        offset: index * ITEM_WIDTH,
        animated: false
      });
    } else if (index >= originalLength * 2) {
      index -= originalLength;
      flatListRef.current?.scrollToOffset({
        offset: index * ITEM_WIDTH,
        animated: false
      });
    }
    
    setCurrentIndex(index);
    setIsAutoPlay(true); // Resume autoplay after user interaction
  };

  const handleScrollBeginDrag = () => {
    setIsAutoPlay(false);
  };

  const handleBannerPress = (restaurantId: string, code: string) => {
    applyCoupon(code);
    onSelectRestaurant(restaurantId);
  };

  const scrollNext = () => {
    setIsAutoPlay(false);
    let nextIndex = currentIndex + 1;
    
    setCurrentIndex(nextIndex);
    flatListRef.current?.scrollToOffset({
      offset: nextIndex * ITEM_WIDTH,
      animated: true,
    });

    if (nextIndex >= originalLength * 2) {
      setTimeout(() => {
        const resetIndex = nextIndex - originalLength;
        setCurrentIndex(resetIndex);
        flatListRef.current?.scrollToOffset({
          offset: resetIndex * ITEM_WIDTH,
          animated: false
        });
        setIsAutoPlay(true);
      }, 350);
    } else {
      setIsAutoPlay(true);
    }
  };

  const scrollPrev = () => {
    setIsAutoPlay(false);
    let prevIndex = currentIndex - 1;
    
    setCurrentIndex(prevIndex);
    flatListRef.current?.scrollToOffset({
      offset: prevIndex * ITEM_WIDTH,
      animated: true,
    });

    if (prevIndex < originalLength) {
      setTimeout(() => {
        const resetIndex = prevIndex + originalLength;
        setCurrentIndex(resetIndex);
        flatListRef.current?.scrollToOffset({
          offset: resetIndex * ITEM_WIDTH,
          animated: false
        });
        setIsAutoPlay(true);
      }, 350);
    } else {
      setIsAutoPlay(true);
    }
  };

  // Ensure FlatList starts at the middle set on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: originalLength * ITEM_WIDTH,
        animated: false
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const renderItem = ({ item }: { item: OfferBanner; index: number }) => (
    <View style={{ width: ITEM_WIDTH, paddingHorizontal: 16 }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleBannerPress(item.restaurantId, item.code)}
        style={[styles.bannerCard, { width: '100%' }]}
      >
      <LinearGradient
        colors={item.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      >
        <View style={styles.leftContent}>
          <View style={styles.badge}>
            <Sparkles size={11} color="#ECFCCB" />
            <Text style={styles.badgeText}>{item.discountBadge}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>{item.subtitle}</Text>
          <View style={styles.codePill}>
            <Tag size={10} color="#65A30D" />
            <Text style={styles.codeText}>Code: {item.code}</Text>
          </View>
        </View>
        <View style={styles.imageWrap}>
          <Image source={{ uri: item.image }} style={styles.image} />
        </View>
      </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (banners.length === 0) {
    if (isLoading) {
      return (
        <View style={[styles.wrapper, { height: 180, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator color="#65A30D" />
        </View>
      );
    }
    return null;
  }

  const activeIndicatorIndex = currentIndex % originalLength;

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={loopedData}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
        initialScrollIndex={originalLength}
        windowSize={11}
        initialNumToRender={loopedData.length}
        maxToRenderPerBatch={loopedData.length}
        removeClippedSubviews={false}
      />

      <View style={styles.indicatorRow}>
        {banners.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === activeIndicatorIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
    position: 'relative',
  },
  scrollContent: {
  },
  bannerCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  gradientBg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 140,
  },
  leftContent: {
    flex: 1,
    marginRight: 12,
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201, 162, 39, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ECFCCB',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 21,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 11,
    color: '#E5E7EB',
    lineHeight: 14,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.4)',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 4,
    marginTop: 2,
  },
  codeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#ECFCCB',
    fontWeight: 'bold',
  },
  imageWrap: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  navBtn: {
    position: 'absolute',
    top: '40%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  navBtnLeft: {
    left: 20,
  },
  navBtnRight: {
    right: 20,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#65A30D',
  },
});

