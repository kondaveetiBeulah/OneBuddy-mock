import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FaqItem } from "../types";
import { useHelpColors, type HelpColors } from "../theme/colors";

interface FaqAccordionItemProps {
  faq: FaqItem;
  isOpen: boolean;
  isLast: boolean;
  onToggle: () => void;
}

export default function FaqAccordionItem({
  faq,
  isOpen,
  isLast,
  onToggle,
}: FaqAccordionItemProps) {
  const styles = createStyles(useHelpColors());
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <TouchableOpacity style={styles.question} onPress={onToggle}>
        <Text style={styles.questionText}>{faq.q}</Text>
        <Text
          style={[
            styles.chevron,
            { transform: [{ rotate: isOpen ? "90deg" : "-90deg" }] },
          ]}
        >
          ‹
        </Text>
      </TouchableOpacity>
      {isOpen && <Text style={styles.answer}>{faq.a}</Text>}
    </View>
  );
}

function createStyles(colors: HelpColors) {
  return StyleSheet.create({
  row: { paddingVertical: 4 },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  question: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  questionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    paddingRight: 8,
  },
  chevron: { color: colors.placeholder, fontSize: 18 },
  answer: {
    fontSize: 13,
    color: colors.subtext,
    paddingBottom: 14,
    lineHeight: 19,
  },
  });
}
