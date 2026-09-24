import React, { useRef } from 'react';
import { Modal, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HelpSupportScreen, { type HelpSupportRef } from '../native/screens/HelpSupport/screens/HelpAndSupportScreen';
import { useAppTheme } from '../theme/ThemeContext';

interface HelpSupportHostProps {
  visible?: boolean;
  onClose: () => void;
  asModal?: boolean;
}

/**
 * Opens the help project's screen full-screen over the WebView. The screen owns
 * all of its own state — search, FAQ sheet, chat thread — and none of it is
 * persisted, so unlike the other two hosts there is nothing to seed or relay.
 */
export default function HelpSupportHost({
  visible = true,
  onClose,
  asModal = false,
}: HelpSupportHostProps): React.JSX.Element {
  const { colors: themeColors, scheme } = useAppTheme();
  const helpRef = useRef<HelpSupportRef>(null);

  const handleRequestClose = () => {
    if (helpRef.current?.canGoBack()) {
      helpRef.current.goBack();
    } else {
      onClose();
    }
  };

  const content = (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.sheetBg }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <HelpSupportScreen ref={helpRef} onClose={onClose} />
    </SafeAreaView>
  );

  if (asModal) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleRequestClose}
        // Remounting on each open clears the previous search and chat draft.
        key={visible ? 'help-open' : 'help-closed'}
      >
        {content}
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
});
