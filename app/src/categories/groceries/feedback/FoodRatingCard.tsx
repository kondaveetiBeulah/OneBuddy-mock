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
        const itemObj = cartItem.product || cartItem.item || cartItem;
        const itemId   = itemObj.id || cartItem.productId || idx.toString();
        const itemName = itemObj.name || cartItem.productName || 'Grocery Item';
        const itemImage = itemObj.image || itemObj.imageUrl || cartItem.productImage || '';

        return (
          <View key={itemId} style={styles.row}>
            {/* Product Image */}
            {itemImage
              ? (
                <Image
                  source={{ uri: itemImage }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
              )
              : (
                <View style={[styles.itemImage, styles.itemImageFallback]}>
                  <Text style={styles.fallbackEmoji}>🛒</Text>
                </View>
              )
            }

            {/* Product Name + Emoji Ratings */}
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
                      style={[styles.faceBtn, active && styles.faceBtnActive]}
                      accessibilityLabel={`${itemName} rating ${val}`}
                    >
                      <Text style={[styles.faceText, { opacity: active ? 1 : 0.32 }]}>
                        {face}
                      </Text>
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
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 20,
    width: "100%",
  },
  header: { fontSize: 15, fontWeight: "700", color: colors.text, paddingVertical: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider || "#F0F0F0",
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.border,
    flexShrink: 0,
  },
  itemImageFallback: {
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackEmoji: { fontSize: 22 },
  itemContent: { flex: 1, gap: 6 },
  name: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 18,
  },
  faces: { flexDirection: "row", gap: 4, alignItems: "center" },
  faceBtn: {
    padding: 3,
    borderRadius: 6,
  },
  faceBtnActive: {
    backgroundColor: '#EFF6FF',
    transform: [{ scale: 1.15 }],
  },
  faceText: { fontSize: 19 },
});
