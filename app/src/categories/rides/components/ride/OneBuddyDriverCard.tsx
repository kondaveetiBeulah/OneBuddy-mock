import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../theme';
import type { DriverProfile, RideType } from '../../types/tracking';
import { DriverAvatarGraphic, VehicleCardGraphic } from '../vehicles/VehicleGraphics';

interface OneBuddyDriverCardProps {
  rideType: RideType;
  driver: DriverProfile;
  isDark?: boolean;
}

export function OneBuddyDriverCard({
  rideType,
  driver,
  isDark,
}: OneBuddyDriverCardProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.card,
        isDark && {
          backgroundColor: '#1D1E22',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        },
      ]}
    >
      <View style={styles.topRow}>
        {/* Left: Driver Avatar with verified check */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <DriverAvatarGraphic name={driver.name} size={50} />
            <View style={styles.verifiedCheck}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          </View>
          <View style={[styles.ratingPill, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
            <Text style={styles.star}>★</Text>
            <Text style={[styles.ratingNumber, isDark && { color: '#F1F1EC' }]}>{driver.rating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Middle: Driver & Vehicle Details */}
        <View style={styles.infoSection}>
          <View style={styles.driverNameRow}>
            <Text style={[styles.driverName, isDark && { color: '#F1F1EC' }]}>{driver.name}</Text>
            <Text style={[styles.ridesCount, isDark && { color: '#9BA08F' }]}>({driver.completedRides}+ rides)</Text>
          </View>

          <Text style={[styles.vehicleModel, isDark && { color: '#9BA08F' }]} numberOfLines={1}>
            {driver.vehicleModel}
          </Text>

          {/* Automotive License Plate Pill */}
          <View style={[styles.plateContainer, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
            <View style={styles.plateIndBadge}>
              <Text style={styles.plateIndText}>IND</Text>
            </View>
            <Text style={[styles.plateText, isDark && { color: '#F1F1EC' }]}>{driver.vehiclePlate}</Text>
          </View>
        </View>

        {/* Right: 3/4 Perspective Vehicle Graphic */}
        <View style={styles.vehicleGraphicSection}>
          <VehicleCardGraphic type={rideType} width={100} height={75} />
        </View>
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
    padding: 14,
    marginVertical: 6,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    position: 'relative',
  },
  verifiedCheck: {
    position: 'absolute',
    bottom: -1,
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
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    backgroundColor: COLORS.cardSubtle,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginTop: -6,
  },
  star: {
    fontSize: 9.5,
    color: '#EAB308',
  },
  ratingNumber: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.ink,
    fontFamily: FONTS.display,
  },
  infoSection: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    fontFamily: FONTS.display,
  },
  ridesCount: {
    fontSize: 11.5,
    color: COLORS.mistDim,
    fontFamily: FONTS.body,
  },
  vehicleModel: {
    fontSize: 12,
    color: COLORS.mistDim,
    marginTop: 2,
    marginBottom: 6,
    fontFamily: FONTS.body,
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
  },
  plateIndBadge: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  plateIndText: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '900',
  },
  plateText: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
    fontFamily: FONTS.display,
  },
  vehicleGraphicSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
});
