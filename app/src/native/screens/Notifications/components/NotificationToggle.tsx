import React, { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNotifColors } from '../theme'

const TRACK_W = 46
const TRACK_H = 26
const KNOB = 20
const KNOB_TRAVEL = TRACK_W - KNOB - 4 // 2px inset each side

export interface NotificationToggleProps {
  label: string
  enabled: boolean
  onChange: (next: boolean) => void
  isFirst?: boolean
}

export default function NotificationToggle({ label, enabled, onChange, isFirst }: NotificationToggleProps) {
  const c = useNotifColors()
  const anim = useRef(new Animated.Value(enabled ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(anim, {
      toValue: enabled ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start()
  }, [enabled, anim])

  const knobTranslate = anim.interpolate({ inputRange: [0, 1], outputRange: [0, KNOB_TRAVEL] })

  return (
    <View style={[styles.row, { borderTopColor: c.rowDivider }, isFirst && styles.rowFirst]}>
      <Text style={[styles.label, { color: c.mist }]} numberOfLines={2}>
        {label}
      </Text>
      <Pressable
        onPress={() => onChange(!enabled)}
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
        accessibilityLabel={label}
        hitSlop={8}
      >
        {enabled ? (
          <LinearGradient
            colors={[c.goldLight, c.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.track}
          >
            <Animated.View
              style={[styles.knob, { backgroundColor: '#FFFFFF', transform: [{ translateX: knobTranslate }] }]}
            />
          </LinearGradient>
        ) : (
          <View style={[styles.track, styles.trackOff, { backgroundColor: c.glassBorder, borderColor: c.glassBorder }]}>
            <Animated.View
              style={[styles.knob, { backgroundColor: '#FFFFFF', transform: [{ translateX: knobTranslate }] }]}
            />
          </View>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  label: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 20,
  },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    justifyContent: 'center',
  },
  trackOff: {
    borderWidth: 1,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    marginLeft: 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
})
