import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';

import SecurityPrivacyHost from './SecurityPrivacyHost';
import HelpSupportHost from './HelpSupportHost';
import AboutHost from './AboutHost';
import PaymentsHost from './PaymentsHost';
import OrdersHost from './OrdersHost';
import AddressHost from './AddressHost';
import NotificationsHost from './NotificationsHost';
import GroceriesHost from './GroceriesHost';
import FoodHost from './FoodHost';
import RidesHost from './RidesHost';
import CareHost from './CareHost';
import ServicePreferencesHost from './ServicePreferencesHost';
import EditProfileSheet from '@/components/EditProfileSheet';

/**
 * The host components were written for the WebView era: each was a
 * full-screen `Modal` driven by `visible` + `onClose`.
 *
 * For settings pages, passing `asModal={false}` renders the screen content
 * directly into the stack route, allowing React Navigation's native
 * `slide_from_right` push transition to handle the slide animation cleanly.
 */
function useDismiss(): () => void {
  const navigation = useNavigation();
  return useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);
}

export function SecurityPrivacyRoute() {
  return <SecurityPrivacyHost visible seed={null} onChange={() => {}} onClose={useDismiss()} asModal={false} />;
}

export function HelpSupportRoute() {
  return <HelpSupportHost visible onClose={useDismiss()} asModal={false} />;
}

export function AboutRoute() {
  return <AboutHost visible onClose={useDismiss()} asModal={false} />;
}

export function PaymentsRoute() {
  return <PaymentsHost visible onClose={useDismiss()} asModal={false} />;
}

export function OrdersRoute() {
  return <OrdersHost visible onClose={useDismiss()} onAction={() => {}} asModal={false} />;
}

export function AddressesRoute() {
  return <AddressHost visible onChange={() => {}} onClose={useDismiss()} asModal={false} />;
}

export function NotificationsRoute() {
  return <NotificationsHost visible onClose={useDismiss()} asModal={false} />;
}

export function GroceriesRoute() {
  return <GroceriesHost visible onClose={useDismiss()} />;
}

export function FoodRoute() {
  return <FoodHost visible onClose={useDismiss()} />;
}

export function RidesRoute() {
  return <RidesHost visible onClose={useDismiss()} />;
}

export function CareRoute() {
  return <CareHost visible onClose={useDismiss()} />;
}

export function ServicePreferencesRoute() {
  return <ServicePreferencesHost visible onClose={useDismiss()} asModal={false} />;
}

export function EditProfileRoute() {
  return <EditProfileSheet visible onClose={useDismiss()} asModal={false} />;
}

