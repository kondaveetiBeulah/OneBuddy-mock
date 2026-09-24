import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Reusable hook to observe the device's reduce-motion accessibility setting.
 */
export function useMotionPreference(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (alive) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return reduceMotion;
}
