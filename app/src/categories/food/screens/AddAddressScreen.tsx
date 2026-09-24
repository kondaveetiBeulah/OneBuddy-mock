import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Home, Building, MapPin, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isCategoryDark } from '@/theme/categoryThemeBridge';
import { saveAddress, updateAddress, Address } from '../data/address';
import { useCart } from '../context/CartContext';

interface AddAddressScreenProps {
  onBack: () => void;
  onSaveSuccess?: () => void;
  initialData?: Address | null;
}

type AddressLabel = 'Home' | 'Work' | 'Other';

export const AddAddressScreen: React.FC<AddAddressScreenProps> = ({ onBack, onSaveSuccess, initialData }) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);
  const [houseNo, setHouseNo] = useState(initialData?.houseNo || '');
  const [building, setBuilding] = useState(initialData?.building || '');
  const [landmark, setLandmark] = useState(initialData?.landmark || '');
  const [label, setLabel] = useState<AddressLabel | ''>((initialData?.label as AddressLabel) || '');
  const [receiverName, setReceiverName] = useState(initialData?.receiverName || '');
  const [receiverPhone, setReceiverPhone] = useState(initialData?.receiverPhone || '');

  useEffect(() => {
    if (initialData) {
      setHouseNo(initialData.houseNo || '');
      setBuilding(initialData.building || '');
      setLandmark(initialData.landmark || '');
      setLabel((initialData.label as AddressLabel) || '');
      setReceiverName(initialData.receiverName || '');
      setReceiverPhone(initialData.receiverPhone || '');
    } else {
      setHouseNo('');
      setBuilding('');
      setLandmark('');
      setLabel('');
      setReceiverName('');
      setReceiverPhone('');
    }
  }, [initialData]);

  const isPhoneInvalid = receiverPhone.length > 0 && receiverPhone.length !== 10;
  const isSaveEnabled = houseNo.trim().length > 0 && !isPhoneInvalid;
  const { setActiveAddress } = useCart();

  const handleSave = async () => {
    if (!isSaveEnabled) return;
    
    const addressData = {
      label: label || 'Other',
      houseNo,
      building,
      landmark,
      receiverName,
      receiverPhone,
    };

    let newAddress;
    if (initialData?.id && initialData.id !== 'temp_gps') {
      newAddress = await updateAddress(initialData.id, addressData) || { ...addressData, id: initialData.id };
    } else {
      newAddress = await saveAddress(addressData);
    }
    setActiveAddress(newAddress);
    
    if (onSaveSuccess) {
      onSaveSuccess();
    } else {
      onBack();
    }
  };

  const isDark = isCategoryDark();

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#121214' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }, isDark && { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}>
        <TouchableOpacity 
          onPress={onBack} 
          style={[styles.backBtn, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}
          activeOpacity={0.5}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <ChevronLeft size={24} color={isDark ? '#F1F1EC' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: '#F1F1EC' }]}>{initialData ? 'Edit Address Details' : 'Add Address Details'}</Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 30 }]}
          showsVerticalScrollIndicator={true}
          indicatorStyle={isDark ? "black" : "white"}
          keyboardShouldPersistTaps="handled"
        >
          {/* Add Address Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && { color: '#F1F1EC' }]}>Add address</Text>

            <View style={styles.inputsContainer}>
              <TextInput
                style={[styles.input, isDark && { backgroundColor: '#1D1E22', color: '#F1F1EC', borderColor: 'rgba(255, 255, 255, 0.08)' }]}
                placeholder="House No. & Floor"
                placeholderTextColor={isDark ? '#9BA08F' : '#6B7280'}
                value={houseNo}
                onChangeText={setHouseNo}
              />
              <TextInput
                style={[styles.input, isDark && { backgroundColor: '#1D1E22', color: '#F1F1EC', borderColor: 'rgba(255, 255, 255, 0.08)' }]}
                placeholder="Building & Block No. (Optional)"
                placeholderTextColor={isDark ? '#9BA08F' : '#6B7280'}
                value={building}
                onChangeText={setBuilding}
              />
              <TextInput
                style={[styles.input, isDark && { backgroundColor: '#1D1E22', color: '#F1F1EC', borderColor: 'rgba(255, 255, 255, 0.08)' }]}
                placeholder="Landmark & Area Name (Optional)"
                placeholderTextColor={isDark ? '#9BA08F' : '#6B7280'}
                value={landmark}
                onChangeText={setLandmark}
              />
            </View>
          </View>

          {/* Add Address Label Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && { color: '#F1F1EC' }]}>Add address label</Text>
            <View style={styles.labelsContainer}>
              <TouchableOpacity
                style={[styles.labelBtn, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' }, label === 'Home' && styles.labelBtnActive]}
                onPress={() => setLabel('Home')}
              >
                <Home size={16} color={label === 'Home' ? '#F43F5E' : (isDark ? '#9BA08F' : '#6B7280')} />
                <Text style={[styles.labelText, isDark && { color: '#9BA08F' }, label === 'Home' && styles.labelTextActive]}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.labelBtn, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' }, label === 'Work' && styles.labelBtnActive]}
                onPress={() => setLabel('Work')}
              >
                <Building size={16} color={label === 'Work' ? '#F43F5E' : (isDark ? '#9BA08F' : '#6B7280')} />
                <Text style={[styles.labelText, isDark && { color: '#9BA08F' }, label === 'Work' && styles.labelTextActive]}>Work</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.labelBtn, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' }, label === 'Other' && styles.labelBtnActive]}
                onPress={() => setLabel('Other')}
              >
                <MapPin size={16} color={label === 'Other' ? '#F43F5E' : (isDark ? '#9BA08F' : '#6B7280')} />
                <Text style={[styles.labelText, isDark && { color: '#9BA08F' }, label === 'Other' && styles.labelTextActive]}>Other</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add Receiver Details Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && { color: '#F1F1EC' }]}>Add receiver details</Text>

            <View style={styles.receiverInputsContainer}>
              <View style={styles.receiverInputWrapper}>
                <View style={[styles.floatingLabel, isDark && { backgroundColor: '#1D1E22' }]}>
                  <Text style={[styles.floatingLabelText, isDark && { color: '#9BA08F' }]}>Receiver's Name</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.receiverInput, isDark && { backgroundColor: '#1D1E22', color: '#F1F1EC', borderColor: 'rgba(255, 255, 255, 0.08)' }]}
                  value={receiverName}
                  onChangeText={setReceiverName}
                  placeholderTextColor={isDark ? '#9BA08F' : '#6B7280'}
                />
                {receiverName.length > 0 && (
                  <TouchableOpacity onPress={() => setReceiverName('')} style={styles.clearBtn}>
                    <X size={14} color={isDark ? '#F1F1EC' : '#111827'} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.receiverInputWrapper}>
                <View style={[styles.floatingLabel, isDark && { backgroundColor: '#1D1E22' }]}>
                  <Text style={[styles.floatingLabelText, isDark && { color: '#9BA08F' }]}>Receiver's Phone Number</Text>
                </View>
                <View style={[styles.input, styles.phoneInputContainer, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' }, isPhoneInvalid && styles.inputError]}>
                  <Text style={[styles.phonePrefix, isDark && { color: '#F1F1EC', borderRightColor: 'rgba(255, 255, 255, 0.08)' }]}>+91</Text>
                  <TextInput
                    style={[styles.phoneInput, isDark && { color: '#F1F1EC' }]}
                    value={receiverPhone}
                    onChangeText={(text) => setReceiverPhone(text.replace(/[^0-9]/g, ''))}
                    keyboardType="phone-pad"
                    maxLength={15}
                    placeholderTextColor={isDark ? '#9BA08F' : '#6B7280'}
                  />
                  {receiverPhone.length > 0 && (
                    <TouchableOpacity onPress={() => setReceiverPhone('')} style={styles.clearBtn}>
                      <X size={14} color={isDark ? '#F1F1EC' : '#111827'} />
                    </TouchableOpacity>
                  )}
                </View>
                {isPhoneInvalid && (
                  <Text style={styles.errorText}>Phone number must be exactly 10 digits</Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, isDark && { backgroundColor: '#1D1E22', borderTopColor: 'rgba(255, 255, 255, 0.08)' }]}>
          <TouchableOpacity onPress={handleSave} disabled={!isSaveEnabled} activeOpacity={0.8}>
            {isSaveEnabled ? (
              <View style={[styles.saveBtn, { backgroundColor: '#F43F5E' }]}>
                <Text style={[styles.saveBtnText, { color: '#FFF' }]}>{initialData ? 'Update Address' : 'Save Address'}</Text>
              </View>
            ) : (
              <View style={[styles.saveBtn, styles.saveBtnDisabled]}>
                <Text style={[styles.saveBtnText, styles.saveBtnTextDisabled]}>{initialData ? 'Update Address' : 'Save Address'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    padding: 16,
    paddingBottom: 250,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  inputsContainer: {
    gap: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    color: '#111827',
    fontSize: 15,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
  labelsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  labelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  labelBtnActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: '#F43F5E',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  labelTextActive: {
    color: '#F43F5E',
  },
  receiverInputsContainer: {
    gap: 20,
    marginTop: 8,
  },
  receiverInputWrapper: {
    position: 'relative',
  },
  floatingLabel: {
    position: 'absolute',
    top: -10,
    left: 16,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  floatingLabelText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  receiverInput: {
    paddingRight: 40,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  phonePrefix: {
    color: '#111827',
    fontWeight: '500',
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.05)',
  },
  phoneInput: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    paddingHorizontal: 16,
    height: '100%',
  },
  clearBtn: {
    position: 'absolute',
    right: 16,
    top: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: 'rgba(13, 9, 18, 0.9)',
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  saveBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveBtnTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
