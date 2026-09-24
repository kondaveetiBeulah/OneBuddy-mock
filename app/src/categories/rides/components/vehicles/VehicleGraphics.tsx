import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import type { RideType } from '../../types/tracking';

/**
 * High-performance, zero-bloat vector graphics for Auto, Cab, and Bike.
 * Keeps app package size minimal (under a few KB instead of MBs of bitmaps).
 */

interface VehicleCardGraphicProps {
  type: RideType;
  width?: number;
  height?: number;
}

/**
 * 3/4 Perspective Illustration of Auto Rickshaw matching Uber Auto reference
 */
export function AutoRickshawGraphic({ width = 100, height = 75 }: { width?: number; height?: number }): React.JSX.Element {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 90" fill="none">
      <Defs>
        <LinearGradient id="autoRoof" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FACC15" />
          <Stop offset="60%" stopColor="#EAB308" />
          <Stop offset="100%" stopColor="#CA8A04" />
        </LinearGradient>
        <LinearGradient id="autoBodyGreen" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#15803D" />
          <Stop offset="100%" stopColor="#166534" />
        </LinearGradient>
        <LinearGradient id="autoGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#93C5FD" stopOpacity="0.85" />
          <Stop offset="100%" stopColor="#60A5FA" stopOpacity="0.5" />
        </LinearGradient>
        <RadialGradient id="tireShade" cx="50%" cy="50%" r="50%">
          <Stop offset="60%" stopColor="#1F2937" />
          <Stop offset="100%" stopColor="#111827" />
        </RadialGradient>
      </Defs>

      {/* Shadow */}
      <Ellipse cx="62" cy="80" rx="46" ry="6.5" fill="rgba(0,0,0,0.22)" />

      {/* Rear Tires */}
      <Circle cx="32" cy="69" r="12" fill="url(#tireShade)" />
      <Circle cx="32" cy="69" r="6.5" fill="#6B7280" />
      <Circle cx="32" cy="69" r="3" fill="#9CA3AF" />

      {/* Front Tire */}
      <Circle cx="96" cy="71" r="10.5" fill="url(#tireShade)" />
      <Circle cx="96" cy="71" r="5.5" fill="#6B7280" />
      <Circle cx="96" cy="71" r="2.5" fill="#9CA3AF" />

      {/* Front Mudguard */}
      <Path d="M86 64 C88 56 104 56 107 65 L101 67 C99 60 93 60 90 66 Z" fill="#EAB308" />

      {/* Main Rickshaw Cabin Body */}
      {/* Lower Chassis / Green Apron */}
      <Path
        d="M20 54 L36 54 L44 65 L82 65 L92 56 L94 48 L80 46 L76 34 L28 34 L20 44 Z"
        fill="url(#autoBodyGreen)"
      />

      {/* Yellow Canopy / Roof */}
      <Path
        d="M22 34 C22 23 30 15 45 15 L78 17 C87 18 90 24 88 32 L85 36 L24 36 Z"
        fill="url(#autoRoof)"
      />

      {/* Canopy Overhang & Highlights */}
      <Path
        d="M21 34 L88 34 L89 36 L23 36 Z"
        fill="#CA8A04"
      />
      <Path
        d="M28 20 C42 16 68 17 84 21"
        stroke="#FEF08A"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Windshield */}
      <Polygon
        points="77,22 87,32 84,46 75,44"
        fill="url(#autoGlass)"
        stroke="#374151"
        strokeWidth="1.2"
      />

      {/* Windshield Reflection */}
      <Path d="M78 26 L84 34 L82 40" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />

      {/* Cabin Side Opening / Interior */}
      <Path
        d="M34 36 L70 36 L70 52 L36 52 Z"
        fill="#111827"
      />

      {/* Interior Seat & Passenger Roll Bar */}
      <Rect x="36" y="44" width="22" height="7" rx="2" fill="#374151" />
      <Path d="M68 36 L68 53" stroke="#9CA3AF" strokeWidth="1.5" />
      <Path d="M35 36 L35 53" stroke="#9CA3AF" strokeWidth="1.5" />

      {/* Driver Handlebar / Meter */}
      <Rect x="73" y="43" width="7" height="3" rx="1" fill="#4B5563" />

      {/* Headlight */}
      <Circle cx="94" cy="51" r="3.2" fill="#FEF08A" stroke="#CA8A04" strokeWidth="0.8" />
      <Circle cx="94" cy="51" r="1.5" fill="#FFFFFF" />

      {/* Indicator Light */}
      <Circle cx="91" cy="57" r="1.8" fill="#F97316" />

      {/* Rear Fender / Bumper */}
      <Path d="M18 56 L24 56 L22 64 L16 64 Z" fill="#1F2937" />
    </Svg>
  );
}

/**
 * 3/4 Perspective Illustration of Sleek White Uber Cab (Sedan)
 */
export function CabGraphic({ width = 100, height = 75 }: { width?: number; height?: number }): React.JSX.Element {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 90" fill="none">
      <Defs>
        <LinearGradient id="carBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="65%" stopColor="#F3F4F6" />
          <Stop offset="100%" stopColor="#D1D5DB" />
        </LinearGradient>
        <LinearGradient id="carGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#374151" />
          <Stop offset="100%" stopColor="#1F2937" />
        </LinearGradient>
      </Defs>

      {/* Shadow */}
      <Ellipse cx="60" cy="78" rx="48" ry="6" fill="rgba(0,0,0,0.2)" />

      {/* Wheels */}
      <Circle cx="30" cy="68" r="11" fill="#1F2937" />
      <Circle cx="30" cy="68" r="6" fill="#9CA3AF" />
      <Circle cx="30" cy="68" r="2.5" fill="#374151" />

      <Circle cx="90" cy="68" r="11" fill="#1F2937" />
      <Circle cx="90" cy="68" r="6" fill="#9CA3AF" />
      <Circle cx="90" cy="68" r="2.5" fill="#374151" />

      {/* Car Body Shell */}
      <Path
        d="M12 60 C12 55 16 52 24 52 L36 50 L48 34 C51 30 58 28 66 28 L82 28 C87 28 92 31 96 36 L106 50 L112 55 C115 57 115 62 113 65 L105 66 C104 60 98 56 91 56 C84 56 78 61 77 67 L42 67 C41 61 35 56 28 56 C21 56 16 61 15 67 L12 65 Z"
        fill="url(#carBody)"
        stroke="#E5E7EB"
        strokeWidth="1"
      />

      {/* Side & Front Windows */}
      <Path
        d="M49 35 L63 35 L63 48 L41 48 Z"
        fill="url(#carGlass)"
      />
      <Path
        d="M66 35 L81 35 L94 48 L66 48 Z"
        fill="url(#carGlass)"
      />

      {/* Window Highlight */}
      <Path d="M52 38 L60 38" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" />
      <Path d="M69 38 L83 38" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" />

      {/* Headlight */}
      <Path d="M107 53 L114 56 L109 59 Z" fill="#FDE047" />

      {/* Side Mirror */}
      <Rect x="64" y="45" width="5" height="3" rx="1.5" fill="#D1D5DB" />

      {/* Door Seam */}
      <Path d="M64 48 L64 65" stroke="#D1D5DB" strokeWidth="1" />
      <Rect x="67" y="52" width="5" height="1.5" rx="0.5" fill="#9CA3AF" />
    </Svg>
  );
}

/**
 * 3/4 Perspective Illustration of Uber Moto (Bike)
 */
export function BikeGraphic({ width = 100, height = 75 }: { width?: number; height?: number }): React.JSX.Element {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 90" fill="none">
      <Defs>
        <LinearGradient id="bikeTank" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#374151" />
          <Stop offset="100%" stopColor="#111827" />
        </LinearGradient>
      </Defs>

      {/* Shadow */}
      <Ellipse cx="60" cy="78" rx="42" ry="5.5" fill="rgba(0,0,0,0.2)" />

      {/* Rear Wheel */}
      <Circle cx="26" cy="65" r="14" fill="#1F2937" />
      <Circle cx="26" cy="65" r="8" fill="#4B5563" />
      <Circle cx="26" cy="65" r="3" fill="#D1D5DB" />

      {/* Front Wheel */}
      <Circle cx="94" cy="65" r="14" fill="#1F2937" />
      <Circle cx="94" cy="65" r="8" fill="#4B5563" />
      <Circle cx="94" cy="65" r="3" fill="#D1D5DB" />

      {/* Chassis & Exhaust */}
      <Path d="M26 65 L52 65 L60 52 L36 52 Z" fill="#374151" />
      <Path d="M32 68 L68 68 L62 60" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />

      {/* Engine Block */}
      <Rect x="48" y="52" width="16" height="13" rx="2" fill="#1F2937" stroke="#6B7280" strokeWidth="1" />

      {/* Fuel Tank & Body */}
      <Path
        d="M48 48 C50 40 62 38 72 44 L78 48 L56 52 Z"
        fill="url(#bikeTank)"
      />
      <Path d="M52 42 C58 41 66 42 70 46" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />

      {/* Bike Seat */}
      <Path d="M34 46 C40 45 48 46 54 48 L52 52 L36 51 Z" fill="#1F2937" />

      {/* Front Fork & Handlebars */}
      <Path d="M94 65 L80 36 L76 34" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
      <Path d="M72 34 L82 34" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" />

      {/* Headlight */}
      <Circle cx="84" cy="39" r="3" fill="#FEF08A" />
    </Svg>
  );
}

/**
 * Universal Vehicle Graphic Selector for Card Views
 */
export function VehicleCardGraphic({ type, width = 100, height = 75 }: { type: RideType | string; width?: number; height?: number }): React.JSX.Element {
  const normType = (type || 'cab').toLowerCase();
  if (normType === 'bike' || normType === 'scooter') {
    return <BikeGraphic width={width} height={height} />;
  }
  if (normType === 'auto') {
    return <AutoRickshawGraphic width={width} height={height} />;
  }
  return <CabGraphic width={width} height={height} />;
}

/**
 * Driver Avatar matching "SAI" with rating ⭐ 5.0
 */
export function DriverAvatarGraphic({ name: _name = 'SAI', size = 52 }: { name?: string; size?: number }): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Defs>
        <LinearGradient id="avatarBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E2E8F0" />
          <Stop offset="100%" stopColor="#CBD5E1" />
        </LinearGradient>
      </Defs>
      {/* Outer Border & Background */}
      <Circle cx="30" cy="30" r="29" fill="url(#avatarBg)" stroke="#E2E8F0" strokeWidth="2" />

      {/* Shoulders / Shirt */}
      <Path d="M12 55 C12 43 21 39 30 39 C39 39 48 43 48 55 Z" fill="#1E293B" />
      <Path d="M26 39 L30 46 L34 39" fill="#F8FAFC" />

      {/* Neck */}
      <Rect x="26" y="32" width="8" height="8" rx="2" fill="#D97706" opacity="0.8" />

      {/* Head */}
      <Ellipse cx="30" cy="24" rx="10.5" ry="12" fill="#D97706" opacity="0.85" />

      {/* Hair */}
      <Path d="M19 22 C19 14 24 12 30 12 C36 12 41 14 41 22 C37 19 33 19 30 19 C26 19 23 19 19 22 Z" fill="#0F172A" />

      {/* Eyes & Eyebrows */}
      <Circle cx="26" cy="23" r="1.2" fill="#0F172A" />
      <Circle cx="34" cy="23" r="1.2" fill="#0F172A" />
      <Path d="M24 20 L28 20" stroke="#0F172A" strokeWidth="1" strokeLinecap="round" />
      <Path d="M32 20 L36 20" stroke="#0F172A" strokeWidth="1" strokeLinecap="round" />

      {/* Mustache / Beard matching SAI */}
      <Path
        d="M26 27 C28 29 32 29 34 27 C34 31 32 34 30 34 C28 34 26 31 26 27 Z"
        fill="#0F172A"
      />
    </Svg>
  );
}

/**
 * 2D Top-Down Vehicle Map Sprite that rotates along road heading
 */
export function VehicleMapSprite({
  type,
  heading = 0,
}: {
  type: RideType | string;
  heading?: number;
}): React.JSX.Element {
  const normType = (type || 'cab').toLowerCase();
  const isAuto = normType === 'auto';
  const isBike = normType === 'bike' || normType === 'scooter';
  const isCab = !isAuto && !isBike;

  return (
    <G transform={`rotate(${heading})`}>
      {isAuto && (
        <G>
          {/* Shadow */}
          <Rect x="-9" y="-14" width="18" height="28" rx="6" fill="rgba(0,0,0,0.28)" />
          {/* Auto Rickshaw Body - Yellow & Green */}
          {/* Main Canopy */}
          <Rect x="-8" y="-13" width="16" height="26" rx="5" fill="#EAB308" stroke="#CA8A04" strokeWidth="0.8" />
          {/* Front Sloped Hood */}
          <Path d="M-6 -13 L6 -13 L4 -7 L-4 -7 Z" fill="#CA8A04" />
          {/* Windshield */}
          <Rect x="-6" y="-7" width="12" height="4" rx="1" fill="#93C5FD" opacity="0.9" />
          {/* Rickshaw Body Center */}
          <Rect x="-7" y="-2" width="14" height="11" rx="2" fill="#EAB308" />
          {/* Rickshaw Rear Trunk Green Accent */}
          <Rect x="-7.5" y="9" width="15" height="4" rx="1.5" fill="#15803D" />
          {/* Front Wheel */}
          <Rect x="-1.8" y="-16" width="3.6" height="5" rx="1" fill="#111827" />
          {/* Rear Wheels */}
          <Rect x="-9.5" y="6" width="2" height="6" rx="0.8" fill="#111827" />
          <Rect x="7.5" y="6" width="2" height="6" rx="0.8" fill="#111827" />
        </G>
      )}

      {isCab && (
        <G>
          {/* Shadow */}
          <Rect x="-9" y="-17" width="18" height="34" rx="6" fill="rgba(0,0,0,0.28)" />
          {/* White Car Body */}
          <Rect x="-8" y="-16" width="16" height="32" rx="5" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="1" />
          {/* Front Windshield */}
          <Rect x="-6.5" y="-8" width="13" height="5" rx="1.5" fill="#1F2937" />
          {/* Rear Windshield */}
          <Rect x="-6" y="7" width="12" height="4" rx="1.2" fill="#1F2937" />
          {/* Car Roof */}
          <Rect x="-6" y="-2" width="12" height="8" rx="2" fill="#F3F4F6" />
          {/* Side Mirrors */}
          <Rect x="-10" y="-7" width="2.5" height="2" rx="0.5" fill="#FFFFFF" />
          <Rect x="7.5" y="-7" width="2.5" height="2" rx="0.5" fill="#FFFFFF" />
          {/* Headlights */}
          <Circle cx="-5" cy="-15" r="1.5" fill="#FDE047" />
          <Circle cx="5" cy="-15" r="1.5" fill="#FDE047" />
        </G>
      )}

      {isBike && (
        <G>
          {/* Shadow */}
          <Rect x="-5" y="-15" width="10" height="30" rx="4" fill="rgba(0,0,0,0.28)" />
          {/* Motorcycle Frame */}
          <Rect x="-2.5" y="-14" width="5" height="28" rx="2" fill="#111827" />
          {/* Handlebars */}
          <Rect x="-7" y="-7" width="14" height="2.5" rx="1" fill="#374151" />
          {/* Fuel Tank */}
          <Rect x="-3.5" y="-4" width="7" height="6" rx="2" fill="#DC2626" />
          {/* Rider Helmet */}
          <Circle cx="0" cy="2" r="4.2" fill="#000000" stroke="#FBBF24" strokeWidth="0.8" />
          {/* Rear Mudguard */}
          <Rect x="-2" y="9" width="4" height="5" rx="1" fill="#1F2937" />
        </G>
      )}
    </G>
  );
}
