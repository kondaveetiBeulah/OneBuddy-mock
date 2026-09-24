import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useAppTheme } from "@/theme/ThemeContext";
import { useToast } from "@/context/ToastContext";

export function SavedToast() {
  const { colors } = useAppTheme();
  const { message, visible } = useToast();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : 8,
        duration: 220,
        useNativeDriver: true
      })
    ]).start();
  }, [visible, opacity, translateY]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          backgroundColor: colors.toastBg,
          opacity,
          transform: [{ translateY }]
        }
      ]}
    >
      <Text style={[styles.text, { color: colors.toastText }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    alignSelf: "center",
    bottom: 22,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  },
  text: { fontSize: 12, fontWeight: "800" }
});
