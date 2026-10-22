import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Send, Phone, CheckCheck } from 'lucide-react-native';
import { ModalContainer } from './ModalContainer';
import { COLORS, RADII, SPACING, SHADOWS } from '../../theme';

interface Message {
  id: string;
  sender: 'user' | 'technician';
  text: string;
  time: string;
}

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  technicianName?: string;
  technicianAvatar?: string;
  onCall?: () => void;
}

const QUICK_CHIPS = [
  'Where are you now?',
  'Please call before arriving',
  'I am at home, take your time',
  'Please bring extra pipe tape',
];

export const ChatModal: React.FC<ChatModalProps> = ({
  visible,
  onClose,
  technicianName = 'Technician',
  technicianAvatar = '',
  onCall,
}) => {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Simulate technician reply after 1.2s
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let reply = 'Got it! I will take care of it.';
      if (textToSend.toLowerCase().includes('where')) {
        reply = 'I am currently on Sector 16 Main Rd, reaching in about 12 minutes!';
      } else if (textToSend.toLowerCase().includes('call')) {
        reply = 'Sure, I will ring you as soon as I arrive at your gate.';
      } else if (textToSend.toLowerCase().includes('time') || textToSend.toLowerCase().includes('home')) {
        reply = 'Great, thank you! See you shortly.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'technician',
          text: reply,
          time: 'Just now',
        },
      ]);
    }, 1200);
  };

  return (
    <ModalContainer visible={visible} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        {/* Chat Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {technicianAvatar ? (
              <Image source={{ uri: technicianAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 16 }}>👤</Text>
              </View>
            )}
            <View>
              <Text style={styles.techName}>{technicianName}</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.statusText}>Online • Verified Pro</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            {onCall && (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={onCall}
                activeOpacity={0.7}
              >
                <Phone size={16} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Message Thread */}
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <View
                key={m.id}
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.techBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isUser ? styles.userMessageText : styles.techMessageText,
                  ]}
                >
                  {m.text}
                </Text>
                <View style={styles.timeRow}>
                  <Text
                    style={[
                      styles.timeText,
                      isUser ? styles.userTimeText : styles.techTimeText,
                    ]}
                  >
                    {m.time}
                  </Text>
                  {isUser && (
                    <CheckCheck size={12} color="#DCFCE7" style={{ marginLeft: 3 }} />
                  )}
                </View>
              </View>
            );
          })}

          {isTyping && (
            <View style={[styles.messageBubble, styles.techBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.typingText}>{technicianName} is typing...</Text>
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestion Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {QUICK_CHIPS.map((chip, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.chip}
              onPress={() => sendMessage(chip)}
              activeOpacity={0.75}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Text Input Row */}
        <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message to technician..."
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendMessage(inputText)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
            ]}
            disabled={!inputText.trim()}
            onPress={() => sendMessage(inputText)}
            activeOpacity={0.8}
          >
            <Send size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    maxHeight: 520,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  techName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.success,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callBtn: {
    width: 34,
    height: 34,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    maxHeight: 280,
    marginVertical: SPACING.sm,
  },
  messagesContent: {
    paddingVertical: SPACING.xs,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    borderRadius: RADII.lg,
    marginBottom: SPACING.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  techBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  techMessageText: {
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 9,
  },
  userTimeText: {
    color: '#E0F2FE',
  },
  techTimeText: {
    color: COLORS.textMuted,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  chipsScroll: {
    maxHeight: 36,
    marginBottom: SPACING.sm,
  },
  chipsContent: {
    paddingHorizontal: 2,
  },
  chip: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  chipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.xs,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
});
