import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HealthCategory } from '../types/doctor';
import { Colors, useOCColors } from '../constants/colors';

interface HealthCategoryChipProps {
  category: HealthCategory;
  isSelected?: boolean;
  onPress: () => void;
}

export const HealthCategoryChip: React.FC<HealthCategoryChipProps> = ({
  category,
  isSelected = false,
  onPress,
}) => {
  const oc = useOCColors();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected
            ? (oc.isDark ? '#064E3B' : Colors.primaryLight)
            : oc.surface,
          borderColor: isSelected ? Colors.primary : oc.borderSubtle,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isSelected ? Colors.primary : category.bgColor },
        ]}
      >
        <Ionicons
          name={category.iconName as any}
          size={18}
          color={isSelected ? '#FFFFFF' : category.color}
        />
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.nameText,
            { color: isSelected ? (oc.isDark ? '#6EE7B7' : Colors.primaryDark) : oc.textPrimary },
            isSelected && styles.nameTextSelected,
          ]}
          numberOfLines={1}
        >
          {category.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E6EFE4',
    gap: 8,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  nameTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
});
