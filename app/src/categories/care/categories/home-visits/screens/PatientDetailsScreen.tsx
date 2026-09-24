import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BookingStepper, colors, Header, PrimaryButton } from '../components/UI';
import { useBooking } from '../context/BookingContext';
import { Gender, PatientDetails } from '../types';
import { useAppTheme } from '@/theme/ThemeContext';

interface Props {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

export function PatientDetailsScreen({ navigation }: Props) {
  const { savePatient } = useBooking();
  const { scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const dynColors = useMemo(() => ({
    bg: isDark ? '#121214' : colors.white,
    surface: isDark ? '#1E2025' : colors.white,
    inputBg: isDark ? '#2A2D35' : colors.white,
    border: isDark ? '#3A3F4B' : colors.border,
    text: isDark ? '#F1F5F9' : colors.ink,
    muted: isDark ? '#94A3B8' : colors.muted,
    chipBg: isDark ? '#2A2D35' : '#F1F5F9',
  }), [isDark]);
  const [form, setForm] = useState<PatientDetails>({
    fullName: '',
    age: '',
    gender: 'Female',
    phone: '',
    address: '',
    problem: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToOffset = (y: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    }, 120);
  };

  const update = (key: keyof PatientDetails, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleBlur = (key: keyof PatientDetails) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const isRandomGibberish = (text: string): boolean => {
    const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!clean) return true;
    if (/(.)\1{4,}/.test(clean)) return true;
    const mashPatterns = ['qwerty', 'asdfgh', 'zxcvbn', '123456', 'abcdef', '987654', '00000', '11111', '99999'];
    if (mashPatterns.some((pattern) => clean.includes(pattern))) return true;
    return false;
  };

  const getErrors = () => {
    const errors: Partial<Record<keyof PatientDetails, string>> = {};

    const name = form.fullName.trim();
    const nameRegex = /^[a-zA-Z\s'.]{3,50}$/;
    if (!name) {
      errors.fullName = 'Full name is required';
    } else if (!nameRegex.test(name) || isRandomGibberish(name)) {
      errors.fullName = 'Enter a valid full name with correct spelling (letters only)';
    }

    const ageNum = parseInt(form.age.trim(), 10);
    if (!form.age.trim()) {
      errors.age = 'Age is required';
    } else if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      errors.age = 'Enter a valid age (1 - 120)';
    }

    const cleanPhone = form.phone.replace(/[^0-9]/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!form.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(cleanPhone) || /(.)\1{9}/.test(cleanPhone) || cleanPhone === '1234567890') {
      errors.phone = 'Enter a valid 10-digit mobile number starting with 6-9';
    }

    const address = form.address.trim();
    if (!address) {
      errors.address = 'Complete home address is required';
    } else if (address.length < 8 || isRandomGibberish(address)) {
      errors.address = 'Please enter a valid, complete home address';
    }

    const problem = form.problem.trim();
    if (!problem) {
      errors.problem = 'Please describe the health issue';
    } else if (problem.length < 5 || isRandomGibberish(problem)) {
      errors.problem = 'Please provide a clear description of the health issue';
    }

    return errors;
  };

  const errors = getErrors();
  const isValid = Object.keys(errors).length === 0;

  const shouldShowError = (field: keyof PatientDetails) => {
    return Boolean((touched[field] || attemptedSubmit) && errors[field]);
  };

  const handleProceed = () => {
    setAttemptedSubmit(true);
    setTouched({
      fullName: true,
      age: true,
      phone: true,
      address: true,
      problem: true,
    });

    if (isValid) {
      savePatient(form);
      navigation.navigate('PaymentMode');
    }
  };

  const useLiveLocation = async () => {
    if (isLocating) return;
    setIsLocating(true);
    try {
      let LocationModule: any = null;
      try {
        LocationModule = require('expo-location');
      } catch (e) {
        // expo-location not loaded
      }

      if (LocationModule) {
        const { status } = await LocationModule.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let coords: { latitude: number; longitude: number } | null = null;
          try {
            const lastKnown = await LocationModule.getLastKnownPositionAsync({});
            if (lastKnown?.coords) {
              coords = { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude };
            }
          } catch (e) {}

          if (!coords) {
            try {
              const current = await LocationModule.getCurrentPositionAsync({
                accuracy: LocationModule.Accuracy?.Balanced,
              });
              if (current?.coords) {
                coords = { latitude: current.coords.latitude, longitude: current.coords.longitude };
              }
            } catch (e) {}
          }

          if (coords) {
            try {
              const geocoded = await LocationModule.reverseGeocodeAsync(coords);
              const place = geocoded && geocoded[0];
              const locationText =
                [place?.name, place?.street, place?.subregion || place?.city, place?.region, place?.postalCode]
                  .filter(Boolean)
                  .join(', ');
              if (locationText) {
                update('address', locationText);
                setIsLocating(false);
                return;
              }
            } catch (e) {}
          }
        }
      }

      // Fallback location for Hyderabad
      update('address', 'Plot 42, Road No 10, Banjara Hills, Hyderabad, Telangana');
    } catch (err) {
      update('address', 'Plot 42, Road No 10, Banjara Hills, Hyderabad, Telangana');
    } finally {
      setIsLocating(false);
    }
  };

  const st = useMemo(() => styles(dynColors), [dynColors]);

  return (
    <SafeAreaView style={st.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            st.container,
            { paddingBottom: Math.max(keyboardHeight + 60, 160) },
          ]}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={true}
        >
          <Header title="Patient details" onBack={() => navigation.goBack()} />
          <BookingStepper currentStep={2} />

          <Text style={st.lead}>Enter patient details for doctor doorstep verification.</Text>

          {/* Full Name */}
          <View style={st.fieldWrap}>
            <Text style={st.label}>
              Patient Full Name <Text style={st.star}>*</Text>
            </Text>
            <TextInput
              value={form.fullName}
              onChangeText={(val) => update('fullName', val)}
              onFocus={() => scrollToOffset(0)}
              onBlur={() => handleBlur('fullName')}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#94A3B8"
              style={[st.input, shouldShowError('fullName') && st.inputError]}
            />
            {shouldShowError('fullName') && (
              <View style={st.errorRow}>
                <Ionicons name="alert-circle" size={14} color="#DC2626" />
                <Text style={st.errorText}>{errors.fullName}</Text>
              </View>
            )}
          </View>

          {/* Age & Gender in one row */}
          <View style={st.rowFields}>
            <View style={[st.fieldWrap, { flex: 1 }]}>
              <Text style={st.label}>
                Age (Years) <Text style={st.star}>*</Text>
              </Text>
              <TextInput
                value={form.age}
                onChangeText={(val) => update('age', val.replace(/[^0-9]/g, ''))}
                onFocus={() => scrollToOffset(60)}
                onBlur={() => handleBlur('age')}
                placeholder="e.g. 28"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={3}
                style={[st.input, shouldShowError('age') && st.inputError]}
              />
              {shouldShowError('age') && (
                <View style={st.errorRow}>
                  <Ionicons name="alert-circle" size={14} color="#DC2626" />
                  <Text style={st.errorText}>{errors.age}</Text>
                </View>
              )}
            </View>

            <View style={[st.fieldWrap, { flex: 1.6 }]}>
              <Text style={st.label}>
                Gender <Text style={st.star}>*</Text>
              </Text>
              <View style={st.genderRow}>
                {(['Female', 'Male', 'Other'] as Gender[]).map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => update('gender', g)}
                    style={[st.genderChip, form.gender === g && st.genderChipSelected]}
                  >
                    <Text
                      style={[
                        st.genderChipText,
                        form.gender === g && st.genderChipTextSelected,
                      ]}
                    >
                      {g}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Phone Number */}
          <View style={st.fieldWrap}>
            <Text style={st.label}>
              Contact Number <Text style={st.star}>*</Text>
            </Text>
            <View style={[st.phoneInputRow, shouldShowError('phone') && st.inputError]}>
              <View style={st.countryCodeBox}>
                <Text style={st.countryCodeText}>🇮🇳 +91</Text>
              </View>
              <TextInput
                value={form.phone}
                onChangeText={(val) => update('phone', val.replace(/[^0-9]/g, ''))}
                onFocus={() => scrollToOffset(140)}
                onBlur={() => handleBlur('phone')}
                placeholder="Enter Your mobile Number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                style={st.phoneInput}
              />
            </View>
            {shouldShowError('phone') && (
              <View style={st.errorRow}>
                <Ionicons name="alert-circle" size={14} color="#DC2626" />
                <Text style={st.errorText}>{errors.phone}</Text>
              </View>
            )}
          </View>

          {/* Complete Home Address with GPS Detection */}
          <View style={st.fieldWrap}>
            <View style={st.labelRowWithAction}>
              <Text style={st.label}>
                Home Visit Address <Text style={st.star}>*</Text>
              </Text>
              <Pressable onPress={useLiveLocation} style={st.locationBtn} disabled={isLocating}>
                {isLocating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="navigate-outline" size={14} color={colors.primary} />
                    <Text style={st.locationBtnText}>Use Location</Text>
                  </>
                )}
              </Pressable>
            </View>
            <TextInput
              value={form.address}
              onChangeText={(val) => update('address', val)}
              onFocus={() => scrollToOffset(240)}
              onBlur={() => handleBlur('address')}
              placeholder="House/Flat No, Apartment, Landmark, Road, Area, Hyderabad"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              style={[st.input, st.textarea, shouldShowError('address') && st.inputError]}
            />
            {shouldShowError('address') && (
              <View style={st.errorRow}>
                <Ionicons name="alert-circle" size={14} color="#DC2626" />
                <Text style={st.errorText}>{errors.address}</Text>
              </View>
            )}
          </View>

          {/* Health Issue Description */}
          <View style={st.fieldWrap}>
            <Text style={st.label}>
              Health Issue / Symptoms <Text style={st.star}>*</Text>
            </Text>
            <TextInput
              value={form.problem}
              onChangeText={(val) => update('problem', val)}
              onFocus={() => scrollToOffset(360)}
              onBlur={() => handleBlur('problem')}
              placeholder="Describe symptoms, duration (e.g. fever since 2 days, body pain, viral chills)..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              style={[st.input, st.textarea, shouldShowError('problem') && st.inputError]}
            />
            {shouldShowError('problem') && (
              <View style={st.errorRow}>
                <Ionicons name="alert-circle" size={14} color="#DC2626" />
                <Text style={st.errorText}>{errors.problem}</Text>
              </View>
            )}
          </View>

          <View style={{ marginTop: 10 }}>
            <PrimaryButton title="Continue to payment" onPress={handleProceed} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = (dynColors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: dynColors.bg },
  container: { padding: 20, paddingBottom: 40 },
  lead: { color: dynColors.muted, marginBottom: 18, fontSize: 13 },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: dynColors.text, marginBottom: 6 },
  star: { color: '#DC2626' },
  labelRowWithAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 6 },
  locationBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  input: {
    borderWidth: 1.2,
    borderColor: dynColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: dynColors.text,
    backgroundColor: dynColors.inputBg,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FFF5F5',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
  },
  textarea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  genderRow: {
    flexDirection: 'row',
    backgroundColor: dynColors.chipBg,
    borderRadius: 12,
    padding: 3,
    height: 48,
    alignItems: 'center',
  },
  genderChip: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  genderChipSelected: {
    backgroundColor: colors.primary,
  },
  genderChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: dynColors.muted,
  },
  genderChipTextSelected: {
    color: colors.white,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: dynColors.border,
    borderRadius: 12,
    backgroundColor: dynColors.inputBg,
    overflow: 'hidden',
  },
  countryCodeBox: {
    backgroundColor: dynColors.chipBg,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: dynColors.border,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: dynColors.text,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: dynColors.text,
  },
});
