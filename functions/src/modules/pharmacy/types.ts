import { z } from 'zod';
import { addressSnapshotSchema, minorMoneySchema } from '../../common/validation';
import { Pharmacy, Medicine } from '../../domain/healthcare';

export { Pharmacy, Medicine };

/**
 * Pharmacy search schema
 */
export const searchPharmaciesSchema = z.object({
  cityKey: z.string().optional(),
  searchQuery: z.string().optional(),
  limit: z.number().int().positive().max(50).default(20),
});

export const getPharmaciesSchema = searchPharmaciesSchema;

export const getPharmacySchema = z.object({
  pharmacyId: z.string().min(1, 'Pharmacy ID is required'),
});

/**
 * Medicine listing and catalog search schema
 */
export const listMedicinesSchema = z.object({
  pharmacyId: z.string().optional(),
  category: z.string().optional(),
  query: z.string().optional(),
  searchQuery: z.string().optional(),
  prescriptionOnly: z.boolean().optional(),
  prescriptionRequired: z.boolean().optional(),
  limit: z.number().int().positive().max(60).default(30),
});

export const getMedicinesSchema = listMedicinesSchema;

export const getMedicineSchema = z.object({
  medicineId: z.string().min(1, 'Medicine ID is required'),
});

/**
 * Prescription upload / registration schema
 */
export const uploadPrescriptionSchema = z.object({
  fileUrl: z.string().url('Must be a valid URL'),
  fileName: z.string().min(1, 'File name is required'),
  mimeType: z.string().optional().default('application/pdf'),
  patientName: z.string().optional(),
  notes: z.string().max(500).optional(),
  pharmacyId: z.string().optional(),
});

/**
 * Medicine order line item schema
 */
export const medicineOrderItemSchema = z.object({
  medicineId: z.string().min(1, 'Medicine ID is required'),
  name: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unitPriceMinor: minorMoneySchema.optional(),
  notes: z.string().max(200).optional(),
});

/**
 * Medicine delivery order placement schema
 */
export const placeMedicineOrderSchema = z.object({
  id: z.string().min(8).max(128).optional(), // Idempotency key
  pharmacyId: z.string().min(1, 'Pharmacy ID is required').default('pharmacy-central-hyd'),
  items: z.array(medicineOrderItemSchema).min(1, 'Order must contain at least one medicine item'),
  deliveryAddress: addressSnapshotSchema.default({
    receiverName: 'Customer',
    phone: '',
    line1: 'Road No. 36, Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500081',
  }),
  paymentMethod: z.enum(['wallet', 'cash_on_delivery', 'upi', 'card']).default('upi'),
  prescriptionUri: z.string().optional(),
  prescriptionId: z.string().optional(),
  promotionCode: z.string().optional(),
  tipMinor: minorMoneySchema.default(0),
});

export type SearchPharmaciesInput = z.infer<typeof searchPharmaciesSchema>;
export type GetPharmaciesInput = z.infer<typeof getPharmaciesSchema>;
export type GetPharmacyInput = z.infer<typeof getPharmacySchema>;
export type ListMedicinesInput = z.infer<typeof listMedicinesSchema>;
export type GetMedicinesInput = z.infer<typeof getMedicinesSchema>;
export type GetMedicineInput = z.infer<typeof getMedicineSchema>;
export type UploadPrescriptionInput = z.infer<typeof uploadPrescriptionSchema>;
export type PlaceMedicineOrderInput = z.infer<typeof placeMedicineOrderSchema>;

