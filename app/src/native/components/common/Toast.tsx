import React from 'react';
import { Animated, Text } from 'react-native';
import { useNativeColors } from '../../constants/colors';
import { createStyles } from '../../screens/Security/styles';

export interface ToastProps {
  visible: boolean;
  message: string;
  anim: Animated.Value;
}

export const Toast = ({ visible, message, anim }: ToastProps) => {
  const styles = createStyles(useNativeColors());
  if (!visible) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

export default Toast;
