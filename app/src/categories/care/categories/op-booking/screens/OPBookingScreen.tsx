import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  StatusBar,
  Dimensions,
  Platform,
  Alert,
  Image,
  Linking,
  KeyboardAvoidingView,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/ThemeContext';
import { careService } from '@/firebase';
import PaymentCheckoutScreen from '../../../../food/components/cart/PaymentCheckoutScreen';
import {
  ChevronLeft,
  User,
  Calendar,
  Clock,
  CreditCard,
  Building2,
  Smartphone,
  Wallet,
  CheckCircle,
  FileText,
  MapPin,
  ShieldCheck,
  Check,
  X,
  ChevronRight,
  Info,
  Search,
  Share2,
  Sparkles,
  Award,
  Home,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==========================================
// MODULE-LEVEL CONSTANTS (no duplicate definitions)
// ==========================================

/** Maps a visit reason to its primary OPD department ID */
const REASON_TO_DEPT_ID: Record<string, string> = {
  'Fever / Cold': 'dep-1',
  'Body Ache / Pain': 'dep-3',
  'Routine Checkup': 'dep-1',
  'Vaccination': 'dep-8',
  'Specialist Consultation': 'dep-1',
};

/** Maps a department name to a user-friendly disease label */
const DEPT_TO_DISEASE: Record<string, string> = {
  'Cardiology': 'Heart & BP',
  'Orthopedics': 'Bones & Joints',
  'General Physician': 'General Health',
  'Dermatology': 'Skin & Hair',
  'Pediatrics': 'Baby Care',
  'Neurology': 'Brain & Nerves',
  'ENT': 'Ear, Nose & Throat',
  'Vaccination': 'Immunization',
  'Gynecology': 'Women Health & Pregnancy',
};

import {
  PatientType,
  BookingFor,
  Gender,
  SlotSession,
  Hospital,
  TimeSlot,
  DepartmentItem,
  DateOption,
  OPBookingData,
  FormErrors,
  HOSPITALS,
  DEPARTMENTS,
  generateDateOptions,
  TIME_SLOTS,
} from '../data/data';

// ==========================================
// MAIN COMPONENT: OPBookingScreen
// ==========================================

export interface OPBookingScreenProps {
  initialHospital?: Hospital | null;
  onBackPress?: () => void;
  onBookingSuccess?: (data: OPBookingData) => void;
}

export default function OPBookingScreen({
  initialHospital,
  onBackPress,
  onBookingSuccess,
}: OPBookingScreenProps) {
  const insets = useSafeAreaInsets();
  const { scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  // Stepper state (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields State
  const [bookingFor, setBookingFor] = useState<BookingFor | ''>('');
  const [patientType, setPatientType] = useState<PatientType | ''>('');
  const [uhid, setUhid] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [reasonDropdownOpen, setReasonDropdownOpen] = useState<boolean>(false);
  const [isOtherReason, setIsOtherReason] = useState<boolean>(false);

  // Step 2 Selection State
  const [hospitalSearch, setHospitalSearch] = useState<string>('');
  const [hospitalsList, setHospitalsList] = useState<Hospital[]>(HOSPITALS);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(
    initialHospital || null
  );
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentItem | null>(null);

  // Fetch Hospitals dynamically from Firebase Backend
  React.useEffect(() => {
    let isMounted = true;
    async function loadBackendHospitals() {
      try {
        const fetched = await careService.fetchHospitals('hyderabad');
        if (isMounted && fetched && fetched.length > 0) {
          const mapped: Hospital[] = fetched.map((h: any) => ({
            id: h.id,
            name: h.name,
            branch: typeof h.address === 'string' ? h.address : (h.address?.area || h.address?.line1 || 'Hyderabad'),
            address: typeof h.address === 'string' ? h.address : `${h.address?.line1 || ''}, ${h.address?.area || ''}, ${h.address?.city || 'Hyderabad'}`,
            rating: h.rating || 4.8,
            departments: h.departments || ['General OPD', 'Cardiology', 'Orthopedics'],
            consultationFee: h.opFee || 600,
            distance: h.distance || '2.5 km away',
            imageUrl: h.coverImagePath || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=300&q=80',
            description: h.description || '',
            opFee: h.opFee || 600,
          }));
          setHospitalsList(mapped);
        }
      } catch (err) {
        console.warn('[OPBookingScreen] Error fetching hospitals from backend:', err);
      }
    }
    loadBackendHospitals();
    return () => {
      isMounted = false;
    };
  }, []);

  // Keep selectedHospital synced if prop changes, while ensuring patient details (Step 1) are collected first
  React.useEffect(() => {
    if (initialHospital) {
      setSelectedHospital(initialHospital);
      setCurrentStep(1);
    }
  }, [initialHospital]);

  // Step 3 Selection State
  const dateOptions = useMemo(() => generateDateOptions(), []);
  const [selectedDate, setSelectedDate] = useState<DateOption>(dateOptions[0]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Step 4 Payment Method State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('');
  const [isDobPickerOpen, setIsDobPickerOpen] = useState<boolean>(false);
  const [dobPickerYear, setDobPickerYear] = useState<number>(2000);
  const [dobPickerMonth, setDobPickerMonth] = useState<number>(0);
  const [isYearPickerView, setIsYearPickerView] = useState<boolean>(false);

  // Modal State
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState<boolean>(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState<OPBookingData | null>(null);

  // Form Errors State
  const [errors, setErrors] = useState<FormErrors>({});

  // Real-time clock for disabling past slots
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  // Hardware Back Button Handler
  React.useEffect(() => {
    const backAction = () => {
      if (confirmedBookingData) {
        handleReturnHome();
        return true;
      }
      if (isConfirmationModalVisible) {
        setIsConfirmationModalVisible(false);
        return true;
      }
      if (isDobPickerOpen) {
        setIsDobPickerOpen(false);
        return true;
      }
      if (currentStep > 1) {
        setCurrentStep((prev) => prev - 1);
        return true;
      }
      if (onBackPress) {
        onBackPress();
        return true;
      }

      Alert.alert('Exit Booking', 'Are you sure you want to discard this booking?', [
        { text: 'Cancel', style: 'cancel', onPress: () => { } },
        { text: 'Discard', style: 'destructive', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentStep, isConfirmationModalVisible, isDobPickerOpen, onBackPress, confirmedBookingData]);

  // Helper: Convert slot time string like '09:00 AM' to minutes since midnight
  const parseSlotTimeToMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.split(' ');
    const [hoursStr, minsStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    const mins = parseInt(minsStr, 10);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  // Check if a slot's time has already passed (only for today)
  const isSlotPassed = (slot: TimeSlot): boolean => {
    // Only disable past slots if selected date is today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (selectedDate?.dateString !== todayStr) return false;

    const slotMinutes = parseSlotTimeToMinutes(slot.time);
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    return slotMinutes <= currentMinutes;
  };

  // Pricing calculations — fee comes from selected hospital, falls back to 0
  const PLATFORM_FEE = 50;
  const consultationFee = selectedHospital?.consultationFee ?? selectedHospital?.opFee ?? 0;
  const finalPayableAmount = consultationFee + PLATFORM_FEE;

  // Hospital filtering: filter by reason/OPD department, and apply search
  const filteredHospitals = useMemo(() => {
    const REASON_TO_DEPARTMENT: Record<string, string> = {
      'Fever / Cold': 'General Physician',
      'Body Ache / Pain': 'Orthopedics',
      'Routine Checkup': 'General Physician',
      'Vaccination': 'Pediatrics',
      'Specialist Consultation': 'General Physician',
    };

    const patientAge = parseInt(age, 10);
    const isChild = !isNaN(patientAge) && patientAge > 0 && patientAge < 18;

    // Determine primary department based on explicit selectedDepartment first, then age, then reason
    let primaryDept = '';
    if (selectedDepartment) {
      primaryDept = selectedDepartment.name;
    } else if (isChild) {
      primaryDept = 'Pediatrics';
    } else if (reason && !isOtherReason && REASON_TO_DEPARTMENT[reason]) {
      primaryDept = REASON_TO_DEPARTMENT[reason];
    }

    let result = [...hospitalsList];

    // Bring hospitals that match the primary department to the top
    if (primaryDept) {
      result = result.sort((a, b) => {
        const aMatches = a.departments.includes(primaryDept) ? 1 : 0;
        const bMatches = b.departments.includes(primaryDept) ? 1 : 0;
        return bMatches - aMatches;
      });
    }

    if (hospitalSearch.trim()) {
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
          h.branch.toLowerCase().includes(hospitalSearch.toLowerCase())
      );
    }
    return result;
  }, [hospitalSearch, reason, isOtherReason, age, selectedDepartment, hospitalsList]);

  // --- Step 1 Validation ---
  const validateStep1 = (): boolean => {
    const errs: FormErrors = {};

    if (!bookingFor) {
      errs.bookingFor = 'Please select who this appointment is for.';
    }

    if (!patientType) {
      errs.patientType = 'Please select patient type.';
    }

    if (!gender) {
      errs.gender = 'Please select gender.';
    }

    if (patientType === 'FollowUp' && !uhid.trim()) {
      errs.uhid = 'UHID / Patient ID is required for follow-up patients.';
    }

    if (!patientName.trim()) {
      errs.patientName = 'Patient full name is required.';
    }

    if (!age.trim() || isNaN(Number(age)) || Number(age) <= 0 || Number(age) > 120) {
      errs.age = 'Please enter a valid age (1-120).';
    }

    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      errs.mobileNumber = 'Please enter a valid 10-digit mobile number.';
    }

    if (!reason.trim()) {
      errs.reason = 'Reason for visit / Patient issue is required.';
    }

    if (!selectedDepartment) {
      errs.department = 'Please select an OPD department.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // --- Step 2 Validation ---
  const validateStep2 = (): boolean => {
    const errs: FormErrors = {};

    if (!selectedHospital) {
      errs.hospital = 'Please select a hospital.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // --- Step 3 Validation ---
  const validateStep3 = (): boolean => {
    const errs: FormErrors = {};

    if (!selectedDate) {
      errs.date = 'Please select an appointment date.';
    }
    if (!selectedSlot) {
      errs.slot = 'Please select an appointment time slot.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // --- Navigation Handlers ---
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    } else if (currentStep === 3) {
      if (validateStep3()) setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else if (onBackPress) {
      onBackPress();
    } else {
      Alert.alert('Exit Booking', 'Are you sure you want to discard this booking?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => { } },
      ]);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setBookingFor('');
    setPatientType('');
    setUhid('');
    setPatientName('');
    setAge('');
    setDob('');
    setGender('');
    setMobileNumber('');
    setReason('');
    setReasonDropdownOpen(false);
    setIsOtherReason(false);
    setSelectedHospital(initialHospital || null);
    setSelectedDepartment(null);
    setSelectedDate(dateOptions[0]);
    setSelectedSlot(TIME_SLOTS[0]);
    setSelectedPaymentMethod('');
    setSelectedUpiApp('');
    setConfirmedBookingData(null);
    setErrors({});
  };

  // --- Final Booking Confirmation & Token Generation ---
  const handleConfirmAndPay = () => {
    const randomTokenNum = Math.floor(Math.random() * 40) + 1;
    const generatedToken = `Token #${randomTokenNum}`;
    const generatedApptId = `OB-OPD-${Math.floor(100000 + Math.random() * 900000)}`;
    const timestamp = new Date().toLocaleString();

    const bookingRecord: OPBookingData = {
      bookingFor: bookingFor || 'Self',
      patientType: patientType || 'New',
      uhid: patientType === 'FollowUp' ? uhid : 'NEW-REG',
      patientName,
      age,
      dob,
      gender: gender || 'Other',
      mobileNumber,
      reason,
      selectedHospital,
      selectedDepartment,
      selectedDate,
      selectedSlot,
      registrationFee: 0,
      consultationFee,
      discountAmount: 0,
      couponCode: '',
      finalPayableAmount,
      tokenNumber: generatedToken,
      appointmentId: generatedApptId,
      bookingTimestamp: timestamp,
    };

    setConfirmedBookingData(bookingRecord);
    setIsConfirmationModalVisible(true);

    // Asynchronously create canonical appointment in Firestore via Cloud Function
    careService.bookAppointment({
      hospitalId: selectedHospital?.id || 'hyd-apollo',
      doctorId: selectedDepartment?.id ? `doc-${selectedDepartment.id}` : 'doc-general-opd',
      departmentId: selectedDepartment?.name || 'General OPD',
      slotId: selectedSlot?.id,
      mode: 'in_person',
      patientDetails: {
        fullName: patientName || 'Patient',
        phone: mobileNumber,
        age: age || 25,
        gender: (gender as any) || 'Other',
      },
      reasonForVisit: reason,
      paymentMethod: 'UPI',
      idempotencyKey: generatedApptId,
    }).catch((err) => {
      console.warn('[OPBookingScreen] Server bookAppointment warning:', err);
    });

    if (onBookingSuccess) {
      onBookingSuccess(bookingRecord);
    }
  };

  const handleReturnHome = () => {
    setIsConfirmationModalVisible(false);
    setConfirmedBookingData(null);
    if (onBackPress) {
      onBackPress();
    } else {
      resetForm();
    }
  };

  const renderConfirmationScreen = () => {
    if (!confirmedBookingData) return null;

    return (
      <View style={styles.confirmationPageContainer}>
        {/* Header Bar with Top Safe Inset */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 8 : 12),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleReturnHome}
            activeOpacity={0.7}
            accessibilityLabel="Back to Home"
          >
            <ChevronLeft size={22} color={isDark ? '#F1F5F9' : '#1E293B'} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={18} color="#059669" />
              <Text style={styles.headerTitle}>Booking Confirmed</Text>
            </View>
            <Text style={styles.headerSub}>
              Official OPD Pass • {confirmedBookingData.tokenNumber}
            </Text>
          </View>
        </View>

        {/* Scrollable OPD Slip Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 96,
          }}
        >
          {/* OPD Slip Card */}
          <View style={styles.opdSlipCard}>
            {/* OPD Header */}
            <View style={styles.slipHeader}>
              <View>
                <Text style={styles.slipBrandTitle}>
                  One <Text style={{ color: '#65B300' }}>Buddy</Text>
                </Text>
                <Text style={styles.slipSub}>OFFICIAL OPD E-PASS</Text>
              </View>
              <View style={styles.tokenHighlightBox}>
                <Text style={styles.tokenBoxTitle}>YOUR TOKEN</Text>
                <Text style={styles.tokenBoxNum}>{confirmedBookingData.tokenNumber}</Text>
              </View>
            </View>

            <View style={styles.slipDottedDivider} />

            {/* Booking ID & Time */}
            <View style={styles.slipMetaGrid}>
              <View style={styles.slipMetaCol}>
                <Text style={styles.slipMetaLabel}>APPOINTMENT ID</Text>
                <Text style={styles.slipMetaVal}>{confirmedBookingData.appointmentId}</Text>
              </View>
              <View style={styles.slipMetaCol}>
                <Text style={styles.slipMetaLabel}>BOOKING TIME</Text>
                <Text style={styles.slipMetaVal}>{confirmedBookingData.bookingTimestamp}</Text>
              </View>
            </View>

            <View style={styles.slipDivider} />

            {/* Patient Info */}
            <View style={styles.slipSectionBlock}>
              <Text style={styles.slipSectionHeading}>PATIENT DETAILS</Text>
              <Text style={styles.slipPrimaryText}>{confirmedBookingData.patientName}</Text>
              <Text style={styles.slipSecondaryText}>
                Age: {confirmedBookingData.age} • {confirmedBookingData.gender} • Mobile: +91 {confirmedBookingData.mobileNumber}
              </Text>
              <Text style={styles.slipSecondaryText}>
                UHID / Reg No: {confirmedBookingData.uhid}
              </Text>
              {confirmedBookingData.reason ? (
                <Text style={styles.slipSecondaryText}>
                  Reason for Visit: {confirmedBookingData.reason}
                </Text>
              ) : null}
            </View>

            <View style={styles.slipDivider} />

            {/* Hospital Details */}
            <View style={styles.slipSectionBlock}>
              <Text style={styles.slipSectionHeading}>HOSPITAL & DEPARTMENT</Text>
              <Text style={styles.slipPrimaryText}>{confirmedBookingData.selectedHospital?.name}</Text>
              <Text style={styles.slipSecondaryText}>
                {confirmedBookingData.selectedDepartment?.name}
              </Text>
              <Text style={styles.slipSecondaryText}>
                {confirmedBookingData.selectedHospital?.address}
              </Text>
            </View>

            <View style={styles.slipDivider} />

            {/* Slot Details */}
            <View style={styles.slipSectionBlock}>
              <Text style={styles.slipSectionHeading}>SCHEDULED APPOINTMENT TIME</Text>
              <View style={styles.slipSlotRow}>
                <Calendar size={14} color="#65B300" />
                <Text style={styles.slipSlotText}>
                  {confirmedBookingData.selectedDate?.dayName}, {confirmedBookingData.selectedDate?.dayNumber} {confirmedBookingData.selectedDate?.monthName}
                </Text>
                <Clock size={14} color="#65B300" style={{ marginLeft: 12 }} />
                <Text style={styles.slipSlotText}>{confirmedBookingData.selectedSlot?.time}</Text>
              </View>
            </View>

            <View style={styles.slipDivider} />

            {/* Payment Verification */}
            <View style={styles.slipPaymentRow}>
              <View>
                <Text style={styles.slipMetaLabel}>AMOUNT PAID</Text>
                <Text style={styles.slipPaidAmount}>₹{confirmedBookingData.finalPayableAmount}</Text>
              </View>
              <View style={styles.slipVerifiedBadge}>
                <ShieldCheck size={14} color="#059669" />
                <Text style={styles.slipVerifiedText}>Token Verified</Text>
              </View>
            </View>
          </View>

          {/* Share Buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, gap: 12 }}>
            {/* WhatsApp Share */}
            <TouchableOpacity
              style={[styles.shareBtn, { flex: 1, backgroundColor: '#25D366', borderColor: '#25D366', marginBottom: 0 }]}
              onPress={() => {
                const pdfMsg =
                  `\n` +
                  `*ONE BUDDY HEALTHCARE*\n` +
                  `*OFFICIAL OPD E-PASS (PDF)*\n` +
                  `\n\n` +
                  `*TOKEN:* ${confirmedBookingData.tokenNumber}\n` +
                  `*APPT ID:* ${confirmedBookingData.appointmentId}\n` +
                  `*BOOKED ON:* ${confirmedBookingData.bookingTimestamp}\n\n` +
                  ` PATIENT DETAILS \n` +
                  `*Name:* ${confirmedBookingData.patientName}\n` +
                  `*Gender:* ${confirmedBookingData.gender}\n` +
                  `*Age:* ${confirmedBookingData.age} Yrs\n` +
                  `*Mobile:* +91 ${confirmedBookingData.mobileNumber}\n` +
                  `*Reason for Visit:* ${confirmedBookingData.reason || 'Not specified'}\n\n` +
                  `HOSPITAL & DEPARTMENT \n` +
                  `*Hospital:* ${confirmedBookingData.selectedHospital?.name}\n` +
                  `*Location:* ${confirmedBookingData.selectedHospital?.branch}\n` +
                  `*Department:* ${confirmedBookingData.selectedDepartment?.name}\n\n` +
                  `APPOINTMENT SLOT \n` +
                  `*Date:* ${confirmedBookingData.selectedDate?.dayName}, ${confirmedBookingData.selectedDate?.dayNumber} ${confirmedBookingData.selectedDate?.monthName}\n` +
                  `*Time:* ${confirmedBookingData.selectedSlot?.time}\n\n` +
                  ` PAYMENT \n` +
                  `*Amount Paid:* ₹${confirmedBookingData.finalPayableAmount}\n` +
                  `*Status:* Confirmed & Verified\n\n` +
                  `\n` +
                  `Thank you for choosing One Buddy Healthcare!`;

                Linking.openURL(`whatsapp://send?phone=91${confirmedBookingData.mobileNumber}&text=${encodeURIComponent(pdfMsg)}`).catch(() => {
                  Linking.openURL(`https://wa.me/91${confirmedBookingData.mobileNumber}?text=${encodeURIComponent(pdfMsg)}`).catch(() => {
                    Alert.alert('Error', 'Could not open WhatsApp.');
                  });
                });
              }}
              activeOpacity={0.8}
            >
              <Share2 size={16} color="#FFFFFF" />
              <Text style={[styles.shareBtnText, { color: '#FFFFFF' }]}>WhatsApp</Text>
            </TouchableOpacity>

            {/* Email Share */}
            <TouchableOpacity
              style={[styles.shareBtn, { flex: 1, backgroundColor: '#EA4335', borderColor: '#EA4335', marginBottom: 0 }]}
              onPress={() => {
                const subject = `OPD E-Pass (PDF) - ${confirmedBookingData.patientName} | ${confirmedBookingData.appointmentId}`;
                const body =
                  `ONE BUDDY HEALTHCARE — OFFICIAL OPD E-PASS\n` +
                  `${'='.repeat(45)}\n\n` +
                  `TOKEN NUMBER   : ${confirmedBookingData.tokenNumber}\n` +
                  `APPOINTMENT ID : ${confirmedBookingData.appointmentId}\n` +
                  `BOOKED ON      : ${confirmedBookingData.bookingTimestamp}\n\n` +
                  `--- PATIENT DETAILS ---\n` +
                  `Name           : ${confirmedBookingData.patientName}\n` +
                  `Gender         : ${confirmedBookingData.gender}\n` +
                  `Age            : ${confirmedBookingData.age} Years\n` +
                  `Mobile         : +91 ${confirmedBookingData.mobileNumber}\n` +
                  `Reason for Visit: ${confirmedBookingData.reason || 'Not specified'}\n` +
                  `UHID / Reg No  : ${confirmedBookingData.uhid || 'NEW-REG'}\n\n` +
                  `--- HOSPITAL & DEPARTMENT ---\n` +
                  `Hospital       : ${confirmedBookingData.selectedHospital?.name}\n` +
                  `Location       : ${confirmedBookingData.selectedHospital?.branch}\n` +
                  `Address        : ${confirmedBookingData.selectedHospital?.address}\n` +
                  `Department     : ${confirmedBookingData.selectedDepartment?.name}\n\n` +
                  `--- APPOINTMENT SCHEDULE ---\n` +
                  `Date           : ${confirmedBookingData.selectedDate?.dayName}, ${confirmedBookingData.selectedDate?.dayNumber} ${confirmedBookingData.selectedDate?.monthName}\n` +
                  `Time Slot      : ${confirmedBookingData.selectedSlot?.time}\n\n` +
                  `--- PAYMENT SUMMARY ---\n` +
                  `Amount Paid    : Rs. ${confirmedBookingData.finalPayableAmount}\n` +
                  `Status         : CONFIRMED & VERIFIED\n\n` +
                  `${'='.repeat(45)}\n` +
                  `This is an auto-generated OPD E-Pass.\n` +
                  `Please carry this slip to the hospital on the appointment date.\n\n` +
                  `Thank you for choosing One Buddy Healthcare!\n`;

                Linking.openURL(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`).catch(() => {
                  Alert.alert('Error', 'Could not open Email app.');
                });
              }}
              activeOpacity={0.8}
            >
              <FileText size={16} color="#FFFFFF" />
              <Text style={[styles.shareBtnText, { color: '#FFFFFF' }]}>Email</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Sticky Bottom Bar with Prominent Back to Home Button */}
        <View
          style={[
            styles.confirmationBottomBar,
            {
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backToHomePrimaryBtn}
            onPress={handleReturnHome}
            activeOpacity={0.85}
          >
            <Home size={18} color="#FFFFFF" />
            <Text style={styles.backToHomeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.rootView}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121214" : "#FFFFFF"} />

      {confirmedBookingData ? (
        renderConfirmationScreen()
      ) : currentStep === 5 ? (
        <PaymentCheckoutScreen
          grandTotal={finalPayableAmount}
          hideCOD={true}
          hideReceiptModal={true}
          title="OP Appointment Payment"
          subtitle="256-bit Encrypted • Hospital OPD Pass"
          onBack={() => setCurrentStep(4)}
          onOrderSuccess={(details) => {
            handleConfirmAndPay();
          }}
        />
      ) : (
        <>
          {/* Header Bar with Top Safe Inset */}
          <View
            style={[
              styles.header,
              {
                paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 8 : 12),
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handlePreviousStep}
              activeOpacity={0.7}
            >
              <ChevronLeft size={22} color={isDark ? '#F1F5F9' : '#1E293B'} />
            </TouchableOpacity>

            <View style={styles.headerTitleBox}>
              <Text style={styles.headerTitle}>Book OP Appointment</Text>
              <Text style={styles.headerSub}>One Buddy Healthcare</Text>
            </View>
          </View>

          {/* Stepper Indicator */}
          <View style={styles.stepperContainer}>
        {/* Top row: circles + connectors */}
        <View style={styles.stepperDotsRow}>
          {[
            { num: 1, label: 'Patient' },
            { num: 2, label: 'Hospital' },
            { num: 3, label: 'Slot' },
            { num: 4, label: 'Review' },
            { num: 5, label: 'Pay' },
          ].map((s, idx) => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;
            return (
              <React.Fragment key={s.num}>
                <View style={styles.stepCircleWrap}>
                  <View
                    style={[
                      styles.stepCircle,
                      isActive && styles.stepCircleActive,
                      isDone && styles.stepCircleDone,
                    ]}
                  >
                    {isDone ? (
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    ) : (
                      <Text
                        style={[
                          styles.stepCircleText,
                          isActive && styles.stepCircleTextActive,
                        ]}
                      >
                        {s.num}
                      </Text>
                    )}
                  </View>
                </View>
                {idx < 4 && (
                  <View
                    style={[
                      styles.stepConnector,
                      isDone && styles.stepConnectorDone,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Bottom row: labels aligned under each circle */}
        <View style={styles.stepperLabelsRow}>
          {[
            { num: 1, label: 'Patient' },
            { num: 2, label: 'Hospital' },
            { num: 3, label: 'Slot' },
            { num: 4, label: 'Review' },
            { num: 5, label: 'Pay' },
          ].map((s) => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;
            return (
              <View key={s.num} style={styles.stepLabelWrap}>
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                    isDone && styles.stepLabelDone,
                  ]}
                  numberOfLines={1}
                >
                  {s.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Step Content ScrollView */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={[styles.contentScrollView, { flex: 1 }]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ========================================================= */}
          {/* STEP 1: PATIENT DETAILS CARD */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <View style={styles.stepSection}>
              {/* Booking For Switch */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Who is this appointment for?</Text>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, bookingFor === 'Self' && styles.toggleBtnActive]}
                    onPress={() => setBookingFor('Self')}
                    activeOpacity={0.8}
                  >
                    <User size={15} color={bookingFor === 'Self' ? '#FFFFFF' : '#64748B'} />
                    <Text style={[styles.toggleBtnText, bookingFor === 'Self' && styles.toggleBtnTextActive]}>
                      Self
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleBtn, bookingFor === 'Family' && styles.toggleBtnActive]}
                    onPress={() => setBookingFor('Family')}
                    activeOpacity={0.8}
                  >
                    <ShieldCheck size={15} color={bookingFor === 'Family' ? '#FFFFFF' : '#64748B'} />
                    <Text style={[styles.toggleBtnText, bookingFor === 'Family' && styles.toggleBtnTextActive]}>
                      Family Member
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.bookingFor && <Text style={[styles.errorText, { marginTop: 8 }]}>{errors.bookingFor}</Text>}

                <View style={styles.divider} />

                {/* Patient Type Switch (New vs Follow-Up) */}
                <Text style={styles.fieldLabel}>Patient Type</Text>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.typeOptionCard, patientType === 'New' && styles.typeOptionCardActive]}
                    onPress={() => setPatientType('New')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radioDotOuter}>
                      {patientType === 'New' && <View style={styles.radioDotInner} />}
                    </View>
                    <View style={styles.typeOptionContent}>
                      <Text style={[styles.typeOptionTitle, patientType === 'New' && styles.typeOptionTitleActive]}>
                        New Patient
                      </Text>
                      <Text style={styles.typeOptionSub}>First visit (Includes OPD card fee)</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeOptionCard, patientType === 'FollowUp' && styles.typeOptionCardActive]}
                    onPress={() => setPatientType('FollowUp')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radioDotOuter}>
                      {patientType === 'FollowUp' && <View style={styles.radioDotInner} />}
                    </View>
                    <View style={styles.typeOptionContent}>
                      <Text style={[styles.typeOptionTitle, patientType === 'FollowUp' && styles.typeOptionTitleActive]}>
                        Follow-Up Patient
                      </Text>
                      <Text style={styles.typeOptionSub}>Existing UHID token holder</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                {errors.patientType && <Text style={[styles.errorText, { marginTop: 8 }]}>{errors.patientType}</Text>}

                {/* Dynamic UHID Field (Required for Follow-Up) */}
                {patientType === 'FollowUp' && (
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>
                      UHID / Hospital Patient ID <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, errors.uhid && styles.inputError]}
                      placeholder="e.g. UHID-9920194 or AP-8821"
                      placeholderTextColor="#94A3B8"
                      value={uhid}
                      onChangeText={(txt) => {
                        setUhid(txt);
                        if (errors.uhid) setErrors({ ...errors, uhid: undefined });
                      }}
                      autoCapitalize="characters"
                    />
                    {errors.uhid && <Text style={styles.errorText}>{errors.uhid}</Text>}
                  </View>
                )}
              </View>

              {/* Patient Personal Details Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Patient Personal Information</Text>

                {/* Full Name */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>
                    Patient Full Name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.patientName && styles.inputError]}
                    placeholder="Enter your full legal name"
                    placeholderTextColor="#94A3B8"
                    value={patientName}
                    onChangeText={(txt) => {
                      setPatientName(txt);
                      if (errors.patientName) setErrors({ ...errors, patientName: undefined });
                    }}
                  />
                  {errors.patientName && <Text style={styles.errorText}>{errors.patientName}</Text>}
                </View>

                {/* DOB and Age Row (DOB on left, Age on right) */}
                <View style={styles.twoColumnRow}>
                  <View style={[styles.fieldBlock, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.fieldLabel}>DOB (Calendar)</Text>
                    <TouchableOpacity
                      style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                      onPress={() => {
                        if (dob) {
                          const parts = dob.split('-');
                          if (parts.length === 3) {
                            const y = parseInt(parts[0], 10);
                            const m = parseInt(parts[1], 10) - 1;
                            if (!isNaN(y)) setDobPickerYear(y);
                            if (!isNaN(m) && m >= 0 && m <= 11) setDobPickerMonth(m);
                          }
                        }
                        setIsDobPickerOpen(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 13, color: dob ? (isDark ? '#F1F5F9' : '#0F172A') : '#94A3B8', fontWeight: '500' }}>
                        {dob || 'YYYY-MM-DD'}
                      </Text>
                      <Calendar size={16} color="#65B300" />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.fieldBlock, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.fieldLabel}>
                      Age (Years) <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, errors.age && styles.inputError]}
                      placeholder="Enter your age (e.g. 29)"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      maxLength={3}
                      value={age}
                      onChangeText={(txt) => {
                        setAge(txt);
                        if (errors.age) setErrors({ ...errors, age: undefined });
                      }}
                    />
                    {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
                  </View>
                </View>
              </View>

              {/* Gender Picker */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  Gender <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.genderRow}>
                  {(['Male', 'Female', 'Other'] as Gender[]).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderChip, gender === g && styles.genderChipActive]}
                      onPress={() => setGender(g)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
              </View>

              {/* Mobile Number */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  Mobile Number <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={[styles.phoneInputWrap, errors.mobileNumber && styles.inputError]}>
                  <View style={styles.phonePrefix}>
                    <Text style={styles.phonePrefixText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={mobileNumber}
                    onChangeText={(txt) => {
                      setMobileNumber(txt);
                      if (errors.mobileNumber) setErrors({ ...errors, mobileNumber: undefined });
                    }}
                  />
                </View>
                {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}
              </View>

              {/* Reason for Visit / Patient Issue */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>
                  Reason for Visit / Patient Issue <Text style={styles.requiredStar}>*</Text>
                </Text>

                <TouchableOpacity
                  style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, errors.reason && !isOtherReason && styles.inputError]}
                  onPress={() => setReasonDropdownOpen(!reasonDropdownOpen)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: (isOtherReason || reason) ? '#0F172A' : '#94A3B8' }}>
                    {isOtherReason ? 'Other' : (reason || 'Select reason for visit')}
                  </Text>
                  <ChevronRight size={18} color="#64748B" style={{ transform: [{ rotate: reasonDropdownOpen ? '90deg' : '0deg' }] }} />
                </TouchableOpacity>

                {reasonDropdownOpen && (
                  <View style={{ marginTop: 4, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
                    {['Fever / Cold', 'Body Ache / Pain', 'Routine Checkup', 'Vaccination', 'Specialist Consultation', 'Other'].map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                        onPress={() => {
                          if (opt === 'Other') {
                            setIsOtherReason(true);
                            setReason('');
                          } else {
                            setIsOtherReason(false);
                            setReason(opt);
                            const deptId = REASON_TO_DEPT_ID[opt];
                            if (deptId) {
                              const foundDept = DEPARTMENTS.find(d => d.id === deptId);
                              if (foundDept) setSelectedDepartment(foundDept);
                            }
                          }
                          setReasonDropdownOpen(false);
                          if (errors.reason) setErrors({ ...errors, reason: undefined });
                        }}
                      >
                        <Text style={{ color: '#0F172A', fontSize: 14 }}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {isOtherReason && (
                  <TextInput
                    style={[styles.input, { marginTop: 8, height: 80, textAlignVertical: 'top' }, errors.reason && styles.inputError]}
                    placeholder="Please specify the reason..."
                    placeholderTextColor="#94A3B8"
                    multiline={true}
                    numberOfLines={3}
                    value={reason}
                    onChangeText={(txt) => {
                      setReason(txt);
                      if (errors.reason) setErrors({ ...errors, reason: undefined });
                    }}
                  />
                )}

                {errors.reason && <Text style={styles.errorText}>{errors.reason}</Text>}
              </View>

              {/* OPD Department Selection (linked to reason) */}
              {(reason !== '') ? (() => {
                const suggestedDeptId = REASON_TO_DEPT_ID[reason];
                return (
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>Select OPD Department <Text style={styles.requiredStar}>*</Text></Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                      {DEPARTMENTS.map((dep) => {
                        const isActive = selectedDepartment?.id === dep.id;
                        const isSuggested = dep.id === suggestedDeptId;
                        return (
                          <TouchableOpacity
                            key={dep.id}
                            style={[{
                              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                              borderWidth: 1.5,
                              borderColor: isActive ? '#65B300' : isSuggested ? '#A3DB65' : '#E2E8F0',
                              backgroundColor: isActive ? '#65B300' : isSuggested ? '#EFF8E6' : '#FAFCF8',
                            }]}
                            onPress={() => setSelectedDepartment(dep)}
                            activeOpacity={0.8}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '600', color: isActive ? '#FFFFFF' : isSuggested ? '#65B300' : '#64748B' }}>
                              {dep.name} {isSuggested ? '(Suggested)' : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {errors.department && <Text style={styles.errorText}>{errors.department}</Text>}
                  </View>
                );
              })() : null}

            </View>
          )}

          {/* ========================================================= */}
          {/* STEP 2: HOSPITAL, OPD & DOCTOR SELECTION */}
          {/* ========================================================= */}
          {currentStep === 2 && (
            <View style={styles.stepSection}>
              {/* Hospital Selector */}
              <View style={styles.card}>
                <View style={styles.sectionHeaderBetween}>
                  <Text style={styles.cardTitle}>1. Select Hospital</Text>
                  <Building2 size={18} color="#2563EB" />
                </View>

                <View style={styles.searchWrap}>
                  <Search size={16} color="#64748B" />
                  <TextInput
                    style={styles.searchField}
                    placeholder="Search partner hospitals..."
                    placeholderTextColor="#94A3B8"
                    value={hospitalSearch}
                    onChangeText={setHospitalSearch}
                  />
                  {hospitalSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setHospitalSearch('')}>
                      <X size={15} color="#64748B" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.hospitalList}>
                  {filteredHospitals.map((hosp) => {
                    const isSelected = selectedHospital?.id === hosp.id;
                    return (
                      <TouchableOpacity
                        key={hosp.id}
                        style={[styles.hospitalCard, isSelected && styles.hospitalCardActive, { flexDirection: 'column' }]}
                        onPress={() => {
                          setSelectedHospital(hosp);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <View style={styles.hospitalRadio}>
                            {isSelected && <View style={styles.radioDotInner} />}
                          </View>
                          <Text style={[styles.hospitalName, isSelected && styles.hospitalNameActive, { flex: 1 }]}>
                            {hosp.name}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row' }}>
                          {hosp.imageUrl && (
                            <Image
                              source={{ uri: hosp.imageUrl }}
                              style={{ width: 70, height: 70, borderRadius: 8, marginRight: 12, backgroundColor: '#E2E8F0' }}
                            />
                          )}
                          <View style={styles.hospitalDetails}>
                            <Text style={styles.hospitalBranch}>{hosp.branch}</Text>

                            {/* Diseases / Specialties the hospital treats */}
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                              {hosp.departments.map((dept) => {
                                const label = DEPT_TO_DISEASE[dept] || dept;
                                return (
                                  <View key={dept} style={{ backgroundColor: '#EFF8E6', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                                    <Text style={{ fontSize: 9, color: '#65B300', fontWeight: '600' }}>{label}</Text>
                                  </View>
                                );
                              })}
                            </View>

                            <View style={[styles.hospitalRatingRow, { marginTop: 6 }]}>
                              <Award size={12} color="#059669" />
                              <Text style={styles.hospitalRatingText}>
                                {hosp.rating} Rating
                              </Text>
                              {hosp.distance && (
                                <>
                                  <Text style={{ fontSize: 10, color: '#94A3B8', marginHorizontal: 6 }}>•</Text>
                                  <MapPin size={10} color="#64748B" />
                                  <Text style={{ fontSize: 10, color: '#64748B', marginLeft: 2 }}>{hosp.distance}</Text>
                                </>
                              )}
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Hint when no hospital selected */}
              {!selectedHospital && (
                <View style={{ alignItems: 'center', paddingVertical: 12, marginBottom: 4 }}>
                  <Info size={16} color="#94A3B8" />
                  <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 6, textAlign: 'center' }}>
                    Select a partner hospital above for your appointment
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ========================================================= */}
          {/* STEP 3: DATE & TIME SLOT PICKER */}
          {/* ========================================================= */}
          {currentStep === 3 && (
            <View style={styles.stepSection}>
              {/* Horizontal Date Picker */}
              <View style={styles.card}>
                <View style={styles.sectionHeaderBetween}>
                  <Text style={styles.cardTitle}>Select Appointment Date</Text>
                  <Calendar size={18} color="#2563EB" />
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dateSelectorContainer}
                >
                  {dateOptions.map((item) => {
                    const isSelected = selectedDate?.dateString === item.dateString;
                    return (
                      <TouchableOpacity
                        key={item.dateString}
                        style={[styles.dateCard, isSelected && styles.dateCardActive]}
                        onPress={() => setSelectedDate(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.dateDayName, isSelected && styles.dateDayNameActive]}>
                          {item.dayName}
                        </Text>
                        <Text style={[styles.dateDayNumber, isSelected && styles.dateDayNumberActive]}>
                          {item.dayNumber}
                        </Text>
                        <Text style={[styles.dateMonthName, isSelected && styles.dateMonthNameActive]}>
                          {item.monthName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Time Slot Picker with Morning, Afternoon, Evening Sessions */}
              <View style={styles.card}>
                <View style={styles.sectionHeaderBetween}>
                  <Text style={styles.cardTitle}>Available OP Time Slots</Text>
                  <Clock size={18} color="#2563EB" />
                </View>

                {(['Morning', 'Afternoon', 'Evening'] as SlotSession[]).map((session) => {
                  const sessionSlots = TIME_SLOTS.filter((s) => s.session === session);
                  return (
                    <View key={session} style={styles.sessionBlock}>
                      <Text style={styles.sessionHeading}>{session} Slots</Text>
                      <View style={styles.slotsGrid}>
                        {sessionSlots.map((slot) => {
                          const isSelected = selectedSlot?.id === slot.id;
                          const isUnavailable = !slot.isAvailable || isSlotPassed(slot);

                          return (
                            <TouchableOpacity
                              key={slot.id}
                              style={[
                                styles.slotChip,
                                isSelected && styles.slotChipActive,
                                isUnavailable && styles.slotChipDisabled,
                              ]}
                              disabled={isUnavailable}
                              onPress={() => setSelectedSlot(slot)}
                              activeOpacity={0.7}
                            >
                              <Clock
                                size={12}
                                color={isSelected ? '#FFFFFF' : isUnavailable ? '#CBD5E1' : '#65B300'}
                              />
                              <Text
                                style={[
                                  styles.slotText,
                                  isSelected && styles.slotTextActive,
                                  isUnavailable && styles.slotTextDisabled,
                                ]}
                              >
                                {slot.time}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* STEP 4: PAYMENT BREAKDOWN & BOOKING REVIEW */}
          {/* ========================================================= */}
          {currentStep === 4 && (
            <View style={styles.stepSection}>
              {/* Booking Summary Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Appointment Summary</Text>

                <View style={styles.summaryItemRow}>
                  <View style={styles.summaryIconBox}>
                    <User size={16} color="#2563EB" />
                  </View>
                  <View style={styles.summaryItemDetails}>
                    <Text style={styles.summaryLabel}>Patient</Text>
                    <Text style={styles.summaryValue}>
                      {patientName} ({gender}, {age} Yrs)
                    </Text>
                    <Text style={styles.summarySub}>
                      {patientType === 'New' ? 'New Registration' : `UHID: ${uhid}`}
                    </Text>
                    {reason ? (
                      <Text style={styles.summarySub}>
                        Reason: {reason}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryItemRow}>
                  <View style={styles.summaryIconBox}>
                    <Building2 size={16} color="#2563EB" />
                  </View>
                  <View style={styles.summaryItemDetails}>
                    <Text style={styles.summaryLabel}>Hospital & Department</Text>
                    <Text style={styles.summaryValue}>{selectedHospital?.name}</Text>
                    <Text style={styles.summarySub}>
                      {selectedDepartment?.name} • {selectedHospital?.branch}
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryItemRow}>
                  <View style={styles.summaryIconBox}>
                    <Calendar size={16} color="#2563EB" />
                  </View>
                  <View style={styles.summaryItemDetails}>
                    <Text style={styles.summaryLabel}>Appointment Schedule</Text>
                    <Text style={styles.summaryValue}>
                      {selectedDate?.dayName}, {selectedDate?.dayNumber} {selectedDate?.monthName}
                    </Text>
                    <Text style={styles.summarySub}>Slot Time: {selectedSlot?.time}</Text>
                  </View>
                </View>
              </View>

              {/* Payment Breakdown Card */}
              <View style={styles.card}>
                <View style={styles.sectionHeaderBetween}>
                  <Text style={styles.cardTitle}>Payment Breakdown</Text>
                  <CreditCard size={16} color="#2563EB" />
                </View>

                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Doctor Consultation Fee</Text>
                  <Text style={styles.feeValue}>₹{consultationFee}</Text>
                </View>

                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Platform Convenience Fee</Text>
                  <Text style={styles.feeValue}>₹{PLATFORM_FEE}</Text>
                </View>

                <View style={styles.feeDivider} />

                <View style={styles.totalRow}>
                  <View>
                    <Text style={styles.totalLabel}>Total Payable Amount</Text>
                    <Text style={styles.totalTaxNote}>(Includes platform fee)</Text>
                  </View>
                  <Text style={styles.totalValue}>₹{finalPayableAmount}</Text>
                </View>
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* STEP 5: ONLINE PAYMENT */}
          {/* ========================================================= */}
          {currentStep === 5 && (
            <View style={styles.stepSection}>
              {/* Order Summary */}
              <View style={styles.card}>
                <View style={styles.sectionHeaderBetween}>
                  <Text style={styles.cardTitle}>Order Summary</Text>
                  <CreditCard size={18} color="#2563EB" />
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Consultation Fee</Text>
                  <Text style={styles.feeValue}>₹{consultationFee}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Platform Fee</Text>
                  <Text style={styles.feeValue}>₹{PLATFORM_FEE}</Text>
                </View>
                <View style={styles.feeDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>₹{finalPayableAmount}</Text>
                </View>
              </View>

              {/* Payment Methods */}
              <View style={styles.card}>
                <View style={styles.sectionHeaderBetween}>
                  <Text style={styles.cardTitle}>Select Payment Method</Text>
                  <Sparkles size={18} color="#2563EB" />
                </View>

                {/* UPI */}
                <TouchableOpacity
                  style={[styles.payMethodCard, selectedPaymentMethod === 'upi' && styles.payMethodCardActive]}
                  onPress={() => setSelectedPaymentMethod('upi')}
                  activeOpacity={0.8}
                >
                  <View style={styles.payMethodRadio}>
                    {selectedPaymentMethod === 'upi' && <View style={styles.payMethodRadioDot} />}
                  </View>
                  <View style={styles.payMethodIcon}>
                    <Smartphone size={20} color="#65B300" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payMethodTitle}>UPI Payment</Text>
                    <Text style={styles.payMethodSub}>Pay via GPay, PhonePe, Paytm, BHIM</Text>
                  </View>
                </TouchableOpacity>

                {selectedPaymentMethod === 'upi' && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, gap: 8, marginBottom: 8 }}>
                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map((app) => (
                      <TouchableOpacity
                        key={app}
                        style={[
                          {
                            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5,
                            borderColor: selectedUpiApp === app ? '#65B300' : '#E2E8F0',
                            backgroundColor: selectedUpiApp === app ? '#EFF8E6' : '#FAFCF8'
                          },
                        ]}
                        onPress={() => setSelectedUpiApp(app)}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: selectedUpiApp === app ? '#65B300' : '#475569' }}>{app}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Credit / Debit Card */}
                <TouchableOpacity
                  style={[styles.payMethodCard, selectedPaymentMethod === 'card' && styles.payMethodCardActive]}
                  onPress={() => setSelectedPaymentMethod('card')}
                  activeOpacity={0.8}
                >
                  <View style={styles.payMethodRadio}>
                    {selectedPaymentMethod === 'card' && <View style={styles.payMethodRadioDot} />}
                  </View>
                  <View style={styles.payMethodIcon}>
                    <CreditCard size={20} color="#65B300" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payMethodTitle}>Credit / Debit Card</Text>
                    <Text style={styles.payMethodSub}>Visa, Mastercard, RuPay accepted</Text>
                  </View>
                </TouchableOpacity>

                {/* Net Banking */}
                <TouchableOpacity
                  style={[styles.payMethodCard, selectedPaymentMethod === 'netbanking' && styles.payMethodCardActive]}
                  onPress={() => setSelectedPaymentMethod('netbanking')}
                  activeOpacity={0.8}
                >
                  <View style={styles.payMethodRadio}>
                    {selectedPaymentMethod === 'netbanking' && <View style={styles.payMethodRadioDot} />}
                  </View>
                  <View style={styles.payMethodIcon}>
                    <Building2 size={20} color="#65B300" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payMethodTitle}>Net Banking</Text>
                    <Text style={styles.payMethodSub}>All major Indian banks supported</Text>
                  </View>
                </TouchableOpacity>

                {/* Mobile Wallet */}
                <TouchableOpacity
                  style={[styles.payMethodCard, selectedPaymentMethod === 'wallet' && styles.payMethodCardActive]}
                  onPress={() => setSelectedPaymentMethod('wallet')}
                  activeOpacity={0.8}
                >
                  <View style={styles.payMethodRadio}>
                    {selectedPaymentMethod === 'wallet' && <View style={styles.payMethodRadioDot} />}
                  </View>
                  <View style={styles.payMethodIcon}>
                    <Wallet size={20} color="#65B300" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payMethodTitle}>Mobile Wallet</Text>
                    <Text style={styles.payMethodSub}>Amazon Pay, Mobikwik, Ola Money</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Secure Payment Note */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginBottom: 8, gap: 8 }}>
                <ShieldCheck size={14} color="#059669" />
                <Text style={{ fontSize: 11, color: '#64748B' }}>100% Secure & Encrypted Payment. No data is shared.</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Safe Area Bottom Action Bar (Footer) - Fixed, outside KeyboardAvoidingView */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        {selectedHospital && selectedSlot ? (
          <View style={styles.bottomPriceCol}>
            <Text style={styles.bottomPriceLabel}>Consultation Fee</Text>
            <Text style={styles.bottomPriceValue}>₹{consultationFee}</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={handleNextStep}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryActionBtnText}>
            Proceed to Next Step
          </Text>
          <ChevronRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      </>
      )}

      {/* ========================================================= */}
      {/* DOB CALENDAR PICKER MODAL */}
      {
        isDobPickerOpen && (
          <Modal
            visible={isDobPickerOpen}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setIsDobPickerOpen(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalCard, { padding: 20, maxHeight: '85%' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Calendar size={18} color="#65B300" />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>Select Date of Birth</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsDobPickerOpen(false)} style={styles.modalCloseBtn}>
                    <X size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, backgroundColor: '#FAFCF8', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (dobPickerMonth === 0) {
                        setDobPickerMonth(11);
                        setDobPickerYear(prev => prev - 1);
                      } else {
                        setDobPickerMonth(prev => prev - 1);
                      }
                    }}
                    style={{ padding: 6 }}
                  >
                    <ChevronLeft size={20} color="#65B300" />
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][dobPickerMonth]}
                    </Text>

                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: isYearPickerView ? '#65B300' : '#EFF8E6',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#C6E6A7',
                      }}
                      onPress={() => setIsYearPickerView(!isYearPickerView)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '800', color: isYearPickerView ? '#FFFFFF' : '#65B300' }}>
                        {dobPickerYear} ▾
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      if (dobPickerMonth === 11) {
                        setDobPickerMonth(0);
                        setDobPickerYear(prev => prev + 1);
                      } else {
                        setDobPickerMonth(prev => prev + 1);
                      }
                    }}
                    style={{ padding: 6 }}
                  >
                    <ChevronRight size={20} color="#65B300" />
                  </TouchableOpacity>
                </View>

                {isYearPickerView ? (
                  <View style={{ marginVertical: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 8, textAlign: 'center' }}>
                      Scroll up for current year, down for past years
                    </Text>
                    <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={true}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        {Array.from({ length: 2026 - 1920 + 1 }, (_, i) => 2026 - i).map((yr) => {
                          const isSelected = dobPickerYear === yr;
                          return (
                            <TouchableOpacity
                              key={yr}
                              style={{
                                width: '23%',
                                paddingVertical: 10,
                                borderRadius: 8,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isSelected ? '#65B300' : '#F8FAFC',
                                borderWidth: 1,
                                borderColor: isSelected ? '#65B300' : '#E2E8F0',
                                marginBottom: 6,
                              }}
                              onPress={() => {
                                setDobPickerYear(yr);
                                setIsYearPickerView(false);
                              }}
                            >
                              <Text style={{ fontSize: 13, fontWeight: isSelected ? '800' : '600', color: isSelected ? '#FFFFFF' : '#0F172A' }}>
                                {yr}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                        <Text key={d} style={{ width: 36, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#64748B' }}>{d}</Text>
                      ))}
                    </View>

                    <ScrollView style={{ maxHeight: 220, marginVertical: 8 }}>
                      {(() => {
                        const firstDay = new Date(dobPickerYear, dobPickerMonth, 1).getDay();
                        const totalDays = new Date(dobPickerYear, dobPickerMonth + 1, 0).getDate();
                        const gridCells = [];

                        for (let i = 0; i < firstDay; i++) {
                          gridCells.push(<View key={`empty-${i}`} style={{ width: 36, height: 36 }} />);
                        }

                        for (let day = 1; day <= totalDays; day++) {
                          const mStr = String(dobPickerMonth + 1).padStart(2, '0');
                          const dStr = String(day).padStart(2, '0');
                          const dateFormatted = `${dobPickerYear}-${mStr}-${dStr}`;
                          const isSelected = dob === dateFormatted;

                          gridCells.push(
                            <TouchableOpacity
                              key={`day-${day}`}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginVertical: 2,
                                backgroundColor: isSelected ? '#65B300' : 'transparent',
                              }}
                              onPress={() => {
                                setDob(dateFormatted);

                                const today = new Date();
                                let calcAge = today.getFullYear() - dobPickerYear;
                                const monthDiff = today.getMonth() - dobPickerMonth;
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
                                  calcAge--;
                                }
                                if (calcAge >= 0 && calcAge <= 120) {
                                  setAge(String(calcAge));
                                  if (errors.age) setErrors({ ...errors, age: undefined });
                                }

                                setIsDobPickerOpen(false);
                              }}
                            >
                              <Text style={{ fontSize: 13, fontWeight: isSelected ? '800' : '500', color: isSelected ? '#FFFFFF' : (isDark ? '#F1F5F9' : '#0F172A') }}>
                                {day}
                              </Text>
                            </TouchableOpacity>
                          );
                        }

                        return <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>{gridCells}</View>;
                      })()}
                    </ScrollView>


                  </>
                )}
              </View>
            </View>
          </Modal>
        )
      }

    </View>
  );
}

// ==========================================
// 4. STYLESHEET
// ==========================================

function createStyles(isDark: boolean) {
  const bg = isDark ? '#121214' : '#FAFCF8';
  const surface = isDark ? '#1E2025' : '#FFFFFF';
  const surfaceAlt = isDark ? '#2A2D35' : '#F8FAFC';
  const border = isDark ? '#3A3F4B' : '#E2E8F0';
  const borderSoft = isDark ? '#2F3340' : '#CBD5E1';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const textLabel = isDark ? '#CBD5E1' : '#334155';
  const textHeading = isDark ? '#E2E8F0' : '#0F172A';
  const dividerColor = isDark ? '#2A2D35' : '#F1F5F9';
  const inputBg = isDark ? '#2A2D35' : '#F8FAFC';
  const chipBg = isDark ? '#2A2D35' : '#F8FAFC';
  const cardBorder = isDark ? '#3A3F4B' : '#E2E8F0';

  return StyleSheet.create({
  rootView: {
    flex: 1,
    backgroundColor: bg,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: surface,
    borderBottomWidth: 1,
    borderBottomColor: dividerColor,
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: isDark ? '#2A2D35' : '#F1F5F9',
    marginRight: 12,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: textHeading,
  },
  headerSub: {
    fontSize: 11,
    color: textSecondary,
    fontWeight: '500',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF8E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  locationBadgeText: {
    fontSize: 11,
    color: '#65B300',
    fontWeight: '600',
    marginLeft: 3,
  },

  // Stepper Styles
  stepperContainer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: surface,
    borderBottomWidth: 1,
    borderBottomColor: border,
  },
  stepperDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabelsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  stepCircleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabelWrap: {
    width: 46,
    alignItems: 'center',
  },

  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isDark ? '#2A2D35' : '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: borderSoft,
  },
  stepCircleActive: {
    backgroundColor: '#65B300',
    borderColor: '#65B300',
  },
  stepCircleDone: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  stepCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: textSecondary,
  },
  stepCircleTextActive: {
    color: '#FFFFFF',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: border,
    marginHorizontal: 4,
  },
  stepConnectorDone: {
    backgroundColor: '#059669',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: textMuted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#65B300',
    fontWeight: '700',
  },
  stepLabelDone: {
    color: '#059669',
  },

  // Content Container
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  stepSection: {
    gap: 16,
  },

  // Card Styles
  card: {
    backgroundColor: surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0 : 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: isDark ? 0 : 1,
      },
    }),
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: textHeading,
    marginBottom: 12,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: dividerColor,
    marginVertical: 14,
  },

  // Toggle Styles (Self/Family)
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: chipBg,
    borderWidth: 1,
    borderColor: border,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#65B300',
    borderColor: '#65B300',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: isDark ? '#94A3B8' : '#475569',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },

  // Patient Type Cards
  typeOptionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: chipBg,
    borderWidth: 1,
    borderColor: border,
  },
  typeOptionCardActive: {
    backgroundColor: '#EFF8E6',
    borderColor: '#65B300',
  },
  radioDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#65B300',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#65B300',
  },
  typeOptionContent: {
    flex: 1,
  },
  typeOptionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: textPrimary,
  },
  typeOptionTitleActive: {
    color: '#65B300',
  },
  typeOptionSub: {
    fontSize: 10,
    color: textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },

  // Form Field Styles
  fieldBlock: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: textLabel,
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
  },
  labelWithBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionalBadge: {
    backgroundColor: isDark ? '#2A2D35' : '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  optionalBadgeText: {
    fontSize: 9,
    color: textSecondary,
    fontWeight: '600',
  },
  input: {
    height: 44,
    backgroundColor: inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: borderSoft,
    paddingHorizontal: 12,
    fontSize: 13,
    color: textPrimary,
    fontWeight: '500',
  },
  textArea: {
    height: 64,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '600',
  },
  twoColumnRow: {
    flexDirection: 'row',
  },

  // Gender Row
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: borderSoft,
  },
  genderChipActive: {
    backgroundColor: '#65B300',
    borderColor: '#65B300',
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: isDark ? '#94A3B8' : '#475569',
  },
  genderChipTextActive: {
    color: '#FFFFFF',
  },

  // Phone Input
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: borderSoft,
  },
  phonePrefix: {
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: borderSoft,
  },
  phonePrefixText: {
    fontSize: 13,
    fontWeight: '700',
    color: textLabel,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    color: textPrimary,
  },

  // Search Wrap (Hospitals)
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: border,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  searchField: {
    flex: 1,
    fontSize: 13,
    color: textPrimary,
    marginLeft: 8,
  },
  hospitalList: {
    gap: 10,
  },
  hospitalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    backgroundColor: chipBg,
    borderWidth: 1,
    borderColor: border,
  },
  hospitalCardActive: {
    backgroundColor: '#EFF8E6',
    borderColor: '#65B300',
  },
  hospitalRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#65B300',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  hospitalDetails: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 13,
    fontWeight: '700',
    color: textPrimary,
  },
  hospitalNameActive: {
    color: '#65B300',
  },
  hospitalBranch: {
    fontSize: 11,
    color: textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  hospitalRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hospitalRatingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 4,
  },

  // Department Chips Scroll
  depScroll: {
    marginHorizontal: -4,
  },
  depChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: chipBg,
    borderWidth: 1,
    borderColor: border,
    marginHorizontal: 4,
    minWidth: 140,
  },
  depChipActive: {
    backgroundColor: '#65B300',
    borderColor: '#65B300',
  },
  depChipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: textPrimary,
  },
  depChipTitleActive: {
    color: '#FFFFFF',
  },
  depChipSub: {
    fontSize: 10,
    color: textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  depChipSubActive: {
    color: '#EFF8E6',
  },

  // Date Selector (Step 3)
  dateSelectorContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  dateCard: {
    width: 62,
    height: 74,
    borderRadius: 12,
    backgroundColor: chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: border,
  },
  dateCardActive: {
    backgroundColor: '#65B300',
    borderColor: '#65B300',
  },
  dateDayName: {
    fontSize: 11,
    fontWeight: '600',
    color: textSecondary,
  },
  dateDayNameActive: {
    color: '#EFF8E6',
  },
  dateDayNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: textPrimary,
    marginVertical: 2,
  },
  dateDayNumberActive: {
    color: '#FFFFFF',
  },
  dateMonthName: {
    fontSize: 10,
    fontWeight: '600',
    color: textMuted,
  },
  dateMonthNameActive: {
    color: '#FFFFFF',
  },

  // Slot Grid (Step 3)
  sessionBlock: {
    marginTop: 10,
  },
  sessionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? '#94A3B8' : '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: chipBg,
    borderWidth: 1,
    borderColor: borderSoft,
    gap: 5,
  },
  slotChipActive: {
    backgroundColor: '#65B300',
    borderColor: '#65B300',
  },
  slotChipDisabled: {
    backgroundColor: isDark ? '#1E2025' : '#F1F5F9',
    borderColor: border,
    opacity: 0.6,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '600',
    color: textPrimary,
  },
  slotTextActive: {
    color: '#FFFFFF',
  },
  slotTextDisabled: {
    color: '#94A3B8',
  },

  // Summary & Breakdown (Step 4)
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  summaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF8E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  summaryItemDetails: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    color: textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: textPrimary,
    marginTop: 1,
  },
  summarySub: {
    fontSize: 11,
    color: textSecondary,
    marginTop: 1
  },
  summaryDivider: {
    height: 1,
    backgroundColor: dividerColor,
    marginVertical: 10,
  },

  // Fee Breakdown Styles
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  feeLabel: {
    fontSize: 12,
    color: textSecondary,
  },
  feeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: textPrimary,
  },
  discountText: {
    color: '#059669',
    fontWeight: '700',
  },
  feeDivider: {
    height: 1,
    backgroundColor: border,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: textPrimary,
  },
  totalTaxNote: {
    fontSize: 10,
    color: textMuted,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#65B300',
  },

  // Bottom Sticky Bar (Footer)
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: border,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: isDark ? 0 : 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: isDark ? 0 : 8,
      },
    }),
  },
  bottomPriceCol: {
    marginRight: 12,
  },
  bottomPriceLabel: {
    fontSize: 10,
    color: textSecondary,
    fontWeight: '600',
  },
  bottomPriceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: textPrimary,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#65B300',
    paddingVertical: 13,
    borderRadius: 16,
    gap: 6,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Confirmation Modal & OPD Slip
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalSuccessText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  modalScrollView: {
    padding: 16,
  },

  // OPD Slip Card Inner
  opdSlipCard: {
    backgroundColor: surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#65B300',
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#65B300',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0 : 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: isDark ? 0 : 3,
      },
    }),
  },
  slipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slipBrandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: textHeading,
  },
  slipSub: {
    fontSize: 9,
    fontWeight: '700',
    color: textSecondary,
    letterSpacing: 1.5,
    marginTop: 1,
  },
  tokenHighlightBox: {
    backgroundColor: '#EFF8E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6E6A7',
    alignItems: 'center',
  },
  tokenBoxTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: '#65B300',
    letterSpacing: 0.5,
  },
  tokenBoxNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4E8700',
  },
  slipDottedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  slipMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slipMetaCol: {
    flex: 1,
  },
  slipMetaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: textMuted,
    letterSpacing: 0.5,
  },
  slipMetaVal: {
    fontSize: 11,
    fontWeight: '700',
    color: textPrimary,
    marginTop: 2,
  },
  slipDivider: {
    height: 1,
    backgroundColor: dividerColor,
    marginVertical: 10,
  },
  slipSectionBlock: {},
  slipSectionHeading: {
    fontSize: 9,
    fontWeight: '800',
    color: textSecondary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  slipPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: textPrimary,
  },
  slipSecondaryText: {
    fontSize: 11,
    color: isDark ? '#94A3B8' : '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  slipHospitalName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#65B300',
    marginTop: 4,
  },
  slipSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#2A2D35' : '#FAFCF8',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  slipSlotText: {
    fontSize: 11,
    fontWeight: '700',
    color: textPrimary,
    marginLeft: 4,
  },
  slipPaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  slipPaidAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: textPrimary,
  },
  slipVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  slipVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },

  // Payment Method Card Styles
  payMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: borderSoft,
    backgroundColor: chipBg,
    marginBottom: 8,
    gap: 10,
  },
  payMethodCardActive: {
    borderColor: '#65B300',
    backgroundColor: '#EFF8E6',
  },
  payMethodRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#65B300',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payMethodRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#65B300',
  },
  payMethodIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payMethodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: textPrimary,
  },
  payMethodSub: {
    fontSize: 12,
    color: textSecondary,
    marginTop: 2,
  },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF8E6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C6E6A7',
  },
  shareBtnText: {
    color: '#65B300',
    fontSize: 13,
    fontWeight: '700',
  },

  // Confirmation Page Full Screen & Sticky Bottom Bar
  confirmationPageContainer: {
    flex: 1,
    backgroundColor: bg,
  },
  confirmationBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: surface,
    borderTopWidth: 1,
    borderTopColor: dividerColor,
    paddingHorizontal: 16,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: isDark ? 0 : 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: isDark ? 0 : 8,
      },
    }),
  },
  backToHomePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#65B300',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  backToHomeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  });
}

