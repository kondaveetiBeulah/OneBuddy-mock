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
          <Text style={styles.title}>Rate Your Rider</Text>
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
                    { opacity: active ? 1 : 0.35, transform: [{ scale: active ? 1.15 : 1 }] },
                  ]}
                >
                  <Text style={styles.faceText}>{face}</Text>
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
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingVertical: 16,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.cardBg,
  },
  content: {
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  faces: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 4,
  },
  faceBtn: {
    padding: 4,
  },
  faceText: {
    fontSize: 24,
  },
});
