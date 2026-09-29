// Pure 2D Live Tracking Vector Map with Stage-aware vehicle movement
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, {
  Circle,
  G,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { TrackingStage } from '../../types';
import { COLORS, RADII, SPACING, SHADOWS } from '../../theme';
import { Navigation, Compass, Focus, Maximize2 } from 'lucide-react-native';

/**
 * Route Waypoints based on 2D map reference:
 * Starts on Golf Course Rd -> turns onto Sector 16 Main Rd -> runs northwest ->
 * turns right into interior sector road -> turns north -> turns left into crescent ->
 * arrives at destination house pin.
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
 * Sub-interpolated route points for smooth 60fps vehicle animation
 */
function interpolateWaypoints(pts: { x: number; y: number }[], steps = 8) {
  const result: { x: number; y: number; heading: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const heading = (Math.atan2(dy, dx) * 180) / Math.PI + 90;

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

const DENSE_ROUTE = interpolateWaypoints(MAP_ROUTE_WAYPOINTS, 10);

interface LiveMapProps {
  stage: TrackingStage;
  etaMinutes?: number;
  distanceKm?: number;
  providerName?: string;
  vehicleNo?: string;
  onMovementComplete?: () => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  stage,
  etaMinutes = 12,
  distanceKm = 2.4,
  providerName = 'Rajesh Kumar',
  vehicleNo = 'KA 03 EJ 4821',
  onMovementComplete,
}) => {
  // Vehicle route index
  // When CONFIRMED/ASSIGNED: start at 0
  // When EN_ROUTE: advances from 0 to DENSE_ROUTE.length - 1
  // When ARRIVED/IN_PROGRESS/COMPLETED: stationary at destination (DENSE_ROUTE.length - 1)
  const [routeIndex, setRouteIndex] = useState(0);
  const [isAutoCenter, setIsAutoCenter] = useState(true);

  // Pan & Zoom values
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1.05)).current;
  const currentPan = useRef({ x: 0, y: 0 });

  // Pulse animation for destination marker
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Stage-based vehicle positioning and movement
  useEffect(() => {
    if (stage === 'CONFIRMED' || stage === 'ASSIGNED') {
      setRouteIndex(0);
    } else if (stage === 'ARRIVED' || stage === 'IN_PROGRESS' || stage === 'COMPLETED') {
      setRouteIndex(DENSE_ROUTE.length - 1);
    }
  }, [stage]);

  // Live movement active when stage === 'EN_ROUTE'
  useEffect(() => {
    if (stage !== 'EN_ROUTE') return;

    setRouteIndex(0);

    const interval = setInterval(() => {
      setRouteIndex((prev) => {
        if (prev < DENSE_ROUTE.length - 1) {
          const next = prev + 1;
          if (next >= DENSE_ROUTE.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              onMovementComplete?.();
            }, 300);
            return DENSE_ROUTE.length - 1;
          }
          return next;
        }
        clearInterval(interval);
        return DENSE_ROUTE.length - 1;
      });
    }, 65);

    return () => clearInterval(interval);
  }, [stage, onMovementComplete]);

  const currentPoint = DENSE_ROUTE[routeIndex] || DENSE_ROUTE[0];

  // Auto-center camera following courier
  useEffect(() => {
    if (!isAutoCenter) return;

    const targetOffsetX = (190 - currentPoint.x) * 0.55;
    const targetOffsetY = (220 - currentPoint.y) * 0.55;

    Animated.spring(panX, {
      toValue: targetOffsetX,
      useNativeDriver: true,
      damping: 22,
      stiffness: 85,
    }).start();

    Animated.spring(panY, {
      toValue: targetOffsetY,
      useNativeDriver: true,
      damping: 22,
      stiffness: 85,
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
    })
  ).current;

  const handleRecenter = useCallback(() => {
    setIsAutoCenter(true);
    const targetOffsetX = (190 - currentPoint.x) * 0.6;
    const targetOffsetY = (220 - currentPoint.y) * 0.6;

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
        toValue: 1.05,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }),
    ]).start();
    currentPan.current = { x: targetOffsetX, y: targetOffsetY };
  }, [currentPoint, panX, panY, scale]);

  const handleFitRoute = useCallback(() => {
    setIsAutoCenter(false);
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
        toValue: 0.95,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }),
    ]).start();
    currentPan.current = { x: 0, y: 0 };
  }, [panX, panY, scale]);

  // Remaining ETA calculation based on progress
  const progressRatio = routeIndex / (DENSE_ROUTE.length - 1);
  const remainingEta =
    stage === 'ARRIVED' || stage === 'IN_PROGRESS' || stage === 'COMPLETED'
      ? 0
      : Math.max(1, Math.round((1 - progressRatio) * etaMinutes));

  const fullRoutePathD = MAP_ROUTE_WAYPOINTS.map(
    (pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`
  ).join(' ');

  const getStageHeader = () => {
    switch (stage) {
      case 'CONFIRMED':
        return 'Finding Nearby Professional...';
      case 'ASSIGNED':
        return `${providerName} Assigned • Preparing Tools`;
      case 'EN_ROUTE':
        return `${providerName} is En Route • ETA ${remainingEta} mins`;
      case 'ARRIVED':
        return `${providerName} Reached Your Location!`;
      case 'IN_PROGRESS':
        return 'Service Currently In Progress';
      case 'COMPLETED':
        return 'Service Finished Successfully';
      default:
        return 'Live GPS Tracking';
    }
  };

  return (
    <View style={styles.container}>
      {/* 2D Vector Map Canvas */}
      <View style={styles.canvasContainer}>
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
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 400 480"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* 1. Base Map Background */}
            <Rect x="0" y="0" width="400" height="480" fill="#F4FAF2" />

            {/* 2. Water Bodies (Canal & Lake) */}
            <Path d="M0 430 L110 480 L0 480 Z" fill="#B2D7FB" />
            <Path d="M0 202 L110 178 L190 196 L190 206 L108 186 L0 212 Z" fill="#B2D7FB" />

            {/* 3. Green Park Areas */}
            <Rect x="28" y="42" width="46" height="34" rx="3" fill="#C5EEC0" stroke="#B0E2A8" strokeWidth="1" />
            <Path d="M28 135 L68 135 L68 185 L28 178 Z" fill="#C5EEC0" stroke="#B0E2A8" strokeWidth="1" />
            <Path d="M125 155 L175 168 L170 200 L120 188 Z" fill="#C5EEC0" stroke="#B0E2A8" strokeWidth="1" />
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

              {/* Middle Sector grid */}
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

            {/* Sector 16 Main Rd (Curved highway) */}
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
            <Path
              d="M245 405 L190 310 L130 190 L90 110 L50 10"
              stroke="#EAF2E8"
              strokeWidth="1.5"
              strokeDasharray="8 6"
              fill="none"
            />

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
            <Path d="M275 14 L275 320" stroke="#D0E0CE" strokeWidth="15" fill="none" />
            <Path d="M275 14 L275 320" stroke="#FFFFFF" strokeWidth="12" fill="none" />

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

            {/* 6. Street Labels */}
            <SvgText
              x="172"
              y="320"
              fontSize="10"
              fontWeight="600"
              fill="#526450"
              transform="rotate(-55, 172, 320)"
            >
              Sector 16 Main Rd
            </SvgText>

            <SvgText
              x="245"
              y="410"
              fontSize="10"
              fontWeight="600"
              fill="#526450"
              transform="rotate(26, 245, 410)"
            >
              Golf Course Rd
            </SvgText>

            <SvgText
              x="290"
              y="360"
              fontSize="9.5"
              fontWeight="600"
              fill="#526450"
              transform="rotate(27, 290, 360)"
            >
              Sector 18B Rd
            </SvgText>

            {/* 7. Signature Green Live Route Line */}
            {stage !== 'COMPLETED' && (
              <>
                <Path
                  d={fullRoutePathD}
                  stroke="rgba(84, 183, 19, 0.3)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <Path
                  d={fullRoutePathD}
                  stroke="#54B713"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </>
            )}

            {/* 8. Destination House Marker */}
            <G transform="translate(154, 88)">
              <Circle cx="0" cy="2" r="18" fill="rgba(56, 168, 25, 0.25)" />
              <Circle cx="0" cy="2" r="13" fill="rgba(24,32,23,0.18)" />
              {/* Green Pin Body */}
              <Path
                d="M0 -16 C-9 -16 -15 -10 -15 -1 C-15 7 0 17 0 17 C0 17 15 7 15 -1 C15 -10 9 -16 0 -16 Z"
                fill="#2E7D1C"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              {/* White House Icon */}
              <G transform="translate(-6, -8.5)">
                <Path d="M6 1 L1 5.5 L2.2 6.5 L6 3.2 L9.8 6.5 L11 5.5 Z" fill="#FFFFFF" />
                <Path d="M2.5 6 L2.5 11 L9.5 11 L9.5 6 Z" fill="#FFFFFF" />
                <Rect x="4.8" y="7.5" width="2.4" height="3.5" fill="#2E7D1C" rx="0.5" />
              </G>
            </G>

            {/* 9. Moving / Stationary Scooter Vehicle */}
            <G transform={`translate(${currentPoint.x}, ${currentPoint.y})`}>
              <G transform={`rotate(${currentPoint.heading})`}>
                {/* Vehicle shadow */}
                <Circle cx="0" cy="1" r="11" fill="rgba(24,32,23,0.22)" />
                {/* Front Wheel & Handlebars */}
                <Rect x="-6" y="-12" width="12" height="3" rx="1.5" fill="#54B713" />
                <Circle cx="0" cy="-11" r="2" fill="#182017" />
                {/* Scooter Green Body */}
                <Path d="M-3.5 -9 L3.5 -9 L4.5 4 L-4.5 4 Z" fill="#54B713" />
                {/* Rider Helmet */}
                <Circle cx="0" cy="-3" r="4.2" fill="#182017" />
                <Circle cx="0" cy="-4.5" r="2.2" fill="#2E3C2D" />
                {/* OneBuddy Cargo Toolkit Box */}
                <Rect x="-6.5" y="3" width="13" height="9" rx="2" fill="#54B713" stroke="#3F8A0E" strokeWidth="0.8" />
                <Rect x="-2" y="4.5" width="4" height="6" rx="0.8" fill="#FFFFFF" />
              </G>

              {/* Attached Pill Badge (ETA or Status) */}
              <G transform="translate(14, -14)">
                <Rect
                  x="0"
                  y="0"
                  width="86"
                  height="22"
                  rx="5"
                  fill="#182017"
                  stroke="#54B713"
                  strokeWidth="1"
                />
                <Path d="M0 11 L-4 8 L0 5 Z" fill="#182017" />
                <Circle cx="8" cy="11" r="2.5" fill="#54B713" />
                <SvgText
                  x="48"
                  y="14.5"
                  fontSize="9.5"
                  fontWeight="800"
                  fill="#FFFFFF"
                  textAnchor="middle"
                  letterSpacing="0.4"
                >
                  {stage === 'ARRIVED' || stage === 'IN_PROGRESS' || stage === 'COMPLETED'
                    ? 'AT HOME'
                    : `ETA : ${remainingEta} MINS`}
                </SvgText>
              </G>
            </G>

            {/* Google Watermark */}
            <G transform="translate(18, 442)">
              <SvgText
                x="0"
                y="16"
                fontSize="15"
                fontWeight="700"
                fill="#94A3B8"
              >
                Google
              </SvgText>
            </G>
          </Svg>
        </Animated.View>

        {/* Floating Map Controls [Re-Center] [Fit Route] */}
        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={[styles.mapBtn, isAutoCenter && styles.mapBtnActive]}
            onPress={handleRecenter}
            activeOpacity={0.8}
          >
            <Focus size={14} color={isAutoCenter ? '#FFFFFF' : COLORS.textPrimary} />
            <Text
              style={[
                styles.mapBtnText,
                isAutoCenter && styles.mapBtnTextActive,
              ]}
            >
              Follow
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mapBtn, { marginTop: 6 }]}
            onPress={handleFitRoute}
            activeOpacity={0.8}
          >
            <Maximize2 size={14} color={COLORS.textPrimary} />
            <Text style={styles.mapBtnText}>Fit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F4FAF2',
  },
  canvasContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F4FAF2',
  },
  mapCanvas: {
    width: '100%',
    height: '100%',
  },
  floatingControls: {
    position: 'absolute',
    right: 14,
    bottom: 24,
    zIndex: 20,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  mapBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  mapBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  mapBtnTextActive: {
    color: '#FFFFFF',
  },
});
