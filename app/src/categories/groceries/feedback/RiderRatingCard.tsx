import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { colors } from "../theme/colors";
import { SENTIMENT_FACES } from "../types";
import type { SentimentValue } from "../types";

interface Props {
  rating: SentimentValue | null;
  onChange: (value: SentimentValue) => void;
}

export default function RiderRatingCard({ rating, onChange }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image
          source={{ uri: "https://cdn.dribbble.com/userupload/25651927/file/original-6501e52c3e9c850da0cf82d96845b15d.gif" }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.content}>
          <Text style={styles.title}>Rate Your Delivery Partner</Text>
          <View style={styles.faces}>
            {SENTIMENT_FACES.map((face, i) => {
              const val = (i + 1) as SentimentValue;
              const active = rating === val;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => onChange(val)}
                  style={[
                    styles.faceBtn,
                    active && styles.faceBtnActive,
                  ]}
                  accessibilityLabel={`Rider rating ${val}`}
                >
                  <Text style={[styles.faceText, { opacity: active ? 1 : 0.35 }]}>{face}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 20,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardBg,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  faces: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  faceBtn: {
    padding: 3,
    borderRadius: 6,
  },
  faceBtnActive: {
    backgroundColor: "#EFF6FF",
    transform: [{ scale: 1.15 }],
  },
  faceText: {
    fontSize: 20,
  },
});
