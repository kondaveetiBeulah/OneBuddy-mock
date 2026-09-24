export type Gender = 'Female' | 'Male' | 'Other';
export type PaymentMode = 'UPI' | 'Card' | 'Cash on Visit';

export interface HealthIssue {
  id: string;
  name: string;
  icon: string;
}

export interface TimeSlot {
  id: string;
  label: string;
  available: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  location: string;
  rating: number;
  experience: number;
  fee: number;
  phone: string;
  initials: string;
  avatar?: string;
  issueIds: string[];
  symptoms?: string[];
  slots: Record<string, TimeSlot[]>;
}

export interface PatientDetails {
  fullName: string;
  age: string;
  gender: Gender;
  phone: string;
  address: string;
  problem: string;
}

export interface Booking {
  id: string;
  doctor: Doctor;
  patient: PatientDetails;
  date: string;
  slot: TimeSlot;
  paymentMode: PaymentMode;
  consultationFee: number;
  platformFee: number;
  total: number;
}

export type RootStackParamList = {
  Home: undefined;
  Doctors: { issueId?: string; query?: string };
  Availability: { doctorId: string };
  PatientDetails: undefined;
  PaymentMode: undefined;
  Payment: undefined;
  Confirmation: undefined;
};
