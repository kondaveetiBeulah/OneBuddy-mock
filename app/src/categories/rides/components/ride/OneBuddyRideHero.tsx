import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../theme';

interface OneBuddyRideHeroProps {
  etaMinutes: number;
  driverName: string;
  distanceText: string;
  pin: string;
  statusText?: string;
  isDark?: boolean;
}

export function OneBuddyRideHero({
  etaMinutes = 3,
  driverName = 'SAI',
  distanceText = '860 meters',
  pin = '9322',
  statusText,
  isDark,
}: OneBuddyRideHeroProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {/* Left: ETA & Live Status */}
      <View style={styles.etaCol}>
        <View style={[styles.statusPill, isDark && { backgroundColor: 'rgba(84, 183, 19, 0.2)' }]}>
          <View style={styles.statusDot} />
          <Text style={[styles.statusPillText, isDark && { color: '#66D21E' }]}>
            {statusText ?? 'DRIVER EN ROUTE'}
          </Text>
        </View>

        <Text style={[styles.etaTitle, isDark && { color: '#F1F1EC' }]}>
          Arriving in <Text style={[styles.etaHighlight, isDark && { color: '#66D21E' }]}>{etaMinutes} min</Text>
        </Text>

        <Text style={[styles.etaSubtitle, isDark && { color: '#9BA08F' }]} numberOfLines={1}>
          {driverName} is {distanceText} away on 100 Ft Road
        </Text>
      </View>

      {/* Right: OneBuddy Ride PIN Container */}
      <View style={[styles.pinCol, isDark && { backgroundColor: '#1D1E22', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
        <Text style={[styles.pinLabel, isDark && { color: '#9BA08F' }]}>RIDE PIN</Text>
        <View style={styles.pinBox}>
          {pin.split('').map((digit, idx) => (
            <View key={idx} style={[styles.pinDigit, isDark && { backgroundColor: '#24262B', borderColor: 'rgba(84, 183, 19, 0.3)' }]}>
              <Text style={[styles.pinDigitText, isDark && { color: '#66D21E' }]}>{digit}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 8,
    gap: 12,
  },
  etaCol: {
    flex: 1,
    minWidth: 0,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.6,
    fontFamily: FONTS.display,
  },
  etaTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ink,
    fontFamily: FONTS.display,
    letterSpacing: -0.4,
  },
  etaHighlight: {
    color: COLORS.primary,
  },
  etaSubtitle: {
    fontSize: 13,
    color: COLORS.mistDim,
    marginTop: 2,
    fontWeight: '500',
    fontFamily: FONTS.body,
  },
  pinCol: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryMuted,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  pinLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.8,
    fontFamily: FONTS.display,
    marginBottom: 4,
  },
  pinBox: {
    flexDirection: 'row',
    gap: 4,
  },
  pinDigit: {
    width: 22,
    height: 26,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDigitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: FONTS.display,
  },
});
