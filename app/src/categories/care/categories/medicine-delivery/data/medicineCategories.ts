import { IconType } from '../types';

export interface MedicineCategory {
  id: string;
  name: string;
  sub: string;
  image?: string;
  imageKey?: string;
  fallbackIcon: IconType;
}

export const MEDICINE_CATEGORIES: MedicineCategory[] = [
  {
    id: 'fever-pain',
    name: 'Fever & Pain Relief',
    sub: 'Paracetamol, pain relief gels & fever medicines',
    imageKey: 'cat-fever-pain',
    fallbackIcon: 'pill',
  },
  {
    id: 'cold-allergy',
    name: 'Cold & Allergy',
    sub: 'Allergy tablets, syrups & nasal sprays',
    imageKey: 'cat-cold-allergy',
    fallbackIcon: 'drop',
  },
  {
    id: 'acidity-digestion',
    name: 'Acidity & Digestion',
    sub: 'Antacid syrups, chewables & digestive health',
    imageKey: 'cat-acidity-digestion',
    fallbackIcon: 'drop',
  },
  {
    id: 'vitamins',
    name: 'Vitamins & Supplements',
    sub: 'Multivitamins, calcium & immunity boosters',
    imageKey: 'cat-vitamins',
    fallbackIcon: 'capsule',
  },
  {
    id: 'first-aid',
    name: 'First Aid & Wound Care',
    sub: 'Bandages, antiseptics & wound healing',
    imageKey: 'cat-first-aid',
    fallbackIcon: 'box',
  },
  {
    id: 'prescription',
    name: 'Prescription Medicines',
    sub: 'Verified Rx medicines with pharmacist check',
    imageKey: 'cat-prescription',
    fallbackIcon: 'pill',
  },
  {
    id: 'baby-care',
    name: 'Baby Care',
    sub: 'Gentle baby health, washes & essentials',
    imageKey: 'cat-baby-care',
    fallbackIcon: 'box',
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    sub: 'Hygiene, hand sanitizers & daily wellness',
    imageKey: 'cat-personal-care',
    fallbackIcon: 'sanitary',
  },
  {
    id: 'womens-care',
    name: "Women's Care",
    sub: 'Intimate hygiene, supplements & sanitary care',
    imageKey: 'cat-womens-care',
    fallbackIcon: 'sanitary',
  },
];
