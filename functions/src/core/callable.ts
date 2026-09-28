import { onCall, CallableRequest, CallableOptions } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { log, throwError } from './logger';

export interface AuthenticatedContext extends CallableRequest {
  auth: NonNullable<CallableRequest['auth']>;
}

export type Handler<Data, Return> = (
  data: Data,
  context: AuthenticatedContext
) => Promise<Return> | Return;

/**
 * A standardized wrapper for all HTTPS Callable functions.
 * Enforces:
 * 1. The user must be authenticated (signed in).
 * 2. The incoming data must match the Zod schema for type safety.
 * 3. All errors are caught and logged consistently.
 */
export function secureCallable<Schema extends z.ZodTypeAny, Return>(
  schema: Schema,
  handler: Handler<z.infer<Schema>, Return>,
  options?: CallableOptions
) {
  return onCall({ region: 'asia-south1', ...options }, async (request: CallableRequest) => {
    // 1. Enforce Authentication
    if (!request.auth || !request.auth.uid) {
      throwError('unauthenticated', 'You must be signed in to perform this action.');
    }

    // 2. Enforce Data Validation
    const validation = schema.safeParse(request.data);
    if (!validation.success) {
      throwError('invalid-argument', 'Invalid request data', validation.error.format());
    }

    // 3. Execute Handler and Catch Errors
    try {
      const data = validation.data;
      const context = request as AuthenticatedContext;
      
      const result = await handler(data, context);
      return result;
    } catch (error: any) {
      // If it's already an HttpsError, rethrow it (we already logged it in throwError)
      if (error.code && error.httpErrorCode) {
        throw error;
      }
      // Otherwise, it's an unexpected internal error
      log.error('Unexpected error in secureCallable', error, {
        uid: request.auth.uid,
        data: request.data,
      });
      throwError('internal', 'An unexpected error occurred. Please try again later.');
    }
  });
}
