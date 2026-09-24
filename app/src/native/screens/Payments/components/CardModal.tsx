import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { styles } from '../theme/styles';
import { COLORS } from '../theme/colors';
import { SavedCard } from '../types';

export function CardDetailModal({
  visible,
  card,
  onClose,
  onSetDefault,
  onRemove,
}: {
  visible: boolean;
  card: SavedCard | null;
  onClose: () => void;
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (!card) return null;
  return (
    <BottomSheet visible={visible} title="Saved card" onClose={onClose}>
      <View style={styles.detailKeyRow}>
        <Text style={styles.detailKey}>Card</Text>
        <Text style={styles.detailValue}>
          {card.brand} {'\u2022\u2022\u2022\u2022'} {card.last4}
        </Text>
      </View>
      <View style={styles.detailKeyRow}>
        <Text style={styles.detailKey}>Expires</Text>
        <Text style={styles.detailValue}>{card.expiry}</Text>
      </View>
      <View style={[styles.detailKeyRow, { borderBottomWidth: 0 }]}>
        <Text style={styles.detailKey}>Status</Text>
        <Text style={styles.detailValue}>{card.isDefault ? 'Default' : 'Active'}</Text>
      </View>

      {!card.isDefault && (
        <TouchableOpacity style={styles.primaryBtn} onPress={() => onSetDefault(card.id)}>
          <Text style={styles.primaryBtnText}>Set as default</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => onRemove(card.id)}>
        <Text style={styles.dangerBtnText}>Remove card</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

export function AddCardModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (card: { number: string; expiry: string; name: string }) => void;
}) {
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [name, setName] = useState('');

  const isValid = number.replace(/\s/g, '').length >= 12 && /^\d{2}\/\d{2}$/.test(expiry) && name.trim().length > 1;

  const reset = () => {
    setNumber('');
    setExpiry('');
    setName('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <BottomSheet visible={visible} title="Add new card" onClose={handleClose}>
      <Text style={styles.inputLabel}>CARD NUMBER</Text>
      <TextInput
        style={styles.input}
        placeholder="1234 5678 9012 3456"
        placeholderTextColor={COLORS.grayDim}
        keyboardType="numeric"
        value={number}
        onChangeText={setNumber}
      />
      <Text style={styles.inputLabel}>EXPIRY (MM/YY)</Text>
      <TextInput
        style={styles.input}
        placeholder="08/28"
        placeholderTextColor={COLORS.grayDim}
        value={expiry}
        onChangeText={setExpiry}
      />
      <Text style={styles.inputLabel}>NAME ON CARD</Text>
      <TextInput
        style={styles.input}
        placeholder="As printed on card"
        placeholderTextColor={COLORS.grayDim}
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity
        style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
        disabled={!isValid}
        onPress={() => {
          onAdd({ number, expiry, name });
          reset();
        }}
      >
        <Text style={styles.primaryBtnText}>Save card</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}
