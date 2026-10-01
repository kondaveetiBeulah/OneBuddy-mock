import { onCall, CallableRequest, CallableOptions } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { log } from './logging';
import { throwError, AppError } from './errors';

export interface AuthenticatedContext extends CallableRequest {
  auth: NonNullable<CallableRequest['auth']>;
}

export type Handler<Data, Return> = (
  data: Data,
  context: AuthenticatedContext
) => Promise<Return> | Return;

/**
 * Asserts that the incoming request has a verified Firebase Auth identity.
 */
export function assertAuthenticated(request: CallableRequest): asserts request is AuthenticatedContext {
  if (!request.auth || !request.auth.uid) {
    throwError('unauthenticated', 'You must be signed in to perform this action.');
  }
}

/**
 * Asserts that the authenticated caller owns the target user resource.
 */
export function assertOwner(context: AuthenticatedContext, targetUid: string): void {
  if (context.auth.uid !== targetUid) {
    throwError('permission-denied', 'You do not have permission to access or modify this resource.');
  }
}

/**
 * Asserts that the authenticated caller possesses administrative claims.
 */
export function assertAdmin(context: AuthenticatedContext): void {
  if (context.auth.token?.admin !== true) {
    throwError('permission-denied', 'Administrative privileges required.');
  }
}

/**
 * Standardized wrapper for authenticated HTTPS Callable functions.
 * Enforces:
 * 1. User must be signed in.
 * 2. Incoming data matches the Zod schema.
 * 3. Consistent structured logging with actorUid and requestId.
 * 4. Safe error handling (stack traces never leak to client).
 */
export function secureCallable<Schema extends z.ZodTypeAny, Return>(
  schema: Schema,
  handler: Handler<z.infer<Schema>, Return>,
  options?: CallableOptions
) {
  return onCall({ region: 'asia-south1', ...options }, async (request: CallableRequest) => {
    // 1. Enforce Authentication
    assertAuthenticated(request);

    const uid = request.auth.uid;
    const rawReq = (request as any).rawRequest;
    const requestId = (rawReq?.headers?.['x-request-id'] as string) || `req_${Date.now()}`;

    // 2. Enforce Data Validation
    const validation = schema.safeParse(request.data);
    if (!validation.success) {
      log.warn('[secureCallable] Validation failure', {
        requestId,
        uid,
        errors: validation.error.format(),
      });
      throwError('invalid-argument', 'Invalid request data', validation.error.format());
    }

    // 3. Execute Handler and Catch Errors Safely
    try {
      const data = validation.data;
      const context = request as AuthenticatedContext;
      const result = await handler(data, context);
      return result;
    } catch (error: any) {
      if (error instanceof AppError) {
        log.warn(`[secureCallable] AppError: ${error.message}`, { requestId, uid, code: error.code });
        throw error.toHttpsError();
      }

      if (error.code && error.httpErrorCode) {
        // Already a Firebase HttpsError
        throw error;
      }

      log.error('[secureCallable] Unexpected exception', error, {
        requestId,
        uid,
        data: request.data,
      });

      throwError('internal', `An internal error occurred. (Request ID: ${requestId})`);
    }
  });
}

/**
 * Standardized wrapper for public / unauthenticated HTTPS Callable functions (e.g. OTP, public catalog).
 */
export function publicCallable<Schema extends z.ZodTypeAny, Return>(
  schema: Schema,
  handler: (data: z.infer<Schema>, request: CallableRequest) => Promise<Return> | Return,
  options?: CallableOptions
) {
  return onCall({ region: 'asia-south1', ...options }, async (request: CallableRequest) => {
    const rawReq = (request as any).rawRequest;
    const requestId = (rawReq?.headers?.['x-request-id'] as string) || `req_${Date.now()}`;

    const validation = schema.safeParse(request.data);
    if (!validation.success) {
      log.warn('[publicCallable] Validation failure', {
        requestId,
        errors: validation.error.format(),
      });
      throwError('invalid-argument', 'Invalid request data', validation.error.format());
    }

    try {
      const result = await handler(validation.data, request);
      return result;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error.toHttpsError();
      }
      if (error.code && error.httpErrorCode) {
        throw error;
      }

      log.error('[publicCallable] Unexpected exception', error, { requestId });
      throwError('internal', `An unexpected error occurred. (Request ID: ${requestId})`);
    }
  });
}
