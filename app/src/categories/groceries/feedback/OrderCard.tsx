import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export interface OrderCardProps {
  order?: any;
}

export default function OrderCard({ order }: OrderCardProps) {
  const amount = order?.total ?? order?.amount ?? 249;
  const addressText = order?.deliveryAddress
    ? `${order.deliveryAddress.houseNumber ? `${order.deliveryAddress.houseNumber}, ` : ''}${order.deliveryAddress.street || ''}${order.deliveryAddress.city ? `, ${order.deliveryAddress.city}` : ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '')
    : (order?.address || "Flat 402, Green Valley, Hyderabad");

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.thumb}>
          <Text style={{ fontSize: 26 }}>🛍️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{order?.storeName || "1Buddy Grocery Store"}</Text>
          <Text style={styles.meta}>Order ID: #{order?.id || "OBG-84920"}</Text>
          <Text style={styles.meta}>{order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (order?.date || "Just now")}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.delivered}>Confirmed</Text>
          <Text style={styles.price}>₹{amount}</Text>
        </View>
      </View>

      {/* Short Saved Location Row */}
      <View style={styles.locationRow}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText} numberOfLines={1}>
          Delivered to: <Text style={styles.locationBold}>{addressText}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    width: "100%",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.orderThumbBg,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 14, fontWeight: "700", color: colors.text },
  meta: { fontSize: 12, color: colors.subtext, marginTop: 2 },
  delivered: { fontSize: 12.5, fontWeight: "600", color: colors.green },
  price: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 4 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider || "#F0F0F0",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationIcon: {
    fontSize: 13,
  },
  locationText: {
    fontSize: 12,
    color: colors.subtext,
    flex: 1,
  },
  locationBold: {
    fontWeight: "600",
    color: colors.text,
  },
});
