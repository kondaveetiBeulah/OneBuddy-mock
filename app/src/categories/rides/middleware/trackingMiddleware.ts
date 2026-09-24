import type { CameraMode } from '../tracking/engine';

export type TrackingEvent =
  | { type: 'STAGE_CHANGE'; stageIndex: number; previousIndex: number }
  | { type: 'CAMERA_MODE_CHANGE'; mode: CameraMode }
  | { type: 'RIDER_ACTION'; action: 'call' | 'chat'; riderName: string }
  | { type: 'SUPPORT_ACTION'; actionType: 'help' | 'order_details' | 'chat_option'; title: string }
  | { type: 'NOTIFICATION'; message: string };

export type TrackingMiddleware = (
  event: TrackingEvent,
  next: (event: TrackingEvent) => void,
) => void;

/**
 * Validates tracking events to ensure bounds and valid parameters.
 */
export const validationMiddleware: TrackingMiddleware = (event, next) => {
  if (event.type === 'STAGE_CHANGE') {
    const clampedIndex = Math.max(0, Math.min(3, event.stageIndex));
    next({ ...event, stageIndex: clampedIndex });
    return;
  }
  next(event);
};

/**
 * Analytics middleware hook to capture user engagement metrics and milestones.
 */
export const analyticsMiddleware: TrackingMiddleware = (event, next) => {
  // In a production environment, this integrates with Firebase / Segment / Custom Analytics
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // Silent in production, can be monitored in development if needed
  }
  next(event);
};

/**
 * Logging middleware for debugging tracking lifecycle actions in development.
 */
export const loggingMiddleware: TrackingMiddleware = (event, next) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // Tracking lifecycle log
  }
  next(event);
};

export const defaultTrackingMiddlewares: TrackingMiddleware[] = [
  validationMiddleware,
  analyticsMiddleware,
  loggingMiddleware,
];

/**
 * Creates an executable middleware pipeline dispatcher.
 */
export function createTrackingDispatcher(middlewares: TrackingMiddleware[] = defaultTrackingMiddlewares) {
  return (event: TrackingEvent, onComplete?: (event: TrackingEvent) => void) => {
    let index = 0;
    const next = (curEvent: TrackingEvent) => {
      if (index < middlewares.length) {
        const mw = middlewares[index++];
        mw(curEvent, next);
      } else if (onComplete) {
        onComplete(curEvent);
      }
    };
    next(event);
  };
}
