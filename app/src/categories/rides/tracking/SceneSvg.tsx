/**
 * react-native-svg renderer.
 *
 * Draws the same frames as the Skia renderer using only react-native-svg,
 * which the OneBuddy app already depends on — so this runs today with no new
 * native module and no rebuild.
 *
 * The trade-off is real: every polygon is a view in the SVG tree, and React
 * reconciles all of them on every frame. It runs the engine at 'low' quality
 * and caps the frame rate, which lands around 30fps on a mid-range phone
 * instead of 60. Use SceneSkia for production and this for a quick build, a
 * simulator, or Expo Go.
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { TrackingEngine } from './engine';
import type { Frame } from './engine';
import { COLORS } from '../theme';

interface Props {
  engine: TrackingEngine;
  width: number;
  height: number;
  paused?: boolean;
  /** Frames per second to aim for. Lower is smoother on weak devices. */
  fps?: number;
}

function pointsOf(flat: number[]): string {
  let out = '';
  for (let i = 0; i < flat.length; i += 2) {
    out += `${flat[i].toFixed(1)},${flat[i + 1].toFixed(1)} `;
  }
  return out.trim();
}

export default function SceneSvg({ engine, width, height, paused, fps = 30 }: Props): React.JSX.Element {
  const [frame, setFrame] = useState<Frame | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const last = useRef<number>(Date.now());

  useEffect(() => {
    if (paused) return undefined;
    last.current = Date.now();
    timer.current = setInterval(() => {
      const now = Date.now();
      const dt = (now - last.current) / 1000;
      last.current = now;
      setFrame(engine.step(dt));
    }, Math.round(1000 / fps));
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [engine, paused, fps]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#D8F0D4" />
            <Stop offset="0.55" stopColor="#EDF7EB" />
            <Stop offset="1" stopColor="#F6FAF5" />
          </LinearGradient>
          <LinearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#EDF7EB" stopOpacity="0.65" />
            <Stop offset="1" stopColor="#EDF7EB" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Rect x={0} y={0} width={width} height={height} fill="url(#sky)" />

        {frame
          ? frame.world.map((q, i) => (
              <Polygon
                key={`w${i}`}
                points={pointsOf(q.points)}
                fill={q.color}
                fillOpacity={q.alpha}
                stroke={q.color}
                strokeWidth={0.5}
              />
            ))
          : null}

        <Rect x={0} y={0} width={width} height={height * 0.62} fill="url(#haze)" />

        {frame
          ? frame.rider.map((q, i) => (
              <Polygon
                key={`r${i}`}
                points={pointsOf(q.points)}
                fill={q.color}
                fillOpacity={q.alpha}
                stroke={q.color}
                strokeWidth={1}
              />
            ))
          : null}

        {frame?.riderScreen ? (
          <G
            transform={`translate(${frame.riderScreen.x.toFixed(1)}, ${frame.riderScreen.y.toFixed(1)}) scale(1, 0.37)`}
          >
            <Circle
              cx={0}
              cy={0}
              r={frame.riderScreen.radius}
              stroke={COLORS.primary}
              strokeOpacity={0.45}
              strokeWidth={2}
              fill="none"
            />
          </G>
        ) : null}

        {frame?.pins.map((pin, i) => {
          const h = 30 * pin.scale;
          const rr = 8.5 * pin.scale;
          const headY = pin.y - h;
          const showLabel = pin.scale > 0.8;
          const labelWidth = pin.label.length * 5.6 * pin.scale + 14 * pin.scale;
          const bx = Math.max(labelWidth / 2 + 6, Math.min(width - labelWidth / 2 - 6, pin.x));
          const by = headY - rr - 8 * pin.scale;
          return (
            <G key={`p${i}`}>
              <G transform={`translate(${pin.x.toFixed(1)}, ${pin.y.toFixed(1)}) scale(1, 0.38)`}>
                <Circle cx={0} cy={0} r={9 * pin.scale} fill={pin.color} fillOpacity={0.35} />
              </G>
              <Path
                d={`M ${pin.x} ${pin.y} L ${pin.x - rr * 0.62} ${headY + rr * 0.72} L ${pin.x + rr * 0.62} ${
                  headY + rr * 0.72
                } Z`}
                fill={pin.color}
              />
              <Circle cx={pin.x} cy={headY} r={rr} fill={pin.color} />
              {showLabel ? (
                <>
                  <Rect
                    x={bx - labelWidth / 2}
                    y={by - 9 * pin.scale}
                    width={labelWidth}
                    height={18 * pin.scale}
                    rx={6 * pin.scale}
                    fill="#FFFFFF"
                    fillOpacity={0.94}
                    stroke="#D6E4D4"
                    strokeWidth={0.8}
                  />
                  <SvgText
                    x={bx}
                    y={by + 3.5 * pin.scale}
                    fill={COLORS.ink}
                    fontSize={10.5 * pin.scale}
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {pin.label}
                  </SvgText>
                </>
              ) : null}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
