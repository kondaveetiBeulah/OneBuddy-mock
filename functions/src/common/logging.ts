import { logger } from 'firebase-functions/v2';
import { Timestamp } from 'firebase-admin/firestore';

export interface LogContext {
  requestId?: string;
  traceId?: string;
  actorUid?: string;
  entityType?: string;
  entityId?: string;
  operation?: string;
  errorCode?: string;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'refreshtoken',
  'idtoken',
  'otp',
  'cvv',
  'pan',
  'cardnumber',
  'creditcard',
  'authorization',
  'secret',
  'diagnosis',
  'symptoms',
  'medicalhistory',
  'vitals',
  'prescription',
]);

/**
 * Recursively redacts sensitive keys and medical/credential payloads.
 */
export function sanitizePayload(payload: unknown, depth = 0): unknown {
  if (depth > 5) return '[TRUNCATED_DEPTH]';
  if (payload === null || payload === undefined) return payload;

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item, depth + 1));
  }

  if (typeof payload === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lower) || lower.includes('password') || lower.includes('secret') || lower.includes('otp')) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizePayload(value, depth + 1);
      }
    }
    return sanitized;
  }

  return payload;
}

/**
 * Structured logger for Google Cloud Logging.
 */
export const log = {
  info: (message: string, context?: LogContext | unknown) => {
    const payload = typeof context === 'object' && context !== null
      ? sanitizePayload(context)
      : { detail: context };
    logger.info(message, {
      severity: 'INFO',
      ...(payload as Record<string, unknown>),
      timestamp: Timestamp.now(),
    });
  },

  warn: (message: string, context?: LogContext | unknown) => {
    const payload = typeof context === 'object' && context !== null
      ? sanitizePayload(context)
      : { detail: context };
    logger.warn(message, {
      severity: 'WARNING',
      ...(payload as Record<string, unknown>),
      timestamp: Timestamp.now(),
    });
  },

  error: (message: string, error?: unknown, context?: LogContext | unknown) => {
    const payload = typeof context === 'object' && context !== null
      ? sanitizePayload(context)
      : { detail: context };

    logger.error(message, {
      severity: 'ERROR',
      ...(payload as Record<string, unknown>),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: Timestamp.now(),
    });
  },

  audit: (action: string, context: LogContext) => {
    logger.info(`[AUDIT] ${action}`, {
      severity: 'NOTICE',
      action,
      ...sanitizePayload(context) as Record<string, unknown>,
      timestamp: Timestamp.now(),
    });
  },
};
