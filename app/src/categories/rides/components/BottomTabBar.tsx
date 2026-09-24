import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabKey } from '../types';

type Props = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  isDark?: boolean;
};

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'ride', label: 'Home', icon: 'home-outline' },
  { key: 'previous', label: 'Previous Rides', icon: 'time-outline' },
  { key: 'profile', label: 'Profile', icon: 'person-outline' },
];

export default function BottomTabBar({ activeTab, onChange, isDark }: Props) {
  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: isDark ? '#1D1E22' : '#FFFFFF',
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        const color = isActive ? '#54B713' : isDark ? '#9BA08F' : '#94a3b8';
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onChange(tab.key)}
            accessibilityLabel={tab.label}
          >
            <Ionicons name={tab.icon} size={20} color={color} />
            <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
});
