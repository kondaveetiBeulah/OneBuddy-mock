import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerBox, ShimmerCircle, ShimmerText } from '../Shimmer';
import { isCategoryDark } from '@/theme/categoryThemeBridge';

/**
 * Skeleton for a single Ride vehicle option row (Bike, Auto, Mini, Sedan).
 * Matches exact dimensions from RideScreen.tsx styles.rideOptionRow:
 * minHeight: 58, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 5, borderRadius: 12.
 */
export const RideOptionRowSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const cardBg = isDark ? '#1D1E22' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';

  return (
    <View style={[styles.rideOptionRow, { backgroundColor: cardBg, borderColor }]}>
      {/* Vehicle thumbnail 44x40 */}
      <View style={styles.vehicleThumbWrap}>
        <ShimmerBox width={40} height={32} borderRadius={8} isDark={isDark} />
      </View>

      {/* Copy Column */}
      <View style={styles.rideOptionCopy}>
        <View style={styles.rowAlign}>
          <ShimmerText width={70} height={14} borderRadius={4} isDark={isDark} />
          <ShimmerBox width={45} height={14} borderRadius={4} style={{ marginLeft: 6 }} isDark={isDark} />
        </View>
        <ShimmerText width={110} height={11} borderRadius={3} style={{ marginTop: 4 }} isDark={isDark} />
      </View>

      {/* Fare Shimmer */}
      <View style={styles.fareWrap}>
        <ShimmerBox width={50} height={16} borderRadius={4} isDark={isDark} />
      </View>
    </View>
  );
};

/**
 * List of 4 Ride Vehicle option rows.
 */
export const RideOptionsListSkeleton: React.FC<{ count?: number; isDark?: boolean }> = ({
  count = 4,
  isDark: propIsDark,
}) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.rideOptionsList}>
      {items.map((i) => (
        <RideOptionRowSkeleton key={`ride-skel-${i}`} isDark={isDark} />
      ))}
    </View>
  );
};

/**
 * Skeleton for Live Location / Route Inputs while GPS coordinates resolve.
 */
export const RideLocationInputSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();

  return (
    <View style={[styles.locationCard, { backgroundColor: isDark ? '#1D1E22' : '#FFFFFF' }]}>
      <View style={styles.locationInputRow}>
        <ShimmerCircle size={10} isDark={isDark} />
        <ShimmerText width="80%" height={14} borderRadius={4} style={{ marginLeft: 10 }} isDark={isDark} />
      </View>
      <View style={[styles.locationDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]} />
      <View style={styles.locationInputRow}>
        <ShimmerCircle size={10} isDark={isDark} />
        <ShimmerText width="65%" height={14} borderRadius={4} style={{ marginLeft: 10 }} isDark={isDark} />
      </View>
    </View>
  );
};

/**
 * Skeleton for Recent Destination Item row.
 */
export const RideRecentDestinationSkeleton: React.FC<{ isDark?: boolean }> = ({ isDark: propIsDark }) => {
  const isDark = propIsDark !== undefined ? propIsDark : isCategoryDark();

  return (
    <View style={styles.recentRow}>
      <ShimmerCircle size={36} isDark={isDark} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <ShimmerText width="60%" height={14} borderRadius={4} isDark={isDark} />
        <ShimmerText width="85%" height={11} borderRadius={3} style={{ marginTop: 4 }} isDark={isDark} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rideOptionsList: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 6,
  },
  rideOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 5,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  vehicleThumbWrap: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rideOptionCopy: {
    flex: 1,
    paddingHorizontal: 8,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fareWrap: {
    alignItems: 'flex-end',
  },
  locationCard: {
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  locationDivider: {
    height: 1,
    marginVertical: 4,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
