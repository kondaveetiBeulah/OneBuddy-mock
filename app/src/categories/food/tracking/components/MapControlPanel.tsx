import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { FONTS } from '../theme';

export interface MapControlPanelProps {
  /** Whether the map camera is currently auto-following the driver */
  autoFollow: boolean;
  /** Callback triggered when user toggles the auto-follow mode */
  onToggleAutoFollow: (enabled: boolean) => void;
  /** Callback to fit map bounds to the entire route */
  onFitRoute: () => void;
  /** Bottom offset above the bottom sheet (default: 14) */
  bottomOffset?: number;
  /** Optional container style override */
  style?: StyleProp<ViewStyle>;
}

export function MapControlPanel({
  autoFollow,
  onToggleAutoFollow,
  onFitRoute,
  bottomOffset = 14,
  style,
}: MapControlPanelProps): React.JSX.Element {
  return (
    <View style={[styles.container, { bottom: bottomOffset, pointerEvents: 'box-none' as any }, style]}>
      <View style={styles.pillContainer}>
        {/* 1. Auto-Follow Button */}
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            autoFollow ? styles.btnActive : styles.btnInactive,
            pressed && styles.btnPressed,
          ]}
          onPress={() => onToggleAutoFollow(true)}
          accessibilityRole="button"
          accessibilityLabel="Auto-follow driver"
        >
          {/* Target / Crosshair Icon */}
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle
              cx={12}
              cy={12}
              r={7.5}
              stroke={autoFollow ? '#FFFFFF' : '#182017'}
              strokeWidth={2}
            />
            <Circle
              cx={12}
              cy={12}
              r={3}
              fill={autoFollow ? '#FFFFFF' : '#38A819'}
            />
            <Path
              d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"
              stroke={autoFollow ? '#FFFFFF' : '#182017'}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
          <Text style={[styles.btnText, autoFollow ? styles.btnTextActive : styles.btnTextInactive]}>
            Auto-Follow
          </Text>
        </Pressable>

        {/* 2. Fit Route Button */}
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            !autoFollow ? styles.btnActiveSecondary : styles.btnInactive,
            pressed && styles.btnPressed,
          ]}
          onPress={() => {
            onToggleAutoFollow(false);
            onFitRoute();
          }}
          accessibilityRole="button"
          accessibilityLabel="Fit entire route on screen"
        >
          {/* Diagonal expand arrows: ⤢ */}
          <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
              stroke="#182017"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={[styles.btnText, styles.btnTextInactive]}>
            Fit Route
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2ECE0',
    shadowColor: '#182017',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    gap: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 7,
  },
  btnActive: {
    backgroundColor: '#38A819',
  },
  btnActiveSecondary: {
    backgroundColor: 'transparent',
  },
  btnInactive: {
    backgroundColor: 'transparent',
  },
  btnPressed: {
    opacity: 0.75,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.display,
  },
  btnTextActive: {
    color: '#FFFFFF',
  },
  btnTextInactive: {
    color: '#182017',
  },
});
