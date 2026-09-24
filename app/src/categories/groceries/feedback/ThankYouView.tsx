import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function ThankYouView({ onReset }: { onReset: () => void }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="checkmark-circle" size={72} color={colors.primary || "#2E7D32"} />
      <Text style={styles.title}>Feedback Submitted! 🎉</Text>
      <Text style={styles.sub}>Thanks for taking the time to share your grocery experience with us.</Text>
      <TouchableOpacity onPress={onReset} style={styles.btn} activeOpacity={0.88}>
        <Text style={styles.btnText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
  title: { fontSize: 22, fontWeight: "800", color: colors.textPrimary || colors.text },
  sub: { fontSize: 14, color: colors.textSecondary || colors.subtext, textAlign: "center", maxWidth: 280, marginBottom: 20 },
  btn: { width: "100%", backgroundColor: colors.primary || "#2E7D32", borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
