import React, { useEffect, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProfilePageKey } from '../types';
import PaymentMethodsScreen from './profile/PaymentMethodsScreen';
import SavedPlacesScreen from './profile/SavedPlacesScreen';
import HelpSupportScreen from './profile/HelpSupportScreen';
import SettingsScreen from './profile/SettingsScreen';
import RideHistoryScreen from './PreviousRidesScreen';

import { useRideTheme } from '../theme';

const MENU_ITEMS: { key: ProfilePageKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'payment', label: 'Payment methods', icon: 'card-outline' },
  { key: 'history', label: 'Ride history', icon: 'time-outline' },
  { key: 'places', label: 'Saved places', icon: 'location-outline' },
  { key: 'help', label: 'Help & support', icon: 'help-circle-outline' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline' },
];

// Exposed so the parent App can reset this screen back to its list
// whenever the user switches away from the Profile tab and back.
export type ProfileScreenHandle = {
  resetToList: () => void;
};

type Props = {
  resetKey?: number; // bump this from the parent to force the list view
  isDark?: boolean;
};

export default function ProfileScreen({ resetKey, isDark: isDarkProp }: Props) {
  const theme = useRideTheme();
  const isDark = isDarkProp ?? theme.isDark;
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState<ProfilePageKey>(null);

  // Whenever resetKey changes (parent switched tabs away and back), show the list again.
  useEffect(() => {
    setPage(null);
  }, [resetKey]);

  // Handle hardware back button when inside a profile sub-page
  useEffect(() => {
    if (!page) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setPage(null);
      return true;
    });
    return () => sub.remove();
  }, [page]);

  if (page === 'payment') return <PaymentMethodsScreen onBack={() => setPage(null)} />;
  if (page === 'history') return <RideHistoryScreen isDark={isDark} />;
  if (page === 'places') return <SavedPlacesScreen onBack={() => setPage(null)} />;
  if (page === 'help') return <HelpSupportScreen onBack={() => setPage(null)} />;
  if (page === 'settings') return <SettingsScreen onBack={() => setPage(null)} />;

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#121214' }]}>
      <View style={[styles.avatarSection, { paddingTop: Math.max(insets.top, 16) + 10 }]}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={34} color="#fff" />
        </View>
        <Text style={[styles.name, isDark && { color: '#F1F1EC' }]}>Rider</Text>
        <Text style={[styles.location, isDark && { color: '#9BA08F' }]}>Hyderabad, India</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.row, isDark && { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}
            onPress={() => setPage(item.key)}
          >
            <Ionicons name={item.icon} size={18} color={isDark ? '#66D21E' : '#64748b'} />
            <Text style={[styles.rowLabel, isDark && { color: '#F1F1EC' }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#9BA08F' : '#94a3b8'} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FCF7' },
  avatarSection: { alignItems: 'center', paddingTop: 28, paddingBottom: 20 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#54B713',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#54B713',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  name: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  location: { fontSize: 13, color: '#64748b', marginTop: 2 },
  list: { paddingHorizontal: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1e293b' },
});
