import { DestinationItem, PreviousRide, PaymentMethod, SavedPlace, Faq } from './types';

export const INITIAL_DESTINATIONS: DestinationItem[] = [];

export const PREVIOUS_RIDES: PreviousRide[] = [];

export const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', label: 'Cash', isDefault: true },
];

export const INITIAL_SAVED_PLACES: SavedPlace[] = [];

export const FAQS: Faq[] = [
  {
    question: 'How do I cancel a ride?',
    answer:
      'Open your active ride and tap Cancel Ride. Cancellation fees may apply after the driver has been on the way for a few minutes.',
  },
  {
    question: 'How do I get a fare receipt?',
    answer: 'Go to Ride History, tap a trip, and choose Email Receipt.',
  },
  {
    question: 'What if I left something in the vehicle?',
    answer: 'Go to Ride History, open the trip, and tap Report Lost Item to contact the driver.',
  },
  {
    question: 'How do refunds work?',
    answer: 'Approved refunds are credited to your original payment method within 5–7 business days.',
  },
];

export const CANCEL_REASONS: string[] = [
  'Driver is taking too long',
  'Change of plans',
  'Wrong vehicle type',
  'Driver asked to cancel',
  'Booked by mistake',
  'Found another ride',
  'Other reason',
];

export const VEHICLES = [
  { id: 'v1', name: 'Bike', baseFare: 49, image: require('./assets/vehicles/bike.jpg'), type: 'bike', eta: '2 min', capacity: 1 },
  { id: 'v2', name: 'Scooter', baseFare: 59, image: require('./assets/vehicles/bike.jpg'), type: 'scooter', eta: '3 min', capacity: 1 },
  { id: 'v3', name: 'Auto', baseFare: 89, image: require('./assets/vehicles/auto.jpg'), type: 'auto', eta: '4 min', capacity: 3 },
  { id: 'v4', name: 'Car · 4 Seater', baseFare: 178, image: require('./assets/vehicles/cab.jpg'), type: 'cab', eta: '3 min', capacity: 4 },
  { id: 'v5', name: 'XL Car · 7 Seater', baseFare: 248, image: require('./assets/vehicles/cab.jpg'), type: 'cab', eta: '5 min', capacity: 7 },
];
