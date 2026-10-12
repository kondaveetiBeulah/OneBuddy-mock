import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapView, Marker } from '../components/MockMap';
import { RootStackParamList } from '../types';
import { COLORS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface SetPriceProps {
  route?: {
    params: {
      vehicle: any;
      pickup: any;
      destination?: string;
    };
  };
  navigation?: any;
  onBook?: (params: { vehicle: any; pickup: any; price: number; destination?: string }) => void;
  onBack?: () => void;
}

const STEPS = [-10, 0, 30, 40, 50, 60, 70];

export const SetPriceScreen = ({ route, navigation, onBook, onBack }: SetPriceProps) => {
  const vehicle = route?.params?.vehicle;
  const pickup = route?.params?.pickup;
  const destination = route?.params?.destination || 'Madhapur Metro';
  const [stepIndex, setStepIndex] = useState(1); // Default to 0 offset (diamond)

  const baseFare = vehicle?.baseFare || 105;
  const currentPrice = baseFare + STEPS[stepIndex];

  const handleBook = () => {
    if (onBook) {
      onBook({ vehicle, pickup, price: currentPrice, destination });
    } else if (navigation?.navigate) {
      navigation.navigate('RideConfirmation', { vehicle, pickup, price: currentPrice, destination });
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  const pickupTitle = pickup?.title || 'Kshatriya Foods';
  const destinationTitle = destination || 'Bachpan Play School, Chintal';

  const pickupCoord = {
    latitude: pickup?.latitude || 17.355,
    longitude: pickup?.longitude || 78.405,
  };

  const dropCoord = {
    latitude: 17.425,
    longitude: 78.475,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          showRoute={true}
          pickupCoord={pickupCoord}
          destCoord={dropCoord}
          showsUserLocation={false}
        >
          {/* Pickup Point Marker */}
          <Marker
            coordinate={pickupCoord}
            title={pickupTitle}
            type="pickup"
          />

          {/* Destination Point Marker */}
          <Marker
            coordinate={dropCoord}
            title={destinationTitle}
            isDestination={true}
            type="destination"
          />
        </MapView>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Interactive Compact Bottom Sheet */}
      <View style={styles.bottomSheetWrapper}>
        <View style={styles.dragHandle} />
        <ScrollView contentContainerStyle={styles.sheetContent} bounces={false}>
          <Text style={styles.title}>Now you can set a price that works for you</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>₹{currentPrice}</Text>
          </View>

          <View style={styles.hintContainer}>
            <Ionicons name="bulb-outline" size={14} color={COLORS.textLight} style={styles.hintIcon} />
            <Text style={styles.hintText}>Higher the price, higher the chance of getting a ride</Text>
          </View>

          {/* Custom Compact Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrackBg} />
            <View style={[styles.sliderTrackFill, { width: `${(stepIndex / (STEPS.length - 1)) * 100}%` }]} />

            <View style={styles.sliderNodes}>
              {STEPS.map((step, idx) => {
                const isSelected = idx === stepIndex;
                const isDiamond = step === 0;
                return (
                  <View key={idx} style={styles.nodeWrapper}>
                    <Text style={[styles.nodeLabel, idx <= stepIndex ? styles.nodeLabelActive : null]}>
                      {isDiamond ? '' : step > 0 ? `+${step}` : step}
                    </Text>
                    <TouchableOpacity
                      style={styles.touchableNode}
                      onPress={() => setStepIndex(idx)}
                    >
                      {isSelected ? (
                        <View style={styles.thumb} />
                      ) : (
                        <View
                          style={[
                            isDiamond ? styles.nodeDiamond : styles.nodeDot,
                            idx <= stepIndex ? styles.nodeActive : null,
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
            <Text style={styles.bookButtonText}>Book {vehicle?.name || 'Auto'} for ₹{currentPrice}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FCF7',
  },
  mapContainer: {
    flex: 1,
    minHeight: 260,
    position: 'relative',
    backgroundColor: '#E8EFDF',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: SIZES.medium,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  bottomSheetWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 10,
    paddingTop: 8,
    paddingBottom: 14,
  },
  dragHandle: {
    width: 34,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetContent: {
    paddingHorizontal: SIZES.medium,
    paddingTop: 0,
    paddingBottom: 6,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 18,
  },
  priceContainer: {
    backgroundColor: '#EAF7E4',
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: '#D3ECD0',
  },
  priceText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: SIZES.small,
  },
  hintIcon: {
    marginRight: 4,
  },
  hintText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  sliderContainer: {
    width: '100%',
    height: 38,
    marginBottom: 12,
    justifyContent: 'center',
  },
  sliderTrackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    top: 20,
  },
  sliderTrackFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    backgroundColor: '#54B713',
    borderRadius: 3,
    top: 20,
  },
  sliderNodes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  nodeWrapper: {
    alignItems: 'center',
    width: 36,
  },
  nodeLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
    height: 14,
  },
  nodeLabelActive: {
    color: '#54B713',
    fontWeight: '800',
  },
  touchableNode: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D9D9D9',
  },
  nodeDiamond: {
    width: 8,
    height: 8,
    backgroundColor: '#54B713',
    transform: [{ rotate: '45deg' }],
  },
  nodeActive: {
    backgroundColor: '#54B713',
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#54B713',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  bookButton: {
    backgroundColor: '#54B713',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 26,
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#54B713',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default SetPriceScreen;
