// @ts-nocheck
/**
 * Skia renderer — the one to use in production.
 *
 * Each frame the engine hands back a depth-sorted list of polygons; we replay
 * them into a single SkPicture and hand that to one <Picture>. React only ever
 * reconciles one element per frame, so the cost is the Skia draw itself rather
 * than the React tree.
 *
 * Requires: npm i @shopify/react-native-skia
 *
 * If you would rather not add that dependency, SceneSvg.tsx renders the same
 * frames with react-native-svg. See Scene.tsx.
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { Canvas, Picture, Skia, createPicture, type SkPicture, type SkCanvas } from '@shopify/react-native-skia';

import { TrackingEngine } from './engine';
import type { Frame, Pin } from './engine';
import { COLORS } from '../theme';

interface Props {
  engine: TrackingEngine;
  width: number;
  height: number;
  paused?: boolean;
}

// Pre-allocated paints and paths, initialized lazily to avoid module load crashes
let sharedPath: any = null;
let fillPaint: any = null;
let strokePaint: any = null;
let ringPaint: any = null;
let pinPaint: any = null;
let pinTailPath: any = null;
let platePaint: any = null;
let labelPaint: any = null;

function ensurePaints(): boolean {
  if (sharedPath) return true;
  try {
    if (!Skia || typeof Skia.Path?.Make !== 'function') return false;
    sharedPath = Skia.Path.Make();
    fillPaint = Skia.Paint();
    fillPaint.setAntiAlias(true);
    fillPaint.setStyle(0);

    strokePaint = Skia.Paint();
    strokePaint.setAntiAlias(true);
    strokePaint.setStyle(1);
    strokePaint.setStrokeWidth(1);

    ringPaint = Skia.Paint();
    ringPaint.setAntiAlias(true);
    ringPaint.setStyle(1);
    ringPaint.setStrokeWidth(2);
    ringPaint.setColor(Skia.Color(COLORS.primary));
    ringPaint.setAlphaf(0.45);

    pinPaint = Skia.Paint();
    pinPaint.setAntiAlias(true);

    pinTailPath = Skia.Path.Make();

    platePaint = Skia.Paint();
    platePaint.setAntiAlias(true);
    platePaint.setColor(Skia.Color('rgba(255,255,255,0.94)'));

    labelPaint = Skia.Paint();
    labelPaint.setAntiAlias(true);
    labelPaint.setColor(Skia.Color(COLORS.ink));
    return true;
  } catch {
    return false;
  }
}

let cachedTypeface: any = null;
function getTypeface(): any {
  if (!cachedTypeface) {
    cachedTypeface = Skia.FontMgr.System().matchFamilyStyle('sans-serif', { weight: 700 });
  }
  return cachedTypeface;
}

const fontCache = new Map<number, any>();
function getFont(fontSize: number): any {
  const rounded = Math.round(fontSize * 10) / 10;
  let font = fontCache.get(rounded);
  if (!font) {
    font = Skia.Font(getTypeface(), rounded);
    fontCache.set(rounded, font);
  }
  return font;
}

let cachedSkyPaint: { height: number; paint: any } | null = null;
function getSkyPaint(height: number): any {
  if (!cachedSkyPaint || cachedSkyPaint.height !== height) {
    const sky = Skia.Paint();
    sky.setShader(
      Skia.Shader.MakeLinearGradient(
        Skia.Point(0, 0),
        Skia.Point(0, height),
        [Skia.Color('#D8F0D4'), Skia.Color('#EDF7EB'), Skia.Color('#F6FAF5')],
        [0, 0.55, 1],
        0,
      ),
    );
    cachedSkyPaint = { height, paint: sky };
  }
  return cachedSkyPaint.paint;
}

let cachedHazePaint: { height: number; paint: any } | null = null;
function getHazePaint(height: number): any {
  if (!cachedHazePaint || cachedHazePaint.height !== height) {
    const haze = Skia.Paint();
    haze.setShader(
      Skia.Shader.MakeLinearGradient(
        Skia.Point(0, 0),
        Skia.Point(0, height * 0.62),
        [Skia.Color('rgba(237,247,235,0.65)'), Skia.Color('rgba(237,247,235,0)')],
        [0, 1],
        0,
      ),
    );
    cachedHazePaint = { height, paint: haze };
  }
  return cachedHazePaint.paint;
}

function drawFrame(canvas: any, frame: Frame, width: number, height: number): void {
  if (!ensurePaints()) return;
  /* night sky */
  canvas.drawRect(Skia.XYWHRect(0, 0, width, height), getSkyPaint(height));

  const paintQuads = (quads: Frame['world']): void => {
    for (let i = 0; i < quads.length; i++) {
      const q = quads[i];
      sharedPath.rewind();
      sharedPath.moveTo(q.points[0], q.points[1]);
      for (let p = 2; p < q.points.length; p += 2) {
        sharedPath.lineTo(q.points[p], q.points[p + 1]);
      }
      sharedPath.close();

      const color = Skia.Color(q.color);
      fillPaint.setColor(color);
      fillPaint.setAlphaf(q.alpha);
      canvas.drawPath(sharedPath, fillPaint);

      strokePaint.setColor(color);
      strokePaint.setAlphaf(q.alpha);
      canvas.drawPath(sharedPath, strokePaint);
    }
  };

  paintQuads(frame.world);
  paintQuads(frame.rider);

  /* haze, so the far edge of the grid dissolves instead of ending */
  canvas.drawRect(Skia.XYWHRect(0, 0, width, height * 0.62), getHazePaint(height));

  /* the rider's pulse ring */
  if (frame.riderScreen) {
    canvas.save();
    canvas.translate(frame.riderScreen.x, frame.riderScreen.y);
    canvas.scale(1, 0.37);
    canvas.drawCircle(0, 0, frame.riderScreen.radius, ringPaint);
    canvas.restore();
  }

  frame.pins.forEach((pin: Pin) => drawPin(canvas, pin, width));
}

function drawPin(canvas: any, pin: Pin, width: number): void {
  const scale = pin.scale;
  const h = 30 * scale;
  const rr = 8.5 * scale;
  const headY = pin.y - h;

  const color = Skia.Color(pin.color);
  pinPaint.setColor(color);

  pinPaint.setAlphaf(0.35);
  canvas.save();
  canvas.translate(pin.x, pin.y);
  canvas.scale(1, 0.38);
  canvas.drawCircle(0, 0, 9 * scale, pinPaint);
  canvas.restore();
  pinPaint.setAlphaf(1);

  pinTailPath.rewind();
  pinTailPath.moveTo(pin.x, pin.y);
  pinTailPath.lineTo(pin.x - rr * 0.62, headY + rr * 0.72);
  pinTailPath.lineTo(pin.x + rr * 0.62, headY + rr * 0.72);
  pinTailPath.close();
  canvas.drawPath(pinTailPath, pinPaint);
  canvas.drawCircle(pin.x, headY, rr, pinPaint);

  if (scale > 0.8) {
    const font = getFont(10.5 * scale);
    const textWidth = font.measureText(pin.label).width;
    const pad = 7 * scale;
    const bx = Math.max(textWidth / 2 + pad + 6, Math.min(width - textWidth / 2 - pad - 6, pin.x));
    const by = headY - rr - 8 * scale;

    canvas.drawRRect(
      Skia.RRectXY(
        Skia.XYWHRect(bx - textWidth / 2 - pad, by - 9 * scale, textWidth + pad * 2, 18 * scale),
        6 * scale,
        6 * scale,
      ),
      platePaint,
    );

    canvas.drawText(pin.label, bx - textWidth / 2, by + 3.5 * scale, labelPaint, font);
  }
}

export default function SceneSkia({ engine, width, height, paused }: Props): React.JSX.Element {
  const [picture, setPicture] = useState<SkPicture | null>(null);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);

  useEffect(() => {
    if (paused) return undefined;
    last.current = Date.now();

    const tick = (): void => {
      const now = Date.now();
      const dt = (now - last.current) / 1000;
      last.current = now;
      const frame = engine.step(dt);
      setPicture(
        createPicture((canvas: SkCanvas) => {
          drawFrame(canvas, frame, width, height);
        }),
      );
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [engine, width, height, paused]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>{picture ? <Picture picture={picture} /> : null}</Canvas>
    </View>
  );
}
