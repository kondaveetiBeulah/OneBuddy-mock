import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  PanResponder,
} from 'react-native';
import { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coordinates, DestinationItem } from '../types';
import { INITIAL_DESTINATIONS, INITIAL_SAVED_PLACES } from '../data';
import { MapView, Marker } from '../components/MockMap';
import { PickupSelectionScreen } from './PickupSelectionScreen';
import { SetPriceScreen } from './SetPriceScreen';
import { RideConfirmationScreen } from './RideConfirmationScreen';
import LiveTrackingScreen from './LiveTrackingScreen';
import { CancelRideScreen } from './CancelRideScreen';
import FeedbackScreen from './FeedbackScreen';
import { RideAssigningScreen } from './RideAssigningScreen';
import { useRideTheme } from '../theme';

const RECENT_DESTINATIONS_KEY = '@onebuddy_recent_destinations';

const DEFAULT_REGION: Region = {
  latitude: 17.4483,
  longitude: 78.3915,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

type VehicleKind = 'bike' | 'auto' | 'mini' | 'xl4' | 'xl7' | 'premier';

const VEHICLE_IMAGES: Record<VehicleKind, ReturnType<typeof require>> = {
  bike:    require('../assets/vehicles/bike.png'),
  auto:    require('../assets/vehicles/auto.png'),
  mini:    require('../assets/vehicles/car.png'),
  xl4:     require('../assets/vehicles/car.png'),
  xl7:     require('../assets/vehicles/xl7.png'),
  premier: require('../assets/vehicles/car.png'),
};

function VehicleThumbnail({ kind }: { kind: VehicleKind }) {
  return (
    <View style={styles.vehicleImage}>
      <Image
        source={VEHICLE_IMAGES[kind]}
        style={styles.vehicleImagePhoto}
        resizeMode="contain"
      />
    </View>
  );
}

// ── Booking step state machine ──────────────────────────────────────────────
type BookingStep = 'none' | 'pickup' | 'assigning' | 'set_price' | 'confirmation' | 'tracking' | 'cancel' | 'feedback';

export default function RideScreen({
  homeResetKey,
  activeTrip,
  setActiveTrip,
  setIsTrackingActive,
  openTrackingTrigger,
  onExit,
  isDark: isDarkProp,
}: {
  homeResetKey?: number;
  activeTrip?: any;
  setActiveTrip?: (trip: any) => void;
  setIsTrackingActive?: (active: boolean) => void;
  openTrackingTrigger?: number;
  onExit?: () => void;
  isDark?: boolean;
} = {}) {
  const theme = useRideTheme();
  const isDark = isDarkProp ?? theme.isDark;
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  ) + 10;
  const searchInputRef = useRef<TextInput | null>(null);

  // ── Booking flow ────────────────────────────────────────────────────────
  const [bookingStep, setBookingStep] = useState<BookingStep>('none');
  const [bookingData, setBookingData] = useState<any>({});
  const [activeMinimizedTrip, setActiveMinimizedTrip] = useState<any>(null);
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  const [region, setRegion] = useState<Region | null>(null);
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [pickupAddress, setPickupAddress] = useState<string>('Finding your location…');
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [destinations, setDestinations] = useState<DestinationItem[]>(INITIAL_DESTINATIONS);
  const [selectedDestination, setSelectedDestination] = useState<DestinationItem | null>(null);
  const [showRideOptions, setShowRideOptions] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleKind>('bike');
  const [stops, setStops] = useState<string[]>([]);
  const [addingStop, setAddingStop] = useState(false);
  const [stopQuery, setStopQuery] = useState('');
  const [rideFor, setRideFor] = useState('For me');
  const [showRideForMenu, setShowRideForMenu] = useState(false);
  const [showPickupEditor, setShowPickupEditor] = useState(false);
  const [pickupInput, setPickupInput] = useState('');
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const [showRideDetails, setShowRideDetails] = useState(false);
  const [rideType, setRideType] = useState<'normal' | 'schedule' | 'smart'>('normal');
  const [scheduleTimings, setScheduleTimings] = useState<string[]>([
    'Today, 6:00 PM',
    'Tomorrow, 9:00 AM',
    'Tomorrow, 6:00 PM',
  ]);
  const [scheduledTime, setScheduledTime] = useState('Today, 6:00 PM');
  const [customSchedule, setCustomSchedule] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [mapZoom, setMapZoom] = useState(1);
  const mapZoomRef = useRef(1);
  const mapZoomStart = useRef(1);

  const [editingTimingIndex, setEditingTimingIndex] = useState<number | null>(null);
  const [editingTimingText, setEditingTimingText] = useState<string>('');

  const isTripActive = Boolean(activeTrip || activeMinimizedTrip);

  const notifyActiveTrip = useCallback(() => {
    Alert.alert(
      'Active Ride in Progress',
      'You already have an ongoing ride. Please track or cancel your active ride before booking a new one.',
      [
        {
          text: 'View Live Ride',
          onPress: () => {
            const trip = activeTrip || activeMinimizedTrip;
            if (trip) {
              setBookingData(trip);
              setBookingStep('tracking');
              setIsTrackingActive?.(true);
              setShowRideOptions(false);
              setSelectedDestination(null);
              setSearchMode(false);
            }
          },
        },
        { text: 'OK', style: 'cancel' },
      ]
    );
  }, [activeTrip, activeMinimizedTrip, setIsTrackingActive]);

  const handleDeleteTiming = useCallback((timeToDelete: string, e?: any) => {
    e?.stopPropagation?.();
    setScheduleTimings((prev) => {
      const filtered = prev.filter((t) => t !== timeToDelete);
      if (scheduledTime === timeToDelete) {
        setScheduledTime(filtered[0] || '');
      }
      return filtered;
    });
  }, [scheduledTime]);

  const handleCloseSchedulePanel = useCallback(() => {
    setRideType('normal');
    setEditingTimingIndex(null);
    setEditingTimingText('');
  }, []);

  const startEditingTiming = useCallback((index: number, currentText: string, e?: any) => {
    e?.stopPropagation?.();
    setEditingTimingIndex(index);
    setEditingTimingText(currentText);
  }, []);

  const saveEditingTiming = useCallback((index: number) => {
    const trimmed = editingTimingText.trim();
    if (trimmed) {
      setScheduleTimings((prev) => {
        const updated = [...prev];
        const oldTime = updated[index];
        updated[index] = trimmed;
        if (scheduledTime === oldTime) {
          setScheduledTime(trimmed);
        }
        return updated;
      });
    }
    setEditingTimingIndex(null);
    setEditingTimingText('');
  }, [editingTimingText, scheduledTime]);

  const cancelEditingTiming = useCallback(() => {
    setEditingTimingIndex(null);
    setEditingTimingText('');
  }, []);

  // ── Load saved recent destinations from AsyncStorage on mount ─────────────
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_DESTINATIONS_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDestinations(parsed);
          }
        }
      } catch (e) {
        console.warn('Failed to load recent destinations from storage:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveDestinationToRecent = useCallback((item: DestinationItem) => {
    setDestinations((prev) => {
      const existingFiltered = prev.filter(
        (d) => d.title.trim().toLowerCase() !== item.title.trim().toLowerCase()
      );
      const updated = [item, ...existingFiltered].slice(0, 15);
      AsyncStorage.setItem(RECENT_DESTINATIONS_KEY, JSON.stringify(updated)).catch((err) =>
        console.warn('Failed to persist recent destinations:', err)
      );
      return updated;
    });
  }, []);

  const backSwipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        searchMode && gestureState.dx > 12 && Math.abs(gestureState.dy) < 30,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 80) {
          setSearchMode(false);
          setSelectedDestination(null);
          setSearchQuery('');
        }
      },
    })
  ).current;

  const mapZoomResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.numberActiveTouches >= 2,
      onPanResponderGrant: () => {
        mapZoomStart.current = mapZoomRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const pinchChange = Math.max(-1, Math.min(1, gestureState.dy / 120));
        setMapZoom(Math.max(1, Math.min(3, mapZoomStart.current - pinchChange)));
      },
    })
  ).current;

  useEffect(() => {
    mapZoomRef.current = mapZoom;
  }, [mapZoom]);

  // When parent triggers opening the active trip (e.g. tapping banner)
  useEffect(() => {
    if (openTrackingTrigger && (activeTrip || activeMinimizedTrip)) {
      const trip = activeTrip || activeMinimizedTrip;
      setBookingData(trip);
      setBookingStep('tracking');
      setIsTrackingActive?.(true);
      setShowRideOptions(false);
      setSelectedDestination(null);
      setSearchMode(false);
    }
  }, [openTrackingTrigger, activeTrip, activeMinimizedTrip, setIsTrackingActive]);

  // ── Home tab reset: minimize ongoing trip and return to home screen ──────
  const isFirstHomeMount = useRef(true);
  useEffect(() => {
    if (isFirstHomeMount.current) {
      isFirstHomeMount.current = false;
      return;
    }
    // If a trip is in progress, minimize it so the banner appears
    if (bookingStep === 'tracking' && bookingData) {
      setActiveMinimizedTrip(bookingData);
      setActiveTrip?.(bookingData);
    }
    setIsTrackingActive?.(false);
    // Always reset booking flow to home
    setBookingStep('none');
    setShowRideOptions(false);
    setSelectedDestination(null);
    setSearchQuery('');
    setSearchMode(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeResetKey]);

  // Unified back handler for RideScreen: handles all sub-steps and modals in order
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      // 1. Close open modal sheets first
      if (showPickupEditor) {
        setShowPickupEditor(false);
        return true;
      }
      if (showSavedAddresses) {
        setShowSavedAddresses(false);
        return true;
      }
      if (showRideDetails) {
        setShowRideDetails(false);
        return true;
      }
      if (showRideForMenu) {
        setShowRideForMenu(false);
        return true;
      }
      if (addingStop) {
        setAddingStop(false);
        return true;
      }

      // 2. Results / Choose a ride screen -> return to search mode
      if (showRideOptions) {
        setShowRideOptions(false);
        setSearchMode(true);
        return true;
      }

      // 3. Search / Where to screen -> return to main map view
      if (searchMode) {
        setSearchMode(false);
        setSelectedDestination(null);
        setSearchQuery('');
        return true;
      }

      // 4. Booking sub-steps
      if (bookingStep === 'pickup') {
        setBookingStep('none');
        setShowRideOptions(true);
        return true;
      }
      if (bookingStep === 'assigning') {
        setBookingStep('pickup');
        return true;
      }
      if (bookingStep === 'tracking') {
        setBookingStep('none');
        return true;
      }
      if (bookingStep === 'feedback') {
        setBookingStep('none');
        return true;
      }

      // 5. At the root map screen: go back to OneBuddy home
      if (bookingStep === 'none') {
        if (onExit) {
          onExit();
          return true;
        }
      }

      return false;
    });

    return () => subscription.remove();
  }, [
    showPickupEditor,
    showSavedAddresses,
    showRideDetails,
    showRideForMenu,
    addingStop,
    showRideOptions,
    searchMode,
    bookingStep,
    onExit,
  ]);

  useEffect(() => {
    let isMounted = true;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setLocationError('Location permission denied');
            setRegion(DEFAULT_REGION);
            setLocationLoading(false);
          }
          Alert.alert(
            'Location permission needed',
            'Please enable location access so we can find your pickup point.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }

        const initialPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (!isMounted) return;

        const coords: Coordinates = {
          latitude: initialPosition.coords.latitude,
          longitude: initialPosition.coords.longitude,
        };

        setPickupCoords(coords);
        setRegion({ ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 });
        setLocationLoading(false);
        reverseGeocode(coords);

        watchSubscription.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 5 },
          (position) => {
            if (!isMounted) return;
            setPickupCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
        );
      } catch (err) {
        console.warn('Location error:', err);
        if (isMounted) {
          setLocationError('Could not fetch location');
          setRegion(DEFAULT_REGION);
          setLocationLoading(false);
        }
      }
    };

    startLocationTracking();

    return () => {
      isMounted = false;
      watchSubscription.current?.remove();
    };
  }, []);

  const reverseGeocode = useCallback(async (coords: Coordinates) => {
    try {
      const results = await Location.reverseGeocodeAsync(coords);
      if (results.length > 0) {
        const place = results[0];
        const parts = [place.name, place.street, place.district, place.city].filter(Boolean);
        setPickupAddress(parts.join(', ') || 'Current location');
      } else {
        setPickupAddress('Current location');
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
      setPickupAddress('Current location');
    }
  }, []);

  const handleRecenter = useCallback(() => {
    setLocationError(null);
    setMapZoom(2);
  }, []);

  const zoomIn = useCallback(() => {
    setMapZoom((currentZoom) => Math.min(3, Number((currentZoom + 0.5).toFixed(1))));
  }, []);

  const zoomOut = useCallback(() => {
    setMapZoom((currentZoom) => Math.max(1, Number((currentZoom - 0.5).toFixed(1))));
  }, []);

  useEffect(() => {
    if (searchMode) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [searchMode]);


  const openSearch = useCallback(() => {
    if (isTripActive) {
      notifyActiveTrip();
      return;
    }
    setSearchMode(true);
  }, [isTripActive, notifyActiveTrip]);

  const toggleFavorite = useCallback((id: string) => {
    setDestinations((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item));
      AsyncStorage.setItem(RECENT_DESTINATIONS_KEY, JSON.stringify(updated)).catch((err) =>
        console.warn('Failed to persist favorite toggle:', err)
      );
      return updated;
    });
  }, []);

  const handleSelectDestination = useCallback((item: DestinationItem) => {
    if (isTripActive) {
      notifyActiveTrip();
      return;
    }
    setSearchQuery(item.title);
    setSelectedDestination(item);
    saveDestinationToRecent(item);
    setSearchMode(false);
    setShowRideOptions(true);
  }, [isTripActive, notifyActiveTrip, saveDestinationToRecent]);

  const openRideResults = useCallback(() => {
    if (isTripActive) {
      notifyActiveTrip();
      return;
    }
    const query = searchQuery.trim();
    if (!query) return;
    const matchingDestination = destinations.find(
      (item) => item.title.toLowerCase() === query.toLowerCase()
    );
    const destToUse: DestinationItem = matchingDestination || {
      id: `custom-${Date.now()}`,
      title: query,
      subtitle: 'Entered destination',
      favorite: false,
    };
    setSelectedDestination(destToUse);
    saveDestinationToRecent(destToUse);
    setSearchMode(false);
    setShowRideOptions(true);
  }, [isTripActive, notifyActiveTrip, destinations, searchQuery, saveDestinationToRecent]);

  const canOpenRideResults = searchQuery.trim().length > 0;

  const handleSelectSavedAddress = useCallback((address: string) => {
    if (isTripActive) {
      notifyActiveTrip();
      return;
    }
    setSearchQuery(address);
    const destToUse: DestinationItem = {
      id: `saved-${Date.now()}`,
      title: address,
      subtitle: 'Saved address',
      favorite: false,
    };
    setSelectedDestination(destToUse);
    saveDestinationToRecent(destToUse);
    setShowSavedAddresses(false);
    setSearchMode(false);
    setShowRideOptions(true);
  }, [isTripActive, notifyActiveTrip, saveDestinationToRecent]);

  const selectPickup = useCallback((address: string) => {
    setPickupAddress(address);
    setPickupInput(address);
    setShowPickupEditor(false);
  }, []);

  const addStop = useCallback(() => {
    const value = stopQuery.trim();
    if (!value) return;
    setStops((previous) => [...previous, value]);
    setStopQuery('');
    setAddingStop(false);
  }, [stopQuery]);

  const filteredDestinations = destinations.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
  });

  // ── Booking-flow handler ────────────────────────────────────────────────
  const handleStartBooking = useCallback(() => {
    if (isTripActive) {
      notifyActiveTrip();
      return;
    }
    const vehicleMap: Record<
      string,
      {
        name: string;
        baseFare: number;
        image: any;
        type: 'bike' | 'auto' | 'cab';
        driverName: string;
        plate: string;
        model: string;
      }
    > = {
      bike: {
        name: 'Bike Saver',
        baseFare: 49,
        image: require('../assets/vehicles/bike.png'),
        type: 'bike',
        driverName: 'Ramesh Kumar',
        plate: 'TS 09 BK 2041',
        model: 'Hero Splendor Plus',
      },
      auto: {
        name: 'Auto',
        baseFare: 89,
        image: require('../assets/vehicles/auto.png'),
        type: 'auto',
        driverName: 'Sai Krishna',
        plate: 'AP 16 TG 6843',
        model: 'Bajaj RE Compact Auto',
      },
      mini: {
        name: 'Go Mini (Cab)',
        baseFare: 139,
        image: require('../assets/vehicles/car.png'),
        type: 'cab',
        driverName: 'Karthik Rao',
        plate: 'TS 08 AB 1102',
        model: 'Maruti Suzuki WagonR',
      },
      xl4: {
        name: 'Prime Sedan (Cab)',
        baseFare: 178,
        image: require('../assets/vehicles/car.png'),
        type: 'cab',
        driverName: 'Aarav Sharma',
        plate: 'TS 09 EA 4821',
        model: 'Maruti Suzuki Dzire',
      },
      xl7: {
        name: 'Prime SUV (7 Seater)',
        baseFare: 248,
        image: require('../assets/vehicles/xl7.png'),
        type: 'cab',
        driverName: 'Vikram Singh',
        plate: 'TS 07 HY 9912',
        model: 'Toyota Innova Crysta',
      },
      premier: {
        name: 'Premier Luxury (Cab)',
        baseFare: 299,
        image: require('../assets/vehicles/car.png'),
        type: 'cab',
        driverName: 'Sanjay Reddy',
        plate: 'TS 09 LX 0077',
        model: 'Honda City ZX',
      },
    };
    const vehicle = vehicleMap[selectedVehicle] || vehicleMap.auto;
    const pickup = pickupCoords
      ? { id: '1', title: pickupAddress || '1373, Madhapur, Hyderabad', subtitle: 'Your location', latitude: pickupCoords.latitude, longitude: pickupCoords.longitude, fare: vehicle.baseFare }
      : { id: '1', title: pickupAddress || '1373, Madhapur, Hyderabad', subtitle: 'Your location', latitude: 17.4483, longitude: 78.3915, fare: vehicle.baseFare };
    setBookingData({ vehicle, pickup, destination: selectedDestination?.title || 'Destination', price: vehicle.baseFare });
    setBookingStep('pickup');
  }, [selectedVehicle, pickupCoords, pickupAddress, selectedDestination]);

  // ── Booking-flow screen renders ──────────────────────────────────────────
  if (bookingStep === 'pickup') {
    return (
      <PickupSelectionScreen
        route={{ params: { vehicle: bookingData.vehicle, pickup: bookingData.pickup, destination: bookingData.destination } }}
        isDark={isDark}
        onConfirmPickup={({ vehicle, pickup, destination }) => {
          const newBooking = { ...bookingData, vehicle, pickup, destination };
          setBookingData(newBooking);
          setBookingStep('assigning');
        }}
        onBack={() => {
          setBookingStep('none');
          setShowRideOptions(true);
        }}
      />
    );
  }

  if (bookingStep === 'assigning') {
    return (
      <RideAssigningScreen
        route={{
          params: {
            vehicle: bookingData.vehicle,
            pickup: bookingData.pickup,
            destination: bookingData.destination,
            price: bookingData.price,
          },
        }}
        isDark={isDark}
        onDriverAssigned={(assignedData) => {
          const rawType = (
            assignedData.vehicle?.type ||
            assignedData.vehicle?.id ||
            selectedVehicle ||
            'auto'
          ).toLowerCase();
          const rideType: 'auto' | 'cab' | 'bike' =
            rawType === 'bike' || rawType === 'scooter'
              ? 'bike'
              : rawType === 'auto'
              ? 'auto'
              : 'cab';
          const newBooking = { ...bookingData, ...assignedData, rideType };
          setBookingData(newBooking);
          setActiveMinimizedTrip(newBooking);
          setActiveTrip?.(newBooking);
          setIsTrackingActive?.(true);
          setBookingStep('tracking');
        }}
        onBack={() => {
          setBookingStep('pickup');
        }}
        onCancelRide={() => {
          setActiveMinimizedTrip(null);
          setActiveTrip?.(null);
          setIsTrackingActive?.(false);
          setBookingStep('none');
          setShowRideOptions(false);
          setSelectedDestination(null);
          setSearchQuery('');
        }}
      />
    );
  }

  if (bookingStep === 'tracking') {
    const currentTripData = (bookingData && Object.keys(bookingData).length > 0) ? bookingData : (activeTrip || {});
    const rawTripType = (
      currentTripData.rideType ||
      currentTripData.vehicle?.type ||
      currentTripData.vehicle?.id ||
      selectedVehicle ||
      'auto'
    ).toLowerCase();
    const rideType: 'auto' | 'cab' | 'bike' =
      rawTripType === 'bike' || rawTripType === 'scooter'
        ? 'bike'
        : rawTripType === 'auto'
        ? 'auto'
        : 'cab';
    const vehicleInfo = currentTripData.vehicle || {};
    return (
      <LiveTrackingScreen
        isDark={isDark}
        showBookingNotifications={false}
        initialRideType={rideType}
        customRideDetails={{
          pickupSpotName: currentTripData.pickup?.title || '1373, Madhapur, Hyderabad',
          pickupAddress: currentTripData.pickup?.subtitle || currentTripData.pickup?.description || 'VIP Hills, Jaihind Enclave',
          dropSpotName: currentTripData.destination || selectedDestination?.title || 'Destination',
          dropAddress: selectedDestination?.subtitle || currentTripData.destination || 'Hyderabad, Telangana',
          fare: currentTripData.price ? `₹${currentTripData.price}` : (vehicleInfo.baseFare ? `₹${vehicleInfo.baseFare}` : '₹89'),
          driver: {
            name: vehicleInfo.driverName || (rideType === 'bike' ? 'Ramesh Kumar' : rideType === 'cab' ? 'Aarav Sharma' : 'Sai Krishna'),
            vehiclePlate: vehicleInfo.plate || (rideType === 'bike' ? 'TS 09 BK 2041' : rideType === 'cab' ? 'TS 09 EA 4821' : 'AP 16 TG 6843'),
            vehicleModel: vehicleInfo.model || (rideType === 'bike' ? 'Hero Splendor Plus' : rideType === 'cab' ? 'Maruti Suzuki Dzire' : 'Bajaj RE Compact Auto'),
            avatar: vehicleInfo.driverName ? vehicleInfo.driverName[0] : 'S',
            phone: '+91 98765 43210',
            rating: 4.9,
            completedRides: 1240,
          },
        }}
        onBack={() => {
          setActiveMinimizedTrip(currentTripData);
          setActiveTrip?.(currentTripData);
          setBookingStep('pickup');
        }}
        onCancelRide={() => {
          setActiveMinimizedTrip(null);
          setActiveTrip?.(null);
          setIsTrackingActive?.(false);
          setBookingStep('none');
          setShowRideOptions(false);
          setSelectedDestination(null);
          setSearchQuery('');
        }}
        onRideCompleted={() => {
          setBookingStep('feedback');
        }}
      />
    );
  }

  if (bookingStep === 'feedback') {
    const currentTripData = (bookingData && Object.keys(bookingData).length > 0) ? bookingData : (activeTrip || {});
    const vehicleInfo = currentTripData.vehicle || {};
    const rawTripType = (
      currentTripData.rideType ||
      vehicleInfo.type ||
      vehicleInfo.id ||
      selectedVehicle ||
      'auto'
    ).toLowerCase();
    const rideType: 'auto' | 'cab' | 'bike' =
      rawTripType === 'bike' || rawTripType === 'scooter'
        ? 'bike'
        : rawTripType === 'auto'
        ? 'auto'
        : 'cab';
    const accuratePrice = currentTripData.price !== undefined && currentTripData.price !== null
      ? Number(currentTripData.price)
      : (vehicleInfo.baseFare ? Number(vehicleInfo.baseFare) : (rideType === 'bike' ? 49 : rideType === 'cab' ? 178 : 89));

    return (
      <FeedbackScreen
        ride={{
          riderName: vehicleInfo.driverName || (rideType === 'bike' ? 'Ramesh Kumar' : rideType === 'cab' ? 'Aarav Sharma' : 'Sai Krishna'),
          vehicleNumber: vehicleInfo.plate || (rideType === 'bike' ? 'TS 09 BK 2041' : rideType === 'cab' ? 'TS 09 EA 4821' : 'AP 16 TG 6843'),
          vehicleType: vehicleInfo.name || (rideType === 'bike' ? 'Bike Saver' : rideType === 'cab' ? 'Prime Sedan (Cab)' : 'Auto'),
          pickup: currentTripData.pickup?.title || currentTripData.pickup?.subtitle || '1373, Madhapur, Hyderabad',
          dropOff: currentTripData.destination || 'Ammerpet, Hyderabad',
          amount: accuratePrice,
          fare: `₹${accuratePrice}`,
          distance: '6.8 km',
          duration: '10 sec',
        }}
        isDark={isDark}
        onDone={() => {
          setActiveMinimizedTrip(null);
          setActiveTrip?.(null);
          setIsTrackingActive?.(false);
          setBookingStep('none');
          setShowRideOptions(false);
          setSelectedDestination(null);
          setSearchQuery('');
        }}
        onClose={() => {
          setActiveMinimizedTrip(null);
          setActiveTrip?.(null);
          setIsTrackingActive?.(false);
          setBookingStep('none');
          setShowRideOptions(false);
          setSelectedDestination(null);
          setSearchQuery('');
        }}
      />
    );
  }

  if (bookingStep === 'cancel' && bookingData.rideDetails) {
    return (
      <CancelRideScreen
        route={{ params: { rideDetails: bookingData.rideDetails } }}
        isDark={isDark}
        onCancelComplete={() => {
          setActiveMinimizedTrip(null);
          setActiveTrip?.(null);
          setIsTrackingActive?.(false);
          setBookingStep('none');
          setShowRideOptions(false);
        }}
        onKeepSearching={() => setBookingStep('confirmation')}
      />
    );
  }

  if (showRideOptions && selectedDestination) {
    const pickupCoord = {
      latitude: 17.368,
      longitude: 78.485,
    };
    const dropCoord = {
      latitude: 17.382,
      longitude: 78.498,
    };

    return (
      <View style={[styles.resultsScreen, isDark && { backgroundColor: '#121214' }]}>
        <View style={styles.resultsMap}>
          <MapView
            style={styles.resultsMapCanvas}
            showRoute={true}
            pickupCoord={pickupCoord}
            destCoord={dropCoord}
            showLandmarks={false}
            showOneBuddyOverlay={false}
          >
            <Marker
              coordinate={pickupCoord}
              title={pickupAddress || 'Kshatriya Foods'}
            />
            <Marker
              coordinate={dropCoord}
              title={selectedDestination.title || 'Bachpan Play School, Chintal'}
              isDestination={true}
            />
          </MapView>

          {/* Clean Floating Back Button */}
          <TouchableOpacity
            style={[
              styles.resultsBackButton,
              { top: safeTop },
              isDark && { backgroundColor: '#1D1E22' },
            ]}
            onPress={() => {
              setShowRideOptions(false);
              setSearchMode(true);
            }}
          >
            <Ionicons name="arrow-back" size={20} color={isDark ? '#F1F1EC' : '#0f172a'} />
          </TouchableOpacity>

          {/* Floating Route Summary Pill */}
          <View
            style={[
              styles.resultsAddressPill,
              { top: safeTop },
              isDark && { backgroundColor: 'rgba(29, 30, 34, 0.95)' },
            ]}
          >
            <View style={styles.resultsAddressRow}>
              <View style={styles.resultsGreenDot} />
              <Text style={[styles.resultsAddressText, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>
                {pickupAddress || 'Current location'}
              </Text>
            </View>
            <View style={[styles.resultsAddressRow, { marginTop: 3 }]}>
              <View style={styles.resultsOrangeDot} />
              <Text style={[styles.resultsAddressText, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>
                {selectedDestination?.title || 'Destination'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.resultsSheet, isDark && { backgroundColor: '#1D1E22' }]}>
          <View style={[styles.sheetHandle, isDark && { backgroundColor: '#3E424B' }]} />
          <View style={styles.resultsSheetHeader}>
            <Text style={[styles.resultsTitle, isDark && { color: '#F1F1EC' }]}>Choose a ride</Text>
            {selectedDestination?.title ? (
              <Text style={[styles.resultsSubtitle, isDark && { color: '#9BA08F' }]} numberOfLines={1}>
                Dropoff: {selectedDestination.title}
              </Text>
            ) : null}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.rideOptionsList}>
            {/* 1. Bike Saver (Lowest Price) */}
            <TouchableOpacity
              style={[
                styles.rideOptionRow,
                isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' },
                selectedVehicle === 'bike' && styles.rideOptionSelected,
                selectedVehicle === 'bike' && isDark && { backgroundColor: 'rgba(84, 183, 19, 0.16)', borderColor: '#54B713' },
              ]}
              onPress={() => setSelectedVehicle('bike')}
            >
              <VehicleThumbnail kind="bike" />
              <View style={styles.rideOptionCopy}>
                <View style={styles.priorityTitleRow}>
                  <Text style={[styles.rideOptionTitle, isDark && { color: '#F1F1EC' }]}>Bike Saver</Text>
                  <Ionicons name="person" size={12} color={isDark ? '#9BA08F' : '#475569'} style={{ marginLeft: 4 }} />
                  <Text style={{ fontSize: 12, color: isDark ? '#9BA08F' : '#475569', fontWeight: '700' }}>1</Text>
                </View>
                <Text style={[styles.rideOptionMeta, isDark && { color: '#9BA08F' }]}>3 mins away · Drop 5:18 PM</Text>
              </View>
              <Text style={[styles.rideFare, isDark && { color: '#F1F1EC' }]}>₹49</Text>
            </TouchableOpacity>

            {/* 2. Auto */}
            <TouchableOpacity
              style={[
                styles.rideOptionRow,
                isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' },
                selectedVehicle === 'auto' && styles.rideOptionSelected,
                selectedVehicle === 'auto' && isDark && { backgroundColor: 'rgba(84, 183, 19, 0.16)', borderColor: '#54B713' },
              ]}
              onPress={() => setSelectedVehicle('auto')}
            >
              <VehicleThumbnail kind="auto" />
              <View style={styles.rideOptionCopy}>
                <View style={styles.priorityTitleRow}>
                  <Text style={[styles.rideOptionTitle, isDark && { color: '#F1F1EC' }]}>Auto</Text>
                  <Ionicons name="person" size={12} color={isDark ? '#9BA08F' : '#475569'} style={{ marginLeft: 4 }} />
                  <Text style={{ fontSize: 12, color: isDark ? '#9BA08F' : '#475569', fontWeight: '700' }}>3</Text>
                </View>
                <Text style={[styles.rideOptionMeta, isDark && { color: '#9BA08F' }]}>4 mins away · Drop 5:21 PM</Text>
              </View>
              <Text style={[styles.rideFare, isDark && { color: '#F1F1EC' }]}>₹89</Text>
            </TouchableOpacity>

            {/* 3. Go Mini (Cab) */}
            <TouchableOpacity
              style={[
                styles.rideOptionRow,
                isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' },
                selectedVehicle === 'mini' && styles.rideOptionSelected,
                selectedVehicle === 'mini' && isDark && { backgroundColor: 'rgba(84, 183, 19, 0.16)', borderColor: '#54B713' },
              ]}
              onPress={() => setSelectedVehicle('mini')}
            >
              <VehicleThumbnail kind="mini" />
              <View style={styles.rideOptionCopy}>
                <View style={styles.priorityTitleRow}>
                  <Text style={[styles.rideOptionTitle, isDark && { color: '#F1F1EC' }]}>Go Mini (Cab)</Text>
                  <Ionicons name="person" size={12} color={isDark ? '#9BA08F' : '#475569'} style={{ marginLeft: 4 }} />
                  <Text style={{ fontSize: 12, color: isDark ? '#9BA08F' : '#475569', fontWeight: '700' }}>4</Text>
                </View>
                <Text style={[styles.rideOptionMeta, isDark && { color: '#9BA08F' }]}>3 mins away · Drop 5:22 PM</Text>
              </View>
              <Text style={[styles.rideFare, isDark && { color: '#F1F1EC' }]}>₹139</Text>
            </TouchableOpacity>

            {/* 4. Prime Sedan (Cab) */}
            <TouchableOpacity
              style={[
                styles.rideOptionRow,
                isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' },
                selectedVehicle === 'xl4' && styles.rideOptionSelected,
                selectedVehicle === 'xl4' && isDark && { backgroundColor: 'rgba(84, 183, 19, 0.16)', borderColor: '#54B713' },
              ]}
              onPress={() => setSelectedVehicle('xl4')}
            >
              <VehicleThumbnail kind="xl4" />
              <View style={styles.rideOptionCopy}>
                <View style={styles.priorityTitleRow}>
                  <Text style={[styles.rideOptionTitle, isDark && { color: '#F1F1EC' }]}>Prime Sedan (Cab)</Text>
                  <Ionicons name="person" size={12} color={isDark ? '#9BA08F' : '#475569'} style={{ marginLeft: 4 }} />
                  <Text style={{ fontSize: 12, color: isDark ? '#9BA08F' : '#475569', fontWeight: '700' }}>4</Text>
                </View>
                <Text style={[styles.rideOptionMeta, isDark && { color: '#9BA08F' }]}>3 mins away · Drop 5:23 PM</Text>
              </View>
              <Text style={[styles.rideFare, isDark && { color: '#F1F1EC' }]}>₹178</Text>
            </TouchableOpacity>

            {/* 5. Prime SUV (7 Seater) */}
            <TouchableOpacity
              style={[
                styles.rideOptionRow,
                isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' },
                selectedVehicle === 'xl7' && styles.rideOptionSelected,
                selectedVehicle === 'xl7' && isDark && { backgroundColor: 'rgba(84, 183, 19, 0.16)', borderColor: '#54B713' },
              ]}
              onPress={() => setSelectedVehicle('xl7')}
            >
              <VehicleThumbnail kind="xl7" />
              <View style={styles.rideOptionCopy}>
                <View style={styles.priorityTitleRow}>
                  <Text style={[styles.rideOptionTitle, isDark && { color: '#F1F1EC' }]}>Prime SUV (7 Seater)</Text>
                  <Ionicons name="person" size={12} color={isDark ? '#9BA08F' : '#475569'} style={{ marginLeft: 4 }} />
                  <Text style={{ fontSize: 12, color: isDark ? '#9BA08F' : '#475569', fontWeight: '700' }}>6</Text>
                </View>
                <Text style={[styles.rideOptionMeta, isDark && { color: '#9BA08F' }]}>5 mins away · Drop 5:25 PM</Text>
              </View>
              <Text style={[styles.rideFare, isDark && { color: '#F1F1EC' }]}>₹248</Text>
            </TouchableOpacity>

            {/* 6. Premier Luxury (Cab) */}
            <TouchableOpacity
              style={[
                styles.rideOptionRow,
                isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' },
                selectedVehicle === 'premier' && styles.rideOptionSelected,
                selectedVehicle === 'premier' && isDark && { backgroundColor: 'rgba(84, 183, 19, 0.16)', borderColor: '#54B713' },
              ]}
              onPress={() => setSelectedVehicle('premier')}
            >
              <VehicleThumbnail kind="premier" />
              <View style={styles.rideOptionCopy}>
                <View style={styles.priorityTitleRow}>
                  <Text style={[styles.rideOptionTitle, isDark && { color: '#F1F1EC' }]}>Premier Luxury (Cab)</Text>
                  <Ionicons name="person" size={12} color={isDark ? '#9BA08F' : '#475569'} style={{ marginLeft: 4 }} />
                  <Text style={{ fontSize: 12, color: isDark ? '#9BA08F' : '#475569', fontWeight: '700' }}>4</Text>
                </View>
                <Text style={[styles.rideOptionMeta, isDark && { color: '#9BA08F' }]}>4 mins away · Drop 5:25 PM</Text>
              </View>
              <Text style={[styles.rideFare, isDark && { color: '#F1F1EC' }]}>₹299</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={[styles.bookingFooter, isDark && { backgroundColor: '#1D1E22' }]}>
            <TouchableOpacity style={styles.bookButton} onPress={handleStartBooking}>
              <Text style={styles.bookButtonText}>
                Choose {
                  selectedVehicle === 'bike' ? 'Bike Saver' :
                  selectedVehicle === 'auto' ? 'Auto' :
                  selectedVehicle === 'mini' ? 'Go Mini' :
                  selectedVehicle === 'xl4' ? 'Prime Sedan' :
                  selectedVehicle === 'xl7' ? 'Prime SUV' :
                  'Premier Luxury'
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (searchMode) {
    return (
      <View style={[styles.searchScreen, isDark && { backgroundColor: '#121214' }]} {...backSwipeResponder.panHandlers}>
        <View style={[styles.searchHeader, { paddingTop: safeTop + 4 }]}>
          <TouchableOpacity
            onPress={() => {
              setSearchMode(false);
              setSelectedDestination(null);
              setSearchQuery('');
            }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#F1F1EC' : '#0f172a'} />
          </TouchableOpacity>
          <Text style={[styles.searchTitle, isDark && { color: '#F1F1EC' }]}>Where to?</Text>
          <TouchableOpacity
            style={[styles.forMeButton, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.12)' }]}
            onPress={() => setShowRideForMenu(true)}
          >
            <Text style={[styles.forMeText, isDark && { color: '#F1F1EC' }]}>{rideFor}</Text>
            <Ionicons name="chevron-down" size={18} color={isDark ? '#F1F1EC' : '#0f172a'} />
          </TouchableOpacity>
        </View>

        {showRideForMenu && (
          <Modal visible transparent animationType="slide" onRequestClose={() => setShowRideForMenu(false)}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalCard, isDark && { backgroundColor: '#1D1E22' }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, isDark && { color: '#F1F1EC' }]}>Who is this ride for?</Text>
                  <TouchableOpacity onPress={() => setShowRideForMenu(false)}>
                    <Ionicons name="close" size={24} color={isDark ? '#F1F1EC' : '#334155'} />
                  </TouchableOpacity>
                </View>
                {['For me', 'Someone else', 'Business'].map((option) => (
                  <TouchableOpacity key={option} style={styles.rideForOption} onPress={() => { setRideFor(option); setShowRideForMenu(false); }}>
                    <Text style={[styles.rideForOptionText, isDark && { color: '#F1F1EC' }]}>{option}</Text>
                    {rideFor === option && <Ionicons name="checkmark-circle" size={21} color="#54B713" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Modal>
        )}

        <View style={[styles.routeCard, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
          {/* Pickup row */}
          <TouchableOpacity
            style={styles.routeInputRow}
            onPress={() => { setPickupInput(pickupAddress); setShowPickupEditor(true); }}
            activeOpacity={0.75}
          >
            <View style={styles.dotColumn}>
              <View style={styles.pickupDotNew} />
              <View style={[styles.routeConnector, isDark && { borderColor: '#3E424B' }]} />
            </View>
            <View style={styles.routeInputField}>
              <Text style={[styles.routeInputLabel, isDark && { color: '#9BA08F' }]}>PICKUP</Text>
              <Text style={[styles.routeInputValue, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>{pickupAddress || '1373, Madhapur, Hyderabad'}</Text>
            </View>
          </TouchableOpacity>
          <View style={[styles.routeInputDivider, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
          {/* Drop row */}
          <View style={styles.routeInputRow}>
            <View style={styles.dotColumn}>
              <View style={styles.dropDotNew} />
            </View>
            <View style={styles.routeInputField}>
              <Text style={[styles.routeInputLabel, isDark && { color: '#9BA08F' }]}>DROP</Text>
              <TextInput
                ref={searchInputRef}
                style={[styles.routeInputValueInput, isDark && { color: '#F1F1EC' }]}
                placeholder="Where to?"
                placeholderTextColor={isDark ? '#64748B' : '#94a3b8'}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (!text.trim()) {
                    setSelectedDestination(null);
                  }
                }}
                onSubmitEditing={openRideResults}
                returnKeyType="search"
              />
            </View>
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSelectedDestination(null);
                }}
                hitSlop={10}
              >
                <Ionicons name="close-circle" size={20} color={isDark ? '#9BA08F' : '#94a3b8'} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.seeRidesButton, !canOpenRideResults && styles.seeRidesButtonDisabled]}
          onPress={openRideResults}
          disabled={!canOpenRideResults}
        >
          <Ionicons name="car-outline" size={22} color="#FFFFFF" />
          <Text style={styles.seeRidesButtonText}>See available rides</Text>
          <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
        </TouchableOpacity>

        <Modal visible={showPickupEditor} transparent animationType="slide" onRequestClose={() => setShowPickupEditor(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, isDark && { backgroundColor: '#1D1E22' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDark && { color: '#F1F1EC' }]}>Choose pickup location</Text>
                <TouchableOpacity onPress={() => setShowPickupEditor(false)}>
                  <Ionicons name="close" size={24} color={isDark ? '#F1F1EC' : '#334155'} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.pickupChoice, isDark && { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}
                onPress={() => selectPickup(pickupAddress || 'Current location')}
              >
                <Ionicons name="locate-outline" size={22} color="#54B713" />
                <Text style={[styles.pickupChoiceText, isDark && { color: '#F1F1EC' }]}>Use current location</Text>
              </TouchableOpacity>
              {INITIAL_SAVED_PLACES.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={[styles.pickupChoice, isDark && { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}
                  onPress={() => selectPickup(place.address)}
                >
                  <Ionicons name={place.icon === 'home' ? 'home-outline' : 'briefcase-outline'} size={22} color="#54B713" />
                  <View style={styles.savedAddressCopy}>
                    <Text style={[styles.pickupChoiceText, isDark && { color: '#F1F1EC' }]}>{place.label}</Text>
                    <Text style={[styles.savedAddressText, isDark && { color: '#9BA08F' }]}>{place.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TextInput
                style={[styles.customScheduleInput, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.12)', color: '#F1F1EC' }]}
                placeholder="Enter another pickup address"
                placeholderTextColor={isDark ? '#64748B' : '#94a3b8'}
                value={pickupInput}
                onChangeText={setPickupInput}
              />
              <TouchableOpacity style={styles.modalDoneButton} onPress={() => selectPickup(pickupInput.trim() || pickupAddress)}>
                <Text style={styles.modalDoneText}>Use this pickup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={styles.searchActions}>
          <TouchableOpacity
            style={[styles.outlineAction, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.12)' }]}
            onPress={() => Alert.alert('Select on map', 'Map selection will be available here.')}
          >
            <Ionicons name="location-outline" size={27} color={isDark ? '#F1F1EC' : '#0f172a'} />
            <Text style={[styles.actionText, isDark && { color: '#F1F1EC' }]}>Select on map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.outlineAction, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.12)' }]}
            onPress={() => setAddingStop(true)}
          >
            <Ionicons name="add" size={28} color={isDark ? '#F1F1EC' : '#0f172a'} />
            <Text style={[styles.actionText, isDark && { color: '#F1F1EC' }]}>Add stops</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.outlineAction, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.12)' }]}
            onPress={() => setShowSavedAddresses(true)}
          >
            <Ionicons name="bookmark-outline" size={25} color={isDark ? '#F1F1EC' : '#0f172a'} />
            <Text style={[styles.actionText, isDark && { color: '#F1F1EC' }]}>Saved addresses</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showSavedAddresses} transparent animationType="slide" onRequestClose={() => setShowSavedAddresses(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, isDark && { backgroundColor: '#1D1E22' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.savedAddressTitle, isDark && { color: '#F1F1EC' }]}>Your saved addresses</Text>
                <TouchableOpacity onPress={() => setShowSavedAddresses(false)}>
                  <Ionicons name="close" size={24} color={isDark ? '#F1F1EC' : '#334155'} />
                </TouchableOpacity>
              </View>
              {INITIAL_SAVED_PLACES.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={[styles.savedAddressRow, isDark && { borderTopColor: 'rgba(255, 255, 255, 0.08)' }]}
                  onPress={() => handleSelectSavedAddress(place.address)}
                >
                  <Ionicons name={place.icon === 'home' ? 'home-outline' : 'briefcase-outline'} size={21} color="#54B713" />
                  <View style={styles.savedAddressCopy}>
                    <Text style={[styles.savedAddressLabel, isDark && { color: '#F1F1EC' }]}>{place.label}</Text>
                    <Text style={[styles.savedAddressText, isDark && { color: '#9BA08F' }]} numberOfLines={1}>{place.address}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={isDark ? '#9BA08F' : '#94a3b8'} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {stops.map((stop, index) => (
          <View key={`${stop}-${index}`} style={[styles.stopRow, isDark && { backgroundColor: '#24262B' }]}>
            <Ionicons name="ellipse-outline" size={20} color="#c2410c" />
            <Text style={[styles.stopText, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>{stop}</Text>
            <TouchableOpacity onPress={() => setStops((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}>
              <Ionicons name="close-circle-outline" size={21} color={isDark ? '#9BA08F' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        ))}

        {addingStop && (
          <View style={[styles.addStopBox, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.12)' }]}>
            <TextInput
              autoFocus
              style={[styles.addStopInput, isDark && { color: '#F1F1EC' }]}
              placeholder="Enter stop location"
              placeholderTextColor={isDark ? '#64748B' : '#94a3b8'}
              value={stopQuery}
              onChangeText={setStopQuery}
              onSubmitEditing={addStop}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addStopButton} onPress={addStop}>
              <Text style={styles.addStopButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Searches */}
        <View style={styles.recentSection}>
          <Text style={[styles.recentHeader, isDark && { color: '#9BA08F' }]}>Recent</Text>
          {filteredDestinations.length === 0 ? (
            <Text style={[styles.emptyText, isDark && { color: '#9BA08F' }]}>No recent places found.</Text>
          ) : (
            filteredDestinations.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.searchResultRow, isDark && { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }]}
                onPress={() => handleSelectDestination(item)}
              >
                <View style={[styles.recentIconWrap, isDark && { backgroundColor: '#24262B' }]}>
                  <Ionicons name="time-outline" size={18} color="#54B713" />
                </View>
                <View style={styles.searchResultCopy}>
                  <Text style={[styles.searchResultTitle, isDark && { color: '#F1F1EC' }]}>{item.title}</Text>
                  <Text style={[styles.searchResultSubtitle, isDark && { color: '#9BA08F' }]} numberOfLines={1}>{item.subtitle}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleFavorite(item.id)} hitSlop={12}>
                  <Ionicons
                    name={item.favorite ? 'heart' : 'heart-outline'}
                    size={22}
                    color={item.favorite ? '#e74c3c' : (isDark ? '#64748B' : '#94a3b8')}
                  />
                </TouchableOpacity>
              </Pressable>
            ))
          )}
        </View>
      </View>
    );
  }

  const currentTrip = activeTrip || activeMinimizedTrip;

  return (
    <View style={[styles.homeScreenContainer, isDark && { backgroundColor: '#121214' }]}>
      <ScrollView
        style={[styles.container, isDark && { backgroundColor: '#121214' }]}
        contentContainerStyle={[
          styles.homePageContent,
          currentTrip && { paddingTop: 64 },
        ]}
        showsVerticalScrollIndicator
        scrollEnabled
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.mapContainer}>
        {onExit && (
          <TouchableOpacity
            style={[
              styles.floatingExitButton,
              { top: safeTop },
              isDark && { backgroundColor: '#1D1E22' },
            ]}
            onPress={onExit}
            accessibilityRole="button"
            accessibilityLabel="Back to OneBuddy Home"
          >
            <Ionicons name="arrow-back" size={22} color={isDark ? '#F1F1EC' : '#0F172A'} />
          </TouchableOpacity>
        )}
        {locationLoading && (
          <View style={styles.mapLoadingOverlay}>
            <ActivityIndicator size="large" color="#54B713" />
            <Text style={styles.mapLoadingText}>Getting your live location…</Text>
          </View>
        )}

        {locationError && !locationLoading && (
          <View style={styles.mapErrorBanner}>
            <Ionicons name="warning-outline" size={20} color="#c0392b" />
            <Text style={styles.mapLoadingText}>{locationError}</Text>
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.retryButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.mockMap} {...mapZoomResponder.panHandlers}>
          <View style={[styles.mockMapCanvas, { transform: [{ scale: mapZoom }] }]}>
            <View style={styles.mockParkOne}><Text style={styles.mockParkText}>Kukatpally</Text></View>
            <View style={styles.mockParkTwo}><Text style={styles.mockParkText}>HITEC City</Text></View>
            <View style={[styles.mockRoad, styles.mockRoadOne]} />
            <View style={[styles.mockRoad, styles.mockRoadTwo]} />
            <View style={[styles.mockRoad, styles.mockRoadThree]} />
            <View style={[styles.mockRoad, styles.mockRoadFour]} />
            <View style={[styles.mockRoad, styles.mockRoadFive]} />
            <View style={styles.mockMapLabel}><Text style={styles.mockMapLabelText}>Hyderabad</Text></View>
            <View style={[styles.mockMapStreet, styles.mockStreetOne]}><Text style={styles.mockStreetText}>JNTU Road</Text></View>
            <View style={[styles.mockMapStreet, styles.mockStreetTwo]}><Text style={styles.mockStreetText}>KPHB Main Road</Text></View>
            <View style={styles.mockLocationPin}>
              <View style={styles.mockLocationDot} />
            </View>
          </View>

          <View style={[styles.zoomControls, isDark && { backgroundColor: '#1D1E22' }]}>
            <TouchableOpacity style={styles.zoomButton} onPress={zoomIn} accessibilityLabel="Zoom in">
              <Ionicons name="add" size={24} color={isDark ? '#F1F1EC' : '#0f172a'} />
            </TouchableOpacity>
            <View style={[styles.zoomDivider, isDark && { backgroundColor: '#3E424B' }]} />
            <TouchableOpacity style={styles.zoomButton} onPress={zoomOut} accessibilityLabel="Zoom out">
              <Ionicons name="remove" size={24} color={isDark ? '#F1F1EC' : '#0f172a'} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.recenterButton, isDark && { backgroundColor: '#1D1E22' }]}
          onPress={handleRecenter}
          disabled={!pickupCoords}
          accessibilityLabel="Recenter map to my location"
        >
          <Ionicons name="locate" size={22} color="#54B713" />
        </TouchableOpacity>

        <View style={[styles.addressPill, isDark && { backgroundColor: 'rgba(29, 30, 34, 0.95)' }]}>
          <View style={styles.addressDot} />
          <Text style={[styles.addressText, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>
            {pickupAddress}
          </Text>
        </View>
      </View>

      <View style={[styles.sheet, isDark && { backgroundColor: '#1D1E22' }]}>
        <View style={[styles.sheetHandle, isDark && { backgroundColor: '#3E424B' }]} />

        <View style={[styles.searchBar, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.12)' }]}>
          <Ionicons name="search" size={18} color={isDark ? '#9BA08F' : '#555'} style={{ marginRight: 8 }} />
          <TouchableOpacity style={styles.searchInputButton} onPress={openSearch} activeOpacity={0.8}>
            <Text style={searchQuery ? [styles.searchInputValue, isDark && { color: '#F1F1EC' }] : [styles.searchInputPlaceholder, isDark && { color: '#9BA08F' }]} numberOfLines={1}>
              {searchQuery || 'Where do you want to go?'}
            </Text>
          </TouchableOpacity>
          {(searchQuery.length > 0 || selectedDestination) && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSelectedDestination(null);
              }}
              hitSlop={10}
            >
              <Ionicons name="close-circle" size={18} color={isDark ? '#9BA08F' : '#94a3b8'} />
            </TouchableOpacity>
          )}
        </View>

        {selectedDestination && searchQuery.trim().length > 0 && (
          <View style={[styles.selectedBanner, isDark && { backgroundColor: 'rgba(84, 183, 19, 0.15)', borderColor: 'rgba(84, 183, 19, 0.3)' }]}>
            <Ionicons name="location" size={16} color="#54B713" />
            <Text style={[styles.selectedBannerText, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>
              Going to: {selectedDestination.title}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSelectedDestination(null);
              }}
              hitSlop={10}
              style={{ padding: 4 }}
            >
              <Ionicons name="close-circle" size={16} color={isDark ? '#9BA08F' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.rideCategories}>
          <Text style={[styles.sectionLabel, isDark && { color: '#F1F1EC' }]}>Choose your ride</Text>
          <View style={styles.categoryRow}>
            <TouchableOpacity
              style={[
                styles.categoryCard,
                isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' },
                rideType === 'schedule' && styles.categoryCardActive,
                rideType === 'schedule' && isDark && { backgroundColor: 'rgba(84, 183, 19, 0.16)', borderColor: '#54B713' },
              ]}
              onPress={() => {
                setRideType('schedule');
                setShowRideDetails(true);
              }}
            >
              <View style={[styles.categoryIcon, isDark && { backgroundColor: '#1D1E22' }, rideType === 'schedule' && styles.categoryIconActive]}>
                <Ionicons name="calendar-outline" size={22} color={rideType === 'schedule' ? '#FFFFFF' : '#54B713'} />
              </View>
              <Text style={[styles.categoryTitle, isDark && { color: '#F1F1EC' }]}>Schedule ride</Text>
              <Text style={[styles.categorySubtitle, isDark && { color: '#9BA08F' }]}>Book for later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryCard,
                isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' },
                rideType === 'smart' && styles.categoryCardActive,
                rideType === 'smart' && isDark && { backgroundColor: 'rgba(84, 183, 19, 0.16)', borderColor: '#54B713' },
              ]}
              onPress={() => {
                setRideType('smart');
                setShowRideDetails(true);
              }}
            >
              <View style={[styles.categoryIcon, isDark && { backgroundColor: '#1D1E22' }, rideType === 'smart' && styles.categoryIconActive]}>
                <Ionicons name="flash-outline" size={22} color={rideType === 'smart' ? '#FFFFFF' : '#54B713'} />
              </View>
              <Text style={[styles.categoryTitle, isDark && { color: '#F1F1EC' }]}>Smart ride</Text>
              <Text style={[styles.categorySubtitle, isDark && { color: '#9BA08F' }]}>Faster pickup</Text>
            </TouchableOpacity>
          </View>

          {rideType === 'schedule' && (
            <View style={[styles.schedulePanel, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(84, 183, 19, 0.25)' }]}>
              <View style={styles.schedulePanelHeader}>
                <View style={styles.schedulePanelTitleRow}>
                  <Ionicons name="time-outline" size={20} color="#54B713" />
                  <Text style={[styles.schedulePanelTitle, isDark && { color: '#F1F1EC' }]}>When should we pick you up?</Text>
                </View>
                <TouchableOpacity
                  onPress={handleCloseSchedulePanel}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[styles.closeCardBtn, isDark && { backgroundColor: '#1D1E22' }]}
                  accessibilityLabel="Close schedule card"
                >
                  <Ionicons name="close" size={20} color={isDark ? '#F1F1EC' : '#64748B'} />
                </TouchableOpacity>
              </View>
              <View style={styles.timeOptions}>
                {scheduleTimings.length === 0 ? (
                  <Text style={[styles.emptyTimingsText, isDark && { color: '#9BA08F' }]}>No scheduled timings. Tap Schedule ride to add.</Text>
                ) : (
                  scheduleTimings.map((time, index) => {
                    const isEditing = editingTimingIndex === index;
                    if (isEditing) {
                      return (
                        <View key={`edit-${index}`} style={[styles.inlineEditContainer, isDark && { backgroundColor: '#1D1E22' }]}>
                          <TextInput
                            style={[styles.inlineEditInput, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.12)', color: '#F1F1EC' }]}
                            value={editingTimingText}
                            onChangeText={setEditingTimingText}
                            autoFocus
                            placeholder="e.g. Today, 7:30 PM"
                            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                          />
                          <View style={styles.inlineEditActions}>
                            <TouchableOpacity
                              style={styles.inlineEditSaveBtn}
                              onPress={() => saveEditingTiming(index)}
                              accessibilityLabel="Save edited time"
                            >
                              <Text style={styles.inlineEditSaveText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.inlineEditCancelBtn, isDark && { backgroundColor: '#24262B' }]}
                              onPress={cancelEditingTiming}
                              accessibilityLabel="Cancel editing"
                            >
                              <Text style={[styles.inlineEditCancelText, isDark && { color: '#9BA08F' }]}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    }

                    return (
                      <View
                        key={`${time}-${index}`}
                        style={[
                          styles.timeOption,
                          isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' },
                          scheduledTime === time && styles.timeOptionActive,
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.timeOptionMain}
                          onPress={() => setScheduledTime(time)}
                        >
                          <Ionicons
                            name={scheduledTime === time ? "radio-button-on" : "radio-button-off"}
                            size={18}
                            color={scheduledTime === time ? "#FFFFFF" : "#54B713"}
                            style={{ marginRight: 8 }}
                          />
                          <Text style={[styles.timeOptionText, isDark && { color: '#F1F1EC' }, scheduledTime === time && styles.timeOptionTextActive]}>
                            {time}
                          </Text>
                        </TouchableOpacity>

                        <View style={styles.timeActionRow}>
                          <TouchableOpacity
                            style={[styles.timeEditBtn, isDark && { backgroundColor: '#24262B' }, scheduledTime === time && styles.timeEditBtnActive]}
                            onPress={(e) => startEditingTiming(index, time, e)}
                            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                            accessibilityLabel={`Edit ${time}`}
                          >
                            <Ionicons
                              name="create-outline"
                              size={14}
                              color={scheduledTime === time ? "#FFFFFF" : "#54B713"}
                              style={{ marginRight: 3 }}
                            />
                            <Text style={[styles.timeEditText, scheduledTime === time && styles.timeEditTextActive]}>
                              Edit
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.timeDeleteBtn}
                            onPress={(e) => handleDeleteTiming(time, e)}
                            hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
                            accessibilityLabel={`Delete ${time}`}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color={scheduledTime === time ? "#FFFFFF" : "#EF4444"}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          )}

          {rideType === 'smart' && (
            <View style={[styles.smartPanel, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(84, 183, 19, 0.25)' }]}>
              <View style={[styles.smartPanelIconWrap, isDark && { backgroundColor: '#1D1E22' }]}>
                <Ionicons name="flash" size={18} color="#54B713" />
              </View>
              <View style={styles.smartPanelCopy}>
                <Text style={[styles.smartPanelTitle, isDark && { color: '#F1F1EC' }]}>Priority pickup</Text>
                <Text style={[styles.smartPanelText, isDark && { color: '#9BA08F' }]}>A driver arrives faster. Smart rides cost about 25% more than a normal ride.</Text>
              </View>
              <Text style={styles.smartPremium}>+25%</Text>
            </View>
          )}
        </View>

        <Modal visible={showRideDetails} transparent animationType="slide" onRequestClose={() => setShowRideDetails(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, isDark && { backgroundColor: '#1D1E22' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDark && { color: '#F1F1EC' }]}>{rideType === 'schedule' ? 'Schedule your ride' : 'Choose Smart Ride'}</Text>
                <TouchableOpacity onPress={() => setShowRideDetails(false)}>
                  <Ionicons name="close" size={24} color={isDark ? '#F1F1EC' : '#334155'} />
                </TouchableOpacity>
              </View>
              {rideType === 'schedule' ? (
                <>
                  <Text style={[styles.modalDescription, isDark && { color: '#9BA08F' }]}>Pick a time and your driver will arrive then.</Text>
                  {scheduleTimings.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.modalChoice,
                        isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' },
                        scheduledTime === time && styles.modalChoiceActive,
                        scheduledTime === time && isDark && { backgroundColor: 'rgba(84, 183, 19, 0.16)', borderColor: '#54B713' },
                      ]}
                      onPress={() => setScheduledTime(time)}
                    >
                      <Ionicons name="calendar-outline" size={20} color={scheduledTime === time ? '#54B713' : (isDark ? '#9BA08F' : '#64748b')} />
                      <Text style={[styles.modalChoiceText, isDark && { color: '#F1F1EC' }, scheduledTime === time && styles.modalChoiceTextActive]}>{time}</Text>
                      {scheduledTime === time && <Ionicons name="checkmark-circle" size={20} color="#54B713" />}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.customizeButton, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(84, 183, 19, 0.3)' }, customSchedule && styles.customizeButtonActive]}
                    onPress={() => setCustomSchedule((visible) => !visible)}
                  >
                    <Ionicons name="options-outline" size={20} color="#54B713" />
                    <Text style={styles.customizeButtonText}>Customize date and time</Text>
                    <Ionicons name={customSchedule ? 'chevron-up' : 'chevron-down'} size={18} color="#54B713" />
                  </TouchableOpacity>
                  {customSchedule && (
                    <View style={styles.customScheduleBox}>
                      <TextInput
                        style={[styles.customScheduleInput, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.12)', color: '#F1F1EC' }]}
                        placeholder="Date (e.g. 12 Sep 2026)"
                        placeholderTextColor={isDark ? '#64748B' : '#94a3b8'}
                        value={customDate}
                        onChangeText={setCustomDate}
                      />
                      <TextInput
                        style={[styles.customScheduleInput, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.12)', color: '#F1F1EC' }]}
                        placeholder="Time (e.g. 7:30 PM)"
                        placeholderTextColor={isDark ? '#64748B' : '#94a3b8'}
                        value={customTime}
                        onChangeText={setCustomTime}
                      />
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.smartModalBody}>
                  <View style={[styles.smartModalIconWrap, isDark && { backgroundColor: '#24262B' }]}>
                    <Ionicons name="flash" size={32} color="#54B713" />
                  </View>
                  <Text style={[styles.modalDescription, isDark && { color: '#9BA08F' }]}>Smart Ride gets priority pickup and arrives faster than a normal ride.</Text>
                  <View style={[styles.smartBadgeWrap, isDark && { backgroundColor: 'rgba(84, 183, 19, 0.15)', borderColor: 'rgba(84, 183, 19, 0.3)' }]}>
                    <Text style={styles.modalPremium}>Estimated fare: about 25% higher than normal</Text>
                  </View>
                </View>
              )}
              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={() => {
                  if (rideType === 'schedule' && customSchedule && customDate.trim() && customTime.trim()) {
                    const newTime = `${customDate.trim()}, ${customTime.trim()}`;
                    setScheduledTime(newTime);
                    setScheduleTimings((prev) => (prev.includes(newTime) ? prev : [newTime, ...prev]));
                    setCustomDate('');
                    setCustomTime('');
                    setCustomSchedule(false);
                  }
                  setShowRideDetails(false);
                }}
              >
                <Text style={styles.modalDoneText}>{rideType === 'schedule' ? 'Save schedule' : 'Continue'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={styles.homeContentScroll}>
          {destinations.length === 0 ? (
            <View style={styles.emptyRecentContainer}>
              <View style={[styles.emptyRecentIconWrap, isDark && { backgroundColor: '#24262B' }]}>
                <Ionicons name="location-outline" size={24} color="#54B713" />
              </View>
              <Text style={[styles.emptyRecentTitle, isDark && { color: '#F1F1EC' }]}>No previous destinations</Text>
              <Text style={[styles.emptyRecentSubtitle, isDark && { color: '#9BA08F' }]}>
                Searched locations will appear here for one-tap booking.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.recentDestinationsHeaderRow}>
                <Text style={[styles.recentDestinationsHeaderText, isDark && { color: '#9BA08F' }]}>RECENT DESTINATIONS</Text>
              </View>
              {filteredDestinations.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.destinationRow, isDark && { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }, pressed && (isDark ? { backgroundColor: '#24262B' } : styles.rowPressed)]}
                  onPress={() => handleSelectDestination(item)}
                >
                  <View style={[styles.recentIconWrapHome, isDark && { backgroundColor: '#24262B' }]}>
                    <Ionicons name="time-outline" size={18} color="#54B713" />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.destinationTitle, isDark && { color: '#F1F1EC' }]}>{item.title}</Text>
                    <Text style={[styles.destinationSubtitle, isDark && { color: '#9BA08F' }]} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleFavorite(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={item.favorite ? 'heart' : 'heart-outline'}
                      size={20}
                      color={item.favorite ? '#e74c3c' : (isDark ? '#64748B' : '#94a3b8')}
                    />
                  </TouchableOpacity>
                </Pressable>
              ))}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  </View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  homeScreenContainer: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  floatingTripBanner: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: '#54B713',
  },
  floatingTripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  tripLiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  floatingTripTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingTripSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  floatingTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#54B713',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  floatingTripBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resultsScreen: { flex: 1, backgroundColor: '#f8faf5' },
  resultsMap: { height: '36%', minHeight: 210, position: 'relative', overflow: 'hidden', backgroundColor: '#dce8df' },
  resultsMapCanvas: { ...StyleSheet.absoluteFill },
  resultsBackButton: {
    position: 'absolute',
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    zIndex: 30,
  },
  resultsAddressPill: {
    position: 'absolute',
    left: 60,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.96)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    zIndex: 30,
  },
  resultsAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 18 },
  resultsGreenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16a05d' },
  resultsOrangeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#c2410c' },
  resultsAddressText: { flex: 1, color: '#0f172a', fontSize: 12, fontWeight: '600' },
  resultsSheet: { flex: 1, paddingTop: 6, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#fff', marginTop: -12 },
  resultsSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 2, paddingBottom: 6 },
  resultsTitle: { color: '#000000', fontSize: 15, fontWeight: '700' },
  addStopChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f1f5f9' },
  addStopChipText: { color: '#0f172a', fontSize: 12, fontWeight: '700' },
  resultsSubtitle: { color: '#64748b', fontSize: 11.5, marginTop: 1 },
  rideOptionsList: { paddingHorizontal: 14, paddingTop: 2, paddingBottom: 6 },
  rideOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 5,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  rideOptionSelected: { borderWidth: 1.5, borderColor: '#54B713', backgroundColor: '#F8FCF7' },
  vehicleImage: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center' },
  vehicleImagePhoto: { width: 42, height: 38 },
  rideOptionCopy: { flex: 1, paddingHorizontal: 8 },
  rideOptionTitle: { color: '#000000', fontSize: 13.5, fontWeight: '700' },
  rideOptionMeta: { color: '#64748b', fontSize: 11, marginTop: 1 },
  rideFare: { color: '#000000', fontSize: 14.5, fontWeight: '700' },
  priorityTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quickestBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, color: '#334155', backgroundColor: '#fde68a', fontSize: 10, fontWeight: '800' },
  uberPromoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 14,
    marginTop: 2,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uberPromoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uberOneBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uberOneBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  uberPromoText: { fontSize: 12, color: '#0F172A', fontWeight: '500' },
  promoCheckbox: { width: 16, height: 16, borderRadius: 3, borderWidth: 1.5, borderColor: '#94A3B8', backgroundColor: '#FFFFFF' },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 14,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
  },
  paymentMethodLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cashIconBadge: { width: 28, height: 20, borderRadius: 4, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  paymentMethodText: { fontSize: 12.5, fontWeight: '600', color: '#0F172A' },
  bookingFooter: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 14, backgroundColor: '#fff' },
  footerPayment: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 8 },
  footerPaymentText: { color: '#0f172a', fontSize: 13, fontWeight: '700' },
  footerDivider: { flex: 1, maxWidth: 1, height: 24, backgroundColor: '#e2e8f0', marginHorizontal: 6 },
  bookButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: 22, backgroundColor: '#54B713', paddingVertical: 10 },
  bookButtonText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '700' },
  homePageContent: { flexGrow: 1 },
  searchScreen: { flex: 1, backgroundColor: '#fff' },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  searchTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#0f172a' },
  forMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  forMeText: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  rideForMenu: {
    position: 'absolute',
    top: 78,
    right: 20,
    zIndex: 10,
    minWidth: 170,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  rideForOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  rideForOptionText: { fontSize: 15, color: '#0f172a', fontWeight: '600' },
  routeCard: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  dotColumn: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  routeConnector: {
    position: 'absolute',
    top: 18,
    bottom: -36,
    width: 2,
    borderLeftWidth: 1.5,
    borderStyle: 'dotted',
    borderColor: '#cbd5e1',
    zIndex: 0,
  },
  routeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  routeInputDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e2e8f0',
    marginLeft: 32,
  },
  pickupDotNew: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16a34a',
    borderWidth: 2.5,
    borderColor: '#bbf7d0',
    zIndex: 1,
  },
  dropDotNew: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 2.5,
    borderColor: '#fecaca',
    zIndex: 1,
  },
  routeInputField: { flex: 1 },
  routeInputLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  routeInputValue: { fontSize: 15.5, fontWeight: '700', color: '#0f172a' },
  routeInputValueInput: { fontSize: 15.5, fontWeight: '600', color: '#0f172a', padding: 0, minHeight: 24 },
  // Legacy (kept for compatibility)
  routeLine: { position: 'absolute', left: 34, top: 42, bottom: 42, borderLeftWidth: 3, borderStyle: 'dashed', borderColor: '#64748b' },
  routeRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 18 },
  routeDot: { width: 18, height: 18, borderRadius: 9, zIndex: 1 },
  pickupDot: { backgroundColor: '#16a05d' },
  dropDot: { backgroundColor: '#c2410c' },
  pickupButton: { flex: 1, minHeight: 40, justifyContent: 'center' },
  pickupText: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  routeDivider: { height: 1.5, backgroundColor: '#e2e8f0', marginLeft: 38, marginVertical: 4 },
  dropInput: { flex: 1, fontSize: 17, color: '#0f172a', padding: 0 },
  seeRidesButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 16, marginTop: 14, minHeight: 54, borderRadius: 28, backgroundColor: '#54B713' },
  seeRidesButtonDisabled: { opacity: 0.45 },
  seeRidesButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  searchActions: { paddingHorizontal: 16, paddingTop: 22, gap: 14 },
  outlineAction: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  actionText: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  savedAddressPanel: { marginHorizontal: 20, marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: '#F8FCF7', borderWidth: 1, borderColor: '#D3ECD0' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.4)' },
  modalCard: { padding: 20, paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { color: '#0F172A', fontSize: 20, fontWeight: '800' },
  modalDescription: { color: '#64748B', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  modalChoice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, marginTop: 8, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  modalChoiceActive: { borderColor: '#54B713', backgroundColor: '#EAF7E4' },
  modalChoiceText: { flex: 1, color: '#334155', fontSize: 14, fontWeight: '700' },
  modalChoiceTextActive: { color: '#0F172A', fontWeight: '800' },
  pickupChoice: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  pickupChoiceText: { flex: 1, color: '#334155', fontSize: 14, fontWeight: '700' },
  customizeButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 13, borderRadius: 14, borderWidth: 1.5, borderColor: '#D3ECD0', backgroundColor: '#FFFFFF' },
  customizeButtonActive: { backgroundColor: '#EAF7E4', borderColor: '#54B713' },
  customizeButtonText: { flex: 1, color: '#54B713', fontSize: 14, fontWeight: '800' },
  customScheduleBox: { gap: 9, marginTop: 9 },
  customScheduleInput: { height: 46, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#D3ECD0', color: '#0F172A', fontSize: 14, backgroundColor: '#FFFFFF' },
  smartModalBody: { alignItems: 'center', paddingVertical: 14 },
  smartModalIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EAF7E4', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  smartBadgeWrap: { backgroundColor: '#EAF7E4', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#D3ECD0', marginTop: 8 },
  modalPremium: { color: '#54B713', fontSize: 13.5, fontWeight: '800', textAlign: 'center' },
  modalDoneButton: { marginTop: 18, paddingVertical: 14, borderRadius: 26, alignItems: 'center', backgroundColor: '#54B713', shadowColor: '#54B713', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  modalDoneText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  savedAddressTitle: { color: '#0F172A', fontSize: 14, fontWeight: '800', marginBottom: 4 },
  savedAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#EAF7E4' },
  savedAddressCopy: { flex: 1 },
  savedAddressLabel: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  savedAddressText: { color: '#64748B', fontSize: 12, marginTop: 2 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginTop: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#fff7ed' },
  stopText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155' },
  addStopBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 12, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingLeft: 12, overflow: 'hidden' },
  addStopInput: { flex: 1, height: 44, color: '#0f172a', fontSize: 15 },
  addStopButton: { height: 44, justifyContent: 'center', paddingHorizontal: 16, backgroundColor: '#0f172a' },
  addStopButtonText: { color: '#fff', fontWeight: '700' },
  searchResults: { paddingHorizontal: 20, paddingTop: 12 },
  recentSection: { paddingHorizontal: 16, paddingTop: 16 },
  recentHeader: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4, paddingHorizontal: 4 },
  recentIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EAF7E4', alignItems: 'center', justifyContent: 'center' },
  recentIconWrapHome: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EAF7E4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  recentDestinationsHeaderRow: { paddingHorizontal: 4, paddingTop: 14, paddingBottom: 6 },
  recentDestinationsHeaderText: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' },
  emptyRecentContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  emptyRecentIconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EAF7E4', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyRecentTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  emptyRecentSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  searchResultCopy: { flex: 1 },
  searchResultTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  searchResultSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  homeContentScroll: { marginTop: 8, paddingBottom: 24 },
  mapContainer: { height: 360, backgroundColor: '#e9e9e9' },
  mockMap: { ...StyleSheet.absoluteFill, overflow: 'hidden', backgroundColor: '#dce8df' },
  mockMapCanvas: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  mockParkOne: { position: 'absolute', width: 150, height: 120, top: '6%', left: '-8%', borderRadius: 70, backgroundColor: '#c1d9bd', transform: [{ rotate: '-18deg' }] },
  mockParkTwo: { position: 'absolute', width: 170, height: 110, bottom: '4%', right: '-12%', borderRadius: 70, backgroundColor: '#c5ddc0', transform: [{ rotate: '20deg' }] },
  mockParkText: { marginTop: 46, textAlign: 'center', color: '#6c8b6b', fontSize: 12, fontWeight: '700' },
  mockRoad: { position: 'absolute', backgroundColor: '#fff', borderColor: '#c9d4c9', borderWidth: 1 },
  mockRoadOne: { width: '145%', height: 30, top: '20%', left: '-20%', transform: [{ rotate: '28deg' }] },
  mockRoadTwo: { width: '150%', height: 22, top: '57%', left: '-18%', transform: [{ rotate: '-18deg' }] },
  mockRoadThree: { width: 26, height: '125%', top: '-12%', left: '35%', transform: [{ rotate: '12deg' }] },
  mockRoadFour: { width: 18, height: '130%', top: '-12%', left: '72%', transform: [{ rotate: '-28deg' }] },
  mockRoadFive: { width: '140%', height: 14, top: '78%', left: '-10%', transform: [{ rotate: '8deg' }] },
  mockMapLabel: { position: 'absolute', top: '15%', right: '18%', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.8)' },
  mockMapLabelText: { color: '#526b59', fontSize: 13, fontWeight: '700' },
  mockMapStreet: { position: 'absolute', paddingHorizontal: 7, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 5 },
  mockStreetOne: { top: '35%', left: '8%', transform: [{ rotate: '28deg' }] },
  mockStreetTwo: { top: '67%', right: '8%', transform: [{ rotate: '-18deg' }] },
  mockStreetText: { color: '#718071', fontSize: 10, fontWeight: '600' },
  mockLocationPin: { position: 'absolute', top: '48%', left: '48%', width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(84,183,19,0.22)', justifyContent: 'center', alignItems: 'center' },
  mockLocationDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#54B713', borderWidth: 4, borderColor: '#fff' },
  zoomControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  zoomButton: { width: 44, height: 42, justifyContent: 'center', alignItems: 'center' },
  zoomDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#cbd5e1' },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    zIndex: 5,
  },
  mapLoadingText: { marginTop: 8, color: '#475569', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  mapErrorBanner: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    elevation: 3,
  },
  retryButton: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#54B713',
    borderRadius: 20,
  },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  markerWrapper: { alignItems: 'center' },
  markerLabel: {
    backgroundColor: '#54B713',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 4,
  },
  markerLabelText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  markerPin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(84,183,19,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerPinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#54B713',
    borderWidth: 2,
    borderColor: '#fff',
  },
  floatingExitButton: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 40,
  },
  recenterButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  addressPill: {
    position: 'absolute',
    left: 16,
    right: 70,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  addressDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#54B713', marginRight: 10 },
  addressText: { fontSize: 14, fontWeight: '600', color: '#1e293b', flexShrink: 1 },
  sheet: {
    flex: 1.1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', marginBottom: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 26,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInputButton: { flex: 1, justifyContent: 'center' },
  searchInputPlaceholder: { fontSize: 16, color: '#94a3b8' },
  searchInputValue: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF7E4',
    borderWidth: 1,
    borderColor: '#D3ECD0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
  },
  selectedBannerText: { color: '#0F172A', fontWeight: '700', fontSize: 13, flex: 1 },
  rideCategories: { marginTop: 14, paddingHorizontal: 16 },
  sectionLabel: { color: '#0f172a', fontSize: 16, fontWeight: '800', marginBottom: 9 },
  categoryRow: { flexDirection: 'row', gap: 10 },
  categoryCard: { flex: 1, minHeight: 102, padding: 12, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  categoryCardActive: { borderColor: '#54B713', backgroundColor: '#F8FCF7' },
  categoryIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF7E4', marginBottom: 8 },
  categoryIconActive: { backgroundColor: '#54B713' },
  categoryTitle: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  categorySubtitle: { color: '#64748B', fontSize: 12, marginTop: 3 },
  schedulePanel: { marginTop: 12, padding: 14, borderRadius: 16, backgroundColor: '#F8FCF7', borderWidth: 1.5, borderColor: '#D3ECD0' },
  schedulePanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  schedulePanelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  schedulePanelTitle: { flex: 1, color: '#0F172A', fontSize: 13.5, fontWeight: '800' },
  closeCardBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EAF7E4', alignItems: 'center', justifyContent: 'center' },
  timeOptions: { gap: 8 },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  timeOptionActive: { backgroundColor: '#54B713', borderColor: '#54B713' },
  timeOptionMain: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingVertical: 2 },
  timeActionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EAF7E4',
  },
  timeEditBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  timeEditText: { color: '#54B713', fontSize: 12, fontWeight: '700' },
  timeEditTextActive: { color: '#FFFFFF', fontWeight: '800' },
  timeDeleteBtn: { padding: 5, borderRadius: 8 },
  timeOptionText: { color: '#334155', fontSize: 13, fontWeight: '700' },
  timeOptionTextActive: { color: '#FFFFFF', fontWeight: '800' },
  emptyTimingsText: { color: '#64748B', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  inlineEditContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#54B713',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  inlineEditInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#D3ECD0',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FCF7',
  },
  inlineEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  inlineEditSaveBtn: {
    backgroundColor: '#54B713',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  inlineEditSaveText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  inlineEditCancelBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  inlineEditCancelText: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '700',
  },
  smartPanel: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, padding: 14, borderRadius: 16, backgroundColor: '#F8FCF7', borderWidth: 1.5, borderColor: '#D3ECD0' },
  smartPanelIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EAF7E4', alignItems: 'center', justifyContent: 'center' },
  smartPanelCopy: { flex: 1 },
  smartPanelTitle: { color: '#0F172A', fontSize: 13.5, fontWeight: '800' },
  smartPanelText: { color: '#64748B', fontSize: 12, lineHeight: 17, marginTop: 2 },
  smartPremium: { color: '#54B713', fontSize: 14, fontWeight: '900' },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  rowPressed: { backgroundColor: '#f8fafc' },
  destinationTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  destinationSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20 },
});
