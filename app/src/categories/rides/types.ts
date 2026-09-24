export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type DestinationItem = {
  id: string;
  title: string;
  subtitle: string;
  favorite: boolean;
};

export type PreviousRide = {
  id: string;
  title: string;
  date: string;
  fare: string;
  rating: number;
};

export type PaymentMethod = {
  id: string;
  label: string;
  isDefault: boolean;
};

export type SavedPlace = {
  id: string;
  label: string;
  address: string;
  icon: 'home' | 'briefcase' | 'pin';
};

export type Faq = {
  question: string;
  answer: string;
};

export type SettingsState = {
  notifications: boolean;
  darkMode: boolean;
  language: 'English' | 'Telugu' | 'Hindi';
};

export type TabKey = 'ride' | 'previous' | 'profile';

export type ProfilePageKey = 'payment' | 'history' | 'places' | 'help' | 'settings' | null;

export interface RideDetails {
  vehicle: any;
  pickup: any;
  destination: string;
  distance: string;
  time: string;
  totalFare: number;
}

export type RootStackParamList = {
  PickupSelection: { vehicle?: any; pickup?: any; destination?: string };
  SetPrice: { vehicle: any; pickup: any; destination?: string };
  RideConfirmation: { vehicle: any; pickup: any; price?: number; destination?: string };
  CancelRide: { rideDetails: RideDetails };
  LiveTracking: undefined;
};
