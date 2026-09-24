import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

import { BRAND_IMAGES, SERVICES, brand, schemes } from '@/design/tokens';
import { useAppTheme } from '@/theme/ThemeContext';
import type { RootScreenProps } from '@/navigation/types';
import { useOtpAuth } from '@/auth/OtpAuthContext';
import { useAuth } from '@/firebase/context/AuthContext';

/* --------------------------------------------------------------- timings --
 * All lifted from `#splash` in the old src/styles/splashHome.css and the
 * launchApp() sequence in src/scripts/main.js.
 */
const ORBIT_MS = 20000;
const GUIDE_MS = ORBIT_MS * 2.6;
const DEPLOY_MS = 950;
const DEPLOY_START_MS = 620;
const RISE_MS = 800;

/** cubic-bezier(.34, 1.5, .5, 1) — the overshoot the badges pop in with. */
const DEPLOY_EASING = Easing.bezier(0.34, 1.5, 0.5, 1);
/** cubic-bezier(.22, 1, .36, 1) — ob-rise. */
const RISE_EASING = Easing.bezier(0.22, 1, 0.36, 1);

const SPEED_LINE_COUNT = 8;

interface SplashScreenProps extends RootScreenProps<'Splash'> {
  onLaunchComplete?: () => void;
  isAuthenticated?: boolean;
}

/**
 * Splash.
 *
 * The orbit is the one piece that does not port line-for-line. In CSS each
 * `.ob-slot` was a 0x0 anchor at the centre and the badge hung outside it —
 * Android clips anything drawn outside its parent's bounds, so every badge
 * would vanish. Each slot here is instead a full-size centred layer that is
 * rotated, with the badge translated outward inside it. Same geometry,
 * nothing lands outside a parent.
 *
 * Counter-rotation is unchanged: layer(+t) -> slot(+a) -> counter(-t) ->
 * badge(-a), so the icons stay upright the whole way round.
 */
export default function SplashScreen({
  navigation,
  onLaunchComplete,
  isAuthenticated: propIsAuthenticated,
}: SplashScreenProps) {
  const { scheme } = useAppTheme();
  const tokens = schemes[scheme];
  const { width, height } = useWindowDimensions();
  const { token } = useOtpAuth();
  const { user } = useAuth();
  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : Boolean(token || user);

  // --field: min(360px, 78vw, 41vh)
  const field = Math.min(360, width * 0.78, height * 0.41);
  const badge = field * 0.255;
  const orbitR = field * 0.372;
  const plate = field * 0.46;

  /* ------------------------------------------------------------- values -- */
  const spin = useRef(new Animated.Value(0)).current;
  const guideSpin = useRef(new Animated.Value(0)).current;
  const guideOpacity = useRef(new Animated.Value(0)).current;
  const guideScale = useRef(new Animated.Value(1)).current;

  // One deploy value per badge: 0 = stowed at the centre, 1 = out on the ring.
  const deploy = useRef(SERVICES.map(() => new Animated.Value(0))).current;

  const plateRise = useRef(new Animated.Value(isAuthenticated ? 1 : 0)).current;
  const nameRise = useRef(new Animated.Value(0)).current;
  const taglineRise = useRef(new Animated.Value(0)).current;
  const ctaRise = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(1)).current;

  const markScaleX = useRef(new Animated.Value(1)).current;
  const markScaleY = useRef(new Animated.Value(1)).current;
  const markShift = useRef(new Animated.Value(0)).current;

  // Thruster animation values (all native-driven via scaleY + translateY)
  const thrusterScale = useRef(new Animated.Value(0)).current;
  const thrusterOpacity = useRef(new Animated.Value(0)).current;

  const shock = useRef(new Animated.Value(0)).current;
  const speedLines = useRef(
    Array.from({ length: SPEED_LINE_COUNT }, () => new Animated.Value(0))
  ).current;
  const speedSeeds = useMemo(
    () =>
      Array.from({ length: SPEED_LINE_COUNT }, () => ({
        left: 6 + Math.random() * 88,
        duration: 300 + Math.random() * 220,
      })),
    []
  );

  const launched = useRef(false);

  /* ------------------------------------------------------ entry sequence -- */
  useEffect(() => {
    if (isAuthenticated) {
      // For authenticated sessions, skip the unauthenticated entry sequence
      return;
    }

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
      // .ob-plate animation: ob-rise .9s, no delay
      Animated.timing(plateRise, {
        toValue: 1,
        duration: 900,
        easing: RISE_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(nameRise, {
        toValue: 1,
        duration: RISE_MS,
        delay: 220,
        easing: RISE_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(taglineRise, {
        toValue: 1,
        duration: RISE_MS,
        delay: 340,
        easing: RISE_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(ctaRise, {
        toValue: 1,
        duration: RISE_MS,
        delay: 460,
        easing: RISE_EASING,
        useNativeDriver: true,
      }),
      // setTimeout(setupSplash, 620) -> .deployed
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
  }, [
    isAuthenticated,
    spin,
    guideSpin,
    guideOpacity,
    plateRise,
    nameRise,
    taglineRise,
    ctaRise,
    deploy,
  ]);

  /* ----------------------------------------------------------- launch -- */
  const launch = useCallback(
    (destination: 'login' | 'signup') => {
      if (launched.current) return;
      launched.current = true;

      const goto = () => {
        if (isAuthenticated) {
          if (onLaunchComplete) {
            onLaunchComplete();
          } else {
            try {
              navigation.replace('Tabs');
            } catch {}
          }
        } else {
          onLaunchComplete?.();
          try {
            navigation.replace('Auth');
          } catch {}
        }
      };
      // Same failsafe the document had: never strand the person on the splash
      // if something in the sequence misbehaves.
      const failsafe = setTimeout(goto, 2300);

      // Stow the badges and shrink the guide ring.
      Animated.parallel([
        ...deploy.map((value) =>
          Animated.timing(value, {
            toValue: 0,
            duration: 340,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          })
        ),
        Animated.timing(guideScale, {
          toValue: 0.2,
          duration: 340,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(textFade, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // t+330: squash and light the thruster.
      const squash = setTimeout(() => {
        Animated.parallel([
          Animated.timing(markScaleX, {
            toValue: 1.07,
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(markScaleY, {
            toValue: 0.9,
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(markShift, {
            toValue: 14,
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(thrusterOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(thrusterScale, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      }, 330);

      // t+760: blast off.
      const blast = setTimeout(() => {
        Animated.parallel([
          Animated.timing(markScaleX, {
            toValue: 0.82,
            duration: 620,
            easing: Easing.bezier(0.5, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(markScaleY, {
            toValue: 1.32,
            duration: 620,
            easing: Easing.bezier(0.5, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(markShift, {
            toValue: -height * 1.3,
            duration: 620,
            easing: Easing.bezier(0.5, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(shock, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          ...speedLines.map((value, index) =>
            Animated.loop(
              Animated.timing(value, {
                toValue: 1,
                duration: speedSeeds[index].duration,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              { iterations: 3 }
            )
          ),
        ]).start();

        const hop = setTimeout(() => {
          clearTimeout(failsafe);
          goto();
        }, 640);
        timers.current.push(hop);
      }, 760);

      timers.current.push(failsafe, squash, blast);
      void destination;
    },
    [
      deploy,
      guideScale,
      textFade,
      markScaleX,
      markScaleY,
      markShift,
      thrusterOpacity,
      thrusterScale,
      shock,
      speedLines,
      speedSeeds,
      height,
      navigation,
      isAuthenticated,
      onLaunchComplete,
    ]
  );

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  /* ------------------------------------------------------- auto launch -- */
  useEffect(() => {
    if (isAuthenticated) {
      // For authenticated sessions: show only the launch animation (not get started page)
      const autoLaunch = setTimeout(() => {
        launch('signup');
      }, 60);
      return () => clearTimeout(autoLaunch);
    }
  }, [isAuthenticated, launch]);

  /* --------------------------------------------------------- derived -- */
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

  const rise = (value: Animated.Value) => ({
    opacity: Animated.multiply(value, textFade),
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
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
    <View style={[styles.root, { backgroundColor: tokens.bgDeep }]}>
      <View style={styles.stack}>
        <View style={{ width: field, height: field, alignItems: 'center', justifyContent: 'center' }}>
          {/* .ob-guide — dashed ring, counter-spinning */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.center,
              {
                opacity: guideOpacity,
                transform: [{ rotate: guideRotate }, { scale: guideScale }],
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

          {/* .ob-layer — the whole orbit turning once every 20s */}
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
                  {/* .ob-counter — cancels the layer spin */}
                  <Animated.View style={{ flex: 1, transform: [{ rotate: counterRotate }] }}>
                    {/* .ob-badge — cancels its own slot angle, pops in */}
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

          {/* .ob-mark — plate, thruster, and the thing that flies away */}
          <Animated.View
            style={[
              styles.center,
              {
                transform: [
                  { translateY: markShift },
                  { scaleX: markScaleX },
                  { scaleY: markScaleY },
                ],
              },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.thruster,
                {
                  width: field * 0.17,
                  height: plate * 2,
                  top: plate * 0.86,
                  opacity: thrusterOpacity,
                  transform: [
                    {
                      translateY: thrusterScale.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-plate, 0],
                      }),
                    },
                    { scaleY: thrusterScale },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={[brand.goldLight, 'rgba(126,196,0,0.5)', 'rgba(126,196,0,0)']}
                locations={[0, 0.42, 1]}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

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
          </Animated.View>
        </View>

        {/* .ob-name — wordmark, tagline, CTA (only shown on Get Started page when not logged in) */}
        {!isAuthenticated && (
          <View style={{ marginTop: field * 0.055, alignItems: 'center' }}>
            <Animated.Text
              style={[styles.wordmark, { color: tokens.text }, rise(nameRise)]}
            >
              One<Text style={{ color: brand.gold }}>Buddy</Text>
            </Animated.Text>

            <Animated.Text
              style={[styles.tagline, { color: tokens.textDim }, rise(taglineRise)]}
            >
              One App. Many Services. <Text style={styles.taglineStrong}>One Buddy.</Text>
            </Animated.Text>

            <Animated.View style={[styles.cta, rise(ctaRise)]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => launch('signup')}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
              >
                <LinearGradient
                  colors={[brand.goldLight, brand.gold]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.primaryLabel}>Get started</Text>
              </Pressable>

              <View style={styles.altRow}>
                <Pressable accessibilityRole="button" onPress={() => launch('login')}>
                  <Text style={[styles.altLabel, { color: tokens.textDim }]}>Log in</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => launch('signup')}>
                  <Text style={[styles.altLabel, { color: tokens.textDim }]}>Sign up</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        )}
      </View>

      {/* .speed-lines */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {speedLines.map((value, index) => (
          <Animated.View
            key={index}
            style={[
              styles.speedLine,
              {
                left: `${speedSeeds[index].left}%`,
                opacity: value.interpolate({
                  inputRange: [0, 0.2, 1],
                  outputRange: [0, 1, 0],
                }),
                transform: [
                  {
                    translateY: value.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-100, height],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', tokens.text, 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ))}
      </View>

      {/* .shock-ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shockRing,
          {
            borderColor: brand.gold,
            opacity: shock.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [
              { scale: shock.interpolate({ inputRange: [0, 1], outputRange: [0, 5] }) },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  stack: { alignItems: 'center' },
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
  thruster: { position: 'absolute', borderRadius: 999, overflow: 'hidden' },
  wordmark: { fontSize: 42, fontWeight: '700', lineHeight: 46 },
  tagline: { marginTop: 8, fontSize: 14, fontWeight: '500' },
  taglineStrong: { fontWeight: '600', color: brand.gold },
  cta: { marginTop: 28, alignItems: 'center', gap: 15 },
  primaryButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 40,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { color: brand.ink, fontWeight: '600', fontSize: 16 },
  altRow: { flexDirection: 'row', gap: 26 },
  altLabel: { fontSize: 14, fontWeight: '500' },
  speedLine: { position: 'absolute', top: 0, width: 2, height: 150 },
  shockRing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -50,
    marginLeft: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
});
