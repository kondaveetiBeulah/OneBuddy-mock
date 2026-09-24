import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
            <Ionicons
              name={n <= rating ? "star" : "star-outline"}
              size={38}
              color={n <= rating ? "#FFB300" : "#D1D5DB"}
            />
          </TouchableOpacity>
        ))}
      </View>
      {rating > 0 && <Text style={styles.word}>{STAR_LABELS[rating]}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 4 },
  btn: { padding: 4 },
  word: { textAlign: "center", color: colors.orange, fontWeight: "700", fontSize: 15, marginBottom: 20 },
});
