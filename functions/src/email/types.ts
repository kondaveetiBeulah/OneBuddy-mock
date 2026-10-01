import { z } from 'zod';

/**
 * Supported transactional email templates
 */
export const emailTemplateIdSchema = z.enum([
  'welcome',
  'order_confirmed',
  'ride_receipt',
  'appointment_booked',
  'booking_confirmed',
  'prescription_ready',
  'support_ticket_update',
  'custom',
]);

export type EmailTemplateId = z.infer<typeof emailTemplateIdSchema>;

/**
 * Canonical email lifecycle states matching Greenfield Section 4:
 * queued | processing | sent | retryable_failed | permanent_failed
 */
export const emailJobStatusSchema = z.enum([
  'queued',
  'processing',
  'sent',
  'retryable_failed',
  'permanent_failed',
]);

export type EmailJobStatus = z.infer<typeof emailJobStatusSchema>;

/**
 * Enqueue Transactional Email Schema
 */
export const enqueueTransactionalEmailSchema = z.object({
  recipientEmail: z.string().email('Valid recipient email required'),
  recipientName: z.string().optional(),
  recipientUid: z.string().optional(),
  templateId: emailTemplateIdSchema,
  templateData: z.record(z.string(), z.any()).default({}),
  subject: z.string().max(200).optional(),
  priority: z.enum(['high', 'normal', 'low']).default('normal'),
  idempotencyKey: z.string().min(8).max(128).optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
});

/**
 * Email Webhook Payload Schema
 */
export const emailProviderWebhookEventSchema = z.object({
  messageId: z.string().min(1),
  jobId: z.string().optional(),
  event: z.enum(['delivered', 'opened', 'clicked', 'bounced', 'dropped', 'spam_report']),
  recipient: z.string().email().optional(),
  timestamp: z.number().or(z.string()).optional(),
  reason: z.string().optional(),
});

export type EnqueueTransactionalEmailInput = z.infer<typeof enqueueTransactionalEmailSchema>;
export type EmailProviderWebhookEvent = z.infer<typeof emailProviderWebhookEventSchema>;
