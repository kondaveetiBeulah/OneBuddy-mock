import { DestinationItem, PreviousRide, PaymentMethod, SavedPlace, Faq } from './types';

export const INITIAL_DESTINATIONS: DestinationItem[] = [
  {
    id: '1',
    title: 'Road Number 6',
    subtitle: 'Addagutta, Samatha Nagar, Kukatpally, Hyderabad',
    favorite: false,
  },
  {
    id: '2',
    title: 'Shilparamam',
    subtitle: '305, Jubilee Enclave, HITEC City, Hyderabad',
    favorite: false,
  },
  {
    id: '3',
    title: 'TR Square',
    subtitle: 'Jai Hind Gandhi Road, VIP Hills, Jaihind Enclave',
    favorite: false,
  },
  {
    id: '4',
    title: 'Lakeshore Mall',
    subtitle: 'IDA Kukatpally, Kukatpally, Hyderabad, Telangana',
    favorite: false,
  },
  {
    id: '5',
    title: 'Cyber Towers - HITEC City',
    subtitle: 'Hitech City Road, Patrika Nagar, Madhapur, Hyderabad',
    favorite: false,
  },
  {
    id: '6',
    title: 'Yadagirigutta',
    subtitle: 'Yadadri Bhuvanagiri, Telangana, India',
    favorite: false,
  },
  {
    id: '7',
    title: '131a',
    subtitle: 'Road No. 6, Addagutta, Samatha Nagar, Kukatpally',
    favorite: false,
  },
];

export const PREVIOUS_RIDES: PreviousRide[] = [
  { id: 'r1', title: 'Kukatpally Housing Board', date: 'Yesterday, 6:42 PM', fare: '₹186', rating: 5 },
  { id: 'r2', title: 'HITEC City Metro Station', date: '3 Sep, 9:15 AM', fare: '₹142', rating: 4 },
  { id: 'r3', title: 'Jubilee Hills Check Post', date: '29 Aug, 8:03 PM', fare: '₹231', rating: 5 },
  { id: 'r4', title: 'Gachibowli Stadium', date: '24 Aug, 7:20 AM', fare: '₹98', rating: 5 },
];

export const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'p1', label: 'UPI — rider@okhdfcbank', isDefault: true },
  { id: 'p2', label: 'Cash', isDefault: false },
];

export const INITIAL_SAVED_PLACES: SavedPlace[] = [
  { id: 's1', label: 'Home', address: 'VIP Hills, Jaihind Enclave, Hyderabad', icon: 'home' },
  { id: 's2', label: 'Work', address: 'HITEC City, Hyderabad', icon: 'briefcase' },
];

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
