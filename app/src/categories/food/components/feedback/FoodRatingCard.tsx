import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { colors } from "../theme/colors";
import { SENTIMENT_FACES } from "../types";
import type { SentimentValue } from "../types";

interface Props {
  items: any[];
  ratings: Record<string, SentimentValue>;
  onChange: (itemId: string, value: SentimentValue) => void;
}

export default function FoodRatingCard({ items, ratings, onChange }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.header}>Rate ordered items</Text>
      {items.map((cartItem, idx) => {
        const itemObj = cartItem.item || cartItem;
        const itemId = itemObj.id || idx.toString();
        const itemName = itemObj.name || 'Unknown Item';
        const itemImage = itemObj.image || itemObj.imageUrl || '';

        return (
          <View
            key={itemId}
            style={[styles.row, idx !== items.length - 1 && styles.rowDivider]}
          >
            {itemImage ? <Image source={{ uri: itemImage }} style={styles.itemImage} /> : <View style={styles.itemImage} />}
            <View style={styles.itemContent}>
              <Text style={styles.name} numberOfLines={2}>
                {itemName}
              </Text>
              <View style={styles.faces}>
                {SENTIMENT_FACES.map((face, i) => {
                  const val = (i + 1) as SentimentValue;
                  const active = ratings[itemId] === val;
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => onChange(itemId, val)}
                      style={[
                        styles.faceBtn,
                        { opacity: active ? 1 : 0.35, transform: [{ scale: active ? 1.15 : 1 }] },
                      ]}
                      accessibilityLabel={`${itemName} rating ${val}`}
                    >
                      <Text style={styles.faceText}>{face}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  header: { fontSize: 15, fontWeight: "700", color: colors.text, paddingVertical: 14 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 16, paddingVertical: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  itemImage: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.border },
  itemContent: { flex: 1, gap: 12, justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: "600", color: colors.text },
  faces: { flexDirection: "row", justifyContent: "space-between", paddingRight: 4 },
  faceBtn: { padding: 4 },
  faceText: { fontSize: 24 },
});
