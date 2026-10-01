import { z } from 'zod';
import { ValidationError } from './errors';

/**
 * Standard E.164 phone number schema (e.g. +919666994727).
 */
export const e164PhoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, 'Must be a valid E.164 phone number (e.g. +919876543210)');

/**
 * Minor money schema (positive integer in paise).
 * Forces currency amounts to be represented as integers, eliminating floating point bugs.
 */
export const minorMoneySchema = z
  .number()
  .int('Amount in minor units must be an integer')
  .nonnegative('Amount cannot be negative');

/**
 * Supported currency (INR only for OneBuddy).
 */
export const currencySchema = z.literal('INR').default('INR');

/**
 * Geographical coordinate schema.
 */
export const geoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * Address snapshot schema embedded in orders and bookings.
 */
export const addressSnapshotSchema = z
  .object({
    receiverName: z.string().default('Customer'),
    phone: z.string().default(''),
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().nullish(),
    area: z.string().optional(),
    city: z.string().default('Hyderabad'),
    state: z.string().default('Telangana'),
    postalCode: z.string().default('500081'),
    label: z.enum(['Home', 'Work', 'Other']).optional(),
    location: geoPointSchema.optional(),
  })
  .passthrough();

/**
 * Reusable cursor-based pagination schema.
 */
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().positive().max(50).default(20),
});

/**
 * Idempotency key schema.
 */
export const idempotencyKeySchema = z
  .string()
  .min(8, 'Idempotency key must be at least 8 characters')
  .max(128, 'Idempotency key cannot exceed 128 characters');

/**
 * Standard actor type schema per Greenfield specification.
 */
export const actorTypeSchema = z.enum([
  'user',
  'merchant',
  'driver',
  'system',
  'admin',
]);



/**
 * Validates request data against schema or throws standardized ValidationError.
 */
export function validateRequest<Schema extends z.ZodTypeAny>(
  schema: Schema,
  data: unknown
): z.infer<Schema> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid request data', result.error.format());
  }
  return result.data;
}

