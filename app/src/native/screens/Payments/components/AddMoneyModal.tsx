import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { styles } from '../theme/styles';
import { COLORS } from '../theme/colors';
import { QUICK_ADD_AMOUNTS } from '../data/mockData';

export function AddMoneyModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [selectedChip, setSelectedChip] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const amount = customAmount ? parseFloat(customAmount) : selectedChip ?? 0;
  const isValid = amount > 0;

  const reset = () => {
    setSelectedChip(null);
    setCustomAmount('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(amount);
    reset();
  };

  return (
    <BottomSheet visible={visible} title="Add money" onClose={handleClose}>
      <Text style={styles.inputLabel}>QUICK AMOUNTS</Text>
      <View style={styles.chipRow}>
        {QUICK_ADD_AMOUNTS.map((amt) => (
          <TouchableOpacity
            key={amt}
            style={[styles.chip, selectedChip === amt && styles.chipActive]}
            onPress={() => {
              setSelectedChip(amt);
              setCustomAmount('');
            }}
          >
            <Text style={[styles.chipText, selectedChip === amt && styles.chipTextActive]}>
              {'\u20b9'}
              {amt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.inputLabel}>OR ENTER CUSTOM AMOUNT</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter amount"
        placeholderTextColor={COLORS.grayDim}
        keyboardType="numeric"
        value={customAmount}
        onChangeText={(text) => {
          setCustomAmount(text.replace(/[^0-9.]/g, ''));
          setSelectedChip(null);
        }}
      />

      <TouchableOpacity
        style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
        disabled={!isValid}
        onPress={handleConfirm}
      >
        <Text style={styles.primaryBtnText}>
          {isValid ? `Add \u20b9${amount.toLocaleString('en-IN')}` : 'Enter an amount'}
        </Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}
