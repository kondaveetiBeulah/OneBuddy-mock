/**
 * Picks the renderer.
 *
 * Skia draws the whole frame into one SkPicture and is what you want on a
 * device. The SVG renderer needs no extra native module, so it runs in Expo Go
 * and in any build that already has react-native-svg — at a lower frame rate.
 *
 * Flip RENDERER once you have run `npx expo install @shopify/react-native-skia`.
 */
import React, { useEffect, useMemo } from 'react';

import { TrackingEngine } from './engine';
import type { CameraMode } from './engine';
import SceneSvg from './SceneSvg';

let hasNativeSkia = false;
try {
  const { Skia } = require('@shopify/react-native-skia');
  hasNativeSkia = Boolean(Skia && typeof Skia.Path?.Make === 'function');
} catch {
  hasNativeSkia = false;
}

/** Automatically uses Skia if native binaries are linked, or falls back to SVG for Expo Go */
export const RENDERER: 'svg' | 'skia' = hasNativeSkia ? 'skia' : 'svg';

interface Props {
  width: number;
  height: number;
  stageIndex: number;
  cameraMode: CameraMode;
  reduceMotion?: boolean;
  paused?: boolean;
}

export default function Scene({
  width,
  height,
  stageIndex,
  cameraMode,
  reduceMotion,
  paused,
}: Props): React.JSX.Element | null {
  const isSkia = RENDERER === 'skia' && hasNativeSkia;

  const engine = useMemo(
    () =>
      new TrackingEngine({
        width,
        height,
        quality: isSkia ? 'high' : 'low',
        reduceMotion,
      }),
    // a resize rebuilds the engine, which is rare and cheap enough
    [width, height, reduceMotion, isSkia],
  );

  useEffect(() => {
    engine.setStage(stageIndex);
  }, [engine, stageIndex]);

  useEffect(() => {
    engine.setCameraMode(cameraMode);
  }, [engine, cameraMode]);

  if (width < 2 || height < 2) return null;

  if (isSkia) {
    const SceneSkia = require('./SceneSkia').default;
    return <SceneSkia engine={engine} width={width} height={height} paused={paused} />;
  }

  return <SceneSvg engine={engine} width={width} height={height} paused={paused} />;
}
