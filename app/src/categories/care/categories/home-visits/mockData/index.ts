import { Doctor, HealthIssue, TimeSlot } from '../types';

export const healthIssues: HealthIssue[] = [
  { id: 'fever', name: 'Fever & Care', icon: 'thermometer-outline' },
  { id: 'checkup', name: 'General Checkup', icon: 'medkit-outline' },
  { id: 'nursing', name: 'Home Nursing', icon: 'bandage-outline' },
  { id: 'elderly', name: 'Senior Care', icon: 'accessibility-outline' },
  { id: 'pediatric', name: 'Kids Health', icon: 'happy-outline' },
  { id: 'injections', name: 'Injections & IV', icon: 'flask-outline' },
  { id: 'diabetes', name: 'Diabetes Care', icon: 'water-outline' },
  { id: 'skin', name: 'Skin Care', icon: 'sparkles-outline' },
];

const slots = (labels: string[]): TimeSlot[] =>
  labels.map((label, index) => ({ id: `${index}-${label}`, label, available: true }));

export const getDateKey = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
};

// Hardcoded fields have been removed and moved to backend functions/src/care.
// Providers are fetched dynamically from the backend care service.
export const doctors: Doctor[] = [];

