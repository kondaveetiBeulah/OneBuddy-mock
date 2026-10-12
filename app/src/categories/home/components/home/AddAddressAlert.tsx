import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  BackHandler,
} from 'react-native';
import { MapPin, X } from 'lucide-react-native';
import { useHomeTheme, COLORS, RADII, SPACING, SHADOWS } from '../../theme';

interface AddAddressAlertProps {
  visible: boolean;
  onAddAddress: () => void;
  onSkip: () => void;
}

export const AddAddressAlert: React.FC<AddAddressAlertProps> = ({
  visible,
  onAddAddress,
  onSkip,
}) => {
  const { colors } = useHomeTheme();
  const [shouldRender, setShouldRender] = React.useState(visible);
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(visible ? 1 : 0.9)).current;
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      if (visible) {
        fadeAnim.setValue(1);
        scaleAnim.setValue(1);
        setShouldRender(true);
        return;
      }
    }

    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onSkip();
      return true;
    });
    return () => sub.remove();
  }, [visible, onSkip]);

  if (!shouldRender) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onSkip}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              backgroundColor: colors.backdrop,
              opacity: fadeAnim,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.dialogCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Close 'X' button */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.surfaceSubtle }]}
          activeOpacity={0.7}
          onPress={onSkip}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Location Icon Circle */}
        <View style={styles.iconCircle}>
          <MapPin size={32} color={COLORS.primary} />
        </View>

        {/* Title & Description */}
        <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>
          Add Delivery Address
        </Text>
        <Text style={[styles.dialogDesc, { color: colors.textSecondary }]}>
          Please add your home address to see live technician availability, accurate arrival slots & instant pricing.
        </Text>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.addAddressButton}
          activeOpacity={0.8}
          onPress={onAddAddress}
        >
          <Text style={styles.addAddressButtonText}>Add Address Now</Text>
        </TouchableOpacity>

        {/* Skip Option Button */}
        <TouchableOpacity
          style={styles.skipButton}
          activeOpacity={0.7}
          onPress={onSkip}
        >
          <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
            Skip for now
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 99,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    ...SHADOWS.lg,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 32,
    height: 32,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  dialogDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  addAddressButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  addAddressButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: SPACING.sm + 2,
    marginTop: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
