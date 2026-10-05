export interface ServiceRateConfig {
  serviceType: string;
  displayName: string;
  baseFeePaise: number;
  hourlyRatePaise: number;
  platformFeePaise: number;
  estimatedDurationHours: number;
}

export const SERVICE_RATES: Record<string, ServiceRateConfig> = {
  // Care services
  nursing: {
    serviceType: 'nursing',
    displayName: 'Home Nursing Care',
    baseFeePaise: 49900, // â‚¹499
    hourlyRatePaise: 20000, // â‚¹200/hr
    platformFeePaise: 5000, // â‚¹50
    estimatedDurationHours: 2,
  },
  elderly_care: {
    serviceType: 'elderly_care',
    displayName: 'Elderly Assistance & Attendant',
    baseFeePaise: 59900, // â‚¹599
    hourlyRatePaise: 18000, // â‚¹180/hr
    platformFeePaise: 5000, // â‚¹50
    estimatedDurationHours: 4,
  },
  physiotherapy: {
    serviceType: 'physiotherapy',
    displayName: 'Home Physiotherapy Session',
    baseFeePaise: 79900, // â‚¹799
    hourlyRatePaise: 0, // Flat per session
    platformFeePaise: 5000, // â‚¹50
    estimatedDurationHours: 1,
  },
  doctor_home_visit: {
    serviceType: 'doctor_home_visit',
    displayName: 'Doctor Home Visit',
    baseFeePaise: 99900, // â‚¹999
    hourlyRatePaise: 0,
    platformFeePaise: 5000, // â‚¹50
    estimatedDurationHours: 1,
  },
  lab_tests: {
    serviceType: 'lab_tests',
    displayName: 'Diagnostic Phlebotomy & Sample Collection',
    baseFeePaise: 29900, // â‚¹299
    hourlyRatePaise: 0,
    platformFeePaise: 3000, // â‚¹30
    estimatedDurationHours: 1,
  },
  // Home services
  cleaning: {
    serviceType: 'cleaning',
    displayName: 'Deep Home Cleaning',
    baseFeePaise: 39900, // â‚¹399
    hourlyRatePaise: 15000, // â‚¹150/hr
    platformFeePaise: 3000, // â‚¹30
    estimatedDurationHours: 3,
  },
  plumbing: {
    serviceType: 'plumbing',
    displayName: 'Plumbing Repair & Inspection',
    baseFeePaise: 29900, // â‚¹299
    hourlyRatePaise: 10000, // â‚¹100/hr
    platformFeePaise: 3000, // â‚¹30
    estimatedDurationHours: 1,
  },
  electrician: {
    serviceType: 'electrician',
    displayName: 'Electrical Repair & Installation',
    baseFeePaise: 29900, // â‚¹299
    hourlyRatePaise: 10000, // â‚¹100/hr
    platformFeePaise: 3000, // â‚¹30
    estimatedDurationHours: 1,
  },
  appliance: {
    serviceType: 'appliance',
    displayName: 'AC & Home Appliance Repair',
    baseFeePaise: 34900, // â‚¹349
    hourlyRatePaise: 12000, // â‚¹120/hr
    platformFeePaise: 3000, // â‚¹30
    estimatedDurationHours: 1,
  },
  painting: {
    serviceType: 'painting',
    displayName: 'Home Painting & Waterproofing',
    baseFeePaise: 49900, // â‚¹499
    hourlyRatePaise: 20000, // â‚¹200/hr
    platformFeePaise: 5000, // â‚¹50
    estimatedDurationHours: 4,
  },
};

export interface BookingQuoteBreakdown {
  serviceType: string;
  displayName: string;
  hours: number;
  baseFeePaise: number;
  durationFeePaise: number;
  platformFeePaise: number;
  subtotalPaise: number;
  taxPaise: number; // 18% GST in paise
  totalPaise: number; // Final integer in paise
  formattedTotal: string; // e.g. "â‚¹884"
  currency: 'INR';
}

/**
 * Normalizes input string to matched rate key
 */
function resolveRateKey(serviceType: string): string {
  const norm = serviceType.toLowerCase().replace(/[^a-z0-9]/g, '_');
  if (norm.includes('nurse') || norm.includes('injection') || norm.includes('infusion') || norm.includes('dressing')) {
    return 'nursing';
  }
  if (norm.includes('elder') || norm.includes('attendant') || norm.includes('patient_care')) {
    return 'elderly_care';
  }
  if (norm.includes('physio') || norm.includes('rehab') || norm.includes('spine')) {
    return 'physiotherapy';
  }
  if (norm.includes('doctor') || norm.includes('opd') || norm.includes('consultation')) {
    return 'doctor_home_visit';
  }
  if (norm.includes('lab') || norm.includes('blood') || norm.includes('sample') || norm.includes('checkup') || norm.includes('test')) {
    return 'lab_tests';
  }
  if (norm.includes('clean') || norm.includes('sanitiz')) {
    return 'cleaning';
  }
  if (norm.includes('plumb') || norm.includes('pipe') || norm.includes('leak')) {
    return 'plumbing';
  }
  if (norm.includes('electr') || norm.includes('wire') || norm.includes('switch')) {
    return 'electrician';
  }
  if (norm.includes('appliance') || norm.includes('ac') || norm.includes('fridge') || norm.includes('refrigerator')) {
    return 'appliance';
  }
  if (norm.includes('paint') || norm.includes('waterproof')) {
    return 'painting';
  }
  return norm;
}

/**
 * Calculates a pricing quote for a service booking strictly in paise minor units.
 * Never uses floating-point values for monetary storage.
 */
export function calculateBookingQuote(
  serviceType: string,
  hoursRequested = 1
): BookingQuoteBreakdown {
  const rateKey = resolveRateKey(serviceType);
  const rateConfig = SERVICE_RATES[rateKey] || {
    serviceType: rateKey,
    displayName: serviceType,
    baseFeePaise: 49900,
    hourlyRatePaise: 15000,
    platformFeePaise: 5000,
    estimatedDurationHours: 1,
  };

  const hours = Math.max(1, Math.min(24, Math.round(hoursRequested)));
  const durationFeePaise = rateConfig.hourlyRatePaise * (hours - 1);
  const subtotalPaise = rateConfig.baseFeePaise + durationFeePaise + rateConfig.platformFeePaise;
  const taxPaise = Math.round(subtotalPaise * 0.18); // 18% GST rounded to nearest paisa
  const totalPaise = subtotalPaise + taxPaise;

  return {
    serviceType: rateConfig.serviceType,
    displayName: rateConfig.displayName,
    hours,
    baseFeePaise: rateConfig.baseFeePaise,
    durationFeePaise,
    platformFeePaise: rateConfig.platformFeePaise,
    subtotalPaise,
    taxPaise,
    totalPaise,
    formattedTotal: `â‚¹${Math.round(totalPaise / 100)}`,
    currency: 'INR',
  };
}

