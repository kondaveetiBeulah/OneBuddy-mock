import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

import { COLORS } from '../theme';

export type IconName =
  | 'back'
  | 'help'
  | 'phone'
  | 'chat'
  | 'pin'
  | 'bag'
  | 'shield'
  | 'chevron'
  | 'close'
  | 'alert';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 18, color = COLORS.mist, strokeWidth = 2 }: Props): React.JSX.Element {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'back' ? <Path d="M15 6l-6 6 6 6" {...common} /> : null}
      {name === 'chevron' ? <Path d="M9 6l6 6-6 6" {...common} /> : null}
      {name === 'close' ? <Path d="M6 6l12 12M18 6L6 18" {...common} /> : null}
      {name === 'help' ? (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4" {...common} />
          <Path d="M12 17h.01" {...common} />
        </>
      ) : null}
      {name === 'phone' ? (
        <Path
          d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1.1 1A16 16 0 0 1 4 5.1 1 1 0 0 1 5 4z"
          {...common}
        />
      ) : null}
      {name === 'chat' ? <Path d="M21 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.6A8 8 0 1 1 21 11.5z" {...common} /> : null}
      {name === 'pin' ? (
        <>
          <Path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" {...common} />
          <Circle cx={12} cy={10} r={2.6} {...common} />
        </>
      ) : null}
      {name === 'bag' ? (
        <>
          <Path d="M6 2h12l1.5 5.5A3 3 0 0 1 16.6 11H7.4a3 3 0 0 1-2.9-3.5z" {...common} />
          <Path d="M6 11v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" {...common} />
        </>
      ) : null}
      {name === 'shield' ? (
        <>
          <Path d="M12 3l7.5 3.4V12c0 4.4-3.1 8.2-7.5 9.4C7.6 20.2 4.5 16.4 4.5 12V6.4z" {...common} />
          <Path d="M12 9.5v3" {...common} />
          <Path d="M12 15.5h.01" {...common} />
        </>
      ) : null}
      {name === 'alert' ? (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M12 8v5" {...common} />
          <Path d="M12 16h.01" {...common} />
        </>
      ) : null}
    </Svg>
  );
}
