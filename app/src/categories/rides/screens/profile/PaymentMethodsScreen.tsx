import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileHeader from '../../components/ProfileHeader';
import { INITIAL_PAYMENT_METHODS } from '../../data';
import { PaymentMethod } from '../../types';

type Props = {
  onBack: () => void;
};

export default function PaymentMethodsScreen({ onBack }: Props) {
  const [methods, setMethods] = useState<PaymentMethod[]>(INITIAL_PAYMENT_METHODS);

  const setDefault = (id: string) => {
    setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
  };

  const addMethod = () => {
    const cardNumber = Math.floor(1000 + Math.random() * 9000);
    setMethods((prev) => [
      ...prev,
      { id: `p${Date.now()}`, label: `Card ending ${cardNumber}`, isDefault: false },
    ]);
  };

  return (
    <View style={styles.container}>
      <ProfileHeader title="Payment methods" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {methods.map((method) => (
          <TouchableOpacity key={method.id} style={styles.row} onPress={() => setDefault(method.id)}>
            <Ionicons name="card-outline" size={18} color="#64748b" />
            <Text style={styles.rowLabel}>{method.label}</Text>
            {method.isDefault ? (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            ) : (
              <Text style={styles.setDefaultText}>Set default</Text>
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addMethod}>
          <Ionicons name="add" size={16} color="#475569" />
          <Text style={styles.addButtonText}>Add payment method</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FCF7' },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1e293b' },
  defaultBadge: { backgroundColor: '#EAF7E4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: '#D3ECD0' },
  defaultBadgeText: { color: '#54B713', fontWeight: '800', fontSize: 11 },
  setDefaultText: { color: '#94a3b8', fontWeight: '600', fontSize: 12 },
  addButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#54B713',
    backgroundColor: '#F2FAF0',
  },
  addButtonText: { color: '#54B713', fontWeight: '800', fontSize: 14 },
});
