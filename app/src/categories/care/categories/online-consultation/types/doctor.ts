export type ConsultationMode = 'video' | 'audio' | 'both';

export interface Doctor {
  id: string;
  name: string;
  avatar: string;
  gender: 'male' | 'female';
  specialty: string;
  specialtyKey: string;
  degrees: string;
  experienceYears: number;
  hospital: string;
  location: string;
  rating: number;
  totalReviews: number;
  totalConsultations: number;
  consultationFee: number;
  audioConsultationFee?: number;
  availableModes: ('video' | 'audio')[];
  about: string;
  languages: string[];
  nextAvailable: string;
  isTopRated?: boolean;
  isInstantAvailable?: boolean;
}

export interface HealthCategory {
  id: string;
  name: string;
  iconName: string;
  specialtyKey: string;
  description: string;
  color: string;
  bgColor: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  period: 'morning' | 'afternoon' | 'evening';
  isAvailable: boolean;
}

export interface DaySlot {
  dateString: string;
  dayLabel: string;
  dateFormatted: string;
  slots: TimeSlot[];
}

export interface PatientDetails {
  fullName: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  symptoms: string;
  selectedSymptomTags: string[];
}

export interface BookingSummary {
  bookingId: string;
  doctor: Doctor;
  date: string;
  time: string;
  mode: 'video' | 'audio';
  patient: PatientDetails;
  feeBreakdown: {
    consultationFee: number;
    platformFee: number;
    discount: number;
    totalAmount: number;
  };
  paymentMethod: string;
  meetingLink: string;
  createdAt: string;
  status: 'confirmed' | 'completed' | 'cancelled';
}
