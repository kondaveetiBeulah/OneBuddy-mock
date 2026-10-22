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
  id: '',
  restaurant: '',
  itemCount: 0,
  total: '',
  paidWith: '',
  arrivalTime: '',
  deliveredTime: '',
};

export const LEGS: [Leg, Leg] = [
  {
    kind: 'Pickup',
    name: '',
    address: '',
    pendingStamp: '',
    doneStamp: '',
  },
  {
    kind: 'Drop',
    name: '',
    address: '',
    pendingStamp: '',
    doneStamp: '',
  },
];

export const ORDER_ITEMS: OrderItem[] = [];

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
