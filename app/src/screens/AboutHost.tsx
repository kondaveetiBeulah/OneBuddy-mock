import React, { useCallback, useMemo, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AboutScreen from '../about/screens/AboutScreen';
import AppVersionScreen from '../about/screens/AppVersionScreen';
import TermsOfServiceScreen from '../about/screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../about/screens/PrivacyPolicyScreen';
import type { RootStackParamList } from '../about/navigation/types';
import { useAppTheme } from '../theme/ThemeContext';

type RouteName = keyof RootStackParamList;

interface AboutHostProps {
  visible?: boolean;
  onClose: () => void;
  asModal?: boolean;
}

export default function AboutHost({
  visible = true,
  onClose,
  asModal = false,
}: AboutHostProps): React.JSX.Element {
  const { colors: themeColors } = useAppTheme();
  const [stack, setStack] = useState<RouteName[]>(['About']);

  const current = stack[stack.length - 1];

  const reset = useCallback(() => setStack(['About']), []);

  const navigation = useMemo(() => {
    const goBack = () => {
      setStack((prev) => {
        if (prev.length > 1) return prev.slice(0, -1);
        // At the root, back and close both close the whole modal.
        onClose();
        return prev;
      });
    };

    const push = (name: RouteName) => setStack((prev) => [...prev, name]);

    // Shape-compatible with what the About screens use from a navigation prop.
    return {
      navigate: push,
      push,
      goBack,
      pop: goBack,
      popToTop: reset,
      replace: (name: RouteName) => setStack((prev) => [...prev.slice(0, -1), name]),
      canGoBack: () => true,
      isFocused: () => true,
      setOptions: () => undefined,
      setParams: () => undefined,
      addListener: () => () => undefined,
      removeListener: () => undefined,
      dispatch: () => undefined,
      reset,
      getParent: () => undefined,
    };
  }, [onClose, reset]);

  // The About screens are typed against NativeStackScreenProps; this hands them
  // the same navigate / goBack surface without pulling the navigator back in.
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const screenProps: any = useMemo(
    () => ({
      navigation,
      route: { key: current, name: current, params: undefined },
    }),
    [navigation, current]
  );

  const body =
    current === 'AppVersion' ? (
      <AppVersionScreen {...screenProps} />
    ) : current === 'TermsOfService' ? (
      <TermsOfServiceScreen {...screenProps} />
    ) : current === 'PrivacyPolicy' ? (
      <PrivacyPolicyScreen {...screenProps} />
    ) : (
      <AboutScreen {...screenProps} />
    );

  const content = (
    <SafeAreaProvider>
      <View style={[styles.fill, { backgroundColor: themeColors.sheetBg }]}>{body}</View>
    </SafeAreaProvider>
  );

  if (asModal) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          if (stack.length > 1) setStack((prev) => prev.slice(0, -1));
          else onClose();
        }}
        onShow={reset} // always reopen on About itself, never on a sub-page
        key={visible ? 'about-open' : 'about-closed'}
      >
        {content}
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
