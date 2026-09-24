import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { useHelpColors } from "../theme/colors";

interface TypingDotProps {
  delay: number;
}

export default function TypingDot({ delay }: TypingDotProps) {
  const colors = useHelpColors();
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bounce, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(600 - delay),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounce, delay]);

  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });
  const opacity = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: colors.placeholder, transform: [{ translateY }], opacity },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
