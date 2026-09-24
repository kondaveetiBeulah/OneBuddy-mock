import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAppTheme } from "@/theme/ThemeContext";
import { useResponsive } from "@/utils/responsive";

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}

export function SettingsRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  isLast = false,
}: SettingsRowProps) {
  const { colors } = useAppTheme();
  const { moderateScale } = useResponsive();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => [
        styles.row,
        {
          paddingVertical: moderateScale(13, 0.3),
          paddingHorizontal: moderateScale(14, 0.3),
          borderBottomColor: colors.divider,
          borderBottomWidth: isLast ? 0 : 1,
          backgroundColor:
            pressed && onPress
              ? colors.cardBgAlt
              : "transparent",
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            width: moderateScale(40, 0.3),
            height: moderateScale(40, 0.3),
            borderRadius: moderateScale(12, 0.3),
            backgroundColor: colors.iconBg,
          },
        ]}
      >
        {icon}
      </View>

      <View style={styles.textWrap}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: moderateScale(15, 0.25),
            },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
                fontSize: moderateScale(13, 0.25),
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? <View style={styles.right}>{right}</View> : null}
    </Pressable>
  );
}

export function CardGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.cardGroup,
        {
          borderColor: colors.border,
          backgroundColor: colors.cardBg,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cardGroup: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
  },

  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },

  textWrap: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontWeight: "700",
    lineHeight: 19,
  },

  subtitle: {
    lineHeight: 17,
    marginTop: 2,
  },

  right: {
    marginLeft: "auto",
    alignItems: "center",
    flexDirection: "row",
  },
});