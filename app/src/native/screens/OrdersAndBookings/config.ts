import type { Group, TabDef } from './types';

export const TABS: TabDef[] = [
  { key: 'all', label: 'All' },
  { key: 'food', label: 'Food' },
  { key: 'groceries', label: 'Groceries' },
  { key: 'rides', label: 'Rides' },
  { key: 'healthcare', label: 'Health Care' },
  { key: 'homeservices', label: 'Home Services' },
];

export const GROUP_ORDER: Group[] = ['Ongoing', 'Upcoming', 'Completed'];
