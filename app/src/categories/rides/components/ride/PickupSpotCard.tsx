import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { COLORS, FONTS, RADIUS } from '../../theme';
import type { RideType } from '../../types/tracking';

interface PickupSpotCardProps {
  rideType: RideType;
  pickupSpotName: string;
  paymentMethod: string;
  onOptionsPress?: () => void;
}

export function PickupSpotCard({
  rideType,
  pickupSpotName = 'Meet at your pick-up spot on 100 Ft Road',
  paymentMethod = 'Cash',
  onOptionsPress,
}: PickupSpotCardProps): React.JSX.Element {
  const getHeaderTitle = () => {
    switch (rideType) {
      case 'auto':
        return 'Auto details';
      case 'cab':
        return 'Cab details';
      case 'bike':
        return 'Moto details';
      default:
        return 'Ride details';
    }
  };

  return (
    <View style={styles.card}>
      {/* Top row with section title & 3-dots button */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View style={styles.greenIndicator} />
          <Text style={styles.sectionTitle}>{getHeaderTitle()}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.optionsBtn, pressed && styles.optionsBtnPressed]}
          onPress={onOptionsPress}
          accessibilityRole="button"
          accessibilityLabel="Ride options"
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx={5} cy={12} r={2} fill={COLORS.ink} />
            <Circle cx={12} cy={12} r={2} fill={COLORS.ink} />
            <Circle cx={19} cy={12} r={2} fill={COLORS.ink} />
          </Svg>
        </Pressable>
      </View>

      {/* Main Meet At Spot Title */}
      <Text style={styles.pickupTitle}>{pickupSpotName}</Text>

      {/* Payment pill */}
      <View style={styles.paymentRow}>
        <View style={styles.paymentBadge}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Rect x={2} y={5} width={20} height={14} rx={2} stroke={COLORS.primaryDark} strokeWidth={2} />
            <Circle cx={12} cy={12} r={3} stroke={COLORS.primaryDark} strokeWidth={2} />
            <Path d="M6 12h.01M18 12h.01" stroke={COLORS.primaryDark} strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={styles.paymentText}>{paymentMethod}</Text>
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
    padding: 16,
    marginVertical: 6,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 13.5,
    color: COLORS.ink,
    fontWeight: '700',
    fontFamily: FONTS.display,
  },
  optionsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsBtnPressed: {
    backgroundColor: COLORS.primaryLight,
  },
  pickupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 24,
    marginBottom: 12,
    fontFamily: FONTS.display,
    letterSpacing: -0.3,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(84, 183, 19, 0.25)',
  },
  paymentText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.body,
  },
});
