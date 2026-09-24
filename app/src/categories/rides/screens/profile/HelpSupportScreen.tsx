import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileHeader from '../../components/ProfileHeader';
import { FAQS } from '../../data';

type Props = {
  onBack: () => void;
};

export default function HelpSupportScreen({ onBack }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <ProfileHeader title="Help & support" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestionRow}
                onPress={() => setOpenIndex(isOpen ? null : index)}
              >
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#94a3b8"
                  style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
                />
              </TouchableOpacity>
              {isOpen && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
            </View>
          );
        })}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => Alert.alert('Support', 'Connecting you to support chat…')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
            <Text style={styles.chatButtonText}>Chat with us</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => Alert.alert('Support', 'Calling support…')}
          >
            <Ionicons name="call-outline" size={16} color="#334155" />
            <Text style={styles.callButtonText}>Call support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FCF7' },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  faqItem: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e2e8f0' },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1e293b', paddingRight: 12 },
  faqAnswer: { fontSize: 13, color: '#64748b', paddingBottom: 14, paddingRight: 8, lineHeight: 19 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#54B713',
    shadowColor: '#54B713',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  chatButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#FFFFFF',
  },
  callButtonText: { color: '#334155', fontWeight: '700', fontSize: 14 },
});
