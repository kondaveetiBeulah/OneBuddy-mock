import React from 'react';
import {
  Modal,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import OPBookingScreen from './screens/OPBookingScreen';
import { Hospital, OPBookingData } from './data/data';

export interface OPBookingFlowProps {
  visible: boolean;
  onClose: () => void;
  initialHospital?: Hospital | null;
  onBookingSuccess?: (data: OPBookingData) => void;
}

export const OPBookingFlow: React.FC<OPBookingFlowProps> = ({
  visible,
  onClose,
  initialHospital,
  onBookingSuccess,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={true} />
        <OPBookingScreen
          initialHospital={initialHospital}
          onBackPress={onClose}
          onBookingSuccess={onBookingSuccess}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCF8',
  },
});

export default OPBookingFlow;
