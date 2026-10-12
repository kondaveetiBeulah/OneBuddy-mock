import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { COLORS, FONTS, RADIUS } from '../../theme';

interface OneBuddyRouteTimelineProps {
  pickupName?: string;
  pickupAddress?: string;
  dropName?: string;
  dropAddress?: string;
  fare?: string;
  paymentMethod?: string;
  onChangeDestination?: () => void;
  isDark?: boolean;
}

export function OneBuddyRouteTimeline({
  pickupName = '100 Ft Road Pickup Spot',
  pickupAddress = 'Near Taaza Kitchen, Madhapur · 2 min walk',
  dropName = 'Inorbit Mall, Hitech City',
  dropAddress = 'Mindspace Madhapur Rd · Est 18 min',
  fare = '₹95',
  paymentMethod = 'Cash',
  onChangeDestination,
  isDark,
}: OneBuddyRouteTimelineProps): React.JSX.Element {
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
      {/* 1. Pickup Spot Row */}
      <View style={styles.stopRow}>
        <View style={styles.iconCol}>
          <View style={styles.pickupDot} />
          <View style={[styles.routeLine, isDark && { backgroundColor: '#3E424B' }]} />
        </View>
        <View style={styles.stopInfo}>
          <Text style={[styles.stopLabel, isDark && { color: '#9BA08F' }]}>PICKUP SPOT</Text>
          <Text style={[styles.stopTitle, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>
            {pickupName}
          </Text>
          <Text style={[styles.stopSubtitle, isDark && { color: '#9BA08F' }]} numberOfLines={1}>
            {pickupAddress}
          </Text>
        </View>
      </View>

      {/* 2. Drop-off Destination Row */}
      <View style={styles.stopRow}>
        <View style={styles.iconCol}>
          <View style={styles.dropSquare} />
        </View>
        <View style={styles.stopInfo}>
          <View style={styles.dropHeaderRow}>
            <Text style={[styles.stopLabel, isDark && { color: '#9BA08F' }]}>DESTINATION</Text>
            {onChangeDestination && (
              <Pressable onPress={onChangeDestination}>
                <Text style={styles.changeLink}>Change</Text>
              </Pressable>
            )}
          </View>
          <Text style={[styles.stopTitle, isDark && { color: '#F1F1EC' }]} numberOfLines={1}>
            {dropName}
          </Text>
          <Text style={[styles.stopSubtitle, isDark && { color: '#9BA08F' }]} numberOfLines={1}>
            {dropAddress}
          </Text>
        </View>
      </View>

      {/* 3. Fare & Payment Row Footer */}
      <View style={[styles.footerRow, isDark && { borderTopColor: 'rgba(255, 255, 255, 0.08)' }]}>
        <View style={[styles.fareBadge, isDark && { backgroundColor: 'rgba(84, 183, 19, 0.18)' }]}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Rect x={2} y={5} width={20} height={14} rx={2} stroke={isDark ? '#66D21E' : COLORS.primaryDark} strokeWidth={2} />
            <Circle cx={12} cy={12} r={3} stroke={isDark ? '#66D21E' : COLORS.primaryDark} strokeWidth={2} />
          </Svg>
          <Text style={[styles.fareText, isDark && { color: '#66D21E' }]}>
            {fare} · {paymentMethod}
          </Text>
        </View>

        <View style={[styles.noSurgeBadge, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
          <Text style={[styles.noSurgeText, isDark && { color: '#9BA08F' }]}>Guaranteed Price</Text>
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
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCol: {
    alignItems: 'center',
    width: 16,
    paddingTop: 3,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#EF4444', // Red pickup square
    borderWidth: 0,
  },
  routeLine: {
    width: 2,
    height: 36,
    backgroundColor: '#D1DEC9',
    marginVertical: 2,
  },
  dropSquare: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary, // Destination green circle
    borderWidth: 0,
  },
  stopInfo: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 8,
  },
  dropHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.mistDim,
    letterSpacing: 0.8,
    fontFamily: FONTS.display,
  },
  changeLink: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.body,
  },
  stopTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 1,
    fontFamily: FONTS.display,
  },
  stopSubtitle: {
    fontSize: 11.5,
    color: COLORS.mistDim,
    marginTop: 1,
    fontFamily: FONTS.body,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSubtle,
  },
  fareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  fareText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    fontFamily: FONTS.display,
  },
  noSurgeBadge: {
    backgroundColor: COLORS.cardSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  noSurgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.mistDim,
    fontFamily: FONTS.body,
  },
});
