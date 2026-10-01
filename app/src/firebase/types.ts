/**
 * Firestore document shapes. Mirrors the RN-facing types in
 * `src/native/**` / `src/types` as closely as possible so services can pass
 * data straight to the existing screens without a translation layer.
 *
 * Collection layout (all scoped under the signed-in user, enforced by
 * `firestore.rules`):
 *
 *   users/{uid}                          UserProfile
 *   users/{uid}/meta/settings            SettingsDoc
 *   users/{uid}/meta/security            SecurityDoc
 *   users/{uid}/meta/wallet              WalletDoc
 *   users/{uid}/addresses/{addressId}    AddressDoc
 *   users/{uid}/cards/{cardId}           CardDoc
 *   users/{uid}/upiHandles/{upiId}       UpiDoc
 *   users/{uid}/transactions/{txId}      TransactionDoc
 *   users/{uid}/orders/{orderId}         OrderDoc
 */

export interface UserProfile {
  uid: string;
  displayName: string;
  name?: string; // backwards-compatible alias for existing screens
  email: string | null;
  phoneNumber?: string | null;
  phoneE164?: string | null;
  phone?: string | null; // backwards-compatible alias for existing screens
  photoURL?: string | null;
  dob?: string | null;
  dateOfBirth?: string | null;
  accountStatus?: 'active' | 'suspended' | 'deletion_requested' | 'deleted';
  createdAt: number | string | any;
  updatedAt?: number | string | any;
}

export interface SettingsDoc {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'hi' | 'te';
  locationAccess: boolean;
  shareUsageData: boolean;
  usageHistory: string[];
  updatedAt: number;
}

export interface SecurityDoc {
  biometric: boolean;
  verifiedProfile: boolean;
  familySharing: boolean;
  emergencyContact: string;
  updatedAt: number;
}

export interface WalletDoc {
  userId?: string;
  balanceMinor: number;
  balance?: number;
  currency?: string;
  updatedAt: any;
}

export type AddressLabel = 'Home' | 'Work' | 'Other';

export interface AddressDoc {
  id: string;
  label: AddressLabel;
  receiverName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  updatedAt: number;
}

export interface CardDoc {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault?: boolean;
  updatedAt: number;
}

export interface UpiDoc {
  id: string;
  vpa: string;
  isDefault?: boolean;
  updatedAt: number;
}

export interface TransactionDoc {
  id: string;
  title: string;
  date: string;
  amount: number; // positive = credit, negative = debit
  createdAt: number;
}

export type OrderCategory =
  | 'food'
  | 'groceries'
  | 'rides'
  | 'healthcare'
  | 'homeservices';

export type OrderStatusKind = 'ongoing' | 'upcoming' | 'done';
export type OrderGroup = 'Ongoing' | 'Upcoming' | 'Completed';

export interface OrderDoc {
  id: string;
  category: OrderCategory;
  icon: string;
  title: string;
  status: string;
  statusKind: OrderStatusKind;
  subtitle: string;
  actions: string[];
  group: OrderGroup;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Healthcare & Medical Architecture Interfaces
// ---------------------------------------------------------------------------

export interface Hospital {
  id: string;
  name: string;
  description?: string;
  image?: string;
  address: string | Record<string, any>;
  phoneNumber?: string;
  email?: string;
  location?: { latitude: number; longitude: number };
  services?: string[];
  departments?: string[];
  facilities?: string[];
  rating: number;
  ratingCount?: number;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  image?: string;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification?: string;
  experienceYears?: number;
  image?: string;
  departmentId: string;
  consultationFeeMinor: number;
  currency: string;
  languages?: string[];
  rating: number;
  ratingCount?: number;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export type SlotStatus = 'available' | 'reserved' | 'booked' | 'blocked';

export interface DoctorAvailability {
  id: string;
  startAt: any;
  endAt: any;
  status: SlotStatus;
  appointmentId?: string | null;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Pharmacy {
  id: string;
  name: string;
  description?: string;
  image?: string;
  address: string | Record<string, any>;
  phoneNumber?: string;
  email?: string;
  serviceArea?: string;
  location?: { latitude: number; longitude: number };
  deliveryAvailable?: boolean;
  active: boolean;
  rating: number;
  ratingCount?: number;
  createdAt: any;
  updatedAt: any;
}

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  description?: string;
  image?: string;
  category?: string;
  manufacturer?: string;
  dosageForm?: string;
  strength?: string;
  prescriptionRequired: boolean;
  priceMinor: number;
  currency: string;
  stockAvailable: number;
  pharmacyIds?: string[];
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface SearchProjection {
  id: string;
  entityType: 'hospital' | 'department' | 'doctor' | 'pharmacy' | 'medicine';
  entityId: string;
  name: string;
  description?: string;
  image?: string;
  keywords: string[];
  service: string;
  active: boolean;
  searchable: boolean;
  createdAt: any;
  updatedAt: any;
}

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface HospitalAppointment {
  id: string;
  userId: string;
  hospitalId: string;
  departmentId: string;
  doctorId: string;
  slotId: string;
  appointmentDate: string;
  scheduledAt: any;
  patientName: string;
  patientPhone: string;
  addressSnapshot?: any;
  reason?: string;
  status: AppointmentStatus;
  consultationFeeMinor: number;
  finalPriceMinor?: number;
  currency: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface AppointmentEvent {
  id: string;
  fromStatus: string;
  toStatus: string;
  actorId: string;
  note?: string;
  createdAt: any;
}

export type PrescriptionStatus = 'active' | 'completed' | 'cancelled' | 'expired';

export interface Prescription {
  id: string;
  userId: string;
  appointmentId?: string;
  doctorId: string;
  hospitalId: string;
  status: PrescriptionStatus;
  prescriptionDate: string;
  notes?: string;
  items?: PrescriptionItem[];
  createdAt: any;
  updatedAt: any;
}

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity: number;
  instructions?: string;
  createdAt: any;
  updatedAt: any;
}

export type MedicalDocumentType =
  | 'prescription'
  | 'lab_report'
  | 'medical_report'
  | 'scan'
  | 'invoice'
  | 'other';

export interface MedicalDocument {
  id: string;
  userId: string;
  appointmentId?: string;
  documentType: MedicalDocumentType;
  title: string;
  description?: string;
  storagePath: string;
  downloadUrl?: string;
  mimeType?: string;
  fileSize?: number;
  uploadedBy: string;
  createdAt: any;
  updatedAt: any;
}

// ---------------------------------------------------------------------------
// Service Provider & Booking Architecture Interfaces
// ---------------------------------------------------------------------------

export type ServiceProviderService = 'care' | 'homeServices';

export interface ServiceProvider {
  id: string;
  service: ServiceProviderService;
  name: string;
  description: string;
  image: string;
  serviceTypes: string[];
  rating: number;
  ratingCount: number;
  active: boolean;
  serviceArea: string | Record<string, any>;
  createdAt: any;
  updatedAt: any;
}

export interface AddressSnapshot {
  name?: string;
  receiverName?: string;
  houseNo?: string;
  line1?: string;
  line2?: string | null;
  landmarkAreaName?: string;
  area?: string;
  city?: string;
  state?: string;
  phoneNumber?: string;
  phone?: string;
  label?: string;
  pincode?: string;
  postalCode?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export type ServiceBookingStatus =
  | 'requested'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ServiceBooking {
  id: string;
  userId: string;
  service: ServiceProviderService;
  providerId: string;
  serviceType: string;
  status: ServiceBookingStatus;
  scheduledAt: any;
  addressSnapshot: AddressSnapshot;
  quotedPriceMinor: number;
  finalPriceMinor?: number | null;
  currency: string;
  notes?: string | null;
  createdAt: any;
  updatedAt: any;
}

export interface ServiceBookingEvent {
  id?: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorId?: string | null;
  note?: string | null;
  createdAt: any;
}


