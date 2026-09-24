import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function Header({ onBack }: { onBack?: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary || colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>Order Feedback</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: colors.cardBackground || colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight || colors.divider,
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.textPrimary || colors.text },
});
