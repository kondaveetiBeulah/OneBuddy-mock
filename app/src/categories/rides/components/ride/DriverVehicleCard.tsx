import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../theme';
import type { DriverProfile, RideType } from '../../types/tracking';
import { DriverAvatarGraphic, VehicleCardGraphic } from '../vehicles/VehicleGraphics';

interface DriverVehicleCardProps {
  rideType: RideType;
  driver: DriverProfile;
  onCall?: () => void;
  onMessage?: () => void;
}

export function DriverVehicleCard({
  rideType,
  driver,
}: DriverVehicleCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        {/* Left: Driver Avatar with ⭐ 5.0 Rating Pill */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <DriverAvatarGraphic name={driver.name} size={54} />
            <View style={styles.badgeCheck}>
              <Text style={styles.badgeCheckText}>✓</Text>
            </View>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.starIcon}>★</Text>
            <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Center: Vehicle Graphic (Auto / Cab / Bike) */}
        <View style={styles.vehicleGraphicWrap}>
          <VehicleCardGraphic type={rideType} width={105} height={80} />
        </View>

        {/* Right: Plate & Vehicle Model Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.plateNumber} numberOfLines={1}>
            {driver.vehiclePlate}
          </Text>
          <Text style={styles.vehicleModel} numberOfLines={2}>
            {driver.vehicleModel}
          </Text>
        </View>
      </View>

      {/* Driver Name Row below */}
      <View style={styles.driverNameRow}>
        <Text style={styles.driverLabel}>Your Driver:</Text>
        <Text style={styles.driverName}>{driver.name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 16,
    marginVertical: 6,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarSection: {
    alignItems: 'center',
    position: 'relative',
    marginRight: 6,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    position: 'relative',
  },
  badgeCheck: {
    position: 'absolute',
    bottom: 2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeCheckText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: -8,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  starIcon: {
    fontSize: 10,
    color: '#EAB308',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ink,
    fontFamily: FONTS.display,
  },
  vehicleGraphicWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  detailsSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    maxWidth: '45%',
  },
  plateNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
    fontFamily: FONTS.display,
    letterSpacing: -0.2,
  },
  vehicleModel: {
    fontSize: 12.5,
    color: COLORS.mistDim,
    marginTop: 2,
    textAlign: 'right',
    fontFamily: FONTS.body,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSubtle,
  },
  driverLabel: {
    fontSize: 12,
    color: COLORS.mistDim,
    fontFamily: FONTS.body,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    fontFamily: FONTS.display,
  },
});
