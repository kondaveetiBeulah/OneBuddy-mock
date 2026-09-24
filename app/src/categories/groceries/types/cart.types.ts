import { Product } from './product.types';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PriceSummaryData {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  itemCount: number;
}
