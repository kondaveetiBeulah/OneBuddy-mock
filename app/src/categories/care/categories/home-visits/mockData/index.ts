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

export const doctors: Doctor[] = [
  {
    id: 'hv-doc-1',
    name: 'Dr. Rajesh Sharma',
    specialty: 'Senior General Physician',
    hospital: 'Apollo Clinic & Home Care',
    location: 'Banjara Hills, Hyderabad',
    rating: 4.9,
    experience: 14,
    fee: 499,
    phone: '+91 98765 43210',
    initials: 'RS',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    issueIds: ['checkup', 'fever', 'elderly', 'diabetes'],
    symptoms: ['fever', 'cold', 'diabetes monitoring', 'general wellness'],
    slots: {},
  },
  {
    id: 'hv-doc-2',
    name: 'Sister Mary Joseph',
    specialty: 'Certified Home Nursing Specialist',
    hospital: 'Care Health Services',
    location: 'Jubilee Hills, Hyderabad',
    rating: 4.8,
    experience: 9,
    fee: 399,
    phone: '+91 98765 43211',
    initials: 'MJ',
    avatar: 'https://images.unsplash.com/photo-1594824813627-2c90ad749e31?w=200&auto=format&fit=crop&q=80',
    issueIds: ['nursing', 'injections', 'elderly'],
    symptoms: ['wound dressing', 'IV drips', 'post-surgery care', 'vital checks'],
    slots: {},
  },
  {
    id: 'hv-doc-3',
    name: 'Dr. Ananya Iyer',
    specialty: 'Dermatology & Skin Care',
    hospital: 'MaxCure Hospitals',
    location: 'Hitec City, Hyderabad',
    rating: 4.9,
    experience: 11,
    fee: 599,
    phone: '+91 98765 43212',
    initials: 'AI',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80',
    issueIds: ['skin', 'checkup'],
    symptoms: ['skin rash', 'allergies', 'hair treatment', 'acne check'],
    slots: {},
  },
];

