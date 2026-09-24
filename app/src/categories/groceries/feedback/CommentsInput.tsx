import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

const MAX_COMMENT = 300;

interface Props {
  value: string;
  onChange: (text: string) => void;
}

export default function CommentsInput({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={onChange}
        maxLength={MAX_COMMENT}
        placeholder="Share more about your experience..."
        placeholderTextColor={colors.subtext}
        multiline
        style={styles.input}
      />
      <Text style={styles.count}>
        {value.length}/{MAX_COMMENT}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  input: { minHeight: 70, fontSize: 14, color: colors.text, textAlignVertical: "top" },
  count: { textAlign: "right", fontSize: 12, color: colors.subtext, marginTop: 4 },
});
