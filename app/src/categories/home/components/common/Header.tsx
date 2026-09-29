import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { ArrowLeft, MoreVertical, X } from 'lucide-react-native';
import { useHomeTheme, SPACING, RADII } from '../../theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  isClose?: boolean;
  style?: StyleProp<ViewStyle>;
  titleColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  showBack = true,
  rightAction,
  isClose = false,
  style,
  titleColor: titleColorProp,
}) => {
  const { colors } = useHomeTheme();
  const titleColor = titleColorProp ?? colors.textPrimary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
        style,
      ]}
    >
      <View style={styles.leftRow}>
        {showBack && onBack ? (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }]}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {isClose ? (
              <X size={22} color={colors.textPrimary} />
            ) : (
              <ArrowLeft size={22} color={colors.textPrimary} />
            )}
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleContainer}>
          {title ? (
            <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightAction ? (
        <View style={styles.rightContainer}>{rightAction}</View>
      ) : (
        <View style={styles.rightPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
    fontWeight: '500',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightPlaceholder: {
    width: 24,
  },
});
