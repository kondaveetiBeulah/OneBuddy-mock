import { useCallback, useRef, useState } from 'react';
import { Animated } from 'react-native';

export function useToast() {
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string = 'Changes saved across OneBuddy services') => {
      setToastMessage(message);
      setToastVisible(true);
      toastAnim.setValue(0);
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();

      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(() => setToastVisible(false));
      }, 2000);
    },
    [toastAnim]
  );

  return { toastVisible, toastMessage, toastAnim, showToast };
}
