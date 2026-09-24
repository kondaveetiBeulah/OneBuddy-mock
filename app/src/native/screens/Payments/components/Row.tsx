import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../theme/styles';
import { ChevronRightIcon } from '../icons';
import { COLORS } from '../theme/colors';

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Row({
  icon,
  title,
  subtitle,
  badge,
  onPress,
  showChevron,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  onPress?: () => void;
  showChevron?: boolean;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper activeOpacity={0.7} onPress={onPress} style={styles.row}>
      {!!icon && <View style={styles.rowIconWrap}>{icon}</View>}
      <View style={styles.rowTextWrap}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {title}
          </Text>
          {!!badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        {!!subtitle && (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {showChevron && <ChevronRightIcon size={18} color={COLORS.grayDim} />}
    </Wrapper>
  );
}
