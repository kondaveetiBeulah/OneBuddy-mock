import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { styles } from '../theme/styles';
import { COLORS } from '../theme/colors';
import { UpiHandle } from '../types';

export function UpiDetailModal({
  visible,
  handle,
  onClose,
  onSetDefault,
  onRemove,
}: {
  visible: boolean;
  handle: UpiHandle | null;
  onClose: () => void;
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (!handle) return null;
  return (
    <BottomSheet visible={visible} title="UPI ID" onClose={onClose}>
      <View style={styles.detailKeyRow}>
        <Text style={styles.detailKey}>VPA</Text>
        <Text style={styles.detailValue}>{handle.vpa}</Text>
      </View>
      <View style={[styles.detailKeyRow, { borderBottomWidth: 0 }]}>
        <Text style={styles.detailKey}>Status</Text>
        <Text style={styles.detailValue}>{handle.isDefault ? 'Default' : 'Active'}</Text>
      </View>

      {!handle.isDefault && (
        <TouchableOpacity style={styles.primaryBtn} onPress={() => onSetDefault(handle.id)}>
          <Text style={styles.primaryBtnText}>Set as default</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => onRemove(handle.id)}>
        <Text style={styles.dangerBtnText}>Remove UPI ID</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

export function AddUpiModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (vpa: string) => void;
}) {
  const [vpa, setVpa] = React.useState('');
  const isValid = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(vpa.trim());

  const handleClose = () => {
    setVpa('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} title="Add UPI ID" onClose={handleClose}>
      <Text style={styles.inputLabel}>UPI ID</Text>
      <TextInputStub value={vpa} onChangeText={setVpa} placeholder="yourname@bank" />
      <TouchableOpacity
        style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
        disabled={!isValid}
        onPress={() => {
          onAdd(vpa.trim());
          setVpa('');
        }}
      >
        <Text style={styles.primaryBtnText}>Link UPI ID</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

function TextInputStub({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={COLORS.grayDim}
      autoCapitalize="none"
      value={value}
      onChangeText={onChangeText}
    />
  );
}
