/**
 * OrbitingLogo — the animated badge orbit extracted from SplashScreen.
 *
 * Shows the OneBuddy mark at the centre with the five service badges
 * orbiting around it on a dashed ring. Plays the deploy animation once
 * on mount and then keeps spinning indefinitely.
 *
 * Reused on the combined Login / Sign-Up screen so the brand mark appears
 * both on the splash and on the auth screens without duplicating the logic.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { BRAND_IMAGES, SERVICES, schemes } from '@/design/tokens';
import { useAppTheme } from '@/theme/ThemeContext';

const ORBIT_MS = 20_000;
const GUIDE_MS = ORBIT_MS * 2.6;
const DEPLOY_MS = 950;
const DEPLOY_START_MS = 620;
const DEPLOY_EASING = Easing.bezier(0.34, 1.5, 0.5, 1);
const RISE_EASING = Easing.bezier(0.22, 1, 0.36, 1);

interface OrbitingLogoProps {
  /** Override the field size (defaults to min(280, 68vw, 36vh)). */
  size?: number;
}

export default function OrbitingLogo({ size: sizeProp }: OrbitingLogoProps) {
  const { scheme } = useAppTheme();
  const tokens = schemes[scheme];
  const { width, height } = useWindowDimensions();

  const field = sizeProp ?? Math.min(280, width * 0.68, height * 0.36);
  const badge = field * 0.255;
  const orbitR = field * 0.372;
  const plate = field * 0.46;

  /* ── animated values ── */
  const spin = useRef(new Animated.Value(0)).current;
  const guideSpin = useRef(new Animated.Value(0)).current;
  const guideOpacity = useRef(new Animated.Value(0)).current;
  const plateRise = useRef(new Animated.Value(0)).current;
  const deploy = useRef(SERVICES.map(() => new Animated.Value(0))).current;

  /* ── fixed random seeds for badge positions — stable across renders ── */
  const _seeds = useMemo(() => SERVICES.map(() => Math.random()), []);

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: ORBIT_MS,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.timing(guideSpin, {
          toValue: 1,
          duration: GUIDE_MS,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ];
    loops.forEach((l) => l.start());

    const entry = Animated.parallel([
      Animated.timing(plateRise, {
        toValue: 1,
        duration: 900,
        easing: RISE_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(guideOpacity, {
        toValue: 1,
        duration: 600,
        delay: DEPLOY_START_MS + 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      ...SERVICES.map((service, index) =>
        Animated.timing(deploy[index], {
          toValue: 1,
          duration: DEPLOY_MS,
          delay: DEPLOY_START_MS + service.orbitDelay,
          easing: DEPLOY_EASING,
          useNativeDriver: true,
        })
      ),
    ]);
    entry.start();

    return () => {
      loops.forEach((l) => l.stop());
      entry.stop();
    };
  }, [spin, guideSpin, guideOpacity, plateRise, deploy]);

  /* ── derived rotations ── */
  const layerRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const counterRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });
  const guideRotate = guideSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const plateStyle = {
    opacity: plateRise,
    transform: [
      {
        translateY: plateRise.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  return (
    <View style={{ width: field, height: field, alignItems: 'center', justifyContent: 'center' }}>
      {/* Dashed guide ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.center,
          {
            opacity: guideOpacity,
            transform: [{ rotate: guideRotate }],
          },
        ]}
      >
        <Svg width={orbitR * 2} height={orbitR * 2}>
          <Circle
            cx={orbitR}
            cy={orbitR}
            r={orbitR - 1}
            stroke={tokens.ink(0.16)}
            strokeWidth={1}
            strokeDasharray="6 6"
            fill="none"
          />
        </Svg>
      </Animated.View>

      {/* Orbit layer — spins continuously */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: layerRotate }] }]}
      >
        {SERVICES.map((service, index) => (
          <View
            key={service.id}
            style={[
              StyleSheet.absoluteFill,
              styles.center,
              { transform: [{ rotate: `${service.orbitAngle}deg` }] },
            ]}
          >
            <Animated.View
              style={{
                width: badge,
                height: badge,
                transform: [
                  {
                    translateY: deploy[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -orbitR],
                    }),
                  },
                ],
              }}
            >
              {/* Cancel the layer spin so badges stay upright */}
              <Animated.View style={{ flex: 1, transform: [{ rotate: counterRotate }] }}>
                <Animated.View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: tokens.surface1,
                      shadowColor: tokens.shadow(1),
                      borderColor: tokens.ink(0.06),
                      opacity: deploy[index],
                      transform: [
                        { rotate: `${-service.orbitAngle}deg` },
                        {
                          scale: deploy[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.2, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Image
                    source={BRAND_IMAGES.badges[service.id]}
                    style={styles.badgeImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          </View>
        ))}
      </Animated.View>

      {/* Centre mark */}
      <Animated.View
        style={[
          styles.plate,
          {
            width: plate,
            height: plate,
            borderRadius: plate / 2,
            backgroundColor: '#FFFFFF',
          },
          plateStyle,
        ]}
      >
        <Image
          source={BRAND_IMAGES.mark}
          style={{ height: field * 0.335, width: field * 0.335 * (296 / 464) }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  badgeImage: { width: '100%', height: '100%' },
  plate: { alignItems: 'center', justifyContent: 'center' },
});
