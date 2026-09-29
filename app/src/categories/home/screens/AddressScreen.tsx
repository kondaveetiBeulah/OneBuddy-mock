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
  MapPin,
  Navigation,
  Plus,
  Home,
  Briefcase,
  Building,
  CheckCircle,
  ArrowRight,
  Shield,
  Edit2,
} from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';
import { Address } from '../types';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { LocationModal } from '../components/home/LocationModal';
import { useHomeTheme, COLORS, RADII, SPACING, SHADOWS } from '../theme';

interface AddressScreenProps {
  navigation: any;
  route?: any;
}

export const AddressScreen: React.FC<AddressScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useHomeTheme();
  const {
    currentAddress,
    savedAddresses,
    setCurrentAddress,
    setLiveGpsLocation,
    selectedDate,
    selectedTimeSlot,
  } = useBooking();

  const [modalVisible, setModalVisible] = useState(false);
  const fromBooking = route?.params?.fromBooking;

  const handleProceed = () => {
    if (!currentAddress) return;
    if (fromBooking) {
      navigation.navigate('Payment');
    } else {
      navigation.navigate('MainTabs', { initialTab: 'Home' });
    }
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'Home':
        return <Home size={18} color={COLORS.primary} />;
      case 'Office':
        return <Briefcase size={18} color={COLORS.secondary} />;
      default:
        return <Building size={18} color={COLORS.accent} />;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <Header
        title="Select Service Address"
        subtitle="Where should our technician report?"
        onBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('MainTabs', { initialTab: 'Home' });
          }
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
      >
        {/* Scheduled Slot Reminder Card (Only during active booking) */}
        {fromBooking && selectedDate && selectedTimeSlot && (
          <View style={styles.scheduleReminder}>
            <Text style={styles.reminderLabel}>SCHEDULED TIME:</Text>
            <Text style={styles.reminderValue}>
              {selectedDate?.fullDate} • {selectedTimeSlot?.timeRange}
            </Text>
          </View>
        )}

        {/* GPS Live Location Quick Action */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.gpsBanner}
            activeOpacity={0.8}
            onPress={() => setLiveGpsLocation()}
          >
            <View style={styles.gpsIconCircle}>
              <Navigation size={20} color="#FFFFFF" />
            </View>
            <View style={styles.gpsInfo}>
              <Text style={styles.gpsTitle}>Use Current Live Location</Text>
            </View>
            <View style={styles.gpsPill}>
              <Text style={styles.gpsPillText}>Detect</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Saved Addresses List */}
        {savedAddresses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Saved Addresses</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={styles.addInlineBtn}
              >
                <Plus size={14} color={COLORS.primary} />
                <Text style={styles.addInlineText}>Add New</Text>
              </TouchableOpacity>
            </View>

          {savedAddresses.map((addr) => {
            const isSelected = currentAddress?.id === addr.id;

            return (
              <Card
                key={addr.id}
                style={[
                  styles.addressCard,
                  isSelected && styles.selectedAddressCard,
                ]}
                variant={isSelected ? 'elevated' : 'outlined'}
                onPress={() => setCurrentAddress(addr)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.typeBadgeRow}>
                    <View style={styles.iconCircle}>{getAddressIcon(addr.type)}</View>
                    <Text style={styles.addressLabel}>{addr.label}</Text>
                    {addr.isDefault && (
                      <View style={styles.defaultPill}>
                        <Text style={styles.defaultText}>DEFAULT</Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && (
                      <CheckCircle size={16} color="#FFFFFF" />
                    )}
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.houseText}>{addr.houseNo}</Text>
                  <Text style={styles.streetText}>
                    {addr.street}, {addr.landmark}
                  </Text>
                  <Text style={styles.cityText}>
                    {addr.city}, Karnataka - {addr.pincode}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
        )}

        {/* Add New Address Action Card */}
        <TouchableOpacity
          style={styles.addNewCard}
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.addIconCircle}>
            <Plus size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addNewTitle}>Add Another Address</Text>
            <Text style={styles.addNewSubtitle}>
              Save apartment, flat or company location
            </Text>
          </View>
        </TouchableOpacity>

        {/* Delivery Safety Banner */}
        <View style={styles.safetyCard}>
          <Shield size={18} color={COLORS.success} />
          <Text style={styles.safetyText}>
            Safe contactless entry option available. Professional will wear masks and shoe covers.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, SPACING.md) },
        ]}
      >
        <View style={styles.bottomSummary}>
          <Text style={styles.bottomDeliverTo}>DELIVER SERVICE TO:</Text>
          <Text style={styles.bottomAddressName} numberOfLines={1}>
            {currentAddress ? `${currentAddress.label} (${currentAddress.houseNo})` : 'Select an address'}
          </Text>
        </View>

        <Button
          title={fromBooking ? "Proceed to Payment" : "Save & Set Address"}
          onPress={handleProceed}
          disabled={!currentAddress}
          rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
          size="lg"
          style={{ width: fromBooking ? '52%' : '56%' }}
        />
      </View>

      <LocationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
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
  scheduleReminder: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.primaryMuted,
  },
  reminderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  reminderValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADII.xl,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  gpsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  gpsInfo: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  gpsSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  gpsPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  gpsPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  addInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addInlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 3,
  },
  addressCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  selectedAddressCard: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  defaultPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADII.pill,
    marginLeft: 6,
  },
  defaultText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: RADII.pill,
    borderWidth: 1.5,
    borderColor: COLORS.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cardBody: {
    paddingLeft: 40,
  },
  houseText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  streetText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cityText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
  },
  addIconCircle: {
    width: 36,
    height: 36,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  addNewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  addNewSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  safetyText: {
    fontSize: 11,
    color: '#166534',
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 15,
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
  bottomSummary: {
    flex: 1,
    marginRight: SPACING.md,
  },
  bottomDeliverTo: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  bottomAddressName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
});
