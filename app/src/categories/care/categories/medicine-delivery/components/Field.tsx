import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { styles } from '../theme/styles';

interface FieldProps {
  label: string;
  defaultValue: string;
}

export default function Field({ label, defaultValue }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput defaultValue={defaultValue} style={styles.fieldInput} />
    </View>
  );
}
