/**
 * Healthcare and Medical Domain Models & Types
 * Represents canonical Firestore schema entities for the OneBuddy healthcare system.
 */

export type SlotStatus = 'available' | 'reserved' | 'booked' | 'blocked';

export type HospitalAppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'in_progress'
  | 'checked_in'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type PrescriptionStatus = 'active' | 'completed' | 'cancelled' | 'expired';

export type MedicalDocumentType =
  | 'prescription'
  | 'lab_report'
  | 'medical_report'
  | 'scan'
  | 'invoice'
  | 'other';

export type SearchEntityType = 'hospital' | 'department' | 'doctor' | 'pharmacy' | 'medicine';

export interface Hospital {
  id: string;
  name: string;
  description: string;
  image: string;
  address:
    | {
        line1?: string;
        area?: string;
        city: string;
        state: string;
        postalCode?: string;
      }
    | string;
  phoneNumber: string;
  email: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  services: string[];
  departments: string[];
  facilities: string[];
  rating: number;
  ratingCount: number;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  description: string;
  image: string;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Doctor {
  id: string;
  hospitalId: string;
  name: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  image: string;
  departmentId: string;
  consultationFeeMinor: number;
  currency: string;
  languages: string[];
  rating: number;
  ratingCount: number;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface DoctorAvailability {
  id: string;
  hospitalId: string;
  doctorId: string;
  startAt: any;
  endAt: any;
  status: SlotStatus;
  appointmentId: string | null;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Pharmacy {
  id: string;
  name: string;
  description: string;
  image: string;
  address:
    | {
        line1?: string;
        area?: string;
        city: string;
        state: string;
        postalCode?: string;
      }
    | string;
  phoneNumber: string;
  email: string;
  serviceArea: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  deliveryAvailable: boolean;
  active: boolean;
  rating: number;
  ratingCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  description: string;
  image: string;
  category: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
  prescriptionRequired: boolean;
  priceMinor: number;
  currency: string;
  stockAvailable: number;
  pharmacyIds: string[];
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface SearchProjection {
  id: string;
  entityType: SearchEntityType;
  entityId: string;
  name: string;
  description: string;
  image: string;
  keywords: string[];
  service: string;
  active: boolean;
  searchable: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface HospitalAppointment {
  id: string;
  userId: string;
  hospitalId: string;
  hospitalName?: string;
  departmentId: string;
  departmentName?: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialty?: string;
  slotId: string;
  appointmentDate?: any;
  scheduledAt: any;
  startsAt?: any;
  endsAt?: any;
  patientName: string;
  patientPhone: string;
  addressSnapshot?: any;
  reason: string;
  status: HospitalAppointmentStatus;
  consultationFeeMinor: number;
  finalPriceMinor: number;
  currency: string;
  notes?: string;
  mode?: 'in_person' | 'video';
  tokenNumber?: string;
  meetingLink?: string | null;
  createdAt: any;
  updatedAt: any;
}

export interface AppointmentEvent {
  id: string;
  appointmentId: string;
  fromStatus: string | null;
  toStatus: string;
  actorId: string;
  actorType?: 'user' | 'doctor' | 'staff' | 'admin' | 'system';
  note: string;
  createdAt: any;
}

export interface Prescription {
  id: string;
  userId: string;
  appointmentId: string;
  doctorId: string;
  hospitalId: string;
  status: PrescriptionStatus;
  prescriptionDate: any;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  createdAt: any;
  updatedAt: any;
}

export interface MedicalDocument {
  id: string;
  userId: string;
  appointmentId?: string | null;
  documentType: MedicalDocumentType;
  title: string;
  description?: string;
  storagePath: string;
  downloadUrl: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: any;
  updatedAt: any;
}

// ============================================================================
// SERVICE PROVIDER & SERVICE BOOKING DOMAIN MODELS
// ============================================================================

export type ServiceProviderCategory = 'care' | 'homeServices';

export interface ServiceProvider {
  id?: string;
  service: ServiceProviderCategory;
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
  id?: string;
  userId: string;
  service: ServiceProviderCategory;
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

