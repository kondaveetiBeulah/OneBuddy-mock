import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Check,
  Plus,
  Clock,
  Star,
  ArrowRight,
} from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';
import { SUB_SERVICES } from '../data/mockData';
import { SubService } from '../types';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { useHomeTheme, COLORS, RADII, SPACING, SHADOWS } from '../theme';
import { HomeSubServiceListSkeleton } from '@/components/common/skeletons';

interface SubServiceScreenProps {
  navigation: any;
  route: any;
}

export const SubServiceScreen: React.FC<SubServiceScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useHomeTheme();
  const {
    selectedCategory,
    selectedSubServices,
    toggleSubService,
    isSubServiceSelected,
    baseAmount,
  } = useBooking();

  const categoryId = route?.params?.categoryId || selectedCategory.id;
  const categoryTitle = route?.params?.categoryTitle || selectedCategory.title;

  const currentCategoryServices = useMemo(() => {
    return SUB_SERVICES.filter((sub) => sub.categoryId === categoryId);
  }, [categoryId]);

  const handleProceed = () => {
    if (selectedSubServices.length > 0) {
      navigation.navigate('DateTimePicker');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <Header
        title={categoryTitle}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
      >
        {/* List of Sub-Services */}
        <View style={styles.servicesList}>
          {currentCategoryServices.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>
                No Services Available
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
                There are currently no sub-services available in this category.
              </Text>
            </View>
          ) : (
            currentCategoryServices.map((service) => {
              const isSelected = isSubServiceSelected(service.id);

            return (
              <Card
                key={service.id}
                style={[
                  styles.serviceCard,
                  isSelected && styles.selectedServiceCard,
                ]}
                variant={isSelected ? 'elevated' : 'outlined'}
              >
                {/* Top Badge & Popular indicator */}
                <View style={styles.cardTopRow}>
                  <View style={styles.badgesRow}>
                    {service.discountBadge ? (
                      <Badge
                        label={service.discountBadge}
                        variant="danger"
                        size="sm"
                        style={{ marginRight: 6 }}
                      />
                    ) : null}
                    {service.popular ? (
                      <Badge
                        label="Best Seller"
                        variant="warning"
                        size="sm"
                      />
                    ) : null}
                  </View>

                  <View style={styles.ratingBadge}>
                    <Star size={12} color={COLORS.starFilled} fill={COLORS.starFilled} />
                    <Text style={styles.ratingText}>{service.rating}</Text>
                    <Text style={styles.reviewCount}>({service.reviewsCount})</Text>
                  </View>
                </View>

                {/* Title & Description */}
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDescription}>
                  {service.description}
                </Text>

                {/* Features List */}
                <View style={styles.featuresContainer}>
                  {service.features.map((feat, fIdx) => (
                    <View key={fIdx} style={styles.featureItem}>
                      <View style={styles.featureBullet} />
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {/* Duration & Price Row */}
                <View style={styles.cardFooterRow}>
                  <View style={styles.priceMeta}>
                    <View style={styles.priceRow}>
                      <Text style={styles.currentPrice}>₹{service.price}</Text>
                      {service.originalPrice && (
                        <Text style={styles.originalPrice}>
                          ₹{service.originalPrice}
                        </Text>
                      )}
                    </View>
                    <View style={styles.durationRow}>
                      <Clock size={12} color={COLORS.textSecondary} />
                      <Text style={styles.durationText}>{service.estimatedTime}</Text>
                    </View>
                  </View>

                  {/* Book / Booked Toggle Button */}
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      isSelected && styles.selectedToggleButton,
                    ]}
                    onPress={() => toggleSubService(service)}
                    activeOpacity={0.8}
                  >
                    {isSelected ? (
                      <>
                        <Check size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.selectedBtnText}>Booked</Text>
                      </>
                    ) : (
                      <>
                        <Plus size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.addBtnText}>Book</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </Card>
            );
          }))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      {selectedSubServices.length > 0 && (
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, SPACING.md) },
          ]}
        >
          <View style={styles.bottomBarLeft}>
            <Text style={styles.bottomCount}>
              {selectedSubServices.length} {selectedSubServices.length === 1 ? 'service' : 'services'} selected
            </Text>
            <View style={styles.bottomPriceRow}>
              <Text style={styles.bottomPriceLabel}>Total:</Text>
              <Text style={styles.bottomPriceValue}>₹{baseAmount}</Text>
            </View>
          </View>

          <View style={styles.bottomBarRight}>
            <Button
              title="Proceed to Schedule"
              rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
              onPress={handleProceed}
              variant="primary"
              size="lg"
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: SPACING.sm,
    paddingBottom: 120,
  },
  servicesList: {
    paddingHorizontal: SPACING.lg,
  },
  serviceCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  selectedServiceCard: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: COLORS.surface,
    ...SHADOWS.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.pill,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginLeft: 3,
  },
  reviewCount: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
    marginTop: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginTop: 4,
  },
  featuresContainer: {
    marginVertical: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureBullet: {
    width: 5,
    height: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  priceMeta: {},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  originalPrice: {
    fontSize: 13,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  durationText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    minWidth: 100,
    justifyContent: 'center',
  },
  selectedToggleButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  selectedBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.float,
  },
  bottomBarLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  bottomCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  bottomPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  bottomPriceLabel: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  bottomPriceValue: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.primary,
    marginLeft: 4,
  },
  bottomBarRight: {
    flex: 1.3,
  },
});
