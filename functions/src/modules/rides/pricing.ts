import { VehicleType } from '../../domain/enums';

export interface VehicleRateConfig {
  type: VehicleType;
  displayName: string;
  baseFarePaise: number;
  perKmRatePaise: number;
  minimumFarePaise: number;
  platformFeePaise: number;
  avgSpeedKmh: number;
  capacity: number;
}

/**
 * Standard OneBuddy Vehicle Rate Configurations (in Paise minor units).
 */
export const VEHICLE_RATES: Record<VehicleType, VehicleRateConfig> = {
  bike: {
    type: 'bike',
    displayName: 'Moto / Bike',
    baseFarePaise: 2500, // â‚¹25
    perKmRatePaise: 800, // â‚¹8/km
    minimumFarePaise: 3500, // â‚¹35
    platformFeePaise: 500, // â‚¹5
    avgSpeedKmh: 30,
    capacity: 1,
  },
  scooter: {
    type: 'scooter',
    displayName: 'Scooter',
    baseFarePaise: 2500, // â‚¹25
    perKmRatePaise: 800, // â‚¹8/km
    minimumFarePaise: 3500, // â‚¹35
    platformFeePaise: 500, // â‚¹5
    avgSpeedKmh: 30,
    capacity: 1,
  },
  auto: {
    type: 'auto',
    displayName: 'Auto Rickshaw',
    baseFarePaise: 3500, // â‚¹35
    perKmRatePaise: 1200, // â‚¹12/km
    minimumFarePaise: 5000, // â‚¹50
    platformFeePaise: 800, // â‚¹8
    avgSpeedKmh: 24,
    capacity: 3,
  },
  cab: {
    type: 'cab',
    displayName: 'Mini / Prime Cab',
    baseFarePaise: 6000, // â‚¹60
    perKmRatePaise: 1600, // â‚¹16/km
    minimumFarePaise: 9000, // â‚¹90
    platformFeePaise: 1000, // â‚¹10
    avgSpeedKmh: 28,
    capacity: 4,
  },
  xl: {
    type: 'xl',
    displayName: 'Prime SUV / XL',
    baseFarePaise: 10000, // â‚¹100
    perKmRatePaise: 2200, // â‚¹22/km
    minimumFarePaise: 14000, // â‚¹140
    platformFeePaise: 1500, // â‚¹15
    avgSpeedKmh: 28,
    capacity: 6,
  },
};

/**
 * Calculates Great-Circle distance between two coordinates in kilometers using Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  // Round to 2 decimal places with a minimum threshold of 0.5 km
  return Math.max(0.5, Math.round(distance * 100) / 100);
}

export interface RideFareBreakdown {
  vehicleType: VehicleType;
  displayName: string;
  capacity: number;
  distanceKm: number;
  durationMinutes: number;
  baseFarePaise: number;
  distanceFarePaise: number;
  platformFeePaise: number;
  subtotalPaise: number;
  totalFarePaise: number;
  formattedTotal: string; // e.g. "â‚¹145"
  currency: 'INR';
}

/**
 * Calculates fare in paise minor units for a specific vehicle type and distance.
 */
export function calculateVehicleFare(
  vehicleType: VehicleType,
  distanceKm: number
): RideFareBreakdown {
  const config = VEHICLE_RATES[vehicleType];
  const distanceFarePaise = Math.round(distanceKm * config.perKmRatePaise);
  const rawSubtotal = config.baseFarePaise + distanceFarePaise;
  const subtotalPaise = Math.max(config.minimumFarePaise, rawSubtotal);
  const totalFarePaise = subtotalPaise + config.platformFeePaise;

  // Approximate duration: (distance / avgSpeed) * 60 + 3 min traffic buffer
  const durationMinutes = Math.max(
    5,
    Math.round((distanceKm / config.avgSpeedKmh) * 60) + 3
  );

  return {
    vehicleType,
    displayName: config.displayName,
    capacity: config.capacity,
    distanceKm,
    durationMinutes,
    baseFarePaise: config.baseFarePaise,
    distanceFarePaise,
    platformFeePaise: config.platformFeePaise,
    subtotalPaise,
    totalFarePaise,
    formattedTotal: `â‚¹${Math.round(totalFarePaise / 100)}`,
    currency: 'INR',
  };
}

