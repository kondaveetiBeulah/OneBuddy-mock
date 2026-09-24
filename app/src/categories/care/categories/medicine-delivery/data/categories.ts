import { CategoryMetaDef } from '../types';

export const CATEGORY_META: Record<string, CategoryMetaDef> = {
  all: {
    title: 'All Products',
    sub: 'Medicines, supplements, devices & essentials',
    icon: 'box',
    chip: 'All',
  },
  medicines: {
    title: 'Medicines',
    sub: 'Tablets, syrups, injections & pain relief',
    icon: 'pill',
    chip: 'Medicines',
  },
  'fever-pain': {
    title: 'Fever & Pain Relief',
    sub: 'Paracetamol, pain relief gels & fever medicines',
    icon: 'pill',
    chip: 'Fever & Pain',
  },
  'cold-allergy': {
    title: 'Cold & Allergy',
    sub: 'Allergy tablets, syrups & nasal sprays',
    icon: 'drop',
    chip: 'Cold & Allergy',
  },
  'acidity-digestion': {
    title: 'Acidity & Digestion',
    sub: 'Antacid syrups, chewables & digestive health',
    icon: 'drop',
    chip: 'Acidity & Digestion',
  },
  vitamins: {
    title: 'Vitamins & Supplements',
    sub: 'Multivitamins, calcium, protein & immunity',
    icon: 'capsule',
    chip: 'Vitamins & Supplements',
  },
  'first-aid': {
    title: 'First Aid & Wound Care',
    sub: 'Bandages, antiseptics & wound healing',
    icon: 'box',
    chip: 'First Aid & Wound Care',
  },

  prescription: {
    title: 'Prescription Medicines',
    sub: 'Verified Rx medicines with pharmacist check',
    icon: 'pill',
    chip: 'Prescription Medicines',
  },
  'baby-care': {
    title: 'Baby Care',
    sub: 'Gentle baby health, washes & essentials',
    icon: 'box',
    chip: 'Baby Care',
  },
  'personal-care': {
    title: 'Personal Care',
    sub: 'Hygiene, hand sanitizers & daily wellness',
    icon: 'sanitary',
    chip: 'Personal Care',
  },
  'womens-care': {
    title: "Women's Care",
    sub: 'Intimate hygiene, supplements & sanitary care',
    icon: 'sanitary',
    chip: "Women's Care",
  },
  diabetes: {
    title: 'Diabetes Care',
    sub: 'Insulin, strips, syringes & monitoring',
    icon: 'drop',
    chip: 'Diabetes Care',
  },
  devices: {
    title: 'Healthcare Devices',
    sub: 'BP monitors, thermometers, glucometers & equipment',
    icon: 'needle',
    chip: 'Healthcare Devices',
  },
  homeopathy: {
    title: 'Homeopathy Medicines',
    sub: 'Natural drops, dilutions, tablets & healing',
    icon: 'drop',
    chip: 'Homeopathy Medicines',
  },
};

export const CHIP_ORDER = [
  'all',
  'medicines',
  'vitamins',
  'diabetes',
  'devices',
  'homeopathy',
];
