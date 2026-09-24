import React from 'react';
import Svg, { Path, Rect, Circle, Ellipse, G, Line, Text as SvgText } from 'react-native-svg';
import { IconType } from '../types';

interface IconProps {
  type: IconType;
  size?: number;
}

export default function Icon({ type, size = 26 }: IconProps) {
  const vb = '0 0 64 64';

  switch (type) {
    case 'pill':
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Rect x={4} y={6} width={56} height={44} rx={8} fill="#CBD6DE" stroke="#9FB0BB" strokeWidth={1.5} />
          {[0, 1, 2].map((cIdx) =>
            [0, 1].map((rIdx) => (
              <G key={`${cIdx}-${rIdx}`}>
                <Circle cx={17 + cIdx * 15} cy={20 + rIdx * 16} r={6.4} fill="#F6F9FB" stroke="#B9C6CE" />
                <Circle cx={17 + cIdx * 15} cy={20 + rIdx * 16} r={3.4} fill="#16A34A" />
              </G>
            ))
          )}
        </Svg>
      );

    case 'capsule':
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <G transform="rotate(-25 32 32)">
            <Path d="M14 32a10 10 0 0110-10h4v20h-4a10 10 0 01-10-10z" fill="#16A34A" />
            <Path d="M50 32a10 10 0 01-10 10h-4V22h4a10 10 0 0110 10z" fill="#FFFFFF" stroke="#E4E9DF" />
            <Ellipse cx={21} cy={27} rx={2.6} ry={1.4} fill="#86EFAC" />
          </G>
        </Svg>
      );

    case 'drop':
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Path
            d="M32 8c9 12 15 20 15 28a15 15 0 01-30 0c0-8 6-16 15-28z"
            fill="#22C55E"
            stroke="#16A34A"
            strokeWidth={1.2}
          />
          <Ellipse cx={26} cy={34} rx={4} ry={6} fill="#BBF7D0" opacity={0.8} />
        </Svg>
      );

    case 'syringe':
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <G transform="rotate(-40 32 32)">
            <Rect x={10} y={26} width={34} height={12} rx={2} fill="#F3F6F4" stroke="#C6CFC6" />
            {[16, 22, 28, 34, 40].map((x) => (
              <Line key={x} x1={x} y1={27} x2={x} y2={31} stroke="#AEB8AE" />
            ))}
            <Rect x={40} y={28} width={14} height={8} rx={1.5} fill="#16A34A" />
            <Rect x={6} y={28} width={6} height={8} rx={1} fill="#16A34A" />
            <Rect x={54} y={30} width={8} height={4} fill="#8B9A8B" />
            <Rect x={61} y={31} width={3} height={2} fill="#15803D" />
          </G>
        </Svg>
      );

    case 'needle':
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Rect x={6} y={10} width={52} height={34} rx={6} fill="#DCFCE7" stroke="#86EFAC" strokeWidth={1.2} />
          <Rect x={6} y={10} width={52} height={10} rx={6} fill="#16A34A" />
          {[16, 26, 36, 46].map((x, i) => (
            <Line key={x} x1={x} y1={24} x2={x + (i % 2 ? 4 : -4)} y2={42} stroke="#7C8B99" strokeWidth={1.6} />
          ))}
          {[16, 26, 36, 46].map((x) => (
            <Circle key={`c${x}`} cx={x} cy={24} r={2.2} fill="#F3F6F4" stroke="#7C8B99" />
          ))}
        </Svg>
      );

    case 'sanitary':
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Rect x={8} y={6} width={48} height={52} rx={10} fill="#F6C9D6" stroke="#E9A9BC" strokeWidth={1.2} />
          <Path d="M18 44c4-16 24-16 28 0" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
          <Ellipse cx={32} cy={20} rx={10} ry={6} fill="#FFFFFF" opacity={0.85} />
        </Svg>
      );

    case 'pen':
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Rect x={24} y={6} width={16} height={46} rx={8} fill="#16A34A" stroke="#15803D" />
          <Rect x={27} y={20} width={10} height={10} rx={2} fill="#F3F6F4" />
          <SvgText x={32} y={28} fontSize={7} fontWeight="700" fill="#1B2417" textAnchor="middle">
            12
          </SvgText>
          <Rect x={27} y={2} width={10} height={6} rx={2} fill="#8B9A8B" />
          <Path d="M29 52l3 8 3-8z" fill="#C7CFC7" />
        </Svg>
      );

    default:
      // box — used for parcels, "All" categories, empty-cart, etc.
      return (
        <Svg width={size} height={size} viewBox={vb}>
          <Path d="M32 6l24 10v32l-24 10-24-10V16z" fill="#E7C79A" />
          <Path d="M32 6l24 10-24 10-24-10z" fill="#D4AE79" />
          <Path d="M32 26v32" stroke="#B78E56" strokeWidth={1.4} />
          <Path d="M8 16l24 10 24-10" fill="none" stroke="#B78E56" strokeWidth={1.4} />
          <Path d="M20 11l24 10M44 11l-24 10" stroke="#8A6423" strokeWidth={1.4} />
        </Svg>
      );
  }
}
