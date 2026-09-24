import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../theme';
import type { RideType } from '../../types/tracking';

interface RideTypeSelectorProps {
  currentType: RideType;
  onSelect: (type: RideType) => void;
}

export function RideTypeSelector({
  currentType,
  onSelect,
}: RideTypeSelectorProps): React.JSX.Element {
  const options: { type: RideType; label: string; icon: string }[] = [
    { type: 'auto', label: 'Auto', icon: '🛺' },
    { type: 'cab', label: 'Cab', icon: '🚗' },
    { type: 'bike', label: 'Bike', icon: '🏍️' },
  ];

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isSelected = currentType === opt.type;
        return (
          <Pressable
            key={opt.type}
            style={[styles.segment, isSelected && styles.segmentSelected]}
            onPress={() => onSelect(opt.type)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={styles.icon}>{opt.icon}</Text>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.sheet,
    padding: 4,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.xl,
    gap: 6,
  },
  segmentSelected: {
    backgroundColor: COLORS.primary, // OneBuddy signature vibrant green (#54B713)
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.inkSecondary,
    fontFamily: FONTS.display,
  },
  labelSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
