import { Product } from '../types';

// ==========================================
// BACKEND CARE DATASETS
// ==========================================
// Hardcoded fields have been removed and moved to backend functions/src/care.
// Products are fetched dynamically from the backend care service.
export const PRODUCTS: Record<string, Product> = {};

export const CATEGORY_PRODUCT_MAP: Record<string, string[]> = {};
