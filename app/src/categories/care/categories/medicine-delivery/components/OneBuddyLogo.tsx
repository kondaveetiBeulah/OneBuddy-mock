import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, useMedColors } from '../theme/colors';

interface OneBuddyLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export default function OneBuddyLogo({ size = 'md' }: OneBuddyLogoProps) {
  const medColors = useMedColors();
  const titleSize = size === 'sm' ? 20 : size === 'lg' ? 26 : 22;
  const subSize = size === 'sm' ? 12 : size === 'lg' ? 15 : 13.5;

  return (
    <View style={styles.container}>
      {/* Brand Name: OneBuddy without logo image */}
      <View style={styles.brandRow}>
        <Text style={[styles.brandOne, { fontSize: titleSize, color: medColors.ink }]}>One</Text>
        <Text style={[styles.brandBuddy, { fontSize: titleSize, color: medColors.isDark ? '#4ADE80' : COLORS.green }]}>Buddy</Text>
      </View>
      {/* Followed by Medicine Delivery: clearly visible in dark mode */}
      <Text style={[styles.deliveryText, { fontSize: subSize, color: medColors.ink }]}>
        Medicine Delivery
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandOne: {
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  brandBuddy: {
    fontWeight: '900',
    color: COLORS.green,
    letterSpacing: -0.5,
  },
  deliveryText: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
