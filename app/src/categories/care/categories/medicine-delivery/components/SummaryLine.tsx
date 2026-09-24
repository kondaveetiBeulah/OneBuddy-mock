import React from 'react';
import { Text, View } from 'react-native';
import { COLORS, useMedColors } from '../theme/colors';

interface SummaryLineProps {
  label: string;
  value: string;
  total?: boolean;
  isGreen?: boolean;
  valueColor?: string;
}

export default function SummaryLine({
  label,
  value,
  total = false,
  isGreen = false,
  valueColor,
}: SummaryLineProps) {
  const medColors = useMedColors();
  const greenAccent = medColors.isDark ? '#86EFAC' : COLORS.greenDark;
  const resolvedColor = valueColor || (isGreen ? greenAccent : total ? greenAccent : medColors.ink);

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: total ? 8 : 6,
      }}
    >
      <Text
        style={{
          fontSize: total ? 15.5 : 13.5,
          fontWeight: total ? '800' : '500',
          color: total ? medColors.ink : medColors.inkSoft,
          flex: 1,
          paddingRight: 8,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: total ? 17.5 : 13.5,
          fontWeight: total || isGreen ? '800' : '600',
          color: resolvedColor,
          textAlign: 'right',
        }}
      >
        {value}
      </Text>
    </View>
  );
}
