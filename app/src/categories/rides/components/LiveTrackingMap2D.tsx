// Pure 2D Live Tracking Map with Extended Multi-Turn Route (Madhapur & Hitech City)
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
import type { RideType } from '../types/tracking';
import { VehicleMapSprite } from './vehicles/VehicleGraphics';
import { MapControlPanel } from './MapControlPanel';

/**
 * Extended Multi-Turn Live Route in Madhapur & Hitech City:
 * 1. Starts southeast along Dr APJ Abdul Kalam Marg
 * 2. Turns north onto Vishnu Marg
 * 3. Turns west onto Siddhi Vinayak Nagar Sector Road
 * 4. Turns south through Taaza Kitchen connecting lane
 * 5. Arrives at the 100 Ft Road Pickup Spot!
 */
export const RIDE_ROUTE_WAYPOINTS = [
  // Phase 1: Dr APJ Abdul Kalam Marg approach heading northwest
  { x: 385, y: 308 },
  { x: 360, y: 288 },
  { x: 335, y: 266 },
  { x: 310, y: 245 },
  // Phase 2: Turn north onto Vishnu Marg
  { x: 290, y: 228 },
  { x: 290, y: 195 },
  { x: 290, y: 165 },
  { x: 290, y: 140 },
  // Phase 3: Turn west onto Siddhi Vinayak Nagar Sector Road
  { x: 260, y: 140 },
  { x: 225, y: 140 },
  { x: 190, y: 140 },
  { x: 160, y: 140 },
  // Phase 4: Turn south along Taaza Kitchen connecting lane towards 100 Ft Road
  { x: 140, y: 140 },
  { x: 140, y: 165 },
  { x: 140, y: 190 },
  { x: 140, y: 215 },
  // Phase 5: Pull up at the 100 Ft Road Pickup Spot
  { x: 140, y: 228 },
];

/**
 * Onward customer trip route from Pickup Spot to Destination (Inorbit Mall)
 */
export const ONWARD_TRIP_WAYPOINTS = [
  { x: 140, y: 228 }, // Pickup spot on 100 Ft Road
  { x: 115, y: 228 },
  { x: 86, y: 228 },  // Turn onto Hitech City Main Rd
  { x: 86, y: 280 },
  { x: 86, y: 340 },
  { x: 86, y: 410 },
  { x: 86, y: 475 },  // Inorbit Mall Destination Pin
];

/**
 * Sub-interpolated route points for 60fps smooth movement with steering angle
 */
function interpolateWaypoints(pts: { x: number; y: number }[], steps = 10) {
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

const DENSE_RIDE_ROUTE = interpolateWaypoints(RIDE_ROUTE_WAYPOINTS, 12);
const DENSE_ONWARD_ROUTE = interpolateWaypoints(ONWARD_TRIP_WAYPOINTS, 20);

export interface LiveTrackingMap2DProps {
  rideType?: RideType;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onReset?: () => void;
  driverName?: string;
  autoCenterEnabled?: boolean;
  onToggleAutoCenter?: (enabled: boolean) => void;
  bottomOffset?: number;
  topInset?: number;
  bottomSheetHeight?: number;
  journeyPhase?: 'booking' | 'approaching' | 'arrived_at_pickup' | 'in_transit' | 'destination_reached' | 'completed';
}

export function LiveTrackingMap2D({
  rideType = 'auto',
  isPlaying = true,
  onTogglePlay,
  onReset,
  autoCenterEnabled = true,
  onToggleAutoCenter,
  bottomOffset = 16,
  journeyPhase = 'approaching',
}: LiveTrackingMap2DProps): React.JSX.Element {
  // Animation state for vehicle along the extended route
  const [approachIndex, setApproachIndex] = useState(0);
  const [onwardIndex, setOnwardIndex] = useState(0);
  const [isAutoCenter, setIsAutoCenter] = useState(autoCenterEnabled);

  // Pan & Zoom values
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1.1)).current;

  const currentPan = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1.1);

  // Pulse animation for pickup spot marker
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Reset or initialize on phase change
  useEffect(() => {
    if (journeyPhase === 'approaching') {
      setApproachIndex(0);
    } else if (journeyPhase === 'arrived_at_pickup') {
      setApproachIndex(DENSE_RIDE_ROUTE.length - 1);
    } else if (journeyPhase === 'in_transit') {
      setOnwardIndex(0);
    } else if (journeyPhase === 'destination_reached' || journeyPhase === 'completed') {
      setOnwardIndex(DENSE_ONWARD_ROUTE.length - 1);
    }
  }, [journeyPhase]);

  // Vehicle movement ticker according to journeyPhase
  useEffect(() => {
    if (!isPlaying) return undefined;

    if (journeyPhase === 'approaching') {
      const stepInterval = Math.max(25, Math.floor((5.8 * 1000) / DENSE_RIDE_ROUTE.length));
      const interval = setInterval(() => {
        setApproachIndex((prev) => {
          if (prev < DENSE_RIDE_ROUTE.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, stepInterval);
      return () => clearInterval(interval);
    }

    if (journeyPhase === 'in_transit') {
      // 10 seconds total trip duration along onward route to destination
      const stepInterval = Math.max(30, Math.floor((10 * 1000) / DENSE_ONWARD_ROUTE.length));
      const interval = setInterval(() => {
        setOnwardIndex((prev) => {
          if (prev < DENSE_ONWARD_ROUTE.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, stepInterval);
      return () => clearInterval(interval);
    }
  }, [isPlaying, journeyPhase]);

  // Determine current vehicle point based on journey phase
  const currentPoint = (() => {
    if (journeyPhase === 'approaching') {
      return DENSE_RIDE_ROUTE[approachIndex] || DENSE_RIDE_ROUTE[0];
    }
    if (journeyPhase === 'arrived_at_pickup') {
      return DENSE_RIDE_ROUTE[DENSE_RIDE_ROUTE.length - 1];
    }
    if (journeyPhase === 'in_transit') {
      return DENSE_ONWARD_ROUTE[onwardIndex] || DENSE_ONWARD_ROUTE[0];
    }
    if (journeyPhase === 'destination_reached' || journeyPhase === 'completed') {
      return DENSE_ONWARD_ROUTE[DENSE_ONWARD_ROUTE.length - 1];
    }
    return DENSE_RIDE_ROUTE[approachIndex] || DENSE_RIDE_ROUTE[0];
  })();

  // Auto-center camera following vehicle smoothly through corners
  useEffect(() => {
    if (!isAutoCenter) return;

    // Center of map viewBox is roughly (190, 230)
    const targetOffsetX = (190 - currentPoint.x) * 0.75;
    const targetOffsetY = (230 - currentPoint.y) * 0.75;

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

  const toggleAutoCenter = useCallback(() => {
    const next = !isAutoCenter;
    setIsAutoCenter(next);
    if (onToggleAutoCenter) onToggleAutoCenter(next);

    if (next) {
      const targetOffsetX = (190 - currentPoint.x) * 0.75;
      const targetOffsetY = (230 - currentPoint.y) * 0.75;
      Animated.spring(panX, { toValue: targetOffsetX, useNativeDriver: true }).start();
      Animated.spring(panY, { toValue: targetOffsetY, useNativeDriver: true }).start();
      currentPan.current = { x: targetOffsetX, y: targetOffsetY };
    }
  }, [isAutoCenter, onToggleAutoCenter, currentPoint, panX, panY]);

  const fitBounds = useCallback(() => {
    setIsAutoCenter(false);
    if (onToggleAutoCenter) onToggleAutoCenter(false);
    Animated.spring(panX, { toValue: 0, useNativeDriver: true }).start();
    Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
    Animated.spring(scale, { toValue: 1.0, useNativeDriver: true }).start();
    currentPan.current = { x: 0, y: 0 };
    currentScale.current = 1.0;
  }, [onToggleAutoCenter, panX, panY, scale]);

  // Calculated distance along the extended route:
  const distanceBadgeText = (() => {
    if (journeyPhase === 'approaching') {
      const fraction = Math.max(0, 1 - approachIndex / (DENSE_RIDE_ROUTE.length - 1));
      const meters = Math.max(20, Math.round(fraction * 1650));
      return meters > 1000 ? `${(meters / 1000).toFixed(1)} km` : meters > 50 ? `${meters} m` : 'Arrived';
    }
    if (journeyPhase === 'arrived_at_pickup') {
      return 'At Pickup';
    }
    if (journeyPhase === 'in_transit') {
      const fraction = Math.max(0, 1 - onwardIndex / (DENSE_ONWARD_ROUTE.length - 1));
      const meters = Math.max(20, Math.round(fraction * 4800));
      return meters > 1000 ? `${(meters / 1000).toFixed(1)} km` : meters > 50 ? `${meters} m` : 'Arrived';
    }
    return 'Arrived';
  })();

  // Build the complete black route path d string
  const fullRoutePathD = RIDE_ROUTE_WAYPOINTS.map(
    (pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
  ).join(' ');

  // Onward trip route d string
  const onwardRoutePathD = ONWARD_TRIP_WAYPOINTS.map(
    (pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
  ).join(' ');

  const pickupPoint = RIDE_ROUTE_WAYPOINTS[RIDE_ROUTE_WAYPOINTS.length - 1];
  const destPoint = ONWARD_TRIP_WAYPOINTS[ONWARD_TRIP_WAYPOINTS.length - 1];

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
        <Svg width="100%" height="100%" viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice">
          {/* 1. Base Map Background (Clean grey-blue Google Maps style) */}
          <Rect x="0" y="0" width="400" height="520" fill="#E8ECEF" />

          {/* 2. Water Bodies (Durgam Cheruvu & Hitech Canal from reference) */}
          {/* Top-left water body */}
          <Path d="M0 0 L90 0 L60 85 L0 105 Z" fill="#B9DCF7" />
          {/* Bottom-right Durgam Cheruvu lake */}
          <Path d="M290 410 C320 400 370 420 400 415 L400 520 L280 520 C280 470 270 435 290 410 Z" fill="#B9DCF7" />

          {/* 3. Parks & Greenery */}
          <Path d="M20 180 L75 180 L75 220 L20 220 Z" fill="#D2F0CE" />
          <Path d="M280 18 L360 18 L360 55 L280 55 Z" fill="#D2F0CE" />
          <Path d="M220 440 L270 440 L270 495 L220 495 Z" fill="#D2F0CE" />
          <Path d="M20 430 L80 430 L80 480 L20 480 Z" fill="#D2F0CE" />

          {/* 4. Building Parcels & Road Blocks */}
          <G fill="#F4F6F8" stroke="#DDE3E8" strokeWidth="0.8">
            <Rect x="100" y="30" width="60" height="40" rx="1.5" />
            <Rect x="168" y="30" width="65" height="40" rx="1.5" />
            <Rect x="240" y="30" width="55" height="40" rx="1.5" />

            <Rect x="100" y="80" width="60" height="50" rx="1.5" />
            <Rect x="168" y="80" width="70" height="50" rx="1.5" />
            <Rect x="246" y="80" width="60" height="50" rx="1.5" />

            {/* Middle Blocks */}
            <Rect x="20" y="240" width="70" height="60" rx="1.5" />
            <Rect x="100" y="250" width="65" height="65" rx="1.5" />
            <Rect x="175" y="250" width="80" height="65" rx="1.5" />
            <Rect x="265" y="250" width="75" height="65" rx="1.5" />

            {/* Lower Blocks */}
            <Rect x="100" y="330" width="75" height="70" rx="1.5" />
            <Rect x="185" y="330" width="80" height="70" rx="1.5" />
            <Rect x="100" y="420" width="75" height="60" rx="1.5" />
            <Rect x="185" y="420" width="80" height="60" rx="1.5" />
          </G>

          {/* 5. Clean White Roads with Borders */}
          {/* Hitech City Main Rd (Left vertical road) */}
          <Path
            d="M86 0 L86 520"
            stroke="#D1D9E0"
            strokeWidth="24"
            fill="none"
          />
          <Path
            d="M86 0 L86 520"
            stroke="#FFFFFF"
            strokeWidth="20"
            fill="none"
          />

          {/* 100 Ft Road / Taaza Kitchen Road (Horizontal main road) */}
          <Path
            d="M0 228 L400 228"
            stroke="#D1D9E0"
            strokeWidth="28"
            fill="none"
          />
          <Path
            d="M0 228 L400 228"
            stroke="#FFFFFF"
            strokeWidth="24"
            fill="none"
          />

          {/* Vishnu Marg (Right vertical / diagonal avenue) */}
          <Path
            d="M290 0 L290 228 L300 520"
            stroke="#D1D9E0"
            strokeWidth="20"
            fill="none"
          />
          <Path
            d="M290 0 L290 228 L300 520"
            stroke="#FFFFFF"
            strokeWidth="16"
            fill="none"
          />

          {/* Dr APJ Abdul Kalam Marg (Southeast road) */}
          <Path
            d="M290 228 L400 320"
            stroke="#D1D9E0"
            strokeWidth="22"
            fill="none"
          />
          <Path
            d="M290 228 L400 320"
            stroke="#FFFFFF"
            strokeWidth="18"
            fill="none"
          />

          {/* Siddhi Vinayak Nagar Sector Roads */}
          <Path
            d="M86 75 L290 75"
            stroke="#D1D9E0"
            strokeWidth="14"
            fill="none"
          />
          <Path
            d="M86 75 L290 75"
            stroke="#FFFFFF"
            strokeWidth="11"
            fill="none"
          />

          <Path
            d="M86 140 L290 140"
            stroke="#D1D9E0"
            strokeWidth="16"
            fill="none"
          />
          <Path
            d="M86 140 L290 140"
            stroke="#FFFFFF"
            strokeWidth="13"
            fill="none"
          />

          {/* Connecting Lane at x = 140 past Taaza Kitchen */}
          <Path
            d="M140 140 L140 228"
            stroke="#D1D9E0"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M140 140 L140 228"
            stroke="#FFFFFF"
            strokeWidth="13"
            strokeLinecap="round"
            fill="none"
          />

          {/* 6. Authentic Street Labels matching reference screenshot */}
          {/* "Hitech City Main Rd" */}
          <SvgText
            x="76"
            y="200"
            fontSize="9.5"
            fontWeight="600"
            fill="#5A6872"
            fontFamily={FONTS.body}
            transform="rotate(-90, 76, 200)"
          >
            Hitech City Main Rd
          </SvgText>

          {/* "SIDDHI VINAYAK NAGAR" */}
          <SvgText
            x="200"
            y="70"
            fontSize="10"
            fontWeight="700"
            fill="#718096"
            fontFamily={FONTS.display}
            textAnchor="middle"
            letterSpacing="0.4"
          >
            SIDDHI
          </SvgText>
          <SvgText
            x="200"
            y="82"
            fontSize="9"
            fontWeight="600"
            fill="#718096"
            fontFamily={FONTS.display}
            textAnchor="middle"
          >
            VINAYAK NAGAR
          </SvgText>

          {/* "MADHAPUR" (prominent area text in reference) */}
          <SvgText
            x="195"
            y="390"
            fontSize="14"
            fontWeight="800"
            fill="#4A5568"
            fontFamily={FONTS.display}
            textAnchor="middle"
            letterSpacing="1.2"
          >
            MADHAPUR
          </SvgText>
          <SvgText
            x="195"
            y="404"
            fontSize="10"
            fontWeight="600"
            fill="#718096"
            fontFamily={FONTS.body}
            textAnchor="middle"
          >
            మాదాపూర్
          </SvgText>

          {/* "Taaza Kitchen" (near pickup route) */}
          <SvgText
            x="152"
            y="190"
            fontSize="10.5"
            fontWeight="700"
            fill="#334155"
            fontFamily={FONTS.body}
          >
            Taaza Kitchen
          </SvgText>

          {/* "Vishnu Marg" */}
          <SvgText
            x="298"
            y="180"
            fontSize="9"
            fontWeight="600"
            fill="#5A6872"
            fontFamily={FONTS.body}
            transform="rotate(90, 298, 180)"
          >
            Vishnu Marg
          </SvgText>

          {/* "Dr APJ Abdul Kalam Marg" */}
          <SvgText
            x="345"
            y="290"
            fontSize="8.5"
            fontWeight="600"
            fill="#5A6872"
            fontFamily={FONTS.body}
            transform="rotate(38, 345, 290)"
          >
            Dr APJ Abdul...
          </SvgText>

          {/* 7. Onward Customer Trip Route (Pickup Spot -> Inorbit Mall) */}
          <Path
            d={onwardRoutePathD}
            stroke="#54B713"
            strokeWidth="3.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Destination Pin: Inorbit Mall */}
          <G transform={`translate(${destPoint.x}, ${destPoint.y})`}>
            <Circle cx="0" cy="0" r="10" fill="rgba(220, 38, 38, 0.18)" />
            <Circle cx="0" cy="0" r="5" fill="#DC2626" />
            <G transform="translate(12, -10)">
              <Rect x="0" y="0" width="115" height="20" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
              <SvgText x="57" y="13.5" fontSize="9.5" fontWeight="700" fill="#DC2626" textAnchor="middle" fontFamily={FONTS.display}>
                Inorbit Mall Drop-off
              </SvgText>
            </G>
          </G>

          {/* 8. Extended Driver Approach Route Line with OneBuddy Signature Green Glow */}
          <Path
            d={fullRoutePathD}
            stroke="rgba(84, 183, 19, 0.28)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d={fullRoutePathD}
            stroke="#182017"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* 9. Pickup Spot Marker matching reference screenshot */}
          <G transform={`translate(${pickupPoint.x}, ${pickupPoint.y})`}>
            {/* Outer Pulsing Ring with OneBuddy Green Tint */}
            <Circle cx="0" cy="0" r="16" fill="rgba(84, 183, 19, 0.22)" />

            {/* Black Circle with Outer Ring */}
            <Circle cx="0" cy="0" r="6" stroke="#000000" strokeWidth="2.5" fill="#FFFFFF" />
            <Circle cx="0" cy="0" r="3.2" fill="#000000" />

            {/* Top Badge: "🚶 2 min" Walking Time */}
            <G transform="translate(-48, -44)">
              <Rect
                x="0"
                y="0"
                width="64"
                height="24"
                rx="4"
                fill="#FFFFFF"
                stroke="#D1D5DB"
                strokeWidth="0.8"
              />
              <SvgText x="8" y="16" fontSize="11" fill="#000000">
                🚶
              </SvgText>
              <SvgText
                x="28"
                y="16"
                fontSize="11"
                fontWeight="700"
                fill="#000000"
                fontFamily={FONTS.display}
              >
                2 min
              </SvgText>
            </G>

            {/* Bottom Badge: "Pickup spot" */}
            <G transform="translate(-64, 12)">
              <Rect
                x="0"
                y="0"
                width="84"
                height="24"
                rx="4"
                fill="#FFFFFF"
                stroke="#D1D5DB"
                strokeWidth="0.8"
              />
              <SvgText
                x="42"
                y="16.5"
                fontSize="11"
                fontWeight="700"
                fill="#000000"
                textAnchor="middle"
                fontFamily={FONTS.display}
              >
                Pickup spot
              </SvgText>
            </G>
          </G>

          {/* 10. Animated Moving Vehicle & Attached Dynamic Distance Badge */}
          <G transform={`translate(${currentPoint.x}, ${currentPoint.y})`}>
            {/* Top-down vehicle sprite matching rideType (Auto / Cab / Bike) */}
            <VehicleMapSprite type={rideType} heading={currentPoint.heading} />

            {/* Dynamic Distance Badge (e.g. 1.4 km -> 860 meters -> Arriving) */}
            <G transform="translate(18, -26)">
              <Rect
                x="0"
                y="0"
                width="88"
                height="28"
                rx="4"
                fill="#FFFFFF"
                stroke="#D1D5DB"
                strokeWidth="0.8"
              />
              <SvgText
                x="44"
                y="18.5"
                fontSize="11.5"
                fontWeight="700"
                fill="#000000"
                textAnchor="middle"
                fontFamily={FONTS.display}
              >
                {distanceBadgeText}
              </SvgText>
            </G>
          </G>
        </Svg>
      </Animated.View>

      {/* Floating Map Controls (Auto-Follow & Fit Route) */}
      <MapControlPanel
        autoFollow={isAutoCenter}
        onToggleAutoFollow={toggleAutoCenter}
        onFitRoute={fitBounds}
        onTogglePlay={onTogglePlay}
        onReset={() => {
          setApproachIndex(0);
          setOnwardIndex(0);
          if (onReset) onReset();
        }}
        bottomOffset={bottomOffset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8ECEF',
    overflow: 'hidden',
  },
  mapCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
