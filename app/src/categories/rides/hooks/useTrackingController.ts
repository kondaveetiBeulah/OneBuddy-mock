import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent } from 'react-native';
import type { CameraMode } from '../tracking/engine';
import { STAGES } from '../tracking/engine';
import { createTrackingDispatcher, defaultTrackingMiddlewares, type TrackingMiddleware } from '../middleware/trackingMiddleware';

export type SheetKind = 'help' | 'chat' | 'order' | null;

export interface UseTrackingControllerOptions {
  controlledStage?: number;
  reduceMotion: boolean;
  onCallRider?: () => void;
  onHelp?: () => void;
  middlewares?: TrackingMiddleware[];
}

export function useTrackingController({
  controlledStage,
  reduceMotion,
  onCallRider,
  onHelp,
  middlewares = defaultTrackingMiddlewares,
}: UseTrackingControllerOptions) {
  const [internalStage, setInternalStage] = useState(0);
  const stageIndex = controlledStage ?? internalStage;
  const stage = STAGES[stageIndex];

  const [cameraMode, setCameraModeState] = useState<CameraMode>('follow');
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [canvas, setCanvas] = useState({ width: 0, height: 0 });

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  // Initialize middleware dispatcher
  const dispatcher = useMemo(() => createTrackingDispatcher(middlewares), [middlewares]);

  /* demo walk-through: only when the caller is not driving the stage */
  useEffect(() => {
    if (controlledStage !== undefined || reduceMotion) return undefined;
    const first = setTimeout(() => {
      setInternalStage((prev) => {
        const next = prev === 0 ? 1 : prev;
        dispatcher({ type: 'STAGE_CHANGE', stageIndex: next, previousIndex: prev });
        return next;
      });
    }, 4200);

    const second = setTimeout(() => {
      setInternalStage((prev) => {
        const next = prev === 1 ? 2 : prev;
        dispatcher({ type: 'STAGE_CHANGE', stageIndex: next, previousIndex: prev });
        return next;
      });
    }, 9000);

    return () => {
      clearTimeout(first);
      clearTimeout(second);
    };
  }, [controlledStage, reduceMotion, dispatcher]);

  // Clean up toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback(
    (message: string) => {
      dispatcher({ type: 'NOTIFICATION', message }, (event) => {
        if (event.type === 'NOTIFICATION') {
          setToast(event.message);
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(null), 2200);
        }
      });
    },
    [dispatcher],
  );

  const setCameraMode = useCallback(
    (mode: CameraMode) => {
      dispatcher({ type: 'CAMERA_MODE_CHANGE', mode }, (event) => {
        if (event.type === 'CAMERA_MODE_CHANGE') {
          setCameraModeState(event.mode);
        }
      });
    },
    [dispatcher],
  );

  const setStageIndex = useCallback(
    (index: number) => {
      dispatcher({ type: 'STAGE_CHANGE', stageIndex: index, previousIndex: stageIndex }, (event) => {
        if (event.type === 'STAGE_CHANGE') {
          setInternalStage(event.stageIndex);
        }
      });
    },
    [dispatcher, stageIndex],
  );

  const handleCallRider = useCallback(() => {
    dispatcher({ type: 'RIDER_ACTION', action: 'call', riderName: stage.riderName });
    if (onCallRider) {
      onCallRider();
    } else {
      showToast(`Calling ${stage.riderName.split(' ')[0]}…`);
    }
  }, [dispatcher, onCallRider, showToast, stage.riderName]);

  const handleChatRider = useCallback(() => {
    dispatcher({ type: 'RIDER_ACTION', action: 'chat', riderName: stage.riderName });
    setSheet('chat');
  }, [dispatcher, stage.riderName]);

  const handleHelp = useCallback(() => {
    dispatcher({ type: 'SUPPORT_ACTION', actionType: 'help', title: 'Help & support' });
    if (onHelp) {
      onHelp();
    } else {
      setSheet('help');
    }
  }, [dispatcher, onHelp]);

  const onCanvasLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvas((prev) =>
      Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1 ? prev : { width, height },
    );
  }, []);

  /* pulse animation on the ETA badge */
  useEffect(() => {
    if (reduceMotion) return undefined;
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  return {
    stageIndex,
    setStageIndex,
    stage,
    cameraMode,
    setCameraMode,
    sheet,
    setSheet,
    toast,
    showToast,
    canvas,
    onCanvasLayout,
    pulse,
    handleCallRider,
    handleChatRider,
    handleHelp,
  };
}
