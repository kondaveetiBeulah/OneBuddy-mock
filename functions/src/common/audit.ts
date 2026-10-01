import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from '../core/firebase';
import { log, sanitizePayload } from './logging';
import { secureCallable } from './auth';
import { ActorType } from '../domain/enums';

export { ActorType };

export type AuditEntityType =
  | 'order'
  | 'ride'
  | 'appointment'
  | 'booking'
  | 'user'
  | 'payment'
  | 'prescription'
  | 'support_ticket'
  | 'security'
  | 'system';

export interface AuditEventInput {
  actorUid: string;
  actorType?: ActorType;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * 1. writeAuditEvent: Writes an immutable audit log record to auditEvents/{eventId}.
 * Automatically sanitizes metadata to ensure PHI and credentials are never stored.
 */
export async function writeAuditEvent(event: AuditEventInput): Promise<string> {
  const eventRef = db.collection('auditEvents').doc();
  const sanitizedMeta = event.metadata
    ? (sanitizePayload(event.metadata) as Record<string, unknown>)
    : {};

  const now = FieldValue.serverTimestamp();
  const record = {
    eventId: eventRef.id,
    actorId: event.actorUid,
    actorUid: event.actorUid,
    actorType: event.actorType || 'user',
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    metadata: sanitizedMeta,
    ipAddress: event.ipAddress || null,
    userAgent: event.userAgent || null,
    createdAt: now,
    timestamp: now,
  };

  await eventRef.set(record);

  log.audit(event.action, {
    actorUid: event.actorUid,
    eventId: eventRef.id,
    entityType: event.entityType,
    entityId: event.entityId,
    ...sanitizedMeta,
  });

  return eventRef.id;
}

/**
 * Client-facing schema for recording verified security and consent events
 */
export const recordAuditEventSchema = z.object({
  action: z.string().min(1, 'Action is required').max(100),
  entityType: z.enum([
    'order',
    'ride',
    'appointment',
    'booking',
    'user',
    'payment',
    'prescription',
    'support_ticket',
    'security',
    'system',
  ]),
  entityId: z.string().min(1, 'Entity ID is required'),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

/**
 * 2. recordAuditEvent: Callable endpoint allowing verified clients to record audit events.
 */
export const recordAuditEvent = secureCallable(
  recordAuditEventSchema,
  async (data, context) => {
    const rawReq = (context as any).rawRequest;
    const ipAddress = (rawReq?.headers?.['x-forwarded-for'] as string) || rawReq?.ip || null;
    const userAgent = (rawReq?.headers?.['user-agent'] as string) || null;

    const eventId = await writeAuditEvent({
      actorUid: context.auth.uid,
      actorType: context.auth.token?.admin === true ? 'admin' : 'user',
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: data.metadata,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      eventId,
    };
  }
);
