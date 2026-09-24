import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Star } from "lucide-react-native";
import { colors } from "../theme/colors";
import { STAR_LABELS } from "../types";

interface Props {
  rating: number;
  onChange: (n: number) => void;
}

export default function StarRating({ rating, onChange }: Props) {
  return (
    <>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            style={styles.btn}
            accessibilityLabel={`${n} star`}
          >
            <Star
              size={40}
              fill={n <= rating ? colors.starActive : "none"}
              color={n <= rating ? colors.starActive : colors.starInactive}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        ))}
      </View>
      {rating > 0 && <Text style={styles.word}>{STAR_LABELS[rating]}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 4 },
  btn: { padding: 4 },
  word: { textAlign: "center", color: colors.orange, fontWeight: "700", fontSize: 14, marginBottom: 24 },
});
