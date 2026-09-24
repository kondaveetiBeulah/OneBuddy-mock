import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { FONTS } from '../../theme';

interface LocationSharingBannerProps {
  enabled: boolean;
  onToggle: () => void;
  topInset?: number;
}

export function LocationSharingBanner({
  enabled,
  onToggle,
  topInset = 0,
}: LocationSharingBannerProps): React.JSX.Element {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.banner,
        { paddingTop: topInset > 0 ? topInset + 4 : 8 },
        enabled ? styles.bannerEnabled : styles.bannerDisabled,
        pressed && styles.pressed,
      ]}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={
        enabled
          ? 'Location sharing is active. Tap to manage.'
          : 'Location sharing disabled. Tap here to enable.'
      }
    >
      <View style={styles.contentRow}>
        {/* Location Pin inside Circle Icon matching reference */}
        <View style={styles.iconWrap}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke="#000000" strokeWidth={2} />
            <Circle cx={12} cy={12} r={3} fill="#000000" />
            <Path d="M12 21 L12 15" stroke="#000000" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </View>

        {/* Text */}
        <Text style={styles.text} numberOfLines={1}>
          {enabled
            ? 'Location sharing active with your driver'
            : 'Location sharing disabled. Tap here to enable'}
        </Text>

        {/* Chevron Right */}
        <View style={styles.chevron}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18l6-6-6-6" stroke="#000000" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 30,
  },
  bannerDisabled: {
    backgroundColor: '#FAB818', // Authentic Uber alert yellow from reference
  },
  bannerEnabled: {
    backgroundColor: '#10B981',
  },
  pressed: {
    opacity: 0.85,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    color: '#000000',
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: -0.1,
    fontFamily: FONTS.body,
  },
  chevron: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
