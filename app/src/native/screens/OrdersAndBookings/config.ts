import type { Group, TabDef } from './types';

export const TABS: TabDef[] = [
  { key: 'all', label: 'All' },
  { key: 'food', label: 'Food', emoji: '🍔' },
  { key: 'groceries', label: 'Groceries', emoji: '🛒' },
  { key: 'rides', label: 'Rides', emoji: '🚗' },
  { key: 'healthcare', label: 'Health Care', emoji: '❤️' },
  { key: 'homeservices', label: 'Home Services', emoji: '🔧' },
];

export const GROUP_ORDER: Group[] = ['Ongoing', 'Upcoming', 'Completed'];
