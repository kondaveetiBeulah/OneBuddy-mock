/**
 * Domain types and interfaces for the 2D Live Order Tracking screen.
 */

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
  completedDeliveries: number;
}

export type DeliveryStatus =
  | 'assigning'
  | 'assigned'
  | 'picked_up'
  | 'on_the_way'
  | 'arriving'
  | 'delivered';

export type TrackingConnectionState = 'connected' | 'reconnecting' | 'offline' | 'error';

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

export type CameraMode = 'follow' | 'route';

export interface Stage {
  riderName?: string;
  avatar?: string;
  riderMeta?: string;
  searching?: boolean;
}
