import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { BRAND_IMAGES, schemes, type Service } from '@/design/tokens';
import { useAppTheme } from '@/theme/ThemeContext';

interface CategoryCardProps {
  service: Service;
  wide?: boolean;
  isFlipped?: boolean;
  onPress?: () => void;
  onExplore?: () => void;
}

export default function CategoryCard({
  service,
  wide = false,
  isFlipped = false,
  onPress,
  onExplore,
}: CategoryCardProps) {
  const { scheme } = useAppTheme();
  const tokens = schemes[scheme];

  const animatedValue = useRef(new Animated.Value(isFlipped ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFlipped ? 1 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, animatedValue]);

  // Interpolate 3D horizontal rotation (Y-axis)
  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  // Cross-fade opacity at 90° flip midpoint to prevent bleeding on Android
  const frontOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 0.5001, 1],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = animatedValue.interpolate({
    inputRange: [0, 0.4999, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  const frontAnimatedStyle = {
    transform: [{ perspective: 1200 }, { rotateY: frontInterpolate }],
    opacity: frontOpacity,
  };

  const backAnimatedStyle = {
    transform: [{ perspective: 1200 }, { rotateY: backInterpolate }],
    opacity: backOpacity,
  };

  const iconSource = BRAND_IMAGES.icons3d[service.id];
  const photoSource = BRAND_IMAGES.cards[service.id];

  return (
    <View
      style={[
        styles.wrap,
        {
          aspectRatio: wide ? 1.48 : 0.68,
          shadowColor: tokens.shadow(0.5),
        },
      ]}
    >
      {/* Front Face (3D Gradient Card) */}
      <Animated.View style={[styles.cardFace, frontAnimatedStyle]}>
        <Pressable
          accessibilityLabel={`${service.label}. Tap to flip card or explore.`}
          onPress={onPress}
          style={styles.cardPressable}
        >
          <LinearGradient
            colors={service.gradient}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[styles.gradientCard, wide && styles.wideGradientCard]}
          >
            <View style={styles.cardContent}>
              <Image
                source={iconSource}
                style={wide ? styles.wideIcon3d : styles.icon3d}
                resizeMode="contain"
              />

              <Text style={[styles.title, wide && styles.wideTitle]}>{service.label}</Text>

              <Text
                style={[styles.blurb, wide && styles.wideBlurb]}
                numberOfLines={wide ? 2 : 3}
              >
                {service.blurb}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Explore ${service.label}`}
              onPress={(e) => {
                e.stopPropagation();
                if (onExplore) {
                  onExplore();
                } else if (onPress) {
                  onPress();
                }
              }}
              style={({ pressed }) => [
                styles.exploreButton,
                pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
              ]}
            >
              <Text style={styles.exploreText}>Explore →</Text>
            </Pressable>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Back Face (Photo Card with Frosted Glass Label) */}
      <Animated.View style={[styles.cardFace, backAnimatedStyle]}>
        <Pressable
          accessibilityLabel={`${service.label} photo preview. Tap to flip card.`}
          onPress={onPress}
          style={styles.cardPressable}
        >
          <View style={styles.photoContainer}>
            {/* Background realistic photo filling card properly */}
            <Image
              source={photoSource}
              style={styles.photoImage}
              resizeMode="cover"
            />

            {/* Bottom shadow scrim */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.75)']}
              style={styles.scrim}
            />

            {/* Frosted glass label pill at bottom left */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${service.label}`}
              onPress={(e) => {
                e.stopPropagation();
                if (onExplore) {
                  onExplore();
                } else if (onPress) {
                  onPress();
                }
              }}
              style={({ pressed }) => [
                styles.frostedLabel,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.frostedEmoji}>{service.emoji}</Text>
              <Text style={styles.frostedText}>{service.label}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: 22,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    overflow: 'hidden',
  },
  cardPressable: {
    flex: 1,
    borderRadius: 22,
  },
  gradientCard: {
    flex: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 12,
  },
  wideGradientCard: {
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  icon3d: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  wideIcon3d: {
    width: 66,
    height: 66,
    marginBottom: 6,
  },
  title: {
    fontWeight: '800',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  wideTitle: {
    fontSize: 24,
    marginBottom: 4,
  },
  blurb: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  wideBlurb: {
    fontSize: 13.5,
    lineHeight: 18,
    maxWidth: '85%',
    textAlign: 'center',
  },
  exploreButton: {
    alignSelf: 'center',
    paddingVertical: 7.5,
    paddingHorizontal: 22,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    marginTop: 8,
  },
  exploreText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  photoContainer: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  photoImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  frostedLabel: {
    marginBottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  frostedEmoji: {
    fontSize: 16,
  },
  frostedText: {
    fontWeight: '700',
    fontSize: 14.5,
    color: '#FFFFFF',
    textShadow: '0px 1px 3px rgba(0, 0, 0, 0.6)',
  },
});
