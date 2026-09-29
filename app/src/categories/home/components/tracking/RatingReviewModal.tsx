import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, X, Award } from 'lucide-react-native';
import { ModalContainer } from '../common/ModalContainer';
import { RatingStars } from '../common/RatingStars';
import { Button } from '../common/Button';
import { REVIEW_TAGS } from '../../data/mockData';
import { COLORS, RADII, SPACING, SHADOWS } from '../../theme';
import { useBooking } from '../../context/BookingContext';

interface RatingReviewModalProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

export const RatingReviewModal: React.FC<RatingReviewModalProps> = ({
  visible,
  onClose,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { activeBooking, assignedProvider, submitReview, resetFlow } = useBooking();

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([REVIEW_TAGS[0], REVIEW_TAGS[1]]);
  const [tipAmount, setTipAmount] = useState<number>(50);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const provider = assignedProvider || activeBooking?.provider;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getRatingFeedback = (stars: number) => {
    switch (stars) {
      case 5:
        return 'Outstanding & Professional Service!';
      case 4:
        return 'Very Good Experience!';
      case 3:
        return 'Satisfactory Service';
      case 2:
        return 'Needs Improvement';
      case 1:
        return 'Poor Experience';
      default:
        return 'Rate your overall experience';
    }
  };

  const handleSubmit = () => {
    submitReview({
      rating,
      tags: selectedTags,
      tipAmount,
      comment: comment.trim(),
    });

    setSubmitted(true);

    setTimeout(() => {
      onClose();
      resetFlow();
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }, 1600);
  };

  return (
    <ModalContainer visible={visible} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        {submitted ? (
          <View style={styles.thankYouBox}>
            <View style={styles.thankYouCircle}>
              <CheckCircle size={56} color={COLORS.success} />
            </View>
            <Text style={styles.thankYouTitle}>Thank You for Your Feedback!</Text>
            <Text style={styles.thankYouSub}>
              Your rating helps us maintain top quality standards and rewards verified technicians.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, SPACING.md) },
            ]}
          >
            {/* Header with Provider Info */}
            <View style={styles.header}>
              <Image
                source={{
                  uri:
                    provider?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
                }}
                style={styles.avatar}
              />
              <View style={styles.headerMeta}>
                <View style={styles.nameRow}>
                  <Text style={styles.techName}>{provider?.name || 'Rajesh Kumar'}</Text>
                  <View style={styles.proTag}>
                    <Award size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
                    <Text style={styles.proTagText}>{provider?.badge || 'Super Pro'}</Text>
                  </View>
                </View>
                <Text style={styles.serviceDoneText} numberOfLines={1}>
                  Completed {activeBooking?.category.title || 'Home Care Service'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* 5-Star Rating Selector */}
            <View style={styles.ratingSection}>
              <Text style={styles.rateTitle}>How was your service experience?</Text>
              <View style={styles.starsWrapper}>
                <RatingStars
                  rating={rating}
                  size={34}
                  interactive
                  onRatingChange={setRating}
                />
              </View>
              <Text style={styles.feedbackText}>{getRatingFeedback(rating)}</Text>
            </View>

            {/* Quick Feedback Tags */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What did you like?</Text>
              <View style={styles.tagsRow}>
                {REVIEW_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                      onPress={() => toggleTag(tag)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[styles.tagText, isSelected && styles.tagTextSelected]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tip Technician Options */}
            <View style={styles.section}>
              <View style={styles.tipHeaderRow}>
                <Text style={styles.sectionTitle}>Add a Tip for Professional</Text>
                <Text style={styles.optionalBadge}>Optional</Text>
              </View>
              <View style={styles.tipRow}>
                {[0, 30, 50, 100].map((amt) => {
                  const isSelected = tipAmount === amt;
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.tipPill, isSelected && styles.tipPillSelected]}
                      onPress={() => setTipAmount(amt)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[styles.tipText, isSelected && styles.tipTextSelected]}
                      >
                        {amt === 0 ? 'No Tip' : `₹${amt}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Detailed Comment Box */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detailed Comments (Optional)</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your thoughts about quality, timeliness..."
                placeholderTextColor={COLORS.textMuted}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Action Button */}
            <Button
              title="Submit Feedback & Finish"
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              style={{ marginTop: SPACING.md }}
              fullWidth
            />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    maxHeight: 560,
  },
  scrollContent: {
    paddingVertical: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  headerMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  techName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADII.pill,
    marginLeft: 6,
  },
  proTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  serviceDoneText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingSection: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.lg,
    marginTop: SPACING.md,
  },
  rateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  starsWrapper: {
    marginVertical: SPACING.sm,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  section: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
  },
  tagPill: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    marginRight: 6,
    marginBottom: 6,
  },
  tagPillSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tagTextSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionalBadge: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  tipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  tipPill: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 8,
    borderRadius: RADII.md,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  tipPillSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tipTextSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  commentInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    padding: SPACING.sm,
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
    minHeight: 65,
  },
  thankYouBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  thankYouCircle: {
    marginBottom: SPACING.md,
  },
  thankYouTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  thankYouSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
});
