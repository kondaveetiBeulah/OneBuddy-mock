import { HospitalCatalogItem, DoctorCatalogItem, MedicineCatalogItem, CareProviderItem } from './careService';

export const FALLBACK_HOSPITALS: HospitalCatalogItem[] = [];

export const FALLBACK_DOCTORS: DoctorCatalogItem[] = [];

export const FALLBACK_PROVIDERS: CareProviderItem[] = [];

export const FALLBACK_MEDICINES: MedicineCatalogItem[] = [];

export const FALLBACK_CATEGORY_PRODUCT_MAP: Record<string, MedicineCatalogItem[]> = {};
