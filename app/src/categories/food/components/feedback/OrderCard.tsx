import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export interface OrderCardProps {
  order?: any;
}

export default function OrderCard({ order }: OrderCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.thumb}>
        <Text style={{ fontSize: 28 }}>🍝</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{order?.restaurantName || ""}</Text>
        {order?.id ? <Text style={styles.meta}>Order ID: {order.id}</Text> : null}
        {order?.date ? <Text style={styles.meta}>{order.date}</Text> : null}
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.delivered}>{order?.status || "Delivered"}</Text>
        <Text style={styles.price}>₹{order?.amount || 0}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 24,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.orderThumbBg,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  meta: { fontSize: 12.5, color: colors.subtext, marginTop: 2 },
  delivered: { fontSize: 13, fontWeight: "600", color: colors.green },
  price: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 6 },
});
