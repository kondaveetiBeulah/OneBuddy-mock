import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Send } from "lucide-react-native";
import ChatBubble from "../components/ChatBubble";
import TypingDot from "../components/TypingDot";
import { ChatMessage } from "../types";
import { getAgentReply } from "../utils/chatBot";
import { timeNow } from "../utils/time";
import { useHelpColors, type HelpColors } from "../theme/colors";

interface ChatScreenProps {
  onBack: () => void;
}

export default function ChatScreen({ onBack }: ChatScreenProps) {
  const colors = useHelpColors();
  const styles = createStyles(colors);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      sender: "agent",
      text: "Hi! I'm Riya from support. How can I help you today?",
      time: timeNow(),
    },
  ]);
  const [draft, setDraft] = useState("");
  const [agentTyping, setAgentTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, agentTyping]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      time: timeNow(),
      status: "sent",
    };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");

    // mark as delivered shortly after
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsg.id ? { ...m, status: "delivered" } : m))
      );
    }, 500);

    setAgentTyping(true);
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsg.id ? { ...m, status: "read" } : m))
      );
      setAgentTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: "agent",
          text: getAgentReply(text),
          time: timeNow(),
        },
      ]);
    }, 1400);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={10}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.agentInfo}>
          <View style={styles.agentAvatar}>
            <Text style={styles.agentAvatarText}>R</Text>
          </View>
          <View>
            <Text style={styles.agentName}>Riya · Support</Text>
            <View style={styles.agentStatusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.agentStatus}>Online</Text>
            </View>
          </View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={{ padding: 16, gap: 10 }}
        >
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}

          {agentTyping && (
            <View style={[styles.bubbleRow, { justifyContent: "flex-start" }]}>
              <View style={styles.typingBubble}>
                <TypingDot delay={0} />
                <TypingDot delay={150} />
                <TypingDot delay={300} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={sendMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            returnKeyType="send"
          />
          <TouchableOpacity
            accessibilityLabel="Send message"
            onPress={sendMessage}
            disabled={!draft.trim()}
            style={[styles.sendBtn, { opacity: draft.trim() ? 1 : 0.4 }]}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: HelpColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  agentInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  agentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  agentAvatarText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  agentName: { fontSize: 14, fontWeight: "700", color: colors.text },
  agentStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  agentStatus: { fontSize: 11.5, color: colors.online },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.online,
  },
  chatScroll: { flex: 1, backgroundColor: colors.chatBg },
  bubbleRow: { flexDirection: "row" },
  typingBubble: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  });
}
