import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { COLORS } from '../theme/colors';

interface IconProps {
  size?: number;
  color?: string;
}

export function CartIcon({ size = 20, color = COLORS.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM20 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
        fill={color}
      />
      <Path
        d="M1 1.5h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6.5H6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchIcon({ size = 18, color = COLORS.inkSoft }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="11"
        cy="11"
        r="7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 20l-4.2-4.2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PinIcon({ size = 16, color = COLORS.greenDark }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21.5C12 21.5 19 14.5 19 9A7 7 0 105 9c0 5.5 7 12.5 7 12.5z"
        fill={color}
        opacity={0.15}
      />
      <Path
        d="M12 21.5C12 21.5 19 14.5 19 9A7 7 0 105 9c0 5.5 7 12.5 7 12.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="9"
        r="2.6"
        fill={color}
      />
    </Svg>
  );
}

export function BackIcon({ size = 20, color = COLORS.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CloseIcon({ size = 16, color = COLORS.inkSoft }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={COLORS.line} />
      <Path
        d="M15 9l-6 6M9 9l6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 14, color = COLORS.greenDark }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UpiPayIcon({ size = 24, color = '#1565D8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="2" width="14" height="20" rx="3" stroke={color} strokeWidth={2} />
      <Path d="M12 18h.01" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Path
        d="M13 6l-3.5 5h3.5L11 15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CardPayIcon({ size = 24, color = '#1565D8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth={2} />
      <Path d="M2 10h20" stroke={color} strokeWidth={2} />
      <Rect x="5" y="14" width="4" height="2.5" rx="0.5" fill={color} />
      <Circle cx="15.5" cy="15" r="1.5" fill={color} />
      <Circle cx="18" cy="15" r="1.5" fill={color} opacity={0.6} />
    </Svg>
  );
}

export function NetBankingIcon({ size = 24, color = '#1565D8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 4l9 5.5v1.5H3V9.5z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M5.5 11v6M9.8 11v6M14.2 11v6M18.5 11v6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M2 20h20" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function CouponPercentIcon({ size = 22, color = '#1565D8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Path d="M8 16L16 8" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx="9" cy="9" r="1.5" fill={color} />
      <Circle cx="15" cy="15" r="1.5" fill={color} />
    </Svg>
  );
}

export function PrescriptionDocIcon({ size = 24, color = '#EA580C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2.5" stroke={color} strokeWidth={2} />
      <Path d="M9 2h6v3H9V2z" fill={color} />
      <Path d="M12 9v6M9 12h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 18h8" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}

export function GpsIcon({ size = 18, color = '#468510' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={2} />
      <Circle cx="12" cy="12" r="3" fill={color} />
      <Path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function EditAddressIcon({ size = 18, color = '#1A2416' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

