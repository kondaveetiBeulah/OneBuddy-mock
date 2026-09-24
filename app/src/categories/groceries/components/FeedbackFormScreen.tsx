import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { initialCategories } from "../types";
import type { FeedbackCategory, SentimentValue } from "../types";
import { useCart } from "../context/CartContext";

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
  order?: any;
  onComplete?: () => void;
  onBack?: () => void;
  onContinueShopping?: () => void;
}

export default function FeedbackFormScreen({
  order,
  onComplete,
  onBack,
  onContinueShopping,
}: FeedbackFormScreenProps) {
  const { clearCart } = useCart();
  const [rating, setRating] = useState(5);
  const [categories, setCategories] = useState<FeedbackCategory[]>(initialCategories);
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
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      clearCart();
    }, 850);
  };

  const handleReset = () => {
    if (onContinueShopping) {
      onContinueShopping();
    } else if (onComplete) {
      onComplete();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onComplete) {
      onComplete();
    }
  };

  // Use real ordered items if available
  const hasRealItems = order?.items && Array.isArray(order.items) && order.items.length > 0;
  const mockGroceryItems = hasRealItems ? order.items : [
    { id: '1', name: 'Fresh Organic Apples (1 kg)', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?auto=format&fit=crop&w=200&q=80' },
    { id: '2', name: 'Pure Farm Milk (500 ml)', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80' },
    { id: '3', name: 'Whole Wheat Farm Bread (400g)', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80' },
    { id: '4', name: 'Fresh Organic Vegetables', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80' },
    { id: '5', name: 'Crispy Snacks & Chips', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=200&q=80' }
  ];

  if (submitted) {
    return (
      <SafeAreaView style={styles.screen}>
        <ThankYouView onReset={handleReset} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Header onBack={handleBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <Hero />
          <OrderCard order={order} />

          <Text style={styles.sectionLabel}>Rate your grocery shopping experience</Text>
          <StarRating rating={rating} onChange={setRating} />

          <CategoryList categories={categories} onChange={setCategoryValue} />

          <FoodRatingCard
            items={mockGroceryItems}
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
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInner}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitBtn, { opacity: submitting ? 0.7 : 1 }]}
            activeOpacity={0.88}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Feedback</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg || "#F8F9FA" },
  scroll: { flex: 1 },
  scrollContent: { paddingVertical: 16, alignItems: "center" },
  contentWrapper: {
    width: "100%",
    maxWidth: 540,
    paddingHorizontal: 16,
  },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 10 },
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: colors.divider || "#E5E7EB",
    alignItems: "center",
  },
  footerInner: {
    width: "100%",
    maxWidth: 540,
  },
  submitBtn: {
    backgroundColor: colors.primary || "#2E7D32",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
