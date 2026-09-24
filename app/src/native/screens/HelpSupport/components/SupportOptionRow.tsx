import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { SupportOption } from "../types";
import { useHelpColors, type HelpColors } from "../theme/colors";

interface SupportOptionRowProps {
  option: SupportOption;
  onPress: (key: string) => void;
}

export default function SupportOptionRow({ option, onPress }: SupportOptionRowProps) {
  const Icon = option.icon;
  const colors = useHelpColors();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(option.key)}>
      <View style={[styles.iconWrap, { backgroundColor: option.bg }]}>
        <Icon size={20} color={option.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{option.title}</Text>
        <Text style={styles.subtitle}>{option.subtitle}</Text>
      </View>
      <ChevronLeft
        size={18}
        color={colors.placeholder}
        style={{ transform: [{ rotate: "180deg" }] }}
      />
    </TouchableOpacity>
  );
}

function createStyles(colors: HelpColors) {
  return StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colors.card,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14.5, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 12.5, color: colors.subtext, marginTop: 2 },
  });
}
