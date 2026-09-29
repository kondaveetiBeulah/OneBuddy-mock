import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle,
  Search,
  UserCheck,
  Star,
  Phone,
  MessageSquare,
  ShieldCheck,
  Calendar,
  MapPin,
  Car,
  Award,
  Navigation,
  ArrowRight,
  Home,
} from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { RatingStars } from '../components/common/RatingStars';
import { ChatModal } from '../components/common/ChatModal';
import { useHomeTheme, COLORS, RADII, SPACING, SHADOWS } from '../theme';

interface BookingConfirmationScreenProps {
  navigation: any;
}

export const BookingConfirmationScreen: React.FC<BookingConfirmationScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useHomeTheme();
  const { activeBooking, assignedProvider, updateTrackingStage } = useBooking();
  const [searching, setSearching] = useState(true);
  const [chatVisible, setChatVisible] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Checkmark pop animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 40,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Radar pulse animation during search
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Auto-transition from Searching to Assigned after 2.5 seconds
    const timer = setTimeout(() => {
      setSearching(false);
      pulse.stop();
      updateTrackingStage('ASSIGNED');
    }, 2500);

    return () => {
      clearTimeout(timer);
      pulse.stop();
    };
  }, []);

  const handleTrackLive = () => {
    navigation.navigate('LiveTracking');
  };

  const handleBackHome = () => {
    navigation.navigate('MainTabs', { initialTab: 'Home' });
  };

  const handleCall = () => {
    if (assignedProvider?.phone) {
      Linking.openURL(`tel:${assignedProvider.phone}`);
    }
  };

  const provider = assignedProvider || activeBooking?.provider;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <Header
        title="Booking Placed"
        showBack={false}
        rightAction={
          <TouchableOpacity onPress={handleBackHome} style={styles.homeBtn}>
            <Home size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
      >
        {/* Success Check Banner */}
        <View style={styles.successBanner}>
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
            <CheckCircle size={54} color={COLORS.success} />
          </Animated.View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.bookingIdText}>
            Order ID: {activeBooking?.bookingId || 'HS-782190'}
          </Text>
        </View>

        {/* Searching vs Assigned Card */}
        {searching ? (
          <Card style={styles.searchingCard} variant="elevated">
            <Animated.View
              style={[
                styles.radarCircle,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Search size={32} color={COLORS.primary} />
            </Animated.View>
            <Text style={styles.searchingTitle}>
              Searching for nearby service professional...
            </Text>
            <Text style={styles.searchingSubtitle}>
              Matching top-rated verified technicians within 3km of your location
            </Text>
          </Card>
        ) : (
          <Card style={styles.providerCard} variant="elevated">
            <View style={styles.providerHeader}>
              <Badge
                label="Verified Professional Assigned"
                variant="success"
                size="sm"
                icon={<UserCheck size={13} color={COLORS.success} />}
              />
              <Text style={styles.etaHeader}>ETA ~18 mins</Text>
            </View>

            {/* Provider Profile Info */}
            <View style={styles.providerRow}>
              <Image
                source={{
                  uri:
                    provider?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
                }}
                style={styles.avatar}
              />
              <View style={styles.providerMeta}>
                <View style={styles.nameRow}>
                  <Text style={styles.providerName}>{provider?.name || 'Rajesh Kumar'}</Text>
                  <View style={styles.proTag}>
                    <Award size={11} color="#FFFFFF" style={{ marginRight: 2 }} />
                    <Text style={styles.proTagText}>{provider?.badge || 'Super Pro'}</Text>
                  </View>
                </View>

                {/* Rating & Jobs */}
                <View style={styles.ratingStatsRow}>
                  <RatingStars rating={provider?.rating || 4.9} size={13} />
                  <Text style={styles.ratingValue}>{provider?.rating || 4.9}</Text>
                  <Text style={styles.jobsCount}>
                    • {provider?.jobsCompleted || 486}+ jobs done
                  </Text>
                </View>

                {/* Vehicle & Experience */}
                <View style={styles.vehicleRow}>
                  <Car size={13} color={COLORS.textSecondary} />
                  <Text style={styles.vehicleText}>
                    {provider?.vehicleNo || 'KA 03 EJ 4821'} ({provider?.experienceYears || 6} yrs exp)
                  </Text>
                </View>
              </View>
            </View>

            {/* Contact Actions */}
            <View style={styles.providerActionsRow}>
              <TouchableOpacity
                style={styles.actionContactBtn}
                onPress={handleCall}
                activeOpacity={0.8}
              >
                <Phone size={16} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>Call Technician</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionContactBtn, { borderColor: COLORS.secondary }]}
                onPress={() => setChatVisible(true)}
                activeOpacity={0.8}
              >
                <MessageSquare size={16} color={COLORS.secondary} />
                <Text style={[styles.actionBtnText, { color: COLORS.secondary }]}>
                  Message
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Booking Details Card */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Order Summary</Text>
          <Card style={styles.detailsCard} variant="outlined">
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>
                {activeBooking?.category.title} ({activeBooking?.selectedSubServices.length} items)
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Scheduled Slot</Text>
              <Text style={styles.detailValue}>
                {activeBooking?.date.fullDate} • {activeBooking?.timeSlot.timeRange}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {activeBooking?.address.houseNo}, {activeBooking?.address.street}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>
                {activeBooking?.paymentMethod === 'pay_on_visit' ? 'Pay After Service' : 'UPI Instant'} (₹{activeBooking?.totalAmount})
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Interactive Technician Chat Modal */}
      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        technicianName={provider?.name}
        technicianAvatar={provider?.avatar}
        onCall={handleCall}
      />

      {/* Sticky Bottom Actions */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, SPACING.md) },
        ]}
      >
        <Button
          title="Track Live Booking Status"
          onPress={handleTrackLive}
          rightIcon={<Navigation size={18} color="#FFFFFF" />}
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
  homeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  successBanner: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  checkCircle: {
    marginBottom: SPACING.sm,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  bookingIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  searchingCard: {
    marginHorizontal: SPACING.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: COLORS.surface,
  },
  radarCircle: {
    width: 70,
    height: 70,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  searchingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  searchingSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
  providerCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  etaHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.border,
  },
  providerMeta: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  proTag: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.pill,
    marginLeft: 6,
  },
  proTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  ratingStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  jobsCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  vehicleText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  providerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  actionContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    paddingVertical: 9,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    width: '35%',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    width: '65%',
    textAlign: 'right',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: SPACING.sm,
    borderRadius: RADII.md,
    marginTop: SPACING.sm,
  },
  securityText: {
    fontSize: 11,
    color: '#166534',
    marginLeft: 6,
    flex: 1,
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
