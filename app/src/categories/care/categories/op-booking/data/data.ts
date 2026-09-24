export type PatientType = 'New' | 'FollowUp';
export type BookingFor = 'Self' | 'Family';
export type Gender = 'Male' | 'Female' | 'Other';
export type SlotSession = 'Morning' | 'Afternoon' | 'Evening';

export interface Hospital {
  id: string;
  name: string;
  branch: string;
  address: string;
  rating: number;
  departments: string[];
  consultationFee: number;
  distance?: string;
  imageUrl?: string;
  description?: string;
  opFee?: number;
}

export interface TimeSlot {
  id: string;
  time: string;
  session: SlotSession;
  isAvailable: boolean;
}

export interface DepartmentItem {
  id: string;
  name: string;
  description: string;
  iconBg: string;
}

export interface DateOption {
  dateString: string; // 'YYYY-MM-DD'
  dayName: string;   // 'Mon', 'Tue'
  dayNumber: string; // '15', '16'
  monthName: string; // 'Sep'
}

export interface OPBookingData {
  // Patient Details
  bookingFor: BookingFor;
  patientType: PatientType;
  uhid: string;
  patientName: string;
  age: string;
  dob: string;
  gender: Gender;
  mobileNumber: string;
  reason: string;

  // Hospital & Department
  selectedHospital: Hospital | null;
  selectedDepartment: DepartmentItem | null;

  // Slot Selection
  selectedDate: DateOption | null;
  selectedSlot: TimeSlot | null;

  // Pricing & Coupon
  registrationFee: number;
  consultationFee: number;
  discountAmount: number;
  couponCode: string;
  finalPayableAmount: number;

  // Generated Details
  tokenNumber: string;
  appointmentId: string;
  bookingTimestamp: string;
}

export interface FormErrors {
  bookingFor?: string;
  patientType?: string;
  gender?: string;
  uhid?: string;
  patientName?: string;
  age?: string;
  mobileNumber?: string;
  reason?: string;
  hospital?: string;
  department?: string;
  date?: string;
  slot?: string;
}

// ==========================================
// 2. MOCK DATASETS
// ==========================================
export const HOSPITALS: Hospital[] = [
  {
    id: 'hyd-1',
    name: 'Apollo Hospitals',
    branch: 'Jubilee Hills, Hyderabad',
    address: 'Road No. 72, Opp. Bharatiya Vidya Bhavan, Jubilee Hills, Hyderabad',
    rating: 4.9,
    departments: ['ENT'],
    consultationFee: 800,
    distance: '1.2 km away',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=300&q=80',
    description: 'Premier hospital focusing on Ear, Nose & Throat care.',
  },
  {
    id: 'hyd-2',
    name: 'Yashoda Hospitals',
    branch: 'HITECH City / Madhapur, Hyderabad',
    address: 'Survey No. 64, Hitec City Main Rd, Near Mindspace, Madhapur, Hyderabad',
    rating: 4.9,
    departments: ['Cardiology'],
    consultationFee: 900,
    distance: '3.5 km away',
    imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=300&q=80',
    description: 'Specialized facility for heart related problems and cardiac care.',
  },
  {
    id: 'hyd-3',
    name: 'Care Hospitals',
    branch: 'Banjara Hills, Hyderabad',
    address: 'Road No. 1, Prem Nagar, Banjara Hills, Hyderabad',
    rating: 4.8,
    departments: ['General Physician'],
    consultationFee: 500,
    distance: '5.0 km away',
    imageUrl: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=300&q=80',
    description: 'Dedicated to routine checkups and general physician consultations.',
  },
  {
    id: 'hyd-4',
    name: 'Continental Hospitals',
    branch: 'Gachibowli Financial District, Hyderabad',
    address: 'Plot No. 3, Road No. 2, IT & Financial District, Nanakramguda, Gachibowli',
    rating: 4.8,
    departments: ['Vaccination'],
    consultationFee: 400,
    distance: '6.2 km away',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=300&q=80',
    description: 'Specialized center for immunization and vaccination services.',
  },
  {
    id: 'hyd-5',
    name: 'KIMS Hospitals',
    branch: 'Secunderabad, Hyderabad',
    address: '1-8-31/1, Minister Road, Krishna Nagar Colony, Secunderabad',
    rating: 4.7,
    departments: ['Cardiology', 'Orthopedics', 'General Physician', 'Pediatrics', 'ENT', 'Vaccination', 'Gynecology', 'Neurology', 'Dermatology'],
    consultationFee: 600,
    distance: '8.4 km away',
    imageUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=300&q=80',
    description: 'Renowned multi-specialty hospital providing comprehensive healthcare across all departments.',
  },
  {
    id: 'hyd-6',
    name: 'AIG Hospitals',
    branch: 'Gachibowli / Mindspace, Hyderabad',
    address: '1-66/AIG/1 to 5, Mindspace Road, Gachibowli, Hyderabad',
    rating: 4.9,
    departments: ['Gynecology'],
    consultationFee: 700,
    distance: '10.1 km away',
    imageUrl: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=300&q=80',
    description: 'Dedicated center for women\'s health and gynecology.',
  },
  {
    id: 'hyd-7',
    name: 'Rainbow Children’s Hospital',
    branch: 'Banjara Hills & Kondapur, Hyderabad',
    address: 'Road No. 2, Banjara Hills / Botanical Garden Rd, Kondapur, Hyderabad',
    rating: 4.9,
    departments: ['Pediatrics'],
    consultationFee: 550,
    distance: '11.5 km away',
    imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=300&q=80',
    description: 'Specialized healthcare dedicated entirely to baby care and pediatrics.',
  },
  {
    id: 'hyd-8',
    name: 'Yashoda Hospitals',
    branch: 'Somajiguda, Hyderabad',
    address: 'Alexander Rd, Raj Bhavan Rd, Matha Nagar, Somajiguda, Hyderabad',
    rating: 4.8,
    departments: ['Orthopedics'],
    consultationFee: 650,
    distance: '12.0 km away',
    imageUrl: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=300&q=80',
    description: 'Advanced medical facilities specializing in bone related treatments and orthopedics.',
  },
];

export const DEPARTMENTS: DepartmentItem[] = [
  { id: 'dep-1', name: 'General Physician', description: 'Fever, Cold, General Health', iconBg: '#EFF6FF' },
  { id: 'dep-2', name: 'Cardiology', description: 'Heart, Blood Pressure, ECG', iconBg: '#FEE2E2' },
  { id: 'dep-3', name: 'Orthopedics', description: 'Bones, Joints, Knee Pain', iconBg: '#FEF3C7' },
  { id: 'dep-4', name: 'Dermatology', description: 'Skin, Hair, Acne & Allergy', iconBg: '#F3E8FF' },
  { id: 'dep-5', name: 'Pediatrics', description: 'Baby Care & Child Health', iconBg: '#ECFDF5' },
  { id: 'dep-6', name: 'Neurology', description: 'Brain, Nerves, Migraine', iconBg: '#E0E7FF' },
  { id: 'dep-7', name: 'ENT', description: 'Ear, Nose & Throat Disorders', iconBg: '#FCE7F3' },
  { id: 'dep-8', name: 'Vaccination', description: 'Immunization & Vaccines', iconBg: '#FEF08A' },
  { id: 'dep-9', name: 'Gynecology', description: 'Women Health & Pregnancy', iconBg: '#FBCFE8' },
];

// Generate next 7 days for horizontal date selector
export const generateDateOptions = (): DateOption[] => {
  const days: DateOption[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);

    days.push({
      dateString: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : dayNames[d.getDay()],
      dayNumber: String(d.getDate()).padStart(2, '0'),
      monthName: monthNames[d.getMonth()],
    });
  }
  return days;
};

export const TIME_SLOTS: TimeSlot[] = [
  // Morning
  { id: 's1', time: '09:00 AM', session: 'Morning', isAvailable: true },
  { id: 's2', time: '09:30 AM', session: 'Morning', isAvailable: true },
  { id: 's3', time: '10:00 AM', session: 'Morning', isAvailable: true },
  { id: 's4', time: '10:30 AM', session: 'Morning', isAvailable: true },
  { id: 's5', time: '11:15 AM', session: 'Morning', isAvailable: true },
  { id: 's6', time: '11:45 AM', session: 'Morning', isAvailable: true },

  // Afternoon
  { id: 's7', time: '01:00 PM', session: 'Afternoon', isAvailable: true },
  { id: 's8', time: '01:45 PM', session: 'Afternoon', isAvailable: true },
  { id: 's9', time: '02:30 PM', session: 'Afternoon', isAvailable: true },
  { id: 's10', time: '03:15 PM', session: 'Afternoon', isAvailable: true },

  // Evening
  { id: 's11', time: '04:30 PM', session: 'Evening', isAvailable: true },
  { id: 's12', time: '05:15 PM', session: 'Evening', isAvailable: true },
  { id: 's13', time: '06:00 PM', session: 'Evening', isAvailable: true },
  { id: 's14', time: '06:45 PM', session: 'Evening', isAvailable: true },
  { id: 's15', time: '07:30 PM', session: 'Evening', isAvailable: true },
];
