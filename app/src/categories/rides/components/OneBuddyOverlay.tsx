import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing, Platform, DimensionValue } from 'react-native';

interface OneBuddyOverlayProps {
  size?: number;
  top?: DimensionValue;
  left?: DimensionValue;
  rideType?: string;
}

const getVehicleIcon = (type?: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('bike')) {
    return require('../assets/vehicles/bike.png');
  }
  if (t.includes('auto')) {
    return require('../assets/vehicles/auto.png');
  }
  if (t.includes('scooter')) {
    return require('../assets/vehicles/scooter.png');
  }
  if (t.includes('xl7')) {
    return require('../assets/vehicles/xl7.png');
  }
  if (t.includes('car') || t.includes('cab') || t.includes('xl4') || t.includes('mini') || t.includes('premier')) {
    return require('../assets/vehicles/car.png');
  }
  return require('../assets/vehicles/car.png');
};

export const OneBuddyOverlay: React.FC<OneBuddyOverlayProps> = ({
  size = 64,
  top = '36%',
  left = '50%',
  rideType,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 5500,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const counterSpin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  // Central logo size & Orbiting taxi size
  const centerLogoSize = Math.round(size * 0.60);
  const badgeSize = Math.round(size * 0.44);

  // Snug orbit bringing the moving taxi right next to / along the rim of the middle logo with minimal gap
  const orbitRadius = centerLogoSize / 2 + badgeSize * 0.12;

  const totalField = (orbitRadius + badgeSize / 2) * 2 + 8;

  return (
    <View
      style={[
        styles.overlayContainer,
        {
          top,
          left,
          width: totalField,
          height: totalField,
          marginLeft: -totalField / 2,
          marginTop: -totalField / 2,
          pointerEvents: 'none' as any,
        },
      ]}
    >
      <View style={[styles.field, { width: totalField, height: totalField }]}>
        {/* Central OneBuddy Logo Plate */}
        <View
          style={[
            styles.centerPlate,
            {
              width: centerLogoSize,
              height: centerLogoSize,
              borderRadius: centerLogoSize / 2,
            },
          ]}
        >
          <Image
            source={require('../assets/onebuddy_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Orbiting Layer containing the Taxi snug to the center logo */}
        <Animated.View
          style={[
            styles.orbitLayer,
            {
              width: orbitRadius * 2,
              height: orbitRadius * 2,
              borderRadius: orbitRadius,
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <View
            style={[
              styles.slot,
              {
                top: -badgeSize / 2,
                left: orbitRadius - badgeSize / 2,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.cabBadge,
                {
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: badgeSize / 2,
                  transform: [{ rotate: counterSpin }],
                },
              ]}
            >
              <Image
                source={getVehicleIcon(rideType)}
                style={styles.cabImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  field: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  orbitLayer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slot: {
    position: 'absolute',
    width: 0,
    height: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cabBadge: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cabImage: {
    width: '90%',
    height: '90%',
  },
  centerPlate: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});
