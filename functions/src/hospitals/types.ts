import { z } from 'zod';
import { AppointmentStatus } from '../domain/enums';
import {
  Hospital,
  Department,
  Doctor,
  DoctorAvailability,
  HospitalAppointment,
  AppointmentEvent,
  Prescription,
  PrescriptionItem,
  MedicalDocument,
  SearchProjection,
} from '../domain/healthcare';

export {
  Hospital,
  Department,
  Doctor,
  DoctorAvailability,
  HospitalAppointment,
  AppointmentEvent,
  Prescription,
  PrescriptionItem,
  MedicalDocument,
  SearchProjection,
};

// ============================================================================
// HOSPITAL & CATALOG SCHEMAS
// ============================================================================

export const getHospitalsSchema = z.object({
  cityKey: z.string().optional(),
  searchQuery: z.string().optional(),
  departmentId: z.string().optional(),
  limit: z.number().int().positive().max(50).default(20),
});

export const getHospitalSchema = z.object({
  hospitalId: z.string().min(1, 'Hospital ID is required'),
});

export const getHospitalDepartmentsSchema = z.object({
  hospitalId: z.string().min(1, 'Hospital ID is required'),
});

export const getHospitalDoctorsSchema = z.object({
  hospitalId: z.string().min(1, 'Hospital ID is required'),
  departmentId: z.string().optional(),
  mode: z.enum(['in_person', 'video']).optional(),
  limit: z.number().int().positive().max(50).default(20),
});

export const getDoctorAvailabilitySchema = z.object({
  hospitalId: z.string().min(1, 'Hospital ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  dateString: z.string().optional(), // YYYY-MM-DD
});

// Legacy aliases for hospital discovery
export const searchHospitalsSchema = getHospitalsSchema;
export const listDoctorsSchema = z.object({
  hospitalId: z.string().optional(),
  specialtyId: z.string().optional(),
  mode: z.enum(['in_person', 'video']).optional(),
  limit: z.number().int().positive().max(50).default(20),
});
export const listAvailabilitySchema = getDoctorAvailabilitySchema;

// ============================================================================
// APPOINTMENT SCHEMAS
// ============================================================================

export const createHospitalAppointmentSchema = z.object({
  hospitalId: z.string().min(1, 'Hospital ID is required'),
  departmentId: z.string().min(1, 'Department ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  slotId: z.string().min(1, 'Slot ID is required'),
  appointmentDate: z.string().or(z.number()).optional(),
  scheduledAt: z.string().or(z.number()).optional(),
  patientName: z.string().min(1, 'Patient name is required'),
  patientPhone: z.string().min(1, 'Patient phone is required'),
  addressSnapshot: z.any().optional(),
  reason: z.string().optional().default('General Consultation'),
  notes: z.string().max(500).optional(),
  mode: z.enum(['in_person', 'video']).default('in_person'),
  paymentMethod: z.string().optional().default('cash_or_counter'),
  idempotencyKey: z.string().optional(),
});

export const confirmHospitalAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  notes: z.string().max(300).optional(),
});

export const cancelHospitalAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  reason: z.string().max(250).optional().default('Cancelled by patient'),
});

export const completeHospitalAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  notes: z.string().max(500).optional(),
});

// Legacy booking alias
export const bookAppointmentSchema = z.object({
  hospitalId: z.string().min(1, 'Hospital ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  departmentId: z.string().optional().default('general'),
  slotId: z.string().optional(),
  startsAt: z.string().or(z.number()).optional(),
  endsAt: z.string().or(z.number()).optional(),
  mode: z.enum(['in_person', 'video']).default('in_person'),
  patientDetails: z.object({
    fullName: z.string().min(1, 'Patient name is required'),
    phone: z.string().optional().default(''),
    age: z.string().or(z.number()).optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional().default('Male'),
    email: z.string().email().optional(),
  }),
  reasonForVisit: z.string().max(500).optional(),
  paymentMethod: z.string().optional().default('cash_or_counter'),
  paymentId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export const cancelAppointmentSchema = cancelHospitalAppointmentSchema;

export const getMyAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
});

export const listMyAppointmentsSchema = z.object({
  limit: z.number().int().positive().max(50).default(20),
});

export const updateAppointmentStatusSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  status: z.enum([
    'requested',
    'confirmed',
    'checked_in',
    'in_consultation',
    'in_progress',
    'completed',
    'cancelled',
    'no_show',
  ] as [AppointmentStatus, ...AppointmentStatus[]]),
  note: z.string().max(300).optional(),
});

// ============================================================================
// PRESCRIPTION SCHEMAS
// ============================================================================

export const createPrescriptionSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  notes: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        medicineId: z.string().min(1, 'Medicine ID is required'),
        dosage: z.string().min(1, 'Dosage is required'),
        frequency: z.string().min(1, 'Frequency is required'),
        duration: z.string().min(1, 'Duration is required'),
        quantity: z.number().int().positive().default(1),
        instructions: z.string().optional().default('After food'),
      })
    )
    .min(1, 'At least one medication item is required'),
});

export const getUserPrescriptionsSchema = z.object({
  userId: z.string().optional(),
  limit: z.number().int().positive().max(50).default(20),
});

export const getPrescriptionSchema = z.object({
  prescriptionId: z.string().min(1, 'Prescription ID is required'),
});

// Legacy aliases
export const getPrescriptionsSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
});

export const issuePrescriptionSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  medications: z
    .array(
      z.object({
        name: z.string().min(1, 'Medication name is required'),
        dosage: z.string().min(1, 'Dosage is required'),
        frequency: z.string().min(1, 'Frequency is required'),
        durationDays: z.number().int().positive().default(5),
        instructions: z.string().optional().default('After food'),
      })
    )
    .min(1, 'At least one medication is required'),
  doctorNotes: z.string().max(1000).optional(),
});

// ============================================================================
// MEDICAL DOCUMENT SCHEMAS
// ============================================================================

export const createMedicalDocumentSchema = z.object({
  title: z.string().min(1, 'Document title is required'),
  type: z
    .enum(['lab_report', 'prescription', 'discharge_summary', 'other'])
    .optional(),
  documentType: z
    .enum(['prescription', 'lab_report', 'medical_report', 'scan', 'invoice', 'discharge_summary', 'other'])
    .optional(),
  description: z.string().max(500).optional(),
  storagePath: z.string().min(1, 'Storage path is required'),
  downloadUrl: z.string().optional(), // Accepted for backward compatibility; not stored
  contentType: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  fileSize: z.number().int().nonnegative().optional(),
  appointmentId: z.string().optional(),
  retentionUntil: z.any().optional(),
});

export const getMedicalDocumentsSchema = z.object({
  type: z
    .enum(['lab_report', 'prescription', 'discharge_summary', 'other'])
    .optional(),
  documentType: z
    .enum(['prescription', 'lab_report', 'medical_report', 'scan', 'invoice', 'discharge_summary', 'other'])
    .optional(),
  limit: z.number().int().positive().max(50).default(30),
});


export const deleteMedicalDocumentSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
});

// Legacy aliases
export const createMedicalDocumentMetadataSchema = z.object({
  title: z.string().min(1, 'Document title is required'),
  category: z
    .enum(['prescription', 'lab_report', 'scan', 'discharge_summary', 'other'])
    .default('lab_report'),
  fileUrl: z.string().url('Must be a valid URL'),
  mimeType: z.string().optional().default('application/pdf'),
  sizeBytes: z.number().int().nonnegative().optional(),
  appointmentId: z.string().optional(),
  doctorName: z.string().optional(),
  hospitalName: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const listMedicalDocumentsSchema = z.object({
  category: z
    .enum(['prescription', 'lab_report', 'scan', 'discharge_summary', 'other'])
    .optional(),
  limit: z.number().int().positive().max(50).default(30),
});

// Export inferred types
export type GetHospitalsInput = z.infer<typeof getHospitalsSchema>;
export type GetHospitalInput = z.infer<typeof getHospitalSchema>;
export type GetHospitalDepartmentsInput = z.infer<typeof getHospitalDepartmentsSchema>;
export type GetHospitalDoctorsInput = z.infer<typeof getHospitalDoctorsSchema>;
export type GetDoctorAvailabilityInput = z.infer<typeof getDoctorAvailabilitySchema>;
export type CreateHospitalAppointmentInput = z.infer<typeof createHospitalAppointmentSchema>;
export type ConfirmHospitalAppointmentInput = z.infer<typeof confirmHospitalAppointmentSchema>;
export type CancelHospitalAppointmentInput = z.infer<typeof cancelHospitalAppointmentSchema>;
export type CompleteHospitalAppointmentInput = z.infer<typeof completeHospitalAppointmentSchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type GetUserPrescriptionsInput = z.infer<typeof getUserPrescriptionsSchema>;
export type GetPrescriptionInput = z.infer<typeof getPrescriptionSchema>;
export type CreateMedicalDocumentInput = z.infer<typeof createMedicalDocumentSchema>;
export type GetMedicalDocumentsInput = z.infer<typeof getMedicalDocumentsSchema>;
export type DeleteMedicalDocumentInput = z.infer<typeof deleteMedicalDocumentSchema>;

export type SearchHospitalsInput = z.infer<typeof searchHospitalsSchema>;
export type ListDoctorsInput = z.infer<typeof listDoctorsSchema>;
export type ListAvailabilityInput = z.infer<typeof listAvailabilitySchema>;
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type GetMyAppointmentInput = z.infer<typeof getMyAppointmentSchema>;
export type ListMyAppointmentsInput = z.infer<typeof listMyAppointmentsSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type GetPrescriptionsInput = z.infer<typeof getPrescriptionsSchema>;
export type IssuePrescriptionInput = z.infer<typeof issuePrescriptionSchema>;
export type CreateMedicalDocumentMetadataInput = z.infer<typeof createMedicalDocumentMetadataSchema>;
export type ListMedicalDocumentsInput = z.infer<typeof listMedicalDocumentsSchema>;
