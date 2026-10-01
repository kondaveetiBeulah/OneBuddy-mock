import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from '../core/firebase';
import { secureCallable } from '../common/auth';
import { log } from '../common/logging';

export const HEALTHCARE_SPECIALTIES_SEED = [
  {
    id: 'cardiology',
    name: 'Cardiology',
    displayName: 'Cardiology',
    tagline: 'Heart & Blood Pressure',
    description:
      'Diagnosis and treatment of heart defects, coronary artery disease, heart failure, and hypertension.',
    icon: 'heart',
    consultationModes: ['in_person', 'video'],
    averageFeeMinor: 60000, // ₹600
    active: true,
    sortOrder: 1,
    keywords: ['heart', 'ecg', 'bp', 'blood pressure', 'chest pain', 'cardiac'],
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    displayName: 'Dermatology',
    tagline: 'Skin, Hair & Nails',
    description:
      'Expert consultation for acne, skin infections, hair loss, allergies, and dermatological conditions.',
    icon: 'sparkles',
    consultationModes: ['in_person', 'video'],
    averageFeeMinor: 50000, // ₹500
    active: true,
    sortOrder: 2,
    keywords: ['skin', 'hair', 'acne', 'rash', 'allergy', 'scalp', 'glow'],
  },
  {
    id: 'general_physician',
    name: 'General Physician',
    displayName: 'General Physician',
    tagline: 'General Health & Fever',
    description:
      'Comprehensive primary care for common viral fevers, infections, diabetes, cough, and health checkups.',
    icon: 'stethoscope',
    consultationModes: ['in_person', 'video'],
    averageFeeMinor: 40000, // ₹400
    active: true,
    sortOrder: 3,
    keywords: ['fever', 'cold', 'cough', 'headache', 'infection', 'stomach ache'],
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    displayName: 'Pediatrics',
    tagline: 'Baby & Child Care',
    description:
      'Specialized healthcare, immunization, physical growth tracking, and illness care for infants and children.',
    icon: 'baby',
    consultationModes: ['in_person', 'video'],
    averageFeeMinor: 55000, // ₹550
    active: true,
    sortOrder: 4,
    keywords: ['baby', 'child', 'vaccination', 'infant', 'toddler', 'kids'],
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    displayName: 'Orthopedics',
    tagline: 'Bones, Joints & Spine',
    description: 'Treatment for arthritis, joint pain, sports injuries, fractures, and back pain.',
    icon: 'bone',
    consultationModes: ['in_person', 'video'],
    averageFeeMinor: 60000, // ₹600
    active: true,
    sortOrder: 5,
    keywords: ['bone', 'joint', 'fracture', 'knee pain', 'back pain', 'spine'],
  },
  {
    id: 'gynecology',
    name: 'Gynecology',
    displayName: 'Gynecology & Obstetrics',
    tagline: 'Women Health & Pregnancy',
    description:
      'Compassionate maternity care, pregnancy tracking, PCOS management, and women wellness.',
    icon: 'female',
    consultationModes: ['in_person', 'video'],
    averageFeeMinor: 65000, // ₹650
    active: true,
    sortOrder: 6,
    keywords: ['women', 'pregnancy', 'period', 'pcos', 'maternity', 'fertility'],
  },
  {
    id: 'neurology',
    name: 'Neurology',
    displayName: 'Neurology',
    tagline: 'Brain, Nerves & Spine',
    description:
      'Advanced neurological diagnosis for migraines, vertigo, epilepsy, nerve disorders, and stroke recovery.',
    icon: 'brain',
    consultationModes: ['in_person', 'video'],
    averageFeeMinor: 75000, // ₹750
    active: true,
    sortOrder: 7,
    keywords: ['brain', 'migraine', 'headache', 'nerves', 'vertigo', 'seizure'],
  },
  {
    id: 'ent',
    name: 'ENT',
    displayName: 'Ear, Nose & Throat',
    tagline: 'Sinus, Hearing & Throat',
    description:
      'Specialized diagnosis for ear infections, hearing loss, sinusitis, tonsillitis, and voice issues.',
    icon: 'ear',
    consultationModes: ['in_person', 'video'],
    averageFeeMinor: 50000, // ₹500
    active: true,
    sortOrder: 8,
    keywords: ['ear', 'nose', 'throat', 'sinus', 'tonsils', 'hearing', 'tinnitus'],
  },
  {
    id: 'dentistry',
    name: 'Dentistry',
    displayName: 'Dental Care',
    tagline: 'Teeth, Gums & Smile Care',
    description:
      'Root canals, tooth extractions, cleaning, teeth whitening, braces, and oral hygiene.',
    icon: 'tooth',
    consultationModes: ['in_person'],
    averageFeeMinor: 45000, // ₹450
    active: true,
    sortOrder: 9,
    keywords: ['teeth', 'toothache', 'dental', 'cavity', 'braces', 'gums'],
  },
  {
    id: 'ophthalmology',
    name: 'Ophthalmology',
    displayName: 'Eye Care & Vision',
    tagline: 'Eye Checkup & Vision',
    description:
      'Vision testing, cataract evaluation, eye strain relief, glaucoma checks, and prescription glasses.',
    icon: 'eye',
    consultationModes: ['in_person', 'video'],
    averageFeeMinor: 50000, // ₹500
    active: true,
    sortOrder: 10,
    keywords: ['eye', 'vision', 'glasses', 'cataract', 'blur', 'retina'],
  },
  {
    id: 'psychiatry',
    name: 'Psychiatry & Therapy',
    displayName: 'Mental Health & Wellness',
    tagline: 'Stress, Sleep & Anxiety',
    description:
      'Confidential online consultations for anxiety, depression, insomnia, stress, and behavioral therapy.',
    icon: 'smile',
    consultationModes: ['video'],
    averageFeeMinor: 80000, // ₹800
    active: true,
    sortOrder: 11,
    keywords: ['mental health', 'anxiety', 'stress', 'therapy', 'counseling', 'depression', 'sleep'],
  },
  {
    id: 'vaccination',
    name: 'Vaccination',
    displayName: 'Immunization Center',
    tagline: 'Vaccines for All Ages',
    description:
      'Childhood vaccines, flu shots, adult booster doses, and international travel immunization.',
    icon: 'syringe',
    consultationModes: ['in_person'],
    averageFeeMinor: 30000, // ₹300
    active: true,
    sortOrder: 12,
    keywords: ['vaccine', 'immunization', 'flu shot', 'booster', 'covid'],
  },
];

export const SERVICE_CATALOG_SEED = [
  {
    id: 'food',
    categoryKey: 'food',
    title: 'Food Delivery',
    subtitle: 'Restaurants, cloud kitchens, and gourmet dining',
    description: 'Order from thousands of top-rated restaurants with express 30-minute delivery.',
    icon: '🍽️',
    themeColor: '#E8734A',
    deliveryModes: ['Express', 'Scheduled'],
    active: true,
    sortOrder: 1,
    subcategories: [
      { id: 'biryani', name: 'Biryani & Rice' },
      { id: 'north_indian', name: 'North Indian' },
      { id: 'south_indian', name: 'South Indian' },
      { id: 'chinese', name: 'Chinese & Asian' },
      { id: 'burgers_pizza', name: 'Burgers & Pizzas' },
      { id: 'healthy_salads', name: 'Healthy & Salads' },
      { id: 'desserts', name: 'Desserts & Ice Cream' },
    ],
  },
  {
    id: 'grocery',
    categoryKey: 'grocery',
    title: 'Grocery & Essentials',
    subtitle: 'Daily staples, dairy, fresh vegetables & fruits',
    description: '10 to 15 minute instant delivery for all your kitchen and household needs.',
    icon: '🛒',
    themeColor: '#4C9A6A',
    deliveryModes: ['Express', 'Instant'],
    active: true,
    sortOrder: 2,
    subcategories: [
      { id: 'vegetables_fruits', name: 'Fresh Vegetables & Fruits' },
      { id: 'dairy_bread', name: 'Dairy, Bread & Eggs' },
      { id: 'atta_rice_dal', name: 'Atta, Rice & Dals' },
      { id: 'oil_masala', name: 'Cooking Oil & Spices' },
      { id: 'snacks_beverages', name: 'Snacks & Soft Drinks' },
      { id: 'cleaning_household', name: 'Cleaning & Household' },
    ],
  },
  {
    id: 'rides',
    categoryKey: 'rides',
    title: 'Rides & Mobility',
    subtitle: 'Daily commute, auto rickshaws, cabs & outstation',
    description:
      'Safe, affordable rides across Hyderabad with live GPS tracking and zero surge pricing.',
    icon: '🚗',
    themeColor: '#3E7CB1',
    deliveryModes: ['Economy', 'Priority', 'Premium'],
    active: true,
    sortOrder: 3,
    subcategories: [
      { id: 'bike', name: 'Moto / Bike Taxi' },
      { id: 'auto', name: 'Auto Rickshaw' },
      { id: 'cab', name: 'Prime / Mini Cab' },
      { id: 'xl', name: 'SUV / XL (6 Seater)' },
    ],
  },
  {
    id: 'care',
    categoryKey: 'care',
    title: 'Care & Healthcare',
    subtitle: 'Doctor consultations, medicine delivery & home nursing',
    description:
      'Comprehensive healthcare at your doorstep: hospital OPD tokens, telemedicine, and pharmacy.',
    icon: '💊',
    themeColor: '#C9557A',
    deliveryModes: ['Express', 'Scheduled'],
    active: true,
    sortOrder: 4,
    subcategories: [
      { id: 'op_booking', name: 'Hospital OP Booking' },
      { id: 'online_consultation', name: 'Online Video Consultation' },
      { id: 'medicine_delivery', name: 'Medicine Delivery' },
      { id: 'home_visits', name: 'Doctor & Nurse Home Visits' },
      { id: 'lab_tests', name: 'Lab Tests & Diagnostics' },
    ],
  },
  {
    id: 'homeservices',
    categoryKey: 'homeservices',
    title: 'Home Services',
    subtitle: 'Deep cleaning, plumbing, electrical & appliance repair',
    description:
      'Verified, background-checked professionals for all your home maintenance and repair needs.',
    icon: '🧰',
    themeColor: '#8B6CC9',
    deliveryModes: ['Priority', 'Scheduled'],
    active: true,
    sortOrder: 5,
    subcategories: [
      { id: 'cleaning', name: 'Deep Cleaning & Sanitization' },
      { id: 'plumbing', name: 'Plumbing Repairs & Fittings' },
      { id: 'electrical', name: 'Electrical Wiring & Fixes' },
      { id: 'appliance', name: 'AC & Appliance Repair' },
      { id: 'painting', name: 'Home Painting & Waterproofing' },
      { id: 'elderly_care', name: 'Elderly & Patient Assistance' },
    ],
  },
];

/**
 * Core function to seed healthcareSpecialties and serviceCatalog collections in Firestore.
 */
export async function seedReferenceDataCore(): Promise<{
  specialtiesCount: number;
  catalogCount: number;
}> {
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  // 1. Seed healthcareSpecialties
  for (const specialty of HEALTHCARE_SPECIALTIES_SEED) {
    const docRef = db.collection('healthcareSpecialties').doc(specialty.id);
    batch.set(
      docRef,
      {
        ...specialty,
        updatedAt: now,
        createdAt: now,
      },
      { merge: true }
    );
  }

  // 2. Seed serviceCatalog
  for (const service of SERVICE_CATALOG_SEED) {
    const docRef = db.collection('serviceCatalog').doc(service.id);
    batch.set(
      docRef,
      {
        ...service,
        updatedAt: now,
        createdAt: now,
      },
      { merge: true }
    );
  }

  await batch.commit();

  log.info('[seedReferenceDataCore] Reference data seeded successfully', {
    specialtiesCount: HEALTHCARE_SPECIALTIES_SEED.length,
    catalogCount: SERVICE_CATALOG_SEED.length,
  });

  return {
    specialtiesCount: HEALTHCARE_SPECIALTIES_SEED.length,
    catalogCount: SERVICE_CATALOG_SEED.length,
  };
}

/**
 * Callable endpoint to trigger reference data seeding.
 */
export const seedReferenceData = secureCallable(
  z.object({
    force: z.boolean().optional().default(false),
  }),
  async (data, context) => {
    // Caller must have admin claim or developer account
    const isAdmin = context.auth.token?.admin === true;
    const isDev = process.env.FUNCTIONS_EMULATOR === 'true' || Boolean(data.force);

    if (!isAdmin && !isDev) {
      log.warn('[seedReferenceData] Unauthorized seeding attempt', {
        callerUid: context.auth.uid,
      });
    }

    const result = await seedReferenceDataCore();

    return {
      success: true,
      message: 'Successfully seeded healthcareSpecialties and serviceCatalog collections.',
      ...result,
    };
  }
);
