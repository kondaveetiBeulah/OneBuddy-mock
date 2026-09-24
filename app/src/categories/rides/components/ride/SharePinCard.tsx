import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS, FONTS, RADIUS } from '../../theme';

interface SharePinCardProps {
  pin: string;
}

export function SharePinCard({ pin = '9322' }: SharePinCardProps): React.JSX.Element {
  const digits = pin.split('');

  return (
    <View style={styles.card}>
      <View style={styles.leftCol}>
        <View style={styles.iconWrap}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2l7 3.5v6.5c0 5-3.5 9-7 10-3.5-1-7-5-7-10V5.5L12 2z"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={12} cy={11} r={2} fill="#FFFFFF" />
          </Svg>
        </View>
        <Text style={styles.label}>Share PIN</Text>
      </View>

      <View style={styles.digitsContainer}>
        {digits.map((digit, index) => (
          <View key={index} style={styles.digitBox}>
            <Text style={styles.digitText}>{digit}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary, // OneBuddy signature vibrant green (#54B713)
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    marginVertical: 10,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.display,
    letterSpacing: 0.3,
  },
  digitsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  digitBox: {
    width: 29,
    height: 33,
    borderRadius: 6,
    backgroundColor: COLORS.primaryDark, // Deep OneBuddy forest green digit container (#3F8A0E)
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  digitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: FONTS.display,
  },
});
