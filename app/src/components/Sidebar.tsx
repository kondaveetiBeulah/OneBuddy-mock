import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brand, schemes } from '@/design/tokens';
import { useAppTheme } from '@/theme/ThemeContext';
import { useProfile } from '@/context/ProfileContext';
import BuddyAvatar from '@/components/BuddyAvatar';

const WIDTH = 280;

export interface SidebarItem {
  icon: string;
  label: string;
  onPress?: () => void;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  profileName: string;
  onEditProfile: () => void;
  items: readonly SidebarItem[];
}

/**
 * The old `.sidebar` was `right: -300px` -> `right: 0` on a 0.3s transition.
 * Here it is a translateX that a drag can also drive, so the panel follows
 * the finger instead of only snapping — the one place the native version is
 * meaningfully better than the CSS it replaces.
 */
export default function Sidebar({
  open,
  onClose,
  profileName,
  onEditProfile,
  items,
}: SidebarProps) {
  const { scheme } = useAppTheme();
  const tokens = schemes[scheme];
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  const slide = useRef(new Animated.Value(WIDTH)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: open ? 0 : WIDTH,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [open, slide]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        // Only claim the gesture once it is clearly a rightward drag, so
        // vertical scrolling inside the panel still works.
        onMoveShouldSetPanResponder: (_event, gesture) =>
          gesture.dx > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_event, gesture) => {
          slide.setValue(Math.max(0, Math.min(WIDTH, gesture.dx)));
        },
        onPanResponderRelease: (_event, gesture) => {
          const shouldClose = gesture.dx > WIDTH / 3 || gesture.vx > 0.5;
          if (shouldClose) {
            onClose();
          } else {
            Animated.timing(slide, {
              toValue: 0,
              duration: 180,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [onClose, slide]
  );

  const overlayOpacity = slide.interpolate({
    inputRange: [0, WIDTH],
    outputRange: [1, 0],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'auto' : 'none'}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: tokens.shadow(0.35), opacity: overlayOpacity },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
      </Animated.View>

      <Animated.View
        {...pan.panHandlers}
        style={[
          styles.panel,
          {
            width: WIDTH,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            backgroundColor: tokens.surface1,
            borderLeftColor: tokens.ink(0.05),
            transform: [{ translateX: slide }],
          },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: tokens.ink(0.05) }]}>
          <Text style={[styles.brandText, { color: tokens.text }]}>
            One<Text style={{ color: brand.gold }}>Buddy</Text>
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
            <Text style={[styles.close, { color: tokens.textDim }]}>×</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onEditProfile}
          accessibilityRole="button"
          style={[styles.profile, { borderBottomColor: tokens.ink(0.08) }]}
        >
          <BuddyAvatar
            size={42}
            styleId={profile.style}
            color={profile.color}
            borderRadius={14}
          />
          <View>
            <Text style={[styles.profileName, { color: tokens.text }]}>
              {profile.name || profileName}
            </Text>
            <Text style={styles.profileEdit}>Edit profile ›</Text>
          </View>
        </Pressable>

        <ScrollView style={styles.nav} contentContainerStyle={{ paddingBottom: 16 }}>
          {items.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.item,
                pressed && { backgroundColor: tokens.ink(0.05) },
              ]}
            >
              <Text style={styles.itemIcon}>{item.icon}</Text>
              <Text style={[styles.itemLabel, { color: tokens.text }]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.footer, { color: tokens.textDim }]}>v1.0 · Made with 💛</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    borderLeftWidth: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  brandText: { fontSize: 20, fontWeight: '700' },
  close: { fontSize: 26, lineHeight: 28 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: brand.lavenderLight,
  },
  profileName: { fontSize: 15, fontWeight: '600' },
  profileEdit: { fontSize: 12.5, color: brand.gold, marginTop: 2 },
  nav: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
  },
  itemIcon: { fontSize: 20 },
  itemLabel: { fontWeight: '500', fontSize: 15 },
  footer: { padding: 24, textAlign: 'center', fontSize: 12 },
});
