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
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80',
    fallbackIcon: 'pill',
  },
  {
    id: 'cold-allergy',
    name: 'Cold & Allergy',
    sub: 'Allergy tablets, syrups & nasal sprays',
    imageKey: 'cat-cold-allergy',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&q=80',
    fallbackIcon: 'drop',
  },
  {
    id: 'acidity-digestion',
    name: 'Acidity & Digestion',
    sub: 'Antacid syrups, chewables & digestive health',
    imageKey: 'cat-acidity-digestion',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&q=80',
    fallbackIcon: 'drop',
  },
  {
    id: 'vitamins',
    name: 'Vitamins & Supplements',
    sub: 'Multivitamins, calcium & immunity boosters',
    imageKey: 'cat-vitamins',
    image: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=500&q=80',
    fallbackIcon: 'capsule',
  },
  {
    id: 'first-aid',
    name: 'First Aid & Wound Care',
    sub: 'Bandages, antiseptics & wound healing',
    imageKey: 'cat-first-aid',
    image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&q=80',
    fallbackIcon: 'box',
  },
  {
    id: 'prescription',
    name: 'Prescription Medicines',
    sub: 'Verified Rx medicines with pharmacist check',
    imageKey: 'cat-prescription',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&q=80',
    fallbackIcon: 'pill',
  },
  {
    id: 'baby-care',
    name: 'Baby Care',
    sub: 'Gentle baby health, washes & essentials',
    imageKey: 'cat-baby-care',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&q=80',
    fallbackIcon: 'box',
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    sub: 'Hygiene, hand sanitizers & daily wellness',
    imageKey: 'cat-personal-care',
    image: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500&q=80',
    fallbackIcon: 'sanitary',
  },
  {
    id: 'womens-care',
    name: "Women's Care",
    sub: 'Intimate hygiene, supplements & sanitary care',
    imageKey: 'cat-womens-care',
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&q=80',
    fallbackIcon: 'sanitary',
  },
];
