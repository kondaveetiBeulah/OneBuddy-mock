export type ServiceCategoryType = 
  | 'house_cleaning'
  | 'plumbing_services'
  | 'ac_services'
  | 'water_services';

export interface ServiceCategory {
  id: ServiceCategoryType;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  badge?: string;
  gradient: [string, string];
  rating: number;
  reviewCount: number;
}

export interface SubService {
  id: string;
  categoryId: ServiceCategoryType;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountBadge?: string;
  estimatedTime: string;
  iconName: string;
  popular?: boolean;
  features: string[];
  rating: number;
  reviewsCount: number;
}

export interface OfferBanner {
  id: string;
  title: string;
  subtitle: string;
  code: string;
  discount: string;
  bgColor: string;
  accentColor: string;
  tag: string;
  categoryId?: ServiceCategoryType;
}

export interface Address {
  id: string;
  type: 'Home' | 'Office' | 'Parents' | 'Other';
  label: string;
  street: string;
  houseNo: string;
  landmark: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface TimeSlot {
  id: string;
  timeRange: string;
  period: 'Morning' | 'Afternoon' | 'Evening';
  available: boolean;
}

export interface DayOption {
  id: string;
  dayName: string;
  dayNumber: string;
  monthName: string;
  fullDate: string;
  isToday?: boolean;
  isTomorrow?: boolean;
}

export type PaymentMethodType = 
  | 'gpay'
  | 'phonepe'
  | 'paytm'
  | 'upi_id'
  | 'pay_on_visit';

export interface PaymentOption {
  id: PaymentMethodType;
  name: string;
  icon: string;
  subtitle: string;
  badge?: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  jobsCompleted: number;
  phone: string;
  experienceYears: number;
  vehicleNo: string;
  badge: string;
}

export type TrackingStage = 
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export interface StageInfo {
  key: TrackingStage;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export interface BookingDetails {
  bookingId: string;
  category: ServiceCategory;
  selectedSubServices: SubService[];
  date: DayOption;
  timeSlot: TimeSlot;
  address: Address;
  paymentMethod: PaymentMethodType;
  upiId?: string;
  baseAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  couponApplied?: string;
  provider?: ServiceProvider;
  otp: string;
  stage: TrackingStage;
  etaMinutes: number;
  distanceKm: number;
  bookingCreatedAt: string;
  hasReviewed?: boolean;
}

export interface FeedbackReview {
  bookingId: string;
  rating: number;
  tags: string[];
  tipAmount: number;
  comment: string;
  timestamp: string;
}
