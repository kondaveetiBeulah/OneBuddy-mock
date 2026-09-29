import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { COLORS, RADII, SPACING } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'sm',
  style,
  textStyle,
  icon,
}) => {
  const getVariantStyles = (): { bg: string; text: string } => {
    switch (variant) {
      case 'success':
        return { bg: COLORS.successLight, text: COLORS.success };
      case 'warning':
        return { bg: COLORS.warningLight, text: COLORS.warning };
      case 'danger':
        return { bg: COLORS.dangerLight, text: COLORS.danger };
      case 'info':
        return { bg: COLORS.secondaryLight, text: COLORS.secondary };
      case 'neutral':
        return { bg: COLORS.surfaceSubtle, text: COLORS.textSecondary };
      case 'primary':
      default:
        return { bg: COLORS.primaryLight, text: COLORS.primary };
    }
  };

  const colors = getVariantStyles();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: isSm ? SPACING.sm : SPACING.md,
          paddingVertical: isSm ? 2 : 4,
          borderRadius: RADII.pill,
        },
        style,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
            fontSize: isSm ? 11 : 13,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
