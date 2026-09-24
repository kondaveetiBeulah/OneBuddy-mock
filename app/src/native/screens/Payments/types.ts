export type SavedCard = {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault?: boolean;
};

export type UpiHandle = {
  id: string;
  vpa: string;
  isDefault?: boolean;
};

export type Transaction = {
  id: string;
  title: string;
  date: string;
  amount: number; // positive = credit, negative = debit
};

export type ModalKind =
  | null
  | 'wallet'
  | 'addMoney'
  | 'upiDetail'
  | 'addUpi'
  | 'cardDetail'
  | 'addCard';
