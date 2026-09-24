import React, { useEffect, useState } from 'react';
import { Modal, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SecurityPrivacyScreen from '../native/screens/Security';
import { SecurityPrivacyValues } from '../native/types';
import { useAuth } from '../firebase/context/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';
import { useNativeColors } from '../native/constants/colors';
import { getSecurity, saveSecurity } from '../firebase/services/userService';

/** Shape the WebView document sends up and expects back. */
export type SecurityPrivacyPayload = SecurityPrivacyValues;

interface SecurityPrivacyHostProps {
  visible?: boolean;
  /** Values the WebView is holding when the screen is opened. */
  seed: SecurityPrivacyPayload | null;
  /** Fired on every change so the WebView document can stay in sync. */
  onChange: (next: SecurityPrivacyPayload) => void;
  onClose: () => void;
  asModal?: boolean;
}

/**
 * Opens the security project's screen full-screen over the WebView. The screen
 * itself owns all of its own state, sheets and toast — this only seeds it and
 * relays changes back out.
 *
 * When signed in, the cloud copy (`users/{uid}/meta/security`) wins over the
 * WebView's `seed` on open — the WebView is the local cache, Firestore is the
 * source of truth — and every change is written back to both.
 */
export default function SecurityPrivacyHost({
  visible = true,
  seed,
  onChange,
  onClose,
  asModal = false,
}: SecurityPrivacyHostProps): React.JSX.Element {
  const { user, enabled } = useAuth();
  const { colors: themeColors, scheme } = useAppTheme();
  const [cloudSeed, setCloudSeed] = useState<SecurityPrivacyPayload | null>(null);

  useEffect(() => {
    if (!visible || !enabled || !user) {
      setCloudSeed(null);
      return;
    }
    let cancelled = false;
    getSecurity(user.uid).then((values) => {
      if (!cancelled) setCloudSeed(values);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, enabled, user]);

  const handleChange = (next: SecurityPrivacyPayload) => {
    onChange(next);
    if (enabled && user) {
      void saveSecurity(user.uid, next);
    }
  };

  const content = (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.sheetBg }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <SecurityPrivacyScreen
        navigation={{ goBack: onClose }}
        initialValues={cloudSeed ?? seed ?? undefined}
        onValuesChange={handleChange}
      />
    </SafeAreaView>
  );

  if (asModal) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
        // Remounting on each open means the seed from the WebView is re-applied.
        key={visible ? 'security-open' : 'security-closed'}
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
