import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { ShoppingBag, Package, Truck } from 'lucide-react-native';

const ICON_MAP: Record<string, any> = {
  ShoppingBag,
  Package,
  Truck,
};
import { SENTIMENT_FACES } from "../types";
import type { Category, SentimentValue } from "../types";

interface Props {
  categories: Category[];
  onChange: (key: string, value: SentimentValue) => void;
}

export default function CategoryList({ categories, onChange }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.header}>How was your experience?</Text>
      {categories.map((cat, idx) => (
        <View
          key={cat.key}
          style={[styles.row, idx !== categories.length - 1 && styles.rowDivider]}
        >
          <View style={[styles.icon, { backgroundColor: cat.bg }]}>
            {(() => {
              const IconComponent = ICON_MAP[cat.icon];
              return IconComponent ? <IconComponent size={18} color={cat.color || colors.text} /> : <Text>{cat.icon}</Text>;
            })()}
          </View>
          <Text style={styles.name}>{cat.label}</Text>
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
                    { opacity: active ? 1 : 0.35, transform: [{ scale: active ? 1.15 : 1 }] },
                  ]}
                  accessibilityLabel={`${cat.label} rating ${val}`}
                >
                  <Text style={styles.faceText}>{face}</Text>
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
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  header: { fontSize: 15, fontWeight: "700", color: colors.text, paddingVertical: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, color: colors.text, flex: 1 },
  faces: { flexDirection: "row", gap: 6 },
  faceBtn: { padding: 2 },
  faceText: { fontSize: 18 },
});

