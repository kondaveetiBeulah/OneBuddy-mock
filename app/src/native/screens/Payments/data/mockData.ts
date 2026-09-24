import { SavedCard, Transaction, UpiHandle } from '../types';

export const INITIAL_WALLET_BALANCE = 1248.0;
export const CASHBACK_EARNED = 86.5;
export const REFUNDS_PENDING = 0;

export const INITIAL_SAVED_CARDS: SavedCard[] = [
  { id: 'card_1', brand: 'Visa', last4: '4821', expiry: '08/28', isDefault: true },
  { id: 'card_2', brand: 'Mastercard', last4: '0099', expiry: '02/27' },
];

export const INITIAL_UPI_HANDLES: UpiHandle[] = [{ id: 'upi_1', vpa: 'user@okhdfc', isDefault: true }];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', title: 'Order #45231 refund', date: '18 Aug, 4:12 PM', amount: 240 },
  { id: 't2', title: 'Grocery order payment', date: '16 Aug, 11:02 AM', amount: -560 },
  { id: 't3', title: 'Cashback credited', date: '12 Aug, 9:30 AM', amount: 45 },
  { id: 't4', title: 'Wallet top-up', date: '05 Aug, 7:45 PM', amount: 1000 },
];

export const QUICK_ADD_AMOUNTS = [100, 250, 500, 1000];

export const formatRupees = (value: number) =>
  `\u20b9${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
