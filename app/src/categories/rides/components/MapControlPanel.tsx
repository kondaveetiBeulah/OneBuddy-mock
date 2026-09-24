import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS, FONTS } from '../theme';

export interface MapControlPanelProps {
  /** Whether the map camera is currently auto-following the driver */
  autoFollow: boolean;
  /** Callback triggered when user toggles the auto-follow mode */
  onToggleAutoFollow: (enabled: boolean) => void;
  /** Callback to fit map bounds to the entire route (origin, driver, destination) */
  onFitRoute: () => void;
  /** Optional handler to play or pause simulated movement */
  onTogglePlay?: () => void;
  /** Optional handler to reset driver back to origin */
  onReset?: () => void;
  /** Bottom offset above the bottom sheet (default: 16) */
  bottomOffset?: number;
  /** Optional container style override */
  style?: StyleProp<ViewStyle>;
}

export function MapControlPanel({
  autoFollow,
  onToggleAutoFollow,
  onFitRoute,
  onTogglePlay: _onTogglePlay,
  onReset: _onReset,
  bottomOffset = 16,
  style,
}: MapControlPanelProps): React.JSX.Element {
  // Pulsing animation for active auto-follow status indicator
  const beaconPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!autoFollow) return undefined;
    const pulse = Animated.loop(
      Animated.timing(beaconPulse, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    pulse.start();
    return () => pulse.stop();
  }, [autoFollow, beaconPulse]);

  return (
    <View style={[styles.floatingBar, { bottom: bottomOffset }, style]}>
      {/* 1. Auto-Follow Driver Button */}
      <Pressable
        style={({ pressed }) => [
          styles.actionBtn,
          autoFollow ? styles.btnActive : styles.btnInactive,
          pressed && styles.btnPressed,
        ]}
        onPress={() => onToggleAutoFollow(!autoFollow)}
        accessibilityRole="button"
        accessibilityLabel={autoFollow ? 'Auto-follow is ON. Tap to disable.' : 'Auto-follow is OFF. Tap to enable.'}
      >
        <View style={styles.iconWrap}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Circle
              cx={12}
              cy={12}
              r={9}
              stroke={autoFollow ? '#FFFFFF' : COLORS.ink}
              strokeWidth={2}
            />
            <Circle
              cx={12}
              cy={12}
              r={3.5}
              fill={autoFollow ? '#FFFFFF' : COLORS.primary}
            />
            <Path
              d="M12 2v3M12 19v3M2 12h3M19 12h3"
              stroke={autoFollow ? '#FFFFFF' : COLORS.ink}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
          {autoFollow && (
            <Animated.View
              style={[
                styles.beaconHalo,
                {
                  transform: [
                    {
                      scale: beaconPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.2],
                      }),
                    },
                  ],
                  opacity: beaconPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 0],
                  }),
                },
              ]}
            />
          )}
        </View>
        <Text style={[styles.btnText, autoFollow && styles.btnTextActive]}>
          Auto-Follow
        </Text>
      </Pressable>

      {/* Subtle Vertical Divider */}
      <View style={styles.verticalDivider} />

      {/* 2. Fit Entire Route Button */}
      <Pressable
        style={({ pressed }) => [
          styles.actionBtn,
          styles.btnInactive,
          pressed && styles.btnPressed,
        ]}
        onPress={onFitRoute}
        accessibilityRole="button"
        accessibilityLabel="Fit entire route on map"
      >
        <View style={styles.iconWrap}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
              stroke={COLORS.ink}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={styles.btnText}>Fit Route</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingBar: {
    position: 'absolute',
    alignSelf: 'center', // Centered horizontally in the middle of the page
    flexDirection: 'row', // Both in one line
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 30, // Sleek rounded pill
    borderWidth: 1,
    borderColor: '#E2EBE0',
    shadowColor: '#182017',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 25,
    paddingVertical: 4,
    paddingHorizontal: 5,
    gap: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  btnInactive: {
    backgroundColor: 'transparent',
  },
  btnActive: {
    backgroundColor: COLORS.primary,
  },
  btnPressed: {
    opacity: 0.75,
  },
  iconWrap: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  beaconHalo: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    fontFamily: FONTS.display,
  },
  btnTextActive: {
    color: '#FFFFFF',
  },
  verticalDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E4ECE2',
    marginHorizontal: 1,
  },
});
