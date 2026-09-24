import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function Hero() {
  return (
    <View style={styles.hero}>
      <View style={styles.bowlWrap}>
        <Text style={styles.bowlEmoji}>🍜</Text>
        <View style={styles.heartBadge}>
          <Text style={styles.heartText}>♥</Text>
        </View>
      </View>
      <Text style={styles.thanksTitle}>Thank you for your order!</Text>
      <Text style={styles.thanksSub}>We'd love to hear about your experience.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", marginBottom: 20 },
  bowlWrap: { marginBottom: 8 },
  bowlEmoji: { fontSize: 72, lineHeight: 80 },
  heartBadge: {
    position: "absolute",
    top: -6,
    right: -18,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderBottomLeftRadius: 4,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  heartText: { color: "#fff", fontSize: 14 },
  thanksTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginTop: 8, marginBottom: 4 },
  thanksSub: { fontSize: 14, color: colors.subtext, textAlign: "center" },
});
