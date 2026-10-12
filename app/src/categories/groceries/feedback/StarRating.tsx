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
            activeOpacity={0.7}
            accessibilityLabel={`${n} star`}
          >
            <Star
              size={40}
              fill={n <= rating ? "#F0B429" : "none"}
              color={n <= rating ? "#F0B429" : "#E5E7EB"}
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
  row: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 6 },
  btn: { padding: 4 },
  word: { textAlign: "center", color: '#4FA81A', fontWeight: "700", fontSize: 16, marginBottom: 20 },
});
