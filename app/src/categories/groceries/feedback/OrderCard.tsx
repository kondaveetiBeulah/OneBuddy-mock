import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export interface OrderCardProps {
  order?: any;
}

export default function OrderCard({ order }: OrderCardProps) {
  const amount = order?.total ?? order?.amount ?? 0;
  const formattedDate = (() => {
    if (!order?.createdAt && !order?.date) return 'Just now';
    if (order?.date && typeof order.date === 'string' && !order.date.includes('T') && isNaN(Date.parse(order.date))) {
      return order.date;
    }
    const d = new Date(order?.createdAt || order?.date);
    if (isNaN(d.getTime())) return typeof order?.date === 'string' ? order.date : 'Just now';
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  })();

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.thumb}>
          <Text style={{ fontSize: 26 }}>🛍️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{order?.storeName || "1Buddy Grocery Store"}</Text>
          {order?.id ? <Text style={styles.meta}>Order ID: #{order.id}</Text> : null}
          <Text style={styles.meta}>{formattedDate}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.delivered}>Confirmed</Text>
          <Text style={styles.price}>₹{amount}</Text>
        </View>
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
});
