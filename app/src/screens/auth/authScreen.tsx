/**
 * AuthScreen — combined Login / Sign-Up entry screen.
 *
 * Layout: static cream background + a floating white card.
 * The CARD flips (3-D rotateY) when switching between Login and Sign Up.
 * Now includes both Mobile and OTP fields on the same screen,
 * plus comprehensive per-field validation, visual feedback (error & success states),
 * input constraints, and Google Sign-In button.
 */
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  KeyboardAvoidingView,
  Modal,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useOtpAuth } from '@/auth/OtpAuthContext';
import { OTP_LENGTH, OTP_RESEND_SECONDS } from '@/auth/otpProvider';
import { useAuth } from '@/firebase/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import type { RootScreenProps } from '@/navigation/types';
import OrbitingLogo from '@/components/OrbitingLogo';
import { brand } from '@/design/tokens';

/* ── palette ── */
const C = {
  bg: '#EFF2E8',          // outer cream/green tint background
  card: '#F8FAF4',        // white-ish card surface
  inputBg: '#EAEEE3',     // slightly darker for input sections
  border: '#D8DDD0',
  text: '#1B1B1B',
  textDim: '#6B7266',
  green: '#5FA300',
  greenLight: '#7EC400',
  greenInk: '#17240A',
  white: '#FFFFFF',
  error: '#D93025',
  errorBg: '#FFF2F0',
  errorBorder: '#F8B4B4',
  validBorder: '#7EC400',
  googleBorder: '#E0E0E0',
} as const;

export type Tab = 'login' | 'signup';
export type Step = 'phone' | 'otp';

export interface FieldErrors {
  fullName?: string | null;
  dob?: string | null;
  email?: string | null;
  phone?: string | null;
  otp?: string | null;
}

export interface TouchedFields {
  fullName?: boolean;
  dob?: boolean;
  email?: boolean;
  phone?: boolean;
  otp?: boolean;
}

const FLIP_MS = 480;

/* ─────────────── Validation Helpers ─────────────── */

export function validateFullName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Full name is required.';
  }
  if (trimmed.length < 2) {
    return 'Name must be at least 2 characters.';
  }
  if (trimmed.length > 50) {
    return 'Name cannot exceed 50 characters.';
  }
  // Allow letters, spaces, hyphens, apostrophes, and periods (for initials)
  const nameRegex = /^[a-zA-Z\s'.-]+$/;
  if (!nameRegex.test(trimmed)) {
    return 'Name can only contain letters, spaces, hyphens, and periods.';
  }
  return null;
}

export function validateDob(dobStr: string): string | null {
  const trimmed = dobStr.trim();
  if (!trimmed) {
    return 'Date of Birth is required.';
  }
  const normalized = trimmed.replace(/-/g, '/');
  const match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return 'Enter Date of Birth in DD/MM/YYYY format.';
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  const today = new Date();

  if (month < 1 || month > 12) {
    return 'Invalid month (01-12).';
  }
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return `Invalid day for month ${month} (01-${daysInMonth}).`;
  }

  const birthDate = new Date(year, month - 1, day);
  if (birthDate > today) {
    return 'Date of Birth cannot be in the future.';
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 14) {
    return 'You must be at least 14 years old to sign up.';
  }
  if (age > 90) {
    return 'Please enter a valid Date of Birth (max 90 years).';
  }

  return null;
}

export function validateEmail(emailStr: string): string | null {
  const trimmed = emailStr.trim();
  if (!trimmed) {
    return 'Email address is required.';
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return 'Enter a valid email address (e.g. name@domain.com).';
  }
  return null;
}

export function cleanPhoneNumber(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

export function validatePhone(phoneStr: string): string | null {
  const clean = cleanPhoneNumber(phoneStr);
  if (!clean) {
    return 'Mobile number is required.';
  }
  if (clean.length !== 10) {
    return 'Mobile number must be exactly 10 digits.';
  }
  if (!/^[6-9]/.test(clean)) {
    return 'Enter a valid mobile number starting with 6, 7, 8, or 9.';
  }
  return null;
}

export function validateOtp(digits: string[]): string | null {
  if (digits.some((d) => !d || !/^\d$/.test(d))) {
    return `Please enter all ${OTP_LENGTH} digits of the verification code.`;
  }
  return null;
}

/* ─────────────── sub-components ─────────────── */

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.7449 12.27C23.7449 11.48 23.6749 10.73 23.5549 10H12.2148V14.51H18.7248C18.4348 15.99 17.5848 17.24 16.3248 18.09V21.09H20.1848C22.4749 18.98 23.7449 15.92 23.7449 12.27Z"
      />
      <Path
        fill="#34A853"
        d="M12.2148 24C15.4648 24 18.1648 22.92 20.1848 21.09L16.3248 18.09C15.2448 18.82 13.8748 19.25 12.2148 19.25C9.00483 19.25 6.27483 17.09 5.32483 14.18H1.35483V17.26C3.35483 21.24 7.45483 24 12.2148 24Z"
      />
      <Path
        fill="#FBBC05"
        d="M5.32483 14.18C5.07483 13.45 4.94483 12.68 4.94483 11.9C4.94483 11.12 5.07483 10.35 5.32483 9.62001V6.54001H1.35483C0.534826 8.16001 0.0848255 10.01 0.0848255 11.9C0.0848255 13.79 0.534826 15.64 1.35483 17.26L5.32483 14.18Z"
      />
      <Path
        fill="#EA4335"
        d="M12.2148 4.54999C13.9848 4.54999 15.5648 5.15999 16.8148 6.35999L20.2648 2.90999C18.1548 0.949992 15.4548 -8.45464e-05 12.2148 -8.45464e-05C7.45483 -8.45464e-05 3.35483 2.75992 1.35483 6.54001L5.32483 9.62001C6.27483 6.71001 9.00483 4.54999 12.2148 4.54999Z"
      />
    </Svg>
  );
}

function DatePickerModal({
  visible,
  currentValue,
  onClose,
  onSelect,
}: {
  visible: boolean;
  currentValue: string;
  onClose: () => void;
  onSelect: (dateStr: string) => void;
}) {
  const today = new Date();

  const maxYear = today.getFullYear() - 14;
  const minYear = today.getFullYear() - 90;

  const parseInitial = () => {
    if (currentValue) {
      const parts = currentValue.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        if (
          !isNaN(d) &&
          !isNaN(m) &&
          !isNaN(y) &&
          m >= 0 &&
          m < 12 &&
          y >= minYear &&
          y <= maxYear
        ) {
          return { d, m, y };
        }
      }
    }
    return { d: 1, m: 0, y: Math.min(2004, maxYear) };
  };

  const initial = parseInitial();
  const [viewYear, setViewYear] = useState(initial.y);
  const [viewMonth, setViewMonth] = useState(initial.m);
  const [selDay, setSelDay] = useState(initial.d);
  const [showYearList, setShowYearList] = useState(false);

  useEffect(() => {
    if (visible) {
      const init = parseInitial();
      setViewYear(init.y);
      setViewMonth(init.m);
      setSelDay(init.d);
      setShowYearList(false);
    }
  }, [visible, currentValue]);

  if (!visible) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleConfirm = () => {
    const formatted = `${String(selDay).padStart(2, '0')}/${String(viewMonth + 1).padStart(2, '0')}/${viewYear}`;
    onSelect(formatted);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose}>
        <Pressable style={s.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={s.calendarHeader}>
            <Text style={s.calendarHeaderTitle}>Select Date of Birth</Text>
            <Text style={s.calendarHeaderDate}>
              {`${String(selDay).padStart(2, '0')} ${monthNames[viewMonth]} ${viewYear}`}
            </Text>
          </View>

          {/* Month & Year Navigation */}
          <View style={s.monthBar}>
            <Pressable onPress={handlePrevMonth} style={s.navBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color={C.text} />
            </Pressable>

            <Pressable onPress={() => setShowYearList(!showYearList)} style={s.monthYearTitle}>
              <Text style={s.monthYearText}>
                {monthNames[viewMonth]} <Text style={{ color: C.green, fontWeight: '700' }}>{viewYear}</Text>
              </Text>
              <Ionicons
                name={showYearList ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={C.green}
                style={{ marginLeft: 4 }}
              />
            </Pressable>

            <Pressable onPress={handleNextMonth} style={s.navBtn} hitSlop={8}>
              <Ionicons name="chevron-forward" size={20} color={C.text} />
            </Pressable>
          </View>

          {showYearList ? (
            /* Year Picker View */
            <ScrollView style={s.yearScroll} contentContainerStyle={s.yearGrid} showsVerticalScrollIndicator={false}>
              {years.map((y) => (
                <Pressable
                  key={y}
                  onPress={() => {
                    setViewYear(y);
                    setShowYearList(false);
                  }}
                  style={[s.yearItem, y === viewYear && s.yearItemActive]}
                >
                  <Text style={[s.yearItemText, y === viewYear && s.yearItemTextActive]}>{y}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            /* Days Grid View */
            <View>
              {/* Weekday Labels */}
              <View style={s.weekRow}>
                {weekDays.map((w, idx) => (
                  <Text key={idx} style={s.weekDayText}>{w}</Text>
                ))}
              </View>

              {/* Day Cells */}
              <View style={s.daysGrid}>
                {/* Empty offset cells for first week */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={s.dayCell} />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isSelected = dayNum === selDay;
                  const isToday =
                    dayNum === today.getDate() &&
                    viewMonth === today.getMonth() &&
                    viewYear === today.getFullYear();

                  return (
                    <Pressable
                      key={dayNum}
                      onPress={() => setSelDay(dayNum)}
                      style={[
                        s.dayCell,
                        isSelected && s.dayCellSelected,
                        !isSelected && isToday && s.dayCellToday,
                      ]}
                    >
                      <Text
                        style={[
                          s.dayText,
                          isSelected && s.dayTextSelected,
                          !isSelected && isToday && s.dayTextToday,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={s.modalActions}>
            <Pressable onPress={onClose} style={s.cancelBtn}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={s.confirmBtn}>
              <Text style={s.confirmBtnText}>Confirm</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PhoneField({
  value,
  onChange,
  onSubmit,
  onFocus,
  onBlur,
  error,
  touched,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string | null;
  touched?: boolean;
  inputRef?: React.MutableRefObject<TextInput | null>;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!touched && !!error;
  const isValid = !!touched && !error && value.length === 10;

  return (
    <View style={s.fieldGroup}>
      <View
        style={[
          s.fieldCard,
          focused && s.fieldCardFocused,
          isValid && s.fieldCardValid,
          hasError && s.fieldCardError,
        ]}
      >
        <View style={s.fieldHeaderRow}>
          <Text style={s.fieldLabel}>MOBILE NUMBER</Text>
          {isValid ? (
            <Ionicons name="checkmark-circle" size={15} color={C.green} />
          ) : hasError ? (
            <Ionicons name="alert-circle" size={15} color={C.error} />
          ) : null}
        </View>
        <View style={s.phoneInputRow}>
          <View style={s.countryBadge}>
            <Text style={s.countryFlag}>🇮🇳</Text>
            <Text style={s.countryCode}>+91</Text>
          </View>
          <View style={s.phoneDivider} />
          <TextInput
            ref={(el) => {
              if (inputRef) inputRef.current = el;
            }}
            value={value}
            onChangeText={onChange}
            placeholder="Enter 10-digit mobile"
            placeholderTextColor={C.textDim}
            keyboardType="phone-pad"
            maxLength={10}
            returnKeyType="send"
            onSubmitEditing={onSubmit}
            onFocus={() => {
              setFocused(true);
              onFocus?.();
            }}
            onBlur={() => {
              setFocused(false);
              onBlur?.();
            }}
            style={[s.textInput, { flex: 1 }]}
          />
        </View>
      </View>
      {hasError ? (
        <View style={s.fieldErrorRow}>
          <Ionicons name="alert-circle" size={13} color={C.error} style={{ marginRight: 4 }} />
          <Text style={s.fieldErrorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

function OtpField({
  digits,
  secondsLeft,
  onSetDigit,
  onKeyPress,
  onResend,
  digitRefs,
  onFocus,
  onBlur,
  error,
  touched,
  step,
  isPhoneValid,
  hasSentOnce,
}: {
  digits: string[];
  secondsLeft: number;
  onSetDigit: (i: number, v: string) => void;
  onKeyPress: (i: number) => (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  onResend: () => void;
  digitRefs: React.MutableRefObject<Array<TextInput | null>>;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string | null;
  touched?: boolean;
  step?: Step;
  isPhoneValid?: boolean;
  hasSentOnce?: boolean;
}) {
  const hasError = !!touched && !!error;
  const isComplete = digits.every((d) => d.trim() !== '');
  const isCooldown = secondsLeft > 0;
  const isDisabled = isCooldown || !isPhoneValid;

  const resendLabel = isCooldown
    ? `Resend in ${secondsLeft}s`
    : hasSentOnce || step === 'otp'
    ? 'Resend OTP'
    : 'Send OTP';

  return (
    <View style={s.fieldGroup}>
      <View
        style={[
          s.fieldCard,
          hasError && s.fieldCardError,
          isComplete && !hasError && s.fieldCardValid,
        ]}
      >
        <View style={s.otpHeader}>
          <View style={s.otpLabelRow}>
            <Text style={s.fieldLabel}>ONE-TIME PASSWORD (OTP)</Text>
            {isComplete && !hasError ? (
              <Ionicons name="checkmark-circle" size={15} color={C.green} style={{ marginLeft: 6 }} />
            ) : hasError ? (
              <Ionicons name="alert-circle" size={15} color={C.error} style={{ marginLeft: 6 }} />
            ) : null}
          </View>
          <Pressable
            onPress={isDisabled ? undefined : onResend}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={resendLabel}
          >
            <Text
              style={[
                s.sendOtpLink,
                isDisabled && { color: C.textDim, opacity: 0.6 },
              ]}
            >
              {resendLabel}
            </Text>
          </Pressable>
        </View>
        <View style={s.digitRow}>
          {digits.map((digit, i) => {
            const digitFilled = !!digit;
            const digitBorderColor = hasError
              ? C.error
              : digitFilled
              ? C.green
              : C.border;

            return (
              <TextInput
                key={i}
                ref={(el) => { digitRefs.current[i] = el; }}
                value={digit}
                onChangeText={(v) => onSetDigit(i, v)}
                onKeyPress={onKeyPress(i)}
                onFocus={onFocus}
                onBlur={onBlur}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                selectTextOnFocus
                accessibilityLabel={`OTP digit ${i + 1}`}
                style={[
                  s.digitBox,
                  { borderColor: digitBorderColor },
                  hasError && { backgroundColor: C.errorBg },
                ]}
              />
            );
          })}
        </View>
      </View>
      {hasError ? (
        <View style={s.fieldErrorRow}>
          <Ionicons name="alert-circle" size={13} color={C.error} style={{ marginRight: 4 }} />
          <Text style={s.fieldErrorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* ── one complete card face ── */
interface FaceProps {
  tab: Tab;
  step: Step;
  fullName: string;
  onChangeFullName: (v: string) => void;
  dob: string;
  onChangeDob: (v: string) => void;
  email: string;
  onChangeEmail: (v: string) => void;
  phone: string;
  onChangePhone: (v: string) => void;
  digits: string[];
  setDigit: (i: number, v: string) => void;
  onKeyPress: (i: number) => (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  fieldErrors: FieldErrors;
  touched: TouchedFields;
  onBlurField: (field: keyof TouchedFields) => void;
  generalError: string | null;
  busy: boolean;
  secondsLeft: number;
  onFlip: (to: Tab) => void;
  onBack: () => void;
  onSendOtp: () => void;
  onVerify: () => void;
  onResend: () => void;
  onOpenDatePicker: () => void;
  onGoogleSignIn?: () => void;
  digitRefs: React.MutableRefObject<Array<TextInput | null>>;
  fullNameInputRef: React.MutableRefObject<TextInput | null>;
  dobInputRef: React.MutableRefObject<TextInput | null>;
  emailInputRef: React.MutableRefObject<TextInput | null>;
  phoneInputRef: React.MutableRefObject<TextInput | null>;
  hasSentOnce: boolean;
}

function CardFace({
  tab,
  step,
  fullName,
  onChangeFullName,
  dob,
  onChangeDob,
  email,
  onChangeEmail,
  phone,
  onChangePhone,
  digits,
  setDigit,
  onKeyPress,
  fieldErrors,
  touched,
  onBlurField,
  generalError,
  busy,
  secondsLeft,
  onFlip,
  onBack,
  onSendOtp,
  onVerify,
  onResend,
  onOpenDatePicker,
  onGoogleSignIn,
  digitRefs,
  fullNameInputRef,
  dobInputRef,
  emailInputRef,
  phoneInputRef,
  hasSentOnce,
}: FaceProps) {
  const isLogin = tab === 'login';
  const isOtpStep = step === 'otp';
  const scrollViewRef = useRef<ScrollView>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const heading = isLogin ? 'Sign In' : 'Create Account';

  const subtitle = isLogin
    ? 'Welcome back! Please enter your details.'
    : 'Join OneBuddy to get started.';

  const handleInputFocus = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 120);
  };

  const handleOtpFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  useEffect(() => {
    if (isOtpStep) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOtpStep]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={s.cardScroll}
      contentContainerStyle={s.cardContent}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets={true}
      showsVerticalScrollIndicator={false}
    >
      {/* back */}
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          s.back,
          pressed && { opacity: 0.6 },
          Platform.OS === 'web' && ({ cursor: 'pointer' } as any),
        ]}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={s.backText}>{'< Back'}</Text>
      </Pressable>

      {/* tab toggle */}
      <View style={s.tabBar}>
        {(['login', 'signup'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => onFlip(t)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              s.tab,
              tab === t && s.tabActive,
              pressed && { opacity: 0.8 },
              Platform.OS === 'web' && ({ cursor: 'pointer' } as any),
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
          >
            <Text style={[s.tabLabel, tab === t && s.tabLabelActive]}>
              {t === 'login' ? 'Login' : 'Sign Up'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* orbiting logo (scales down during OTP step to preserve vertical space above keyboard) */}
      <View style={[s.logoWrap, isOtpStep && { marginTop: 0, marginBottom: 0 }]}>
        <OrbitingLogo size={isOtpStep ? 120 : 220} />
      </View>

      {/* heading */}
      <Text style={s.heading}>{heading}</Text>
      <Text style={s.sub}>{subtitle}</Text>

      {/* Sign Up Specific Fields */}
      {!isLogin && (
        <>
          {/* FULL NAME */}
          <View style={s.fieldGroup}>
            <View
              style={[
                s.fieldCard,
                focusedField === 'fullName' && s.fieldCardFocused,
                touched.fullName && !fieldErrors.fullName && fullName.trim() && s.fieldCardValid,
                touched.fullName && !!fieldErrors.fullName && s.fieldCardError,
              ]}
            >
              <View style={s.fieldHeaderRow}>
                <Text style={s.fieldLabel}>FULL NAME</Text>
                {touched.fullName && !fieldErrors.fullName && fullName.trim() ? (
                  <Ionicons name="checkmark-circle" size={15} color={C.green} />
                ) : touched.fullName && !!fieldErrors.fullName ? (
                  <Ionicons name="alert-circle" size={15} color={C.error} />
                ) : null}
              </View>
              <TextInput
                ref={(el) => {
                  fullNameInputRef.current = el;
                }}
                value={fullName}
                onChangeText={onChangeFullName}
                onFocus={() => {
                  setFocusedField('fullName');
                  handleInputFocus(160);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  onBlurField('fullName');
                }}
                placeholder="Enter your full name"
                placeholderTextColor={C.textDim}
                autoCapitalize="words"
                style={s.textInput}
              />
            </View>
            {touched.fullName && !!fieldErrors.fullName ? (
              <View style={s.fieldErrorRow}>
                <Ionicons name="alert-circle" size={13} color={C.error} style={{ marginRight: 4 }} />
                <Text style={s.fieldErrorText}>{fieldErrors.fullName}</Text>
              </View>
            ) : null}
          </View>

          {/* DATE OF BIRTH */}
          <View style={s.fieldGroup}>
            <View
              style={[
                s.fieldCard,
                focusedField === 'dob' && s.fieldCardFocused,
                touched.dob && !fieldErrors.dob && dob.trim() && s.fieldCardValid,
                touched.dob && !!fieldErrors.dob && s.fieldCardError,
              ]}
            >
              <View style={s.fieldHeaderRow}>
                <Text style={s.fieldLabel}>DATE OF BIRTH</Text>
                {touched.dob && !fieldErrors.dob && dob.trim() ? (
                  <Ionicons name="checkmark-circle" size={15} color={C.green} />
                ) : touched.dob && !!fieldErrors.dob ? (
                  <Ionicons name="alert-circle" size={15} color={C.error} />
                ) : null}
              </View>
              <View style={s.inputWithIcon}>
                <TextInput
                  ref={(el) => {
                    dobInputRef.current = el;
                  }}
                  value={dob}
                  onChangeText={onChangeDob}
                  onFocus={() => {
                    setFocusedField('dob');
                    handleInputFocus(220);
                  }}
                  onBlur={() => {
                    setFocusedField(null);
                    onBlurField('dob');
                  }}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={C.textDim}
                  keyboardType="number-pad"
                  maxLength={10}
                  style={[s.textInput, { flex: 1 }]}
                />
                <Pressable
                  onPress={onOpenDatePicker}
                  style={s.calendarIconBtn}
                  hitSlop={8}
                  accessibilityLabel="Open Calendar"
                >
                  <Ionicons name="calendar-outline" size={22} color={C.green} />
                </Pressable>
              </View>
            </View>
            {touched.dob && !!fieldErrors.dob ? (
              <View style={s.fieldErrorRow}>
                <Ionicons name="alert-circle" size={13} color={C.error} style={{ marginRight: 4 }} />
                <Text style={s.fieldErrorText}>{fieldErrors.dob}</Text>
              </View>
            ) : null}
          </View>

          {/* EMAIL ADDRESS */}
          <View style={s.fieldGroup}>
            <View
              style={[
                s.fieldCard,
                focusedField === 'email' && s.fieldCardFocused,
                touched.email && !fieldErrors.email && email.trim() && s.fieldCardValid,
                touched.email && !!fieldErrors.email && s.fieldCardError,
              ]}
            >
              <View style={s.fieldHeaderRow}>
                <Text style={s.fieldLabel}>EMAIL ADDRESS</Text>
                {touched.email && !fieldErrors.email && email.trim() ? (
                  <Ionicons name="checkmark-circle" size={15} color={C.green} />
                ) : touched.email && !!fieldErrors.email ? (
                  <Ionicons name="alert-circle" size={15} color={C.error} />
                ) : null}
              </View>
              <TextInput
                ref={(el) => {
                  emailInputRef.current = el;
                }}
                value={email}
                onChangeText={onChangeEmail}
                onFocus={() => {
                  setFocusedField('email');
                  handleInputFocus(280);
                }}
                onBlur={() => {
                  setFocusedField(null);
                  onBlurField('email');
                }}
                placeholder="Enter your email address"
                placeholderTextColor={C.textDim}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={s.textInput}
              />
            </View>
            {touched.email && !!fieldErrors.email ? (
              <View style={s.fieldErrorRow}>
                <Ionicons name="alert-circle" size={13} color={C.error} style={{ marginRight: 4 }} />
                <Text style={s.fieldErrorText}>{fieldErrors.email}</Text>
              </View>
            ) : null}
          </View>
        </>
      )}

      {/* MOBILE NUMBER FIELD */}
      <PhoneField
        value={phone}
        onChange={onChangePhone}
        onSubmit={onSendOtp}
        onFocus={() => handleInputFocus(isLogin ? 200 : 360)}
        onBlur={() => onBlurField('phone')}
        error={fieldErrors.phone}
        touched={touched.phone}
        inputRef={phoneInputRef}
      />

      {/* OTP FIELD */}
      <OtpField
        digits={digits}
        secondsLeft={secondsLeft}
        onSetDigit={setDigit}
        onKeyPress={onKeyPress}
        onResend={onResend}
        digitRefs={digitRefs}
        onFocus={handleOtpFocus}
        onBlur={() => onBlurField('otp')}
        error={fieldErrors.otp}
        touched={touched.otp}
        step={step}
        isPhoneValid={!validatePhone(phone)}
        hasSentOnce={hasSentOnce}
      />

      {/* GENERAL ERROR BANNER */}
      {generalError ? (
        <View style={s.generalErrorBanner}>
          <Ionicons name="alert-circle" size={18} color={C.error} style={{ marginRight: 6 }} />
          <Text style={s.generalErrorText}>{generalError}</Text>
        </View>
      ) : null}

      {/* CTA */}
      <Pressable
        onPress={step === 'phone' ? onSendOtp : onVerify}
        disabled={busy}
        style={({ pressed }) => [
          s.cta,
          busy && { opacity: 0.7 },
          pressed && { transform: [{ scale: 0.97 }] },
          Platform.OS === 'web' && ({ cursor: busy ? 'default' : 'pointer' } as any),
        ]}
      >
        <LinearGradient
          colors={[C.greenLight, C.green]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
        {busy ? (
          <ActivityIndicator color={C.greenInk} />
        ) : (
          <Text style={s.ctaLabel}>
            {step === 'phone' ? 'Send OTP' : 'Verify & Continue'}
          </Text>
        )}
      </Pressable>

      {/* Google Sign In (Only on Login screen) */}
      {isLogin && (
        <Pressable 
          style={({ pressed }) => [
            s.googleBtn,
            pressed && { transform: [{ scale: 0.97 }] },
            Platform.OS === 'web' && ({ cursor: 'pointer' } as any),
          ]}
          onPress={onGoogleSignIn}
        >
          <GoogleIcon />
          <Text style={s.googleBtnText}>Sign in with Google</Text>
        </Pressable>
      )}

      {/* footer */}
      <View style={s.footerRow}>
        <Text style={s.footer}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
        </Text>
        <Pressable
          onPress={() => onFlip(isLogin ? 'signup' : 'login')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            pressed && { opacity: 0.7 },
            Platform.OS === 'web' && ({ cursor: 'pointer' } as any),
          ]}
        >
          <Text style={s.footerLink}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

/* ─────────────────── main screen ─────────────────── */

export default function AuthScreen({ navigation }: RootScreenProps<'Auth'>) {
  const insets = useSafeAreaInsets();
  const { sendOtp, verifyOtp } = useOtpAuth();
  const { signInWithGoogle, authenticateWithPhoneOrEmail } = useAuth();
  const { updateProfile } = useProfile();

  /* ── tab state ── */
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [visibleTab, setVisibleTab] = useState<Tab>('login');
  const [isAnimating, setIsAnimating] = useState(false);

  /* ── form state ── */
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
  const [step, setStep] = useState<Step>('phone');

  /* ── validation state ── */
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  /* ── input refs for auto-focusing on validation error ── */
  const digitRefs = useRef<Array<TextInput | null>>([]);
  const fullNameInputRef = useRef<TextInput | null>(null);
  const dobInputRef = useRef<TextInput | null>(null);
  const emailInputRef = useRef<TextInput | null>(null);
  const phoneInputRef = useRef<TextInput | null>(null);
  const lastSentPhone = useRef<string>('');

  /* ── flip animation ── */
  const flipAnim = useRef(new Animated.Value(0)).current;
  const isFlipping = useRef(false);
  const midTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (midTimer.current) clearTimeout(midTimer.current); }, []);

  const flipTo = useCallback(
    (next: Tab) => {
      if (next === activeTab || isFlipping.current) return;
      isFlipping.current = true;
      setIsAnimating(true);

      // reset form and validation states for incoming tab
      setFullName('');
      setDob('');
      setEmail('');
      setPhone('');
      setDigits(Array(OTP_LENGTH).fill(''));
      setFieldErrors({});
      setTouched({});
      setGeneralError(null);
      setStep('phone');
      setSecondsLeft(0);
      lastSentPhone.current = '';

      // swap content at exact mid-point
      midTimer.current = setTimeout(() => setVisibleTab(next), FLIP_MS / 2);

      const safetyTimer = setTimeout(() => {
        isFlipping.current = false;
        setIsAnimating(false);
        setActiveTab(next);
        setVisibleTab(next);
      }, FLIP_MS + 80);

      Animated.timing(flipAnim, {
        toValue: 1,
        duration: FLIP_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        clearTimeout(safetyTimer);
        flipAnim.setValue(0);
        setActiveTab(next);
        setVisibleTab(next);
        setIsAnimating(false);
        isFlipping.current = false;
      });
    },
    [activeTab, flipAnim]
  );

  /* ── flip interpolations ── */
  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '90deg'],
  });
  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-90deg', '-90deg', '0deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.44, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.56, 1],
    outputRange: [0, 0, 1, 1],
  });

  /* ── DOB mask & validation handler ── */
  const handleDobChange = useCallback((text: string) => {
    setDob((prev) => {
      let nextFormatted = '';
      if (text.length < prev.length) {
        if (prev.endsWith('/') && text.length === prev.length - 1) {
          nextFormatted = text.slice(0, -1);
        } else {
          nextFormatted = text;
        }
      } else {
        const d = text.replace(/\D/g, '').slice(0, 8);
        if (!d) {
          nextFormatted = '';
        } else if (d.length <= 2) {
          nextFormatted = d;
        } else if (d.length <= 4) {
          nextFormatted = `${d.slice(0, 2)}/${d.slice(2)}`;
        } else {
          nextFormatted = `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`;
        }
      }

      setTouched((t) => {
        if (t.dob) {
          setFieldErrors((errs) => ({ ...errs, dob: validateDob(nextFormatted) }));
        }
        return t;
      });

      return nextFormatted;
    });
    setGeneralError(null);
  }, []);

  /* ── change handlers with real-time validation ── */
  const handleChangeFullName = useCallback((val: string) => {
    setFullName(val);
    setTouched((t) => {
      if (t.fullName) {
        setFieldErrors((errs) => ({ ...errs, fullName: validateFullName(val) }));
      }
      return t;
    });
    setGeneralError(null);
  }, []);

  const handleChangeEmail = useCallback((val: string) => {
    setEmail(val);
    setTouched((t) => {
      if (t.email) {
        setFieldErrors((errs) => ({ ...errs, email: validateEmail(val) }));
      }
      return t;
    });
    setGeneralError(null);
  }, []);

  const handleChangePhone = useCallback((val: string) => {
    const clean = cleanPhoneNumber(val);
    setPhone(clean);
    setTouched((t) => {
      if (t.phone) {
        setFieldErrors((errs) => ({ ...errs, phone: validatePhone(clean) }));
      }
      return t;
    });
    setGeneralError(null);

    // If phone number is edited away from the number that was sent an OTP:
    if (lastSentPhone.current && clean !== lastSentPhone.current) {
      // Instantly cancel cooldown for previous number so new number can receive OTP immediately
      setSecondsLeft(0);
      // Clear previously entered digits and errors since they belonged to the old phone number
      setDigits(Array(OTP_LENGTH).fill(''));
      setFieldErrors((prev) => ({ ...prev, otp: null }));
      if (step === 'otp') {
        setStep('phone');
      }
    } else if (step === 'otp' && clean.length < 10) {
      setStep('phone');
    }
  }, [step]);

  const handleBlurField = useCallback((field: keyof TouchedFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'fullName') {
      setFieldErrors((prev) => ({ ...prev, fullName: validateFullName(fullName) }));
    } else if (field === 'dob') {
      setFieldErrors((prev) => ({ ...prev, dob: validateDob(dob) }));
    } else if (field === 'email') {
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    } else if (field === 'phone') {
      setFieldErrors((prev) => ({ ...prev, phone: validatePhone(phone) }));
    }
  }, [fullName, dob, email, phone]);

  /* ── countdown ── */
  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const id = setInterval(() => setSecondsLeft((v) => v - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  /* ── OTP actions ── */
  const handleSendOtp = useCallback(async () => {
    const cleanPhone = cleanPhoneNumber(phone);
    const phoneErr = validatePhone(cleanPhone);

    setTouched((prev) => ({ ...prev, phone: true }));
    setFieldErrors((prev) => ({ ...prev, phone: phoneErr }));
    if (phoneErr) {
      phoneInputRef.current?.focus();
      setGeneralError(phoneErr);
      return;
    }

    setGeneralError(null);
    setBusy(true);
    try {
      await sendOtp(cleanPhone);
      lastSentPhone.current = cleanPhone;
      setDigits(Array(OTP_LENGTH).fill(''));
      setStep('otp');
      setSecondsLeft(OTP_RESEND_SECONDS);
      setTouched((prev) => ({ ...prev, otp: false }));
      setFieldErrors((prev) => ({ ...prev, otp: null }));
      setTimeout(() => digitRefs.current[0]?.focus(), 250);
    } catch (e) {
      setGeneralError(e instanceof Error ? e.message : 'Could not send the verification code.');
    } finally {
      setBusy(false);
    }
  }, [phone, sendOtp]);

  const handleVerify = useCallback(async () => {
    const cleanPhone = cleanPhoneNumber(phone);
    const phoneErr = validatePhone(cleanPhone);
    const otpErr = validateOtp(digits);

    if (activeTab === 'signup') {
      const nameErr = validateFullName(fullName);
      const dobErr = validateDob(dob);
      const emailErr = validateEmail(email);

      const hasError = !!nameErr || !!dobErr || !!emailErr || !!phoneErr || !!otpErr;
      if (hasError) {
        setTouched({
          fullName: true,
          dob: true,
          email: true,
          phone: true,
          otp: true,
        });
        setFieldErrors({
          fullName: nameErr,
          dob: dobErr,
          email: emailErr,
          phone: phoneErr,
          otp: otpErr,
        });

        if (nameErr) {
          fullNameInputRef.current?.focus();
          setGeneralError(nameErr);
        } else if (dobErr) {
          dobInputRef.current?.focus();
          setGeneralError(dobErr);
        } else if (emailErr) {
          emailInputRef.current?.focus();
          setGeneralError(emailErr);
        } else if (phoneErr) {
          phoneInputRef.current?.focus();
          setGeneralError(phoneErr);
        } else if (otpErr) {
          const firstEmpty = digits.findIndex((d) => !d);
          if (firstEmpty >= 0) digitRefs.current[firstEmpty]?.focus();
          setGeneralError(otpErr);
        }
        return;
      }
    } else {
      if (phoneErr || otpErr) {
        setTouched((prev) => ({ ...prev, phone: true, otp: true }));
        setFieldErrors((prev) => ({ ...prev, phone: phoneErr, otp: otpErr }));
        if (phoneErr) {
          phoneInputRef.current?.focus();
          setGeneralError(phoneErr);
        } else if (otpErr) {
          const firstEmpty = digits.findIndex((d) => !d);
          if (firstEmpty >= 0) digitRefs.current[firstEmpty]?.focus();
          setGeneralError(otpErr);
        }
        return;
      }
    }

    setFieldErrors((prev) => ({ ...prev, otp: null }));
    setGeneralError(null);
    setBusy(true);
    try {
      // 1. Authenticate with Firebase Auth and write user profile directly to Firestore 'users' database
      console.log('[Auth] Authenticating and saving user to Firestore database "users"...');
      const fbUser = await authenticateWithPhoneOrEmail({
        phone: cleanPhone,
        email: email.trim(),
        fullName: fullName.trim(),
        dob: dob.trim(),
        isSignUp: activeTab === 'signup',
      });
      console.log('[Auth] Successfully created/authenticated user in Firestore:', fbUser.uid);

      // 2. Persist profile data to AsyncStorage & ProfileContext for app-wide use
      if (activeTab === 'signup') {
        const userProfile = {
          name: fullName.trim() || fbUser.displayName || 'User',
          dob: dob.trim(),
          email: email.trim() || fbUser.email || '',
          phone: cleanPhone,
          registeredAt: new Date().toISOString(),
        };
        try {
          await AsyncStorage.setItem('onebuddy:userProfile', JSON.stringify(userProfile));
        } catch (err) {
          console.warn('Could not save user profile to AsyncStorage:', err);
        }
        updateProfile({
          name: fullName.trim() || fbUser.displayName || 'User',
          phone: cleanPhone,
          email: email.trim() || fbUser.email || '',
        });
      } else {
        updateProfile({
          name: fbUser.displayName || 'User',
          phone: cleanPhone,
          email: fbUser.email || '',
        });
      }

      // 3. Now verify OTP and issue the session token so the app transitions to HomeScreen
      await verifyOtp(cleanPhone, digits.join(''));
    } catch (e: any) {
      console.error('[Auth] Verification / save error:', e);
      const message = e instanceof Error ? e.message : 'Verification failed. Please try again.';
      setTouched((prev) => ({ ...prev, otp: true }));
      setFieldErrors((prev) => ({ ...prev, otp: message }));
      setGeneralError(message);
      setBusy(false);
    }
  }, [activeTab, digits, email, fullName, dob, phone, verifyOtp, authenticateWithPhoneOrEmail, updateProfile]);

  const handleGoogleSignIn = useCallback(async () => {
    setGeneralError(null);
    setBusy(true);
    try {
      const googleUser = await signInWithGoogle();
      const identifier = googleUser.phoneNumber || googleUser.email || cleanPhoneNumber(phone) || 'google_user';
      await verifyOtp(identifier, 'GOOGLE_SSO');
      updateProfile({
        name: googleUser.displayName || 'Google User',
        email: googleUser.email || '',
        phone: googleUser.phoneNumber || '',
      });
    } catch (e: any) {
      console.warn('Google sign-in error:', e);
      if (e?.code !== 'auth/popup-closed-by-user') {
        setGeneralError(e?.message || 'Google sign-in failed. Please try again.');
      }
      setBusy(false);
    }
  }, [signInWithGoogle, verifyOtp, updateProfile, phone]);

  const setDigit = useCallback((index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length > 1) {
      setDigits((cur) => {
        const next = [...cur];
        for (let i = 0; i < clean.length && index + i < OTP_LENGTH; i++) {
          next[index + i] = clean[i];
        }
        return next;
      });
      digitRefs.current[Math.min(index + clean.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    setDigits((cur) => {
      const next = [...cur];
      next[index] = clean.slice(-1);
      return next;
    });
    setFieldErrors((prev) => ({ ...prev, otp: null }));
    if (clean && index < OTP_LENGTH - 1) digitRefs.current[index + 1]?.focus();
  }, []);

  const onKeyPress = useCallback(
    (index: number) =>
      (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
          digitRefs.current[index - 1]?.focus();
        }
      },
    [digits]
  );

  const handleResend = useCallback(async () => {
    const cleanPhone = cleanPhoneNumber(phone);
    // Only enforce cooldown if resending to the EXACT same number as last sent
    if (cleanPhone === lastSentPhone.current && secondsLeft > 0) return;

    const phoneErr = validatePhone(cleanPhone);
    if (phoneErr) {
      setTouched((prev) => ({ ...prev, phone: true }));
      setFieldErrors((prev) => ({ ...prev, phone: phoneErr }));
      phoneInputRef.current?.focus();
      setGeneralError('Please enter a valid 10-digit mobile number before requesting OTP.');
      return;
    }

    setBusy(true);
    setGeneralError(null);
    try {
      await sendOtp(cleanPhone);
      lastSentPhone.current = cleanPhone;
      setDigits(Array(OTP_LENGTH).fill(''));
      setSecondsLeft(OTP_RESEND_SECONDS);
      setFieldErrors((prev) => ({ ...prev, otp: null }));
      setStep('otp');
      digitRefs.current[0]?.focus();
    } catch (e) {
      setGeneralError(e instanceof Error ? e.message : 'Could not resend the code.');
    } finally {
      setBusy(false);
    }
  }, [phone, secondsLeft, sendOtp]);

  const handleBack = useCallback(() => {
    if (step === 'otp') {
      setStep('phone');
      setGeneralError(null);
      setFieldErrors((prev) => ({ ...prev, otp: null }));
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Splash');
    }
  }, [step, navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  const handleDateSelect = (d: string) => {
    setDob(d);
    setTouched((prev) => ({ ...prev, dob: true }));
    setFieldErrors((prev) => ({ ...prev, dob: validateDob(d) }));
    setGeneralError(null);
  };

  const faceProps: Omit<FaceProps, 'tab'> = {
    step,
    fullName,
    onChangeFullName: handleChangeFullName,
    dob,
    onChangeDob: handleDobChange,
    email,
    onChangeEmail: handleChangeEmail,
    phone,
    onChangePhone: handleChangePhone,
    digits,
    setDigit,
    onKeyPress,
    fieldErrors,
    touched,
    onBlurField: handleBlurField,
    generalError,
    busy,
    secondsLeft,
    onFlip: flipTo,
    onBack: handleBack,
    onSendOtp: handleSendOtp,
    onVerify: handleVerify,
    onResend: handleResend,
    onOpenDatePicker: () => setShowDatePicker(true),
    onGoogleSignIn: handleGoogleSignIn,
    digitRefs,
    fullNameInputRef,
    dobInputRef,
    emailInputRef,
    phoneInputRef,
    hasSentOnce: !!lastSentPhone.current,
  };

  return (
    <KeyboardAvoidingView
      style={[s.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 20}
    >
      <LinearGradient
        colors={[C.white, brand.lavenderDeep]}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.cardShell}>
        {/* Front face */}
        <Animated.View
          style={[
            s.cardFace,
            isAnimating && {
              opacity: frontOpacity,
              transform: [{ perspective: 1200 }, { rotateY: frontRotateY }],
            },
          ]}
        >
          <CardFace tab={isAnimating ? (visibleTab === activeTab ? activeTab : (activeTab === 'login' ? 'signup' : 'login')) : activeTab} {...faceProps} />
        </Animated.View>

        {/* Back face - only rendered during 3D flip animation */}
        {isAnimating && (
          <Animated.View
            pointerEvents="none"
            style={[
              s.cardFace,
              StyleSheet.absoluteFill,
              {
                opacity: backOpacity,
                transform: [{ perspective: 1200 }, { rotateY: backRotateY }],
              },
            ]}
          >
            <CardFace tab={visibleTab} {...faceProps} />
          </Animated.View>
        )}
      </View>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        currentValue={dob}
        onClose={() => setShowDatePicker(false)}
        onSelect={handleDateSelect}
      />
    </KeyboardAvoidingView>
  );
}

/* ─────────────────── styles ─────────────────── */
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  cardShell: {
    width: '100%',
    flex: 1,
    maxHeight: 880,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  cardFace: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 28,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },

  cardScroll: { flex: 1 },
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: 'center',
  },

  back: { alignSelf: 'flex-start', paddingVertical: 14, paddingHorizontal: 4 },
  backText: { fontSize: 15, color: C.textDim, fontWeight: '500' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.inputBg,
    borderRadius: 40,
    width: '100%',
    padding: 4,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 36,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: C.green },
  tabLabel: { fontSize: 15, fontWeight: '600', color: C.textDim },
  tabLabelActive: { color: C.white },

  logoWrap: { marginTop: 6, marginBottom: 2 },

  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    marginTop: 4,
  },
  sub: {
    fontSize: 14,
    color: C.textDim,
    marginTop: 6,
    marginBottom: 18,
    textAlign: 'center',
    lineHeight: 20,
  },

  fieldGroup: {
    width: '100%',
    marginBottom: 12,
  },
  fieldCard: {
    width: '100%',
    backgroundColor: C.inputBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fieldCardFocused: {
    borderColor: C.green,
    backgroundColor: C.white,
  },
  fieldCardValid: {
    borderColor: 'rgba(95, 163, 0, 0.45)',
    backgroundColor: C.white,
  },
  fieldCardError: {
    borderColor: C.error,
    backgroundColor: C.errorBg,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textDim,
    letterSpacing: 0.8,
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  fieldErrorText: {
    color: C.error,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  textInput: {
    fontSize: 16,
    color: C.text,
    paddingVertical: 2,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarIconBtn: {
    padding: 4,
    marginLeft: 6,
  },

  /* ── Phone input with country code badge ── */
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  countryFlag: {
    fontSize: 16,
    marginRight: 4,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  phoneDivider: {
    width: 1,
    height: 20,
    backgroundColor: C.border,
    marginRight: 10,
  },

  /* ── General Error Banner ── */
  generalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE8E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },
  generalErrorText: {
    color: C.error,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  /* ── Modal Calendar Styles ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  calendarHeader: {
    backgroundColor: C.inputBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    alignItems: 'center',
  },
  calendarHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textDim,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  calendarHeaderDate: {
    fontSize: 20,
    fontWeight: '700',
    color: C.greenInk,
    marginTop: 4,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  monthYearTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: C.inputBg,
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  navBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: C.inputBg,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: C.textDim,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: C.green,
    borderRadius: 19,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: C.green,
    borderRadius: 19,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.text,
  },
  dayTextSelected: {
    color: C.white,
    fontWeight: '700',
  },
  dayTextToday: {
    color: C.green,
    fontWeight: '700',
  },
  yearScroll: {
    maxHeight: 220,
    marginVertical: 8,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  yearItem: {
    width: '30%',
    paddingVertical: 10,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: C.inputBg,
    alignItems: 'center',
  },
  yearItemActive: {
    backgroundColor: C.green,
  },
  yearItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  yearItemTextActive: {
    color: C.white,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textDim,
  },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: C.green,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },

  otpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  otpLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendOtpLink: { fontSize: 13, fontWeight: '600', color: C.green },
  digitRow: { flexDirection: 'row', gap: 6 },
  digitBox: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: C.card,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },

  cta: {
    width: '100%',
    height: 54,
    borderRadius: 40,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  ctaLabel: { fontSize: 17, fontWeight: '700', color: C.greenInk },
  
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 54,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: C.googleBorder,
    backgroundColor: C.white,
    marginBottom: 18,
  },
  googleBtnText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 4,
  },
  footer: { fontSize: 14, color: C.textDim, textAlign: 'center' },
  footerLink: { color: C.green, fontWeight: '700' },
});
