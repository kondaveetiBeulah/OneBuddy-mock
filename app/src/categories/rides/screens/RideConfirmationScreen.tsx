import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, Easing, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapView, Marker } from '../components/MockMap';
import { RootStackParamList, RideDetails } from '../types';
import { COLORS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import FareBoostChips from '../components/FareBoostChips';

interface RideConfirmationProps {
  route?: {
    params: {
      vehicle: any;
      pickup: any;
      price?: number;
      destination?: string;
    };
  };
  navigation?: any;
  onCancelRide?: (rideDetails: RideDetails) => void;
  onConfirmPickup?: () => void;
  onBack?: () => void;
}

const { height } = Dimensions.get('window');

export const RideConfirmationScreen = ({ route, navigation, onCancelRide, onConfirmPickup, onBack }: RideConfirmationProps) => {
  const vehicle = route?.params?.vehicle || { name: 'Auto', baseFare: 0, image: require('../assets/vehicles/auto.jpg') };
  const pickup = route?.params?.pickup || { title: 'Pickup Location', latitude: 0, longitude: 0, fare: 0 };
  const price = route?.params?.price;
  const destination = route?.params?.destination || 'Destination';

  const [boostAmount, setBoostAmount] = useState(0);
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  // Driver assignment state: 0 = Searching, 1 = Found, 2 = Assigned
  const [assignmentState, setAssignmentState] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    // Pop up animation for the status card
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // 1. Progress bar animation for "Searching"
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // 2. Transition to "Driver Found"
    const timer1 = setTimeout(() => {
      setAssignmentState(1);

      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    }, 3000);

    // 3. Transition to "Driver Assigned"
    const timer2 = setTimeout(() => {
      setAssignmentState(2);

      // Automatically disappear after 2.5 seconds of showing assigned
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: -50,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }, 2500);
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [progressAnim]);

  const totalFare = (price !== undefined ? price : (pickup.fare || 105)) + boostAmount;

  const handleTripDetails = () => {
    setIsSheetVisible(true);
  };

  const handleCloseSheet = () => {
    setIsSheetVisible(false);
  };

  const handleCancel = () => {
    setIsSheetVisible(false);
    const rideDetails: RideDetails = {
      vehicle,
      pickup,
      destination,
      distance: '5.2 km',
      time: '18 min',
      totalFare,
    };
    if (onCancelRide) {
      onCancelRide(rideDetails);
    } else if (navigation?.navigate) {
      navigation.navigate('CancelRide', { rideDetails });
    }
  };

  const vehicleImageSource = vehicle.image || require('../assets/vehicles/auto.jpg');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          showRoute={true}
          pickupCoord={{ latitude: pickup?.latitude || 17.355, longitude: pickup?.longitude || 78.405 }}
          destCoord={{ latitude: 17.425, longitude: 78.475 }}
          showOneBuddyOverlay={false}
        >
          <Marker
            coordinate={{ latitude: pickup?.latitude || 17.355, longitude: pickup?.longitude || 78.405 }}
            pinColor={COLORS.danger}
            title={pickup?.title || 'Pickup'}
            type="pickup"
          />
          <Marker
            coordinate={{ latitude: 17.425, longitude: 78.475 }}
            title={destination || 'Destination'}
            isDestination={true}
            type="drop"
          />
        </MapView>
      </View>

      {/* Top Status Notification Card */}
      <Animated.View style={[styles.topStatusCard, { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }]}>
        <View style={styles.statusHeaderRow}>
          <View style={styles.statusIconCircle}>
            <Ionicons
              name={assignmentState === 2 ? 'checkmark-done-circle' : 'checkmark-circle'}
              size={24}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              {assignmentState === 0 && 'Searching for Drivers…'}
              {assignmentState === 1 && 'Driver Found!'}
              {assignmentState === 2 && 'Ride Booked Successfully'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {assignmentState === 0 && 'Connecting with nearby partners'}
              {assignmentState === 1 && 'Assigning vehicle to your pickup'}
              {assignmentState === 2 && 'Driver is arriving in 3 mins'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <View style={styles.fareRow}>
          <View>
            <Text style={styles.totalFareLabel}>Total Fare</Text>
            <Text style={styles.totalFareAmount}>₹{totalFare}</Text>
          </View>
          <TouchableOpacity style={styles.detailsButton} onPress={handleTripDetails}>
            <Text style={styles.detailsButtonText}>Trip Details</Text>
          </TouchableOpacity>
        </View>

        <FareBoostChips
          boostAmount={boostAmount}
          onSelectBoost={setBoostAmount}
        />

        {/* Confirm Pickup → Live Tracking */}
        <TouchableOpacity
          style={styles.confirmPickupBtn}
          onPress={() => {
            if (onConfirmPickup) {
              onConfirmPickup();
            } else if (navigation?.navigate) {
              navigation.navigate('LiveTracking');
            }
          }}
        >
          <Text style={styles.confirmPickupText}>✓  Confirm Pickup</Text>
        </TouchableOpacity>
      </View>

      {/* Trip Details Modal / Sheet */}
      <Modal
        visible={isSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseSheet}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismissArea} onPress={handleCloseSheet} />
          <View style={styles.sheetContent}>
            <View style={styles.dragHandle} />
            <Text style={styles.sheetTitle}>Trip Details</Text>

            <View style={styles.vehicleInfo}>
              <View style={styles.vehicleLeftRow}>
                <View style={styles.iconContainer}>
                  <Image source={vehicleImageSource} style={styles.vehicleImageSmall} resizeMode="contain" />
                </View>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
              </View>
              <Text style={styles.vehicleFareAmount}>₹{totalFare}</Text>
            </View>

            <View style={styles.locationContainer}>
              <View style={styles.locationRow}>
                <View style={[styles.dot, { borderRadius: 2, backgroundColor: COLORS.danger }]} />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationValue}>{pickup.title}</Text>
                </View>
              </View>
              <View style={styles.locationLine} />
              <View style={styles.locationRow}>
                <View style={[styles.dot, { borderRadius: 6, backgroundColor: COLORS.success }]} />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>Destination</Text>
                  <Text style={styles.locationValue}>{destination}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>5.2 km</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Time</Text>
                <Text style={styles.statValue}>18 min</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Fare</Text>
                <Text style={styles.statValue}>₹{totalFare}</Text>
              </View>
            </View>

            <View style={styles.sheetButtons}>
              <TouchableOpacity
                style={[styles.sheetButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel Ride</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetButton, styles.backButton]}
                onPress={handleCloseSheet}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  confirmPickupBtn: {
    marginTop: 14,
    marginHorizontal: 2,
    height: 54,
    borderRadius: 28,
    backgroundColor: '#54B713',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#54B713',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmPickupText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FCF7',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topStatusCard: {
    position: 'absolute',
    top: 10,
    left: SIZES.medium,
    right: SIZES.medium,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: SIZES.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#D3ECD0',
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF7E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  bottomSection: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.medium,
  },
  totalFareLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  totalFareAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  detailsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SIZES.large,
    paddingBottom: SIZES.large + 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.large,
    textAlign: 'center',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.large,
  },
  vehicleLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.medium,
  },
  vehicleImageSmall: {
    width: 42,
    height: 42,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  vehicleFareAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  locationContainer: {
    marginBottom: SIZES.large,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SIZES.medium,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  locationValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border,
    marginLeft: 4,
    marginVertical: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.secondary,
    padding: SIZES.medium,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.large,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sheetButtons: {
    flexDirection: 'row',
    gap: SIZES.small,
    marginTop: SIZES.medium,
  },
  sheetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: COLORS.secondary,
  },
  backButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  cancelButtonText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RideConfirmationScreen;
