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

export const DEFAULT_SLOT_LABELS = [
  '09:00 AM - 10:00 AM',
  '10:30 AM - 11:30 AM',
  '12:00 PM - 01:00 PM',
  '02:30 PM - 03:30 PM',
  '04:00 PM - 05:00 PM',
  '05:30 PM - 06:30 PM',
  '07:00 PM - 08:00 PM',
];

export const getDefaultSlotsForDate = (dateKey: string): TimeSlot[] => {
  return DEFAULT_SLOT_LABELS.map((label, index) => ({
    id: `slot-${dateKey}-${index}`,
    label,
    available: true,
  }));
};

export const getDateKey = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
};

export const doctors: Doctor[] = [];


