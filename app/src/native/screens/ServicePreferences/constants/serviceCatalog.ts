/**
 * constants/serviceCatalog.ts
 * -----------------------------------------------------------------------
 * Static metadata describing the five services.
 * -----------------------------------------------------------------------
 */
import { DeliveryMode, ServiceKey, ServiceMeta } from '../types';

export const SERVICE_CATALOG: ServiceMeta[] = [
  {
    key: 'food',
    label: 'Food',
    subtitle: 'Restaurants, cafes, and daily meals',
    icon: '🍽️',
    color: '#E8734A',
    modes: ['Express', 'Scheduled', 'Fast'],
  },
  {
    key: 'grocery',
    label: 'Grocery',
    subtitle: 'Weekly staples and household essentials',
    icon: '🛒',
    color: '#4C9A6A',
    modes: ['Express', 'Scheduled', 'Fast'],
  },
  {
    key: 'rides',
    label: 'Rides',
    subtitle: 'Daily commute, airport, and outstation',
    icon: '🚗',
    color: '#3E7CB1',
    modes: ['Economy', 'Premium', 'Priority'],
  },
  {
    key: 'homeServices',
    label: 'Home services',
    subtitle: 'Cleaning, plumbing, electrical, repairs',
    icon: '🧰',
    color: '#8B6CC9',
    modes: ['Express', 'Priority', 'Scheduled'],
  },
  {
    key: 'care',
    label: 'Care',
    subtitle: 'Medicines, prescriptions, and health support',
    icon: '💊',
    color: '#C9557A',
    modes: ['Express', 'Priority', 'Scheduled'],
  },
];

export const DEFAULT_MODE_BY_SERVICE: Record<ServiceKey, DeliveryMode> = {
  food: 'Express',
  grocery: 'Express',
  rides: 'Economy',
  homeServices: 'Priority',
  care: 'Express',
};

export const getServiceMeta = (key: ServiceKey): ServiceMeta => {
  const meta = SERVICE_CATALOG.find((s) => s.key === key);
  if (!meta) {
    throw new Error(`Unknown service key: ${key}`);
  }
  return meta;
};
