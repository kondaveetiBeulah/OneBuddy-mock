/**
 * Canonical lifecycle statuses for orders (Food, Grocery, Pharmacy).
 */
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'packed'
  | 'assigned'
  | 'out_for_delivery'
  | 'in_progress'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'failed';

/**
 * Supported top-level service categories.
 */
export type ServiceCategory =
  | 'food'
  | 'groceries'
  | 'rides'
  | 'healthcare'
  | 'homeservices';

/**
 * Canonical lifecycle statuses for hospital appointments.
 */
export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'checked_in'
  | 'in_consultation'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentMode = 'in_person' | 'video';

/**
 * Canonical lifecycle statuses for rides.
 */
export type RideStatus =
  | 'requested'
  | 'searching'
  | 'assigned'
  | 'driver_arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type VehicleType = 'bike' | 'scooter' | 'auto' | 'cab' | 'xl';

/**
 * Canonical lifecycle statuses for home service and care bookings.
 */
export type BookingStatus =
  | 'requested'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/**
 * Canonical payment statuses.
 */
export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'voided';

/**
 * Canonical actors performing operations, state transitions, and audit events.
 * Greenfield Specification (Section 4): 'user' | 'merchant' | 'driver' | 'system' | 'admin'
 */
export type ActorType = 'user' | 'merchant' | 'driver' | 'system' | 'admin';

/**
 * Canonical user privacy consent purposes (DPDP Act 2023 & GDPR).
 */
export type ConsentPurpose =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'location_tracking'
  | 'marketing_notifications'
  | 'data_processing_dpdp';

export interface ConsentRecord {
  consentId?: string;
  purpose: ConsentPurpose;
  granted: boolean;
  policyVersion: string;
  source: 'mobile_app' | 'web' | 'checkout';
  grantedAt?: any;
  withdrawnAt?: any | null;
  createdAt?: any;
}



