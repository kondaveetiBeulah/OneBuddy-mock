/**
 * Ride booking live tracking mock data and presets for Auto, Cab, and Bike.
 */
import type { Leg, OrderItem, RideDetails, RideType } from '../types/tracking';

export type { Leg, OrderItem };

export interface SheetOption {
  title: string;
  subtitle?: string;
  toast: string;
  action?: 'safety' | 'cancel' | 'chat' | 'call';
}

export const RIDE_PRESETS: Record<RideType, RideDetails> = {
  auto: {
    id: '#UB-9042',
    rideType: 'auto',
    pin: '9322',
    etaMinutes: 3,
    distanceText: '860 meters',
    walkingTime: '2 min',
    pickupSpotName: 'Meet at your pick-up spot on 100 Ft Road',
    pickupAddress: '100 Ft Road, Madhapur, Hyderabad',
    dropSpotName: 'Inorbit Mall, Hitech City',
    dropAddress: 'Mindspace Madhapur Rd, Hyderabad',
    status: 'confirmed',
    statusTitle: 'Pick-up in 3 min',
    statusSubtitle: 'Leave now to meet SAI',
    paymentMethod: 'Cash',
    fare: '₹95',
    locationSharingEnabled: false,
    driver: {
      name: 'SAI',
      avatar: 'SAI',
      phone: '+91 98480 22338',
      rating: 5.0,
      totalRatings: 1840,
      vehicleModel: 'Yellow Bajaj RE Optima',
      vehiclePlate: 'AP16TG6843',
      vehicleColor: 'Yellow / Green',
      completedRides: 2450,
      completedDeliveries: 2450,
    },
  },
  cab: {
    id: '#UB-4188',
    rideType: 'cab',
    pin: '7419',
    etaMinutes: 4,
    distanceText: '1.2 km',
    walkingTime: '2 min',
    pickupSpotName: 'Meet at your pick-up spot on 100 Ft Road',
    pickupAddress: '100 Ft Road, Madhapur, Hyderabad',
    dropSpotName: 'Rajiv Gandhi International Airport',
    dropAddress: 'Shamshabad, Hyderabad',
    status: 'confirmed',
    statusTitle: 'Pick-up in 4 min',
    statusSubtitle: 'Leave now to meet Karthik',
    paymentMethod: 'Uber Cash',
    fare: '₹280',
    locationSharingEnabled: false,
    driver: {
      name: 'Karthik',
      avatar: 'KR',
      phone: '+91 99890 54321',
      rating: 4.9,
      totalRatings: 3120,
      vehicleModel: 'White Maruti Suzuki Dzire',
      vehiclePlate: 'TS07UK4192',
      vehicleColor: 'White',
      completedRides: 4890,
      completedDeliveries: 4890,
    },
  },
  bike: {
    id: '#UB-2915',
    rideType: 'bike',
    pin: '5184',
    etaMinutes: 2,
    distanceText: '540 meters',
    walkingTime: '2 min',
    pickupSpotName: 'Meet at your pick-up spot on 100 Ft Road',
    pickupAddress: '100 Ft Road, Madhapur, Hyderabad',
    dropSpotName: 'Cyber Towers, Hitech City',
    dropAddress: 'Hitech City Main Rd, Hyderabad',
    status: 'confirmed',
    statusTitle: 'Pick-up in 2 min',
    statusSubtitle: 'Leave now to meet Ramesh',
    paymentMethod: 'Cash',
    fare: '₹45',
    locationSharingEnabled: false,
    driver: {
      name: 'Ramesh',
      avatar: 'RM',
      phone: '+91 97000 11223',
      rating: 4.8,
      totalRatings: 940,
      vehicleModel: 'Black Bajaj Pulsar 150',
      vehiclePlate: 'TS09EA2041',
      vehicleColor: 'Black',
      completedRides: 1320,
      completedDeliveries: 1320,
    },
  },
};

export const RIDE_HELP_OPTIONS: SheetOption[] = [
  {
    title: 'Safety Toolkit & Emergency',
    subtitle: 'Share trip status with trusted contacts, 24/7 helpline',
    toast: 'Safety Toolkit opened',
    action: 'safety',
  },
  {
    title: 'Contact Driver via Call',
    subtitle: 'Free private call masking your personal number',
    toast: 'Calling driver…',
    action: 'call',
  },
  {
    title: 'Send quick message to driver',
    subtitle: 'Tell driver your landmark or exact gate',
    toast: 'Opening chat…',
    action: 'chat',
  },
  {
    title: 'Cancel ride',
    subtitle: 'No fee charged if cancelled within 2 minutes',
    toast: 'Ride cancellation requested',
    action: 'cancel',
  },
];

export const RIDE_CHAT_OPTIONS: SheetOption[] = [
  { title: 'I am waiting at the pickup spot', toast: 'Sent to driver' },
  { title: 'Please call when you reach 100 Ft Road', toast: 'Sent to driver' },
  { title: 'I am wearing a blue jacket', toast: 'Sent to driver' },
  { title: 'Take the lane next to Taaza Kitchen', toast: 'Sent to driver' },
];

export const LEGS: [Leg, Leg] = [
  {
    kind: 'Pickup',
    name: '100 Ft Road Pickup Spot',
    address: 'Near Taaza Kitchen, Madhapur',
    pendingStamp: '3 min away',
    doneStamp: 'Arrived',
  },
  {
    kind: 'Drop',
    name: 'Inorbit Mall, Hitech City',
    address: 'Mindspace Madhapur Rd, Hyderabad',
    pendingStamp: 'Est 18 min',
    doneStamp: 'Completed',
  },
];

export const ORDER_ITEMS: OrderItem[] = [
  { qty: 1, name: 'Uber Auto Ride (Base fare + Distance)', price: '₹95' },
];
