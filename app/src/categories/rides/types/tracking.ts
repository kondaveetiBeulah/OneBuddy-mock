/**
 * Domain types and interfaces for the 2D Live Ride Booking & Order Tracking.
 */

export type RideType = 'auto' | 'cab' | 'bike';

export interface DriverLocation {
  latitude: number;
  longitude: number;
  /** Bearing / heading in degrees (0 - 360, where 0 is North) */
  heading: number;
  /** Speed in km/h */
  speed?: number;
  /** Timestamp in ms */
  timestamp: number;
}

export interface RouteCoordinates {
  latitude: number;
  longitude: number;
}

export interface DriverProfile {
  name: string;
  avatar: string;
  phone: string;
  rating: number;
  totalRatings?: number;
  vehicleModel: string;
  vehiclePlate: string;
  completedRides: number;
  completedDeliveries?: number;
  vehicleColor?: string;
}

export type RideStatus =
  | 'confirmed'
  | 'driver_arriving'
  | 'at_pickup'
  | 'trip_started'
  | 'trip_completed';

export type DeliveryStatus =
  | 'assigning'
  | 'assigned'
  | 'picked_up'
  | 'on_the_way'
  | 'arriving'
  | 'delivered';

export type TrackingConnectionState = 'connected' | 'reconnecting' | 'offline' | 'error';

export interface RideDetails {
  id: string;
  rideType: RideType;
  pin: string;
  etaMinutes: number;
  distanceText: string;
  walkingTime: string;
  pickupSpotName: string;
  pickupAddress: string;
  dropSpotName: string;
  dropAddress: string;
  status: RideStatus;
  statusTitle: string;
  statusSubtitle: string;
  paymentMethod: string;
  fare: string;
  driver: DriverProfile;
  locationSharingEnabled: boolean;
}

export interface Leg {
  kind: 'Pickup' | 'Drop';
  name: string;
  address: string;
  pendingStamp: string;
  doneStamp: string;
}

export interface OrderItem {
  qty: number;
  name: string;
  note?: string;
  price: string;
}

export interface OrderDetails {
  id: string;
  storeName: string;
  storeAddress: string;
  destinationName: string;
  destinationAddress: string;
  status: DeliveryStatus;
  statusTitle: string;
  statusDescription: string;
  etaMinutes: number;
  arrivalTime: string;
  deliveredTime?: string;
  itemCount: number;
  total: string;
  paidWith: string;
  warningNotice?: string | null;
  driver: DriverProfile;
  originLocation: RouteCoordinates;
  destinationLocation: RouteCoordinates;
}
