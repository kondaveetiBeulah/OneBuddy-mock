import { z } from 'zod';
import { db } from '../../core/firebase';
import { publicCallable } from '../../common/auth';
import { log } from '../../common/logging';
import { CARE_HOSPITALS, CARE_DEPARTMENTS, CARE_TIME_SLOTS } from './data/hospitalsData';
import { CARE_ONLINE_DOCTORS, CARE_HEALTH_CATEGORIES } from './data/onlineConsultationData';
import { CARE_HOME_VISIT_PROVIDERS, CARE_HEALTH_ISSUES } from './data/homeVisitsData';
import { CARE_PRODUCTS, CARE_CATEGORY_PRODUCT_MAP } from './data/medicinesData';

// Schemas
const getCareHospitalsSchema = z.object({
  cityKey: z.string().optional(),
}).optional();

const getCareDoctorsSchema = z.object({
  specialtyKey: z.string().optional(),
}).optional();

const getHomeVisitProvidersSchema = z.object({
  issueId: z.string().optional(),
}).optional();

const getCareMedicinesSchema = z.object({
  category: z.string().optional(),
  query: z.string().optional(),
}).optional();

const getCareCatalogSchema = z.object({}).optional();

const syncCareCatalogSchema = z.object({}).optional();

/**
 * 1. getCareHospitals: Fetches hospitals, departments, and time slots for OP Booking.
 */
export const getCareHospitals = publicCallable(getCareHospitalsSchema, async (data) => {
  log.info('[careFunctions] Fetching care hospitals', { city: data?.cityKey });
  try {
    // Optionally check if Firestore has dynamic entries
    const snap = await db.collection('catalogHospitals').where('active', '==', true).limit(30).get();
    if (!snap.empty) {
      const liveHospitals = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name || 'Hospital',
          branch: d.branch || (typeof d.address === 'object' ? d.address?.area : 'Hyderabad'),
          address: typeof d.address === 'object' ? `${d.address?.line1 || ''}, ${d.address?.area || ''}, ${d.address?.city || 'Hyderabad'}` : (d.address || 'Hyderabad'),
          rating: d.rating || 4.8,
          departments: d.services || d.departments || ['General OPD', 'Cardiology', 'Orthopedics'],
          consultationFee: Math.round((d.opFeeMinor || 80000) / 100),
          distance: d.distance || '2.5 km away',
          imageUrl: d.coverImagePath || d.imageUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=300&q=80',
          description: d.description || '',
          opFee: Math.round((d.opFeeMinor || 80000) / 100),
        };
      });
      return {
        hospitals: liveHospitals,
        departments: CARE_DEPARTMENTS,
        timeSlots: CARE_TIME_SLOTS,
      };
    }
  } catch (err) {
    log.warn('[careFunctions] Firestore catalogHospitals read fallback:', err);
  }

  return {
    hospitals: CARE_HOSPITALS,
    departments: CARE_DEPARTMENTS,
    timeSlots: CARE_TIME_SLOTS,
  };
});

/**
 * 2. getCareDoctors: Fetches doctors & categories for Online Consultation.
 */
export const getCareDoctors = publicCallable(getCareDoctorsSchema, async (data) => {
  log.info('[careFunctions] Fetching care doctors', { specialty: data?.specialtyKey });
  try {
    const snap = await db.collection('catalogDoctors').where('active', '==', true).limit(30).get();
    if (!snap.empty) {
      const liveDoctors = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name,
          gender: d.gender || 'male',
          avatar: d.avatar || d.photoPath || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop',
          specialty: d.specialty || 'Physician',
          specialtyKey: d.specialtyKey || 'general_physician',
          degrees: d.degrees || 'MBBS',
          experienceYears: d.experienceYears || 10,
          hospital: d.hospital || 'Apollo Multi-Specialty Hospital',
          location: d.location || 'Hyderabad',
          rating: d.rating || 4.9,
          totalReviews: d.totalReviews || 500,
          totalConsultations: d.totalConsultations || 2000,
          consultationFee: d.consultationFee || Math.round((d.consultationFeeMinor || 50000) / 100),
          audioConsultationFee: d.audioConsultationFee || 399,
          availableModes: d.availableModes || ['video', 'audio'],
          about: d.about || '',
          languages: d.languages || ['English', 'Hindi', 'Telugu'],
          nextAvailable: d.nextAvailable || 'Today in 15 mins',
          isTopRated: d.isTopRated ?? true,
          isInstantAvailable: d.isInstantAvailable ?? true,
        };
      });

      const filtered = data?.specialtyKey
        ? liveDoctors.filter((doc) => doc.specialtyKey === data.specialtyKey)
        : liveDoctors;

      return {
        doctors: filtered,
        categories: CARE_HEALTH_CATEGORIES,
      };
    }
  } catch (err) {
    log.warn('[careFunctions] Firestore catalogDoctors read fallback:', err);
  }

  const filtered = data?.specialtyKey
    ? CARE_ONLINE_DOCTORS.filter((doc) => doc.specialtyKey === data.specialtyKey)
    : CARE_ONLINE_DOCTORS;

  return {
    doctors: filtered,
    categories: CARE_HEALTH_CATEGORIES,
  };
});

/**
 * 3. getHomeVisitProviders: Fetches providers & health issues for Home Visits.
 */
export const getHomeVisitProviders = publicCallable(getHomeVisitProvidersSchema, async (data) => {
  log.info('[careFunctions] Fetching home visit providers', { issueId: data?.issueId });
  try {
    const snap = await db
      .collection('catalogServiceProviders')
      .where('active', '==', true)
      .where('service', '==', 'care')
      .limit(30)
      .get();

    if (!snap.empty) {
      const liveProviders = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name,
          specialty: d.specialty || d.description || 'Home Care Specialist',
          hospital: d.hospital || 'Apollo Home Care',
          location: d.serviceArea || d.location || 'Hyderabad',
          rating: d.rating || 4.9,
          experience: d.experience || 10,
          fee: d.fee || 500,
          phone: d.phone || '+919876543230',
          initials: d.name ? d.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'HP',
          avatar: d.image || 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=200&auto=format&fit=crop&q=80',
          issueIds: d.serviceTypes || ['nursing', 'checkup', 'injections'],
          symptoms: d.symptoms || ['home care', 'nursing', 'checkup'],
        };
      });

      const filtered = data?.issueId
        ? liveProviders.filter((p) => p.issueIds.includes(data.issueId!))
        : liveProviders;

      return {
        providers: filtered,
        healthIssues: CARE_HEALTH_ISSUES,
      };
    }
  } catch (err) {
    log.warn('[careFunctions] Firestore catalogServiceProviders read fallback:', err);
  }

  const filtered = data?.issueId
    ? CARE_HOME_VISIT_PROVIDERS.filter((p) => p.issueIds.includes(data.issueId!))
    : CARE_HOME_VISIT_PROVIDERS;

  return {
    providers: filtered,
    healthIssues: CARE_HEALTH_ISSUES,
  };
});

/**
 * 4. getCareMedicines: Fetches medicines & categories for Medicine Delivery.
 */
export const getCareMedicines = publicCallable(getCareMedicinesSchema, async (data) => {
  log.info('[careFunctions] Fetching care medicines', { category: data?.category });
  return {
    products: CARE_PRODUCTS,
    categoryMap: CARE_CATEGORY_PRODUCT_MAP,
  };
});

/**
 * 5. getCareCatalog: Fetches all care catalog datasets in one single call.
 */
export const getCareCatalog = publicCallable(getCareCatalogSchema, async () => {
  log.info('[careFunctions] Fetching complete care catalog');
  return {
    hospitals: CARE_HOSPITALS,
    departments: CARE_DEPARTMENTS,
    timeSlots: CARE_TIME_SLOTS,
    doctors: CARE_ONLINE_DOCTORS,
    healthCategories: CARE_HEALTH_CATEGORIES,
    homeVisits: CARE_HOME_VISIT_PROVIDERS,
    healthIssues: CARE_HEALTH_ISSUES,
    medicines: CARE_PRODUCTS,
    medicineCategoryMap: CARE_CATEGORY_PRODUCT_MAP,
  };
});

/**
 * 6. syncCareCatalogToFirestore: Writes all 4 catalog items directly into Firestore collections.
 */
export const syncCareCatalogToFirestore = publicCallable(syncCareCatalogSchema, async () => {
  log.info('[careFunctions] Syncing care catalog to Firestore collections');
  const batch = db.batch();

  // 1. catalogHospitals and subcollections
  for (const h of CARE_HOSPITALS) {
    const hospRef = db.collection('catalogHospitals').doc(h.id);
    batch.set(
      hospRef,
      {
        name: h.name,
        branch: h.branch,
        description: h.description || '',
        image: h.imageUrl || '',
        coverImagePath: h.imageUrl || '',
        address: h.address,
        phoneNumber: '+91 40 2360 7777',
        email: 'info@hospital.com',
        location: { latitude: 17.4156, longitude: 78.4357 },
        services: h.departments,
        departments: ['cardiology', 'orthopedics', 'pediatrics', 'general-opd'],
        facilities: ['24/7 Emergency', 'ICU', 'Pharmacy', 'Diagnostic Lab'],
        rating: h.rating,
        ratingCount: 1000,
        opFeeMinor: (h.opFee || h.consultationFee || 600) * 100,
        distance: h.distance,
        cityKey: 'hyderabad',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    // Subcollections: departments
    const defaultDepts = [
      { id: 'general-opd', name: 'General OPD', desc: 'Outpatient consultations and general triage' },
      { id: 'cardiology', name: 'Cardiology', desc: 'Heart care, ECG, and cardiovascular consultations' },
      { id: 'orthopedics', name: 'Orthopedics', desc: 'Bone, joint, and spine treatments' },
      { id: 'pediatrics', name: 'Pediatrics', desc: 'Infant and child wellness consultations' },
    ];

    for (const dept of defaultDepts) {
      const deptRef = hospRef.collection('departments').doc(dept.id);
      batch.set(
        deptRef,
        {
          name: dept.name,
          description: dept.desc,
          image: h.imageUrl || '',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }

    // Subcollections: doctors and availability
    const doctorsForHospital = CARE_ONLINE_DOCTORS.slice(0, 3);
    for (const d of doctorsForHospital) {
      const docRef = hospRef.collection('doctors').doc(d.id);
      const feeMinor = (d.consultationFee || 500) * 100;

      batch.set(
        docRef,
        {
          name: d.name,
          specialization: d.specialty || 'General Medicine',
          qualification: d.degrees || 'MBBS, MD',
          experienceYears: d.experienceYears || 10,
          image: d.avatar || '',
          departmentId: d.specialtyKey || 'general-opd',
          consultationFeeMinor: feeMinor,
          currency: 'INR',
          languages: d.languages || ['English', 'Hindi', 'Telugu'],
          rating: d.rating || 4.9,
          ratingCount: d.totalReviews || 250,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );

      // Doctor availability slots
      const today = new Date().toISOString().split('T')[0];
      const slotTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
      for (const timeStr of slotTimes) {
        const slotId = `slot-${today}-${timeStr.replace(':', '')}`;
        const slotRef = docRef.collection('availability').doc(slotId);
        batch.set(
          slotRef,
          {
            startAt: new Date(`${today}T${timeStr}:00Z`),
            endAt: new Date(`${today}T${timeStr.slice(0, 2)}:30:00Z`),
            status: 'available',
            appointmentId: null,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }
    }
  }

  // 2. catalogPharmacies
  const defaultPharmacies = [
    {
      id: 'apollo-pharmacy-jubilee',
      name: 'Apollo Pharmacy 24x7',
      description: 'Complete range of genuine medicines and healthcare essentials',
      image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800',
      address: 'Road 36, Jubilee Hills, Hyderabad',
      phoneNumber: '+91 40 2360 8888',
      email: 'jubilee@apollopharmacy.in',
      serviceArea: 'Hyderabad',
      location: { latitude: 17.4326, longitude: 78.4071 },
      deliveryAvailable: true,
      active: true,
      rating: 4.8,
      ratingCount: 1250,
    },
    {
      id: 'medplus-pharmacy-banjara',
      name: 'MedPlus Express Pharmacy',
      description: 'Super-fast prescription medicine delivery and health checks',
      image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800',
      address: 'Road 12, Banjara Hills, Hyderabad',
      phoneNumber: '+91 40 2335 1111',
      email: 'banjara@medplusindia.com',
      serviceArea: 'Hyderabad',
      location: { latitude: 17.4156, longitude: 78.4357 },
      deliveryAvailable: true,
      active: true,
      rating: 4.7,
      ratingCount: 890,
    },
  ];

  for (const ph of defaultPharmacies) {
    const phRef = db.collection('catalogPharmacies').doc(ph.id);
    batch.set(
      phRef,
      {
        ...ph,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }

  // 3. catalogDoctors (legacy flat collection)
  for (const d of CARE_ONLINE_DOCTORS) {
    const ref = db.collection('catalogDoctors').doc(d.id);
    batch.set(
      ref,
      {
        name: d.name,
        gender: d.gender,
        photoPath: d.avatar,
        specialty: d.specialty,
        specialtyKey: d.specialtyKey,
        degrees: d.degrees,
        experienceYears: d.experienceYears,
        hospital: d.hospital,
        location: d.location,
        rating: d.rating,
        totalReviews: d.totalReviews,
        totalConsultations: d.totalConsultations,
        consultationFeeMinor: d.consultationFee * 100,
        audioConsultationFeeMinor: d.audioConsultationFee * 100,
        consultationModes: d.availableModes,
        about: d.about,
        languages: d.languages,
        nextAvailable: d.nextAvailable,
        isTopRated: d.isTopRated,
        isInstantAvailable: d.isInstantAvailable,
        active: true,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }

  // 4. catalogServiceProviders (care & home visits)
  for (const p of CARE_HOME_VISIT_PROVIDERS) {
    const ref = db.collection('catalogServiceProviders').doc(p.id);
    batch.set(
      ref,
      {
        service: 'care',
        name: p.name,
        description: p.specialty,
        image: p.avatar,
        serviceTypes: p.issueIds,
        symptoms: p.symptoms,
        hospital: p.hospital,
        fee: p.fee,
        feeMinor: p.fee * 100,
        phone: p.phone,
        rating: p.rating,
        ratingCount: 150,
        active: true,
        serviceArea: p.location,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }

  // 4b. catalogServiceProviders (homeServices)
  const homeServicesProviders = [
    {
      id: 'hs-1',
      service: 'homeServices',
      name: 'Ramesh Electric Works',
      description: 'Expert home electrical repairs, wiring, and appliance installation',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
      serviceTypes: ['electrical', 'wiring', 'lighting', 'inverter_repair'],
      rating: 4.8,
      ratingCount: 180,
      active: true,
      serviceArea: 'Hyderabad',
    },
    {
      id: 'hs-2',
      service: 'homeServices',
      name: 'QuickClean Home Solutions',
      description: 'Deep cleaning, sofa shampooing, and kitchen sanitization',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
      serviceTypes: ['cleaning', 'deep_cleaning', 'kitchen_cleaning', 'sofa_cleaning'],
      rating: 4.9,
      ratingCount: 220,
      active: true,
      serviceArea: 'Hyderabad',
    },
    {
      id: 'hs-3',
      service: 'homeServices',
      name: 'Praveen Plumbing & Sanitary',
      description: 'Leak fixing, bathroom fittings, pipe repairs, and tank cleaning',
      image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800',
      serviceTypes: ['plumbing', 'pipe_repair', 'water_heater_install', 'tap_repair'],
      rating: 4.7,
      ratingCount: 140,
      active: true,
      serviceArea: 'Hyderabad',
    },
    {
      id: 'pro-1',
      service: 'homeServices',
      name: 'Rajesh Kumar',
      description: 'Super Pro Deep Cleaning & Sanitization Specialist',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      serviceTypes: ['cleaning', 'deep_cleaning', 'kitchen_cleaning', 'sofa_cleaning'],
      rating: 4.92,
      ratingCount: 486,
      active: true,
      serviceArea: 'Hyderabad',
    },
    {
      id: 'pro-2',
      service: 'homeServices',
      name: 'Vikram Shinde',
      description: 'Top Rated Plumbing, Leakage & Pipeline Specialist',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      serviceTypes: ['plumbing', 'pipe_repair', 'tap_repair', 'drainage'],
      rating: 4.88,
      ratingCount: 342,
      active: true,
      serviceArea: 'Hyderabad',
    },
    {
      id: 'pro-3',
      service: 'homeServices',
      name: 'Anil Verma',
      description: 'Master Expert AC Repair & High-Pressure Jet Service',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
      serviceTypes: ['ac_repair', 'ac_services', 'gas_refill', 'water_services'],
      rating: 4.95,
      ratingCount: 620,
      active: true,
      serviceArea: 'Hyderabad',
    },
  ];

  for (const hs of homeServicesProviders) {
    const ref = db.collection('catalogServiceProviders').doc(hs.id);
    batch.set(
      ref,
      {
        ...hs,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }

  // 4b. catalogHomeCategories
  const homeCategories = [
    {
      id: 'house_cleaning',
      title: 'House Cleaning',
      subtitle: 'Deep cleaning, dusting & disinfection',
      icon: 'Sparkles',
      color: '#6366F1',
      gradient: ['#6366F1', '#4F46E5'],
      badge: 'Popular',
      rating: 4.85,
      reviewCount: 1240,
      active: true,
      sortOrder: 1,
    },
    {
      id: 'plumbing_services',
      title: 'Plumbing Services',
      subtitle: 'Leaks, pipes, fittings & drainage',
      icon: 'Wrench',
      color: '#0284C7',
      gradient: ['#0284C7', '#0369A1'],
      badge: 'Fast 30m',
      rating: 4.9,
      reviewCount: 980,
      active: true,
      sortOrder: 2,
    },
    {
      id: 'ac_services',
      title: 'AC Services',
      subtitle: 'Repair, jet service & installation',
      icon: 'Wind',
      color: '#0D9488',
      gradient: ['#0D9488', '#0F766E'],
      badge: 'â‚¹499 Starting',
      rating: 4.88,
      reviewCount: 1560,
      active: true,
      sortOrder: 3,
    },
    {
      id: 'water_services',
      title: 'Water Services',
      subtitle: 'Purifiers, RO, tanks & pump repair',
      icon: 'Droplets',
      color: '#2563EB',
      gradient: ['#2563EB', '#1D4ED8'],
      badge: 'Certified',
      rating: 4.82,
      reviewCount: 840,
      active: true,
      sortOrder: 4,
    },
  ];

  for (const cat of homeCategories) {
    batch.set(
      db.collection('catalogHomeCategories').doc(cat.id),
      {
        ...cat,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }

  // 4c. catalogHomeServices (Subservices)
  const homeSubServices = [
    {
      id: 'hc-1',
      categoryId: 'house_cleaning',
      title: 'Full House Deep Cleaning',
      description: 'Complete top-to-bottom scrub, sanitization of 2BHK/3BHK rooms, balconies and floor polish.',
      price: 1899,
      priceMinor: 189900,
      originalPrice: 2499,
      discountBadge: '24% OFF',
      estimatedTime: '3.5 - 4.5 hrs',
      iconName: 'Home',
      popular: true,
      features: ['Eco-friendly chemicals', 'Machine floor buffing', 'Stain removal guarantee', 'Disinfection included'],
      rating: 4.9,
      reviewsCount: 650,
      active: true,
    },
    {
      id: 'hc-2',
      categoryId: 'house_cleaning',
      title: 'Intensive Kitchen Cleaning',
      description: 'Degreasing chimney, stovetop, cabinets, tiles, exhaust fan and sink sanitation.',
      price: 799,
      priceMinor: 79900,
      originalPrice: 999,
      discountBadge: '20% OFF',
      estimatedTime: '1.5 - 2 hrs',
      iconName: 'Utensils',
      popular: true,
      features: ['Tough grease removal', 'Cabinet internal wipe', 'Tiles de-scaling'],
      rating: 4.85,
      reviewsCount: 420,
      active: true,
    },
    {
      id: 'hc-3',
      categoryId: 'house_cleaning',
      title: 'Bathroom Deep Sanitization',
      description: 'Hard water stain removal from tiles, toilet bowl, taps, mirror and drain unclogging.',
      price: 499,
      priceMinor: 49900,
      originalPrice: 699,
      discountBadge: 'â‚¹200 OFF',
      estimatedTime: '45 - 60 mins',
      iconName: 'Bath',
      features: ['Acid-free safe chemicals', 'Mirror polish', 'Odor neutralization'],
      rating: 4.8,
      reviewsCount: 380,
      active: true,
    },
    {
      id: 'pl-1',
      categoryId: 'plumbing_services',
      title: 'Tap & Mixer Repair / Replacement',
      description: 'Fixing drippy faucets, loose spindle, leaking mixer taps or new tap fitting.',
      price: 249,
      priceMinor: 24900,
      originalPrice: 349,
      discountBadge: 'Popular',
      estimatedTime: '30 mins',
      iconName: 'Wrench',
      popular: true,
      features: ['Teflon seal check', 'Pressure test', '30-day rework warranty'],
      rating: 4.91,
      reviewsCount: 510,
      active: true,
    },
    {
      id: 'pl-2',
      categoryId: 'plumbing_services',
      title: 'Pipe Leakage & Joint Repair',
      description: 'Concealed or exposed PVC/CPVC pipe crack sealing and joint refitting.',
      price: 399,
      priceMinor: 39900,
      originalPrice: 499,
      estimatedTime: '45 - 60 mins',
      iconName: 'AlertCircle',
      popular: true,
      features: ['Non-invasive leak test', 'High-pressure sealants', 'Corrosion inspection'],
      rating: 4.86,
      reviewsCount: 340,
      active: true,
    },
    {
      id: 'ac-1',
      categoryId: 'ac_services',
      title: 'High-Pressure Foam Jet AC Service',
      description: 'Deep indoor & outdoor unit coil wash with jet pump and anti-bacterial foam.',
      price: 499,
      priceMinor: 49900,
      originalPrice: 699,
      discountBadge: 'â‚¹499 Special',
      estimatedTime: '45 mins',
      iconName: 'Wind',
      popular: true,
      features: ['2x faster cooling', 'Jet spray technology', 'Filter & drain tray scrub'],
      rating: 4.95,
      reviewsCount: 890,
      active: true,
    },
    {
      id: 'ac-2',
      categoryId: 'ac_services',
      title: 'AC Gas Refill / Top-up',
      description: 'Nitrogen pressure leak test followed by pure R32/R410A/R22 gas filling.',
      price: 1499,
      priceMinor: 149900,
      originalPrice: 1999,
      discountBadge: '25% OFF',
      estimatedTime: '1 hr',
      iconName: 'Gauge',
      popular: true,
      features: ['Leakage identification', 'Vacuuming before gas charge', '60-day gas warranty'],
      rating: 4.89,
      reviewsCount: 620,
      active: true,
    },
    {
      id: 'wt-1',
      categoryId: 'water_services',
      title: 'RO Water Purifier Service & Filter Clean',
      description: 'Complete sedimentation filter clean, carbon block check and UV chamber testing.',
      price: 499,
      priceMinor: 49900,
      originalPrice: 699,
      discountBadge: 'Popular',
      estimatedTime: '45 mins',
      iconName: 'Droplet',
      popular: true,
      features: ['Genuine parts guarantee', 'Free water TDS testing', 'Booster pump pressure check'],
      rating: 4.87,
      reviewsCount: 460,
      active: true,
    },
  ];

  for (const s of homeSubServices) {
    batch.set(
      db.collection('catalogHomeServices').doc(s.id),
      {
        ...s,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }

  // 4d. catalogHomeBanners
  const homeBanners = [
    {
      id: 'b-1',
      title: 'Mega House Deep Clean',
      subtitle: 'Flat 20% OFF on 2BHK/3BHK full cleaning packages',
      code: 'CLEAN20',
      discount: '20% OFF',
      bgColor: '#4F46E5',
      accentColor: '#818CF8',
      tag: 'LIMITED OFFER',
      categoryId: 'house_cleaning',
      active: true,
    },
    {
      id: 'b-2',
      title: 'Foam Jet AC Super Service',
      subtitle: 'Chill this summer with AC Service starting @ â‚¹499 only',
      code: 'COOL499',
      discount: 'STARTS â‚¹499',
      bgColor: '#0D9488',
      accentColor: '#2DD4BF',
      tag: 'HOT DEAL',
      categoryId: 'ac_services',
      active: true,
    },
    {
      id: 'b-3',
      title: 'Emergency Plumbing 30m',
      subtitle: 'Instant technician arrival for leaks & emergency fixes',
      code: 'PLUMB30',
      discount: 'FAST ARRIVAL',
      bgColor: '#0284C7',
      accentColor: '#38BDF8',
      tag: 'PRIORITY',
      categoryId: 'plumbing_services',
      active: true,
    },
    {
      id: 'b-4',
      title: 'Pure Water Guaranteed',
      subtitle: 'Tank Disinfection + Free TDS Health Test',
      code: 'PUREWATER',
      discount: 'SAVE â‚¹300',
      bgColor: '#2563EB',
      accentColor: '#60A5FA',
      tag: 'WELLNESS',
      categoryId: 'water_services',
      active: true,
    },
  ];

  for (const b of homeBanners) {
    batch.set(
      db.collection('catalogHomeBanners').doc(b.id),
      {
        ...b,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }

  // 4e. Seed Demo Home Services Booking in serviceBookings/{bookingId}
  const demoBookingRef = db.collection('serviceBookings').doc('HS-100291');
  const demoBookingEventRef = demoBookingRef.collection('events').doc('evt-init');
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  batch.set(
    demoBookingRef,
    {
      userId: 'sample_user',
      service: 'homeServices',
      providerId: 'pro-1',
      serviceType: 'Full House Deep Cleaning',
      status: 'confirmed',
      scheduledAt: tomorrow,
      addressSnapshot: {
        name: 'Ravi Teja',
        houseNo: 'Flat 402, Green Valley Apartments',
        landmarkAreaName: 'Near Hitec City Metro',
        state: 'Telangana',
        phoneNumber: '9876543210',
        label: 'Home',
        pincode: '500081',
        line1: 'Flat 402, Green Valley Apartments, Hitec City',
        city: 'Hyderabad',
      },
      quotedPriceMinor: 189900,
      finalPriceMinor: null,
      currency: 'INR',
      notes: 'Deep cleaning with machine floor buffing',
      createdAt: new Date(),
      updatedAt: new Date(),
      providerNameSnapshot: 'Rajesh Kumar (Super Pro)',
    },
    { merge: true }
  );

  batch.set(
    demoBookingEventRef,
    {
      fromStatus: null,
      toStatus: 'confirmed',
      actorId: 'system',
      actorType: 'admin',
      note: 'Booking confirmed and professional Rajesh Kumar assigned',
      createdAt: new Date(),
    },
    { merge: true }
  );

  // 5. catalogMedicines and search projections
  const medEntries = Object.entries(CARE_PRODUCTS).slice(0, 50);
  for (const [id, m] of medEntries) {
    const medRef = db.collection('catalogMedicines').doc(id);
    const pMinor = (m.price || 150) * 100;

    batch.set(
      medRef,
      {
        name: m.name,
        genericName: m.generic || m.name,
        description: `${m.name} manufactured by ${m.manufacturer || 'OneBuddy Pharma'}`,
        image: m.image || '',
        category: m.category || 'General Health',
        manufacturer: m.manufacturer || 'OneBuddy Pharma',
        dosageForm: 'Tablet',
        strength: m.pack || 'Standard Strip',
        prescriptionRequired: !!m.rx,
        priceMinor: pMinor,
        currency: 'INR',
        stockAvailable: 100,
        pharmacyIds: ['apollo-pharmacy-jubilee', 'medplus-pharmacy-banjara'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    // Search Projection
    const projRef = db.collection('catalogSearchProjections').doc(`medicine_${id}`);
    batch.set(
      projRef,
      {
        entityType: 'medicine',
        entityId: id,
        name: m.name,
        description: `${m.name} ${m.generic || ''}`,
        image: m.image || '',
        keywords: [m.name.toLowerCase(), (m.generic || '').toLowerCase(), (m.category || '').toLowerCase()].filter(
          Boolean
        ),
        service: 'care',
        active: true,
        searchable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }

  await batch.commit();
  log.info('[careFunctions] Successfully synced healthcare catalog hierarchy to Firestore');
  return { success: true, message: 'Care catalog and healthcare architecture synced to Firestore' };
});

