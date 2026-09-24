import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CircleCheck } from "lucide-react-native";
import { colors } from "../theme/colors";

export default function ThankYouView({ onReset }: { onReset: () => void }) {
  return (
    <View style={styles.wrap}>
      <CircleCheck size={64} color={colors.orange} strokeWidth={1.5} />
      <Text style={styles.title}>Feedback submitted</Text>
      <Text style={styles.sub}>Thanks for taking the time to share your experience with us.</Text>
      <TouchableOpacity onPress={onReset} style={styles.btn}>
        <Text style={styles.btnText}>Go To Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 8 },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  sub: { fontSize: 14, color: colors.subtext, textAlign: "center", maxWidth: 260, marginBottom: 16 },
  btn: { width: "100%", backgroundColor: colors.orange, borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
