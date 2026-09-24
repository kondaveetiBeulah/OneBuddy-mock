import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../theme/colors';
import { styles } from '../theme/styles';

interface QtyControlProps {
  id: string;
  qty: number;
  onChange: (id: string, delta: number) => void;
  accent?: string;
}

export default function QtyControl({ id, qty, onChange, accent = COLORS.green }: QtyControlProps) {
  if (qty === 0) {
    return (
      <TouchableOpacity
        style={[styles.addBtn, { borderColor: accent }]}
        onPress={() => onChange(id, 1)}
        activeOpacity={0.75}
      >
        <Text style={[styles.addBtnText, { color: accent }]}>ADD +</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.qtyStepper, { backgroundColor: accent }]}>
      <TouchableOpacity
        onPress={() => onChange(id, -1)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
        style={{ paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={styles.qtyStepperBtn}>−</Text>
      </TouchableOpacity>
      <Text style={styles.qtyStepperVal}>{qty}</Text>
      <TouchableOpacity
        onPress={() => onChange(id, 1)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
        style={{ paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={styles.qtyStepperBtn}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
