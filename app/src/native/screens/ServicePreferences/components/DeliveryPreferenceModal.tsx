/**
 * components/DeliveryPreferenceModal.tsx
 * -----------------------------------------------------------------------
 * A bottom-sheet modal that lets the user pick one delivery mode
 * (radio-style, single-select) for whichever service pill was tapped.
 * -----------------------------------------------------------------------
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeliveryMode } from '../types';
import { colors, radii, spacing } from '../theme/colors';
import { useAppTheme } from '@/theme/ThemeContext';

interface DeliveryPreferenceModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: DeliveryMode[];
  selected: DeliveryMode;
  onSelect: (mode: DeliveryMode) => void;
  onClose: () => void;
}

const DeliveryPreferenceModal: React.FC<DeliveryPreferenceModalProps> = ({
  visible,
  title,
  subtitle,
  options,
  selected,
  onSelect,
  onClose,
}) => {
  const { scheme, colors: themeColors } = useAppTheme();
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateY.setValue(400);
      backdropOpacity.setValue(0);
    }
  }, [visible, translateY, backdropOpacity]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 400,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? '#181422' : '#FFFFFF',
              borderColor: isDark ? colors.sheetBorderTop : themeColors.border,
              paddingBottom: insets.bottom + spacing.xl,
              transform: [{ translateY }],
            },
          ]}
        >
          <View
            style={[
              styles.grabber,
              { backgroundColor: isDark ? 'rgba(237,234,246,0.18)' : 'rgba(0,0,0,0.15)' },
            ]}
          />

          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#fff' : themeColors.text }]}>
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? colors.mistDim : themeColors.textSecondary },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.optionsCard,
              {
                backgroundColor: isDark ? colors.cardSurface : themeColors.cardBg,
                borderColor: isDark ? colors.cardBorder : themeColors.border,
              },
            ]}
          >
            {options.map((mode, index) => {
              const isSelected = mode === selected;
              return (
                <Pressable
                  key={mode}
                  onPress={() => {
                    onSelect(mode);
                    handleClose();
                  }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    {
                      borderBottomColor: isDark ? colors.rowBorder : themeColors.divider,
                    },
                    index === options.length - 1 && styles.optionRowLast,
                    pressed && {
                      backgroundColor: isDark ? colors.rowHover : themeColors.cardBgAlt,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: isDark ? colors.mist : themeColors.text },
                      isSelected && {
                        color: isDark ? '#fff' : themeColors.accentStart,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {mode}
                  </Text>
                  <View
                    style={[
                      styles.radioOuter,
                      {
                        borderColor: isSelected
                          ? themeColors.accentStart
                          : isDark
                          ? 'rgba(237,234,246,0.28)'
                          : 'rgba(0,0,0,0.25)',
                      },
                    ]}
                  >
                    {isSelected ? (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: themeColors.accentStart },
                        ]}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[
              styles.cancelBtn,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                borderColor: isDark ? 'rgba(237,234,246,0.10)' : themeColors.border,
              },
            ]}
            onPress={handleClose}
          >
            <Text
              style={[
                styles.cancelText,
                { color: isDark ? colors.mist : themeColors.text },
              ]}
            >
              Cancel
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlayScrim,
  },
  sheet: {
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderTopWidth: 1,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  optionsCard: {
    borderWidth: 1,
    borderRadius: radii.card,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
  optionLabel: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radii.row,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DeliveryPreferenceModal;
