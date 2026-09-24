import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { SENTIMENT_FACES } from "../types";
import type { FeedbackCategory, SentimentValue } from "../types";

interface Props {
  categories: FeedbackCategory[];
  onChange: (key: string, value: SentimentValue) => void;
}

export default function CategoryList({ categories, onChange }: Props) {
  const getIcon = (key: string) => {
    switch (key) {
      case 'product': return <Ionicons name="bag-handle-outline" size={16} color="#333" />;
      case 'packaging': return <Ionicons name="cube-outline" size={16} color="#333" />;
      case 'delivery': return <Ionicons name="bicycle-outline" size={16} color="#333" />;
      default: return null;
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.header}>How was your experience?</Text>
      {categories.map((cat) => (
        <View
          key={cat.key}
          style={styles.row}
        >
          <View style={[styles.icon, { backgroundColor: cat.bg || '#F3F4F6' }]}>
            {getIcon(cat.key) || <Text style={{ fontSize: 14 }}>{cat.icon}</Text>}
          </View>
          <Text style={styles.name} numberOfLines={2}>{cat.label}</Text>
          <View style={styles.faces}>
            {SENTIMENT_FACES.map((face, i) => {
              const val = (i + 1) as SentimentValue;
              const active = cat.value === val;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => onChange(cat.key, val)}
                  style={[
                    styles.faceBtn,
                    active && styles.faceBtnActive,
                  ]}
                  accessibilityLabel={`${cat.label} rating ${val}`}
                >
                  <Text style={[styles.faceText, { opacity: active ? 1 : 0.35 }]}>{face}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
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
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider || "#F0F0F0",
    gap: 8,
  },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  name: { fontSize: 13, fontWeight: "600", color: colors.text, flex: 1, marginRight: 2 },
  faces: { flexDirection: "row", gap: 3, flexShrink: 0, alignItems: "center" },
  faceBtn: { padding: 3, borderRadius: 6 },
  faceBtnActive: { backgroundColor: "#E8F5E9", transform: [{ scale: 1.15 }] },
  faceText: { fontSize: 19 },
});
