import {
  ServiceCategory,
  SubService,
  OfferBanner,
  Address,
  PaymentOption,
  ServiceProvider,
  StageInfo,
  TimeSlot,
  DayOption,
  BookingDetails,
} from '../types';

export const SERVICE_CATEGORIES: ServiceCategory[] = [];

export const SUB_SERVICES: SubService[] = [];

export const OFFER_BANNERS: OfferBanner[] = [];

export const SAVED_ADDRESSES: Address[] = [];

export const PAYMENT_METHODS: PaymentOption[] = [
  {
    id: 'gpay',
    name: 'Google Pay (UPI)',
    icon: 'Smartphone',
    subtitle: 'Instant UPI confirmation with Google Pay app',
    badge: 'Recommended',
  },
  {
    id: 'phonepe',
    name: 'PhonePe UPI',
    icon: 'SmartphoneNfc',
    subtitle: 'Fast and secure UPI payment via PhonePe',
  },
  {
    id: 'paytm',
    name: 'Paytm Wallet & UPI',
    icon: 'CreditCard',
    subtitle: 'Pay via Paytm UPI or Wallet balance',
  },
  {
    id: 'upi_id',
    name: 'Enter UPI ID / VPA',
    icon: 'AtSign',
    subtitle: 'Any UPI ID (e.g., yourname@oksbi)',
  },
  {
    id: 'pay_on_visit',
    name: 'Pay After Service',
    icon: 'Banknote',
    subtitle: 'Pay via Cash or UPI QR to professional upon completion',
    badge: 'Zero Advance',
  },
];

export const MOCK_PROVIDERS: ServiceProvider[] = [];

export const TRACKING_STAGES: StageInfo[] = [
  {
    key: 'CONFIRMED',
    label: 'Booking Confirmed',
    description: 'Your request has been placed in our automated queue.',
    icon: 'CheckCircle2',
    color: '#10B981',
  },
  {
    key: 'ASSIGNED',
    label: 'Professional Assigned',
    description: 'Expert verified technician assigned to your location.',
    icon: 'UserCheck',
    color: '#6366F1',
  },
  {
    key: 'EN_ROUTE',
    label: 'Professional En Route',
    description: 'Technician is travelling towards your address.',
    icon: 'Navigation',
    color: '#0284C7',
  },
  {
    key: 'ARRIVED',
    label: 'Professional Arrived',
    description: 'Technician reached your doorstep. Please share the 4-digit OTP.',
    icon: 'MapPin',
    color: '#F59E0B',
  },
  {
    key: 'IN_PROGRESS',
    label: 'Service In Progress',
    description: 'Your scheduled service is being performed with care.',
    icon: 'Wrench',
    color: '#8B5CF6',
  },
  {
    key: 'COMPLETED',
    label: 'Service Completed',
    description: 'Job finished! Review and rate your professional experience.',
    icon: 'PartyPopper',
    color: '#10B981',
  },
];

export const TIME_SLOTS: TimeSlot[] = [
  // Morning
  { id: 'ts-m1', timeRange: '08:00 AM - 09:30 AM', period: 'Morning', available: true },
  { id: 'ts-m2', timeRange: '09:30 AM - 11:00 AM', period: 'Morning', available: true },
  { id: 'ts-m3', timeRange: '11:00 AM - 12:30 PM', period: 'Morning', available: true },
  
  // Afternoon
  { id: 'ts-a1', timeRange: '01:00 PM - 02:30 PM', period: 'Afternoon', available: true },
  { id: 'ts-a2', timeRange: '02:30 PM - 04:00 PM', period: 'Afternoon', available: true },
  { id: 'ts-a3', timeRange: '04:00 PM - 05:30 PM', period: 'Afternoon', available: true },

  // Evening
  { id: 'ts-e1', timeRange: '06:00 PM - 07:30 PM', period: 'Evening', available: true },
  { id: 'ts-e2', timeRange: '07:30 PM - 09:00 PM', period: 'Evening', available: true },
];

export const getUpcomingDays = (): DayOption[] => {
  const days: DayOption[] = [];
  const today = new Date();
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < 7; i++) {
    const current = new Date(today);
    current.setDate(today.getDate() + i);

    const dayName = dayNames[current.getDay()];
    const dayNumber = String(current.getDate()).padStart(2, '0');
    const monthName = monthNames[current.getMonth()];
    const fullDate = `${dayName}, ${dayNumber} ${monthName}`;

    days.push({
      id: `day-${i}`,
      dayName,
      dayNumber,
      monthName,
      fullDate,
      isToday: i === 0,
      isTomorrow: i === 1,
    });
  }

  return days;
};

export const REVIEW_TAGS = [
  'Punctual Service',
  'Clean & Neat Work',
  'Polite & Courteous',
  'Technical Expert',
  'Great Value',
  'Proper Safety Gear',
  'Quick Resolution',
];

/**
 * Checks if a scheduled booking date and slot end-time has already passed current real-time.
 * If NOT passed, it stays in the Ongoing category.
 */
export const isBookingSlotPast = (booking: BookingDetails): boolean => {
  if (!booking?.date || !booking?.timeSlot) return false;

  try {
    const now = new Date();

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let monthIdx = -1;
    if (booking.date.monthName) {
      monthIdx = monthNames.findIndex(
        (m) => m.toLowerCase() === booking.date.monthName.toLowerCase().slice(0, 3)
      );
    }

    let dayNum = booking.date.dayNumber ? parseInt(booking.date.dayNumber, 10) : NaN;

    if (isNaN(dayNum) || monthIdx === -1) {
      if (booking.date.fullDate) {
        const parts = booking.date.fullDate.replace(/,/g, '').split(' ');
        for (const p of parts) {
          const parsed = parseInt(p, 10);
          if (!isNaN(parsed) && isNaN(dayNum)) {
            dayNum = parsed;
          }
          const mIdx = monthNames.findIndex((m) => m.toLowerCase() === p.toLowerCase().slice(0, 3));
          if (mIdx !== -1 && monthIdx === -1) {
            monthIdx = mIdx;
          }
        }
      }
    }

    if (isNaN(dayNum) || monthIdx === -1) {
      if (booking.bookingCreatedAt) {
        const created = new Date(booking.bookingCreatedAt);
        dayNum = created.getDate();
        monthIdx = created.getMonth();
      } else {
        return booking.stage === 'COMPLETED';
      }
    }

    let year = now.getFullYear();
    if (booking.bookingCreatedAt) {
      const createdYear = new Date(booking.bookingCreatedAt).getFullYear();
      if (!isNaN(createdYear)) year = createdYear;
    }

    // Parse time range end time e.g. "08:00 AM - 09:30 AM" or "02:30 PM - 04:00 PM"
    const timeRange = booking.timeSlot.timeRange || '';
    const parts = timeRange.split(' - ');
    const endTimeStr = (parts.length > 1 ? parts[1] : parts[0]).trim();

    const timeMatches = endTimeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    let hours = 18;
    let mins = 0;
    if (timeMatches) {
      hours = parseInt(timeMatches[1], 10);
      mins = parseInt(timeMatches[2], 10);
      const meridiem = (timeMatches[3] || '').toUpperCase();
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
    }

    const slotEndTime = new Date(year, monthIdx, dayNum, hours, mins, 0, 0);

    return now.getTime() > slotEndTime.getTime();
  } catch {
    return false;
  }
};
