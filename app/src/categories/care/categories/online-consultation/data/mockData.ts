import { Doctor, HealthCategory, DaySlot, TimeSlot } from '../types/doctor';

export const HEALTH_CATEGORIES: HealthCategory[] = [
  { id: 'fever', name: 'Fever & Flu', iconName: 'thermometer-outline', specialtyKey: 'general_physician', description: 'Cold, Cough, Viral & High Temperature', color: '#E11D48', bgColor: '#FFE4E6' },
  { id: 'derma', name: 'Skin Problems', iconName: 'sparkles-outline', specialtyKey: 'dermatologist', description: 'Acne, Skin Rash, Hairfall & Eczema', color: '#D97706', bgColor: '#FEF3C7' },
  { id: 'cardio', name: 'Heart Issues', iconName: 'heart-outline', specialtyKey: 'cardiologist', description: 'Chest Pain, BP & Heart Wellness', color: '#DC2626', bgColor: '#FEE2E2' },
  { id: 'peds', name: 'Child Care', iconName: 'happy-outline', specialtyKey: 'pediatrician', description: 'Child Care, Vaccination & Growth', color: '#2563EB', bgColor: '#DBEAFE' },
  { id: 'anxiety', name: 'Anxiety & Stress', iconName: 'fitness-outline', specialtyKey: 'psychiatrist', description: 'Stress, Sleep Issues & Therapy', color: '#7C3AED', bgColor: '#F3E8FF' },
  { id: 'gynae', name: "Women's Health", iconName: 'woman-outline', specialtyKey: 'gynecologist', description: 'Periods, Pregnancy & Women Health', color: '#BE185D', bgColor: '#FCE7F3' },
  { id: 'ent', name: 'Ear, Nose & Throat', iconName: 'ear-outline', specialtyKey: 'ent_specialist', description: 'Earache, Sinus & Throat Infections', color: '#0D9488', bgColor: '#CCFBF1' },
  { id: 'ortho', name: 'Bone & Joint Pain', iconName: 'body-outline', specialtyKey: 'orthopedic', description: 'Joint Pain, Bone Fracture & Arthritis', color: '#475569', bgColor: '#F1F5F9' },
  { id: 'neuro', name: 'Migraine & Nerves', iconName: 'pulse-outline', specialtyKey: 'neurologist', description: 'Migraine, Nerve Pain & Brain Health', color: '#6366F1', bgColor: '#EEF2FF' },
  { id: 'gastro', name: 'Stomach & Digestion', iconName: 'medkit-outline', specialtyKey: 'gastroenterologist', description: 'Stomach Ache, Acidity, Liver & Digestion', color: '#EA580C', bgColor: '#FFEDD5' },
  { id: 'eye', name: 'Eye Problems', iconName: 'eye-outline', specialtyKey: 'ophthalmologist', description: 'Vision, Cataract & Eye Infections', color: '#0284C7', bgColor: '#E0F2FE' },
  { id: 'dental', name: 'Tooth & Gum Pain', iconName: 'shield-outline', specialtyKey: 'dentist', description: 'Toothache, Cavities & Root Canal', color: '#059669', bgColor: '#D1FAE5' },
  { id: 'homeo', name: 'Homeopathy Care', iconName: 'leaf-outline', specialtyKey: 'homeopathy', description: 'Natural Healing, Chronic Allergies & Constitutional Care', color: '#16A34A', bgColor: '#DCFCE7' },
];

// Hardcoded fields have been removed and moved to backend functions/src/care.
// Doctors are fetched dynamically from the backend care service.
export const MOCK_DOCTORS: Doctor[] = [];

const parseTimeToMinutes = (timeStr: string): number => {
  const parts = timeStr.trim().split(' ');
  if (parts.length < 2) return 0;
  const [hourStr, minStr] = parts[0].split(':');
  let hours = parseInt(hourStr, 10);
  const minutes = parseInt(minStr, 10);
  const modifier = parts[1].toUpperCase();
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

export const generateMockSlots = (): DaySlot[] => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
  const daySlots: DaySlot[] = [];

  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setDate(now.getDate() + i);
    let dayLabel = '';
    if (i === 0) dayLabel = 'Today';
    else if (i === 1) dayLabel = 'Tomorrow';
    else dayLabel = `${dayNames[d.getDay()]}, ${d.getDate()}`;
    const dateFormatted = `${d.getDate()} ${months[d.getMonth()]}`;
    const dateString = d.toISOString().split('T')[0];
    const rawSlotsConfig: { time: string; period: 'morning' | 'afternoon' | 'evening'; baseAvailable: boolean }[] = [
      { time: '09:00 AM', period: 'morning', baseAvailable: true },
      { time: '09:30 AM', period: 'morning', baseAvailable: true },
      { time: '10:00 AM', period: 'morning', baseAvailable: true },
      { time: '10:30 AM', period: 'morning', baseAvailable: false },
      { time: '11:15 AM', period: 'morning', baseAvailable: true },
      { time: '01:00 PM', period: 'afternoon', baseAvailable: true },
      { time: '01:30 PM', period: 'afternoon', baseAvailable: true },
      { time: '02:00 PM', period: 'afternoon', baseAvailable: true },
      { time: '03:15 PM', period: 'afternoon', baseAvailable: true },
      { time: '05:00 PM', period: 'evening', baseAvailable: true },
      { time: '05:45 PM', period: 'evening', baseAvailable: true },
      { time: '06:30 PM', period: 'evening', baseAvailable: false },
      { time: '07:15 PM', period: 'evening', baseAvailable: true },
      { time: '08:00 PM', period: 'evening', baseAvailable: true },
      { time: '08:45 PM', period: 'evening', baseAvailable: true },
    ];
    const slots: TimeSlot[] = rawSlotsConfig.map((slotConfig, idx) => {
      const slotMinutes = parseTimeToMinutes(slotConfig.time);
      let isAvailable = slotConfig.baseAvailable;
      if (i === 0 && slotMinutes <= currentMinutesFromMidnight + 15) {
        isAvailable = false;
      }
      return { id: `${dateString}-slot-${idx}`, time: slotConfig.time, period: slotConfig.period, isAvailable };
    });
    daySlots.push({ dateString, dayLabel, dateFormatted, slots });
  }
  return daySlots;
};

export const COMMON_SYMPTOMS = [
  'High Fever', 'Dry Cough', 'Sore Throat', 'Headache', 'Acne / Pimples',
  'Skin Itching', 'Stomach Pain', 'Fatigue / Weakness', 'Back Pain',
  'Anxiety / Stress', 'Chest Tightness', 'Acidity / Gas', 'Tooth Pain',
  'Eye Redness', 'Migraine',
];
