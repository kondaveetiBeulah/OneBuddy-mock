import { HttpsError } from 'firebase-functions/v2/https';

export type HttpsErrorCode =
  | 'ok'
  | 'cancelled'
  | 'unknown'
  | 'invalid-argument'
  | 'deadline-exceeded'
  | 'not-found'
  | 'already-exists'
  | 'permission-denied'
  | 'resource-exhausted'
  | 'failed-precondition'
  | 'aborted'
  | 'out-of-range'
  | 'unimplemented'
  | 'internal'
  | 'unavailable'
  | 'data-loss'
  | 'unauthenticated';

/**
 * Custom application domain error.
 */
export class AppError extends Error {
  constructor(
    public readonly code: HttpsErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toHttpsError(): HttpsError {
    return new HttpsError(this.code, this.message, this.details);
  }
}

export class NotFoundError extends AppError {
  constructor(entityName: string, identifier?: string) {
    super('not-found', `${entityName}${identifier ? ` "${identifier}"` : ''} not found.`);
  }
}

export class PermissionDeniedError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action.') {
    super('permission-denied', message);
  }
}

export class PreconditionFailedError extends AppError {
  constructor(message: string) {
    super('failed-precondition', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Invalid request data', details?: unknown) {
    super('invalid-argument', message, details);
  }
}

/**
 * Throws a standardized Firebase HttpsError.
 */
export function throwError(
  code: HttpsErrorCode,
  message: string,
  details?: unknown
): never {
  throw new HttpsError(code, message, details);
}
