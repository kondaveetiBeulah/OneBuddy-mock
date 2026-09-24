import React, { useState, useEffect } from 'react';
import {
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  View,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookingProvider } from './context/BookingContext';
import { HomeScreen } from './screens/HomeScreen';
import { DoctorsScreen } from './screens/DoctorsScreen';
import { AvailabilityScreen } from './screens/AvailabilityScreen';
import { PatientDetailsScreen } from './screens/PatientDetailsScreen';
import { PaymentModeScreen } from './screens/PaymentModeScreen';
import { PaymentScreen } from './screens/PaymentScreen';
import { ConfirmationScreen } from './screens/ConfirmationScreen';

import { Booking } from './types';

export interface HomeVisitsFlowProps {
  visible: boolean;
  onClose: () => void;
  onBookingSuccess?: (booking: Booking) => void;
}

type ScreenRoute = {
  name: string;
  params?: any;
};

function HomeVisitsFlowInner({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [screenHistory, setScreenHistory] = useState<ScreenRoute[]>([{ name: 'Home' }]);
  const [currentScreen, setCurrentScreen] = useState<string>('Home');
  const [currentParams, setCurrentParams] = useState<any>(undefined);

  const navigation = {
    navigate: (screen: string, params?: any) => {
      setScreenHistory((prev) => [...prev, { name: screen, params }]);
      setCurrentScreen(screen);
      setCurrentParams(params);
    },
    goBack: () => {
      if (screenHistory.length <= 1) {
        onClose();
        return;
      }
      const newHistory = screenHistory.slice(0, -1);
      const prevScreen = newHistory[newHistory.length - 1];
      setScreenHistory(newHistory);
      setCurrentScreen(prevScreen.name);
      setCurrentParams(prevScreen.params);
    },
    reset: (config: { index: number; routes: { name: string; params?: any }[] }) => {
      const target = config.routes[config.routes.length - 1] || { name: 'Home' };
      setScreenHistory([target]);
      setCurrentScreen(target.name);
      setCurrentParams(target.params);
    },
  };

  // Hardware/System back button handling
  useEffect(() => {
    const onHardwareBack = () => {
      if (screenHistory.length > 1) {
        navigation.goBack();
        return true;
      }
      onClose();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [screenHistory, onClose]);

  const previousRoute = screenHistory.length > 1 ? screenHistory[screenHistory.length - 2] : { name: 'Doctors' };
  const baseScreen = currentScreen === 'Availability' ? previousRoute.name : currentScreen;
  const baseParams = currentScreen === 'Availability' ? previousRoute.params : currentParams;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {baseScreen === 'Home' && (
        <HomeScreen navigation={navigation} onClose={onClose} />
      )}

      {baseScreen === 'Doctors' && (
        <DoctorsScreen navigation={navigation} route={{ params: baseParams }} />
      )}

      {currentScreen === 'Availability' && (
        <AvailabilityScreen navigation={navigation} route={{ params: currentParams }} />
      )}

      {currentScreen === 'PatientDetails' && (
        <PatientDetailsScreen navigation={navigation} />
      )}

      {currentScreen === 'PaymentMode' && (
        <PaymentModeScreen navigation={navigation} />
      )}

      {currentScreen === 'Payment' && (
        <PaymentScreen navigation={navigation} />
      )}

      {currentScreen === 'Confirmation' && (
        <ConfirmationScreen navigation={navigation} />
      )}
    </View>
  );
}

export const HomeVisitsFlow: React.FC<HomeVisitsFlowProps> = ({
  visible,
  onClose,
  onBookingSuccess,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <BookingProvider onBookingSuccess={onBookingSuccess}>
        <HomeVisitsFlowInner onClose={onClose} />
      </BookingProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
