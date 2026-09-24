export interface CartItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    imageUrl: string;
    customization?: string;
    category?: string;
}

export interface CrossSellItem {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    tag?: string;
}

export type DeliveryMode = 'express' | 'standard' | 'schedule';
export type TipAmount = number;

export interface Address {
    id: string;
    label: string;
    houseNo: string;
    building?: string;
    landmark?: string;
    formattedAddress: string;
    receiverName: string;
    receiverPhone: string;
}

export type SentimentValue = 1 | 2 | 3 | 4 | 5;

export interface Category {
  key: string;
  label: string;
  icon: string;
  bg: string;
  color?: string;
  value: SentimentValue | null;
}

export const SENTIMENT_FACES = ["😞", "🙁", "😐", "🙂", "😊"] as const;

export const STAR_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Okay",
  4: "Good",
  5: "Excellent",
};

export const initialCategories: Category[] = [
  { key: "food", label: "Food Quality", icon: "ShoppingBag", bg: "transparent", color: "#6B7280", value: 5 },
  { key: "time", label: "Delivery Time", icon: "Truck", bg: "transparent", color: "#6B7280", value: 4 },
  { key: "packaging", label: "Packaging", icon: "Package", bg: "transparent", color: "#6B7280", value: 5 },
];

