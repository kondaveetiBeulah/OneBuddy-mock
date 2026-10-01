import { z } from 'zod';
import { geoPointSchema } from '../common/validation';
import { RideStatus, VehicleType } from '../domain/enums';

/**
 * Privacy Masking Helpers
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return '+91 98*** **000';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const first2 = digits.length > 10 ? digits.slice(-10, -8) : digits.slice(0, 2);
    const last3 = digits.slice(-3);
    return `+91 ${first2}*** **${last3}`;
  }
  return '+91 98*** **000';
}

export function maskRegistration(plate?: string | null): string {
  if (!plate) return 'TS 09 ** 0000';
  const clean = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length >= 8) {
    const stateCode = clean.slice(0, 2);
    const districtCode = clean.slice(2, 4);
    const last4 = clean.slice(-4);
    return `${stateCode} ${districtCode} ** ${last4}`;
  }
  return clean.slice(0, 2) + ' ** ' + clean.slice(-4);
}

/**
 * Ride Location Input Schema
 * Accepts either { label, latitude, longitude } or legacy { title, address, latitude, longitude }
 */
export const rideLocationInputSchema = z.object({
  latitude: geoPointSchema.shape.latitude,
  longitude: geoPointSchema.shape.longitude,
  label: z.string().optional(),
  title: z.string().optional(),
  address: z.string().optional(),
}).transform((data) => ({
  latitude: data.latitude,
  longitude: data.longitude,
  label: data.label || data.title || data.address || 'Location',
}));

/**
 * Stored Document Structure Types
 */
export interface RideLocation {
  label: string;
  location: FirebaseFirestore.GeoPoint;
}

export interface DriverSnapshot {
  name: string;
  maskedPhone: string;
  rating: number;
}

export interface VehicleSnapshot {
  model: string;
  maskedRegistration: string;
}

export interface RideDocument {
  userId: string;
  orderId: string;
  status: RideStatus;
  vehicleType: VehicleType;
  pickup: RideLocation;
  destination: RideLocation;
  quotedFareMinor: number;
  currency: 'INR';
  requestedAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;

  distanceMeters?: number;
  estimatedDurationSeconds?: number;
  finalFareMinor?: number | null;
  paymentMethodId?: string | null;
  driverId?: string | null;
  driverSnapshot?: DriverSnapshot | null;
  vehicleSnapshot?: VehicleSnapshot | null;
  cancellationReason?: string | null;
  rating?: number | null;
  assignedAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null;
  startedAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null;
  completedAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null;
  cancelledAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null;

  // Backwards compatibility helpers
  rideId?: string;
  startOtp?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  fare?: any;
}

/**
 * Quote Ride Request Schema
 */
export const quoteRideSchema = z.object({
  pickup: z.object({
    latitude: geoPointSchema.shape.latitude,
    longitude: geoPointSchema.shape.longitude,
    label: z.string().optional(),
    title: z.string().optional(),
    address: z.string().optional(),
  }).transform((d) => ({
    latitude: d.latitude,
    longitude: d.longitude,
    label: d.label || d.title || d.address || 'Pickup Location',
  })),
  destination: z.object({
    latitude: geoPointSchema.shape.latitude,
    longitude: geoPointSchema.shape.longitude,
    label: z.string().optional(),
    title: z.string().optional(),
    address: z.string().optional(),
  }).transform((d) => ({
    latitude: d.latitude,
    longitude: d.longitude,
    label: d.label || d.title || d.address || 'Destination',
  })),
  vehicleType: z.enum(['bike', 'scooter', 'auto', 'cab', 'xl']).optional(),
});

/**
 * Request Ride Schema
 */
export const requestRideSchema = z.object({
  pickup: rideLocationInputSchema,
  destination: rideLocationInputSchema,
  vehicleType: z.enum(['bike', 'scooter', 'auto', 'cab', 'xl']),
  orderId: z.string().optional(),
  paymentMethod: z.enum(['cash', 'upi', 'wallet', 'card']).default('cash'),
  paymentMethodId: z.string().optional(),
  offeredPricePaise: z.number().int().positive().optional(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

/**
 * Cancel Ride Schema
 */
export const cancelRideSchema = z.object({
  rideId: z.string().min(1, 'Ride ID is required'),
  reason: z.string().max(256).optional().default('Changed plans'),
});

/**
 * Get Ride Schema
 */
export const getRideSchema = z.object({
  rideId: z.string().min(1, 'Ride ID is required'),
});

/**
 * Rate Ride Schema
 */
export const rateRidesSchema = z.object({
  rideId: z.string().min(1, 'Ride ID is required'),
  rating: z.number().min(1).max(5),
  feedback: z.string().max(500).optional(),
  compliments: z.array(z.string().max(50)).optional().default([]),
});

/**
 * Update Ride Status Schema (Driver & Lifecycle Transitions)
 */
export const updateRideStatusSchema = z.object({
  rideId: z.string().min(1, 'Ride ID is required'),
  status: z.enum([
    'requested',
    'searching',
    'assigned',
    'driver_arriving',
    'in_progress',
    'completed',
    'cancelled',
    'failed',
  ]),
  driverId: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  driverRating: z.number().optional(),
  vehicleModel: z.string().optional(),
  vehicleRegistration: z.string().optional(),
  cancellationReason: z.string().optional(),
  finalFareMinor: z.number().int().positive().optional(),
});

export type QuoteRideInput = z.infer<typeof quoteRideSchema>;
export type RequestRideInput = z.infer<typeof requestRideSchema>;
export type CancelRideInput = z.infer<typeof cancelRideSchema>;
export type GetRideInput = z.infer<typeof getRideSchema>;
export type RateRidesInput = z.infer<typeof rateRidesSchema>;
export type UpdateRideStatusInput = z.infer<typeof updateRideStatusSchema>;

