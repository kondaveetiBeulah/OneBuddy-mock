import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { colors, typography, spacing } from '../theme';
import { GroceryDeliveryLogo } from './GroceryDeliveryLogo';

interface LoadingStateProps {
  message?: string;
  subtitle?: string;
  showLogo?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading groceries...',
  subtitle,
  showLogo = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scaleAnim]);

  return (
    <View style={styles.container}>
      {showLogo && (
        <Animated.View
          style={[
            styles.logoContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <GroceryDeliveryLogo size={52} />
        </Animated.View>
      )}

      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.spinner}
      />

      <Text style={styles.message}>{message}</Text>

      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  spinner: {
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});
