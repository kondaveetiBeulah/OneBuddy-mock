import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useGroceryColors } from '../theme/colors';
import { typography, spacing } from '../theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const colors = useGroceryColors();

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary': return { backgroundColor: colors.primary };
      case 'secondary': return { backgroundColor: colors.secondary };
      case 'outline': return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
      case 'text': return { backgroundColor: 'transparent' };
      case 'danger': return { backgroundColor: colors.danger };
      default: return { backgroundColor: colors.primary };
    }
  };

  const getTextColorStyle = (): TextStyle => {
    switch (variant) {
      case 'outline': return { color: colors.primary };
      case 'text': return { color: colors.primary };
      default: return { color: colors.white };
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small': return { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md };
      case 'large': return { paddingVertical: spacing.md, paddingHorizontal: spacing.xl };
      default: return { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg };
    }
  };

  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'small': return { fontSize: typography.sizes.sm };
      case 'large': return { fontSize: typography.sizes.lg };
      default: return { fontSize: typography.sizes.md };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        getVariantStyle(),
        getSizeStyle(),
        disabled ? styles.disabledContainer : {},
        style as ViewStyle,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={(variant === 'outline' || variant === 'text' ? colors.primary : colors.white) as string}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, getTextColorStyle(), getTextSizeStyle(), textStyle as TextStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: spacing.borderRadius.md,
    gap: spacing.xs,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  text: {
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
});
