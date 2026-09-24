import React from 'react';
import { Animated, Text } from 'react-native';
import { styles } from '../theme/styles';

export function Toast({
  visible,
  message,
  anim,
}: {
  visible: boolean;
  message: string;
  anim: Animated.Value;
}) {
  if (!visible) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}
