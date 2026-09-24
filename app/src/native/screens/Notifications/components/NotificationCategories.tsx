import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { CATEGORY_GRADIENTS, radius, useNotifColors } from '../theme'
import type { CategoryId, CategoryTab } from '../types'

export interface NotificationCategoriesProps {
  categories: CategoryTab[]
  activeId: CategoryId
  onSelect: (id: CategoryId) => void
}

export default function NotificationCategories({ categories, activeId, onSelect }: NotificationCategoriesProps) {
  const c = useNotifColors()
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.outer}
    >
      {categories.map((cat) => {
        const active = cat.id === activeId
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            {active ? (
              <LinearGradient
                colors={CATEGORY_GRADIENTS[cat.id]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tab}
              >
                <Text style={styles.emoji}>{cat.emoji}</Text>
                <Text style={styles.labelActive}>{cat.label}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.tab, styles.tabInactive, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}>
                <Text style={styles.emoji}>{cat.emoji}</Text>
                <Text style={[styles.label, { color: c.mistDim }]}>{cat.label}</Text>
              </View>
            )}
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  outer: { flexGrow: 0, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
  },
  tabInactive: {
    borderWidth: 1,
  },
  emoji: { fontSize: 15 },
  label: { fontSize: 13.5, fontWeight: '600' },
  labelActive: { fontSize: 13.5, fontWeight: '600', color: '#ffffff' },
})
