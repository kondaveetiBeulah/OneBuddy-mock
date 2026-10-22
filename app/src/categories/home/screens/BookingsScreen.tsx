import React, { useState } from 'react';
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
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Navigation,
  ArrowRight,
  RotateCcw,
  Receipt,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';
import { isBookingSlotPast } from '../data/mockData';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useHomeTheme, COLORS, RADII, SPACING, SHADOWS } from '../theme';

interface BookingsScreenProps {
  navigation: any;
  onGoHome?: () => void;
}

export const BookingsScreen: React.FC<BookingsScreenProps> = ({ navigation, onGoHome }) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useHomeTheme();
  const { allBookings, setActiveBooking, feedbackList } = useBooking();
  const [activeTab, setActiveTab] = useState<'ongoing' | 'history'>('ongoing');

  // Any booking whose scheduled time slot has NOT passed AND has NOT been reviewed belongs in ongoing
  const isOngoing = (b: any) =>
    !isBookingSlotPast(b) &&
    !b.hasReviewed &&
    !feedbackList.some((f) => f.bookingId === b.bookingId);

  const ongoingBookings = allBookings.filter(isOngoing);
  const historyBookings = allBookings.filter((b) => !isOngoing(b));

  const handleBack = () => {
    if (onGoHome) {
      onGoHome();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { initialTab: 'Home' });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <Header
        title="My Bookings"
        subtitle="Manage current orders and past history"
        showBack={true}
        onBack={handleBack}
      />

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ongoing' && styles.activeTabBtn]}
          onPress={() => setActiveTab('ongoing')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'ongoing' && styles.activeTabText,
            ]}
          >
            Ongoing Bookings ({ongoingBookings.length})
          </Text>
          {ongoingBookings.length > 0 && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'history' && styles.activeTabBtn]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'history' && styles.activeTabText,
            ]}
          >
            Past History ({historyBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
      >
        {activeTab === 'ongoing' ? (
          ongoingBookings.length > 0 ? (
            <View style={styles.section}>
              {ongoingBookings.map((booking) => (
                <Card key={booking.bookingId} style={styles.ongoingCard} variant="elevated">
                  {/* Header with Live Pulse */}
                  <View style={styles.cardTopRow}>
                    <Badge
                      label={`ACTIVE • ${booking.stage.replace('_', ' ')}`}
                      variant="info"
                      size="sm"
                      icon={<Navigation size={12} color={COLORS.secondary} />}
                    />
                    <Text style={styles.orderIdText}>#{booking.bookingId}</Text>
                  </View>

                  {/* Service Title */}
                  <Text style={styles.serviceTitle}>{booking.category.title}</Text>
                  <Text style={styles.subServicesSummary}>
                    {booking.selectedSubServices.map((s) => s.title).join(', ')}
                  </Text>

                  {/* Details */}
                  <View style={styles.metaRow}>
                    <Calendar size={14} color={COLORS.primary} />
                    <Text style={styles.metaText}>
                      {booking.date.fullDate} • {booking.timeSlot.timeRange}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <MapPin size={14} color={COLORS.secondary} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {booking.address.houseNo}, {booking.address.street}
                    </Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.totalPriceLabel}>Total Amount:</Text>
                    <Text style={styles.totalPriceValue}>₹{booking.totalAmount.toFixed(2)}</Text>
                  </View>

                  {/* Live Track Action */}
                  <Button
                    title="Open Live 2D Map Tracking"
                    onPress={() => {
                      setActiveBooking(booking);
                      navigation.navigate('LiveTracking');
                    }}
                    rightIcon={<Navigation size={16} color="#FFFFFF" />}
                    variant="primary"
                    size="md"
                    style={{ marginTop: SPACING.md }}
                  />
                </Card>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtitle}>
                You don't have any active service requests right now. Book a service to get started!
              </Text>
              <Button
                title="Browse Services"
                onPress={() => navigation.navigate('MainTabs', { initialTab: 'Home' })}
                variant="primary"
                size="md"
                style={{ marginTop: SPACING.lg, maxWidth: 200 }}
              />
            </View>
          )
        ) : (
          historyBookings.length > 0 ? (
            <View style={styles.section}>
              {historyBookings.map((item) => (
                <Card key={item.bookingId} style={styles.historyCard} variant="outlined">
                  <View style={styles.cardTopRow}>
                    <Badge
                      label="COMPLETED"
                      variant="success"
                      size="sm"
                      icon={<CheckCircle size={12} color={COLORS.success} />}
                    />
                    <Text style={styles.historyId}>#{item.bookingId}</Text>
                  </View>

                  <Text style={styles.historyTitle}>{item.category.title}</Text>
                  <Text style={styles.historyCategory}>
                    {item.selectedSubServices.map((s) => s.title).join(', ')} • Pro: {item.provider?.name || 'Assigned Professional'}
                  </Text>

                  <View style={styles.historyMetaRow}>
                    <Text style={styles.historyDate}>
                      {item.date.fullDate} • {item.timeSlot.timeRange}
                    </Text>
                    <Text style={styles.historyAmount}>₹{item.totalAmount.toFixed(2)}</Text>
                  </View>

                  <View style={styles.historyActionsRow}>
                    <TouchableOpacity
                      style={styles.rebookBtn}
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate('MainTabs', { initialTab: 'Home' })}
                    >
                      <RotateCcw size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.rebookBtnText}>Book Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.receiptBtn}
                      activeOpacity={0.7}
                      onPress={() => {}}
                    >
                      <FileText size={14} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={styles.receiptBtnText}>Invoice</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtitle}>
                You haven't completed any service bookings yet. Once a service is finished, it will appear here.
              </Text>
              <Button
                title="Explore Services"
                onPress={() => navigation.navigate('MainTabs', { initialTab: 'Home' })}
                variant="primary"
                size="md"
                style={{ marginTop: SPACING.lg, maxWidth: 200 }}
              />
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
  },
  scrollContent: {
    paddingTop: SPACING.md,
  },
  section: {
    paddingHorizontal: SPACING.lg,
  },
  ongoingCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subServicesSummary: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  totalPriceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  totalPriceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  historyCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  historyId: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  historyCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  historyActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  rebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primaryLight,
  },
  rebookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceSubtle,
  },
  receiptBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
