import { Product } from '../types';

// ==========================================
// BACKEND CARE DATASETS
// ==========================================
// Hardcoded fields have been removed and moved to backend functions/src/care.
// Products are fetched dynamically from the backend care service.
export const PRODUCTS: Record<string, Product> = {};

export const CATEGORY_PRODUCT_MAP: Record<string, string[]> = {
  'fever-pain': ['fp-dolo', 'fp-crocin', 'fp-calpol', 'fp-ibugesic', 'fp-volini'],
  'cold-allergy': ['ca-allegra', 'ca-cetirizine', 'ca-levocet', 'ca-nasivion', 'ca-vicks500'],
  'acidity-digestion': ['ad-digene', 'ad-gelusil', 'ad-panto', 'ad-electral', 'ad-isabgol'],
  vitamins: ['vs-supradyn', 'vs-shelcal', 'vs-becosules', 'vs-neurobion', 'vs-limcee'],
  'first-aid': ['fa-dettol', 'fa-savlon', 'fa-betadine', 'fa-bandaid', 'fa-cotton'],
  prescription: ['rx-amoxicillin', 'rx-azithromycin', 'rx-metformin', 'rx-amlodipine', 'rx-pantoprazole'],
  'baby-care': ['bc-babylotion', 'bc-shampoo', 'bc-babycream', 'bc-sebamed', 'bc-diapers'],
  'personal-care': ['pc-colgate', 'pc-sensodyne', 'pc-handwash', 'pc-dove', 'pc-nivea'],
  'womens-care': ['wc-whisper', 'wc-stayfree', 'wc-sofy', 'wc-sirona', 'wc-intimate'],
};
