export type IconType =
  | 'pill'
  | 'capsule'
  | 'drop'
  | 'syringe'
  | 'needle'
  | 'sanitary'
  | 'pen'
  | 'box';

export interface Product {
  name: string;
  generic?: string;
  price: number;
  mrp?: number;
  rx: boolean;
  icon: IconType;
  category?: string; // legacy chip category: injections / needles / sanitary / pens / medicines
  group?: string;     // vitamins / diabetes / health
  subcat?: string;
  manufacturer?: string;
  pack?: string;
  popular?: boolean;
  diabetes?: boolean;
  brandGroup?: string;
  desc: string;
  image?: string;
}

export interface SubcatDef {
  id: string;
  name: string;
  discount: string;
}

export interface GroupDef {
  title: string;
  subcats: SubcatDef[];
}

export interface CategoryMetaDef {
  title: string;
  sub: string;
  icon: IconType;
  chip: string;
}

export type Screen =
  | 'browse'
  | 'category'
  | 'groupcategory'
  | 'product'
  | 'cart'
  | 'details'
  | 'confirm'
  | 'help'
  | 'orders'
  | 'account'
  | 'chat';

export type PayMethod = 'upi' | 'card' | 'netbanking';

export interface Summary {
  mrpTotal: number;
  item: number;
  savings: number;
  delivery: number;
  discount: number;
  payable: number;
}

export interface OrderItemRecord {
  id: string;
  name: string;
  qty: number;
  price: number;
  icon: IconType;
}

export interface OrderHistoryItem {
  id: string;
  date: string;
  status: 'Delivered' | 'Out for Delivery' | 'Order Placed';
  items: OrderItemRecord[];
  total: number;
  deliveryAddress: string;
}
