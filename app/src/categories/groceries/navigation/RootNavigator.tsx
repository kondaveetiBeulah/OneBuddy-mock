import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';
import { BottomTabNavigator } from './BottomTabNavigator';
import { ProductListScreen } from '../screens/ProductListScreen';
import { ProductDetailsScreen } from '../screens/ProductDetailsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { AddressScreen } from '../screens/AddressScreen';
import { DeliverySlotScreen } from '../screens/DeliverySlotScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { OrderConfirmationScreen } from '../screens/OrderConfirmationScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { OrderDetailsScreen } from '../screens/OrderDetailsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { PrivacySecurityScreen } from '../screens/PrivacySecurityScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { WishlistScreen } from '../screens/WishlistScreen';
import { CartScreen } from '../screens/CartScreen';
import LiveTrackingScreen from '../../food/tracking/screens/LiveTrackingScreen';
import FeedbackFormScreen from '../components/FeedbackFormScreen';

import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="Main" component={BottomTabNavigator} />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="Search" component={SearchScreen as any} />
      <Stack.Screen name="Wishlist" component={WishlistScreen as any} />
      <Stack.Screen name="Cart" component={CartScreen as any} />
      <Stack.Screen name="Address" component={AddressScreen as any} />
      <Stack.Screen name="DeliverySlot" component={DeliverySlotScreen as any} />
      <Stack.Screen name="Payment" component={PaymentScreen as any} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      <Stack.Screen name="LiveTracking">
        {({ route, navigation }: any) => (
          <LiveTrackingScreen
            orderId={route.params?.orderId}
            restaurantName={route.params?.storeName || 'OneBuddy Darkstore'}
            restaurantAddress={route.params?.storeAddress || 'Golf Course Rd, Sector 18'}
            deliveryAddress={route.params?.deliveryAddress}
            deliveryAddressLabel={route.params?.deliveryAddressLabel}
            items={route.params?.items}
            totalAmount={route.params?.totalAmount}
            onBack={() => navigation.goBack()}
            onFinishAndRate={() => {
              navigation.navigate('Feedback', {
                order: route.params?.order || {
                  id: route.params?.orderId,
                  items: route.params?.items,
                  total: route.params?.totalAmount,
                },
              });
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Feedback">
        {({ route, navigation }: any) => (
          <FeedbackFormScreen
            order={route.params?.order}
            onBack={() => navigation.goBack()}
            onComplete={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }}
            onContinueShopping={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Orders" component={OrdersScreen as any} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen as any} />
      <Stack.Screen name="Settings" component={SettingsScreen as any} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen as any} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen as any} />
      <Stack.Screen name="About" component={AboutScreen as any} />
    </Stack.Navigator>
  );
};
