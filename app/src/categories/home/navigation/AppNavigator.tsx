import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabScreen } from '../screens/MainTabScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SubServiceScreen } from '../screens/SubServiceScreen';
import { DateTimePickerScreen } from '../screens/DateTimePickerScreen';
import { AddressScreen } from '../screens/AddressScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { BookingConfirmationScreen } from '../screens/BookingConfirmationScreen';
import { LiveTrackingScreen } from '../screens/LiveTrackingScreen';
import { RatingReviewScreen } from '../screens/RatingReviewScreen';
import { COLORS } from '../theme';
import PaymentsHost from '@/screens/PaymentsHost';

export type RootStackParamList = {
  MainTabs: { initialTab?: 'Home' | 'Bookings' | 'HelpSupport' | 'Profile' } | undefined;
  Home: undefined;
  Bookings: undefined;
  HelpSupport: undefined;
  Profile: undefined;
  SubServices: { categoryId: string; categoryTitle: string };
  DateTimePicker: undefined;
  Address: { fromBooking?: boolean } | undefined;
  Payment: undefined;
  BookingConfirmation: undefined;
  LiveTracking: undefined;
  RatingReview: undefined;
  Wallet: undefined;
  SavedPayments: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabScreen}
        options={{ animation: 'none' }}
      />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Bookings" component={BookingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="SubServices" component={SubServiceScreen} />
      <Stack.Screen name="DateTimePicker" component={DateTimePickerScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen
        name="BookingConfirmation"
        component={BookingConfirmationScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
      <Stack.Screen
        name="RatingReview"
        component={RatingReviewScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Wallet">
        {({ navigation }) => (
          <PaymentsHost
            visible
            onClose={() => navigation.goBack()}
            asModal={false}
            initialPage="wallet"
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="SavedPayments">
        {({ navigation }) => (
          <PaymentsHost
            visible
            onClose={() => navigation.goBack()}
            asModal={false}
            initialPage="main"
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default AppNavigator;
