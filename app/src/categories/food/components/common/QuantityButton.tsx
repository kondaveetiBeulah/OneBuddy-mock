import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Minus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface QuantityButtonProps {
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const QuantityButton: React.FC<QuantityButtonProps> = ({
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  size = 'md',
  fullWidth = false,
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  if (quantity === 0) {
    return (
      <TouchableOpacity
        onPress={onAdd}
        activeOpacity={0.8}
        style={[styles.addBtnContainer, fullWidth && { width: '100%' }]}
      >
        <View
          style={[
            styles.addBtn,
            isSm && styles.addBtnSm,
            isLg && styles.addBtnLg,
          ]}
        >
          <Text style={[styles.addText, isSm && { fontSize: 11 }, isLg && { fontSize: 15 }]}>
            Add
          </Text>
          <Plus size={isSm ? 12 : isLg ? 16 : 14} color="#65A30D" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.stepperContainer,
        isSm && styles.stepperSm,
        isLg && styles.stepperLg,
        fullWidth && { width: '100%' },
      ]}
    >
      <TouchableOpacity
        onPress={onDecrement}
        activeOpacity={0.7}
        style={styles.stepBtn}
      >
        <Minus size={isSm ? 12 : isLg ? 16 : 14} color="#65A30D" />
      </TouchableOpacity>

      <Text style={[styles.qtyText, isSm && { fontSize: 12 }, isLg && { fontSize: 16 }]}>
        {quantity}
      </Text>

      <TouchableOpacity
        onPress={onIncrement}
        activeOpacity={0.7}
        style={styles.stepBtn}
      >
        <Plus size={isSm ? 12 : isLg ? 16 : 14} color="#65A30D" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  addBtnContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#65A30D',
  },
  addBtnSm: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  addBtnLg: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  addText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#65A30D',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#65A30D',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 90,
  },
  stepperSm: {
    minWidth: 76,
    paddingVertical: 2,
  },
  stepperLg: {
    minWidth: 110,
    paddingVertical: 6,
  },
  stepBtn: {
    padding: 4,
  },
  qtyText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#4D7C0F',
    paddingHorizontal: 6,
  },
});

