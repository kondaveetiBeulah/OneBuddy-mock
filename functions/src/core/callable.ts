/**
 * Backward-compatible bridge to functions/src/common/auth
 */
export {
  AuthenticatedContext,
  Handler,
  assertAuthenticated,
  assertOwner,
  assertAdmin,
  secureCallable,
  publicCallable,
} from '../common/auth';
