import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, BackHandler, Platform, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapView, Marker } from '../components/MockMap';
import { COLORS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { VEHICLES } from '../data';
import { useRideTheme } from '../theme';

interface PickupSelectionProps {
  route?: {
    params?: {
      vehicle?: any;
      pickup?: any;
      destination?: string;
    };
  };
  navigation?: any;
  onConfirmPickup?: (params: { vehicle: any; pickup: any; destination?: string }) => void;
  onBack?: () => void;
  isDark?: boolean;
}

const { height } = Dimensions.get('window');

export const PickupSelectionScreen = ({
  route,
  navigation,
  onConfirmPickup,
  onBack,
  isDark: isDarkProp,
}: PickupSelectionProps) => {
  const theme = useRideTheme();
  const isDark = isDarkProp ?? theme.isDark;
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  ) + 10;
  const vehicle = route?.params?.vehicle || VEHICLES[3] || VEHICLES[0];
  const passedPickup = route?.params?.pickup;
  const rawDest = route?.params?.destination as any;
  const destinationTitle = typeof rawDest === 'string'
    ? rawDest
    : (rawDest?.title || 'Destination');

  const pickupLocation = {
    id: passedPickup?.id || '1',
    latitude: passedPickup?.latitude || 17.385044,
    longitude: passedPickup?.longitude || 78.486671,
    title: passedPickup?.title || 'Kshatriya Foods',
    subtitle: passedPickup?.subtitle || 'Selected pickup',
    description: passedPickup?.description || passedPickup?.title || 'VIP Hills, Jaihind Enclave, Madhapur, Hyderabad',
    fare: vehicle?.baseFare ?? (passedPickup?.fare || 105),
  };

  const handleConfirmPickup = () => {
    if (onConfirmPickup) {
      onConfirmPickup({ vehicle, pickup: pickupLocation, destination: destinationTitle });
    } else if (navigation?.navigate) {
      navigation.navigate('SetPrice', { vehicle, pickup: pickupLocation, destination: destinationTitle });
    }
  };

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (navigation?.goBack) {
      navigation.goBack();
    }
  }, [onBack, navigation]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, [handleBack]);

  const pickupCoord = {
    latitude: passedPickup?.latitude || 17.355,
    longitude: passedPickup?.longitude || 78.405,
  };
  const dropCoord = {
    latitude: 17.425,
    longitude: 78.475,
  };

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#121214' }]}>
      {/* Full-bleed Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          showRoute={true}
          pickupCoord={pickupCoord}
          destCoord={dropCoord}
          showLandmarks={false}
          showOneBuddyOverlay={false}
        >
          <Marker
            coordinate={pickupCoord}
            title={pickupLocation.title || 'Pickup Location'}
            type="pickup"
          />
          <Marker
            coordinate={dropCoord}
            title={destinationTitle}
            isDestination={true}
            type="drop"
          />
        </MapView>

        {/* Back Button floating on map */}
        <TouchableOpacity
          style={[
            styles.backButton,
            { top: safeTop },
            isDark && { backgroundColor: '#1D1E22' },
          ]}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={22} color={isDark ? '#F1F1EC' : '#0f172a'} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, isDark && { backgroundColor: '#1D1E22' }]}>
        {/* Drag handle */}
        <View style={[styles.dragHandle, isDark && { backgroundColor: '#3E424B' }]} />

        <View style={styles.headerRow}>
          <View style={[styles.greenIcon, isDark && { backgroundColor: '#24262B' }]}>
            <Ionicons name="location" size={20} color={COLORS.success} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, isDark && { color: '#F1F1EC' }]}>Check your pickup point</Text>
            <Text style={[styles.headerSubtitle, isDark && { color: '#9BA08F' }]}>Move the pin to adjust your exact pickup</Text>
          </View>
        </View>

        {/* Address box */}
        <View style={[styles.addressBox, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
          <View style={styles.addressRow}>
            <View style={styles.greenDot} />
            <View style={styles.addressTexts}>
              <Text style={[styles.addressTitle, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>{pickupLocation.title}</Text>
              <Text style={[styles.addressSub, isDark && { color: '#9BA08F' }]} numberOfLines={2}>{pickupLocation.description}</Text>
            </View>
          </View>
          <View style={[styles.addressDivider, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
          <View style={styles.addressRow}>
            <View style={styles.orangeDot} />
            <View style={styles.addressTexts}>
              <Text style={[styles.addressLabel, isDark && { color: '#9BA08F' }]}>DROP</Text>
              <Text style={[styles.addressTitle, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>{destinationTitle}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPickup}>
          <Text style={styles.confirmButtonText}>Confirm Pickup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FCF7',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 20,
  },
  pickupPinLabel: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  pickupPinDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },
  pickupPinText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  // ── Bottom Sheet ─────────────────────────────────────────────────────────
  bottomSheet: {
    height: 290,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  greenIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF7E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  addressBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D3ECD0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: '#F8FCF7',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
  },
  addressDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e2e8f0',
    marginLeft: 22,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    marginTop: 4,
  },
  orangeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#54B713',
    marginTop: 4,
  },
  addressTexts: { flex: 1 },
  addressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  addressSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
    lineHeight: 16,
  },
  confirmButton: {
    height: 52,
    borderRadius: 28,
    backgroundColor: '#54B713',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#54B713',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
});

export default PickupSelectionScreen;
