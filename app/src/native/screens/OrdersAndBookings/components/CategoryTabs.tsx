import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

import { TABS } from '../config';
import { webNoScrollbar } from '../hooks/useHideWebScrollbars';
import { createStyles } from '../styles';
import { TAB_ACTIVE_COLORS, useOrdersColors } from '../theme';
import type { Filter } from '../types';

interface CategoryTabsProps {
  filter: Filter;
  onChange: (filter: Filter) => void;
}

export default function CategoryTabs({ filter, onChange }: CategoryTabsProps) {
  const { colors } = useOrdersColors();
  const styles = createStyles(colors);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabsRow}
      style={styles.tabsScroll}
      {...webNoScrollbar}
    >
      {TABS.map((tab) => {
        const active = tab.key === filter;
        const activeColors = TAB_ACTIVE_COLORS[tab.key];
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.tab,
              active && { backgroundColor: activeColors.bg },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            {tab.emoji ? (
              <Text style={styles.tabEmoji}>{tab.emoji} </Text>
            ) : null}
            <Text
              style={[styles.tabLabel, active && { color: activeColors.fg }]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
