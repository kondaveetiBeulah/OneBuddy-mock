/**
 * components/NonIntrusiveToast.tsx
 * -----------------------------------------------------------------------
 * A floating, non-blocking toast anchored near the bottom of the screen.
 * Reads its content straight from ServicePreferencesContext.
 * -----------------------------------------------------------------------
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useServicePreferences } from '../context/ServicePreferencesContext';
import { colors, radii } from '../theme/colors';
import { useAppTheme } from '@/theme/ThemeContext';

const AUTO_DISMISS_MS = 2000;

const NonIntrusiveToast: React.FC = () => {
  const { toast, dismissToast } = useServicePreferences();
  const { scheme, colors: themeColors } = useAppTheme();
  const isDark = scheme === 'dark';
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!toast) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 16,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 40,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) dismissToast();
      });
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast?.id, dismissToast, opacity, translateY]);

  if (!toast) return null;

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: isDark ? '#1B1626' : '#2D3748',
            borderColor: isDark ? 'rgba(237,234,246,0.14)' : 'rgba(255,255,255,0.15)',
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <View
          style={[
            styles.dot,
            { backgroundColor: themeColors.accentStart || colors.goldLight },
          ]}
        />
        <Text style={styles.text} numberOfLines={2}>
          {toast.message}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '88%',
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 10 },
    }),
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
});

export default NonIntrusiveToast;
