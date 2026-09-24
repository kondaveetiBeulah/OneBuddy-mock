import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon, { type IconName } from './Icon';
import { COLORS, FONTS, GUTTER, RADIUS, useRideTheme } from '../theme';

/* --------------------------------------------------------------- list row */

interface RowProps {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  chevron?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Row({ icon, title, subtitle, onPress, chevron = true, style }: RowProps): React.JSX.Element {
  const { isDark } = useRideTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        isDark && {
          backgroundColor: '#1D1E22',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        },
        pressed && (isDark ? { backgroundColor: '#24262B' } : styles.rowPressed),
        style,
      ]}
    >
      {icon ? (
        <View style={[styles.rowIcon, isDark && { backgroundColor: 'rgba(84, 183, 19, 0.18)', borderColor: 'rgba(84,183,19,0.3)' }]}>
          <Icon name={icon} size={17} color={COLORS.primary} />
        </View>
      ) : null}
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, isDark && { color: '#F1F1EC' }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSub, isDark && { color: '#9BA08F' }]}>{subtitle}</Text> : null}
      </View>
      {chevron ? <Icon name="chevron" size={17} color={isDark ? '#9BA08F' : '#8EA28C'} strokeWidth={2.4} /> : null}
    </Pressable>
  );
}

/* ------------------------------------------------------------ bottom sheet */

interface SheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Sheet({ visible, title, onClose, children }: SheetProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { isDark } = useRideTheme();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Close" />
      <Animated.View
        style={[
          styles.sheet,
          isDark && {
            backgroundColor: '#1D1E22',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
          {
            paddingBottom: 22 + insets.bottom,
            transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          },
        ]}
      >
        <View style={styles.sheetHead}>
          <Text style={[styles.sheetTitle, isDark && { color: '#F1F1EC' }]}>{title}</Text>
          <Pressable
            onPress={onClose}
            style={[styles.sheetClose, isDark && { backgroundColor: '#24262B' }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Icon name="close" size={14} color={isDark ? '#F1F1EC' : COLORS.ink} strokeWidth={2.4} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </Animated.View>
    </Modal>
  );
}

/* -------------------------------------------------------------------- toast */

export function Toast({ message }: { message: string | null }): React.JSX.Element | null {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: message ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [message, fade]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          opacity: fade,
          transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

/* --------------------------------------------------------------- stage rail */

export function StageRail({ labels, index }: { labels: string[]; index: number }): React.JSX.Element {
  return (
    <View style={styles.rail} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: labels.length, now: index + 1 }}>
      {labels.map((label, i) => {
        const done = i < index;
        const now = i === index;
        return (
          <View key={label} style={styles.step}>
            <View style={styles.stepTrackRow}>
              <View style={[styles.stepTrack, { opacity: i === 0 ? 0 : 1 }, (done || now) && styles.stepTrackOn]} />
              <View style={[styles.stepTrack, { opacity: i === labels.length - 1 ? 0 : 1 }, done && styles.stepTrackOn]} />
            </View>
            <View style={[styles.dot, done && styles.dotDone, now && styles.dotNow]} />
            <Text style={[styles.stepLabel, now && styles.stepLabelNow]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    shadowColor: '#182017',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  rowPressed: { backgroundColor: '#F3FAF0' },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(84,183,19,0.22)',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '600', fontFamily: FONTS.body },
  rowSub: { color: COLORS.mistDim, fontSize: 12, marginTop: 3, fontFamily: FONTS.body },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(18,28,18,0.45)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '84%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: GUTTER,
    paddingTop: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '700', fontFamily: FONTS.display },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F6EE',
  },

  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 30,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    backgroundColor: '#1E281C',
    borderWidth: 1,
    borderColor: 'rgba(84,183,19,0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', textAlign: 'center', fontFamily: FONTS.body },

  rail: { flexDirection: 'row', marginBottom: 20 },
  step: { flex: 1, alignItems: 'center', paddingTop: 18 },
  stepTrackRow: { position: 'absolute', top: 6, left: 0, right: 0, flexDirection: 'row' },
  stepTrack: { flex: 1, height: 2, backgroundColor: '#E4ECE2' },
  stepTrackOn: { backgroundColor: COLORS.primary },
  dot: {
    position: 'absolute',
    top: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD9C9',
  },
  dotDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dotNow: { backgroundColor: '#FFFFFF', borderColor: COLORS.primary, borderWidth: 3.5 },
  stepLabel: {
    color: COLORS.mistDim,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 2,
    fontFamily: FONTS.body,
  },
  stepLabelNow: { color: COLORS.ink, fontWeight: '700' },
});
