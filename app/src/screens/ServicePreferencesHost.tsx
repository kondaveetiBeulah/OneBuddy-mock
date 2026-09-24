import React, { useEffect } from 'react';
import { BackHandler, Modal } from 'react-native';
import { ServicePreferencesScreen } from '../native/screens/ServicePreferences';

interface ServicePreferencesHostProps {
  visible?: boolean;
  onClose: () => void;
  asModal?: boolean;
}

export default function ServicePreferencesHost({
  visible = true,
  onClose,
  asModal = false,
}: ServicePreferencesHostProps): React.JSX.Element {
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (asModal) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <ServicePreferencesScreen onBack={onClose} />
      </Modal>
    );
  }

  return <ServicePreferencesScreen onBack={onClose} />;
}
