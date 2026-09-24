// ---------- Types ----------

export type Category =
  | 'food'
  | 'groceries'
  | 'rides'
  | 'healthcare'
  | 'homeservices';

export type Filter = 'all' | Category;

export type StatusKind = 'ongoing' | 'upcoming' | 'done';

export type Group = 'Ongoing' | 'Upcoming' | 'Completed';

export interface OrderCard {
  id: string;
  category: Category;
  icon: string;
  title: string;
  status: string;
  statusKind: StatusKind;
  subtitle: string;
  actions: string[];
  group: Group;
}

export interface TabDef {
  key: Filter;
  label: string;
  emoji?: string;
}

export interface OrderSection {
  group: Group;
  items: OrderCard[];
}
