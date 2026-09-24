import React from "react";
import { StyleSheet, Text } from "react-native";
import { useAppTheme } from "@/theme/ThemeContext";
import { useResponsive } from "@/utils/responsive";

export function SectionLabel({ children }: { children: string }) {
  const { colors } = useAppTheme();
  const { moderateScale } = useResponsive();
  return (
    <Text style={[styles.label, { color: colors.sectionLabel, fontSize: moderateScale(11, 0.2) }]}>
      {children}
    </Text>
  );
}

export function VersionFooter({ label, version }: { label: string; version: string }) {
  const { colors } = useAppTheme();
  return (
    <Text style={[styles.version, { color: colors.textTertiary }]}>
      {label} {version}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    paddingTop: 20,
    paddingBottom: 8,
    paddingHorizontal: 4
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    paddingTop: 28
  }
});
