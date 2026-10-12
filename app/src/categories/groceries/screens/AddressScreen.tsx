import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme';
import { useGroceryColors } from '../theme/colors';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
import { Header } from '../components/Header';
import { AddressCard } from '../components/AddressCard';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { useUser } from '../context/UserContext';
import { Address } from '../types/user.types';
import { fetchLiveAddressDetails } from '../utils/helpers';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';

type AddressScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const AddressScreen: React.FC<AddressScreenProps> = ({ navigation }) => {
  const { addresses, selectedAddress, setSelectedAddress, addAddress } = useUser();
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const groceryColors = useGroceryColors();
  const isDark = isCategoryDark() || groceryColors.cardBackground === '#000000';
  const dynStyles = getStyles(isDark);

  // New Address Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Kurnool');
  const [state, setState] = useState('Andhra Pradesh');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [type, setType] = useState<'home' | 'work' | 'other'>('home');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setPhone('');
    setHouseNumber('');
    setStreet('');
    setArea('');
    setCity('Kurnool');
    setState('Andhra Pradesh');
    setPincode('');
    setLandmark('');
    setType('home');
  };

  const handleAddNewClick = () => {
    setShowChoiceModal(true);
  };

  const handleRequestLiveLocation = () => {
    setShowChoiceModal(false);
    setShowPermissionModal(true);
  };

  const handleManualEntry = () => {
    setShowChoiceModal(false);
    resetForm();
    setShowAddModal(true);
  };

  const handleConfirmLocationAccess = async () => {
    setShowPermissionModal(false);
    resetForm();

    try {
      const details = await fetchLiveAddressDetails();
      setHouseNumber(details.houseNo);
      setStreet(details.building);
      setArea(details.city);
      setCity(details.city);
      setState(details.state);
      setPincode(details.pincode);
      setLandmark(details.landmark);
      setShowAddModal(true);
    } catch (e) {
      console.warn('Location detection error', e);
      setHouseNumber('Current Location');
      setStreet('Main Road');
      setArea('Kurnool');
      setCity('Kurnool');
      setState('Andhra Pradesh');
      setPincode('518001');
      setShowAddModal(true);
    }
  };

  const handleSaveAddress = async () => {
    const cleanHouse = houseNumber.trim();
    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '');

    if (!cleanHouse) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('⚠️ Required Field: Please enter House / Flat No.');
      } else {
        Alert.alert('Required Field', 'Please enter House / Flat No.');
      }
      return;
    }

    if (!cleanName) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('⚠️ Receiver Name Required: Please enter the receiver\'s name.');
      } else {
        Alert.alert('Receiver Name Required', 'Please enter the receiver\'s name.');
      }
      return;
    }

    if (!cleanPhone) {
      const msg = '⚠️ Phone Number Required: Please enter receiver\'s 10-digit mobile number.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Phone Number Required', msg);
      }
      return;
    }

    if (cleanPhone.length !== 10) {
      const msg = `⚠️ Invalid Phone Number: Mobile number must be exactly 10 digits (you entered ${cleanPhone.length} digits).`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Invalid Phone Number', msg);
      }
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      const msg = '⚠️ Invalid Mobile Number: Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Invalid Mobile Number', msg);
      }
      return;
    }

    setLoading(true);
    try {
      await addAddress({
        name: cleanName,
        phone: cleanPhone,
        houseNumber: cleanHouse,
        street: street.trim(),
        area: area.trim(),
        city: city.trim() || 'Kurnool',
        state: state.trim() || 'Andhra Pradesh',
        pincode: pincode.trim(),
        landmark: landmark.trim(),
        type,
        isDefault: addresses.length === 0,
      });
      setShowAddModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={dynStyles.container}>
      <Header title="Select Delivery Address" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={dynStyles.scrollPadding}>
        <TouchableOpacity
          style={dynStyles.addNewButton}
          onPress={handleAddNewClick}
        >
          <Ionicons name="add-circle" size={22} color={isDark ? '#FFFFFF' : colors.primary} />
          <Text style={dynStyles.addNewText}>+ Add New Address</Text>
        </TouchableOpacity>

        <Text style={dynStyles.sectionTitle}>Saved Addresses</Text>

        {addresses.length === 0 ? (
          <View style={dynStyles.emptyCard}>
            <Ionicons name="location-outline" size={32} color={isDark ? '#E5E7EB' : colors.textMuted} />
            <Text style={dynStyles.emptyText}>No saved addresses found. Tap '+ Add New Address' above to set your location.</Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              selected={selectedAddress?.id === addr.id}
              onSelect={(a) => setSelectedAddress(a)}
            />
          ))
        )}
      </ScrollView>

      {/* Deliver Here CTA */}
      <View style={dynStyles.footer}>
        <CustomButton
          title="Deliver to this Address"
          onPress={() => navigation.navigate('DeliverySlot')}
          disabled={!selectedAddress}
          size="large"
          style={dynStyles.deliverBtn}
        />
      </View>

      {/* Choice Modal: Live Location vs Manual */}
      <Modal
        visible={showChoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChoiceModal(false)}
      >
        <View style={dynStyles.modalOverlay}>
          <View style={dynStyles.choiceCard}>
            <View style={dynStyles.choiceHeader}>
              <Text style={dynStyles.choiceTitle}>Add Delivery Address</Text>
              <TouchableOpacity onPress={() => setShowChoiceModal(false)}>
                <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={dynStyles.choiceSubtitle}>Choose how you want to add your address:</Text>

            <TouchableOpacity
              onPress={handleRequestLiveLocation}
              style={dynStyles.choiceOptionLive}
              activeOpacity={0.85}
            >
              <View style={dynStyles.choiceIconCircleLive}>
                <Ionicons name="navigate" size={22} color={isDark ? '#FFFFFF' : colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={dynStyles.choiceOptionTitleLive}>Add Live Location</Text>
                  <View style={dynStyles.pillBadge}>
                    <Text style={dynStyles.pillText}>AUTO GPS</Text>
                  </View>
                </View>
                <Text style={dynStyles.choiceOptionSub}>Auto-detect and fill current address via GPS</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={isDark ? '#FFFFFF' : colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleManualEntry}
              style={dynStyles.choiceOptionManual}
              activeOpacity={0.85}
            >
              <View style={dynStyles.choiceIconCircleManual}>
                <Ionicons name="create-outline" size={22} color={isDark ? '#FFFFFF' : colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={dynStyles.choiceOptionTitleManual}>Enter New Address</Text>
                <Text style={dynStyles.choiceOptionSub}>Type house no., street, area, and details manually</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={isDark ? '#FFFFFF' : colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Location Permission Modal */}
      <Modal
        visible={showPermissionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPermissionModal(false)}
      >
        <View style={dynStyles.modalOverlay}>
          <View style={dynStyles.choiceCard}>
            <View style={dynStyles.permissionIconCircle}>
              <Ionicons name="location" size={28} color={isDark ? '#FFFFFF' : colors.primary} />
            </View>
            <Text style={dynStyles.permissionTitle}>Allow Location Access?</Text>
            <Text style={dynStyles.permissionMessage}>
              OneBuddy needs your permission to access device GPS to automatically detect and fill your delivery address.
            </Text>

            <View style={dynStyles.permissionBtnRow}>
              <TouchableOpacity
                onPress={() => setShowPermissionModal(false)}
                style={dynStyles.permissionCancelBtn}
              >
                <Text style={dynStyles.permissionCancelText}>Don't Allow</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmLocationAccess}
                style={dynStyles.permissionAllowBtn}
              >
                <Text style={dynStyles.permissionAllowText}>Allow & Auto-Fill</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Address Form Modal */}
      <Modal visible={showAddModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000000' : colors.background }}>
          <Header
            title="Add New Address"
            showBack
            onBack={() => setShowAddModal(false)}
          />

          <ScrollView contentContainerStyle={{ padding: spacing.md }}>
            <Text style={dynStyles.modalSub}>Address Type</Text>
            <View style={dynStyles.typeSelectorRow}>
              {(['home', 'work', 'other'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    dynStyles.typeChip,
                    type === t && dynStyles.activeTypeChip,
                  ]}
                  onPress={() => setType(t)}
                >
                  <Text
                    style={[
                      dynStyles.typeChipText,
                      type === t && dynStyles.activeTypeChipText,
                    ]}
                  >
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <CustomInput label="Receiver Name" value={name} onChangeText={setName} />
            <CustomInput
              label="Phone Number (10 digits)"
              keyboardType="phone-pad"
              value={phone}
              maxLength={10}
              onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, 10))}
            />
            <CustomInput label="House / Flat No. *" value={houseNumber} onChangeText={setHouseNumber} />
            <CustomInput label="Street / Apartment" value={street} onChangeText={setStreet} />
            <CustomInput label="Area / Locality" value={area} onChangeText={setArea} />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <CustomInput
                label="City"
                value={city}
                onChangeText={setCity}
                containerStyle={{ flex: 1 }}
              />
              <CustomInput
                label="Pincode"
                keyboardType="number-pad"
                value={pincode}
                onChangeText={setPincode}
                containerStyle={{ flex: 1 }}
              />
            </View>

            <CustomInput label="Landmark (Optional)" value={landmark} onChangeText={setLandmark} />

            <CustomButton
              title="Save & Deliver Here"
              onPress={handleSaveAddress}
              loading={loading}
              size="large"
              style={{ marginTop: spacing.md }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000000' : colors.background,
  },
  scrollPadding: {
    padding: spacing.md,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? '#000000' : colors.cardBackground,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1.5,
    borderColor: isDark ? '#FFFFFF' : colors.primary,
    borderStyle: 'dashed',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  addNewText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.primary,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    marginBottom: spacing.sm,
  },
  footer: {
    backgroundColor: isDark ? '#000000' : colors.cardBackground,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
  },
  deliverBtn: {
    width: '100%',
  },
  modalSub: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    marginBottom: spacing.xs,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeChip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.borderRadius.round,
    backgroundColor: isDark ? '#000000' : colors.background,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.2)' : colors.border,
  },
  activeTypeChip: {
    backgroundColor: isDark ? '#FFFFFF' : colors.primary,
    borderColor: isDark ? '#FFFFFF' : colors.primary,
  },
  typeChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: isDark ? '#FFFFFF' : colors.textSecondary,
  },
  activeTypeChipText: {
    color: isDark ? '#000000' : colors.white,
  },
  emptyCard: {
    padding: spacing.xl,
    backgroundColor: isDark ? '#000000' : colors.cardBackground,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 13,
    color: isDark ? '#E5E7EB' : colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 9999,
  },
  choiceCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: isDark ? '#000000' : colors.cardBackground,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
  },
  choiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  choiceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: isDark ? '#FFFFFF' : colors.textPrimary,
  },
  choiceSubtitle: {
    fontSize: 12,
    color: isDark ? '#E5E7EB' : colors.textMuted,
    marginBottom: 16,
  },
  choiceOptionLive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(95,163,0,0.2)' : colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: isDark ? '#5FA300' : colors.primaryMedium,
    marginBottom: 12,
  },
  choiceIconCircleLive: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: isDark ? '#000000' : colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: isDark ? '#5FA300' : colors.primaryMedium,
  },
  choiceOptionTitleLive: {
    fontSize: 14,
    fontWeight: '800',
    color: isDark ? '#FFFFFF' : colors.primaryDark,
  },
  pillBadge: {
    backgroundColor: isDark ? '#5FA300' : colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  choiceOptionSub: {
    fontSize: 11,
    color: isDark ? '#E5E7EB' : colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  choiceOptionManual: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#000000' : colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
  },
  choiceIconCircleManual: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : colors.borderLight,
  },
  choiceOptionTitleManual: {
    fontSize: 14,
    fontWeight: '700',
    color: isDark ? '#FFFFFF' : colors.textPrimary,
  },
  permissionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: isDark ? 'rgba(95,163,0,0.2)' : colors.primaryLight,
    borderWidth: 1.5,
    borderColor: isDark ? '#5FA300' : colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  permissionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: isDark ? '#FFFFFF' : colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  permissionMessage: {
    fontSize: 13,
    color: isDark ? '#E5E7EB' : colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  permissionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  permissionCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: isDark ? '#000000' : colors.background,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.2)' : colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#FFFFFF' : colors.textPrimary,
  },
  permissionAllowBtn: {
    flex: 1.2,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: isDark ? '#FFFFFF' : colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionAllowText: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#000000' : colors.white,
  },
});
