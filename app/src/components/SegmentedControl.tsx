import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeContext";
import { useResponsive } from "@/utils/responsive";

interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  accessibilityLabel
}: SegmentedControlProps<T>) {
  const { colors } = useAppTheme();
  const { moderateScale } = useResponsive();

  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            onPress={() => onChange(segment.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[
              styles.segment,
              {
                paddingVertical: moderateScale(13, 0.3),
                paddingHorizontal: moderateScale(8, 0.3),
                borderRadius: moderateScale(16, 0.3),
                backgroundColor: active ? colors.accentStart : colors.cardBgAlt
              }
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  fontSize: moderateScale(14, 0.25),
                  color: active ? colors.accentText : colors.textSecondary
                }
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  segment: { flex: 1, alignItems: "center" },
  label: { fontWeight: "700" }
});
