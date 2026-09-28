import { logger } from 'firebase-functions/v2';
import { HttpsError } from 'firebase-functions/v2/https';

/**
 * Standardized logging for OneBuddy.
 * Wraps Firebase v2 structured logger to enforce consistent log payloads.
 */
export const log = {
  info: (message: string, payload?: Record<string, unknown>) => {
    logger.info(message, { ...payload, timestamp: new Date().toISOString() });
  },
  warn: (message: string, payload?: Record<string, unknown>) => {
    logger.warn(message, { ...payload, timestamp: new Date().toISOString() });
  },
  error: (message: string, error?: unknown, payload?: Record<string, unknown>) => {
    logger.error(message, {
      ...payload,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  },
};

/**
 * Throws a standardized Firebase HttpsError and logs it automatically.
 */
export function throwError(
  code: 'unauthenticated' | 'permission-denied' | 'invalid-argument' | 'internal' | 'not-found' | 'already-exists' | 'failed-precondition',
  message: string,
  details?: unknown
): never {
  log.error(`[HTTPS Error: ${code}] ${message}`, details);
  throw new HttpsError(code, message, details);
}
