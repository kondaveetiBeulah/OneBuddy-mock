import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useRideTheme } from '../theme';

type Props = {
  title: string;
  onBack: () => void;
  isDark?: boolean;
};

export default function ProfileHeader({ title, onBack, isDark: isDarkProp }: Props) {
  const theme = useRideTheme();
  const isDark = isDarkProp ?? theme.isDark;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }, isDark && { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}>
      <TouchableOpacity
        onPress={onBack}
        style={[styles.backButton, isDark && { backgroundColor: '#1D1E22' }]}
        accessibilityLabel="Back"
      >
        <Ionicons name="arrow-back" size={22} color={isDark ? '#F1F1EC' : '#1e293b'} />
      </TouchableOpacity>
      <Text style={[styles.title, isDark && { color: '#F1F1EC' }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
});
