import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { SERVICES, schemes } from '@/design/tokens';
import { useAppTheme } from '@/theme/ThemeContext';

interface ServiceTimelineProps {
  activeIndex: number;
  onSelect: (index: number) => void;
}

const GREEN = '#65B200';
const GREEN_TRACK = '#D2EAB7';

export default function ServiceTimeline({ activeIndex, onSelect }: ServiceTimelineProps) {
  const { scheme } = useAppTheme();
  const tokens = schemes[scheme];
  const progress = useRef(new Animated.Value(activeIndex / (SERVICES.length - 1))).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: activeIndex / (SERVICES.length - 1),
      duration: 280,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [activeIndex, progress]);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.root}>
      <View style={styles.trackContainer}>
        {/* Background track */}
        <View style={[styles.trackLine, { backgroundColor: scheme === 'dark' ? tokens.ink(0.15) : GREEN_TRACK }]} />
        {/* Animated green progress fill */}
        <Animated.View
          style={[
            styles.trackFill,
            {
              width: fillWidth,
              backgroundColor: GREEN,
            },
          ]}
        />
      </View>

      <View style={styles.nodes}>
        {SERVICES.map((service, index) => {
          const active = index === activeIndex;
          const done = index < activeIndex;

          return (
            <Pressable
              key={service.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(index)}
              style={styles.node}
            >
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  active && [styles.dotActive, { backgroundColor: tokens.bgDeep }],
                  !done && !active && [styles.dotUpcoming, { borderColor: scheme === 'dark' ? tokens.ink(0.2) : GREEN_TRACK, backgroundColor: tokens.bgDeep }],
                ]}
              />
              <Text
                style={[
                  styles.label,
                  { color: active ? GREEN : tokens.textDim },
                  active && styles.labelActive,
                ]}
              >
                {service.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 26,
    alignSelf: 'stretch',
    position: 'relative',
  },
  trackContainer: {
    position: 'absolute',
    top: 11,
    left: 24,
    right: 24,
    height: 3,
    justifyContent: 'center',
  },
  trackLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 1.5,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 3,
    borderRadius: 1.5,
  },
  nodes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  node: {
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  dotDone: {
    backgroundColor: GREEN,
    borderColor: GREEN,
    borderWidth: 2,
  },
  dotActive: {
    borderColor: GREEN,
    borderWidth: 2.5,
  },
  dotUpcoming: {
    borderWidth: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  labelActive: {
    fontWeight: '700',
  },
});
