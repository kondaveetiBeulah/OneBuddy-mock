import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Search, HelpCircle, MessageCircle } from "lucide-react-native";
import SupportOptionRow from "../components/SupportOptionRow";
import FaqAccordionItem from "../components/FaqAccordionItem";
import { FAQS } from "../constants/faqs";
import { SUPPORT_OPTIONS } from "../constants/supportOptions";
import { useHelpColors, type HelpColors } from "../theme/colors";

interface SupportHomeScreenProps {
  onOpenChat: () => void;
  onClose?: () => void;
}

export default function SupportHomeScreen({ onOpenChat, onClose }: SupportHomeScreenProps) {
  const colors = useHelpColors();
  const styles = createStyles(colors);
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredFaqs = FAQS.filter((f) =>
    f.q.toLowerCase().includes(search.toLowerCase())
  );

  const handleOptionPress = (key: string) => {
    if (key === "chat") {
      onOpenChat();
    }
    // "call" could trigger Linking.openURL(`tel:...`) in a real app.
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          disabled={!onClose}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help &amp; Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 20, paddingBottom: 12 }}
      >
        {/* Search */}
        <View style={styles.searchWrap}>
          <Search size={18} color={colors.placeholder} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search for help"
            placeholderTextColor={colors.placeholder}
            style={styles.searchInput}
          />
        </View>

        {/* Support options */}
        <Text style={styles.sectionLabel}>Contact us</Text>
        <View style={styles.optionsList}>
          {SUPPORT_OPTIONS.map((opt) => (
            <SupportOptionRow key={opt.key} option={opt} onPress={handleOptionPress} />
          ))}
        </View>

        {/* FAQs */}
        <Text style={styles.sectionLabel}>Frequently asked questions</Text>
        <View style={styles.faqCard}>
          {filteredFaqs.length === 0 && (
            <View style={styles.faqEmpty}>
              <HelpCircle size={18} color={colors.placeholder} />
              <Text style={styles.faqEmptyText}>No results for "{search}"</Text>
            </View>
          )}
          {filteredFaqs.map((faq, idx) => (
            <FaqAccordionItem
              key={faq.q}
              faq={faq}
              isOpen={openFaq === idx}
              isLast={idx === filteredFaqs.length - 1}
              onToggle={() => setOpenFaq(openFaq === idx ? null : idx)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Sticky chat CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.chatCta} onPress={onOpenChat}>
          <MessageCircle size={18} color="#FFFFFF" />
          <Text style={styles.chatCtaText}>Chat with support</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  scroll: { flex: 1 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 24,
  },
  searchInput: {
    fontSize: 14,
    flex: 1,
    color: colors.text,
    padding: 0,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.subtext,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  optionsList: { gap: 10, marginBottom: 28 },
  faqCard: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  faqEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  faqEmptyText: { color: colors.placeholder, fontSize: 13 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  chatCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 15,
  },
  chatCtaText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  });
}
