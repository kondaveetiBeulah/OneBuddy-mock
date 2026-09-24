export type SentimentValue = 1 | 2 | 3 | 4 | 5;

export const SENTIMENT_FACES = ['😡', '🙁', '😐', '😊', '😍'];

export const STAR_LABELS: Record<number, string> = {
  1: 'Terrible 😞',
  2: 'Bad 🙁',
  3: 'Okay 😐',
  4: 'Good 😊',
  5: 'Loved it! 🤩',
};

export interface FeedbackCategory {
  key: string;
  label: string;
  icon: string;
  bg?: string;
  value: SentimentValue | null;
}

export const initialCategories: FeedbackCategory[] = [
  { key: 'product', label: 'Product Quality & Freshness', icon: '🛍️', bg: '#EFF6FF', value: null },
  { key: 'packaging', label: 'Order Packaging', icon: '📦', bg: '#FDF4FF', value: null },
  { key: 'delivery', label: 'Delivery Experience', icon: '🚚', bg: '#F0FDF4', value: null },
];
