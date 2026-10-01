import { z } from 'zod';
import { ServiceCategory } from '../domain/enums';

/**
 * Order Feedback Submission Schema matching Greenfield Section 4
 */
export const submitOrderFeedbackSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  service: z
    .enum(['food', 'groceries', 'healthcare', 'rides', 'homeservices'] as [
      ServiceCategory,
      ...ServiceCategory[]
    ])
    .optional(),
  category: z
    .enum(['food', 'groceries', 'healthcare', 'rides', 'homeservices'] as [
      ServiceCategory,
      ...ServiceCategory[]
    ])
    .optional(),
  overallRating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').optional(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5').optional(),
  categoryRatings: z.record(z.string(), z.number().int().min(1).max(5)).optional(),
  comment: z.string().max(1000).optional(),
  photoPaths: z.array(z.string().max(250)).max(5).optional().default([]),
  restaurantId: z.string().optional(),
  driverId: z.string().optional(),
  providerId: z.string().optional(),
  aspects: z.array(z.string().max(50)).optional().default([]),
  driverRating: z.number().int().min(1).max(5).optional(),
  merchantRating: z.number().int().min(1).max(5).optional(),
});


/**
 * Support Ticket Creation Schema
 */
export const createSupportRequestSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
  description: z.string().min(10, 'Please describe your issue in at least 10 characters').max(2000),
  category: z
    .enum(['order', 'ride', 'appointment', 'booking', 'payment', 'account', 'general'])
    .default('general'),
  relatedEntityId: z.string().optional(),
  attachments: z.array(z.string().url()).optional().default([]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

/**
 * List Support Tickets Schema
 */
export const listMySupportRequestsSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  limit: z.number().int().positive().max(50).default(20),
  cursor: z.string().optional(),
});


export type SubmitOrderFeedbackInput = z.infer<typeof submitOrderFeedbackSchema>;
export type CreateSupportRequestInput = z.infer<typeof createSupportRequestSchema>;
export type ListMySupportRequestsInput = z.infer<typeof listMySupportRequestsSchema>;
