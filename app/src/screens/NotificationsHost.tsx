import React from 'react';
import { Modal, StyleSheet } from 'react-native';

import NotificationSettingsScreen from '../native/screens/Notifications/screens/NotificationSettingsScreen';

interface NotificationsHostProps {
  visible?: boolean;
  onClose: () => void;
  asModal?: boolean;
}

export default function NotificationsHost({
  visible = true,
  onClose,
  asModal = false,
}: NotificationsHostProps): React.JSX.Element {
  if (asModal) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <NotificationSettingsScreen onBack={onClose} />
      </Modal>
    );
  }

  return <NotificationSettingsScreen onBack={onClose} />;
}

const styles = StyleSheet.create({});
