import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet } from "react-native";
import { useAppTheme } from "@/theme/ThemeContext";
import { useResponsive } from "@/utils/responsive";

interface ToggleSwitchProps {
  /** Current on/off state — this is a controlled component. */
  value: boolean;
  /** Fired on tap; parent owns the state change. */
  onValueChange: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

/** Base dimensions (unscaled) — everything else derives from these. */
const BASE = {
  trackWidth: 50,
  trackHeight: 30,
  thumbSize: 24
} as const;

/**
 * A fully custom, animated on/off toggle.
 *
 * Replaces the native <Switch> so styling stays 100% consistent across
 * iOS/Android/web, scales with screen size via `useResponsive`, and
 * gives clear pressed/disabled/checked states for accessibility tools.
 */
export function ToggleSwitch({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false
}: ToggleSwitchProps) {
  const { colors } = useAppTheme();
  const { moderateScale } = useResponsive();

  // 0 = off, 1 = on — drives both track color and thumb position.
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;
  // Subtle "squeeze" feedback while the thumb is actively pressed.
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false // color/layout interpolation can't use the native driver
    }).start();
  }, [value, progress]);

  // When the theme changes, the interpolated colors become stale.
  // Snap to the current value (no animation) so the new palette is picked up.
  useEffect(() => {
    progress.setValue(value ? 1 : 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors]);

  const trackWidth = moderateScale(BASE.trackWidth, 0.25);
  const trackHeight = moderateScale(BASE.trackHeight, 0.25);
  const thumbSize = moderateScale(BASE.thumbSize, 0.25);
  const thumbInset = (trackHeight - thumbSize) / 2;

  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.toggleOff, colors.accentStart]
  });

  const thumbTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [thumbInset, trackWidth - thumbSize - thumbInset]
  });

  const animatePress = (toValue: number) => {
    Animated.spring(pressScale, {
      toValue,
      useNativeDriver: false,
      speed: 40,
      bounciness: 6
    }).start();
  };

  return (
    <Pressable
      onPress={disabled ? undefined : onValueChange}
      onPressIn={disabled ? undefined : () => animatePress(0.88)}
      onPressOut={disabled ? undefined : () => animatePress(1)}
      disabled={disabled}
      hitSlop={10}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      style={disabled ? styles.disabled : undefined}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: trackWidth,
            height: trackHeight,
            borderRadius: trackHeight / 2,
            backgroundColor: trackColor
          }
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: colors.toggleThumb,
              transform: [{ translateX: thumbTranslateX }, { scale: pressScale }]
            }
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    justifyContent: "center"
  },
  thumb: {
    position: "absolute",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  disabled: {
    opacity: 0.4
  }
});
