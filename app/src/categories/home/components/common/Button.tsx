import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  StyleProp,
} from 'react-native';
import { COLORS, RADII, SPACING, SHADOWS } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const getVariantContainerStyle = (): ViewStyle => {
    if (disabled) {
      return {
        backgroundColor: COLORS.border,
        borderColor: 'transparent',
      };
    }
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: COLORS.primary,
          ...SHADOWS.md,
        };
      case 'secondary':
        return {
          backgroundColor: COLORS.secondary,
          ...SHADOWS.md,
        };
      case 'success':
        return {
          backgroundColor: COLORS.success,
          ...SHADOWS.md,
        };
      case 'danger':
        return {
          backgroundColor: COLORS.danger,
          ...SHADOWS.md,
        };
      case 'outline':
        return {
          backgroundColor: COLORS.surface,
          borderWidth: 1.5,
          borderColor: COLORS.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {
          backgroundColor: COLORS.primary,
        };
    }
  };

  const getVariantTextStyle = (): TextStyle => {
    if (disabled) {
      return { color: COLORS.textMuted };
    }
    switch (variant) {
      case 'outline':
      case 'ghost':
        return { color: COLORS.primary, fontWeight: '700' };
      case 'primary':
      case 'secondary':
      case 'success':
      case 'danger':
      default:
        return { color: COLORS.textInverse, fontWeight: '700' };
    }
  };

  const getSizeStyle = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { height: 38, paddingHorizontal: SPACING.md, borderRadius: RADII.md },
          text: { fontSize: 13 },
        };
      case 'lg':
        return {
          container: { height: 54, paddingHorizontal: SPACING.xl, borderRadius: RADII.lg },
          text: { fontSize: 16 },
        };
      case 'md':
      default:
        return {
          container: { height: 46, paddingHorizontal: SPACING.lg, borderRadius: RADII.md },
          text: { fontSize: 15 },
        };
    }
  };

  const sizeStyles = getSizeStyle();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        sizeStyles.container,
        getVariantContainerStyle(),
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.textInverse}
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}
          <Text style={[styles.text, sizeStyles.text, getVariantTextStyle(), textStyle]}>
            {title}
          </Text>
          {rightIcon ? <View style={styles.rightIconContainer}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconContainer: {
    marginRight: SPACING.sm,
  },
  rightIconContainer: {
    marginLeft: SPACING.sm,
  },
  text: {
    letterSpacing: -0.1,
    textAlign: 'center',
  },
});
