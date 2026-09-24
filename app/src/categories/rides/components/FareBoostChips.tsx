import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

interface Props {
  boostAmount: number;
  onSelectBoost: (amount: number) => void;
}

const BOOST_OPTIONS = [20, 30, 40, 50, 60];

const FareBoostChips = ({ boostAmount, onSelectBoost }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Increase your chances of getting a ride faster</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {BOOST_OPTIONS.map((amount) => {
          const isSelected = boostAmount === amount;
          return (
            <TouchableOpacity
              key={amount}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onSelectBoost(isSelected ? 0 : amount)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                +₹{amount}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SIZES.medium,
  },
  title: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: SIZES.small,
    marginHorizontal: SIZES.medium,
  },
  scrollContent: {
    paddingHorizontal: SIZES.medium,
    gap: SIZES.small,
  },
  chip: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: SIZES.small,
  },
  chipSelected: {
    backgroundColor: COLORS.accentTint,
    borderColor: COLORS.accent,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: COLORS.accent,
  },
});

export default FareBoostChips;
