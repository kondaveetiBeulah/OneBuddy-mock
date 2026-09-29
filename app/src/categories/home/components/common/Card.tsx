import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useHomeTheme, RADII, SPACING, SHADOWS } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
  activeOpacity?: number;
  padding?: keyof typeof SPACING;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
  activeOpacity = 0.75,
  padding = 'lg',
}) => {
  const { colors, isDark } = useHomeTheme();

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'flat':
        return {
          backgroundColor: colors.surfaceSubtle,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)',
          ...SHADOWS.md,
        };
    }
  };

  const containerStyle: ViewStyle = {
    padding: SPACING[padding],
    borderRadius: RADII.lg,
    ...getVariantStyle(),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onPress}
        style={[styles.container, containerStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.container, containerStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
