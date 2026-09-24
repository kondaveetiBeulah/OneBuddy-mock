import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileHeader from '../../components/ProfileHeader';
import { SettingsState } from '../../types';

type Props = {
  onBack: () => void;
};

const LANGUAGES: SettingsState['language'][] = ['English', 'Telugu', 'Hindi'];

export default function SettingsScreen({ onBack }: Props) {
  const [settings, setSettings] = useState<SettingsState>({
    notifications: true,
    darkMode: false,
    language: 'English',
  });

  const toggle = (key: 'notifications' | 'darkMode') => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectLanguage = (language: SettingsState['language']) => {
    setSettings((prev) => ({ ...prev, language }));
  };

  return (
    <View style={styles.container}>
      <ProfileHeader title="Settings" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={18} color="#64748b" />
          <Text style={styles.rowLabel}>Notifications</Text>
          <Switch
            value={settings.notifications}
            onValueChange={() => toggle('notifications')}
            trackColor={{ false: '#cbd5e1', true: '#54B713' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.row}>
          <Ionicons name="moon-outline" size={18} color="#64748b" />
          <Text style={styles.rowLabel}>Dark mode</Text>
          <Switch
            value={settings.darkMode}
            onValueChange={() => toggle('darkMode')}
            trackColor={{ false: '#cbd5e1', true: '#54B713' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="globe-outline" size={18} color="#64748b" />
          <Text style={styles.sectionTitle}>Language</Text>
        </View>

        {LANGUAGES.map((language) => (
          <TouchableOpacity
            key={language}
            style={styles.languageRow}
            onPress={() => selectLanguage(language)}
          >
            <Text style={styles.languageLabel}>{language}</Text>
            {settings.language === language && (
              <Ionicons name="checkmark" size={18} color="#54B713" />
            )}
          </TouchableOpacity>
        ))}
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
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 18, paddingBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingLeft: 28,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  languageLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
});
