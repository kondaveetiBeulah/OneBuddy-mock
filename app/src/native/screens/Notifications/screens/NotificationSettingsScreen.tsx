import React, { useState } from 'react'
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import NotificationCategories from '../components/NotificationCategories'
import NotificationSection from '../components/NotificationSection'
import { CATEGORY_TABS, NOTIFICATION_DATA, buildDefaultNotificationState } from '../notificationData'
import { useNotifColors } from '../theme'
import type { CategoryId } from '../types'

export interface NotificationSettingsScreenProps {
  onBack: () => void
}

export default function NotificationSettingsScreen({ onBack }: NotificationSettingsScreenProps) {
  const c = useNotifColors()
  const [activeCategory, setActiveCategory] = useState<CategoryId>('food')
  const [notifications, setNotifications] = useState(buildDefaultNotificationState)

  function handleToggle(categoryId: CategoryId, key: string, next: boolean) {
    setNotifications((prev) => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [key]: next },
    }))
  }

  const category = NOTIFICATION_DATA[activeCategory]
  const categoryValues = notifications[activeCategory] || {}

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: c.bgDeep }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={c.mist === '#17240A' ? 'dark-content' : 'light-content'} />

      <View style={[styles.header, { borderBottomColor: c.rowDivider }]}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={[styles.backArrow, { color: c.mistDim }]}>‹</Text>
          <Text style={[styles.backText, { color: c.mistDim }]}>Back</Text>
        </Pressable>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: c.mist }]}>Notification Settings</Text>
          <Text style={[styles.sub, { color: c.mistDim }]}>Choose which notifications you want to receive</Text>
        </View>
      </View>

      <NotificationCategories categories={CATEGORY_TABS} activeId={activeCategory} onSelect={setActiveCategory} />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <Text style={[styles.categoryHeading, { color: c.goldLight }]}>{category.title}</Text>
        {category.sections.map((section) => (
          <NotificationSection
            key={section.key}
            title={section.title}
            enabled={!!categoryValues[section.key]}
            onToggle={(next) => handleToggle(activeCategory, section.key, next)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 2,
  },
  backArrow: { fontSize: 20, lineHeight: 20, marginTop: -2 },
  backText: { fontSize: 13.5, fontWeight: '500' },
  heading: { flex: 1 },
  title: { fontSize: 19, fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 2 },
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40 },
  categoryHeading: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 14,
    marginLeft: 2,
  },
})
