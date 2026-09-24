import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import AddressScreen from '../native/screens/Address/AddressScreen';
import type { Address, LocationResult } from '../native/screens/Address/AddressScreen';
import { useAuth } from '../firebase/context/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';
import { listAddresses, replaceAddresses } from '../firebase/services/addressService';

export interface AddressesPayload {
  /** One-line label for the default address, shown on the Settings row. */
  address: string;
  /** Full list, in case the document ever wants more than the summary. */
  addresses: Address[];
}

interface AddressHostProps {
  visible?: boolean;
  onChange: (next: AddressesPayload) => void;
  onClose: () => void;
  asModal?: boolean;
}

/** "Flat 302, Sai Residency, Banjara Hills, Hyderabad 500034" */
function summarise(a: Address | undefined): string {
  if (!a) return '';
  return [a.line1, a.line2, a.city && a.pincode ? `${a.city} ${a.pincode}` : a.city]
    .filter(Boolean)
    .join(', ');
}

/**
 * Real device GPS + reverse geocoding for the screen's "Use current location"
 * field, using expo-location (already a dependency of this project). Any
 * failure - permission denied, no fix, geocoder down - is surfaced by the
 * screen as an inline note rather than a crash.
 */
async function getCurrentLocation(): Promise<LocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission was denied. Turn it on in system settings.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const { latitude, longitude } = position.coords;

  let place: Location.LocationGeocodedAddress | undefined;
  try {
    [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
  } catch {
    // Coordinates alone are still useful - the screen pins them and lets the
    // person type the rest.
  }

  return {
    latitude,
    longitude,
    line1: place?.name ?? undefined,
    line2: [place?.street, place?.district].filter(Boolean).join(', ') || undefined,
    city: place?.city ?? place?.subregion ?? undefined,
    state: place?.region ?? undefined,
    pincode: place?.postalCode ?? undefined,
  };
}

/**
 * Presents the native Addresses screen full-screen over the WebView.
 *
 * Settings -> Account -> "Addresses & delivery" (and the "Address" quick tile)
 * post up from the document; every edit comes back through onChange so the
 * page's own persistence layer keeps the delivery address it already stored.
 */
/**
 * Presents the native Addresses screen full-screen over the WebView.
 *
 * When signed in, the address book is loaded from
 * `users/{uid}/addresses` on open and the whole list is written back to
 * Firestore on every change, alongside the existing `onChange` relay that
 * keeps the WebView document's summary in sync.
 */
export default function AddressHost({
  visible = true,
  onChange,
  onClose,
  asModal = false,
}: AddressHostProps): React.JSX.Element {
  const { user, enabled } = useAuth();
  const { colors: themeColors, scheme } = useAppTheme();
  const [cloudAddresses, setCloudAddresses] = useState<Address[] | undefined>(undefined);

  useEffect(() => {
    if (!visible || !enabled || !user) {
      setCloudAddresses(undefined);
      return;
    }
    let cancelled = false;
    listAddresses(user.uid).then((addresses) => {
      if (!cancelled) setCloudAddresses(addresses);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, enabled, user]);

  const handleChange = useCallback(
    (addresses: Address[]) => {
      const preferred = addresses.find((a) => a.isDefault) ?? addresses[0];
      onChange({ address: summarise(preferred), addresses });
      if (enabled && user) {
        void replaceAddresses(user.uid, addresses);
      }
    },
    [onChange, enabled, user]
  );

  const content = (
    <SafeAreaProvider>
      <View style={[styles.fill, { backgroundColor: themeColors.sheetBg }]}>
        <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
        {cloudAddresses === undefined ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={themeColors.lavender} />
          </View>
        ) : (
          <AddressScreen
            onClose={onClose}
            onChange={handleChange}
            getCurrentLocation={getCurrentLocation}
            initialAddresses={cloudAddresses}
          />
        )}
      </View>
    </SafeAreaProvider>
  );

  if (asModal) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
        // Remounting on each open gives the screen a clean start, matching the
        // other native hosts.
        key={visible ? 'addresses-open' : 'addresses-closed'}
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
