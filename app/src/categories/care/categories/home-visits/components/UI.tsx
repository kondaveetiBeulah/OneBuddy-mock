import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';

export const colors = {
  primary: '#5CB82A',
  primaryDark: '#449619',
  primaryLight: '#EBF7E5',
  primaryMuted: '#E2F4D9',
  green: '#5CB82A',
  darkGreen: '#449619',
  ink: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  soft: '#F8FAFC',
  white: '#FFFFFF',
};

/** Returns theme-aware colors. Use instead of `colors` for dark mode support. */
export function useColors() {
  const { scheme } = useAppTheme();
  const isDark = scheme === 'dark';
  return useMemo(() => ({
    ...colors,
    bg: isDark ? '#121214' : '#FAFCF8',
    surface: isDark ? '#1E2025' : colors.white,
    ink: isDark ? '#F1F5F9' : colors.ink,
    muted: isDark ? '#94A3B8' : colors.muted,
    border: isDark ? '#3A3F4B' : colors.border,
    soft: isDark ? '#2A2D35' : colors.soft,
    white: isDark ? '#1E2025' : colors.white,
    chipBg: isDark ? '#2A2D35' : '#F1F5F9',
    isDark,
  }), [isDark]);
}

export function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      {onBack && (
        <Pressable onPress={onBack} style={styles.back} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
      )}
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

export function BookingStepper({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  const steps = [
    { step: 1, label: 'Slot' },
    { step: 2, label: 'Details' },
    { step: 3, label: 'Payment' },
  ];

  return (
    <View style={styles.stepperContainer}>
      {steps.map((item, index) => {
        const isCompleted = item.step < currentStep;
        const isActive = item.step === currentStep;

        return (
          <View key={item.step} style={styles.stepWrapper}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isActive && styles.circleActive,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                ) : (
                  <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                    {item.step}
                  </Text>
                )}
              </View>
              <Text style={[styles.stepLabel, (isActive || isCompleted) && styles.stepLabelActive]}>
                {item.label}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View style={[styles.line, isCompleted && styles.lineCompleted]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#94A3B8" style={styles.input} {...props} />
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  header: { height: 46, flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  
  // Stepper Styles
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  circleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  circleCompleted: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.muted,
  },
  stepNumberActive: {
    color: colors.white,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stepLabelActive: {
    color: colors.ink,
    fontWeight: '800',
  },
  line: {
    width: 28,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  lineCompleted: {
    backgroundColor: colors.primary,
  },

  button: {
    backgroundColor: colors.primary,
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.45, backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  field: { marginBottom: 16 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.ink,
    fontSize: 15,
    backgroundColor: colors.white,
  },
  sectionTitle: { fontSize: 19.5, fontWeight: '800', color: colors.ink, marginBottom: 12 },
});
