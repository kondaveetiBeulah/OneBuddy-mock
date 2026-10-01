import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { addressSnapshotSchema, minorMoneySchema, currencySchema } from '../common/validation';
import { BookingStatus } from '../domain/enums';

export type ServiceCategoryType = 'care' | 'homeServices';

/**
 * 1. Catalog Service Provider Document Schema & Interface
 * Firestore Collection: catalogServiceProviders/{providerId}
 */
export interface CatalogServiceProviderDoc {
  id?: string;
  service: ServiceCategoryType;
  name: string;
  description: string;
  image: string;
  serviceTypes: string[];
  rating: number;
  ratingCount: number;
  active: boolean;
  serviceArea: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Address Snapshot embedded in bookings
 */
export type AddressSnapshot = z.infer<typeof addressSnapshotSchema>;

/**
 * 2. Service Booking Document Interface
 * Firestore Collection: serviceBookings/{bookingId}
 */
export interface ServiceBookingDoc {
  id: string;
  userId: string;
  service: ServiceCategoryType;
  providerId: string;
  serviceType: string;
  status: BookingStatus;
  scheduledAt: Timestamp;
  addressSnapshot: AddressSnapshot;
  quotedPriceMinor: number;
  finalPriceMinor?: number | null;
  currency: string;
  notes?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Domain metadata & integrations
  providerNameSnapshot?: string;
  hours?: number;
  pricing?: {
    baseFeePaise: number;
    durationFeePaise: number;
    platformFeePaise: number;
    taxPaise: number;
    totalPaise: number;
    currency: string;
  };
  paymentMethod?: string;
  patientDetails?: {
    fullName: string;
    phone?: string;
    age?: string | number;
    gender?: string;
  } | null;
  cancellationReason?: string | null;
  cancelledBy?: 'user' | 'provider' | 'admin' | null;
  cancelledAt?: Timestamp | null;
  rating?: {
    score: number;
    feedback?: string | null;
    compliments?: string[];
    ratedAt: Timestamp;
  } | null;
}

/**
 * 3. Booking Event Document Interface
 * Firestore Subcollection: serviceBookings/{bookingId}/events/{eventId}
 */
export interface BookingEventDoc {
  id?: string;
  fromStatus?: BookingStatus | null;
  toStatus?: BookingStatus | null;
  actorId?: string | null;
  actorType?: 'user' | 'provider' | 'admin' | 'system' | null;
  note?: string | null;
  createdAt: Timestamp;
}

// ----------------------------------------------------------------------------
// REQUEST & INPUT SCHEMAS (ZOD)
// ----------------------------------------------------------------------------

/**
 * Service Provider Listing Schema
 */
export const listProvidersSchema = z.object({
  serviceType: z.string().optional(),
  service: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.toLowerCase() === 'homeservices') return 'homeServices';
      return val;
    }, z.enum(['care', 'homeServices']))
    .optional(),
  category: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.toLowerCase() === 'homeservices') return 'homeServices';
      return val;
    }, z.enum(['care', 'homeServices']))
    .optional(), // Alias for backward compatibility
  limit: z.number().int().positive().max(50).default(20),
});

/**
 * Quote Booking Schema
 */
export const quoteBookingSchema = z.object({
  serviceType: z.string().min(1, 'Service type is required'),
  hours: z.number().int().positive().max(24).default(1),
});

/**
 * Create Service Booking Schema
 */
export const createBookingSchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  providerName: z.string().optional(),
  service: z
    .preprocess((val) => {
      if (typeof val === 'string' && val.toLowerCase() === 'homeservices') return 'homeServices';
      return val;
    }, z.enum(['care', 'homeServices']))
    .default('care'),
  serviceType: z.string().min(1, 'Service type is required'),
  scheduledAt: z.union([z.string(), z.number()]), // ISO string or epoch millis
  addressSnapshot: addressSnapshotSchema.optional(),
  addressId: z.string().optional(),
  hours: z.number().int().positive().max(24).default(1),
  quotedPriceMinor: minorMoneySchema.optional(),
  currency: currencySchema.default('INR'),
  notes: z.string().max(500).optional(),
  paymentMethod: z.string().optional().default('cash_on_service'),
  patientDetails: z
    .object({
      fullName: z.string().min(1),
      phone: z.string().optional(),
      age: z.string().or(z.number()).optional(),
      gender: z.string().optional(),
    })
    .optional(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

/**
 * Update Booking Lifecycle Status Schema (Staff / Provider / Admin)
 */
export const updateBookingStatusSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  status: z.enum([
    'requested',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
  ] as [BookingStatus, ...BookingStatus[]]),
  finalPriceMinor: minorMoneySchema.optional(),
  note: z.string().max(300).optional(),
});

/**
 * Cancel Booking Schema
 */
export const cancelBookingSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  reason: z.string().max(250).optional().default('Cancelled by customer'),
});

/**
 * Get Specific Booking with Event History Schema
 */
export const getMyBookingSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
});

/**
 * List User Bookings Schema
 */
export const listMyBookingsSchema = z.object({
  service: z.enum(['care', 'homeServices']).optional(),
  status: z.enum(['requested', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  limit: z.number().int().positive().max(50).default(20),
});

/**
 * Rate Booking Schema
 */
export const rateBookingSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(500).optional(),
  compliments: z.array(z.string().max(50)).optional().default([]),
});

/**
 * 9. Get Single Provider Schema
 */
export const getServiceProviderSchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
});

// Canonical Aliases matching Requirement 9
export const getServiceProvidersSchema = listProvidersSchema;
export const createServiceBookingSchema = createBookingSchema;
export const getUserServiceBookingsSchema = listMyBookingsSchema;
export const getServiceBookingSchema = getMyBookingSchema;
export const updateServiceBookingStatusSchema = updateBookingStatusSchema;
export const cancelServiceBookingSchema = cancelBookingSchema;

export type ListProvidersInput = z.infer<typeof listProvidersSchema>;
export type QuoteBookingInput = z.infer<typeof quoteBookingSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type GetMyBookingInput = z.infer<typeof getMyBookingSchema>;
export type ListMyBookingsInput = z.infer<typeof listMyBookingsSchema>;
export type RateBookingInput = z.infer<typeof rateBookingSchema>;
export type GetServiceProviderInput = z.infer<typeof getServiceProviderSchema>;

