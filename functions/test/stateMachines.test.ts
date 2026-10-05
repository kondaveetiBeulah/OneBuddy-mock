import { describe, it, expect } from 'vitest';
import {
  ALLOWED_ORDER_TRANSITIONS,
  ALLOWED_RIDE_TRANSITIONS,
  ALLOWED_APPOINTMENT_TRANSITIONS,
  ALLOWED_BOOKING_TRANSITIONS,
  validateOrderTransition,
  validateRideTransition,
  validateAppointmentTransition,
  validateBookingTransition,
} from '../src/domain/stateMachines';
import { PreconditionFailedError } from '../src/common/errors';

describe('Order State Machine', () => {
  it('allows standard forward progression from placed to completed', () => {
    expect(() => validateOrderTransition('placed', 'confirmed')).not.toThrow();
    expect(() => validateOrderTransition('confirmed', 'preparing')).not.toThrow();
    expect(() => validateOrderTransition('preparing', 'packed')).not.toThrow();
    expect(() => validateOrderTransition('packed', 'out_for_delivery')).not.toThrow();
    expect(() => validateOrderTransition('out_for_delivery', 'delivered')).not.toThrow();
    expect(() => validateOrderTransition('delivered', 'completed')).not.toThrow();
  });

  it('allows cancellation from early cancellable states', () => {
    expect(() => validateOrderTransition('placed', 'cancelled')).not.toThrow();
    expect(() => validateOrderTransition('confirmed', 'cancelled')).not.toThrow();
    expect(() => validateOrderTransition('preparing', 'cancelled')).not.toThrow();
  });

  it('allows failure transitions from active non-terminal states', () => {
    expect(() => validateOrderTransition('placed', 'failed')).not.toThrow();
    expect(() => validateOrderTransition('confirmed', 'failed')).not.toThrow();
    expect(() => validateOrderTransition('preparing', 'failed')).not.toThrow();
    expect(() => validateOrderTransition('out_for_delivery', 'failed')).not.toThrow();
  });

  it('disallows transitions from terminal states', () => {
    expect(ALLOWED_ORDER_TRANSITIONS['completed']).toEqual([]);
    expect(ALLOWED_ORDER_TRANSITIONS['cancelled']).toEqual([]);
    expect(ALLOWED_ORDER_TRANSITIONS['failed']).toEqual([]);

    expect(() => validateOrderTransition('completed', 'placed')).toThrow(PreconditionFailedError);
    expect(() => validateOrderTransition('cancelled', 'confirmed')).toThrow(PreconditionFailedError);
    expect(() => validateOrderTransition('failed', 'placed')).toThrow(PreconditionFailedError);
  });

  it('rejects illegal skipping or backward transitions', () => {
    expect(() => validateOrderTransition('placed', 'delivered')).toThrow(PreconditionFailedError);
    expect(() => validateOrderTransition('delivered', 'preparing')).toThrow(PreconditionFailedError);
    expect(() => validateOrderTransition('out_for_delivery', 'confirmed')).toThrow(PreconditionFailedError);
  });
});

describe('Ride State Machine', () => {
  it('allows standard ride progression from requested to completed', () => {
    expect(() => validateRideTransition('requested', 'searching')).not.toThrow();
    expect(() => validateRideTransition('searching', 'assigned')).not.toThrow();
    expect(() => validateRideTransition('assigned', 'driver_arriving')).not.toThrow();
    expect(() => validateRideTransition('driver_arriving', 'in_progress')).not.toThrow();
    expect(() => validateRideTransition('in_progress', 'completed')).not.toThrow();
  });

  it('allows cancellation before ride is completed', () => {
    expect(() => validateRideTransition('requested', 'cancelled')).not.toThrow();
    expect(() => validateRideTransition('searching', 'cancelled')).not.toThrow();
    expect(() => validateRideTransition('assigned', 'cancelled')).not.toThrow();
    expect(() => validateRideTransition('driver_arriving', 'cancelled')).not.toThrow();
  });

  it('disallows transitions from completed or cancelled rides', () => {
    expect(ALLOWED_RIDE_TRANSITIONS['completed']).toEqual([]);
    expect(ALLOWED_RIDE_TRANSITIONS['cancelled']).toEqual([]);

    expect(() => validateRideTransition('completed', 'requested')).toThrow(PreconditionFailedError);
    expect(() => validateRideTransition('cancelled', 'assigned')).toThrow(PreconditionFailedError);
  });
});

describe('Appointment & Booking State Machines', () => {
  it('validates hospital appointment progression', () => {
    expect(() => validateAppointmentTransition('requested', 'confirmed')).not.toThrow();
    expect(() => validateAppointmentTransition('confirmed', 'checked_in')).not.toThrow();
    expect(() => validateAppointmentTransition('checked_in', 'in_consultation')).not.toThrow();
    expect(() => validateAppointmentTransition('in_consultation', 'completed')).not.toThrow();
    expect(() => validateAppointmentTransition('completed', 'confirmed')).toThrow(PreconditionFailedError);
  });

  it('validates home care booking progression', () => {
    expect(() => validateBookingTransition('requested', 'confirmed')).not.toThrow();
    expect(() => validateBookingTransition('confirmed', 'in_progress')).not.toThrow();
    expect(() => validateBookingTransition('in_progress', 'completed')).not.toThrow();
    expect(() => validateBookingTransition('completed', 'requested')).toThrow(PreconditionFailedError);
  });
});
