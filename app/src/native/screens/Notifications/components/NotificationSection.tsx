import React from 'react'
import { StyleSheet, View } from 'react-native'
import NotificationToggle from './NotificationToggle'
import { radius, useNotifColors } from '../theme'

export interface NotificationSectionProps {
  title: string
  enabled: boolean
  onToggle: (next: boolean) => void
}

export default function NotificationSection({ title, enabled, onToggle }: NotificationSectionProps) {
  const c = useNotifColors()
  return (
    <View style={[styles.card, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}>
      <NotificationToggle label={title} enabled={enabled} onChange={onToggle} isFirst />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 4,
    marginBottom: 12,
  },
})
