import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { initialCategories } from "../types";
import type { Category, SentimentValue } from "../types";
import { useCart } from "../../context/CartContext";

import Header from "../feedback/Header";
import Hero from "../feedback/Hero";
import OrderCard from "../feedback/OrderCard";
import StarRating from "../feedback/StarRating";
import CategoryList from "../feedback/CategoryList";
import FoodRatingCard from "../feedback/FoodRatingCard";
import RiderRatingCard from "../feedback/RiderRatingCard";
import CommentsInput from "../feedback/CommentsInput";
import PhotoPicker from "../feedback/PhotoPicker";
import ThankYouView from "../feedback/ThankYouView";

export interface FeedbackFormScreenProps {
  order: any;
  onComplete: () => void;
}

export default function FeedbackFormScreen({ order, onComplete }: FeedbackFormScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);
  const { clearCart } = useCart();
  const [rating, setRating] = useState(4);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [itemRatings, setItemRatings] = useState<Record<string, SentimentValue>>({});
  const [riderRating, setRiderRating] = useState<SentimentValue | null>(null);
  const [comments, setComments] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setCategoryValue = (key: string, value: SentimentValue) => {
    setCategories((prev) => prev.map((cat) => (cat.key === key ? { ...cat, value } : cat)));
  };

  const setItemRatingValue = (itemId: string, value: SentimentValue) => {
    setItemRatings((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = () => {
    setSubmitting(true);
    // Simulated submit — replace with a real API call as needed.
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      clearCart();
    }, 900);
  };

  const handleReset = () => {
    onComplete();
  };

  if (submitted) {
    return (
      <View style={styles.screen}>
        <ThankYouView onReset={handleReset} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header onBack={onComplete} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Hero />
        <OrderCard order={order} />

        <Text style={styles.sectionLabel}>Rate your overall experience</Text>
        <StarRating rating={rating} onChange={setRating} />

        <CategoryList categories={categories} onChange={setCategoryValue} />

        <FoodRatingCard 
          items={order?.items || []} 
          ratings={itemRatings} 
          onChange={setItemRatingValue} 
        />

        <RiderRatingCard
          rating={riderRating}
          onChange={setRiderRating}
        />

        <Text style={styles.sectionLabel}>Additional Comments (Optional)</Text>
        <CommentsInput value={comments} onChange={setComments} />

        <Text style={styles.sectionLabel}>Add a photo (Optional)</Text>
        <PhotoPicker photo={photo} onChange={setPhoto} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 16 }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.submitBtn, { opacity: submitting ? 0.7 : 1 }]}
        >
          {submitting ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={styles.submitText}>Submit Feedback</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 12 },
  sectionLabel: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 12 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.divider },
  submitBtn: { backgroundColor: colors.orange, borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
