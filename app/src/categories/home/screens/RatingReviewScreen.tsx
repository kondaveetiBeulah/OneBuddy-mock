import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Star,
  CheckCircle,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Award,
} from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';
import { REVIEW_TAGS } from '../data/mockData';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { RatingStars } from '../components/common/RatingStars';
import { useHomeTheme, COLORS, RADII, SPACING, SHADOWS } from '../theme';

interface RatingReviewScreenProps {
  navigation: any;
}

export const RatingReviewScreen: React.FC<RatingReviewScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useHomeTheme();
  const {
    activeBooking,
    assignedProvider,
    submitReview,
    resetFlow,
  } = useBooking();

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([REVIEW_TAGS[0], REVIEW_TAGS[1]]);
  const [tipAmount, setTipAmount] = useState<number>(50);
  const [customTip, setCustomTip] = useState('');
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
        return 'Very Good Service!';
      case 3:
        return 'Satisfactory Experience';
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
      tipAmount: tipAmount || (customTip ? parseInt(customTip, 10) : 0),
      comment: comment.trim(),
    });

    setSubmitted(true);

    setTimeout(() => {
      resetFlow();
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }, 1800);
  };

  if (submitted) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
        <View style={styles.thankYouContainer}>
          <View style={styles.thankYouCircle}>
            <CheckCircle size={64} color={COLORS.success} />
          </View>
          <Text style={styles.thankYouTitle}>Thank You for Your Feedback!</Text>
          <Text style={styles.thankYouSub}>
            Your rating helps keep our service quality high and motivates our technicians.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <Header
        title="Rate & Review"
        subtitle={`Service for ${activeBooking?.category.title || 'Home Care'}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
      >
        {/* Provider Info Card */}
        <View style={styles.providerSection}>
          <Image
            source={{
              uri:
                provider?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
            }}
            style={styles.avatar}
          />
          <Text style={styles.providerName}>{provider?.name || 'Rajesh Kumar'}</Text>
          <Text style={styles.providerSubtitle}>
            Completed {activeBooking?.selectedSubServices.map((s) => s.title).join(', ')}
          </Text>

          {/* Interactive 5 Star Rating */}
          <View style={styles.starsWrapper}>
            <RatingStars
              rating={rating}
              size={36}
              interactive
              onRatingChange={setRating}
            />
            <Text style={styles.feedbackLabel}>{getRatingFeedback(rating)}</Text>
          </View>
        </View>

        {/* Quick Tag Pills */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>What did you like most?</Text>
          <View style={styles.tagsGrid}>
            {REVIEW_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagPill, isSelected && styles.selectedTagPill]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.tagText, isSelected && styles.selectedTagText]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Optional Tip Buttons */}
        <View style={styles.section}>
          <View style={styles.tipHeaderRow}>
            <Text style={styles.sectionHeading}>Add a Tip for Technician</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalText}>Optional</Text>
            </View>
          </View>
          <Text style={styles.tipSubtitle}>
            100% of the tip goes directly to your service professional
          </Text>

          <View style={styles.tipOptionsRow}>
            {[0, 30, 50, 100].map((amount) => {
              const isSelected = tipAmount === amount && !customTip;
              return (
                <TouchableOpacity
                  key={amount}
                  style={[styles.tipPill, isSelected && styles.selectedTipPill]}
                  onPress={() => {
                    setTipAmount(amount);
                    setCustomTip('');
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.tipText, isSelected && styles.selectedTipText]}
                  >
                    {amount === 0 ? 'No Tip' : `₹${amount}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Written Review Box */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Detailed Comments (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Share details of your experience (cleanliness, timeliness, etc.)..."
            placeholderTextColor={COLORS.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, SPACING.md) },
        ]}
      >
        <Button
          title="Submit Feedback & Return Home"
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  thankYouContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  thankYouCircle: {
    marginBottom: SPACING.lg,
  },
  thankYouTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  thankYouSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  providerSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  providerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  starsWrapper: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  feedbackLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
  },
  tagPill: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  selectedTagPill: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectedTagText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionalBadge: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.pill,
  },
  optionalText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  tipSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tipOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  tipPill: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 10,
    borderRadius: RADII.lg,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  selectedTipPill: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  selectedTipText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    minHeight: 90,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.float,
  },
});
