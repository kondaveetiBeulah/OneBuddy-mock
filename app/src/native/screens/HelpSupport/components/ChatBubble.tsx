import { View, Text, StyleSheet } from "react-native";
import { CheckCheck, Clock } from "lucide-react-native";
import { ChatMessage } from "../types";
import { useHelpColors, type HelpColors } from "../theme/colors";

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message: m }: ChatBubbleProps) {
  const isUser = m.sender === "user";
  const colors = useHelpColors();
  const styles = createStyles(colors);

  return (
    <View
      style={[styles.row, { justifyContent: isUser ? "flex-end" : "flex-start" }]}
    >
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
        <Text style={isUser ? styles.textUser : styles.textAgent}>{m.text}</Text>
        <View
          style={[styles.meta, { justifyContent: isUser ? "flex-end" : "flex-start" }]}
        >
          <Text style={isUser ? styles.metaTextUser : styles.metaTextAgent}>
            {m.time}
          </Text>
          {isUser && (
            <>
              {m.status === "sent" && <Clock size={12} color={colors.onGoldMuted} />}
              {(m.status === "delivered" || m.status === "read") && (
                <CheckCheck
                  size={13}
                  color={m.status === "read" ? colors.readTick : colors.onGoldMuted}
                />
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: HelpColors) {
  return StyleSheet.create({
  row: { flexDirection: "row" },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: colors.orange,
    borderBottomRightRadius: 4,
  },
  bubbleAgent: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderBottomLeftRadius: 4,
  },
  textUser: { color: "#FFFFFF", fontSize: 13.5, lineHeight: 18 },
  textAgent: { color: colors.text, fontSize: 13.5, lineHeight: 18 },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  metaTextUser: { fontSize: 10.5, color: "rgba(255,255,255,0.75)" },
  metaTextAgent: { fontSize: 10.5, color: colors.placeholder },
  });
}
