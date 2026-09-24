// Pure 2D Live Tracking Map with dynamic control panel
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import Svg, {
  Circle,
  G,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { FONTS } from '../theme';
import { MapControlPanel } from './MapControlPanel';

/**
 * Route Waypoints exactly matching Screenshot 2:
 * Starts on Golf Course Rd -> turns onto Sector 16 Main Rd -> runs northwest ->
 * turns right into interior sector road -> turns north -> turns left into crescent ->
 * arrives at the Destination House Pin.
 */
export const MAP_ROUTE_WAYPOINTS = [
  // Golf Course Rd approach
  { x: 236, y: 395 },
  { x: 230, y: 382 },
  { x: 220, y: 362 },
  { x: 206, y: 338 },
  // Sector 16 Main Rd stretch heading northwest
  { x: 194, y: 316 },
  { x: 182, y: 294 },
  { x: 168, y: 268 },
  { x: 154, y: 240 },
  { x: 140, y: 212 },
  { x: 128, y: 186 },
  { x: 118, y: 162 },
  { x: 110, y: 140 },
  // Turn right into interior sector road
  { x: 118, y: 136 },
  { x: 136, y: 144 },
  { x: 160, y: 158 },
  { x: 186, y: 174 },
  { x: 212, y: 190 },
  { x: 234, y: 204 },
  { x: 254, y: 220 },
  // Turn north into sector lane
  { x: 256, y: 205 },
  { x: 256, y: 185 },
  { x: 254, y: 165 },
  { x: 248, y: 150 },
  // Turn west/northwest into crescent cul-de-sac
  { x: 236, y: 136 },
  { x: 218, y: 122 },
  { x: 198, y: 108 },
  { x: 178, y: 96 },
  { x: 162, y: 90 },
  { x: 154, y: 88 },
];

/**
 * Sub-interpolated route points for 60fps smooth movement
 */
function interpolateWaypoints(pts: { x: number; y: number }[], steps = 8) {
  const result: { x: number; y: number; heading: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const heading = (Math.atan2(dy, dx) * 180) / Math.PI + 90; // Top-down vehicle orientation

    for (let s = 0; s < steps; s++) {
      const frac = s / steps;
      result.push({
        x: p1.x + dx * frac,
        y: p1.y + dy * frac,
        heading,
      });
    }
  }
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const h = (Math.atan2(last.y - prev.y, last.x - prev.x) * 180) / Math.PI + 90;
  result.push({ x: last.x, y: last.y, heading: h });
  return result;
}

const DENSE_ROUTE = interpolateWaypoints(MAP_ROUTE_WAYPOINTS, 12);

export interface LiveTrackingMap2DProps {
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onReset?: () => void;
  driverName?: string;
  storeName?: string;
  destinationName?: string;
  autoCenterEnabled?: boolean;
  onToggleAutoCenter?: (enabled: boolean) => void;
  bottomOffset?: number;
  topInset?: number;
  bottomSheetHeight?: number;
}

export function LiveTrackingMap2D({
  isPlaying = true,
  onTogglePlay: _onTogglePlay,
  onReset: _onReset,
  driverName: _driverName,
  storeName: _storeName,
  destinationName: _destinationName = 'Lotus Residency',
  autoCenterEnabled = true,
  onToggleAutoCenter,
  bottomOffset = 16,
  topInset: _topInset = 44,
}: LiveTrackingMap2DProps): React.JSX.Element {
  // Animation state for vehicle along the route
  const [routeIndex, setRouteIndex] = useState(85); // Initial position on Sector 16 Main Rd like in screenshot 2
  const [isAutoCenter, setIsAutoCenter] = useState(autoCenterEnabled);

  // Pan & Zoom values
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1.1)).current;

  const currentPan = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1.1);

  // Pulse animation for destination marker
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Live courier movement ticker
  useEffect(() => {
    if (!isPlaying) return undefined;

    const interval = setInterval(() => {
      setRouteIndex((prev) => (prev + 1) % DENSE_ROUTE.length);
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentPoint = DENSE_ROUTE[routeIndex] || DENSE_ROUTE[0];

  // Auto-center camera following courier smoothly
  useEffect(() => {
    if (!isAutoCenter) return;

    // Center of map viewBox is roughly (190, 220)
    const targetOffsetX = (190 - currentPoint.x) * 0.7;
    const targetOffsetY = (220 - currentPoint.y) * 0.7;

    Animated.spring(panX, {
      toValue: targetOffsetX,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
    }).start();

    Animated.spring(panY, {
      toValue: targetOffsetY,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
    }).start();

    currentPan.current = { x: targetOffsetX, y: targetOffsetY };
  }, [currentPoint.x, currentPoint.y, isAutoCenter, panX, panY]);

  // Touch Pan gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,
      onPanResponderGrant: () => {
        if (isAutoCenter) {
          setIsAutoCenter(false);
          if (onToggleAutoCenter) onToggleAutoCenter(false);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        panX.setValue(currentPan.current.x + gestureState.dx);
        panY.setValue(currentPan.current.y + gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        currentPan.current.x += gestureState.dx;
        currentPan.current.y += gestureState.dy;
      },
    }),
  ).current;

  const handleAutoFollow = useCallback((enabled: boolean = true) => {
    setIsAutoCenter(enabled);
    if (onToggleAutoCenter) onToggleAutoCenter(enabled);

    if (enabled) {
      const targetOffsetX = (190 - currentPoint.x) * 0.75;
      const targetOffsetY = (220 - currentPoint.y) * 0.75;
      Animated.parallel([
        Animated.spring(panX, {
          toValue: targetOffsetX,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
        Animated.spring(panY, {
          toValue: targetOffsetY,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
        Animated.spring(scale, {
          toValue: 1.15,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
      ]).start();
      currentPan.current = { x: targetOffsetX, y: targetOffsetY };
      currentScale.current = 1.15;
    }
  }, [onToggleAutoCenter, currentPoint, panX, panY, scale]);

  const fitBounds = useCallback(() => {
    setIsAutoCenter(false);
    if (onToggleAutoCenter) onToggleAutoCenter(false);
    Animated.parallel([
      Animated.spring(panX, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }),
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }),
      Animated.spring(scale, {
        toValue: 1.0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }),
    ]).start();
    currentPan.current = { x: 0, y: 0 };
    currentScale.current = 1.0;
  }, [onToggleAutoCenter, panX, panY, scale]);

  // Calculated ETA minutes based on remaining path distance
  const progressRatio = routeIndex / DENSE_ROUTE.length;
  const remainingEtaMins = Math.max(1, Math.round((1 - progressRatio) * 12));

  // Build the complete blue route path d string
  const fullRoutePathD = MAP_ROUTE_WAYPOINTS.map(
    (pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
  ).join(' ');

  return (
    <View style={styles.container}>
      {/* Pan & Zoom Animated Map Canvas */}
      <Animated.View
        style={[
          styles.mapCanvas,
          {
            transform: [
              { translateX: panX },
              { translateY: panY },
              { scale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Svg width="100%" height="100%" viewBox="0 0 400 480" preserveAspectRatio="xMidYMid slice">
          {/* 1. Base Map Background */}
          <Rect x="0" y="0" width="400" height="480" fill="#F4FAF2" />

          {/* 2. Water Bodies (Canal & Lake) */}
          {/* Bottom-left corner lake */}
          <Path d="M0 430 L110 480 L0 480 Z" fill="#B2D7FB" />
          {/* Water canal running alongside Sector 16 Main Rd */}
          <Path d="M0 202 L110 178 L190 196 L190 206 L108 186 L0 212 Z" fill="#B2D7FB" />

          {/* 3. Green Park Areas (OneBuddy fresh mint green) */}
          {/* Top-left park */}
          <Rect x="28" y="42" width="46" height="34" rx="3" fill="#C5EEC0" stroke="#B0E2A8" strokeWidth="1" />
          {/* Middle-left park */}
          <Path d="M28 135 L68 135 L68 185 L28 178 Z" fill="#C5EEC0" stroke="#B0E2A8" strokeWidth="1" />
          {/* Center sector park */}
          <Path d="M125 155 L175 168 L170 200 L120 188 Z" fill="#C5EEC0" stroke="#B0E2A8" strokeWidth="1" />
          {/* Bottom-right park */}
          <Path d="M245 355 L320 405 L320 440 L260 440 L235 405 Z" fill="#C5EEC0" stroke="#B0E2A8" strokeWidth="1" />
          <Rect x="265" y="375" width="30" height="24" rx="2" fill="#C5EEC0" />

          {/* 4. Residential Parcels & Building Blocks */}
          <G stroke="#D4E3D2" strokeWidth="1.2" fill="#EBF4E8">
            <Rect x="220" y="14" width="36" height="26" rx="2" />
            <Rect x="260" y="14" width="40" height="26" rx="2" />
            <Rect x="304" y="14" width="44" height="26" rx="2" />
            <Rect x="220" y="44" width="36" height="30" rx="2" />
            <Rect x="260" y="44" width="40" height="30" rx="2" />
            <Rect x="304" y="44" width="44" height="30" rx="2" />
            <Rect x="220" y="78" width="80" height="50" rx="3" />
            <Rect x="304" y="78" width="55" height="50" rx="3" />
            <Rect x="200" y="132" width="75" height="42" rx="3" />
            <Rect x="280" y="132" width="60" height="42" rx="3" />
            <Rect x="280" y="178" width="70" height="50" rx="3" />
            <Rect x="280" y="232" width="70" height="46" rx="3" />

            {/* Middle Sector 18B grid */}
            <Rect x="180" y="240" width="68" height="50" rx="3" />
            <Rect x="175" y="294" width="72" height="48" rx="3" />
            <Rect x="100" y="360" width="70" height="46" rx="3" />
            <Rect x="14" y="340" width="65" height="46" rx="3" />
            <Rect x="14" y="390" width="65" height="40" rx="3" />

            {/* Crescent Residential plots surrounding Destination */}
            <Path d="M110 82 L150 82 L144 116 L106 116 Z" />
            <Path d="M110 40 L145 40 L145 78 L110 78 Z" />
            <Path d="M152 40 L188 40 L188 78 L152 78 Z" />
            <Path d="M192 40 L212 40 L212 85 L192 85 Z" />
          </G>

          {/* 5. Clean White Roads with Borders */}
          {/* Golf Course Rd */}
          <Path
            d="M180 370 L380 470"
            stroke="#D0E0CE"
            strokeWidth="30"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M180 370 L380 470"
            stroke="#FFFFFF"
            strokeWidth="26"
            strokeLinecap="round"
            fill="none"
          />

          {/* Sector 16 Main Rd (Main curved highway) */}
          <Path
            d="M245 405 L190 310 L130 190 L90 110 L50 10"
            stroke="#D0E0CE"
            strokeWidth="32"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M245 405 L190 310 L130 190 L90 110 L50 10"
            stroke="#FFFFFF"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Subtle center line for Sector 16 Main Rd */}
          <Path
            d="M245 405 L190 310 L130 190 L90 110 L50 10"
            stroke="#EAF2E8"
            strokeWidth="1.5"
            strokeDasharray="8 6"
            fill="none"
          />

          {/* Interior Sector Roads */}
          {/* Sector 18B Rd */}
          <Path
            d="M190 310 L380 405"
            stroke="#D0E0CE"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M190 310 L380 405"
            stroke="#FFFFFF"
            strokeWidth="15"
            strokeLinecap="round"
            fill="none"
          />

          {/* Sector 18A Rd */}
          <Path
            d="M200 240 L380 330"
            stroke="#D0E0CE"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M200 240 L380 330"
            stroke="#FFFFFF"
            strokeWidth="13"
            strokeLinecap="round"
            fill="none"
          />

          {/* Cross Street connecting to Sector 18A */}
          <Path
            d="M275 14 L275 320"
            stroke="#D0E0CE"
            strokeWidth="15"
            fill="none"
          />
          <Path
            d="M275 14 L275 320"
            stroke="#FFFFFF"
            strokeWidth="12"
            fill="none"
          />

          {/* Interior connecting road to Destination crescent */}
          <Path
            d="M110 140 L256 215 L256 160 L154 90"
            stroke="#D0E0CE"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M110 140 L256 215 L256 160 L154 90"
            stroke="#FFFFFF"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Crescent Cul-de-Sac Loop */}
          <Path
            d="M148 40 L160 90 L136 120"
            stroke="#D0E0CE"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M148 40 L160 90 L136 120"
            stroke="#FFFFFF"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />

          {/* 6. Authentic Street Labels */}
          {/* "Sector 16 Main Rd" */}
          <SvgText
            x="172"
            y="320"
            fontSize="10"
            fontWeight="600"
            fill="#526450"
            fontFamily={FONTS.body}
            transform="rotate(-55, 172, 320)"
          >
            Sector 16 Main Rd
          </SvgText>

          {/* "Golf Course Rd" */}
          <SvgText
            x="245"
            y="410"
            fontSize="10"
            fontWeight="600"
            fill="#526450"
            fontFamily={FONTS.body}
            transform="rotate(26, 245, 410)"
          >
            Golf Course Rd
          </SvgText>

          {/* "Sector 18B Rd" */}
          <SvgText
            x="290"
            y="360"
            fontSize="9.5"
            fontWeight="600"
            fill="#526450"
            fontFamily={FONTS.body}
            transform="rotate(27, 290, 360)"
          >
            Sector 18B Rd
          </SvgText>

          {/* "Sector 18A" */}
          <SvgText
            x="300"
            y="266"
            fontSize="9.5"
            fontWeight="600"
            fill="#526450"
            fontFamily={FONTS.body}
            transform="rotate(26, 300, 266)"
          >
            Sector 18A
          </SvgText>

          {/* 7. The OneBuddy Signature Green Route Line */}
          {/* Outer Brand Green Halo Glow */}
          <Path
            d={fullRoutePathD}
            stroke="rgba(84, 183, 19, 0.28)"
            strokeWidth="9.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Vibrant Signature Green Route */}
          <Path
            d={fullRoutePathD}
            stroke="#54B713"
            strokeWidth="5.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* 8. Destination Marker: Green Pin with White House Icon */}
          <G transform="translate(154, 88)">
            {/* Pulsing Outer Halo */}
            <Circle cx="0" cy="2" r="18" fill="rgba(56, 168, 25, 0.25)" />
            {/* Soft Shadow */}
            <Circle cx="0" cy="2" r="13" fill="rgba(24,32,23,0.18)" />
            {/* Green Pin Body with crisp border */}
            <Path
              d="M0 -16 C-9 -16 -15 -10 -15 -1 C-15 7 0 17 0 17 C0 17 15 7 15 -1 C15 -10 9 -16 0 -16 Z"
              fill="#2E7D1C"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            {/* White House Icon */}
            <G transform="translate(-6, -8.5)">
              {/* Roof */}
              <Path d="M6 1 L1 5.5 L2.2 6.5 L6 3.2 L9.8 6.5 L11 5.5 Z" fill="#FFFFFF" />
              {/* Walls */}
              <Path d="M2.5 6 L2.5 11 L9.5 11 L9.5 6 Z" fill="#FFFFFF" />
              {/* Door */}
              <Rect x="4.8" y="7.5" width="2.4" height="3.5" fill="#2E7D1C" rx="0.5" />
            </G>
          </G>

          {/* 9. Animated Courier Scooter & Attached "ETA : 12 MINS" Badge */}
          <G transform={`translate(${currentPoint.x}, ${currentPoint.y})`}>
            {/* Top-down Scooter Vehicle */}
            <G transform={`rotate(${currentPoint.heading})`}>
              {/* Drop Shadow */}
              <Circle cx="0" cy="1" r="11" fill="rgba(24,32,23,0.22)" />
              {/* Front Wheel & Handlebars in Brand Green */}
              <Rect x="-6" y="-12" width="12" height="3" rx="1.5" fill="#54B713" />
              <Circle cx="0" cy="-11" r="2" fill="#182017" />
              {/* Scooter Green Body */}
              <Path d="M-3.5 -9 L3.5 -9 L4.5 4 L-4.5 4 Z" fill="#54B713" />
              {/* Rider with Black Helmet */}
              <Circle cx="0" cy="-3" r="4.2" fill="#182017" />
              <Circle cx="0" cy="-4.5" r="2.2" fill="#2E3C2D" />
              {/* OneBuddy Cargo Box in Brand Green with white badge */}
              <Rect x="-6.5" y="3" width="13" height="9" rx="2" fill="#54B713" stroke="#3F8A0E" strokeWidth="0.8" />
              <Rect x="-2" y="4.5" width="4" height="6" rx="0.8" fill="#FFFFFF" />
            </G>

            {/* Attached OneBuddy Dark "ETA : 12 MINS" Badge */}
            <G transform="translate(14, -14)">
              {/* Dark Pill Badge */}
              <Rect
                x="0"
                y="0"
                width="84"
                height="22"
                rx="5"
                fill="#182017"
                stroke="#54B713"
                strokeWidth="1"
              />
              {/* Little triangle pointing to the scooter */}
              <Path d="M0 11 L-4 8 L0 5 Z" fill="#182017" />
              {/* Green status indicator dot */}
              <Circle cx="8" cy="11" r="2.5" fill="#54B713" />
              {/* Badge Text: "ETA : 12 MINS" */}
              <SvgText
                x="46"
                y="14.5"
                fontSize="9.5"
                fontWeight="800"
                fill="#FFFFFF"
                textAnchor="middle"
                fontFamily={FONTS.display}
                letterSpacing="0.6"
              >
                {`ETA : ${remainingEtaMins} MINS`}
              </SvgText>
            </G>
          </G>

          {/* 10. Authentic Google Logo Watermark (bottom-left) */}
          <G transform="translate(18, 442)">
            {/* Google Watermark */}
            <SvgText
              x="0"
              y="16"
              fontSize="16"
              fontWeight="700"
              fill="#475569"
              fontFamily="sans-serif"
            >
              Google
            </SvgText>
          </G>
        </Svg>
      </Animated.View>

      {/* Centered Floating Control Panel: [Auto-Follow] [Fit Route] */}
      <MapControlPanel
        autoFollow={isAutoCenter}
        onToggleAutoFollow={handleAutoFollow}
        onFitRoute={fitBounds}
        bottomOffset={bottomOffset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    overflow: 'hidden',
  },
  mapCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
