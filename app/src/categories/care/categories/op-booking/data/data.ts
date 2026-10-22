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
// 2. BACKEND CARE DATASETS
// ==========================================
// Hardcoded fields have been removed and moved to backend functions/src/care.
// Hospitals are fetched dynamically from the backend care service.
export const HOSPITALS: Hospital[] = [];

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

/**
 * Fetches hospitals dynamically from the Firebase backend.
 * Falls back to local datasets if offline.
 */
export async function fetchHospitalsFromBackend(): Promise<Hospital[]> {
  try {
    const { careService } = await import('@/firebase');
    const fetched = await careService.fetchHospitals('hyderabad');
    if (fetched && fetched.length > 0) {
      return fetched.map((h: any) => ({
        id: h.id,
        name: h.name,
        branch: typeof h.address === 'string' ? h.address : (h.address?.area || h.address?.line1 || ''),
        address: typeof h.address === 'string' ? h.address : `${h.address?.line1 || ''}, ${h.address?.area || ''}, ${h.address?.city || ''}`,
        rating: typeof h.rating === 'number' ? h.rating : 0,
        departments: Array.isArray(h.departments) ? h.departments : (Array.isArray(h.services) ? h.services : []),
        consultationFee: h.opFee || h.consultationFee || 0,
        distance: h.distance || '',
        imageUrl: h.coverImagePath || h.imageUrl || '',
        description: h.description || '',
        opFee: h.opFee || 0,
      }));
    }
  } catch (err) {
    console.warn('[op-booking data] Backend fetch error:', err);
  }
  return HOSPITALS;
}

