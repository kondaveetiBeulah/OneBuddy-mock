import {
  OrderStatus,
  AppointmentStatus,
  RideStatus,
  BookingStatus,
} from './enums';
import { PreconditionFailedError } from '../common/errors';

/**
 * Valid transitions for canonical Orders (Food, Grocery, Healthcare).
 */
export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled', 'failed'],
  confirmed: ['preparing', 'assigned', 'cancelled', 'failed'],
  preparing: ['packed', 'cancelled', 'failed'],
  packed: ['assigned', 'out_for_delivery', 'cancelled', 'failed'],
  assigned: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'failed'],
  in_progress: ['completed', 'cancelled', 'failed'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
  failed: [],
};

/**
 * Valid transitions for Hospital Appointments.
 */
export const ALLOWED_APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'in_consultation', 'in_progress', 'cancelled', 'no_show'],
  checked_in: ['in_consultation', 'in_progress', 'cancelled', 'no_show'],
  in_consultation: ['completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
};

/**
 * Valid transitions for Rides.
 */
export const ALLOWED_RIDE_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  requested: ['searching', 'assigned', 'cancelled', 'failed'],
  searching: ['assigned', 'cancelled', 'failed'],
  assigned: ['driver_arriving', 'cancelled'],
  driver_arriving: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled', 'failed'],
  completed: [],
  cancelled: [],
  failed: [],
};

/**
 * Valid transitions for Service Bookings (Care & Home Services).
 */
export const ALLOWED_BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * Validates whether an order status transition is permissible.
 */
export function validateOrderTransition(from: OrderStatus, to: OrderStatus): void {
  const allowed = ALLOWED_ORDER_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new PreconditionFailedError(
      `Cannot transition order status from "${from}" to "${to}".`
    );
  }
}

/**
 * Validates whether an appointment status transition is permissible.
 */
export function validateAppointmentTransition(from: AppointmentStatus, to: AppointmentStatus): void {
  const allowed = ALLOWED_APPOINTMENT_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new PreconditionFailedError(
      `Cannot transition appointment status from "${from}" to "${to}".`
    );
  }
}

/**
 * Validates whether a ride status transition is permissible.
 */
export function validateRideTransition(from: RideStatus, to: RideStatus): void {
  const allowed = ALLOWED_RIDE_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new PreconditionFailedError(
      `Cannot transition ride status from "${from}" to "${to}".`
    );
  }
}

/**
 * Validates whether a service booking status transition is permissible.
 */
export function validateBookingTransition(from: BookingStatus, to: BookingStatus): void {
  const allowed = ALLOWED_BOOKING_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new PreconditionFailedError(
      `Cannot transition booking status from "${from}" to "${to}".`
    );
  }
}
