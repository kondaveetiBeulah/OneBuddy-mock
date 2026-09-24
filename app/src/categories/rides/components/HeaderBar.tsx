import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { COLORS, FONTS, GUTTER } from '../theme';

interface HeaderBarProps {
  orderId: string;
  restaurant: string;
  topInset: number;
  onBack?: () => void;
  onHelp?: () => void;
}

export function HeaderBar({
  orderId,
  restaurant,
  topInset,
  onBack,
  onHelp,
}: HeaderBarProps): React.JSX.Element {
  return (
    <View style={[styles.top, { paddingTop: topInset + 10 }]} pointerEvents="box-none">
      <Pressable style={styles.iconBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to orders">
        <Icon name="back" color={COLORS.ink} />
      </Pressable>
      <View style={styles.topTitles}>
        <Text style={styles.topEyebrow}>ORDER {orderId}</Text>
        <Text style={styles.topTitle} numberOfLines={1}>
          {restaurant}
        </Text>
      </View>
      <Pressable
        style={styles.iconBtn}
        onPress={onHelp}
        accessibilityRole="button"
        accessibilityLabel="Help and support"
      >
        <Icon name="help" color={COLORS.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: GUTTER,
    paddingBottom: 18,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#E2ECE0',
    shadowColor: '#182017',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  topTitles: { flex: 1, minWidth: 0 },
  topEyebrow: { color: COLORS.primary, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.2, fontFamily: FONTS.body },
  topTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '700', marginTop: 2, fontFamily: FONTS.display },
});
