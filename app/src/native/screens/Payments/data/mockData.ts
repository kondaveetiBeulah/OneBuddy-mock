import { SavedCard, Transaction, UpiHandle } from '../types';

export const INITIAL_WALLET_BALANCE = 0;
export const CASHBACK_EARNED = 0;
export const REFUNDS_PENDING = 0;

export const INITIAL_SAVED_CARDS: SavedCard[] = [];
export const INITIAL_UPI_HANDLES: UpiHandle[] = [];
export const MOCK_TRANSACTIONS: Transaction[] = [];

export const QUICK_ADD_AMOUNTS = [100, 250, 500, 1000];

export const formatRupees = (value: number) =>
  `\u20b9${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
