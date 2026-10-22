import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileHeader from '../../components/ProfileHeader';
import { INITIAL_SAVED_PLACES } from '../../data';
import { SavedPlace } from '../../types';

type Props = {
  onBack: () => void;
};

const iconFor = (icon: SavedPlace['icon']) => {
  if (icon === 'home') return 'home-outline';
  if (icon === 'briefcase') return 'briefcase-outline';
  return 'location-outline';
};

export default function SavedPlacesScreen({ onBack }: Props) {
  const [places, setPlaces] = useState<SavedPlace[]>(INITIAL_SAVED_PLACES);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');

  const addPlace = () => {
    if (!label.trim() || !address.trim()) return;
    setPlaces((prev) => [...prev, { id: `s${Date.now()}`, label: label.trim(), address: address.trim(), icon: 'pin' }]);
    setLabel('');
    setAddress('');
    setShowForm(false);
  };

  const removePlace = (id: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <View style={styles.container}>
      <ProfileHeader title="Saved places" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {places.length === 0 && !showForm && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            <Ionicons name="bookmark-outline" size={40} color="#94a3b8" style={{ marginBottom: 10 }} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 4 }}>No Saved Places</Text>
            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center' }}>Add your frequent destinations for faster booking.</Text>
          </View>
        )}
        {places.map((place) => (
          <View key={place.id} style={styles.row}>
            <Ionicons name={iconFor(place.icon) as any} size={18} color="#64748b" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{place.label}</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {place.address}
              </Text>
            </View>
            <TouchableOpacity onPress={() => removePlace(place.id)} accessibilityLabel="Remove place">
              <Ionicons name="trash-outline" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        ))}

        {showForm ? (
          <View style={styles.form}>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Label (e.g. Gym)"
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Address"
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />
            <View style={styles.formButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={addPlace}>
                <Text style={styles.saveButtonText}>Save place</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={16} color="#475569" />
            <Text style={styles.addButtonText}>Add a place</Text>
          </TouchableOpacity>
        )}
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
  rowTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  rowSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
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
  form: { marginTop: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#D3ECD0', backgroundColor: '#FFFFFF' },
  input: {
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 10,
  },
  formButtons: { flexDirection: 'row', gap: 8, marginTop: 4 },
  saveButton: { flex: 1, paddingVertical: 12, borderRadius: 24, backgroundColor: '#54B713', alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: { color: '#475569', fontWeight: '700', fontSize: 14 },
});
