import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { styles } from '../theme/styles';
import { useMedColors } from '../theme/colors';
import { CartIcon } from './UiIcons';

interface HeaderBarProps {
  title: string;
  sub?: string;
  onBack?: () => void;
  onHelp?: () => void;
  onCart?: () => void;
  cartCount?: number;
}

export default function HeaderBar({ title, sub, onBack, onHelp, onCart, cartCount }: HeaderBarProps) {
  const medColors = useMedColors();

  return (
    <View style={[styles.header, { backgroundColor: medColors.card, borderBottomWidth: 1, borderBottomColor: medColors.line }]}>
      {onBack && (
        <TouchableOpacity
          style={[
            styles.iconBtn,
            {
              backgroundColor: medColors.isDark ? '#334155' : '#FFFFFF',
              borderColor: medColors.isDark ? '#64748B' : medColors.line,
            },
          ]}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Back"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19l-7-7 7-7"
              stroke={medColors.isDark ? '#FFFFFF' : medColors.ink}
              strokeWidth={2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      )}

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={[styles.headerTitle, { color: medColors.ink }]} numberOfLines={1}>
          {title}
        </Text>
        {sub ? (
          <Text style={[styles.headerSub, { color: medColors.inkSoft }]} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>

      {onHelp && (
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: medColors.surface2, borderColor: medColors.line }]} onPress={onHelp} activeOpacity={0.7}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: medColors.ink }}>?</Text>
        </TouchableOpacity>
      )}

      {onCart && (
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: medColors.surface2, borderColor: medColors.line }]} onPress={onCart} activeOpacity={0.7}>
          <CartIcon size={19} color={medColors.ink} />
          {!!cartCount && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
