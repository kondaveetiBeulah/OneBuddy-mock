import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  Navigation,
  Check,
  Plus,
  Home,
  Briefcase,
  Users,
  Building,
  ChevronRight,
} from 'lucide-react-native';
import { Address } from '../../types';
import { useBooking } from '../../context/BookingContext';
import { ModalContainer } from '../common/ModalContainer';
import { Button } from '../common/Button';
import { COLORS, RADII, SPACING } from '../../theme';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  onAddNewAddressPress?: () => void;
}

type AddressCategoryType = 'Home' | 'Office' | 'Parents' | 'Other';

export const LocationModal: React.FC<LocationModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    currentAddress,
    savedAddresses,
    setCurrentAddress,
    setLiveGpsLocation,
    addNewAddress,
  } = useBooking();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addrType, setAddrType] = useState<AddressCategoryType>('Home');
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);

  const handleUseGps = () => {
    setDetectingGps(true);
    setTimeout(() => {
      setLiveGpsLocation();
      setDetectingGps(false);
      onClose();
    }, 600);
  };

  const handleOpenFormForType = (type: AddressCategoryType) => {
    setAddrType(type);
    setShowAddForm(true);
  };

  const handleSelectSaved = (addr: Address) => {
    setCurrentAddress(addr);
    onClose();
  };

  const handleSaveNewAddress = () => {
    if (!houseNo.trim() || !street.trim()) return;

    addNewAddress({
      type: addrType,
      label: `${addrType} Address`,
      houseNo: houseNo.trim(),
      street: street.trim(),
      landmark: landmark.trim() || 'Nearby',
      city: 'Bangalore',
      pincode: pincode.trim() || '560001',
      isDefault: false,
    });

    // Reset Form
    setHouseNo('');
    setStreet('');
    setLandmark('');
    setPincode('');
    setShowAddForm(false);
    onClose();
  };

  const getAddressIcon = (type: AddressCategoryType | string) => {
    switch (type) {
      case 'Home':
        return <Home size={18} color={COLORS.primary} />;
      case 'Office':
        return <Briefcase size={18} color={COLORS.secondary} />;
      case 'Parents':
        return <Users size={18} color="#8B5CF6" />;
      default:
        return <Building size={18} color={COLORS.accent} />;
    }
  };

  const addressTypeOptions: { type: AddressCategoryType; title: string; subtitle: string; icon: React.ReactNode }[] = [
    {
      type: 'Home',
      title: 'Home',
      subtitle: 'Add apartment / flat / house details',
      icon: <Home size={20} color={COLORS.primary} />,
    },
    {
      type: 'Office',
      title: 'Office',
      subtitle: 'Add workplace / tech park address',
      icon: <Briefcase size={20} color={COLORS.secondary} />,
    },
    {
      type: 'Parents',
      title: 'Parents',
      subtitle: 'Add parents or family residence',
      icon: <Users size={20} color="#8B5CF6" />,
    },
    {
      type: 'Other',
      title: 'Other',
      subtitle: 'Add hotel, friend or custom location',
      icon: <Building size={20} color={COLORS.accent} />,
    },
  ];

  return (
    <ModalContainer
      visible={visible}
      onClose={() => {
        setShowAddForm(false);
        onClose();
      }}
      title={showAddForm ? `Add ${addrType} Address` : 'Select Delivery Location'}
      subtitle={
        showAddForm
          ? 'Enter your detailed house and street address'
          : 'Choose live GPS or select an address type to add'
      }
    >
      {showAddForm ? (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.formContainer}>
          {/* Address Type Selector */}
          <Text style={styles.fieldLabel}>Address Type</Text>
          <View style={styles.typeRow}>
            {(['Home', 'Office', 'Parents', 'Other'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typePill,
                  addrType === type && styles.activeTypePill,
                ]}
                onPress={() => setAddrType(type)}
              >
                {getAddressIcon(type)}
                <Text
                  style={[
                    styles.typeText,
                    addrType === type && styles.activeTypeText,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form Fields */}
          <Text style={styles.fieldLabel}>Flat / House / Building No. *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Flat 304, Green Heights"
            placeholderTextColor={COLORS.textMuted}
            value={houseNo}
            onChangeText={setHouseNo}
          />

          <Text style={styles.fieldLabel}>Street / Area / Road *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 12th Main Road, Indiranagar"
            placeholderTextColor={COLORS.textMuted}
            value={street}
            onChangeText={setStreet}
          />

          <Text style={styles.fieldLabel}>Landmark (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Near Metro Station / Park"
            placeholderTextColor={COLORS.textMuted}
            value={landmark}
            onChangeText={setLandmark}
          />

          <Text style={styles.fieldLabel}>Pincode</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 560038"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            value={pincode}
            onChangeText={setPincode}
          />

          <View style={styles.formActions}>
            <Button
              title="Save & Use Address"
              onPress={handleSaveNewAddress}
              disabled={!houseNo.trim() || !street.trim()}
              variant="primary"
              size="lg"
            />
            <Button
              title="Back to Options"
              onPress={() => setShowAddForm(false)}
              variant="ghost"
              size="md"
              style={{ marginTop: SPACING.xs }}
            />
          </View>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.listContainer}>
          {/* 1. GPS Live Location Option (Text removed as requested) */}
          <TouchableOpacity
            style={styles.gpsCard}
            activeOpacity={0.8}
            onPress={handleUseGps}
            disabled={detectingGps}
          >
            <View style={styles.gpsIconCircle}>
              {detectingGps ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Navigation size={20} color="#FFFFFF" />
              )}
            </View>
            <View style={styles.gpsTextContainer}>
              <Text style={styles.gpsTitle}>
                {detectingGps ? 'Detecting Live GPS...' : 'Use Current Live Location'}
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Saved Addresses List (if any were created) */}
          {savedAddresses.length > 0 && (
            <View style={styles.savedSection}>
              <Text style={styles.sectionHeaderTitle}>SAVED ADDRESSES</Text>
              {savedAddresses.map((addr) => {
                const isSelected = currentAddress?.id === addr.id;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={[
                      styles.savedAddressCard,
                      isSelected && styles.selectedAddressCard,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => handleSelectSaved(addr)}
                  >
                    <View style={styles.addressLeft}>
                      <View style={styles.addressIconWrapper}>
                        {getAddressIcon(addr.type)}
                      </View>
                      <View style={styles.addressInfo}>
                        <Text style={styles.addressLabel}>{addr.label}</Text>
                        <Text style={styles.addressLine} numberOfLines={1}>
                          {addr.houseNo}, {addr.street}
                        </Text>
                        <Text style={styles.addressCity}>
                          {addr.city} - {addr.pincode}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <Check size={14} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 2. Category Options for Home / Office / Parents / Other */}
          <View style={styles.divider}>
            <Text style={styles.dividerText}>ENTER ADDRESS FOR</Text>
          </View>

          <View style={styles.optionsList}>
            {addressTypeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.type}
                style={styles.optionCard}
                activeOpacity={0.75}
                onPress={() => handleOpenFormForType(opt.type)}
              >
                <View style={styles.optionIconCircle}>
                  {opt.icon}
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{opt.title}</Text>
                  <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
                </View>
                <View style={styles.optionAddButton}>
                  <Plus size={14} color={COLORS.primary} />
                  <Text style={styles.optionAddText}>Enter</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel button */}
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.7}
            onPress={onClose}
          >
            <Text style={styles.cancelBtnText}>Cancel / Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    maxHeight: 460,
  },
  formContainer: {
    maxHeight: 460,
  },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primaryMuted,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  gpsIconCircle: {
    width: 42,
    height: 42,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  gpsTextContainer: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  divider: {
    alignItems: 'center',
    marginVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  dividerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  savedSection: {
    marginBottom: SPACING.md,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  savedAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  selectedAddressCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  addressIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addressLine: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  addressCity: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
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
  optionsList: {
    marginTop: SPACING.xs,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  optionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  optionSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  optionAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
  },
  optionAddText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginLeft: 3,
  },
  // Form styles
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.xs,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.surface,
  },
  activeTypePill: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  activeTypeText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  formActions: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
