import { logger } from 'firebase-functions/v2';
import { HttpsError } from 'firebase-functions/v2/https';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Standardized logging for OneBuddy.
 * Wraps Firebase v2 structured logger to enforce consistent log payloads.
 */
export const log = {
  info: (message: string, payload?: any) => {
    logger.info(message, { ...(typeof payload === 'object' ? payload : { detail: payload }), timestamp: Timestamp.now() });
  },
  warn: (message: string, payload?: any) => {
    logger.warn(message, { ...(typeof payload === 'object' ? payload : { detail: payload }), timestamp: Timestamp.now() });
  },
  error: (message: string, error?: unknown, payload?: any) => {
    logger.error(message, {
      ...(typeof payload === 'object' ? payload : { detail: payload }),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: Timestamp.now(),
    });
  },
};

/**
 * Throws a standardized Firebase HttpsError and logs it automatically.
 */
export function throwError(
  code: 'unauthenticated' | 'permission-denied' | 'invalid-argument' | 'internal' | 'not-found' | 'already-exists' | 'failed-precondition' | 'resource-exhausted',
  message: string,
  details?: unknown
): never {
  log.error(`[HTTPS Error: ${code}] ${message}`, details);
  throw new HttpsError(code, message, details);
}
