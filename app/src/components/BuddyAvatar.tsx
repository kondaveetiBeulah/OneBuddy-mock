import React from 'react';
import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Rect,
} from 'react-native-svg';
import type { AvatarStyleId } from '@/context/ProfileContext';
import { resolveAvatarColor } from '@/context/ProfileContext';

interface BuddyAvatarProps {
  size?: number;
  styleId?: AvatarStyleId;
  color?: string;
  borderRadius?: number;
  isCircle?: boolean;
}

function luminance(hex: string): number {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 0.5;
  const n = parseInt(clean, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export default function BuddyAvatar({
  size = 40,
  styleId = 'classic',
  color = '#4C9A6A',
  borderRadius,
  isCircle = false,
}: BuddyAvatarProps) {
  const safeColor = resolveAvatarColor(color);
  const dark = luminance(safeColor) < 0.26;
  const ink = dark ? '#EDEAF6' : '#15121F';
  const hair = dark ? '#9C8AC4' : '#241C33';

  const rx = isCircle ? 50 : borderRadius !== undefined ? borderRadius : 28;

  const eyes = (
    <>
      <Rect x="30" y="41" width="10" height="15" rx="5" fill={ink} />
      <Rect x="60" y="41" width="10" height="15" rx="5" fill={ink} />
    </>
  );

  const smile = (
    <Path
      d="M35 67 Q50 81 65 67"
      fill="none"
      stroke={ink}
      strokeWidth="6"
      strokeLinecap="round"
    />
  );

  const blush = (
    <>
      <Ellipse cx="26" cy="62" rx="7" ry="4.5" fill="#FFFFFF" opacity={0.18} />
      <Ellipse cx="74" cy="62" rx="7" ry="4.5" fill="#FFFFFF" opacity={0.18} />
    </>
  );

  const highlight = (
    <Circle cx="30" cy="26" r="30" fill="#FFFFFF" opacity={0.10} />
  );

  let hairBack: React.ReactNode = null;
  let front: React.ReactNode = null;
  let useEyes = true;
  let mouth: React.ReactNode = smile;

  switch (styleId) {
    case 'shades':
      useEyes = false;
      front = (
        <>
          <Rect x="19" y="36" width="26" height="19" rx="8" fill={ink} />
          <Rect x="55" y="36" width="26" height="19" rx="8" fill={ink} />
          <Rect x="44" y="42" width="12" height="4.5" rx="2" fill={ink} />
          <Path d="M23 41 L30 41 L22 50 L19 50 Z" fill="#FFFFFF" opacity={0.3} />
          <Path d="M59 41 L66 41 L58 50 L55 50 Z" fill="#FFFFFF" opacity={0.3} />
        </>
      );
      mouth = (
        <Path
          d="M36 68 Q50 78 64 66"
          fill="none"
          stroke={ink}
          strokeWidth="6"
          strokeLinecap="round"
        />
      );
      break;

    case 'wave':
      hairBack = (
        <>
          <Path
            d="M12 40 Q12 8 50 8 Q88 8 88 40 Q78 21 50 21 Q22 21 12 40 Z"
            fill={hair}
          />
          <Path
            d="M12 36 Q9 66 15 82 Q22 86 24 77 Q19 57 21 36 Z"
            fill={hair}
          />
          <Path
            d="M88 36 Q91 66 85 82 Q78 86 76 77 Q81 57 79 36 Z"
            fill={hair}
          />
        </>
      );
      break;

    case 'bun':
      hairBack = (
        <>
          <Circle cx="50" cy="9" r="12" fill={hair} />
          <Path
            d="M14 40 Q14 10 50 10 Q86 10 86 40 V46 Q78 24 50 24 Q22 24 14 46 Z"
            fill={hair}
          />
        </>
      );
      front = <Circle cx="50" cy="9" r="6" fill="#FFFFFF" opacity={0.12} />;
      break;

    case 'curls':
      hairBack = (
        <G fill={hair}>
          <Circle cx="22" cy="24" r="12" />
          <Circle cx="39" cy="15" r="13" />
          <Circle cx="61" cy="15" r="13" />
          <Circle cx="78" cy="24" r="12" />
          <Circle cx="50" cy="21" r="13" />
        </G>
      );
      break;

    case 'specs':
      front = (
        <G fill="none" stroke={ink} strokeWidth="4">
          <Circle cx="35" cy="47" r="14" />
          <Circle cx="65" cy="47" r="14" />
          <Path d="M49 47 H51" />
          <Path d="M21 44 L13 41" />
          <Path d="M79 44 L87 41" />
        </G>
      );
      break;

    case 'cap':
      hairBack = (
        <>
          <Path d="M16 31 Q16 6 50 6 Q84 6 84 31 Z" fill={hair} />
          <Path d="M9 31 H91 Q96 31 96 36 H4 Q4 31 9 31 Z" fill={hair} />
          <Path d="M50 6 Q31 6 22 23 Q35 14 50 14 Z" fill="#FFFFFF" opacity={0.14} />
        </>
      );
      break;

    case 'beard':
      hairBack = (
        <>
          <Path
            d="M20 50 Q22 92 50 92 Q78 92 80 50 Q73 79 50 79 Q27 79 20 50 Z"
            fill={hair}
          />
          <Path d="M35 59 Q50 53 65 59 Q50 66 35 59 Z" fill={hair} />
        </>
      );
      break;

    case 'classic':
    default:
      break;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" rx={rx} fill={safeColor} />
      {highlight}
      {hairBack}
      {useEyes ? eyes : null}
      {blush}
      {mouth}
      {front}
    </Svg>
  );
}
