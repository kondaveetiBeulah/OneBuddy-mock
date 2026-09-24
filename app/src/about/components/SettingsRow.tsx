// components/SettingsRow.tsx
// A single tappable (or static) row inside the "About" card:
// icon chip on the left, title/subtitle in the middle,
// and either a chevron (navigable) or a value (static) on the right.

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { useColors, useTypography, spacing, radius } from '../theme/theme';

interface SettingsRowProps {
  icon: React.ReactNode;
  iconBackground: string;
  title: string;
  subtitle?: string;
  /** Shown on the right instead of a chevron, e.g. "1.0.0" */
  value?: string;
  /** If provided, row becomes tappable and shows a chevron */
  onPress?: (event: GestureResponderEvent) => void;
  showDivider?: boolean;
}

export default function SettingsRow({
  icon,
  iconBackground,
  title,
  subtitle,
  value,
  onPress,
  showDivider = true,
}: SettingsRowProps) {
  const colors = useColors();
  const typography = useTypography();

  const ChevronRight = () => (
    <Text style={[styles.chevronText, { color: colors.chevron }]}>{'\u203A'}</Text>
  );
  
  const styles = React.useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    iconChip: {
      width: 44,
      height: 44,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    textBlock: {
      flex: 1,
    },
    subtitleSpacing: {
      marginTop: 2,
    },
    chevronText: {
      fontSize: 24,
      fontWeight: '400' as const,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: spacing.md + 44 + spacing.md, // align under text, not icon
    },
  }), [colors]);
  
  const isNavigable = typeof onPress === 'function';

  const content = (
    <View style={styles.row}>
      <View style={[styles.iconChip, { backgroundColor: iconBackground }]}>
        {icon}
      </View>

      <View style={styles.textBlock}>
        <Text style={typography.rowTitle}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.rowSubtitle, styles.subtitleSpacing]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {value ? (
        <Text style={typography.rowValue}>{value}</Text>
      ) : isNavigable ? (
        <ChevronRight />
      ) : null}
    </View>
  );

  return (
    <View>
      {isNavigable ? (
        <TouchableOpacity
          activeOpacity={0.65}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={title}
        >
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
      {showDivider && <View style={styles.divider} />}
    </View>
  );
}
