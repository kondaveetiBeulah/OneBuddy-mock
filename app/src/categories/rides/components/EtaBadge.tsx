import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, GUTTER } from '../theme';

interface EtaBadgeProps {
  etaMinutes: number;
  arrivalTime: string;
  deliveredTime: string;
  pulse: Animated.Value;
  reduceMotion?: boolean;
}

export function EtaBadge({
  etaMinutes,
  arrivalTime,
  deliveredTime,
  pulse,
  reduceMotion = false,
}: EtaBadgeProps): React.JSX.Element {
  return (
    <View style={[styles.eta, { bottom: 18 }]}>
      <View style={styles.etaPulseWrap}>
        <View style={styles.etaDot} />
        {reduceMotion ? null : (
          <Animated.View
            style={[
              styles.etaRipple,
              {
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.1] }) }],
              },
            ]}
          />
        )}
      </View>
      <View>
        <Text style={styles.etaNum}>
          {etaMinutes > 0 ? etaMinutes : 'Done'}
          {etaMinutes > 0 ? <Text style={styles.etaUnit}> min</Text> : null}
        </Text>
        <Text style={styles.etaLabel}>
          {etaMinutes > 0 ? `Estimated arrival ${arrivalTime}` : `Delivered at ${deliveredTime}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eta: {
    position: 'absolute',
    left: GUTTER,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#E0EAE0',
    shadowColor: '#182017',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  etaPulseWrap: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  etaDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  etaRipple: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  etaNum: { color: COLORS.ink, fontSize: 19, fontWeight: '800', lineHeight: 22, fontFamily: FONTS.display },
  etaUnit: { fontSize: 13, fontWeight: '600', color: COLORS.mistDim, fontFamily: FONTS.body },
  etaLabel: { color: COLORS.mistDim, fontSize: 11.5, marginTop: 1, fontFamily: FONTS.body },
});
