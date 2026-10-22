import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  StyleProp,
  DimensionValue,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

export interface ShimmerProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  duration?: number;
  isDark?: boolean;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  children,
  duration = 1400,
  isDark: propIsDark,
}) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue, duration]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidth) {
      setContainerWidth(w);
    }
  };

  const sweepWidth = containerWidth > 0 ? containerWidth : 300;
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-sweepWidth, sweepWidth * 1.5],
  });

  const baseColor = isDark ? '#27272A' : '#E5E7EB';
  const highlightColor = isDark ? '#3F3F46' : '#F3F4F6';

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            width: sweepWidth * 1.2,
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {children}
    </View>
  );
};

export const ShimmerBox: React.FC<ShimmerProps> = (props) => <Shimmer {...props} />;

export const ShimmerCircle: React.FC<{ size: number; style?: StyleProp<ViewStyle>; isDark?: boolean }> = ({
  size,
  style,
  isDark,
}) => (
  <Shimmer
    width={size}
    height={size}
    borderRadius={size / 2}
    style={style}
    isDark={isDark}
  />
);

export const ShimmerText: React.FC<{
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  isDark?: boolean;
}> = ({
  width = '80%',
  height = 14,
  borderRadius = 4,
  style,
  isDark,
}) => (
  <Shimmer
    width={width}
    height={height}
    borderRadius={borderRadius}
    style={style}
    isDark={isDark}
  />
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
});
