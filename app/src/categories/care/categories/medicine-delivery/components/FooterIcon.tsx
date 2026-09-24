import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { COLORS } from '../theme/colors';

interface FooterIconProps {
  name: 'home' | 'categories' | 'orders' | 'account';
  active?: boolean;
  size?: number;
}

export default function FooterIcon({ name, active = false, size = 22 }: FooterIconProps) {
  const activeColor = COLORS.greenDark;
  const inactiveColor = COLORS.inkSoft;
  const color = active ? activeColor : inactiveColor;

  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6a1 1 0 00-1-1h-4a1 1 0 00-1 1v6H4a1 1 0 01-1-1V10.5z"
            fill={active ? color : 'none'}
            stroke={color}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'categories':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="3"
            width="7.5"
            height="7.5"
            rx="2"
            fill={active ? color : 'none'}
            stroke={color}
            strokeWidth={1.9}
          />
          <Rect
            x="13.5"
            y="3"
            width="7.5"
            height="7.5"
            rx="2"
            fill={active ? color : 'none'}
            stroke={color}
            strokeWidth={1.9}
          />
          <Rect
            x="3"
            y="13.5"
            width="7.5"
            height="7.5"
            rx="2"
            fill={active ? color : 'none'}
            stroke={color}
            strokeWidth={1.9}
          />
          <Rect
            x="13.5"
            y="13.5"
            width="7.5"
            height="7.5"
            rx="2"
            fill={active ? color : 'none'}
            stroke={color}
            strokeWidth={1.9}
          />
        </Svg>
      );

    case 'orders':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M21 8l-9-5-9 5v8l9 5 9-5V8z"
            fill={active ? color : 'none'}
            stroke={color}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M3.3 8L12 12.8l8.7-4.8M12 22.8V12.8"
            stroke={active ? '#FFFFFF' : color}
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'account':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
            stroke={color}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx="12"
            cy="7"
            r="4"
            fill={active ? color : 'none'}
            stroke={color}
            strokeWidth={1.9}
          />
        </Svg>
      );

    default:
      return null;
  }
}
