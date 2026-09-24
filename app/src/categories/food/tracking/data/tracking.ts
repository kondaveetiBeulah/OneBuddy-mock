/** The order this screen is following. Swap for real API data. */

export interface Leg {
  kind: 'Pickup' | 'Drop';
  name: string;
  address: string;
  /** Shown while the leg is still ahead. */
  pendingStamp: string;
  /** Shown once the leg is done. */
  doneStamp: string;
}

export interface OrderItem {
  qty: number;
  name: string;
  note?: string;
  price: string;
}

export interface SheetOption {
  title: string;
  subtitle?: string;
  toast: string;
}

export const ORDER = {
  id: '#45231',
  restaurant: 'Spice Route Kitchen',
  itemCount: 2,
  total: '₹486',
  paidWith: 'OneBuddy Wallet',
  arrivalTime: '8:42 PM',
  deliveredTime: '8:41 PM',
};

export const LEGS: [Leg, Leg] = [
  {
    kind: 'Pickup',
    name: 'Spice Route Kitchen',
    address: 'Road No. 12, Banjara Hills',
    pendingStamp: 'Preparing',
    doneStamp: '8:18 PM',
  },
  {
    kind: 'Drop',
    name: 'Home · Ravi',
    address: 'Flat 402, Lotus Residency, Jubilee Hills',
    pendingStamp: '8:42 PM',
    doneStamp: '8:41 PM',
  },
];

export const ORDER_ITEMS: OrderItem[] = [
  { qty: 1, name: 'Hyderabadi dum biryani', note: 'Boneless · extra raita', price: '₹329' },
  { qty: 1, name: 'Double ka meetha', note: 'Serves one', price: '₹129' },
  { qty: 1, name: 'Delivery & taxes', price: '₹28' },
];

export const HELP_OPTIONS: SheetOption[] = [
  { title: 'Chat with support', subtitle: 'Replies in about 2 minutes', toast: 'Opening chat with support…' },
  { title: 'Report an order issue', subtitle: 'Missing item, spillage, wrong order', toast: 'Order issue reported' },
  {
    title: 'Change the drop location',
    subtitle: 'Only until the rider reaches your street',
    toast: 'Address change sent to Imran',
  },
];

export const CHAT_OPTIONS: SheetOption[] = [
  { title: 'Please call when you arrive', toast: 'Sent — Imran will see it on his ride' },
  { title: 'Leave it at the door', toast: 'Sent — Imran will see it on his ride' },
  { title: 'The gate code is 4402', toast: 'Sent — Imran will see it on his ride' },
];
