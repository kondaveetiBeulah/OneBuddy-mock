import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, useOCColors } from '../constants/colors';

interface BookingStepperProps {
  currentStep: 1 | 2 | 3 | 4; // 1: Slot, 2: Patient Details, 3: Payment, 4: Confirmed
}

const STEPS = [
  { step: 1, label: 'Slot' },
  { step: 2, label: 'Details' },
  { step: 3, label: 'Payment' },
];

export const BookingStepper: React.FC<BookingStepperProps> = ({ currentStep }) => {
  const oc = useOCColors();

  return (
    <View style={[styles.container, { backgroundColor: oc.surface, borderColor: oc.borderSubtle }]}>
      {STEPS.map((item, index) => {
        const isCompleted = item.step < currentStep;
        const isActive = item.step === currentStep;

        return (
          <React.Fragment key={item.step}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.circle,
                  { backgroundColor: oc.isDark ? '#1F2937' : '#F3F4F6', borderColor: oc.isDark ? '#374151' : '#E5E7EB' },
                  isCompleted && styles.circleCompleted,
                  isActive && styles.circleActive,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      { color: oc.textMuted },
                      isActive && styles.stepNumberActive,
                    ]}
                  >
                    {item.step}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  { color: oc.textMuted },
                  (isActive || isCompleted) && { color: oc.textPrimary, fontWeight: '700' as const },
                ]}
              >
                {item.label}
              </Text>
            </View>

            {index < STEPS.length - 1 && (
              <View
                style={[
                  styles.connectorLine,
                  { backgroundColor: oc.isDark ? '#374151' : '#E5E7EB' },
                  item.step < currentStep && styles.connectorLineCompleted,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E6EFE4',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  circleActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  circleCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: Colors.primaryDark,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepLabelActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  connectorLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  connectorLineCompleted: {
    backgroundColor: Colors.primary,
  },
});
