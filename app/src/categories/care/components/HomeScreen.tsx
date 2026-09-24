import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  StatusBar,
  FlatList,
  Dimensions,
  Platform,
  Alert,
  Keyboard,
  Image,
  ImageSourcePropType,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/ThemeContext';
import {
  MapPin,
  Bell,
  Search,
  Calendar,
  Video,
  Home as HomeIcon,
  Pill,
  HelpCircle,
  MessageCircle,
  User,
  ShoppingBag,
  Clock,
  X,
  ChevronRight,
  ShieldCheck,
  Activity,
  Phone,
  Sparkles,
  Building2,
  Tag,
  Star,
  ArrowRight,
  Stethoscope,
  Edit3,
  Check,
  Mail,
  Send,
  Download,
  FileText,
  Plus,
  CheckCircle2,
  MessageSquare,
  LocateFixed,
  RefreshCw,
  Navigation,
  Compass,
  Share2,
  HeartPulse,
  Baby,
  Bone,
  SmilePlus,
  Leaf,
  ChevronLeft,
} from 'lucide-react-native';
import HospitalOpLogo from './HospitalOpLogo';
import { OnlineConsultationFlow } from '../categories/online-consultation/OnlineConsultationFlow';
import { HomeVisitsFlow } from '../categories/home-visits/HomeVisitsFlow';
import { OPBookingFlow, OPBookingData } from '../categories/op-booking';
import { MedicineDeliveryFlow, OrderHistoryItem } from '../categories/medicine-delivery';
import { BookingSummary } from '../categories/online-consultation/types/doctor';
import { Booking as HomeVisitBooking } from '../categories/home-visits/types';
import { getSavedOrders, saveOrders } from '../utils/ordersStorage';
import { FPS_CONFIG } from '../utils/fpsManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================

export interface Hospital {
  id: string;
  name: string;
  branch: string;
  address: string;
  rating: number;
  departments: string[];
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  memberId?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
}

export interface SearchableHospital extends Hospital {
  specialtyTag: string;
  distance: string;
  discountBadge: string;
  nextAvailableSlot: string;
  logoBg: string;
  logoColor: string;
  logoInitials: string;
  opFee: number;
  area: string;
}

export interface SearchableMedicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: string;
  deliveryTime: string;
  dosage: string;
}

export interface OrderRecord {
  id: string;
  category: 'MEDICINE' | 'OP' | 'HOME' | 'CONSULT';
  title: string;
  subtitle: string;
  meta: string;
  status: 'Confirmed' | 'Dispatched' | 'Delivered' | 'Assigned' | 'Scheduled' | 'Completed';
  isActive: boolean;
  dateOrTime: string;
  price?: string;
  actionText: string;
  doctorName?: string;
  hospitalName?: string;
  itemsSummary?: string;
  reportData?: {
    patientName?: string;
    patientAgeGender?: string;
    uhid?: string;
    doctorName?: string;
    doctorSpecialty?: string;
    hospitalName?: string;
    roomOrDesk?: string;
    tokenNumber?: string;
    queueAhead?: string;
    estimatedWait?: string;
    diagnosis?: string;
    symptoms?: string;
    medicines?: Array<{ name: string; dosage: string; frequency: string; duration: string; price?: number }>;
    testsConducted?: Array<{ name: string; result: string; normalRange: string; status: 'Normal' | 'Attention' }>;
    vitals?: { bp?: string; pulse?: string; temp?: string; spo2?: string; rbs?: string };
    riderName?: string;
    riderPhone?: string;
    pharmacyName?: string;
    deliveryAddress?: string;
    nurseName?: string;
    nurseRole?: string;
    paymentMode?: string;
    subtotal?: string;
    deliveryFee?: string;
    totalPaid?: string;
    doctorAdvice?: string;
    followUpDate?: string;
    clinicalNotes?: string;
  };
}

export interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  bgColor: string;
  iconColor: string;
  type: 'OP' | 'CONSULT' | 'HOME' | 'MEDICINE';
}

export type NotificationType = 'OP' | 'MEDICINE' | 'HOME' | 'CONSULT';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  subtitle: string;
  meta: string;
  status: 'Confirmed' | 'Dispatched' | 'Assigned' | 'Scheduled' | 'Completed';
  time: string;
}

export interface PromoBanner {
  id: string;
  tag: string;
  title: string;
  description: string;
  ctaText: string;
  bgColor: string;
  textColor: string;
  tagBgColor: string;
  image: ImageSourcePropType;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export type BottomNavTab = 'Home' | 'Orders' | 'Profile';

export interface HomeScreenProps {
  onNavigateToOPBooking?: (selectedHospital?: Hospital) => void;
  onNavigateToHomeVisits?: () => void;
  onClose?: () => void;
}

// ==========================================
// 2. MOCK DATASETS (TAILORED FOR HYDERABAD)
// ==========================================

const MOCK_USER: UserProfile = {
  name: 'Tejaswani',
  age: 27,
  gender: 'Female',
  phone: '+91 9666994727',
  email: 'tejaswani.k@gmail.com',
  memberId: 'OB-882194',
  bloodGroup: 'AB+ Positive',
  address: 'Plot 42, Silicon Valley, Madhapur, Hyderabad',
  emergencyContact: '+91 9876543210 (Family)',
};

export const HYDERABAD_HOSPITALS: SearchableHospital[] = [
  {
    id: 'hyd-1',
    name: 'Apollo Hospitals',
    branch: 'Jubilee Hills, Hyderabad',
    area: 'Jubilee Hills, Road No. 72, Film Nagar, Hyderabad',
    address: 'Road No. 72, Opp. Bharatiya Vidya Bhavan, Jubilee Hills',
    rating: 4.9,
    departments: ['Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'General Medicine', 'Dermatology'],
    specialtyTag: 'Cardiology • Orthopedics • 24/7 OP Available',
    distance: '2.5 km away',
    discountBadge: 'Flat 20% OFF on OP Booking',
    nextAvailableSlot: 'Today at 04:30 PM',
    logoBg: '#F7FEE7',
    logoColor: '#65A30D',
    logoInitials: 'AP',
    opFee: 850,
  },
  {
    id: 'hyd-2',
    name: 'Yashoda Hospitals',
    branch: 'HITECH City / Madhapur, Hyderabad',
    area: 'HITECH City, Madhapur, Gachibowli, Kondapur, Jubilee Hills, Hyderabad',
    address: 'Survey No. 64, Hitec City Main Rd, Near Mindspace, Madhapur',
    rating: 4.9,
    departments: ['Oncology', 'Cardiology', 'Orthopedics', 'Neurology', 'Pulmonology', 'General Medicine'],
    specialtyTag: 'Tertiary Care • Express OP Token • 24/7 Open',
    distance: '1.4 km away',
    discountBadge: 'Flat 25% OFF on OP Booking',
    nextAvailableSlot: 'Today at 04:00 PM',
    logoBg: '#FFFBEB',
    logoColor: '#D97706',
    logoInitials: 'YS',
    opFee: 800,
  },
  {
    id: 'hyd-3',
    name: 'Care Hospitals',
    branch: 'Banjara Hills, Hyderabad',
    area: 'Banjara Hills, Road No. 1, Somajiguda, Panjagutta, Hyderabad',
    address: 'Road No. 1, Prem Nagar, Banjara Hills',
    rating: 4.8,
    departments: ['Cardiology', 'Neurology', 'Gastroenterology', 'General Medicine', 'Nephrology', 'Orthopedics'],
    specialtyTag: 'Super-Specialty • Instant Token • OP Available',
    distance: '3.8 km away',
    discountBadge: 'One Buddy Special: 15% OFF',
    nextAvailableSlot: 'Today at 05:15 PM',
    logoBg: '#FEF2F2',
    logoColor: '#DC2626',
    logoInitials: 'CR',
    opFee: 750,
  },
  {
    id: 'hyd-4',
    name: 'Continental Hospitals',
    branch: 'Gachibowli Financial District, Hyderabad',
    area: 'Gachibowli, Nanakramguda, Financial District, Madhapur, Hyderabad',
    address: 'Plot No. 3, Road No. 2, IT & Financial District, Nanakramguda',
    rating: 4.8,
    departments: ['Cardiology', 'Gastroenterology', 'Orthopedics', 'Neurology', 'General Medicine', 'Pediatrics'],
    specialtyTag: 'JCI & NABH Accredited • Instant Token',
    distance: '4.2 km away',
    discountBadge: 'Up to 20% OFF on OP Booking',
    nextAvailableSlot: 'Today at 06:30 PM',
    logoBg: '#EEF2FF',
    logoColor: '#4F46E5',
    logoInitials: 'CT',
    opFee: 800,
  },
  {
    id: 'hyd-5',
    name: 'KIMS Hospitals',
    branch: 'Secunderabad, Hyderabad',
    area: 'Minister Road, Secunderabad, Begumpet, Hyderabad',
    address: '1-8-31/1, Minister Road, Krishna Nagar Colony, Secunderabad',
    rating: 4.7,
    departments: ['Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'ENT', 'General Medicine'],
    specialtyTag: 'Multi-Specialty • Leading Care • OP Available',
    distance: '7.5 km away',
    discountBadge: 'Flat ₹150 OFF on Token',
    nextAvailableSlot: 'Tomorrow at 10:00 AM',
    logoBg: '#ECFDF5',
    logoColor: '#059669',
    logoInitials: 'KM',
    opFee: 700,
  },
  {
    id: 'hyd-6',
    name: 'AIG Hospitals',
    branch: 'Gachibowli / Mindspace, Hyderabad',
    area: 'Gachibowli, Mindspace Road, Madhapur, Kondapur, Hyderabad',
    address: '1-66/AIG/1 to 5, Mindspace Road, Gachibowli',
    rating: 4.9,
    departments: ['Gastroenterology', 'Hepatology', 'Cardiology', 'General Medicine', 'Endoscopy', 'Oncology'],
    specialtyTag: 'World-Class Gastroenterology • OP Desk',
    distance: '2.9 km away',
    discountBadge: 'Flat 20% OFF on OP Booking',
    nextAvailableSlot: 'Today at 05:45 PM',
    logoBg: '#F5F3FF',
    logoColor: '#7C3AED',
    logoInitials: 'AIG',
    opFee: 900,
  },
  {
    id: 'hyd-7',
    name: 'Rainbow Children’s Hospital',
    branch: 'Banjara Hills & Kondapur, Hyderabad',
    area: 'Banjara Hills, Kondapur, Madhapur, Hyderabad',
    address: 'Road No. 2, Banjara Hills / Botanical Garden Rd, Kondapur',
    rating: 4.9,
    departments: ['Pediatrics', 'Neonatology', 'Child Care', 'Dermatology', 'Vaccinations', 'General Medicine'],
    specialtyTag: 'Premier Pediatric Care • Instant Token',
    distance: '3.2 km away',
    discountBadge: 'Flat 20% OFF on Child OP',
    nextAvailableSlot: 'Today at 04:15 PM',
    logoBg: '#FDF2F8',
    logoColor: '#DB2777',
    logoInitials: 'RB',
    opFee: 750,
  },
  {
    id: 'hyd-8',
    name: 'Yashoda Hospitals',
    branch: 'Somajiguda, Hyderabad',
    area: 'Somajiguda, Raj Bhavan Road, Panjagutta, Begumpet, Hyderabad',
    address: 'Alexander Rd, Raj Bhavan Rd, Matha Nagar, Somajiguda',
    rating: 4.8,
    departments: ['Cardiology', 'Neurology', 'Orthopedics', 'General Medicine', 'Nephrology', 'Dermatology'],
    specialtyTag: 'Comprehensive Care • 24/7 OP Services',
    distance: '5.8 km away',
    discountBadge: 'Flat 20% OFF on OP Booking',
    nextAvailableSlot: 'Tomorrow at 09:30 AM',
    logoBg: '#FFFBEB',
    logoColor: '#D97706',
    logoInitials: 'YS',
    opFee: 800,
  },
];

const CATEGORIES: CategoryItem[] = [
  {
    id: '1',
    title: 'OP Booking',
    subtitle: 'Hospitals in Hyderabad',
    badge: 'Instant Token',
    icon: Calendar,
    bgColor: '#F7FEE7',
    iconColor: '#65A30D',
    type: 'OP',
  },
  {
    id: '2',
    title: 'Online Consultation',
    subtitle: 'Top Hyderabad Doctors',
    badge: 'In 5 Mins',
    icon: Video,
    bgColor: '#F5F3FF',
    iconColor: '#7C3AED',
    type: 'CONSULT',
  },
  {
    id: '3',
    title: 'Home Visits',
    subtitle: 'Doorstep Lab Tests & Nurse',
    badge: 'Doorstep',
    icon: HomeIcon,
    bgColor: '#ECFDF5',
    iconColor: '#059669',
    type: 'HOME',
  },
  {
    id: '4',
    title: 'Medicine Delivery',
    subtitle: 'Express 2-Hr Delivery',
    badge: 'Flat 20% Off',
    icon: Pill,
    bgColor: '#FFFBEB',
    iconColor: '#D97706',
    type: 'MEDICINE',
  },
];

const PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'b1',
    tag: 'HYDERABAD SPECIAL',
    title: 'Executive Health Check Package',
    description: '64 Essential parameters + Free Physician Consult at Apollo & Yashoda',
    ctaText: 'Book @ ₹899',
    bgColor: '#1E293B',
    textColor: '#FFFFFF',
    tagBgColor: '#65A30D',
    image: require('../assets/banners/health_checkup_banner.jpg'),
  },
  {
    id: 'b2',
    tag: 'EXPRESS DELIVERY • 30 MINS',
    title: 'Prescription Medicines Delivered Free',
    description: 'Flat 20% OFF on all prescription & OTC medicines in Hyderabad',
    ctaText: 'Order Medicines',
    bgColor: '#1E3A8A',
    textColor: '#FFFFFF',
    tagBgColor: '#3B82F6',
    image: require('../assets/banners/medicine_delivery_banner.jpg'),
  },
  {
    id: 'b3',
    tag: 'CARDIAC & SPECIALIST DESK',
    title: 'Top Cardiologists & Orthopedicians Today',
    description: 'Real-time queue tracking & direct OPD token confirmation',
    ctaText: 'View Specialists',
    bgColor: '#831843',
    textColor: '#FFFFFF',
    tagBgColor: '#EC4899',
    image: require('../assets/banners/cardiac_health_banner.jpg'),
  },
  {
    id: 'b4',
    tag: 'ONE BUDDY CARE+ PASS',
    title: 'Flat 20% Off All Hospital OP Bookings',
    description: 'Plus Unlimited Free Medicine Deliveries & priority concierge',
    ctaText: 'Activate @ ₹199/mo',
    bgColor: '#1E1B4B',
    textColor: '#FFFFFF',
    tagBgColor: '#6366F1',
    image: require('../assets/banners/health_checkup_banner.jpg'),
  },
];

export const HYDERABAD_MEDICINES: SearchableMedicine[] = [
  {
    id: 'med-1',
    name: 'Dolo 650mg Tablet',
    genericName: 'Paracetamol (650mg)',
    category: 'Fever & Pain Relief',
    price: 30,
    originalPrice: 38,
    discount: '20% OFF',
    deliveryTime: '25 mins express',
    dosage: '15 Tablets Strip',
  },
  {
    id: 'med-2',
    name: 'Augmentin 625 Duo Tablet',
    genericName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
    category: 'Antibiotic Care',
    price: 172,
    originalPrice: 205,
    discount: '16% OFF',
    deliveryTime: '45 mins express',
    dosage: '10 Tablets Strip',
  },
  {
    id: 'med-3',
    name: 'Pan-D Capsule',
    genericName: 'Pantoprazole (40mg) + Domperidone (30mg)',
    category: 'Acidity & Gastro Care',
    price: 142,
    originalPrice: 180,
    discount: '21% OFF',
    deliveryTime: '30 mins express',
    dosage: '15 Capsules Strip',
  },
  {
    id: 'med-4',
    name: 'Shelcal 500 Tablet',
    genericName: 'Calcium (500mg) + Vitamin D3 (250 IU)',
    category: 'Bone & Joint Health',
    price: 110,
    originalPrice: 135,
    discount: '18% OFF',
    deliveryTime: '30 mins express',
    dosage: '15 Tablets Strip',
  },
  {
    id: 'med-5',
    name: 'Allegra 120mg Tablet',
    genericName: 'Fexofenadine Hydrochloride',
    category: 'Allergy & Sinus Care',
    price: 188,
    originalPrice: 235,
    discount: '20% OFF',
    deliveryTime: '45 mins express',
    dosage: '10 Tablets Strip',
  },
  {
    id: 'med-6',
    name: 'Azithral 500mg Tablet',
    genericName: 'Azithromycin (500mg)',
    category: 'Respiratory Health',
    price: 112,
    originalPrice: 140,
    discount: '20% OFF',
    deliveryTime: '60 mins express',
    dosage: '5 Tablets Strip',
  },
  {
    id: 'med-7',
    name: 'Accu-Chek Active 50 Strips',
    genericName: 'Blood Glucose Test Strips',
    category: 'Diabetes Care Device',
    price: 840,
    originalPrice: 1100,
    discount: '24% OFF',
    deliveryTime: '60 mins express',
    dosage: '50 Strips Box',
  },
];

export const ALL_ORDERS_DATA: OrderRecord[] = [
  // ── 1. OP BOOKING (ACTIVE & COMPLETED) ───────────────────────────
  {
    id: 'ord-op-1',
    category: 'OP',
    title: 'Yashoda Hospitals OPD • Token #14',
    subtitle: 'Dr. Ananya Iyer • Consultant Dermatologist',
    meta: 'Token #14 • OPD Room #204 • Queue: Token #13 in room (~8 mins wait)',
    status: 'Confirmed',
    isActive: true,
    dateOrTime: 'Today at 04:30 PM',
    price: '₹650',
    actionText: 'View E-Token & Report',
    hospitalName: 'Yashoda Hospitals - HITECH City',
    doctorName: 'Dr. Ananya Iyer',
    reportData: {
      patientName: 'Tejaswani',
      patientAgeGender: '27 Yrs / Female',
      uhid: 'YHD-884920',
      hospitalName: 'Yashoda Hospitals - HITECH City, Hyderabad',
      doctorName: 'Dr. Ananya Iyer, MD (Dermatology, Venereology & Leprosy)',
      doctorSpecialty: 'Dermatology & Skin Care OPD',
      roomOrDesk: 'OPD Room #204 (Block A, 2nd Floor)',
      tokenNumber: '#14',
      queueAhead: '1 patient ahead in queue',
      estimatedWait: '~8 mins wait',
      paymentMode: 'Online Pre-paid (UPI)',
      subtotal: '₹650',
      totalPaid: '₹650',
      doctorAdvice: 'Please bring previous prescription and any ongoing topical ointments.',
    },
  },
  {
    id: 'ord-op-2',
    category: 'OP',
    title: 'Apollo Hospitals OPD • Token #08',
    subtitle: 'Dr. Rajesh Sharma • Senior General Physician',
    meta: 'Consultation Completed • OP Desk #3 Jubilee Hills',
    status: 'Completed',
    isActive: false,
    dateOrTime: '14 Sep 2026, 11:00 AM',
    price: '₹850',
    actionText: 'View OPD Report',
    hospitalName: 'Apollo Hospitals - Jubilee Hills',
    doctorName: 'Dr. Rajesh Sharma',
    reportData: {
      patientName: 'Tejaswani',
      patientAgeGender: '27 Yrs / Female',
      uhid: 'APL-552190',
      hospitalName: 'Apollo Hospitals - Jubilee Hills, Hyderabad',
      doctorName: 'Dr. Rajesh Sharma, MBBS, MD (Internal Medicine)',
      doctorSpecialty: 'General Medicine OPD',
      roomOrDesk: 'OP Desk #3 (Main Atrium, 1st Floor)',
      tokenNumber: '#08',
      queueAhead: 'Completed',
      estimatedWait: '0 mins',
      diagnosis: 'Mild seasonal pharyngitis & allergic rhinitis',
      paymentMode: 'Card Payment (Verified)',
      subtotal: '₹850',
      totalPaid: '₹850',
      doctorAdvice: 'Hydration advised. Prescribed anti-histamine for 3 days.',
      followUpDate: 'Routine review after 7 days if needed',
    },
  },

  // ── 2. MEDICINE DELIVERY (ACTIVE & COMPLETED) ─────────────────────
  {
    id: 'ord-med-1',
    category: 'MEDICINE',
    title: 'Order #OB-MED-9402 • Express 2-Hr',
    subtitle: 'Dolo 650mg (x2), Augmentin 625mg (x1), Pantocid 40mg (x1)',
    meta: 'Rider David Kumar is en route (Live ETA: 20 mins to Madhapur)',
    status: 'Dispatched',
    isActive: true,
    dateOrTime: 'Today at 01:45 PM',
    price: '₹342',
    actionText: 'Track & View Invoice',
    itemsSummary: '3 items • Apollo Pharmacy Madhapur Hub',
    reportData: {
      patientName: 'Tejaswani',
      deliveryAddress: 'Plot 42, Silicon Valley, Madhapur, Hyderabad - 500081',
      riderName: 'David Kumar',
      riderPhone: '+91 98765 43299',
      pharmacyName: 'OneBuddy Express Pharmacy - Madhapur Hub',
      medicines: [
        { name: 'Dolo 650mg Paracetamol Tablets', dosage: 'Strip of 15', frequency: 'TDS (As needed)', duration: '2 strips', price: 60 },
        { name: 'Augmentin 625mg Duo Tablets', dosage: 'Strip of 10', frequency: 'BD (After food)', duration: '1 strip', price: 198 },
        { name: 'Pantocid 40mg Gastro-Resistant', dosage: 'Strip of 10', frequency: 'OD (Before breakfast)', duration: '1 strip', price: 84 },
      ],
      paymentMode: 'Pre-paid (UPI)',
      subtotal: '₹342',
      deliveryFee: '₹0 (Free Express)',
      totalPaid: '₹342',
      clinicalNotes: 'Verified by Registered Pharmacist Ramesh Rao (Reg #AP-77821). Keep medicines in a cool, dry place away from sunlight.',
    },
  },
  {
    id: 'ord-med-2',
    category: 'MEDICINE',
    title: 'Order #OB-MED-8819 • Refill Pack',
    subtitle: 'Shelcal 500 (Calcium) & Vitamin D3 60K (x2)',
    meta: 'Delivered to Plot 42, Silicon Valley, Madhapur',
    status: 'Delivered',
    isActive: false,
    dateOrTime: '11 Sep 2026, 04:30 PM',
    price: '₹310',
    actionText: 'View Invoice & Re-Order',
    itemsSummary: 'Delivered via OneBuddy Express',
    reportData: {
      patientName: 'Tejaswani',
      deliveryAddress: 'Plot 42, Silicon Valley, Madhapur, Hyderabad - 500081',
      riderName: 'Vikram Singh',
      riderPhone: '+91 98765 43110',
      pharmacyName: 'OneBuddy Central Pharmacy, Hyderabad',
      medicines: [
        { name: 'Shelcal 500 Calcium + Vitamin D3', dosage: 'Bottle of 30', frequency: 'OD (After dinner)', duration: '1 pack', price: 168 },
        { name: 'Vitamin D3 60K Chewable Tablets', dosage: 'Strip of 4', frequency: 'Weekly once', duration: '2 strips', price: 142 },
      ],
      paymentMode: 'Net Banking (Completed)',
      subtotal: '₹310',
      deliveryFee: '₹0',
      totalPaid: '₹310',
      clinicalNotes: 'Delivered and verified. Digital tax invoice generated for health claims.',
    },
  },

  // ── 3. ONLINE CONSULTATION (ACTIVE & COMPLETED) ───────────────────
  {
    id: 'ord-consult-1',
    category: 'CONSULT',
    title: 'Tele-Consultation: Dr. Vikramaditya Sen',
    subtitle: 'Senior Interventional Cardiologist • Video Call',
    meta: 'Scheduled for Today at 05:00 PM • Video Room Link Ready',
    status: 'Scheduled',
    isActive: true,
    dateOrTime: 'Today at 05:00 PM',
    price: '₹899',
    actionText: '',
    doctorName: 'Dr. Vikramaditya Sen',
    reportData: {
      patientName: 'Tejaswani',
      patientAgeGender: '27 Yrs / Female',
      doctorName: 'Dr. Vikramaditya Sen, MBBS, MD, DM (Cardiology), FACC',
      doctorSpecialty: 'Senior Interventional Cardiologist',
      hospitalName: 'Care Hospitals, Hyderabad',
      symptoms: 'Mild palpitation during exercise, routine BP review',
      paymentMode: 'Online Pre-paid (Verified)',
      subtotal: '₹899',
      totalPaid: '₹899',
      doctorAdvice: 'Please ensure quiet environment and camera access 5 minutes prior to 05:00 PM.',
      followUpDate: 'Today at 05:00 PM',
    },
  },
  {
    id: 'ord-consult-2',
    category: 'CONSULT',
    title: 'Tele-Consultation: Dr. Rajesh Sharma',
    subtitle: 'Senior General Physician • Video Call Completed',
    meta: 'Digital Rx-Prescription Issued • Follow-up in 3 Days',
    status: 'Completed',
    isActive: false,
    dateOrTime: '15 Sep 2026, 10:15 AM',
    price: '₹499',
    actionText: 'Download Prescription',
    doctorName: 'Dr. Rajesh Sharma',
    reportData: {
      patientName: 'Tejaswani',
      patientAgeGender: '27 Yrs / Female',
      uhid: 'TEL-881942',
      doctorName: 'Dr. Rajesh Sharma, MBBS, MD (Internal Medicine)',
      doctorSpecialty: 'Senior General Physician (Reg #TSMC-44812)',
      hospitalName: 'Apollo Multi-Specialty Hospital, Hyderabad',
      diagnosis: 'Acute Viral Rhinopharyngitis with Moderate Pyrexia',
      symptoms: 'Fever (101°F), Body aches, Sore throat for 2 days',
      medicines: [
        { name: 'Tab. Dolo 650mg (Paracetamol)', dosage: '650mg', frequency: '1 tab thrice daily after meals', duration: '3 days' },
        { name: 'Tab. Azithromycin 500mg', dosage: '500mg', frequency: '1 tab once daily after dinner', duration: '3 days' },
        { name: 'Tab. Pantocid 40mg', dosage: '40mg', frequency: '1 tab once daily 30m before breakfast', duration: '5 days' },
      ],
      paymentMode: 'UPI Pre-paid',
      subtotal: '₹499',
      totalPaid: '₹499',
      doctorAdvice: 'Adequate rest for 48 hours. Warm saline gargles twice daily. Keep hydrated with ORS and warm water.',
      followUpDate: 'Review after 3 days if fever persists above 100°F',
      clinicalNotes: 'Electronically signed by Dr. Rajesh Sharma with valid medical registration seal.',
    },
  },

  // ── 4. HOME VISITS (ACTIVE & COMPLETED) ───────────────────────────
  {
    id: 'ord-home-1',
    category: 'HOME',
    title: 'Home Nursing Care & Vital Check',
    subtitle: 'Nurse Sunita Rao • Senior Home Nursing Specialist',
    meta: 'Scheduled for Tomorrow at 07:30 AM in Madhapur',
    status: 'Assigned',
    isActive: true,
    dateOrTime: 'Tomorrow at 07:30 AM',
    price: '₹600',
    actionText: 'View Care Schedule',
    itemsSummary: 'Vital check, sterile wound dressing & clinical observation',
    reportData: {
      patientName: 'Tejaswani',
      patientAgeGender: '27 Yrs / Female',
      deliveryAddress: 'Plot 42, Silicon Valley, Madhapur, Hyderabad',
      nurseName: 'Nurse Sunita Rao (B.Sc Nursing, 12 Yrs Experience)',
      nurseRole: 'Senior Home Nursing Specialist (Apollo Home Care)',
      paymentMode: 'Online Pre-paid',
      subtotal: '₹600',
      totalPaid: '₹600',
      doctorAdvice: 'Nurse will arrive with single-use sterile dressing pack and digital vitals monitor.',
      clinicalNotes: 'Scheduled home nursing session. Patient notified via SMS with nurse live contact.',
    },
  },
  {
    id: 'ord-home-2',
    category: 'HOME',
    title: 'Home Diagnostic: Lipid Profile & Fasting Sugar',
    subtitle: 'Phlebotomist: Nurse Rajesh Verma (KIMS Home Health)',
    meta: 'Sample Collected & Processed • Certified Report Synced',
    status: 'Completed',
    isActive: false,
    dateOrTime: '12 Sep 2026, 07:15 AM',
    price: '₹699',
    actionText: 'View Lab Report',
    itemsSummary: 'Fasting Blood Glucose, Total Cholesterol, HDL, LDL, Triglycerides',
    reportData: {
      patientName: 'Tejaswani',
      patientAgeGender: '27 Yrs / Female',
      uhid: 'LAB-774019',
      nurseName: 'Nurse Rajesh Verma (Phlebotomist)',
      hospitalName: 'KIMS Central Laboratory & Diagnostic Hub, Hyderabad',
      vitals: {
        bp: '120/80 mmHg',
        pulse: '72 bpm',
        temp: '98.4°F',
        spo2: '99%',
        rbs: '94 mg/dL',
      },
      testsConducted: [
        { name: 'Fasting Blood Glucose (FBS)', result: '94 mg/dL', normalRange: '70 - 99 mg/dL', status: 'Normal' },
        { name: 'HbA1c (Glycosylated Hemoglobin)', result: '5.4%', normalRange: '< 5.7%', status: 'Normal' },
        { name: 'Total Cholesterol', result: '176 mg/dL', normalRange: '< 200 mg/dL', status: 'Normal' },
        { name: 'HDL Cholesterol (Good)', result: '56 mg/dL', normalRange: '> 50 mg/dL', status: 'Normal' },
        { name: 'LDL Cholesterol', result: '98 mg/dL', normalRange: '< 100 mg/dL', status: 'Normal' },
        { name: 'Serum Triglycerides', result: '112 mg/dL', normalRange: '< 150 mg/dL', status: 'Normal' },
      ],
      paymentMode: 'Online Paid (UPI)',
      subtotal: '₹699',
      totalPaid: '₹699',
      clinicalNotes: 'Sample collected with sterile EDTA vacutainer at home. All parameters within optimal healthy limits.',
    },
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'OP',
    title: 'Dr. Ananya Iyer (Dermatology OPD)',
    subtitle: 'Yashoda Hospitals - HITECH City',
    meta: 'Token #14 • Live: Dr. Iyer is seeing Token #13 (Est. wait: ~8 mins)',
    status: 'Confirmed',
    time: '10m ago',
  },
  {
    id: 'notif-2',
    type: 'MEDICINE',
    title: 'Order #OB-MED-9402 Dispatched',
    subtitle: 'Dolo 650mg, Augmentin 625mg, Pantocid (3 items)',
    meta: 'Rider: David Kumar (Live ETA: 20 mins in Madhapur)',
    status: 'Dispatched',
    time: '25m ago',
  },
  {
    id: 'notif-3',
    type: 'HOME',
    title: 'Home Nurse Scheduled Tomorrow',
    subtitle: 'Nurse Sunita Rao (Apollo Home Care)',
    meta: 'Arrival Window: 07:30 AM - 08:00 AM • Madhapur Address',
    status: 'Assigned',
    time: '1h ago',
  },
  {
    id: 'notif-4',
    type: 'CONSULT',
    title: 'Tele-Consultation Confirmed',
    subtitle: 'Dr. Vikramaditya Sen (Senior Cardiologist)',
    meta: 'Video Call Scheduled for Today at 05:00 PM',
    status: 'Scheduled',
    time: '2h ago',
  },
  {
    id: 'notif-5',
    type: 'MEDICINE',
    title: 'Prescription Verified by Pharmacist',
    subtitle: 'OneBuddy Express Pharmacy - Madhapur Hub',
    meta: 'Pharmacist Ramesh Rao approved your prescription',
    status: 'Confirmed',
    time: '3h ago',
  },
  {
    id: 'notif-6',
    type: 'OP',
    title: 'Hospital E-Token Generated',
    subtitle: 'Apollo Hospitals - Jubilee Hills',
    meta: 'Token #08 with Dr. Rajesh Sharma completed',
    status: 'Completed',
    time: 'Yesterday',
  },
  {
    id: 'notif-7',
    type: 'HOME',
    title: 'Home Lab Results Available',
    subtitle: 'Lipid Profile & Fasting Blood Sugar Test',
    meta: 'Certified digital diagnostic report synced to Medical Vault',
    status: 'Completed',
    time: '2 days ago',
  },
  {
    id: 'notif-8',
    type: 'CONSULT',
    title: 'Prescription Ready for Download',
    subtitle: 'Dr. Rajesh Sharma (General Physician)',
    meta: 'Follow-up consultation prescription signed digitally',
    status: 'Completed',
    time: '3 days ago',
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How do I book an in-person hospital OP token in Hyderabad?',
    answer:
      'Search for your preferred hospital (e.g. Apollo Jubilee Hills, Yashoda HITECH City, Care Banjara Hills) on the Home Screen, select the doctor and slot, and confirm to generate an instant digital e-token.',
  },
  {
    id: 'faq-2',
    question: 'How quickly will medicine orders be delivered in Hyderabad?',
    answer:
      'Most express prescription orders in Hyderabad (Madhapur, Gachibowli, Jubilee Hills, Banjara Hills, Kondapur, Secunderabad) are delivered within 60 to 120 minutes.',
  },
  {
    id: 'faq-3',
    question: 'How does Home Visit sample collection work?',
    answer:
      'A certified phlebotomist visits your Hyderabad address with sterile single-use kits. Digital lab reports are synced directly to your One Buddy app.',
  },
  {
    id: 'faq-4',
    question: 'What is the refund and cancellation policy?',
    answer:
      'You can cancel tele-consultations or OP appointments up to 2 hours before the scheduled appointment window for a full refund.',
  },
];

const HYDERABAD_SEARCH_SUGGESTIONS = [
  'Apollo Jubilee Hills',
  'Dolo 650',
  'Yashoda Hospitals',
  'Paracetamol',
  'Augmentin 625',
  'Cardiology OP',
  'Madhapur',
  'Pan-D Capsule',
  'Shelcal 500',
  'Care Banjara Hills',
  'AIG Gachibowli',
  'Accu-Chek',
];

// ==========================================
// 3. SUB-COMPONENTS
// ==========================================

// --- Header Bar ---
interface HeaderBarProps {
  location: string;
  activeCount: number;
  topInset: number;
  onPressLocation: () => void;
  onPressNotifications: () => void;
  onClose?: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  location,
  activeCount,
  topInset,
  onPressLocation,
  onPressNotifications,
  onClose,
}) => {
  const { scheme } = useAppTheme();
  const isDark = scheme === 'dark';

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(topInset, Platform.OS === 'android' ? 8 : 12) }]}>
      <View style={styles.headerLeft}>
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={{ marginRight: 6, padding: 4 }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color={isDark ? '#F1F5F9' : '#1E293B'} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.headerLogoWrap}
          onPress={onClose || undefined}
          activeOpacity={onClose ? 0.7 : 1}
        >
          <HospitalOpLogo width={26} height={44} />
        </TouchableOpacity>

        <View style={styles.headerLeftInfo}>
          <View style={styles.brandingBlock}>
            <Text style={styles.brandTitle}>
              One <Text style={styles.brandTitleHighlight}>Buddy</Text>
            </Text>
            <Text style={styles.brandSubtitle}>HEALTHCARE • HYDERABAD</Text>
          </View>

          <TouchableOpacity
            style={styles.locationSelector}
            onPress={onPressLocation}
            activeOpacity={0.7}
          >
            <View style={styles.locationIconWrap}>
              <MapPin size={13} color="#62BA00" />
            </View>
            <Text style={styles.locationText} numberOfLines={1}>
              {location.length > 32 ? location.slice(0, 30) + ' (...' : location + ' (...'}
            </Text>
            <View style={styles.headerLiveDot} />
            <Text style={styles.locationChevron}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={onPressNotifications}
          activeOpacity={0.7}
        >
          <Bell size={22} color={isDark ? '#F1F5F9' : '#1E293B'} />
          {activeCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {activeCount > 9 ? '9+' : activeCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Location Picker & Live GPS Modal ---
interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  currentLocation: string;
  onSelectLocation: (loc: string) => void;
  onDetectLiveGPS: () => void;
  onOpenEditAddress?: () => void;
  isDetecting: boolean;
}

const HYDERABAD_LOCALITIES = [
  { id: 'loc-1', name: 'Madhapur', sub: 'HITECH City, Cyber Towers, Silicon Valley', distance: '0.0 km (Current Area)' },
  { id: 'loc-2', name: 'Jubilee Hills', sub: 'Road No. 72, Film Nagar, Opp. Apollo Hospitals', distance: '2.5 km away' },
  { id: 'loc-3', name: 'Banjara Hills', sub: 'Road No. 1, Care Hospital Zone, Somajiguda', distance: '3.8 km away' },
  { id: 'loc-4', name: 'Gachibowli', sub: 'Financial District, Nanakramguda, Mindspace', distance: '4.2 km away' },
  { id: 'loc-5', name: 'HITECH City', sub: 'Near Mindspace, Cyberabad, Madhapur', distance: '1.4 km away' },
  { id: 'loc-6', name: 'Kondapur', sub: 'Botanical Garden Rd, Near Rainbow Children\'s', distance: '3.1 km away' },
  { id: 'loc-7', name: 'Secunderabad', sub: 'Minister Road, Begumpet, KIMS Zone', distance: '7.5 km away' },
  { id: 'loc-8', name: 'Somajiguda', sub: 'Panjagutta, Raj Bhavan Road, Yashoda Zone', distance: '5.2 km away' },
  { id: 'loc-9', name: 'Kukatpally', sub: 'KPHB Colony, JNTU Road, Forum Mall Zone', distance: '6.0 km away' },
  { id: 'loc-10', name: 'Miyapur', sub: 'Allwyn X Roads, Hafeezpet corridor', distance: '7.8 km away' },
];

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  currentLocation,
  onSelectLocation,
  onDetectLiveGPS,
  onOpenEditAddress,
  isDetecting,
}) => {
  const insets = useSafeAreaInsets();
  const [filterQuery, setFilterQuery] = useState<string>('');

  const filtered = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return HYDERABAD_LOCALITIES;
    return HYDERABAD_LOCALITIES.filter(
      (l) => l.name.toLowerCase().includes(q) || l.sub.toLowerCase().includes(q)
    );
  }, [filterQuery]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.locationModalCard, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Choose Service Location</Text>
              <Text style={styles.modalSubtitle}>Serving all hospital zones across Hyderabad</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Primary Live GPS Detection Button */}
          <View style={styles.liveGpsActionWrap}>
            <TouchableOpacity
              style={styles.detectLiveGpsBtn}
              onPress={onDetectLiveGPS}
              activeOpacity={0.85}
              disabled={isDetecting}
            >
              <View style={styles.detectLiveGpsLeft}>
                <View style={styles.gpsPulseIconWrap}>
                  <LocateFixed size={20} color="#65A30D" />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <View style={styles.liveGpsTitleRow}>
                    <Text style={styles.detectLiveGpsTitle}>Use Current Live GPS Location</Text>
                    <View style={styles.liveBadgeSmall}>
                      <View style={styles.liveGreenDot} />
                      <Text style={styles.liveBadgeSmallText}>Live</Text>
                    </View>
                  </View>
                  <Text style={styles.detectLiveGpsSub}>
                    {isDetecting
                      ? 'Fetching high-precision GPS coordinates...'
                      : 'Auto-detect exact locality & nearest hospitals'}
                  </Text>
                </View>
              </View>

              {isDetecting ? (
                <RefreshCw size={18} color="#65A30D" />
              ) : (
                <ChevronRight size={18} color="#65A30D" />
              )}
            </TouchableOpacity>

            {/* Quick Button to Enter Custom Detailed House/Street Address */}
            {onOpenEditAddress && (
              <TouchableOpacity
                style={styles.customAddressQuickBtn}
                onPress={() => {
                  onClose();
                  onOpenEditAddress();
                }}
                activeOpacity={0.85}
              >
                <View style={styles.customAddressLeft}>
                  <View style={styles.customAddressIconWrap}>
                    <Edit3 size={16} color="#65A30D" />
                  </View>
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.customAddressTitle}>Enter Custom Address / House No.</Text>
                    <Text style={styles.customAddressSub}>Edit flat, street, landmark & pin code</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#65A30D" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Area Input */}
          <View style={styles.locSearchInputWrap}>
            <Search size={16} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.locSearchInput}
              placeholder="Search area, road or locality in Hyderabad..."
              placeholderTextColor="#94A3B8"
              value={filterQuery}
              onChangeText={setFilterQuery}
            />
            {filterQuery.length > 0 && (
              <TouchableOpacity onPress={() => setFilterQuery('')}>
                <X size={15} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Localities List */}
          <ScrollView
            style={styles.locListScroll}
            contentContainerStyle={styles.locListContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.locSectionHeading}>Popular Hyderabad Localities</Text>

            {filtered.map((item) => {
              const isSelected = currentLocation.toLowerCase().includes(item.name.toLowerCase());
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.locItemCard, isSelected && styles.locItemCardSelected]}
                  onPress={() => {
                    onSelectLocation(`${item.name}, Hyderabad, Telangana`);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.locItemLeft}>
                    <View style={[styles.locPinWrap, isSelected && styles.locPinWrapSelected]}>
                      <MapPin size={16} color={isSelected ? '#65A30D' : '#64748B'} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.locItemName, isSelected && styles.locItemNameSelected]}>
                        {item.name}
                      </Text>
                      <Text style={styles.locItemSub}>{item.sub}</Text>
                    </View>
                  </View>

                  <View style={styles.locItemRight}>
                    <Text style={styles.locDistanceText}>{item.distance}</Text>
                    {isSelected ? (
                      <Check size={16} color="#65A30D" style={{ marginTop: 2 }} />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// --- Detailed Edit Address Modal ---
interface EditAddressModalProps {
  visible: boolean;
  onClose: () => void;
  currentAddress: string;
  onSaveAddress: (newAddress: string) => void;
  onDetectLiveGPS?: () => void;
}

const ADDRESS_TAGS: Array<'Home' | 'Work' | 'Other'> = ['Home', 'Work', 'Other'];

const EditAddressModal: React.FC<EditAddressModalProps> = ({
  visible,
  onClose,
  currentAddress,
  onSaveAddress,
  onDetectLiveGPS,
}) => {
  const insets = useSafeAreaInsets();
  const [tag, setTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [flatNo, setFlatNo] = useState<string>('Flat 402, Block B, Green Heights');
  const [street, setStreet] = useState<string>('Road No. 36, Near Metro Pillar 1402');
  const [locality, setLocality] = useState<string>('Madhapur');
  const [city, setCity] = useState<string>('Hyderabad, Telangana');
  const [pincode, setPincode] = useState<string>('500081');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (visible && currentAddress) {
      const parts = currentAddress.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        setLocality(parts[0] || 'Madhapur');
        setCity(parts.slice(1).join(', ') || 'Hyderabad, Telangana');
      }
    }
  }, [visible, currentAddress]);

  const handleSave = () => {
    const newErrors: { [key: string]: string } = {};
    if (!flatNo.trim()) newErrors.flatNo = 'House / Flat number is required';
    if (!locality.trim()) newErrors.locality = 'Area or locality is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const compiledAddress = `${flatNo.trim()}, ${street.trim() ? street.trim() + ', ' : ''}${locality.trim()}, ${city.trim()}${pincode.trim() ? ' - ' + pincode.trim() : ''} (${tag})`;
    onSaveAddress(compiledAddress);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.editAddressModalCard, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Edit Delivery & Service Address</Text>
              <Text style={styles.modalSubtitle}>For medicine delivery, OP passes & home visits</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.editAddressScroll}
            contentContainerStyle={styles.editAddressScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Address Type Tag Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Save Address As</Text>
              <View style={styles.tagSelectRow}>
                {ADDRESS_TAGS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tagChip, tag === t && styles.tagChipActive]}
                    onPress={() => setTag(t)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagChipText, tag === t && styles.tagChipTextActive]}>
                      {t === 'Home' ? '🏠 Home' : t === 'Work' ? '🏢 Work' : '📍 Other'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quick GPS Fill Button */}
            {onDetectLiveGPS && (
              <TouchableOpacity
                style={styles.gpsAutoFillBtn}
                onPress={onDetectLiveGPS}
                activeOpacity={0.8}
              >
                <LocateFixed size={16} color="#65A30D" />
                <Text style={styles.gpsAutoFillText}>Auto-detect Area with Live GPS</Text>
              </TouchableOpacity>
            )}

            {/* Flat / House / Door No */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>House / Flat / Block No. *</Text>
              <View style={[styles.formInputWrap, errors.flatNo ? styles.formInputWrapError : undefined]}>
                <Building2 size={16} color="#64748B" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formInput}
                  value={flatNo}
                  onChangeText={(val) => {
                    setFlatNo(val);
                    if (errors.flatNo) setErrors((prev) => ({ ...prev, flatNo: '' }));
                  }}
                  placeholder="e.g. Flat 402, Block B, Green Heights"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              {errors.flatNo ? <Text style={styles.formErrorText}>{errors.flatNo}</Text> : null}
            </View>

            {/* Street / Landmark */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Street / Road / Landmark</Text>
              <View style={styles.formInputWrap}>
                <MapPin size={16} color="#64748B" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formInput}
                  value={street}
                  onChangeText={setStreet}
                  placeholder="e.g. Road No. 36, Near Apollo Hospital"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Locality & City */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1.2, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Area / Locality *</Text>
                <View style={[styles.formInputWrap, errors.locality ? styles.formInputWrapError : undefined]}>
                  <TextInput
                    style={styles.formInput}
                    value={locality}
                    onChangeText={(val) => {
                      setLocality(val);
                      if (errors.locality) setErrors((prev) => ({ ...prev, locality: '' }));
                    }}
                    placeholder="e.g. Madhapur"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                {errors.locality ? <Text style={styles.formErrorText}>{errors.locality}</Text> : null}
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Pincode</Text>
                <View style={styles.formInputWrap}>
                  <TextInput
                    style={styles.formInput}
                    value={pincode}
                    onChangeText={setPincode}
                    placeholder="500081"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            {/* City & State */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>City & State</Text>
              <View style={styles.formInputWrap}>
                <TextInput
                  style={styles.formInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Hyderabad, Telangana"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.editModalActionRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveProfileBtn}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveProfileBtnText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// --- User Profile Details Card ---
interface UserProfileCardProps {
  user: UserProfile;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => {
  return (
    <View style={styles.profileCard}>
      <View style={styles.profileCardHeader}>
        <View style={styles.profileAvatar}>
          <User size={22} color="#65A30D" />
        </View>
        <View style={styles.profileIdentity}>
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName}>{user.name}</Text>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color="#059669" />
              <Text style={styles.verifiedText}>Active</Text>
            </View>
          </View>
          <Text style={styles.memberIdText}>Member ID: {user.memberId}</Text>
        </View>
      </View>

      <View style={styles.profileDivider} />

      <View style={styles.profileMetaGrid}>
        <View style={styles.profileMetaItem}>
          <Text style={styles.profileMetaLabel}>Age / Gender</Text>
          <Text style={styles.profileMetaValue}>
            {user.age} Yrs • {user.gender}
          </Text>
        </View>

        <View style={styles.profileMetaItem}>
          <Text style={styles.profileMetaLabel}>Phone</Text>
          <Text style={styles.profileMetaValue}>{user.phone}</Text>
        </View>

        <View style={styles.profileMetaItem}>
          <Text style={styles.profileMetaLabel}>Blood Group</Text>
          <Text style={styles.profileMetaValue}>{user.bloodGroup}</Text>
        </View>
      </View>
    </View>
  );
};

// --- Promotional Banner Carousel (Infinite Loop Model) ---
interface PromoCarouselProps {
  banners: PromoBanner[];
  onPressBanner: (banner: PromoBanner) => void;
}

const BANNER_CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 540);
const BANNER_GAP = 12;
const BANNER_ITEM_TOTAL = BANNER_CARD_WIDTH + BANNER_GAP;

const PromoCarousel: React.FC<PromoCarouselProps> = ({ banners, onPressBanner }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const scrollRef = useRef<ScrollView>(null);
  const isInteractingRef = useRef<boolean>(false);
  const currentIndexRef = useRef<number>(1);
  const isTransitioningRef = useRef<boolean>(false);

  // Cloned banner array for infinite loop: [last, ...banners, first]
  const extendedBanners = useMemo(() => {
    if (banners.length <= 1) return banners;
    return [banners[banners.length - 1], ...banners, banners[0]];
  }, [banners]);

  // Initial scroll offset to first real item
  useEffect(() => {
    if (banners.length <= 1) return;
    const initTimer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        x: 1 * BANNER_ITEM_TOTAL,
        animated: false,
      });
      currentIndexRef.current = 1;
      setActiveIndex(0);
    }, 60);
    return () => clearTimeout(initTimer);
  }, [banners.length]);

  // Infinite auto-scroll loop
  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      if (isInteractingRef.current || isTransitioningRef.current) return;

      const nextIndex = currentIndexRef.current + 1;
      currentIndexRef.current = nextIndex;

      scrollRef.current?.scrollTo({
        x: nextIndex * BANNER_ITEM_TOTAL,
        animated: true,
      });

      const dotIdx = (nextIndex - 1) % banners.length;
      setActiveIndex(dotIdx < 0 ? banners.length - 1 : dotIdx);

      // When reaching the right clone (index banners.length + 1), seamlessly loop to index 1
      if (nextIndex === banners.length + 1) {
        isTransitioningRef.current = true;
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            x: 1 * BANNER_ITEM_TOTAL,
            animated: false,
          });
          currentIndexRef.current = 1;
          setActiveIndex(0);
          isTransitioningRef.current = false;
        }, 450);
      }
    }, 3600);

    return () => clearInterval(timer);
  }, [banners.length]);

  const handleMomentumScrollEnd = (event: any) => {
    if (banners.length <= 1) return;
    const scrollX = event.nativeEvent.contentOffset.x;
    const idx = Math.round(scrollX / BANNER_ITEM_TOTAL);

    if (idx <= 0) {
      // Reached left clone -> jump seamlessly to last real item
      const jumpIdx = banners.length;
      scrollRef.current?.scrollTo({
        x: jumpIdx * BANNER_ITEM_TOTAL,
        animated: false,
      });
      currentIndexRef.current = jumpIdx;
      setActiveIndex(banners.length - 1);
    } else if (idx >= banners.length + 1) {
      // Reached right clone -> jump seamlessly to first real item
      scrollRef.current?.scrollTo({
        x: 1 * BANNER_ITEM_TOTAL,
        animated: false,
      });
      currentIndexRef.current = 1;
      setActiveIndex(0);
    } else {
      currentIndexRef.current = idx;
      setActiveIndex(idx - 1);
    }
    isInteractingRef.current = false;
  };

  const handleDotPress = (dotIndex: number) => {
    const targetIdx = dotIndex + 1;
    currentIndexRef.current = targetIdx;
    setActiveIndex(dotIndex);
    scrollRef.current?.scrollTo({
      x: targetIdx * BANNER_ITEM_TOTAL,
      animated: true,
    });
  };

  return (
    <View style={styles.carouselSection}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Featured Offers & Packages</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContainer}
        decelerationRate="fast"
        snapToInterval={BANNER_ITEM_TOTAL}
        snapToAlignment="start"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          isInteractingRef.current = true;
        }}
        onScrollEndDrag={() => {
          setTimeout(() => {
            isInteractingRef.current = false;
          }, 3000);
        }}
      >
        {extendedBanners.map((item: PromoBanner, loopIdx: number) => (
          <TouchableOpacity
            key={`${item.id}-loop-${loopIdx}`}
            style={[
              styles.bannerCard,
              { backgroundColor: item.bgColor, width: BANNER_CARD_WIDTH },
            ]}
            onPress={() => onPressBanner(item)}
            activeOpacity={0.9}
          >
            <View style={styles.bannerMainRow}>
              <View style={styles.bannerTextCol}>
                <View style={[styles.bannerTag, { backgroundColor: item.tagBgColor }]}>
                  <Text style={styles.bannerTagText}>{item.tag}</Text>
                </View>
                <Text style={[styles.bannerTitle, { color: item.textColor }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.bannerDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.bannerFooter}>
                  <View style={styles.bannerCtaButton}>
                    <Text style={styles.bannerCtaText}>{item.ctaText}</Text>
                    <ChevronRight size={13} color="#1E293B" />
                  </View>
                </View>
              </View>

              <View style={styles.bannerImageWrap}>
                <Image
                  source={item.image}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Infinite Loop Pagination Indicator Dots */}
      <View style={styles.paginationDotsRow}>
        {banners.map((_: PromoBanner, dotIdx: number) => {
          const isActive = activeIndex === dotIdx;
          return (
            <TouchableOpacity
              key={dotIdx}
              style={[
                styles.paginationDot,
                isActive && styles.paginationDotActive,
              ]}
              onPress={() => handleDotPress(dotIdx)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            />
          );
        })}
      </View>
    </View>
  );
};

// --- Consult by Specialty Data (With Related Icons, No Images) ---
export const DOCTOR_SPECIALTIES = [
  {
    id: 's1',
    name: 'Cardiology',
    icon: HeartPulse,
    bgColor: '#FFF1F2',
    iconColor: '#E11D48',
  },
  {
    id: 's2',
    name: 'Pediatrics',
    icon: Baby,
    bgColor: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    id: 's3',
    name: 'General Med',
    icon: Stethoscope,
    bgColor: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    id: 's4',
    name: 'Dermatology',
    icon: Sparkles,
    bgColor: '#FAF5FF',
    iconColor: '#9333EA',
  },
  {
    id: 's5',
    name: 'Orthopedics',
    icon: Bone,
    bgColor: '#ECFDF5',
    iconColor: '#059669',
  },
  {
    id: 's6',
    name: 'Dental Care',
    icon: SmilePlus,
    bgColor: '#F0F9FF',
    iconColor: '#0284C7',
  },
  {
    id: 's7',
    name: 'Homeopathy',
    icon: Leaf,
    bgColor: '#F0FDF4',
    iconColor: '#16A34A',
  },
];

// --- Core Service Categories Grid (2x2) ---
interface CategoryGridProps {
  categories: CategoryItem[];
  onSelectCategory: (category: CategoryItem) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onSelectCategory }) => {
  return (
    <View style={styles.categorySection}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Healthcare Services</Text>
        <Text style={styles.sectionSubtitle}>Tap to book instantly</Text>
      </View>

      <View style={styles.gridContainer}>
        {categories.map((item) => {
          const IconComp = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.gridCard}
              onPress={() => onSelectCategory(item)}
              activeOpacity={0.75}
            >
              <View style={[styles.gridIconWrap, { backgroundColor: item.bgColor }]}>
                <IconComp size={26} color={item.iconColor} strokeWidth={2.2} />
              </View>
              {item.badge && (
                <View style={styles.gridBadge}>
                  <Text style={styles.gridBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Text style={styles.gridTitle}>{item.title}</Text>
              <Text style={styles.gridSubtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// --- Help & Support Section ---
interface HelpSupportSectionProps {
  onPressFaq: () => void;
  onPressChat: () => void;
}

const HelpSupportSection: React.FC<HelpSupportSectionProps> = ({ onPressFaq, onPressChat }) => {
  return (
    <View style={styles.helpSection}>
      <Text style={styles.sectionTitle}>Help & Support</Text>
      <View style={styles.helpGrid}>
        <TouchableOpacity
          style={styles.helpCard}
          onPress={onPressFaq}
          activeOpacity={0.8}
        >
          <View style={[styles.helpIconWrap, { backgroundColor: '#EEF2FF' }]}>
            <HelpCircle size={22} color="#4F46E5" />
          </View>
          <View style={styles.helpTextWrap}>
            <Text style={styles.helpCardTitle}>FAQs & Guides</Text>
            <Text style={styles.helpCardSub}>Instant answers to queries</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpCard}
          onPress={onPressChat}
          activeOpacity={0.8}
        >
          <View style={[styles.helpIconWrap, { backgroundColor: '#ECFDF5' }]}>
            <MessageCircle size={22} color="#059669" />
          </View>
          <View style={styles.helpTextWrap}>
            <Text style={styles.helpCardTitle}>Live Chat Support</Text>
            <Text style={styles.helpCardSub}>24/7 Hyderabad Medical Desk</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Notification Modal / Overlay (Scrollable Up to Top, With Category Filters) ---
interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  items: NotificationItem[];
  onSelectNotification?: (item: NotificationItem) => void;
}

const NOTIFICATION_TABS: Array<'ALL' | 'MEDICINE' | 'OP' | 'HOME' | 'CONSULT'> = [
  'ALL',
  'MEDICINE',
  'OP',
  'HOME',
  'CONSULT',
];

const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  items,
  onSelectNotification,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'MEDICINE' | 'OP' | 'HOME' | 'CONSULT'>('ALL');

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'ALL') return items;
    return items.filter((item) => item.type === selectedFilter);
  }, [items, selectedFilter]);

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'OP':
        return <Calendar size={18} color="#65A30D" />;
      case 'MEDICINE':
        return <Pill size={18} color="#D97706" />;
      case 'HOME':
        return <HomeIcon size={18} color="#059669" />;
      case 'CONSULT':
        return <Video size={18} color="#7C3AED" />;
    }
  };

  const getStatusColor = (status: NotificationItem['status']) => {
    switch (status) {
      case 'Confirmed':
      case 'Completed':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'Dispatched':
        return { bg: '#FEF3C7', text: '#B45309' };
      case 'Assigned':
        return { bg: '#E0E7FF', text: '#4338CA' };
      case 'Scheduled':
        return { bg: '#F3E8FF', text: '#6B21A8' };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.notifModalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Top visual drag handle indicating sheet expands up */}
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          <View style={styles.modalHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.modalTitle}>Notifications & Live Updates</Text>
              <Text style={styles.modalSubtitle}>
                {items.length} active updates across Hyderabad services • Swipe to explore
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <View style={styles.notifFilterWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.notifFilterScroll}
              style={styles.notifFilterScrollView}
            >
              {NOTIFICATION_TABS.map((tab) => {
                const count =
                  tab === 'ALL'
                    ? items.length
                    : items.filter((item) => item.type === tab).length;
                const label =
                  tab === 'ALL'
                    ? `All (${items.length})`
                    : tab === 'MEDICINE'
                    ? `Medicines (${count})`
                    : tab === 'OP'
                    ? `OP Bookings (${count})`
                    : tab === 'HOME'
                    ? `Home Visits (${count})`
                    : `Consultations (${count})`;
                const isActive = selectedFilter === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.notifFilterChip, isActive && styles.notifFilterChipActive]}
                    onPress={() => setSelectedFilter(tab)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.notifFilterText,
                        isActive && styles.notifFilterTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Smooth Scrollable List extending up */}
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.notificationList, { paddingBottom: Math.max(insets.bottom + 28, 48) }]}
            showsVerticalScrollIndicator={true}
            bounces={true}
            style={styles.notifFlatList}
            ListEmptyComponent={
              <View style={styles.emptyNotifBox}>
                <Bell size={28} color="#94A3B8" />
                <Text style={styles.emptyNotifText}>No notifications in this category.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const statusColors = getStatusColor(item.status);
              return (
                <TouchableOpacity
                  style={styles.notificationCard}
                  onPress={() => onSelectNotification && onSelectNotification(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.notificationTopRow}>
                    <View style={styles.notificationIconWrap}>
                      {getIconForType(item.type)}
                    </View>
                    <View style={styles.notificationDetails}>
                      <Text style={styles.notificationItemTitle}>{item.title}</Text>
                      <Text style={styles.notificationItemSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>

                  <View style={styles.notificationMetaBox}>
                    <Clock size={12} color="#64748B" style={{ flexShrink: 0 }} />
                    <Text style={styles.notificationMetaText} numberOfLines={2}>{item.meta}</Text>
                  </View>

                  <View style={styles.notificationBottomRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColors.bg },
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                        {item.status}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={styles.notificationTimeText}>{item.time}</Text>
                      <ChevronRight size={13} color="#94A3B8" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

// --- Support / FAQ Modal ---
interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
  faqs: FaqItem[];
  onOpenChat: () => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ visible, onClose, faqs, onOpenChat }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Help & Support Desk</Text>
              <Text style={styles.modalSubtitle}>Frequently Asked Questions & Guides</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.faqScrollView} showsVerticalScrollIndicator={false}>
            {faqs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <TouchableOpacity
                  key={faq.id}
                  style={styles.faqCard}
                  onPress={() => toggleExpand(faq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqHeaderRow}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <ChevronRight
                      size={16}
                      color="#64748B"
                      style={{
                        transform: [{ rotate: isOpen ? '90deg' : '0deg' }],
                      }}
                    />
                  </View>
                  {isOpen && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
                </TouchableOpacity>
              );
            })}

            <View style={styles.supportContactCard}>
              <Text style={styles.supportContactTitle}>Need immediate emergency assistance?</Text>
              <Text style={styles.supportContactSub}>
                Our Hyderabad medical concierge is available 24/7 for booking guidance.
              </Text>
              <TouchableOpacity
                style={styles.callSupportBtn}
                onPress={() =>
                  Alert.alert('Medical Hotline', 'Calling One Buddy Concierge (Hyderabad): 1800-419-BUDDY')
                }
              >
                <Phone size={15} color="#FFFFFF" />
                <Text style={styles.callSupportBtnText}>Call Hotline (1800-419-BUDDY)</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// --- Interactive Live Chat Support Modal ---
interface ChatSupportModalProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
}

interface ChatMsg {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

const QUICK_PROMPTS = [
  'Check my Apollo OP Token',
  'Track Medicine Order #MED-9402',
  'Home visit nurse timing',
  'Book online doctor consult',
];

const ChatSupportModal: React.FC<ChatSupportModalProps> = ({
  visible,
  onClose,
  userName,
}) => {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: `Hello ${userName}! 👋 Welcome to OneBuddy 24/7 Healthcare Concierge (Hyderabad).`,
      time: 'Just now',
    },
    {
      id: 'm2',
      sender: 'bot',
      text: 'How can I assist you with your OP appointments, medicine delivery, or home test visits today?',
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState<string>('');

  const handleSend = (textToSend?: string) => {
    const txt = (textToSend || inputText).trim();
    if (!txt) return;

    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: txt,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    setTimeout(() => {
      let reply =
        'Thank you for reaching out! A OneBuddy healthcare desk representative in Hyderabad is coordinating your request.';
      const lower = txt.toLowerCase();
      if (lower.includes('token') || lower.includes('op') || lower.includes('apollo')) {
        reply =
          'Your Apollo Jubilee Hills OP Token #14 with Dr. Sarah Mitchell is confirmed for Today at 04:30 PM. Please arrive 15 minutes before at OP Desk #3.';
      } else if (lower.includes('medicine') || lower.includes('order') || lower.includes('med-9402')) {
        reply =
          'Order #MED-9402 (Paracetamol + Amoxicillin) is out for delivery with rider David Kumar. Estimated arrival in Madhapur is 25 minutes.';
      } else if (lower.includes('nurse') || lower.includes('home') || lower.includes('sample') || lower.includes('test')) {
        reply =
          'Your home blood sample collection is scheduled for tomorrow between 07:00 AM - 07:30 AM with Nurse Priyanka Rao. Please maintain 10 hours overnight fasting.';
      } else if (lower.includes('online') || lower.includes('consult') || lower.includes('doctor')) {
        reply =
          'General Physician tele-consultations are active. Tap "Online Consultation" on the Home Screen to connect with an available Hyderabad specialist in 5 minutes.';
      }

      const botReply: ChatMsg = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: reply,
        time: 'Just now',
      };
      setMessages((prev) => [...prev, botReply]);
    }, 500);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.chatModalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderLeft}>
              <View style={styles.agentAvatar}>
                <MessageCircle size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.chatAgentName}>OneBuddy Live Support</Text>
                <View style={styles.onlineStatusRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineStatusText}>Online • Hyderabad Healthcare Desk</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Messages Scroll View */}
          <ScrollView
            style={styles.chatScroll}
            contentContainerStyle={styles.chatScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.chatBubbleWrap,
                  m.sender === 'user' ? styles.chatBubbleUserWrap : styles.chatBubbleBotWrap,
                ]}
              >
                <View
                  style={[
                    styles.chatBubble,
                    m.sender === 'user' ? styles.chatBubbleUser : styles.chatBubbleBot,
                  ]}
                >
                  <Text
                    style={[
                      styles.chatBubbleText,
                      m.sender === 'user' ? styles.chatBubbleUserText : styles.chatBubbleBotText,
                    ]}
                  >
                    {m.text}
                  </Text>
                </View>
                <Text style={styles.chatTimeText}>{m.time}</Text>
              </View>
            ))}

            {/* Quick Suggestions Chips */}
            <View style={styles.quickPromptsWrap}>
              <Text style={styles.quickPromptHeading}>Quick Inquiries:</Text>
              <View style={styles.quickPromptsGrid}>
                {QUICK_PROMPTS.map((prompt) => (
                  <TouchableOpacity
                    key={prompt}
                    style={styles.quickPromptChip}
                    onPress={() => handleSend(prompt)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickPromptChipText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Input Bar */}
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatTextInput}
              placeholder="Ask about appointments, medicines, tests..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity
              style={[
                styles.chatSendBtn,
                !inputText.trim() && styles.chatSendBtnDisabled,
              ]}
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
              activeOpacity={0.8}
            >
              <Send size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- Order & Clinical Report Modal ---
interface OrderReportModalProps {
  visible: boolean;
  order: OrderRecord | null;
  onClose: () => void;
}

const OrderReportModal: React.FC<OrderReportModalProps> = ({ visible, order, onClose }) => {
  const insets = useSafeAreaInsets();
  if (!order) return null;

  const data = order.reportData;

  const getCategoryTheme = () => {
    switch (order.category) {
      case 'OP':
        return {
          title: 'OPD Hospital E-Token Pass & Report',
          tag: 'OP APPOINTMENT',
          icon: Calendar,
          color: '#65A30D',
          bg: '#F7FEE7',
          border: '#D9F99D',
        };
      case 'MEDICINE':
        return {
          title: 'Digital Pharmacy Tax Invoice & Dispatch Slip',
          tag: 'MEDICINE DELIVERY',
          icon: Pill,
          color: '#D97706',
          bg: '#FFFBEB',
          border: '#FDE68A',
        };
      case 'HOME':
        return {
          title: 'Certified Home Healthcare & Diagnostics Report',
          tag: 'HOME VISIT',
          icon: HomeIcon,
          color: '#059669',
          bg: '#ECFDF5',
          border: '#A7F3D0',
        };
      case 'CONSULT':
        return {
          title: 'Tele-Consultation Rx & Medical Advice Summary',
          tag: 'ONLINE CONSULTATION',
          icon: Video,
          color: '#7C3AED',
          bg: '#F5F3FF',
          border: '#DDD6FE',
        };
    }
  };

  const theme = getCategoryTheme();
  const HeaderIcon = theme.icon;

  const handleDownload = () => {
    Alert.alert(
      'Document Saved',
      `Official ${theme.title} for ${order.title} has been downloaded and added to your Medical Vault.`
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Share Report',
      `Secure encrypted link for ${order.title} is ready to share with your family or doctor.`
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.reportModalCard, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {/* Top handle indicating scrollable up sheet */}
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Modal Header */}
          <View style={styles.reportModalHeader}>
            <View style={styles.reportModalHeaderLeft}>
              <View style={[styles.reportTypeBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <HeaderIcon size={13} color={theme.color} style={{ marginRight: 5 }} />
                <Text style={[styles.reportTypeBadgeText, { color: theme.color }]}>{theme.tag}</Text>
              </View>
              <Text style={styles.reportModalTitle}>{theme.title}</Text>
              <Text style={styles.reportModalSubtitle}>Record ID: {order.id} • {order.dateOrTime}</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Report Content */}
          <ScrollView
            style={styles.reportScrollView}
            contentContainerStyle={styles.reportScrollContent}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            {/* Status & Active Banner */}
            <View style={styles.reportStatusBanner}>
              <View style={styles.reportStatusLeft}>
                <View
                  style={[
                    styles.reportActiveStatusPill,
                    {
                      backgroundColor: order.isActive ? '#DCFCE7' : '#F1F5F9',
                      borderColor: order.isActive ? '#86EFAC' : '#CBD5E1',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.reportActiveStatusDot,
                      { backgroundColor: order.isActive ? '#16A34A' : '#94A3B8' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.reportActiveStatusText,
                      { color: order.isActive ? '#15803D' : '#64748B' },
                    ]}
                  >
                    {order.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <Text style={styles.reportStatusStage}>Current Status: {order.status}</Text>
              </View>

              <View style={styles.reportPriceTag}>
                <Text style={styles.reportPriceTagLabel}>Total</Text>
                <Text style={styles.reportPriceTagValue}>{order.price || data?.totalPaid || '₹0'}</Text>
              </View>
            </View>

            {/* Patient Details Card */}
            <View style={styles.reportSectionCard}>
              <View style={styles.reportSectionTitleRow}>
                <User size={15} color="#65A30D" />
                <Text style={styles.reportSectionTitle}>Patient Identification</Text>
              </View>

              <View style={styles.reportMetaGrid}>
                <View style={styles.reportMetaItem}>
                  <Text style={styles.reportMetaLabel}>Patient Name</Text>
                  <Text style={styles.reportMetaValue}>{data?.patientName || 'Tejaswani K.'}</Text>
                </View>
                <View style={styles.reportMetaItem}>
                  <Text style={styles.reportMetaLabel}>Age / Gender</Text>
                  <Text style={styles.reportMetaValue}>{data?.patientAgeGender || '27 Y / Female'}</Text>
                </View>
              </View>

              <View style={[styles.reportMetaGrid, { marginTop: 10 }]}>
                <View style={styles.reportMetaItem}>
                  <Text style={styles.reportMetaLabel}>UHID / Patient ID</Text>
                  <Text style={styles.reportMetaValue}>{data?.uhid || 'UHID-HYD-882194'}</Text>
                </View>
                <View style={styles.reportMetaItem}>
                  <Text style={styles.reportMetaLabel}>Location Area</Text>
                  <Text style={styles.reportMetaValue}>Madhapur, Hyderabad</Text>
                </View>
              </View>
            </View>

            {/* Category 1: OP Booking */}
            {order.category === 'OP' && (
              <View style={styles.reportSectionCard}>
                <View style={styles.reportSectionTitleRow}>
                  <Calendar size={15} color="#65A30D" />
                  <Text style={styles.reportSectionTitle}>Hospital OPD E-Token Pass</Text>
                </View>

                {/* Big Token Box */}
                <View style={styles.opdTokenHighlightBox}>
                  <Text style={styles.opdHospitalName}>
                    {data?.hospitalName || order.hospitalName || 'Apollo Hospitals - Jubilee Hills'}
                  </Text>
                  <Text style={styles.opdDeskInfo}>{data?.roomOrDesk || 'Room 204, OPD Block B'}</Text>

                  <View style={styles.tokenNumberBadge}>
                    <Text style={styles.tokenNumberText}>{data?.tokenNumber || 'Token #14'}</Text>
                  </View>

                  <Text style={styles.opdDoctorTitle}>
                    Consultant: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{data?.doctorName || order.doctorName || 'Dr. Specialist'}</Text>
                  </Text>
                  <Text style={styles.opdSpecialtyText}>{data?.doctorSpecialty || 'Senior Specialist'}</Text>

                  <View style={styles.opdQueueRow}>
                    <Clock size={13} color="#D97706" />
                    <Text style={styles.opdQueueText}>{data?.queueAhead || '1 Patient Ahead • Est. wait: ~8 mins'}</Text>
                  </View>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Consultation Fee</Text>
                  <Text style={styles.receiptVal}>{order.price || '₹650'}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Payment Mode</Text>
                  <Text style={styles.receiptVal}>{data?.paymentMode || 'Online Paid (UPI)'}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Pass Status</Text>
                  <Text style={[styles.receiptVal, { color: '#15803D', fontWeight: '700', fontSize: 11 }]}>
                    {order.isActive ? 'Active' : 'Completed'}
                  </Text>
                </View>

                <View style={styles.digitalBarcodeWrap}>
                  <Text style={styles.barcodeLines}>||||| | |||| |||||| || | |||| |||| ||</Text>
                  <Text style={styles.barcodeCaption}>VERIFIED DIGITAL TOKEN • SHOW AT OPD RECEPTION DESK</Text>
                </View>
              </View>
            )}

            {/* Category 2: Medicine Delivery */}
            {order.category === 'MEDICINE' && (
              <View style={styles.reportSectionCard}>
                <View style={styles.reportSectionTitleRow}>
                  <Pill size={15} color="#D97706" />
                  <Text style={styles.reportSectionTitle}>Pharmacy Invoice & Delivery Slip</Text>
                </View>

                <View style={styles.pharmacyHeaderBox}>
                  <Text style={styles.pharmacyName}>{data?.pharmacyName || 'OneBuddy Express Pharmacy - Central Hub'}</Text>
                  <Text style={styles.deliveryAddrText}>
                    📍 Delivery to: {data?.deliveryAddress || 'Plot #42, Madhapur, Hyderabad'}
                  </Text>
                </View>

                {/* Delivery Agent Card */}
                <View style={styles.riderCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.riderTitle}>Assigned Delivery Partner</Text>
                    <Text style={styles.riderName}>{data?.riderName || 'David Kumar'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.callRiderBtn}
                    onPress={() => Alert.alert('Contact Rider', `Calling David Kumar (${data?.riderPhone || '+91 98877 66554'}).`)}
                    activeOpacity={0.8}
                  >
                    <Phone size={13} color="#FFFFFF" />
                    <Text style={styles.callRiderBtnText}>Call Rider</Text>
                  </TouchableOpacity>
                </View>

                {/* Itemized Medicines List */}
                <Text style={styles.subSectionTitle}>Prescribed Medicines Dispatched</Text>
                <View style={styles.medicinesTable}>
                  {(data?.medicines || [
                    { name: 'Dolo 650mg Tablet', dosage: '650mg', frequency: '1-0-1 after meals', duration: '5 Days', price: 32 },
                    { name: 'Augmentin 625mg Duo', dosage: '625mg', frequency: '1-0-1 after meals', duration: '5 Days', price: 204 },
                    { name: 'Pantocid 40mg Tablet', dosage: '40mg', frequency: '1-0-0 empty stomach', duration: '5 Days', price: 49 },
                  ]).map((med, idx) => (
                    <View key={idx} style={styles.medTableRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.medItemName}>{med.name}</Text>
                        <Text style={styles.medItemDosage}>{med.dosage} • {med.frequency} • {med.duration}</Text>
                      </View>
                      {med.price ? (
                        <Text style={styles.medItemPrice}>₹{med.price}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>

                {/* Bill Breakdown */}
                <View style={styles.billBox}>
                  <View style={styles.billRow}>
                    <Text style={styles.billKey}>Medicines Subtotal</Text>
                    <Text style={styles.billVal}>{data?.subtotal || order.price || '₹285'}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billKey}>Express 2-Hr Delivery</Text>
                    <Text style={[styles.billVal, { color: '#15803D' }]}>{data?.deliveryFee || 'FREE'}</Text>
                  </View>
                  <View style={[styles.billRow, { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 6, marginTop: 4 }]}>
                    <Text style={[styles.billKey, { fontWeight: '700', color: '#0F172A' }]}>Total Amount Paid</Text>
                    <Text style={[styles.billVal, { fontWeight: '800', color: '#0F172A', fontSize: 14 }]}>
                      {data?.totalPaid || order.price || '₹285'}
                    </Text>
                  </View>
                </View>

                <View style={styles.pharmacyVerificationStamp}>
                  <ShieldCheck size={14} color="#059669" />
                  <Text style={styles.verificationStampText}>
                    Pharmacist Batch Verified • TS-PHARM-89421 • Tamper-Evident Sealed
                  </Text>
                </View>
              </View>
            )}

            {/* Category 3: Online Consultation */}
            {order.category === 'CONSULT' && (
              <View style={styles.reportSectionCard}>
                <View style={styles.reportSectionTitleRow}>
                  <Video size={15} color="#7C3AED" />
                  <Text style={styles.reportSectionTitle}>Tele-Consultation Clinical Rx</Text>
                </View>

                <View style={styles.doctorHeaderBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.doctorHeaderName}>{data?.doctorName || order.doctorName || 'Dr. Vikramaditya Sen'}</Text>
                    <Text style={styles.doctorHeaderSpecialty}>{data?.doctorSpecialty || 'Senior Cardiologist & Consultant'}</Text>
                    <Text style={styles.doctorHospitalSub}>{data?.hospitalName || 'OneBuddy Virtual OPD (Hyderabad)'}</Text>
                  </View>
                  <View style={styles.doctorRegBadge}>
                    <Text style={styles.doctorRegText}>NMC #TS-49201</Text>
                  </View>
                </View>

                {/* Diagnosis & Symptoms */}
                <View style={styles.clinicalNotesBox}>
                  <Text style={styles.clinicalNotesHeading}>Clinical Diagnosis</Text>
                  <Text style={styles.clinicalDiagnosisText}>{data?.diagnosis || 'Seasonal Upper Respiratory Infection & Mild Hypertension'}</Text>
                  {data?.symptoms && (
                    <Text style={styles.clinicalSymptomsText}>Symptoms: {data.symptoms}</Text>
                  )}
                </View>

                {/* Prescribed Medications */}
                <Text style={styles.subSectionTitle}>Prescribed Medications (Rx)</Text>
                <View style={styles.medicinesTable}>
                  {(data?.medicines || [
                    { name: 'Telmisartan 40mg', dosage: '40mg', frequency: 'Once daily (morning)', duration: '30 Days' },
                    { name: 'Paracetamol 650mg', dosage: '650mg', frequency: 'As needed for fever (SOS)', duration: '3 Days' },
                  ]).map((med, idx) => (
                    <View key={idx} style={styles.medTableRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medItemName}>💊 {med.name}</Text>
                        <Text style={styles.medItemDosage}>{med.dosage} • {med.frequency} • {med.duration}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Clinical Advice */}
                <View style={styles.doctorAdviceBox}>
                  <Text style={styles.clinicalNotesHeading}>Doctor's Clinical Advice</Text>
                  <Text style={styles.doctorAdviceText}>
                    {data?.doctorAdvice || 'Maintain regular blood pressure monitoring. Reduce daily sodium intake. Stay well hydrated with 2.5L water daily.'}
                  </Text>
                  <Text style={styles.followUpText}>
                    🗓️ Recommended Follow-up: {data?.followUpDate || 'In 7 Days via Tele-Consultation'}
                  </Text>
                </View>

                <View style={styles.digitalSignatureBox}>
                  <Text style={styles.digitalSignatureTitle}>Digitally Signed by Medical Practitioner</Text>
                  <Text style={styles.digitalSignatureSubtitle}>
                    Issued in accordance with the Telemedicine Practice Guidelines of India (NMC)
                  </Text>
                </View>
              </View>
            )}

            {/* Category 4: Home Visits */}
            {order.category === 'HOME' && (
              <View style={styles.reportSectionCard}>
                <View style={styles.reportSectionTitleRow}>
                  <HomeIcon size={15} color="#059669" />
                  <Text style={styles.reportSectionTitle}>Certified Home Visit Diagnostics Report</Text>
                </View>

                <View style={styles.nurseHeaderBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nurseHeaderName}>{data?.nurseName || 'Nurse Sunita Rao'}</Text>
                    <Text style={styles.nurseHeaderRole}>{data?.nurseRole || 'Senior Phlebotomist & Home Care Specialist'}</Text>
                    <Text style={styles.nurseHospitalSub}>{data?.hospitalName || 'Apollo Home Care (Hyderabad)'}</Text>
                  </View>
                  <View style={styles.accreditedBadge}>
                    <ShieldCheck size={13} color="#059669" />
                    <Text style={styles.accreditedBadgeText}>Certified</Text>
                  </View>
                </View>

                {/* Vitals Grid */}
                <Text style={styles.subSectionTitle}>Recorded Patient Vitals at Home</Text>
                <View style={styles.vitalsGrid}>
                  <View style={styles.vitalCard}>
                    <Text style={styles.vitalLabel}>Blood Pressure</Text>
                    <Text style={styles.vitalValue}>{data?.vitals?.bp || '120/80'}</Text>
                    <Text style={styles.vitalUnit}>mmHg (Normal)</Text>
                  </View>
                  <View style={styles.vitalCard}>
                    <Text style={styles.vitalLabel}>Pulse Rate</Text>
                    <Text style={styles.vitalValue}>{data?.vitals?.pulse || '74'}</Text>
                    <Text style={styles.vitalUnit}>bpm</Text>
                  </View>
                  <View style={styles.vitalCard}>
                    <Text style={styles.vitalLabel}>Oxygen (SpO2)</Text>
                    <Text style={styles.vitalValue}>{data?.vitals?.spo2 || '99%'}</Text>
                    <Text style={styles.vitalUnit}>Optimal</Text>
                  </View>
                  <View style={styles.vitalCard}>
                    <Text style={styles.vitalLabel}>Fasting Sugar</Text>
                    <Text style={styles.vitalValue}>{data?.vitals?.rbs || '92'}</Text>
                    <Text style={styles.vitalUnit}>mg/dL</Text>
                  </View>
                </View>

                {/* Tests Table if conducted */}
                {data?.testsConducted && data.testsConducted.length > 0 && (
                  <>
                    <Text style={styles.subSectionTitle}>Diagnostic Test Results</Text>
                    <View style={styles.labTestsTable}>
                      {data.testsConducted.map((t, idx) => (
                        <View key={idx} style={styles.labTestRow}>
                          <View style={{ flex: 1.5 }}>
                            <Text style={styles.labTestName}>{t.name}</Text>
                            <Text style={styles.labTestRef}>Reference: {t.normalRange}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.labTestResult}>{t.result}</Text>
                            <View
                              style={[
                                styles.labTestStatusPill,
                                {
                                  backgroundColor: t.status === 'Normal' ? '#DCFCE7' : '#FEF3C7',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.labTestStatusText,
                                  {
                                    color: t.status === 'Normal' ? '#15803D' : '#B45309',
                                  },
                                ]}
                              >
                                {t.status}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Clinical Notes */}
                <View style={styles.nurseNotesBox}>
                  <Text style={styles.clinicalNotesHeading}>Clinical Observation & Notes</Text>
                  <Text style={styles.nurseNotesText}>
                    {data?.clinicalNotes || 'Sample collected with sterile EDTA vacutainer at home. All parameters within optimal healthy limits.'}
                  </Text>
                </View>

                <View style={styles.labAccreditationBox}>
                  <CheckCircle2 size={14} color="#059669" />
                  <Text style={styles.labAccreditationText}>
                    NABL & ICMR Accredited Laboratory Network (Hyderabad Hub)
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons: Download PDF & Share */}
            <View style={styles.reportActionButtonsRow}>
              <TouchableOpacity
                style={styles.reportDownloadBtn}
                onPress={handleDownload}
                activeOpacity={0.8}
              >
                <Download size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.reportDownloadBtnText}>Download PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reportShareBtn}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Share2 size={16} color="#475569" style={{ marginRight: 6 }} />
                <Text style={styles.reportShareBtnText}>Share</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.reportCloseFooterBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.reportCloseFooterBtnText}>Close Report</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// --- Orders Tab Content View (Includes Medicine Orders, OP Appointments, Home Visits & Completed Consultations) ---
interface OrdersViewProps {
  orders: OrderRecord[];
  onActionPress: (order: OrderRecord) => void;
  onViewReport: (order: OrderRecord) => void;
}

const ORDER_FILTER_TABS: Array<'ALL' | 'ACTIVE' | 'MEDICINE' | 'OP' | 'HOME' | 'CONSULT'> = [
  'ALL',
  'ACTIVE',
  'MEDICINE',
  'OP',
  'HOME',
  'CONSULT',
];

const OrdersView: React.FC<OrdersViewProps> = ({ orders, onActionPress, onViewReport }) => {
  const [selectedFilter, setSelectedFilter] = useState<
    'ALL' | 'ACTIVE' | 'MEDICINE' | 'OP' | 'HOME' | 'CONSULT'
  >('ALL');

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'ALL') return orders;
    if (selectedFilter === 'ACTIVE') return orders.filter((o) => o.isActive);
    return orders.filter((o) => o.category === selectedFilter);
  }, [orders, selectedFilter]);

  const getCategoryBadge = (cat: OrderRecord['category']) => {
    switch (cat) {
      case 'MEDICINE':
        return { label: 'MEDICINE ORDER', bg: '#FFFBEB', color: '#D97706', icon: Pill };
      case 'OP':
        return { label: 'OP APPOINTMENT', bg: '#F7FEE7', color: '#65A30D', icon: Calendar };
      case 'HOME':
        return { label: 'HOME VISIT', bg: '#ECFDF5', color: '#059669', icon: HomeIcon };
      case 'CONSULT':
        return { label: 'ONLINE CONSULTATION', bg: '#F5F3FF', color: '#7C3AED', icon: Video };
    }
  };

  const getStatusBadge = (status: OrderRecord['status']) => {
    switch (status) {
      case 'Confirmed':
      case 'Completed':
      case 'Delivered':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'Dispatched':
        return { bg: '#FEF3C7', text: '#B45309' };
      case 'Assigned':
        return { bg: '#E0E7FF', text: '#4338CA' };
      case 'Scheduled':
        return { bg: '#F3E8FF', text: '#6B21A8' };
    }
  };

  return (
    <ScrollView
      style={styles.tabContentContainer}
      contentContainerStyle={styles.ordersScrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.tabHeaderBox}>
        <Text style={styles.tabHeaderTitle}>Orders & Appointments</Text>
        <Text style={styles.tabHeaderSub}>
          Live status of your medicine orders, OP hospital visits, home tests & doctor consultations. Tap any card to view its specific report.
        </Text>
      </View>

      {/* Orders Filter Tabs */}
      <View style={styles.ordersFilterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ordersFilterScroll}
          style={styles.ordersFilterScrollView}
        >
          {ORDER_FILTER_TABS.map((tab) => {
            const count =
              tab === 'ALL'
                ? orders.length
                : tab === 'ACTIVE'
                ? orders.filter((o) => o.isActive).length
                : orders.filter((o) => o.category === tab).length;
            const label =
              tab === 'ALL'
                ? `All (${count})`
                : tab === 'ACTIVE'
                ? `🟢 Active (${count})`
                : tab === 'MEDICINE'
                ? `Medicines (${count})`
                : tab === 'OP'
                ? `OP Bookings (${count})`
                : tab === 'HOME'
                ? `Home Visits (${count})`
                : `Consultations (${count})`;
            const isActive = selectedFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.orderFilterChip, isActive && styles.orderFilterChipActive]}
                onPress={() => setSelectedFilter(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.orderFilterText, isActive && styles.orderFilterTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <View style={styles.ordersList}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyOrdersBox}>
            <Clock size={32} color="#94A3B8" />
            <Text style={styles.emptyOrdersTitle}>No records found</Text>
            <Text style={styles.emptyOrdersSub}>You have no orders or appointments in this category.</Text>
          </View>
        ) : (
          filteredOrders.map((item) => {
            const catInfo = getCategoryBadge(item.category);
            const statusInfo = getStatusBadge(item.status);
            const CatIcon = catInfo.icon;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.ordersItemCard}
                onPress={() => onViewReport(item)}
                activeOpacity={0.88}
              >
                {/* Card Top: Category, Active Status Badge & Status */}
                <View style={styles.ordersCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <View style={[styles.orderCategoryPill, { backgroundColor: catInfo.bg }]}>
                      <CatIcon size={12} color={catInfo.color} style={{ marginRight: 4, flexShrink: 0 }} />
                      <Text style={[styles.ordersCardTypeTag, { color: catInfo.color }]} numberOfLines={1}>
                        {catInfo.label}
                      </Text>
                    </View>

                    {/* Active vs Not Active Indicator */}
                    <View
                      style={[
                        styles.activeStatusPill,
                        {
                          backgroundColor: item.isActive ? '#DCFCE7' : '#F1F5F9',
                          borderColor: item.isActive ? '#86EFAC' : '#CBD5E1',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.activeStatusDot,
                          { backgroundColor: item.isActive ? '#16A34A' : '#94A3B8' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.activeStatusText,
                          { color: item.isActive ? '#15803D' : '#64748B' },
                        ]}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.orderStatusPill, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.ordersCardStatus, { color: statusInfo.text }]} numberOfLines={1}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Title & Subtitle */}
                <Text style={styles.ordersCardTitle}>{item.title}</Text>
                <Text style={styles.ordersCardSubtitle}>{item.subtitle}</Text>

                {/* Meta information row */}
                <View style={styles.orderMetaBox}>
                  <Clock size={13} color="#64748B" style={{ marginRight: 6, flexShrink: 0 }} />
                  <Text style={styles.ordersCardMeta} numberOfLines={2}>
                    {item.meta}
                  </Text>
                </View>

                <View style={styles.ordersDivider} />

                {/* Card Bottom: Date/Price & Action Buttons arranged cleanly for mobile screens */}
                <View style={styles.orderCardFooter}>
                  {/* Row 1: Date & Time on left, Price on right */}
                  <View style={styles.orderFooterInfoRow}>
                    <View style={styles.orderDateWrap}>
                      <Calendar size={13} color="#64748B" style={{ marginRight: 5 }} />
                      <Text style={styles.orderDateText} numberOfLines={1}>
                        {item.dateOrTime}
                      </Text>
                    </View>
                    {item.price ? (
                      <View style={styles.orderPriceWrap}>
                        <Text style={styles.orderPriceLabel}>Total:</Text>
                        <Text style={styles.orderPriceText}>{item.price}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Row 2: Action Buttons side-by-side with balanced width and touch target */}
                  <View style={styles.orderCardActionsRow}>
                    {/* View Report Dedicated Button */}
                    <TouchableOpacity
                      style={styles.viewReportBtn}
                      onPress={() => onViewReport(item)}
                      activeOpacity={0.8}
                    >
                      <FileText size={13} color="#4D7C0F" style={{ marginRight: 5 }} />
                      <Text style={styles.viewReportBtnText} numberOfLines={1}>View Report</Text>
                    </TouchableOpacity>

                    {/* Action Button (Removed View Consultation Pass) */}
                    {item.actionText && item.actionText !== 'View Consultation Pass' ? (
                      <TouchableOpacity
                        style={styles.orderActionBtn}
                        onPress={() => onActionPress(item)}
                        activeOpacity={0.8}
                      >
                        {item.category === 'CONSULT' && item.status === 'Completed' ? (
                          <Download size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                        ) : null}
                        <Text style={styles.orderActionBtnText} numberOfLines={1}>{item.actionText}</Text>
                        {item.category !== 'CONSULT' ? (
                          <ChevronRight size={13} color="#FFFFFF" style={{ marginLeft: 3 }} />
                        ) : null}
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

// --- Edit Profile Modal ---
interface EditProfileModalProps {
  visible: boolean;
  user: UserProfile;
  onSave: (updatedUser: UserProfile) => void;
  onClose: () => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS: Array<'Male' | 'Female' | 'Other'> = ['Male', 'Female', 'Other'];

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  user,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState<string>(user.name);
  const [phone, setPhone] = useState<string>(user.phone);
  const [email, setEmail] = useState<string>(user.email || '');
  const [age, setAge] = useState<string>(user.age ? String(user.age) : '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(user.gender || 'Female');
  const [bloodGroup, setBloodGroup] = useState<string>(user.bloodGroup || 'AB+ Positive');
  const [address, setAddress] = useState<string>(user.address || '');
  const [emergencyContact, setEmergencyContact] = useState<string>(user.emergencyContact || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (visible) {
      setName(user.name);
      setPhone(user.phone);
      setEmail(user.email || '');
      setAge(user.age ? String(user.age) : '');
      setGender(user.gender || 'Female');
      setBloodGroup(user.bloodGroup || 'AB+ Positive');
      setAddress(user.address || '');
      setEmergencyContact(user.emergencyContact || '');
      setErrors({});
    }
  }, [visible, user]);

  const handleSave = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter your full name';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Please enter your contact phone number';
    }
    const parsedAge = parseInt(age, 10);
    if (!age || isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 125) {
      newErrors.age = 'Please enter a valid age (1-125)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const updated: UserProfile = {
      ...user,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      age: parsedAge,
      gender,
      bloodGroup,
      address: address.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined,
    };

    onSave(updated);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.editProfileModalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Edit Profile Details</Text>
              <Text style={styles.modalSubtitle}>Update your personal & healthcare information</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.editModalScroll}
            contentContainerStyle={styles.editModalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Full Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name *</Text>
              <View style={[styles.formInputWrap, errors.name ? styles.formInputWrapError : undefined]}>
                <User size={16} color="#64748B" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formInput}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              {errors.name ? <Text style={styles.formErrorText}>{errors.name}</Text> : null}
            </View>

            {/* Phone Number */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number *</Text>
              <View style={[styles.formInputWrap, errors.phone ? styles.formInputWrapError : undefined]}>
                <Phone size={16} color="#64748B" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formInput}
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  placeholder="+91 9666994727"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone ? <Text style={styles.formErrorText}>{errors.phone}</Text> : null}
            </View>

            {/* Email Address */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email Address</Text>
              <View style={styles.formInputWrap}>
                <Mail size={16} color="#64748B" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Age & Gender Row */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Age (Years) *</Text>
                <View style={[styles.formInputWrap, errors.age ? styles.formInputWrapError : undefined]}>
                  <Calendar size={16} color="#64748B" style={styles.formInputIcon} />
                  <TextInput
                    style={styles.formInput}
                    value={age}
                    onChangeText={(val) => {
                      setAge(val);
                      if (errors.age) setErrors((prev) => ({ ...prev, age: '' }));
                    }}
                    placeholder="27"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                  />
                </View>
                {errors.age ? <Text style={styles.formErrorText}>{errors.age}</Text> : null}
              </View>

              <View style={[styles.formGroup, { flex: 1.5, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Gender</Text>
                <View style={styles.genderSelectRow}>
                  {GENDERS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderChip, gender === g && styles.genderChipActive]}
                      onPress={() => setGender(g)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          gender === g && styles.genderChipTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Blood Group */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Blood Group</Text>
              <View style={styles.bloodGroupGrid}>
                {BLOOD_GROUPS.map((bg) => {
                  const isSelected =
                    bloodGroup === bg ||
                    bloodGroup.startsWith(bg) ||
                    (bg === 'AB+' && bloodGroup.includes('AB+'));
                  return (
                    <TouchableOpacity
                      key={bg}
                      style={[
                        styles.bloodChip,
                        isSelected && styles.bloodChipActive,
                      ]}
                      onPress={() => setBloodGroup(`${bg} Positive`)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.bloodChipText,
                          isSelected && styles.bloodChipTextActive,
                        ]}
                      >
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Address / Area (Hyderabad) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Address / Area (Hyderabad)</Text>
              <View style={styles.formInputWrap}>
                <MapPin size={16} color="#64748B" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Plot No., Street, Area (e.g. Madhapur, Hyderabad)"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Emergency Contact */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Emergency Contact</Text>
              <View style={styles.formInputWrap}>
                <ShieldCheck size={16} color="#64748B" style={styles.formInputIcon} />
                <TextInput
                  style={styles.formInput}
                  value={emergencyContact}
                  onChangeText={setEmergencyContact}
                  placeholder="+91 9876543210 (Relation / Name)"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.editModalActionRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveProfileBtn}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveProfileBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// --- Profile Tab Content View ---
interface ProfileViewProps {
  user: UserProfile;
  onEditProfile: () => void;
  onEditAddress: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onEditProfile, onEditAddress }) => {
  return (
    <ScrollView
      style={styles.tabContentContainer}
      contentContainerStyle={styles.tabScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header Banner */}
      <View style={styles.profileTabHeader}>
        <View style={styles.profileTabLargeAvatar}>
          <User size={38} color="#FFFFFF" />
        </View>
        <Text style={styles.profileTabName}>{user.name}</Text>
        <View style={styles.verifiedMemberBadge}>
          <ShieldCheck size={13} color="#059669" />
          <Text style={styles.verifiedMemberText}>OneBuddy Verified Patient</Text>
        </View>
        <Text style={styles.profileTabSub}>Member ID: {user.memberId || 'OB-882194'}</Text>

        <TouchableOpacity
          style={styles.editHeaderIconBtn}
          onPress={onEditProfile}
          activeOpacity={0.8}
        >
          <Edit3 size={15} color="#65A30D" />
          <Text style={styles.editHeaderIconText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Section 1: Personal Details */}
      <View style={styles.profileDetailsSection}>
        <View style={styles.profileSectionHeadingRow}>
          <User size={16} color="#65A30D" />
          <Text style={styles.profileSectionHeading}>Personal Information</Text>
        </View>

        <View style={styles.profileDetailRow}>
          <Text style={styles.profileDetailKey}>Full Name</Text>
          <Text style={styles.profileDetailVal}>{user.name}</Text>
        </View>

        <View style={styles.profileDetailRow}>
          <Text style={styles.profileDetailKey}>Age</Text>
          <Text style={styles.profileDetailVal}>{user.age} Years</Text>
        </View>

        <View style={styles.profileDetailRow}>
          <Text style={styles.profileDetailKey}>Gender</Text>
          <Text style={styles.profileDetailVal}>{user.gender}</Text>
        </View>

        <View style={[styles.profileDetailRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.profileDetailKey}>Blood Group</Text>
          <View style={styles.bloodBadgeSmall}>
            <Text style={styles.bloodBadgeSmallText}>{user.bloodGroup || 'Not Specified'}</Text>
          </View>
        </View>
      </View>

      {/* Section 2: Contact Details */}
      <View style={styles.profileDetailsSection}>
        <View style={styles.profileSectionHeadingRow}>
          <Phone size={16} color="#65A30D" />
          <Text style={styles.profileSectionHeading}>Contact Information</Text>
        </View>

        <View style={styles.profileDetailRow}>
          <Text style={styles.profileDetailKey}>Primary Phone</Text>
          <Text style={styles.profileDetailVal}>{user.phone}</Text>
        </View>

        <View style={styles.profileDetailRow}>
          <Text style={styles.profileDetailKey}>Email Address</Text>
          <Text style={styles.profileDetailVal}>{user.email || 'tejaswani.k@gmail.com'}</Text>
        </View>

        <View style={[styles.profileDetailRow, { borderBottomWidth: 0, alignItems: 'flex-start' }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.addressRowHeader}>
              <Text style={styles.profileDetailKey}>Address (Hyderabad)</Text>
              <TouchableOpacity
                style={styles.inlineEditBtn}
                onPress={onEditAddress}
                activeOpacity={0.7}
              >
                <Edit3 size={11} color="#65A30D" />
                <Text style={styles.inlineEditBtnText}>Edit Address</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={onEditAddress} activeOpacity={0.8}>
              <Text style={styles.profileAddressVal} numberOfLines={3}>
                {user.address || 'Madhapur, Hyderabad, Telangana'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Section 3: Emergency & Healthcare Pass */}
      <View style={styles.profileDetailsSection}>
        <View style={styles.profileSectionHeadingRow}>
          <ShieldCheck size={16} color="#65A30D" />
          <Text style={styles.profileSectionHeading}>Emergency & Medical Pass</Text>
        </View>

        <View style={styles.profileDetailRow}>
          <Text style={styles.profileDetailKey}>Emergency Contact</Text>
          <Text style={styles.profileDetailVal}>
            {user.emergencyContact || '+91 9876543210 (Family)'}
          </Text>
        </View>

        <View style={[styles.profileDetailRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.profileDetailKey}>Hyderabad Hospital OP Pass</Text>
          <View style={styles.passActiveBadge}>
            <Check size={12} color="#059669" />
            <Text style={styles.passActiveText}>Active (Apollo, Yashoda, Care)</Text>
          </View>
        </View>
      </View>

      {/* Main Edit CTA Button */}
      <TouchableOpacity
        style={styles.editProfileButton}
        onPress={onEditProfile}
        activeOpacity={0.85}
      >
        <Edit3 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.editProfileButtonText}>Edit Profile Details</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// --- Bottom Navigation Bar ---
interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabSelect: (tab: BottomNavTab) => void;
  ordersBadgeCount: number;
  bottomInset: number;
}

const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabSelect,
  ordersBadgeCount,
  bottomInset,
}) => {
  return (
    <View
      style={[
        styles.bottomNavContainer,
        {
          paddingBottom: Math.max(bottomInset, 8),
          height: 60 + Math.max(bottomInset, 0),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onTabSelect('Home')}
        activeOpacity={0.7}
      >
        <HomeIcon
          size={22}
          color={activeTab === 'Home' ? '#65A30D' : '#94A3B8'}
          strokeWidth={activeTab === 'Home' ? 2.5 : 2}
        />
        <Text
          style={[
            styles.navItemText,
            activeTab === 'Home' && styles.navItemTextActive,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onTabSelect('Orders')}
        activeOpacity={0.7}
      >
        <View>
          <ShoppingBag
            size={22}
            color={activeTab === 'Orders' ? '#65A30D' : '#94A3B8'}
            strokeWidth={activeTab === 'Orders' ? 2.5 : 2}
          />
          {ordersBadgeCount > 0 && (
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>{ordersBadgeCount}</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.navItemText,
            activeTab === 'Orders' && styles.navItemTextActive,
          ]}
        >
          Orders
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onTabSelect('Profile')}
        activeOpacity={0.7}
      >
        <User
          size={22}
          color={activeTab === 'Profile' ? '#65A30D' : '#94A3B8'}
          strokeWidth={activeTab === 'Profile' ? 2.5 : 2}
        />
        <Text
          style={[
            styles.navItemText,
            activeTab === 'Profile' && styles.navItemTextActive,
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ==========================================
// 4. MAIN HOME SCREEN COMPONENT
// ==========================================

export default function HomeScreen({
  onNavigateToOPBooking,
  onNavigateToHomeVisits,
  onClose,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  const [activeTab, setActiveTab] = useState<BottomNavTab>('Home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState<boolean>(false);
  const [isSupportVisible, setIsSupportVisible] = useState<boolean>(false);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);
  const [isEditProfileVisible, setIsEditProfileVisible] = useState<boolean>(false);
  const [isEditAddressVisible, setIsEditAddressVisible] = useState<boolean>(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState<boolean>(false);
  const [isConsultModalVisible, setIsConsultModalVisible] = useState<boolean>(false);
  const [isHomeVisitsModalVisible, setIsHomeVisitsModalVisible] = useState<boolean>(false);
  const [isOPBookingModalVisible, setIsOPBookingModalVisible] = useState<boolean>(false);
  const [isMedicineModalVisible, setIsMedicineModalVisible] = useState<boolean>(false);
  const [selectedHospitalForOP, setSelectedHospitalForOP] = useState<any>(null);
  const [orders, setOrders] = useState<OrderRecord[]>(ALL_ORDERS_DATA);

  // Load persistent orders across all categories on mount/refresh
  useEffect(() => {
    let isMounted = true;
    getSavedOrders<OrderRecord>(ALL_ORDERS_DATA).then((saved) => {
      if (isMounted && saved && saved.length > 0) {
        setOrders(saved);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);
  const [selectedOrderForReport, setSelectedOrderForReport] = useState<OrderRecord | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [liveCoords, setLiveCoords] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 17.4483,
    longitude: 78.3915,
  });
  const [isLiveGpsActive, setIsLiveGpsActive] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_USER);
  const [searchFilterMode, setSearchFilterMode] = useState<'ALL' | 'HOSPITALS' | 'MEDICINES'>('ALL');
  const [currentLocation, setCurrentLocation] = useState<string>(
    'Madhapur, Hyderabad, Telangana'
  );

  // Handle Android / Mobile hardware / bottom bar back navigation
  useEffect(() => {
    const onHardwareBack = () => {
      // 1. If detailed report modal is open, close it
      if (selectedOrderForReport) {
        setSelectedOrderForReport(null);
        return true;
      }
      // 2. If sub modals are open, close them
      if (isEditProfileVisible) {
        setIsEditProfileVisible(false);
        return true;
      }
      if (isEditAddressVisible) {
        setIsEditAddressVisible(false);
        return true;
      }
      if (isLocationModalVisible) {
        setIsLocationModalVisible(false);
        return true;
      }
      if (isChatVisible) {
        setIsChatVisible(false);
        return true;
      }
      if (isSupportVisible) {
        setIsSupportVisible(false);
        return true;
      }
      if (isNotificationVisible) {
        setIsNotificationVisible(false);
        return true;
      }
      // Note: OP, Home visits, Consult, and Medicine sub-modals have their own internal BackHandlers
      if (isOPBookingModalVisible || isHomeVisitsModalVisible || isConsultModalVisible || isMedicineModalVisible) {
        return false;
      }
      // 3. If search is active or focused, clear it
      if (isSearchFocused || searchQuery.trim().length > 0) {
        setSearchQuery('');
        setIsSearchFocused(false);
        Keyboard.dismiss();
        return true;
      }
      // 4. If on Orders or Profile tab, switch back to Home tab
      if (activeTab !== 'Home') {
        setActiveTab('Home');
        return true;
      }
      // 5. If on root Home tab with nothing open, close Care module
      if (onClose) {
        onClose();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [
    selectedOrderForReport,
    isEditProfileVisible,
    isEditAddressVisible,
    isLocationModalVisible,
    isChatVisible,
    isSupportVisible,
    isNotificationVisible,
    isOPBookingModalVisible,
    isHomeVisitsModalVisible,
    isConsultModalVisible,
    isMedicineModalVisible,
    isSearchFocused,
    searchQuery,
    activeTab,
    onClose,
  ]);

  // ========================================================
  // LIVE REFRESH & OPD STATUS CARD (CONFIGURABLE 60 TO 120s CYCLE)
  // ========================================================
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(60);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(60);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [opdTokenCurrent, setOpdTokenCurrent] = useState<number>(13);

  const performRefresh = useCallback((targetInterval?: number) => {
    setRefreshing(true);
    setTimeout(() => {
      setOpdTokenCurrent((prev) => (prev >= 15 ? 11 : prev + 1));
      const intervalToUse = targetInterval ?? refreshInterval;
      setRefreshCountdown(intervalToUse);
      const now = new Date();
      setLastUpdatedTime(
        `${now.getHours().toString().padStart(2, '0')}:${now
          .getMinutes()
          .toString()
          .padStart(2, '0')}`
      );
      setRefreshing(false);
    }, 600);
  }, [refreshInterval]);

  const handleSelectInterval = (seconds: number) => {
    setRefreshInterval(seconds);
    setRefreshCountdown(seconds);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          setOpdTokenCurrent((curr) => (curr >= 15 ? 11 : curr + 1));
          const now = new Date();
          setLastUpdatedTime(
            `${now.getHours().toString().padStart(2, '0')}:${now
              .getMinutes()
              .toString()
              .padStart(2, '0')}`
          );
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshInterval]);

  const searchInputRef = useRef<TextInput>(null);

  const notifications = INITIAL_NOTIFICATIONS;
  const activeOrdersCount = orders.filter((o) => o.isActive).length;

  const handleSaveAddress = (newAddress: string) => {
    setCurrentLocation(newAddress);
    setUserProfile((prev) => ({ ...prev, address: newAddress }));
    setIsLiveGpsActive(false);
    Alert.alert(
      '📍 Address Updated',
      `Your healthcare & medicine delivery address has been saved:\n\n${newAddress}`
    );
  };

  // Auto-detect live location on initial mount if available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLiveCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setIsLiveGpsActive(true);
        },
        () => {
          // Keep default coordinates
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const detectLiveLocation = () => {
    setIsDetectingLocation(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLiveCoords({ latitude, longitude });
          setIsLiveGpsActive(true);
          setIsDetectingLocation(false);

          // Hyderabad Geofence/Locality calculation based on coordinates
          let detectedArea = 'Madhapur, Hyderabad, Telangana';
          if (latitude > 17.43 && latitude < 17.46 && longitude > 78.37 && longitude < 78.40) {
            detectedArea = 'Madhapur (HITECH City), Hyderabad';
          } else if (latitude >= 17.41 && latitude <= 17.44 && longitude >= 78.40 && longitude <= 78.43) {
            detectedArea = 'Jubilee Hills, Hyderabad, Telangana';
          } else if (latitude >= 17.40 && latitude <= 17.43 && longitude >= 78.43 && longitude <= 78.46) {
            detectedArea = 'Banjara Hills, Hyderabad, Telangana';
          } else if (latitude >= 17.42 && latitude <= 17.47 && longitude >= 78.33 && longitude <= 78.38) {
            detectedArea = 'Gachibowli, Hyderabad, Telangana';
          } else if (latitude >= 17.47 && latitude <= 17.52 && longitude >= 78.47 && longitude <= 78.52) {
            detectedArea = 'Secunderabad, Hyderabad, Telangana';
          } else {
            detectedArea = `GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (Hyderabad)`;
          }

          setCurrentLocation(detectedArea);
          setIsLocationModalVisible(false);
          Alert.alert(
            '📍 Live Location Detected',
            `Accurate GPS coordinates locked:\n${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E\n\nArea: ${detectedArea}\n5 km healthcare delivery & OP zone enabled!`
          );
        },
        (error) => {
          setIsDetectingLocation(false);
          setCurrentLocation('Madhapur, Hyderabad, Telangana (Live GPS Active)');
          setIsLiveGpsActive(true);
          setIsLocationModalVisible(false);
          Alert.alert(
            '📍 Live Location Synced',
            'Connected to Hyderabad Central GPS grid. Live delivery radius set to 5 km around Madhapur.'
          );
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    } else {
      setTimeout(() => {
        setIsDetectingLocation(false);
        setCurrentLocation('Madhapur, Hyderabad, Telangana (Live GPS)');
        setIsLiveGpsActive(true);
        setIsLocationModalVisible(false);
        Alert.alert(
          '📍 Live Location Locked',
          'Connected to Hyderabad GPS grid (Madhapur - Cyberabad Zone).'
        );
      }, 700);
    }
  };

  const handleLocationPress = () => {
    setIsLocationModalVisible(true);
  };

  const handleCategoryPress = (category: CategoryItem) => {
    if (category.type === 'OP') {
      if (onNavigateToOPBooking) {
        onNavigateToOPBooking();
      } else {
        setSelectedHospitalForOP(null);
        setIsOPBookingModalVisible(true);
      }
      return;
    }
    if (category.type === 'HOME') {
      if (onNavigateToHomeVisits) {
        onNavigateToHomeVisits();
      } else {
        setIsHomeVisitsModalVisible(true);
      }
      return;
    }
    if (category.type === 'CONSULT') {
      setIsConsultModalVisible(true);
      return;
    }
    if (category.type === 'MEDICINE') {
      setIsMedicineModalVisible(true);
      return;
    }

    Alert.alert(
      category.title,
      `Launching service flow for ${category.title} (${category.subtitle}).`
    );
  };

  const handleBannerPress = (banner: PromoBanner) => {
    if (banner.id === 'b2') {
      setIsMedicineModalVisible(true);
      return;
    }
    Alert.alert(banner.title, `${banner.description}\n\nAction: ${banner.ctaText}`);
  };

  // Real-time Dynamic Hyderabad Hospital Search Filtering
  const filteredHospitals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return HYDERABAD_HOSPITALS;

    return HYDERABAD_HOSPITALS.filter((hosp) => {
      const matchName = hosp.name.toLowerCase().includes(q);
      const matchBranch = hosp.branch.toLowerCase().includes(q);
      const matchArea = hosp.area.toLowerCase().includes(q);
      const matchSpecialtyTag = hosp.specialtyTag.toLowerCase().includes(q);
      const matchDepartments = hosp.departments.some((dep) =>
        dep.toLowerCase().includes(q)
      );

      return matchName || matchBranch || matchArea || matchSpecialtyTag || matchDepartments;
    });
  }, [searchQuery]);

  // Real-time Dynamic Hyderabad Medicine Search Filtering
  const filteredMedicines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return HYDERABAD_MEDICINES;

    return HYDERABAD_MEDICINES.filter((med) => {
      const matchName = med.name.toLowerCase().includes(q);
      const matchGeneric = med.genericName.toLowerCase().includes(q);
      const matchCategory = med.category.toLowerCase().includes(q);
      return matchName || matchGeneric || matchCategory;
    });
  }, [searchQuery]);

  // Handle hospital card click or Book OP CTA
  const handleSelectHospital = (hosp: SearchableHospital) => {
    Keyboard.dismiss();
    setIsSearchFocused(false);
    setSearchQuery('');

    if (onNavigateToOPBooking) {
      onNavigateToOPBooking(hosp);
    } else {
      setSelectedHospitalForOP(hosp);
      setIsOPBookingModalVisible(true);
    }
  };

  const handleOrderMedicine = (med: SearchableMedicine) => {
    setIsMedicineModalVisible(true);
  };

  const persistOrder = (newOrder: OrderRecord) => {
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      saveOrders(updated).catch(() => {});
      return updated;
    });
  };

  const handleMedicineOrderPlaced = (order: OrderHistoryItem) => {
    const newOrder: OrderRecord = {
      id: `ord-med-${Date.now()}`,
      category: 'MEDICINE',
      title: `Order ${order.id} • Express Delivery`,
      subtitle: order.items.map((it) => `${it.name} (x${it.qty})`).join(', '),
      meta: `Delivery: ${order.deliveryAddress}`,
      status: 'Dispatched',
      isActive: true,
      dateOrTime: order.date || 'Today, Just now',
      price: `₹${order.total}`,
      actionText: 'Track Delivery',
      itemsSummary: `${order.items.length} items • Express 2-Hr Doorstep`,
      reportData: {
        patientName: userProfile.name,
        patientAgeGender: `${userProfile.age} Y / ${userProfile.gender}`,
        uhid: userProfile.memberId || 'UHID-HYD-882194',
        pharmacyName: 'OneBuddy Express Pharmacy - Central Hub',
        deliveryAddress: order.deliveryAddress,
        riderName: 'David Kumar (+91 98877 66554)',
        riderPhone: '+91 98877 66554',
        medicines: order.items.map((it) => ({
          name: it.name,
          dosage: 'Standard Pack',
          frequency: 'As Prescribed',
          duration: 'Pack',
          price: it.price,
        })),
        paymentMode: 'Online Paid (UPI)',
        subtotal: `₹${order.total}`,
        totalPaid: `₹${order.total}`,
        clinicalNotes: 'Prescription verified and batch verified by registered pharmacist.',
      },
    };
    persistOrder(newOrder);
  };

  const handleOPBookingSuccess = (data: OPBookingData) => {
    const newOrder: OrderRecord = {
      id: `ord-op-${Date.now()}`,
      category: 'OP',
      title: `${data.patientName} (${data.selectedDepartment?.name || 'General OPD'})`,
      subtitle: `${data.selectedHospital?.name || 'Hospital'} • ${data.selectedHospital?.branch || 'Hyderabad'}`,
      meta: `${data.tokenNumber} • Slot: ${data.selectedDate?.dayName || 'Today'}, ${data.selectedSlot?.time || ''} (OP Desk)`,
      status: 'Confirmed',
      isActive: true,
      dateOrTime: `${data.selectedDate?.dayName || 'Today'} at ${data.selectedSlot?.time || 'Scheduled Time'}`,
      price: `₹${data.finalPayableAmount}`,
      actionText: 'View E-Token',
      hospitalName: data.selectedHospital?.name,
      doctorName: data.selectedDepartment?.name,
      reportData: {
        patientName: data.patientName,
        patientAgeGender: `${userProfile.age} Y / ${userProfile.gender}`,
        uhid: `UHID-HYD-${Math.floor(100000 + Math.random() * 900000)}`,
        doctorName: data.selectedDepartment?.name || 'Senior Consultant',
        doctorSpecialty: 'OPD Specialist',
        hospitalName: `${data.selectedHospital?.name} - ${data.selectedHospital?.branch}`,
        roomOrDesk: 'OPD Desk 14, Block A',
        tokenNumber: data.tokenNumber,
        queueAhead: '1 Patient Ahead • Est. wait: ~8 mins',
        paymentMode: 'UPI / Online Paid',
        totalPaid: `₹${data.finalPayableAmount}`,
      },
    };
    persistOrder(newOrder);
  };

  const handleConsultBookingSuccess = (booking: BookingSummary) => {
    const isVideo = booking.mode === 'video';
    const newOrder: OrderRecord = {
      id: `ord-consult-${Date.now()}`,
      category: 'CONSULT',
      title: `Tele-Consultation: ${booking.doctor.name}`,
      subtitle: `${booking.doctor.specialty} • ${isVideo ? 'Video Call' : 'Audio Call'}`,
      meta: `Scheduled for ${booking.date} at ${booking.time} • Meeting Ready`,
      status: 'Scheduled',
      isActive: true,
      dateOrTime: `${booking.date} at ${booking.time}`,
      price: `₹${booking.feeBreakdown.totalAmount}`,
      actionText: '',
      doctorName: booking.doctor.name,
      hospitalName: booking.doctor.hospital || 'OneBuddy Telehealth Network',
      itemsSummary: `Online ${isVideo ? 'Video' : 'Audio'} Consultation • Slot: ${booking.time}`,
      reportData: {
        patientName: booking.patient.fullName || userProfile.name,
        patientAgeGender: `${booking.patient.age || userProfile.age} Yrs / ${booking.patient.gender || userProfile.gender}`,
        uhid: `TEL-UHID-${Math.floor(100000 + Math.random() * 900000)}`,
        doctorName: `${booking.doctor.name}, ${booking.doctor.degrees || 'MBBS'}`,
        doctorSpecialty: booking.doctor.specialty,
        hospitalName: booking.doctor.hospital || 'OneBuddy Telehealth Network',
        symptoms: booking.patient.symptoms || 'General Online Consultation',
        paymentMode: booking.paymentMethod || 'Online Paid',
        subtotal: `₹${booking.feeBreakdown.consultationFee}`,
        deliveryFee: `₹${booking.feeBreakdown.platformFee}`,
        totalPaid: `₹${booking.feeBreakdown.totalAmount}`,
        doctorAdvice: `Please ensure camera & microphone permissions and enter the consultation room at ${booking.time}.`,
        followUpDate: `${booking.date} at ${booking.time}`,
        clinicalNotes: `Telehealth consult booked for ${booking.patient.fullName || userProfile.name}. Booking ID: ${booking.bookingId}. Meeting Link: ${booking.meetingLink}`,
      },
    };
    persistOrder(newOrder);
  };

  const handleHomeVisitBookingSuccess = (booking: HomeVisitBooking) => {
    const newOrder: OrderRecord = {
      id: `ord-home-${Date.now()}`,
      category: 'HOME',
      title: `Home Visit: ${booking.doctor.name}`,
      subtitle: `${booking.doctor.specialty} • ${booking.patient.fullName}`,
      meta: `Scheduled for ${booking.date} (${booking.slot.label}) • ${booking.patient.address}`,
      status: 'Assigned',
      isActive: true,
      dateOrTime: `${booking.date}, ${booking.slot.label}`,
      price: `₹${booking.total}`,
      actionText: 'View Care Schedule',
      doctorName: booking.doctor.name,
      hospitalName: booking.doctor.hospital || 'OneBuddy Home Health Services',
      itemsSummary: `Home Consultation & Examination • ${booking.patient.problem || 'Routine Checkup'}`,
      reportData: {
        patientName: booking.patient.fullName,
        patientAgeGender: `${booking.patient.age} Yrs / ${booking.patient.gender}`,
        uhid: `HV-UHID-${Math.floor(100000 + Math.random() * 900000)}`,
        doctorName: booking.doctor.name,
        doctorSpecialty: booking.doctor.specialty,
        hospitalName: booking.doctor.hospital || 'OneBuddy Home Visits Network',
        nurseName: booking.doctor.name,
        nurseRole: `${booking.doctor.specialty} Specialist`,
        deliveryAddress: booking.patient.address,
        paymentMode: `${booking.paymentMode} (${booking.paymentMode === 'Cash on Visit' ? 'Pay on Visit' : 'Pre-paid'})`,
        subtotal: `₹${booking.consultationFee}`,
        deliveryFee: `₹${booking.platformFee}`,
        totalPaid: `₹${booking.total}`,
        doctorAdvice: 'Professional will arrive with sterile medical kit and digital monitoring equipment.',
        followUpDate: `${booking.date}, ${booking.slot.label}`,
        clinicalNotes: `Reason for home visit: ${booking.patient.problem || 'General medical consultation'}. Contact: ${booking.patient.phone}`,
      },
    };
    persistOrder(newOrder);
  };

  const handleOrderAction = (order: OrderRecord) => {
    if (order.category === 'CONSULT' && order.status === 'Completed') {
      Alert.alert(
        'Prescription Downloaded',
        `Rx-Prescription from ${order.doctorName || 'Doctor'} has been downloaded to your device and synced to your Medical Vault.`
      );
    } else if (order.category === 'MEDICINE') {
      Alert.alert('Live Medicine Tracking', `${order.meta}\nDelivery Partner: Assigned & En Route.`);
    } else if (order.category === 'OP') {
      Alert.alert('Digital E-Token', `${order.title}\n${order.subtitle}\n${order.meta}\n\nShow this token at the hospital reception counter.`);
    } else if (order.category === 'HOME') {
      Alert.alert('Home Visit Instructions', `Phlebotomist: Nurse Priyanka Rao\nArrival Window: Tomorrow 07:00 AM\n${order.itemsSummary || 'Please maintain 10 hours fasting.'}`);
    }
  };

  const isSearchActive = isSearchFocused || searchQuery.trim().length > 0;
  const showHospitals = searchFilterMode === 'ALL' || searchFilterMode === 'HOSPITALS';
  const showMedicines = searchFilterMode === 'ALL' || searchFilterMode === 'MEDICINES';

  return (
    <View style={styles.rootView}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121214" : "#FFFFFF"} />

      {/* Safe Area Header Bar with Hyderabad Location & Logo */}
      <HeaderBar
        location={currentLocation}
        activeCount={activeOrdersCount}
        topInset={insets.top}
        onPressLocation={handleLocationPress}
        onPressNotifications={() => setIsNotificationVisible(true)}
        onClose={onClose}
      />

      {/* Tab Body Content */}
      {activeTab === 'Home' && (
        <View style={styles.homeContainer}>
          <ScrollView
            style={styles.mainScrollView}
            contentContainerStyle={styles.mainScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={FPS_CONFIG.SCROLL_EVENT_THROTTLE}
          >
            {/* Global Search Bar (for Hospitals OP & Medicine Delivery) */}
            <View style={styles.searchSectionWrap}>
              <View
                style={[
                  styles.searchContainer,
                  isSearchFocused && styles.searchContainerFocused,
                ]}
              >
                <Search
                  size={18}
                  color={isSearchFocused ? '#65A30D' : '#64748B'}
                  style={styles.searchIcon}
                />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  placeholder="Search Apollo, Yashoda, Dolo 650, Paracetamol, Cardiology..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    style={styles.clearSearchBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={16} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>

              {/* DYNAMIC SEARCH RESULTS OVERLAY (HOSPITALS & MEDICINE DELIVERY) */}
              {isSearchActive && (
                <View style={styles.searchResultsOverlay}>
                  {/* Results Header */}
                  <View style={styles.searchDropdownHeader}>
                    <View style={styles.searchDropdownTitleRow}>
                      <Building2 size={15} color="#65A30D" />
                      <Text style={styles.searchDropdownTitle}>
                        {searchQuery.trim().length > 0
                          ? `Search Results for "${searchQuery}"`
                          : 'Explore Hospitals & Medicine Delivery'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setIsSearchFocused(false);
                        setSearchQuery('');
                      }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.closeSearchText}>Close</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Search Type Mode Filter Pills */}
                  <View style={styles.searchTypePillRow}>
                    <TouchableOpacity
                      style={[
                        styles.searchTypePill,
                        searchFilterMode === 'ALL' && styles.searchTypePillActive,
                      ]}
                      onPress={() => setSearchFilterMode('ALL')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.searchTypePillText,
                          searchFilterMode === 'ALL' && styles.searchTypePillTextActive,
                        ]}
                      >
                        All ({filteredHospitals.length + filteredMedicines.length})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.searchTypePill,
                        searchFilterMode === 'HOSPITALS' && styles.searchTypePillActive,
                      ]}
                      onPress={() => setSearchFilterMode('HOSPITALS')}
                      activeOpacity={0.7}
                    >
                      <Building2 size={12} color={searchFilterMode === 'HOSPITALS' ? '#4D7C0F' : '#64748B'} style={{ marginRight: 4 }} />
                      <Text
                        style={[
                          styles.searchTypePillText,
                          searchFilterMode === 'HOSPITALS' && styles.searchTypePillTextActive,
                        ]}
                      >
                        Hospitals ({filteredHospitals.length})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.searchTypePill,
                        searchFilterMode === 'MEDICINES' && styles.searchTypePillActive,
                      ]}
                      onPress={() => setSearchFilterMode('MEDICINES')}
                      activeOpacity={0.7}
                    >
                      <Pill size={12} color={searchFilterMode === 'MEDICINES' ? '#4D7C0F' : '#64748B'} style={{ marginRight: 4 }} />
                      <Text
                        style={[
                          styles.searchTypePillText,
                          searchFilterMode === 'MEDICINES' && styles.searchTypePillTextActive,
                        ]}
                      >
                        Medicines ({filteredMedicines.length})
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Hyderabad Suggestions Chips Row */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionChipsScroll}
                  >
                    {HYDERABAD_SEARCH_SUGGESTIONS.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.suggestionChip,
                          searchQuery.toLowerCase() === item.toLowerCase() &&
                            styles.suggestionChipActive,
                        ]}
                        onPress={() => setSearchQuery(item)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.suggestionChipText,
                            searchQuery.toLowerCase() === item.toLowerCase() &&
                              styles.suggestionChipTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Results List */}
                  {filteredHospitals.length === 0 && filteredMedicines.length === 0 ? (
                    <View style={styles.noResultsBox}>
                      <View style={styles.noResultsIconWrap}>
                        <Search size={26} color="#94A3B8" />
                      </View>
                      <Text style={styles.noResultsTitle}>
                        No hospitals or medicines found in Hyderabad.
                      </Text>
                      <Text style={styles.noResultsSub}>
                        Try searching for "Apollo", "Yashoda", "Dolo 650", "Paracetamol", "Madhapur", or "Cardiology".
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.resultsList}>
                      {/* Hospital Results */}
                      {showHospitals && filteredHospitals.map((hospital) => (
                        <TouchableOpacity
                          key={hospital.id}
                          style={styles.hospitalResultCard}
                          onPress={() => handleSelectHospital(hospital)}
                          activeOpacity={0.8}
                        >
                          {/* Top Row: Logo, Name & Rating */}
                          <View style={styles.hospitalCardTop}>
                            <View
                              style={[
                                styles.hospitalLogoBadge,
                                { backgroundColor: hospital.logoBg },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.hospitalLogoText,
                                  { color: hospital.logoColor },
                                ]}
                              >
                                {hospital.logoInitials}
                              </Text>
                            </View>

                            <View style={styles.hospitalHeaderInfo}>
                              <View style={styles.hospitalNameRow}>
                                <Text style={styles.hospitalResultName} numberOfLines={1}>
                                  {hospital.name}
                                </Text>
                              </View>
                              <Text style={styles.hospitalBranchText} numberOfLines={1}>
                                {hospital.branch}
                              </Text>
                            </View>

                            <View style={styles.ratingBadge}>
                              <Star size={11} color="#D97706" fill="#D97706" />
                              <Text style={styles.ratingText}>{hospital.rating}</Text>
                            </View>
                          </View>

                          {/* Middle: Specialty & Distance */}
                          <View style={styles.hospitalMetaPillsRow}>
                            <View style={styles.specialtyPill}>
                              <Stethoscope size={11} color="#65A30D" />
                              <Text style={styles.specialtyPillText}>
                                {hospital.specialtyTag}
                              </Text>
                            </View>

                            <View style={styles.distancePill}>
                              <MapPin size={11} color="#059669" />
                              <Text style={styles.distancePillText}>
                                {hospital.distance}
                              </Text>
                            </View>
                          </View>

                          {/* Discount & Slot Box */}
                          <View style={styles.slotDiscountRow}>
                            <View style={styles.discountBadgeWrap}>
                              <Tag size={12} color="#059669" />
                              <Text style={styles.discountBadgeText}>
                                {hospital.discountBadge}
                              </Text>
                            </View>

                            <View style={styles.nextSlotWrap}>
                              <Clock size={12} color="#475569" />
                              <Text style={styles.nextSlotText}>
                                {hospital.nextAvailableSlot}
                              </Text>
                            </View>
                          </View>

                          {/* Action CTA: Book OP */}
                          <View style={styles.hospitalCardFooter}>
                            <View style={styles.feeInfoCol}>
                              <Text style={styles.feeLabelText}>Consultation from</Text>
                              <Text style={styles.feeAmountText}>₹{hospital.opFee}</Text>
                            </View>

                            <TouchableOpacity
                              style={styles.bookOpCtaBtn}
                              onPress={() => handleSelectHospital(hospital)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.bookOpCtaText}>Book OP</Text>
                              <ArrowRight size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      ))}

                      {/* Medicine Results */}
                      {showMedicines && filteredMedicines.map((med) => (
                        <View key={med.id} style={styles.medicineResultCard}>
                          <View style={styles.medicineCardTop}>
                            <View style={styles.medicineIconBadge}>
                              <Pill size={18} color="#D97706" />
                            </View>
                            <View style={styles.medicineInfoCol}>
                              <Text style={styles.medicineNameText}>{med.name}</Text>
                              <Text style={styles.medicineGenericText}>{med.genericName}</Text>
                              <Text style={styles.medicineCategoryTag}>{med.category} • {med.dosage}</Text>
                            </View>
                          </View>

                          <View style={styles.medicineCardFooter}>
                            <View style={styles.medicinePriceCol}>
                              <View style={styles.priceRow}>
                                <Text style={styles.medPriceText}>₹{med.price}</Text>
                                <Text style={styles.medOriginalPriceText}>₹{med.originalPrice}</Text>
                                <View style={styles.medDiscountTag}>
                                  <Text style={styles.medDiscountTagText}>{med.discount}</Text>
                                </View>
                              </View>
                              <Text style={styles.medDeliveryTimeText}>⚡ {med.deliveryTime}</Text>
                            </View>

                            <TouchableOpacity
                              style={styles.addMedicineBtn}
                              onPress={() => handleOrderMedicine(med)}
                              activeOpacity={0.8}
                            >
                              <Plus size={14} color="#FFFFFF" style={{ marginRight: 2 }} />
                              <Text style={styles.addMedicineBtnText}>Order Now</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* LIVE HOSPITAL & OPD STATUS CARD (60s - 120s CYCLE) */}
            <View style={styles.liveSyncCard}>
              {/* Top Row: Live indicator & Refresh button */}
              <View style={styles.liveSyncHeader}>
                <View style={styles.liveSyncTitleRow}>
                  <View style={styles.liveSyncPulseRing}>
                    <View style={styles.liveSyncPulseDot} />
                  </View>
                  <Text style={styles.liveSyncTitle}>Live Hospital & OPD Status</Text>
                </View>

                {/* Instant Refresh Button */}
                <TouchableOpacity
                  style={styles.refreshActionBtn}
                  onPress={() => performRefresh()}
                  disabled={refreshing}
                  activeOpacity={0.7}
                >
                  <Text style={styles.refreshActionBtnIcon}>{refreshing ? '⏳' : '↻'}</Text>
                  <Text style={styles.refreshActionBtnText}>
                    {refreshing ? 'Refreshing...' : 'Refresh Now'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Middle Row: Live Doctor OPD status with active token */}
              <View style={styles.liveOpdStatusRow}>
                <Text style={styles.liveOpdMainText}>
                  <Text style={{ fontWeight: '800', color: '#13381B' }}>Yashoda OPD: </Text>
                  Dr. Iyer is seeing <Text style={{ fontWeight: '800', color: '#62BA00' }}>Token #{opdTokenCurrent}</Text>
                </Text>
                <Text style={styles.liveOpdSubText}>
                  Your Token: #14 (Est. wait: ~{Math.max(4, (14 - opdTokenCurrent) * 8)} mins)
                </Text>
              </View>

              {/* Progress Bar of Countdown */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(
                        100,
                        Math.max(0, ((refreshInterval - refreshCountdown) / refreshInterval) * 100)
                      )}%`,
                    },
                  ]}
                />
              </View>

              {/* Bottom Row: 60s - 120s Cycle selector & Countdown display */}
              <View style={styles.syncBottomRow}>
                <Text style={styles.countdownText}>
                  ⏱ Auto-refresh in <Text style={{ fontWeight: '800', color: '#13381B' }}>{refreshCountdown}s</Text>
                  <Text style={{ color: '#7E8F83' }}> ({lastUpdatedTime})</Text>
                </Text>

                {/* 60s to 120s Cycle Presets */}
                <View style={styles.intervalPickerRow}>
                  <Text style={styles.intervalLabel}>Cycle:</Text>
                  {[60, 90, 120].map((sec) => {
                    const isActive = refreshInterval === sec;
                    return (
                      <TouchableOpacity
                        key={sec}
                        style={[
                          styles.intervalChip,
                          isActive && styles.intervalChipActive,
                        ]}
                        onPress={() => handleSelectInterval(sec)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.intervalChipText,
                            isActive && styles.intervalChipTextActive,
                          ]}
                        >
                          {sec}s
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Promotional Ad Banners (Hospital Packages & OneBuddy Discounts) */}
            <PromoCarousel
              banners={PROMO_BANNERS}
              onPressBanner={handleBannerPress}
            />

            {/* Core Service Categories (OP, Consult, Home Visits, Medicine) */}
            <CategoryGrid
              categories={CATEGORIES}
              onSelectCategory={handleCategoryPress}
            />

            {/* Consult by Specialty Quick-Carousel (Clean small cards with Consult ->) */}
            <View style={styles.specialtySection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Consult by Specialty</Text>
                <Text style={styles.sectionSubtitle}>Instant video</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.specialtyRow}
              >
                {DOCTOR_SPECIALTIES.map((spec) => {
                  const IconComp = spec.icon;
                  return (
                    <TouchableOpacity
                      key={spec.id}
                      style={styles.specialtyCard}
                      onPress={() => {
                        Alert.alert(
                          'Online Consultation',
                          `Do you want to take consultation through online with a ${spec.name} specialist?`,
                          [
                            {
                              text: 'Cancel',
                              style: 'cancel',
                            },
                            {
                              text: 'Yes, Consult Online',
                              onPress: () => {
                                setIsConsultModalVisible(true);
                              },
                            },
                          ]
                        );
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.specialtyIconWrap, { backgroundColor: spec.bgColor }]}>
                        <IconComp size={22} color={spec.iconColor} strokeWidth={2.2} />
                      </View>
                      <Text style={styles.specialtyName}>{spec.name}</Text>
                      <View style={styles.specialtyCtaRow}>
                        <Text style={styles.specialtyCtaText}>Consult</Text>
                        <Text style={styles.specialtyArrowText}>→</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Help & Support Quick Actions (FAQs & Live Chat) */}
            <HelpSupportSection
              onPressFaq={() => setIsSupportVisible(true)}
              onPressChat={() => setIsChatVisible(true)}
            />

          </ScrollView>
        </View>
      )}

      {/* Orders Tab View (Medicine Orders, OP Bookings, Home Visits, Online Consults) */}
      {activeTab === 'Orders' && (
        <OrdersView
          orders={orders}
          onActionPress={handleOrderAction}
          onViewReport={(order) => setSelectedOrderForReport(order)}
        />
      )}

      {/* Profile Tab View (Editable Details) */}
      {activeTab === 'Profile' && (
        <ProfileView
          user={userProfile}
          onEditProfile={() => setIsEditProfileVisible(true)}
          onEditAddress={() => setIsEditAddressVisible(true)}
        />
      )}

      {/* Safe Area Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabSelect={setActiveTab}
        ordersBadgeCount={activeOrdersCount}
        bottomInset={insets.bottom}
      />

      {/* Location Picker & Live GPS Auto-Detection Modal */}
      <LocationPickerModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        currentLocation={currentLocation}
        onSelectLocation={(loc) => {
          setCurrentLocation(loc);
          setUserProfile((prev) => ({ ...prev, address: loc }));
          setIsLiveGpsActive(false);
        }}
        onDetectLiveGPS={detectLiveLocation}
        onOpenEditAddress={() => setIsEditAddressVisible(true)}
        isDetecting={isDetectingLocation}
      />

      {/* Detailed Edit Address Modal */}
      <EditAddressModal
        visible={isEditAddressVisible}
        onClose={() => setIsEditAddressVisible(false)}
        currentAddress={currentLocation}
        onSaveAddress={handleSaveAddress}
        onDetectLiveGPS={detectLiveLocation}
      />

      {/* Top-Right Notification Modal */}
      <NotificationModal
        visible={isNotificationVisible}
        onClose={() => setIsNotificationVisible(false)}
        items={notifications}
        onSelectNotification={(notif) => {
          setIsNotificationVisible(false);
          const matchedOrder = orders.find((o) => o.category === notif.type);
          if (matchedOrder) {
            setTimeout(() => {
              setSelectedOrderForReport(matchedOrder);
            }, 300);
          }
        }}
      />

      {/* Specific Order & Clinical Report Modal */}
      <OrderReportModal
        visible={selectedOrderForReport !== null}
        order={selectedOrderForReport}
        onClose={() => setSelectedOrderForReport(null)}
      />

      {/* Help & Support FAQ Modal */}
      <SupportModal
        visible={isSupportVisible}
        onClose={() => setIsSupportVisible(false)}
        faqs={FAQ_ITEMS}
        onOpenChat={() => setIsChatVisible(true)}
      />

      {/* 24/7 Live Chat Support Modal */}
      <ChatSupportModal
        visible={isChatVisible}
        onClose={() => setIsChatVisible(false)}
        userName={userProfile.name}
      />

      {/* Edit Profile Modal (Name, Age, Gender, Phone, Address) */}
      <EditProfileModal
        visible={isEditProfileVisible}
        user={userProfile}
        onSave={(updated) => {
          setUserProfile(updated);
          if (updated.address) {
            setCurrentLocation(updated.address);
          }
          setIsEditProfileVisible(false);
        }}
        onClose={() => setIsEditProfileVisible(false)}
      />

      {/* Online Consultation Full-Screen Flow Modal */}
      <OnlineConsultationFlow
        visible={isConsultModalVisible}
        onClose={() => setIsConsultModalVisible(false)}
        onBookingSuccess={handleConsultBookingSuccess}
      />

      {/* Home Visits Full-Screen Flow Modal */}
      <HomeVisitsFlow
        visible={isHomeVisitsModalVisible}
        onClose={() => setIsHomeVisitsModalVisible(false)}
        onBookingSuccess={handleHomeVisitBookingSuccess}
      />

      {/* OP Booking Full-Screen Flow Modal */}
      <OPBookingFlow
        visible={isOPBookingModalVisible}
        initialHospital={selectedHospitalForOP}
        onClose={() => setIsOPBookingModalVisible(false)}
        onBookingSuccess={handleOPBookingSuccess}
      />

      {/* Medicine Delivery Full-Screen Flow Modal */}
      <MedicineDeliveryFlow
        visible={isMedicineModalVisible}
        onClose={() => setIsMedicineModalVisible(false)}
        onOrderPlaced={handleMedicineOrderPlaced}
      />
    </View>
  );
}

// ==========================================
// 5. STYLESHEET
// ==========================================

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  homeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainScrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainScrollContent: {
    paddingBottom: 24,
  },

  // Header Styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  headerLogoWrap: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeftInfo: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandingBlock: {
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  brandTitleHighlight: {
    color: '#7EC400',
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 2.0,
    marginTop: -2,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationIconWrap: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    maxWidth: SCREEN_WIDTH * 0.55,
    marginRight: 4,
  },
  headerLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  notificationBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },

  // User Profile Card Styles
  profileCard: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7FEE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#D9F99D',
  },
  profileIdentity: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 3,
  },
  memberIdText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  profileMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileMetaItem: {
    flex: 1,
  },
  profileMetaLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  profileMetaValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },

  // Search Section & Bar
  searchSectionWrap: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 14,
    position: 'relative',
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchContainerFocused: {
    borderColor: '#7EC400',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#7EC400',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },

  // Dynamic Search Results Dropdown Overlay
  searchResultsOverlay: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D9F99D',
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  searchDropdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  searchDropdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  closeSearchText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#65A30D',
    marginLeft: 8,
  },

  // Suggestions Chips
  suggestionChipsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestionChipActive: {
    backgroundColor: '#F7FEE7',
    borderColor: '#7EC400',
  },
  suggestionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  suggestionChipTextActive: {
    color: '#4D7C0F',
    fontWeight: '700',
  },

  // Results List
  resultsList: {
    gap: 12,
  },
  hospitalResultCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hospitalCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hospitalLogoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  hospitalLogoText: {
    fontSize: 13,
    fontWeight: '800',
  },
  hospitalHeaderInfo: {
    flex: 1,
    marginRight: 8,
  },
  hospitalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalResultName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  hospitalBranchText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  hospitalMetaPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  specialtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FEE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  specialtyPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4D7C0F',
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  distancePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  deptTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  deptTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptTagText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },
  deptTagMore: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deptTagMoreText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  slotDiscountRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  discountBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  nextSlotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextSlotText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  hospitalCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  feeInfoCol: {},
  feeLabelText: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  feeAmountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookOpCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#65A30D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  bookOpCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // No Results State
  noResultsBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  noResultsIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  noResultsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  noResultsSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Section Common
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // Promo Banner Styles
  carouselSection: {
    marginBottom: 20,
  },
  offerBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FEE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  offerBadgeSmallText: {
    fontSize: 10,
    color: '#4D7C0F',
    fontWeight: '600',
    marginLeft: 3,
  },
  carouselContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  bannerCard: {
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    minHeight: 148,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  bannerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTextCol: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  bannerImageWrap: {
    width: 104,
    height: 104,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  paginationDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  paginationDotActive: {
    width: 22,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7EC400',
  },
  bannerTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  bannerTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 19,
  },
  bannerDesc: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 15,
    marginBottom: 10,
  },
  bannerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bannerCtaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 2,
  },

  // Category Grid Styles (2x2)
  categorySection: {
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  gridIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gridBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  gridSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // Help & Support Styles
  helpSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  helpGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  helpCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  helpIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  helpTextWrap: {
    flex: 1,
  },
  helpCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  helpCardSub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },

  // Trust Banner
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: '#F7FEE7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9F99D',
  },
  trustBannerText: {
    fontSize: 11,
    color: '#3F6212',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },

  // Modals (Notification & FAQ)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  notifModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },

  // Report Modal Specific Styles
  reportModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reportModalHeaderLeft: {
    flex: 1,
    paddingRight: 10,
  },
  reportTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
  },
  reportTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reportModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  reportModalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  reportScrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  reportScrollContent: {
    padding: 16,
    gap: 14,
  },
  reportStatusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportStatusLeft: {
    flex: 1,
    gap: 4,
  },
  reportStatusStage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  reportPriceTag: {
    alignItems: 'flex-end',
  },
  reportPriceTagLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  reportPriceTagValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  reportSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  reportSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  reportMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  reportMetaItem: {
    flex: 1,
  },
  reportMetaLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  reportMetaValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '700',
  },
  opdTokenHighlightBox: {
    backgroundColor: '#F7FEE7',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D9F99D',
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  opdHospitalName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  opdDeskInfo: {
    fontSize: 11,
    color: '#65A30D',
    fontWeight: '600',
    marginTop: 2,
  },
  tokenNumberBadge: {
    backgroundColor: '#65A30D',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    marginVertical: 10,
  },
  tokenNumberText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  opdDoctorTitle: {
    fontSize: 13,
    color: '#475569',
  },
  opdSpecialtyText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  opdQueueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  opdQueueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  receiptKey: {
    fontSize: 12,
    color: '#64748B',
  },
  receiptVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  digitalBarcodeWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  barcodeLines: {
    fontSize: 16,
    letterSpacing: 4,
    fontWeight: '900',
    color: '#334155',
  },
  barcodeCaption: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  pharmacyHeaderBox: {
    marginBottom: 12,
  },
  pharmacyName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  deliveryAddrText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 12,
    marginBottom: 14,
  },
  riderTitle: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  riderName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
    marginTop: 1,
  },
  callRiderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callRiderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 4,
  },
  medicinesTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  medTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  medItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  medItemDosage: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  medItemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  billBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 4,
    marginBottom: 10,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  billKey: {
    fontSize: 11,
    color: '#64748B',
  },
  billVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  pharmacyVerificationStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  verificationStampText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
  },
  doctorHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorHeaderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  doctorHeaderSpecialty: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
    marginTop: 1,
  },
  doctorHospitalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  doctorRegBadge: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  doctorRegText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },
  clinicalNotesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 12,
  },
  clinicalNotesHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  clinicalDiagnosisText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  clinicalSymptomsText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  doctorAdviceBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 10,
    marginBottom: 12,
  },
  doctorAdviceText: {
    fontSize: 12,
    color: '#4C1D95',
    lineHeight: 17,
  },
  followUpText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
    marginTop: 8,
  },
  digitalSignatureBox: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    alignItems: 'center',
  },
  digitalSignatureTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  digitalSignatureSubtitle: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  nurseHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nurseHeaderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  nurseHeaderRole: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 1,
  },
  nurseHospitalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  accreditedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  accreditedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  vitalCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 80) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  vitalLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  vitalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  vitalUnit: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  labTestsTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  labTestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  labTestName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  labTestRef: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  labTestResult: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  labTestStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  labTestStatusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  nurseNotesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 12,
  },
  nurseNotesText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  labAccreditationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  labAccreditationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065F46',
  },
  reportActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  reportDownloadBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#65A30D',
    height: 46,
    borderRadius: 12,
  },
  reportDownloadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reportShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 46,
    borderRadius: 12,
  },
  reportShareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  reportCloseFooterBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  reportCloseFooterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
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
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },

  // Notification List inside Modal
  notificationList: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notificationTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notificationDetails: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  notificationItemSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  notificationMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notificationMetaText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    marginLeft: 5,
  },
  notificationBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  notificationTimeText: {
    fontSize: 10,
    color: '#94A3B8',
  },

  // FAQ Modal Inner
  faqScrollView: {
    padding: 16,
  },
  faqCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 12,
    color: '#475569',
    marginTop: 8,
    lineHeight: 18,
  },
  supportContactCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  supportContactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  supportContactSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  callSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#65A30D',
    paddingVertical: 10,
    borderRadius: 8,
  },
  callSupportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },

  // Orders & Profile View Tabs
  tabContentContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    width: '100%',
  },
  ordersScrollContent: {
    paddingBottom: 40,
    width: '100%',
  },
  tabScrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  tabHeaderBox: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  tabHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  tabHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 18,
  },
  ordersList: {
    paddingHorizontal: 16,
    gap: 12,
    width: '100%',
  },
  ordersItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  ordersCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  ordersCardTypeTag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ordersCardStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
  ordersCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  ordersCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 17,
  },
  ordersDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  ordersCardMeta: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },

  // Profile View Tab
  profileTabHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  profileTabLargeAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#65A30D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  profileTabName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedMemberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  verifiedMemberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  profileTabSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  editHeaderIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FEE7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9F99D',
    marginTop: 12,
    gap: 6,
  },
  editHeaderIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4D7C0F',
  },
  profileDetailsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  profileSectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  profileSectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  profileDetailKey: {
    fontSize: 13,
    color: '#64748B',
  },
  profileDetailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  bloodBadgeSmall: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  bloodBadgeSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  passActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FEE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  passActiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4D7C0F',
  },
  editProfileButton: {
    backgroundColor: '#65A30D',
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#65A30D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Edit Profile Modal Styles
  editProfileModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 20,
  },
  editModalScroll: {
    paddingHorizontal: 20,
  },
  editModalContent: {
    paddingTop: 16,
    paddingBottom: 30,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  formInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  formInputWrapError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  formInputIcon: {
    marginRight: 8,
  },
  formInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  formErrorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  genderSelectRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderChip: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderChipActive: {
    backgroundColor: '#F7FEE7',
    borderColor: '#7EC400',
    borderWidth: 1.5,
  },
  genderChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  genderChipTextActive: {
    color: '#4D7C0F',
    fontWeight: '700',
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    minWidth: 46,
    alignItems: 'center',
  },
  bloodChipActive: {
    backgroundColor: '#F7FEE7',
    borderColor: '#7EC400',
    borderWidth: 1.5,
  },
  bloodChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  bloodChipTextActive: {
    color: '#4D7C0F',
  },
  editModalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  saveProfileBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#65A30D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#65A30D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  saveProfileBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Search Type Mode Pills
  searchTypePillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchTypePillActive: {
    backgroundColor: '#F7FEE7',
    borderColor: '#7EC400',
    borderWidth: 1.5,
  },
  searchTypePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  searchTypePillTextActive: {
    color: '#4D7C0F',
    fontWeight: '700',
  },

  // Medicine Results Card in Search
  medicineResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  medicineCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  medicineIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  medicineInfoCol: {
    flex: 1,
  },
  medicineNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  medicineGenericText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  medicineCategoryTag: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 3,
  },
  medicineCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  medicinePriceCol: {},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  medPriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  medOriginalPriceText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  medDiscountTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  medDiscountTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  medDeliveryTimeText: {
    fontSize: 10,
    color: '#65A30D',
    fontWeight: '600',
    marginTop: 2,
  },
  addMedicineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#65A30D',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addMedicineBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Notification Modal Filters
  notifFilterWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notifFilterScrollView: {
    flexGrow: 0,
  },
  notifFilterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  notifFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifFilterChipActive: {
    backgroundColor: '#F7FEE7',
    borderColor: '#7EC400',
    borderWidth: 1.5,
  },
  notifFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  notifFilterTextActive: {
    color: '#4D7C0F',
    fontWeight: '700',
  },
  notifFlatList: {
    flex: 1,
  },
  emptyNotifBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyNotifText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Support Chat Banner in FAQ
  supportChatBanner: {
    backgroundColor: '#F7FEE7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D9F99D',
    marginBottom: 16,
  },
  supportChatBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  supportChatBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3F6212',
  },
  supportChatBannerSub: {
    fontSize: 11,
    color: '#4D7C0F',
    marginTop: 1,
  },
  startChatCtaBtn: {
    backgroundColor: '#65A30D',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  startChatCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Live Chat Modal
  chatModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#65A30D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  chatAgentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  onlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  onlineStatusText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  chatScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatScrollContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },
  chatBubbleWrap: {
    maxWidth: '82%',
  },
  chatBubbleUserWrap: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  chatBubbleBotWrap: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  chatBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  chatBubbleUser: {
    backgroundColor: '#65A30D',
    borderBottomRightRadius: 4,
  },
  chatBubbleBot: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatBubbleUserText: {
    color: '#FFFFFF',
  },
  chatBubbleBotText: {
    color: '#0F172A',
  },
  chatTimeText: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 3,
    paddingHorizontal: 4,
  },
  quickPromptsWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  quickPromptHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  quickPromptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickPromptChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quickPromptChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  chatTextInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chatSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#65A30D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },

  // Orders Tab Filter & Custom Badges
  ordersFilterWrapper: {
    marginBottom: 14,
  },
  ordersFilterScrollView: {
    flexGrow: 0,
  },
  ordersFilterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  orderFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  orderFilterChipActive: {
    backgroundColor: '#F7FEE7',
    borderColor: '#7EC400',
    borderWidth: 1.5,
  },
  orderFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  orderFilterTextActive: {
    color: '#4D7C0F',
    fontWeight: '700',
  },
  orderCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 1,
  },
  orderStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  activeStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  reportActiveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3.5,
    alignSelf: 'flex-start',
  },
  reportActiveStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  reportActiveStatusText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  orderMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  orderCardFooter: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 2,
  },
  orderFooterInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  orderDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  orderDateText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  orderPriceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  orderPriceLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  orderPriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  viewReportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FEE7',
    borderWidth: 1,
    borderColor: '#D9F99D',
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 9,
    minHeight: 38,
  },
  viewReportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4D7C0F',
  },
  orderActionBtn: {
    flex: 1.25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#65A30D',
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 9,
    minHeight: 38,
  },
  orderActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 2,
  },
  emptyOrdersBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyOrdersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  emptyOrdersSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Bottom Navigation Bar Styles
  bottomNavContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 60,
    position: 'relative',
  },
  navItemText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 3,
  },
  navItemTextActive: {
    color: '#65A30D',
    fontWeight: '700',
  },
  navBadge: {
    position: 'absolute',
    top: -3,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  navBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },

  // Live Location Strip on Home Page
  liveLocationStrip: {
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F7FEE7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9F99D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#65A30D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  liveLocationLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  livePulseDotWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  livePulseRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#BBF7D0',
    opacity: 0.8,
  },
  livePulseDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#16A34A',
  },
  liveTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3F6212',
    letterSpacing: 0.6,
  },
  liveAccuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    gap: 3,
  },
  liveAccuracyText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  liveAddressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16,
  },
  liveRadiusSub: {
    fontSize: 10,
    color: '#4D7C0F',
    fontWeight: '500',
    marginTop: 2,
  },
  refreshGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BEF264',
    gap: 4,
  },
  refreshGpsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4D7C0F',
  },

  // Location Picker Modal Styles
  locationModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 16,
  },
  liveGpsActionWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  detectLiveGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7FEE7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#84CC16',
  },
  detectLiveGpsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  gpsPulseIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFCCB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D9F99D',
  },
  liveGpsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detectLiveGpsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2E05',
  },
  liveBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    gap: 3,
  },
  liveGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
  },
  liveBadgeSmallText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  detectLiveGpsSub: {
    fontSize: 11,
    color: '#4D7C0F',
    fontWeight: '500',
    marginTop: 2,
  },
  locSearchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locSearchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    paddingVertical: 0,
  },
  locListScroll: {
    maxHeight: 380,
  },
  locListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  locSectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  locItemCardSelected: {
    backgroundColor: '#F7FEE7',
    borderColor: '#84CC16',
  },
  locItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  locPinWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locPinWrapSelected: {
    backgroundColor: '#ECFCCB',
  },
  locItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  locItemNameSelected: {
    color: '#365314',
  },
  locItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  locItemRight: {
    alignItems: 'flex-end',
  },
  locDistanceText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Live Location Action Buttons Row
  liveActionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BEF264',
    gap: 4,
  },
  editAddressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4D7C0F',
  },

  // Custom Address Quick Button in Location Modal
  customAddressQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  customAddressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  customAddressIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7FEE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAddressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  customAddressSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },

  // Detailed Edit Address Modal Styles
  editAddressModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 16,
  },
  editAddressScroll: {
    maxHeight: 520,
  },
  editAddressScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  tagSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  tagChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagChipActive: {
    backgroundColor: '#F7FEE7',
    borderColor: '#84CC16',
    borderWidth: 1.5,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tagChipTextActive: {
    color: '#365314',
    fontWeight: '700',
  },
  gpsAutoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FEE7',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9F99D',
    marginBottom: 14,
    gap: 6,
  },
  gpsAutoFillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4D7C0F',
  },

  // Profile Address Row
  addressRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inlineEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FEE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9F99D',
    gap: 3,
  },
  inlineEditBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4D7C0F',
  },
  profileAddressVal: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
    lineHeight: 17,
  },
  locationChevron: {
    fontSize: 16,
    color: '#7E8F83',
    fontWeight: '700',
    marginLeft: 1,
    lineHeight: 18,
  },

  // LIVE REFRESH & OPD SYNC CARD (60s - 120s CYCLE)
  liveSyncCard: {
    backgroundColor: '#EDF8E9',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D5EBD1',
  },
  liveSyncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  liveSyncTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveSyncPulseRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveSyncPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  liveSyncTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#13381B',
  },
  refreshActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C9E4C5',
  },
  refreshActionBtnIcon: {
    fontSize: 12,
    fontWeight: '900',
    color: '#62BA00',
  },
  refreshActionBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#13381B',
  },
  liveOpdStatusRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  liveOpdMainText: {
    fontSize: 12,
    color: '#111812',
  },
  liveOpdSubText: {
    fontSize: 10.5,
    color: '#55755A',
    marginTop: 2,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(98, 186, 0, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#62BA00',
    borderRadius: 2,
  },
  syncBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  countdownText: {
    fontSize: 10.5,
    color: '#2C3A2F',
    fontWeight: '600',
  },
  intervalPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  intervalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#55755A',
    marginRight: 2,
  },
  intervalChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5EBD1',
  },
  intervalChipActive: {
    backgroundColor: '#62BA00',
    borderColor: '#62BA00',
  },
  intervalChipText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#55755A',
  },
  intervalChipTextActive: {
    color: '#FFFFFF',
  },

  // CONSULT BY SPECIALTY
  specialtySection: {
    marginBottom: 20,
  },
  specialtyRow: {
    gap: 12,
    paddingHorizontal: 16,
    paddingRight: 8,
  },
  specialtyCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 130,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  specialtyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  specialtyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  specialtyCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specialtyCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#65A30D',
  },
  specialtyArrowText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#65A30D',
    marginTop: -1,
  },
});
