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

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'house_cleaning',
    title: 'House Cleaning',
    subtitle: 'Deep cleaning, dusting & disinfection',
    icon: 'Sparkles',
    color: '#6366F1',
    gradient: ['#6366F1', '#4F46E5'],
    badge: 'Popular',
    rating: 4.85,
    reviewCount: 1240,
  },
  {
    id: 'plumbing_services',
    title: 'Plumbing Services',
    subtitle: 'Leaks, pipes, fittings & drainage',
    icon: 'Wrench',
    color: '#0284C7',
    gradient: ['#0284C7', '#0369A1'],
    badge: 'Fast 30m',
    rating: 4.9,
    reviewCount: 980,
  },
  {
    id: 'ac_services',
    title: 'AC Services',
    subtitle: 'Repair, jet service & installation',
    icon: 'Wind',
    color: '#0D9488',
    gradient: ['#0D9488', '#0F766E'],
    badge: '₹499 Starting',
    rating: 4.88,
    reviewCount: 1560,
  },
  {
    id: 'water_services',
    title: 'Water Services',
    subtitle: 'Purifiers, RO, tanks & pump repair',
    icon: 'Droplets',
    color: '#2563EB',
    gradient: ['#2563EB', '#1D4ED8'],
    badge: 'Certified',
    rating: 4.82,
    reviewCount: 840,
  },
];

export const SUB_SERVICES: SubService[] = [
  // House Cleaning
  {
    id: 'hc-1',
    categoryId: 'house_cleaning',
    title: 'Full House Deep Cleaning',
    description: 'Complete top-to-bottom scrub, sanitization of 2BHK/3BHK rooms, balconies and floor polish.',
    price: 1899,
    originalPrice: 2499,
    discountBadge: '24% OFF',
    estimatedTime: '3.5 - 4.5 hrs',
    iconName: 'Home',
    popular: true,
    features: ['Eco-friendly chemicals', 'Machine floor buffing', 'Stain removal guarantee', 'Disinfection included'],
    rating: 4.9,
    reviewsCount: 650,
  },
  {
    id: 'hc-2',
    categoryId: 'house_cleaning',
    title: 'Intensive Kitchen Cleaning',
    description: 'Degreasing chimney, stovetop, cabinets, tiles, exhaust fan and sink sanitation.',
    price: 799,
    originalPrice: 999,
    discountBadge: '20% OFF',
    estimatedTime: '1.5 - 2 hrs',
    iconName: 'Utensils',
    popular: true,
    features: ['Tough grease removal', 'Cabinet internal wipe', 'Tiles de-scaling'],
    rating: 4.85,
    reviewsCount: 420,
  },
  {
    id: 'hc-3',
    categoryId: 'house_cleaning',
    title: 'Bathroom Deep Sanitization',
    description: 'Hard water stain removal from tiles, toilet bowl, taps, mirror and drain unclogging.',
    price: 499,
    originalPrice: 699,
    discountBadge: '₹200 OFF',
    estimatedTime: '45 - 60 mins',
    iconName: 'Bath',
    features: ['Acid-free safe chemicals', 'Mirror polish', 'Odor neutralization'],
    rating: 4.8,
    reviewsCount: 380,
  },
  {
    id: 'hc-4',
    categoryId: 'house_cleaning',
    title: 'Sofa & Fabric Shampooing',
    description: 'Deep vacuuming, foam scrub and moisture extraction for up to 5-seater sofa.',
    price: 699,
    originalPrice: 899,
    estimatedTime: '1 - 1.5 hrs',
    iconName: 'Armchair',
    features: ['Quick-dry extraction', 'Fabric safe organic shampoo', 'Dust mite extraction'],
    rating: 4.92,
    reviewsCount: 290,
  },
  {
    id: 'hc-5',
    categoryId: 'house_cleaning',
    title: 'Floor Scrubbing & Polishing',
    description: 'High-speed single disc machine buffing for marble, vitrified and mosaic floors.',
    price: 999,
    originalPrice: 1299,
    estimatedTime: '2 hrs',
    iconName: 'Layers',
    features: ['Gloss restoration', 'Grout line cleaning', 'Protective wax seal'],
    rating: 4.75,
    reviewsCount: 160,
  },

  // Plumbing Services
  {
    id: 'pl-1',
    categoryId: 'plumbing_services',
    title: 'Tap & Mixer Repair / Replacement',
    description: 'Fixing drippy faucets, loose spindle, leaking mixer taps or new tap fitting.',
    price: 249,
    originalPrice: 349,
    discountBadge: 'Popular',
    estimatedTime: '30 mins',
    iconName: 'Wrench',
    popular: true,
    features: ['Teflon seal check', 'Pressure test', '30-day rework warranty'],
    rating: 4.91,
    reviewsCount: 510,
  },
  {
    id: 'pl-2',
    categoryId: 'plumbing_services',
    title: 'Pipe Leakage & Joint Repair',
    description: 'Concealed or exposed PVC/CPVC pipe crack sealing and joint refitting.',
    price: 399,
    originalPrice: 499,
    estimatedTime: '45 - 60 mins',
    iconName: 'AlertCircle',
    popular: true,
    features: ['Non-invasive leak test', 'High-pressure sealants', 'Corrosion inspection'],
    rating: 4.86,
    reviewsCount: 340,
  },
  {
    id: 'pl-3',
    categoryId: 'plumbing_services',
    title: 'Sink & Washbasin Unclogging',
    description: 'Drain snake cleaning, bottle trap replacement and anti-clog treatment.',
    price: 349,
    originalPrice: 449,
    estimatedTime: '30 - 45 mins',
    iconName: 'Filter',
    features: ['Complete blockage clearance', 'Odor-trap check', 'Drain sanitized'],
    rating: 4.88,
    reviewsCount: 290,
  },
  {
    id: 'pl-4',
    categoryId: 'plumbing_services',
    title: 'Toilet Flush & Commode Repair',
    description: 'Fixing cistern leakage, internal flush valve replacement or silicone base sealing.',
    price: 449,
    originalPrice: 599,
    estimatedTime: '45 mins',
    iconName: 'Settings',
    features: ['Syphon kit replacement', 'Water overflow fix', 'Hygiene handling'],
    rating: 4.78,
    reviewsCount: 220,
  },
  {
    id: 'pl-5',
    categoryId: 'plumbing_services',
    title: 'Water Tank Pipeline & Valves',
    description: 'Ball valve replacement, float valve setup, bypass connection & main inlet check.',
    price: 599,
    originalPrice: 799,
    estimatedTime: '1 - 1.5 hrs',
    iconName: 'Sliders',
    features: ['Brass / PVC valve replacement', 'Air-lock removal', 'Overflow pipe setup'],
    rating: 4.83,
    reviewsCount: 175,
  },

  // AC Services
  {
    id: 'ac-1',
    categoryId: 'ac_services',
    title: 'High-Pressure Foam Jet AC Service',
    description: 'Deep indoor & outdoor unit coil wash with jet pump and anti-bacterial foam.',
    price: 499,
    originalPrice: 699,
    discountBadge: '₹499 Special',
    estimatedTime: '45 mins',
    iconName: 'Wind',
    popular: true,
    features: ['2x faster cooling', 'Jet spray technology', 'Filter & drain tray scrub', 'Power consumption audit'],
    rating: 4.95,
    reviewsCount: 890,
  },
  {
    id: 'ac-2',
    categoryId: 'ac_services',
    title: 'AC Gas Refill / Top-up',
    description: 'Nitrogen pressure leak test followed by pure R32/R410A/R22 gas filling.',
    price: 1499,
    originalPrice: 1999,
    discountBadge: '25% OFF',
    estimatedTime: '1 hr',
    iconName: 'Gauge',
    popular: true,
    features: ['Leakage identification', 'Vacuuming before gas charge', '60-day gas warranty'],
    rating: 4.89,
    reviewsCount: 620,
  },
  {
    id: 'ac-3',
    categoryId: 'ac_services',
    title: 'AC Diagnostic & Repair Check',
    description: 'Comprehensive check for cooling loss, noisy motor, water dripping or PCB fault.',
    price: 299,
    originalPrice: 399,
    estimatedTime: '30 - 45 mins',
    iconName: 'Activity',
    features: ['Exact fault identification', 'Capacitor/Wiring check', 'Transparent parts pricing'],
    rating: 4.84,
    reviewsCount: 390,
  },
  {
    id: 'ac-4',
    categoryId: 'ac_services',
    title: 'Split AC Installation',
    description: 'Wall bracket mounting, copper pipe flare connection and vacuum testing.',
    price: 999,
    originalPrice: 1299,
    estimatedTime: '1.5 - 2 hrs',
    iconName: 'Maximize2',
    features: ['Precision leveling', 'Vibration damper pads', 'Free 3m pipe insulation tape'],
    rating: 4.91,
    reviewsCount: 310,
  },
  {
    id: 'ac-5',
    categoryId: 'ac_services',
    title: 'Split AC Uninstallation',
    description: 'Gas pump-down recovery, safe bracket removal and pipe sealing for relocation.',
    price: 549,
    originalPrice: 699,
    estimatedTime: '45 mins',
    iconName: 'Minimize2',
    features: ['Zero refrigerant loss', 'Wire label tagging', 'Wall hole seal cap'],
    rating: 4.82,
    reviewsCount: 180,
  },

  // Water Services
  {
    id: 'wt-1',
    categoryId: 'water_services',
    title: 'Water Tank Deep Disinfection',
    description: '6-stage mechanized cleaning: Sludge removal, high pressure rotary wash, UV sterilization.',
    price: 799,
    originalPrice: 1099,
    discountBadge: 'Best Seller',
    estimatedTime: '1.5 hrs',
    iconName: 'ShieldCheck',
    popular: true,
    features: ['Sediment evacuation pump', 'UV germicidal lamp', 'Safe food-grade antibacterial spray'],
    rating: 4.94,
    reviewsCount: 540,
  },
  {
    id: 'wt-2',
    categoryId: 'water_services',
    title: 'RO / Water Purifier Full Service',
    description: 'Sediment filter replacement, carbon filter flush, TDS audit & sanitization.',
    price: 399,
    originalPrice: 599,
    discountBadge: '₹200 OFF',
    estimatedTime: '45 mins',
    iconName: 'Droplet',
    popular: true,
    features: ['Genuine parts guarantee', 'Free water TDS testing', 'Booster pump pressure check'],
    rating: 4.87,
    reviewsCount: 460,
  },
  {
    id: 'wt-3',
    categoryId: 'water_services',
    title: 'RO Membrane & Filter Replacement',
    description: 'High-rejection 80 GPD RO membrane installation with post-carbon polisher.',
    price: 1199,
    originalPrice: 1599,
    estimatedTime: '45 - 60 mins',
    iconName: 'RefreshCw',
    features: ['High TDS reduction', '1-year warranty on membrane', 'Flow rate test'],
    rating: 4.9,
    reviewsCount: 310,
  },
  {
    id: 'wt-4',
    categoryId: 'water_services',
    title: 'Water Pump Repair & Motor Check',
    description: 'Submersible / booster pump capacitor change, bearing check & priming fix.',
    price: 449,
    originalPrice: 599,
    estimatedTime: '1 hr',
    iconName: 'Zap',
    features: ['Thermal overload check', 'Dry run protector test', 'Impeller clearance'],
    rating: 4.79,
    reviewsCount: 220,
  },
  {
    id: 'wt-5',
    categoryId: 'water_services',
    title: 'Express Drinking Water Supply',
    description: 'Certified 20L reverse-osmosis purified water can delivery at doorstep.',
    price: 149,
    originalPrice: 199,
    estimatedTime: '30 mins',
    iconName: 'Package',
    features: ['BPA-free sealed cans', 'Doorstep delivery', 'Mineral enriched'],
    rating: 4.85,
    reviewsCount: 190,
  },
];

export const OFFER_BANNERS: OfferBanner[] = [
  {
    id: 'b-1',
    title: 'Mega House Deep Clean',
    subtitle: 'Flat 20% OFF on 2BHK/3BHK full cleaning packages',
    code: 'CLEAN20',
    discount: '20% OFF',
    bgColor: '#4F46E5',
    accentColor: '#818CF8',
    tag: 'LIMITED OFFER',
    categoryId: 'house_cleaning',
  },
  {
    id: 'b-2',
    title: 'Foam Jet AC Super Service',
    subtitle: 'Chill this summer with AC Service starting @ ₹499 only',
    code: 'COOL499',
    discount: 'STARTS ₹499',
    bgColor: '#0D9488',
    accentColor: '#2DD4BF',
    tag: 'HOT DEAL',
    categoryId: 'ac_services',
  },
  {
    id: 'b-3',
    title: 'Emergency Plumbing 30m',
    subtitle: 'Instant technician arrival for leaks & emergency fixes',
    code: 'PLUMB30',
    discount: 'FAST ARRIVAL',
    bgColor: '#0284C7',
    accentColor: '#38BDF8',
    tag: 'PRIORITY',
    categoryId: 'plumbing_services',
  },
  {
    id: 'b-4',
    title: 'Pure Water Guaranteed',
    subtitle: 'Tank Disinfection + Free TDS Health Test',
    code: 'PUREWATER',
    discount: 'SAVE ₹300',
    bgColor: '#2563EB',
    accentColor: '#60A5FA',
    tag: 'WELLNESS',
    categoryId: 'water_services',
  },
];

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

export const MOCK_PROVIDERS: ServiceProvider[] = [
  {
    id: 'pro-1',
    name: 'Rajesh Kumar',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    rating: 4.92,
    jobsCompleted: 486,
    phone: '+91 98450 12345',
    experienceYears: 6,
    vehicleNo: 'KA 03 EJ 4821',
    badge: 'Super Pro',
  },
  {
    id: 'pro-2',
    name: 'Vikram Shinde',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    rating: 4.88,
    jobsCompleted: 342,
    phone: '+91 98765 43210',
    experienceYears: 4,
    vehicleNo: 'KA 01 MR 8892',
    badge: 'Top Rated',
  },
  {
    id: 'pro-3',
    name: 'Anil Verma',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    rating: 4.95,
    jobsCompleted: 620,
    phone: '+91 99160 88231',
    experienceYears: 8,
    vehicleNo: 'KA 05 AB 1920',
    badge: 'Master Expert',
  },
];

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

